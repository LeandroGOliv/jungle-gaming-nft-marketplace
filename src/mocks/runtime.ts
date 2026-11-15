import { MockStore } from './db'
import {
  LATENCY_PRESETS,
  createDelayResolver,
  createNetworkHandler,
  resolveLatency,
} from './network'
import { settleOrder } from './orders'
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
import type { WalletConnectionRecord } from './db'
import type { Order } from '@/types/order'
import type { RealtimeEnvelope, WalletDisconnectedData } from '@/types/realtime'
import type {
  FaultRule,
  LatencyPresetId,
  MockControlApi,
  NftPatch,
  OrderOutcome,
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

  // Queda temporária do cenário de desconexão: só em memória, para um refresh
  // no meio dela não deixar o tempo real desligado para sempre.
  let outageUntil = 0
  const hub = createRealtimeHub({
    path: socketPath,
    isAvailable: () =>
      persisted.settings.realtimeAvailable && Date.now() >= outageUntil,
    resolveUser: (auth) => {
      const token = typeof auth?.token === 'string' ? auth.token : null
      const lookup = lookupSession(store.state, token, Date.now())
      return lookup.ok ? lookup.user.id : null
    },
  })
  bridgeStoreToRealtime(store, hub, () =>
    Date.parse(persisted.resetAt).toString(36),
  )

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
    clearOrderTimers()
    outageUntil = 0
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

  const epoch = () => Date.parse(persisted.resetAt).toString(36)

  /** Encerra a conexão e avisa só as sessões do dono pelo Socket.IO. */
  function disconnectWallet(id: string, reason: string) {
    const record = store.state.walletConnections.find((c) => c.id === id)
    if (!record || record.status !== 'connected') return
    const updated = store.write((db, tx) => {
      const connection = db.walletConnections.find((c) => c.id === id)!
      connection.status = 'disconnected'
      tx.touch('wallet-connection', connection)
      return { ...connection }
    })
    const envelope: RealtimeEnvelope<WalletDisconnectedData> = {
      eventId: `evt_wallet_${updated.id}_v${updated.version}_${epoch()}`,
      resource: { type: 'wallet-connection', id: updated.id },
      version: updated.version,
      emittedAt: new Date().toISOString(),
      data: { reason },
    }
    hub.sendToUser(updated.userId, 'wallet.disconnected', envelope)
  }

  function disconnectWallets() {
    for (const connection of store.state.walletConnections) {
      disconnectWallet(connection.id, 'A carteira encerrou a conexão.')
    }
  }

  const DISCONNECT_AFTER_MS = 3_000
  const ORDER_SETTLE_MS = 2_500
  const ORDER_OUTAGE_START_MS = 1_000
  const ORDER_OUTAGE_MS = 5_000

  /** Chamado após cada conexão criada: aplica o comportamento do cenário. */
  function onWalletConnected(connection: WalletConnectionRecord) {
    if (checkoutScenario()?.connection !== 'disconnect') return
    setTimeout(
      () =>
        disconnectWallet(
          connection.id,
          'A carteira foi desconectada no provedor.',
        ),
      DISCONNECT_AFTER_MS,
    )
  }

  const orderTimers = new Set<ReturnType<typeof setTimeout>>()

  function later(ms: number, run: () => void) {
    const timer = setTimeout(() => {
      orderTimers.delete(timer)
      run()
    }, ms)
    orderTimers.add(timer)
  }

  function clearOrderTimers() {
    for (const timer of orderTimers) clearTimeout(timer)
    orderTimers.clear()
  }

  function settle(id: string, outcome: OrderOutcome) {
    const order = store.state.orders.find((o) => o.id === id)
    if (!order) throw new SimulationError(`Pedido inexistente: ${id}`)
    if (order.status !== 'pending') {
      throw new SimulationError(`O pedido ${id} já terminou (${order.status}).`)
    }
    store.write((db, tx) => settleOrder(db, tx, id, outcome))
  }

  /**
   * Desfecho automático do pedido pendente, contado a partir da criação: um
   * refresh no meio (que reinicia o worker) reagenda pelo tempo que falta.
   */
  function scheduleSettlement(order: Order) {
    const behaviour = checkoutScenario()?.order
    const mode = behaviour?.settle ?? 'confirm'
    if (mode === 'manual') return
    const outcome: OrderOutcome = mode === 'refuse' ? 'refused' : 'confirmed'
    const elapsed = Date.now() - Date.parse(order.createdAt)
    const remaining = Math.max(0, ORDER_SETTLE_MS - elapsed)

    if (behaviour?.disconnectWhilePending && elapsed < ORDER_OUTAGE_START_MS) {
      later(ORDER_OUTAGE_START_MS - elapsed, () => {
        outageUntil = Date.now() + ORDER_OUTAGE_MS
        hub.setAvailable(false)
      })
    }
    later(remaining, () => {
      if (
        store.state.orders.find((o) => o.id === order.id)?.status === 'pending'
      ) {
        settle(order.id, outcome)
      }
    })
  }

  const checkoutScenario = () =>
    getScenario(persisted.settings.scenarioId).checkout

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
      pendingOrders: store.state.orders
        .filter((o) => o.status === 'pending')
        .map(({ id, userId, totalEth, createdAt }) => ({
          id,
          userId,
          totalEth,
          createdAt,
        })),
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
    disconnectWallets,
    settleOrder: settle,
  }

  // O worker reinicia a cada refresh: pedidos pendentes retomam o desfecho.
  for (const order of store.state.orders) {
    if (order.status === 'pending') scheduleSettlement(order)
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
    checkoutScenario,
    onWalletConnected,
    scheduleSettlement,
    updateNft,
    networkHandler,
    realtimeHandler: hub.handler,
  }
}

export type MockRuntime = ReturnType<typeof createMockRuntime>
