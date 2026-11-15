import { DB_SCHEMA_VERSION } from './db'
import { couponFixtures } from './fixtures/coupons'
import { nftFixtures } from './fixtures/nfts'
import {
  cartFixtures,
  favoriteFixtures,
  orderFixtures,
  userFixtures,
  walletFixtures,
} from './fixtures/users'
import type { MockDb } from './db'
import type {
  FaultRule,
  LatencyPresetId,
  ScenarioId,
  ScenarioSummary,
} from '@/types/simulation'

interface Scenario extends ScenarioSummary {
  latency: LatencyPresetId
  faults: Array<FaultRule>
  realtimeAvailable: boolean
  /** Validade das sessões abertas no cenário; ausente usa o padrão de 2 h. */
  sessionTtlMs?: number
  /** Ajusta os dados iniciais; ausente usa as fixtures como estão. */
  prepare?: (db: MockDb) => void
}

/**
 * Cenários gerais de rede e dados. Os casos de cada recurso (cupom expirado,
 * pagamento recusado...) entram junto com os handlers dele.
 */
const SCENARIOS: Array<Scenario> = [
  {
    id: 'default',
    label: 'Padrão',
    description:
      'Fixtures completas, rede saudável com latência de 200–400 ms.',
    latency: 'default',
    faults: [],
    realtimeAvailable: true,
  },
  {
    id: 'empty',
    label: 'Catálogo vazio',
    description:
      'Nenhum NFT à venda; usuários e carteiras continuam disponíveis.',
    latency: 'default',
    faults: [],
    realtimeAvailable: true,
    prepare: (db) => {
      db.nfts = []
      db.favorites = Object.fromEntries(db.users.map((u) => [u.id, []]))
      db.carts = Object.fromEntries(db.users.map((u) => [u.id, []]))
    },
  },
  {
    id: 'offline',
    label: 'Sem conexão',
    description: 'Toda chamada à API falha por rede e o Socket.IO não conecta.',
    latency: 'none',
    faults: [{ id: 'offline', path: '*', effect: { kind: 'network-error' } }],
    realtimeAvailable: false,
  },
  {
    id: 'timeout',
    label: 'Timeout',
    description: 'A API nunca responde; vale o timeout do cliente HTTP.',
    latency: 'none',
    faults: [{ id: 'timeout', path: '*', effect: { kind: 'timeout' } }],
    realtimeAvailable: true,
  },
  {
    id: 'server-error',
    label: 'Erro no servidor (503)',
    description: 'Toda chamada à API responde 503.',
    latency: 'default',
    faults: [
      { id: 'server-error', path: '*', effect: { kind: 'http', status: 503 } },
    ],
    realtimeAvailable: true,
  },
  {
    id: 'flaky',
    label: 'Instável',
    description:
      'As 3 primeiras chamadas respondem 503 (a tentativa e as 2 repetições automáticas); depois a API se recupera.',
    latency: 'default',
    faults: [
      {
        id: 'flaky',
        path: '*',
        effect: { kind: 'http', status: 503 },
        times: 3,
      },
    ],
    realtimeAvailable: true,
  },
  {
    id: 'short-session',
    label: 'Sessão curta (1 min)',
    description:
      'Fixtures completas; a sessão expira 1 minuto após o login, para exercitar a expiração durante a navegação.',
    latency: 'default',
    faults: [],
    realtimeAvailable: true,
    sessionTtlMs: 60_000,
  },
  {
    id: 'favorite-error',
    label: 'Falha ao favoritar',
    description:
      'Fixtures completas; incluir ou remover favoritos responde 503, para exercitar o rollback da atualização otimista.',
    latency: 'default',
    faults: [
      {
        id: 'favorite-error-put',
        method: 'PUT',
        path: '/favorites/:nftId',
        effect: { kind: 'http', status: 503 },
      },
      {
        id: 'favorite-error-delete',
        method: 'DELETE',
        path: '/favorites/:nftId',
        effect: { kind: 'http', status: 503 },
      },
    ],
    realtimeAvailable: true,
  },
]

export const scenarioSummaries: Array<ScenarioSummary> = SCENARIOS.map(
  ({ id, label, description }) => ({ id, label, description }),
)

export function isScenarioId(value: unknown): value is ScenarioId {
  return SCENARIOS.some((s) => s.id === value)
}

export function getScenario(id: ScenarioId) {
  const scenario = SCENARIOS.find((s) => s.id === id)
  if (!scenario) throw new Error(`Cenário desconhecido: ${id}`)
  return scenario
}

/** Estado inicial do cenário, sempre uma cópia nova das fixtures. */
export function createScenarioDb(id: ScenarioId): MockDb {
  const db: MockDb = structuredClone({
    schemaVersion: DB_SCHEMA_VERSION,
    nfts: nftFixtures,
    users: userFixtures,
    sessions: [],
    wallets: walletFixtures,
    favorites: favoriteFixtures,
    carts: cartFixtures,
    orders: orderFixtures,
    coupons: couponFixtures,
    sequence: orderFixtures.length,
  })
  getScenario(id).prepare?.(db)
  return db
}
