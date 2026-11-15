import { emptyCart } from './cart'
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

/**
 * Comportamento do checkout no cenário. `onOrderAttempt` altera o catálogo (ou
 * o cupom) na primeira tentativa de pedido, antes da validação: a mudança
 * acontece "durante a compra" e sai também pelo Socket.IO.
 */
export interface CheckoutScenario {
  onOrderAttempt?: 'price-change' | 'sold-out' | 'coupon-expired'
  /** `refuse-first`: a primeira conexão é recusada; `disconnect`: a carteira cai após conectar. */
  connection?: 'refuse-first' | 'disconnect'
  order?: OrderScenario
}

/**
 * Ciclo de vida do pedido no cenário. Sem ele, o pedido pendente é confirmado
 * alguns segundos depois de criado.
 */
export interface OrderScenario {
  /** `manual`: fica pendente até o painel ou o teste decidir. */
  settle?: 'confirm' | 'refuse' | 'manual'
  /** O primeiro `POST /orders` cria o pedido mas a resposta nunca chega. */
  timeoutAfterCreate?: boolean
  /** O Socket.IO cai enquanto o pedido está pendente e o desfecho sai sem ninguém ouvindo. */
  disconnectWhilePending?: boolean
}

interface Scenario extends ScenarioSummary {
  latency: LatencyPresetId
  faults: Array<FaultRule>
  realtimeAvailable: boolean
  /** Validade das sessões abertas no cenário; ausente usa o padrão de 2 h. */
  sessionTtlMs?: number
  /** Ajusta os dados iniciais; ausente usa as fixtures como estão. */
  prepare?: (db: MockDb) => void
  checkout?: CheckoutScenario
}

/** Carrinho da Nova pronto para o pagamento: dois NFTs e o cupom KURIO10. */
function prepareCheckoutCart(db: MockDb) {
  db.carts.usr_nova = {
    items: [
      { nftId: 'emerald-ape-042', editionId: 'ed-50', quantity: 2 },
      { nftId: 'violet-nomad-314', editionId: 'ed-10', quantity: 1 },
    ],
    couponCode: 'KURIO10',
    version: 1,
  }
}

const checkoutScenario = (
  id: ScenarioId,
  label: string,
  description: string,
  checkout?: CheckoutScenario,
): Scenario => ({
  id,
  label,
  description,
  latency: 'default',
  faults: [],
  realtimeAvailable: true,
  prepare: prepareCheckoutCart,
  checkout,
})

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
      db.carts = Object.fromEntries(db.users.map((u) => [u.id, emptyCart()]))
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
  {
    id: 'wallet-error',
    label: 'Falha ao salvar carteira',
    description:
      'Fixtures completas; o primeiro cadastro ou edição de carteira responde 503 e o seguinte funciona, para exercitar a nova tentativa.',
    latency: 'default',
    faults: [
      {
        id: 'wallet-error-post',
        method: 'POST',
        path: '/wallets',
        effect: { kind: 'http', status: 503 },
        times: 1,
      },
      {
        id: 'wallet-error-put',
        method: 'PUT',
        path: '/wallets/:walletId',
        effect: { kind: 'http', status: 503 },
        times: 1,
      },
    ],
    realtimeAvailable: true,
  },
  checkoutScenario(
    'checkout',
    'Checkout pronto',
    'O carrinho da Nova já tem dois NFTs e o cupom KURIO10, para ir direto ao pagamento.',
  ),
  checkoutScenario(
    'checkout-price-change',
    'Preço muda durante a compra',
    'Carrinho do checkout; na primeira confirmação o preço de um item sobe e o pedido pede nova revisão.',
    { onOrderAttempt: 'price-change' },
  ),
  checkoutScenario(
    'checkout-sold-out',
    'Edição esgota durante a compra',
    'Carrinho do checkout; na primeira confirmação uma edição do pedido esgota.',
    { onOrderAttempt: 'sold-out' },
  ),
  checkoutScenario(
    'checkout-coupon-expired',
    'Cupom expira durante a compra',
    'Carrinho do checkout; na primeira confirmação o cupom KURIO10 expira e o total muda.',
    { onOrderAttempt: 'coupon-expired' },
  ),
  checkoutScenario(
    'wallet-refused',
    'Carteira recusa a conexão',
    'Carrinho do checkout; a primeira conexão de carteira é recusada e a seguinte é aceita.',
    { connection: 'refuse-first' },
  ),
  checkoutScenario(
    'wallet-disconnect',
    'Carteira desconecta',
    'Carrinho do checkout; a carteira se desconecta 3 s depois de conectar (evento wallet.disconnected).',
    { connection: 'disconnect' },
  ),
  checkoutScenario(
    'order-refused',
    'Pagamento recusado',
    'Carrinho do checkout; o pedido é criado e a simulação recusa o pagamento (order.updated). O carrinho é preservado.',
    { order: { settle: 'refuse' } },
  ),
  checkoutScenario(
    'order-timeout',
    'Timeout após criar o pedido',
    'Carrinho do checkout; o primeiro envio cria o pedido, mas a resposta não chega e vale o timeout do cliente. A nova tentativa recupera o mesmo pedido.',
    { order: { timeoutAfterCreate: true } },
  ),
  checkoutScenario(
    'order-pending',
    'Pedido fica pendente',
    'Carrinho do checkout; o pedido não é decidido sozinho. Confirme ou recuse pelo painel de simulação.',
    { order: { settle: 'manual' } },
  ),
  checkoutScenario(
    'order-disconnect',
    'Desconexão com pedido pendente',
    'Carrinho do checkout; o Socket.IO cai logo após o pedido ser criado, a confirmação sai durante a queda e a conexão volta alguns segundos depois.',
    { order: { disconnectWhilePending: true } },
  ),
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
    orderRequests: {},
    walletConnections: [],
    checkoutTriggers: [],
    coupons: couponFixtures,
    sequence: orderFixtures.length,
  })
  getScenario(id).prepare?.(db)
  return db
}
