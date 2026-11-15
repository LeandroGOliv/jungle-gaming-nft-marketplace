import type { ApiErrorReason, ApiErrorStatus } from './api'
import type { Nft } from './nft'
import type { RealtimeEventName } from './realtime'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type LatencyProfile =
  | { kind: 'none' }
  | { kind: 'fixed'; ms: number }
  /** Sorteio uniforme entre os limites, com semente: a sequência se repete. */
  | { kind: 'range'; minMs: number; maxMs: number }
  /**
   * Alterna lenta/rápida a cada requisição ao mesmo endpoint (método +
   * caminho, sem query): a resposta de uma consulta antiga chega depois da
   * mais nova.
   */
  | { kind: 'out-of-order'; slowMs: number; fastMs: number }

export type LatencyPresetId =
  'none' | 'default' | 'slow' | 'variable' | 'out-of-order'

export type FaultEffect =
  | { kind: 'http'; status: ApiErrorStatus; reason?: ApiErrorReason }
  /** Falha de rede: o Axios recebe erro sem resposta. */
  | { kind: 'network-error' }
  /** A resposta nunca chega; vale o timeout do cliente. */
  | { kind: 'timeout' }

export interface FaultRule {
  id: string
  /** Ausente: qualquer método. */
  method?: HttpMethod
  /** Padrão de caminho do MSW relativo à base da API (`/nfts/:id`), ou `*`. */
  path: string
  effect: FaultEffect
  /** Deixa passar as N primeiras requisições que casam com a regra. */
  skip?: number
  /** Aplica a falha só N vezes; ausente: sempre. */
  times?: number
}

export type ScenarioId =
  | 'default'
  | 'empty'
  | 'offline'
  | 'timeout'
  | 'server-error'
  | 'flaky'
  | 'short-session'

export interface ScenarioSummary {
  id: ScenarioId
  label: string
  description: string
}

export interface LatencyPreset {
  id: LatencyPresetId
  label: string
  profile: LatencyProfile
}

export interface SimulationSettings {
  scenarioId: ScenarioId
  latency: LatencyProfile
  faults: Array<FaultRule>
  /** `false` derruba as conexões Socket.IO abertas e recusa novas. */
  realtimeAvailable: boolean
  seed: number
}

export interface SimulationState extends SimulationSettings {
  scenarios: Array<ScenarioSummary>
  latencyPresets: Array<LatencyPreset>
  /** Momento do último reset; muda a cada reset ou troca de cenário. */
  resetAt: string
  counts: { nfts: number; users: number; orders: number }
  realtimeConnections: number
  /** Dono de cada conexão Socket.IO aberta, resolvido no handshake; `null` é visitante. */
  realtimeUsers: Array<string | null>
  /** Validade das sessões criadas no cenário atual. */
  sessionTtlMs: number
}

/** Corpo de `PATCH /__simulation`: só os campos enviados mudam, sem reset. */
export interface SimulationUpdate {
  latency?: LatencyProfile
  faults?: Array<FaultRule>
  realtimeAvailable?: boolean
}

/** Corpo de `POST /__simulation/reset`. */
export interface SimulationResetRequest {
  /** Ausente: restaura o cenário atual. */
  scenarioId?: ScenarioId
  latency?: LatencyPresetId
}

export interface HealthStatus {
  status: 'ok'
  checkedAt: string
}

export interface NftPatch {
  priceEth?: Nft['priceEth']
  /** Disponibilidade por edição, pelo id da edição. */
  available?: Record<string, number>
}

/**
 * Controle exposto em `window.__mocks` no build com mocks, para os testes
 * Playwright e para uso pelo console. A página `/simulacao` usa a mesma
 * lógica pela API.
 */
export interface MockControlApi {
  getState: () => SimulationState
  /** Troca de cenário restaura os dados iniciais dele. */
  selectScenario: (id: ScenarioId, latency?: LatencyPresetId) => void
  reset: () => void
  setLatency: (latency: LatencyPresetId | LatencyProfile) => void
  setFaults: (faults: Array<FaultRule>) => void
  addFault: (fault: FaultRule) => void
  setRealtimeAvailable: (available: boolean) => void
  /** Altera o NFT no store: a REST passa a refletir e `nft.updated` é emitido. */
  updateNft: (id: string, patch: NftPatch) => void
  /** Emite um evento cru, para duplicatas e eventos antigos. */
  emit: (event: RealtimeEventName, payload: unknown) => void
  /** Vence todas as sessões abertas: a próxima chamada autenticada recebe 401. */
  expireSessions: () => void
}

declare global {
  interface Window {
    __mocks?: MockControlApi
  }
}
