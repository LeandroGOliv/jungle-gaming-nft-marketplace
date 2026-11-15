import { MockStore } from './db'
import {
  LATENCY_PRESETS,
  createDelayResolver,
  createNetworkHandler,
  resolveLatency,
} from './network'
import { bridgeStoreToRealtime, createRealtimeHub } from './realtime'
import {
  createScenarioDb,
  getScenario,
  isScenarioId,
  scenarioSummaries,
} from './scenarios'
import { DEFAULT_SESSION_TTL_MS, lookupSession } from './sessions'
import { STORAGE_PREFIX, readJson, writeJson } from './storage'
import type { KeyValueStorage } from './storage'
import type {
  FaultRule,
  LatencyPresetId,
  MockControlApi,
  NftPatch,
  ScenarioId,
  SimulationSettings,
  SimulationState,
  SimulationUpdate,
} from '@/types/simulation'

const DB_KEY = `${STORAGE_PREFIX}:db`
const SETTINGS_KEY = `${STORAGE_PREFIX}:settings`
const SETTINGS_VERSION = 1
const DEFAULT_SEED = 20_260_729
const ETH_AMOUNT = /^\d+(\.\d{1,18})?$/

export const CONTROL_PATH = '/__simulation'

interface PersistedSettings {
  version: number
  settings: SimulationSettings
  /** Requisições vistas por regra de falha, para `skip`/`times` sobreviverem ao refresh. */
  faultHits: Record<string, number>
  resetAt: string
}

function isPersistedSettings(value: unknown): value is PersistedSettings {
  const candidate = value as PersistedSettings | null
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    candidate.version === SETTINGS_VERSION &&
    isScenarioId(candidate.settings.scenarioId)
  )
}

function scenarioSettings(
  id: ScenarioId,
  latency?: LatencyPresetId,
): SimulationSettings {
  const scenario = getScenario(id)
  return {
    scenarioId: id,
    latency: resolveLatency(latency ?? scenario.latency),
    faults: structuredClone(scenario.faults),
    realtimeAvailable: scenario.realtimeAvailable,
    seed: DEFAULT_SEED,
  }
}

export class SimulationError extends Error {}

export interface MockRuntimeOptions {
  storage: KeyValueStorage
  apiUrl: string
  socketPath: string
}

export function createMockRuntime({
  storage,
  apiUrl,
  socketPath,
}: MockRuntimeOptions) {
  let persisted: PersistedSettings = readJson(
    storage,
    SETTINGS_KEY,
    isPersistedSettings,
  ) ?? {
    version: SETTINGS_VERSION,
    settings: scenarioSettings('default'),
    faultHits: {},
    resetAt: new Date().toISOString(),
  }
  const saveSettings = () => writeJson(storage, SETTINGS_KEY, persisted)
  saveSettings()

  const store = new MockStore({
    storage,
    key: DB_KEY,
    seed: () => createScenarioDb(persisted.settings.scenarioId),
  })
  let resolveDelay = createDelayResolver(persisted.settings.seed)

  const hub = createRealtimeHub({
    path: socketPath,
    isAvailable: () => persisted.settings.realtimeAvailable,
    resolveUser: (auth) => {
      const token = typeof auth?.token === 'string' ? auth.token : null
      const lookup = lookupSession(store.state, token, Date.now())
      return lookup.ok ? lookup.user.id : null
    },
  })
  bridgeStoreToRealtime(store, hub)

  function applySettings(settings: SimulationSettings) {
    persisted = {
      version: SETTINGS_VERSION,
      settings,
      faultHits: {},
      resetAt: new Date().toISOString(),
    }
    saveSettings()
    resolveDelay = createDelayResolver(settings.seed)
    hub.setAvailable(settings.realtimeAvailable)
    store.replace(createScenarioDb(settings.scenarioId))
  }

  function update(changes: SimulationUpdate) {
    const settings = { ...persisted.settings }
    if (changes.latency) settings.latency = changes.latency
    if (changes.faults) {
      settings.faults = changes.faults
      persisted.faultHits = {}
    }
    if (changes.realtimeAvailable !== undefined) {
      settings.realtimeAvailable = changes.realtimeAvailable
      hub.setAvailable(changes.realtimeAvailable)
    }
    persisted.settings = settings
    saveSettings()
  }

  function updateNft(id: string, patch: NftPatch) {
    if (patch.priceEth !== undefined && !ETH_AMOUNT.test(patch.priceEth)) {
      throw new SimulationError(`Preço inválido: ${patch.priceEth}`)
    }
    const target = store.state.nfts.find((n) => n.id === id)
    if (!target) throw new SimulationError(`NFT inexistente: ${id}`)
    const available = Object.entries(patch.available ?? {})
    for (const [editionId] of available) {
      if (!target.editions.some((e) => e.id === editionId)) {
        throw new SimulationError(`Edição inexistente: ${id}/${editionId}`)
      }
    }

    store.write((db, tx) => {
      const nft = db.nfts.find((n) => n.id === id)!
      if (patch.priceEth !== undefined) nft.priceEth = patch.priceEth
      for (const [editionId, units] of available) {
        const edition = nft.editions.find((e) => e.id === editionId)!
        edition.available = Math.max(
          0,
          Math.min(edition.supply, Math.trunc(units)),
        )
      }
      tx.touch('nft', nft)
    })
  }

  const sessionTtlMs = () =>
    getScenario(persisted.settings.scenarioId).sessionTtlMs ??
    DEFAULT_SESSION_TTL_MS

  function expireSessions() {
    const now = new Date().toISOString()
    store.write((db) => {
      for (const session of db.sessions) session.expiresAt = now
    })
  }

  function getState(): SimulationState {
    return {
      ...structuredClone(persisted.settings),
      scenarios: scenarioSummaries,
      latencyPresets: LATENCY_PRESETS,
      resetAt: persisted.resetAt,
      counts: {
        nfts: store.state.nfts.length,
        users: store.state.users.length,
        orders: store.state.orders.length,
      },
      realtimeConnections: hub.connectionCount(),
      realtimeUsers: hub.connectionUsers(),
      sessionTtlMs: sessionTtlMs(),
    }
  }

  const control: MockControlApi = {
    getState,
    selectScenario: (id, latency) => {
      if (!isScenarioId(id))
        throw new SimulationError(`Cenário desconhecido: ${id}`)
      applySettings(scenarioSettings(id, latency))
    },
    // A latência é condição de rede, não dado do cenário: o reset a preserva.
    reset: () =>
      applySettings({
        ...scenarioSettings(persisted.settings.scenarioId),
        latency: persisted.settings.latency,
      }),
    setLatency: (latency) => update({ latency: resolveLatency(latency) }),
    setFaults: (faults) => update({ faults }),
    addFault: (fault: FaultRule) =>
      update({ faults: [...persisted.settings.faults, fault] }),
    setRealtimeAvailable: (available) =>
      update({ realtimeAvailable: available }),
    updateNft,
    emit: (event, payload) => hub.broadcast(event, payload),
    expireSessions,
  }

  const networkHandler = createNetworkHandler({
    apiUrl,
    controlPath: CONTROL_PATH,
    latency: () => persisted.settings.latency,
    faults: () => persisted.settings.faults,
    faultHits: () => persisted.faultHits,
    resolveDelay: (profile, endpoint) => resolveDelay(profile, endpoint),
    onFaultsCounted: saveSettings,
  })

  return {
    store,
    control,
    update,
    sessionTtlMs,
    networkHandler,
    realtimeHandler: hub.handler,
  }
}

export type MockRuntime = ReturnType<typeof createMockRuntime>
