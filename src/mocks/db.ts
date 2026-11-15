import { readJson, writeJson } from './storage'
import type { CouponRecord } from './fixtures/coupons'
import type { UserRecord } from './fixtures/users'
import type { KeyValueStorage } from './storage'
import type { Nft } from '@/types/nft'
import type { CartItem, Order } from '@/types/order'
import type { RealtimeResourceType } from '@/types/realtime'
import type { WalletConnection } from '@/types/checkout'
import type { Wallet } from '@/types/wallet'

/** Mudar o formato do estado exige subir este número: o salvo antigo é descartado. */
export const DB_SCHEMA_VERSION = 6

export interface CartRecord {
  items: Array<CartItem>
  couponCode: string | null
  version: number
}

export interface WalletConnectionRecord extends WalletConnection {
  userId: string
}

export interface SessionRecord {
  token: string
  userId: string
  createdAt: string
  expiresAt: string
}

/** Estado único dos mocks, lido e escrito pelos handlers REST e pelo Socket.IO. */
export interface MockDb {
  schemaVersion: number
  nfts: Array<Nft>
  users: Array<UserRecord>
  sessions: Array<SessionRecord>
  /** Por id de usuário. */
  wallets: Record<string, Array<Wallet>>
  /** Ids de NFT por id de usuário. */
  favorites: Record<string, Array<string>>
  /** Por dono do carrinho: id de usuário ou id de carrinho de visitante (`guest_*`). */
  carts: Record<string, CartRecord>
  orders: Array<Order>
  /** Impressão da requisição que criou cada pedido, por id: base da idempotência. */
  orderRequests: Record<string, string>
  walletConnections: Array<WalletConnectionRecord>
  /** Gatilhos de cenário de checkout já disparados (uma vez por reset). */
  checkoutTriggers: Array<string>
  coupons: Array<CouponRecord>
  /** Contador para ids gerados na simulação. */
  sequence: number
}

export type StoreChange =
  | { type: RealtimeResourceType; id: string; version: number }
  | { type: 'reset' }

interface Versioned {
  id: string
  version: number
  updatedAt: string
}

export interface StoreTransaction {
  /** Marca o recurso como alterado: sobe a versão e avisa os assinantes. */
  touch: (type: RealtimeResourceType, entity: Versioned) => void
}

type Listener = (changes: Array<StoreChange>) => void

interface MockStoreOptions {
  storage: KeyValueStorage
  key: string
  seed: () => MockDb
}

function isMockDb(value: unknown): value is MockDb {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as MockDb).schemaVersion === DB_SCHEMA_VERSION &&
    Array.isArray((value as MockDb).nfts)
  )
}

function newerVersions(
  type: RealtimeResourceType,
  before: Array<{ id: string; version: number }>,
  after: Array<{ id: string; version: number }>,
): Array<StoreChange> {
  const known = new Map(before.map((entity) => [entity.id, entity.version]))
  return after
    .filter((entity) => entity.version > (known.get(entity.id) ?? 0))
    .map(({ id, version }) => ({ type, id, version }))
}

export class MockStore {
  #state: MockDb
  readonly #storage: KeyValueStorage
  readonly #key: string
  readonly #listeners = new Set<Listener>()

  constructor({ storage, key, seed }: MockStoreOptions) {
    this.#storage = storage
    this.#key = key
    const saved = readJson(storage, key, isMockDb)
    this.#state = saved ?? structuredClone(seed())
    if (!saved) this.#persist()
  }

  /** Estado atual. Alterações passam por `write`, para persistir e notificar. */
  get state(): MockDb {
    return this.#state
  }

  write<T>(recipe: (db: MockDb, tx: StoreTransaction) => T): T {
    const changes = new Map<string, StoreChange>()
    const result = recipe(this.#state, {
      touch: (type, entity) => {
        entity.version += 1
        entity.updatedAt = new Date().toISOString()
        changes.set(`${type}:${entity.id}`, {
          type,
          id: entity.id,
          version: entity.version,
        })
      },
    })
    this.#persist()
    if (changes.size > 0) this.#notify([...changes.values()])
    return result
  }

  /**
   * Adota o estado que outra aba gravou: o "servidor" simulado é um só para
   * todas as abas. NFTs e pedidos com versão nova são notificados, para os
   * eventos também chegarem às conexões desta aba.
   */
  reload() {
    const saved = readJson(this.#storage, this.#key, isMockDb)
    if (!saved) return
    const previous = this.#state
    this.#state = saved
    const changes = [
      ...newerVersions('nft', previous.nfts, saved.nfts),
      ...newerVersions('order', previous.orders, saved.orders),
    ]
    if (changes.length > 0) this.#notify(changes)
  }

  /** Substitui todo o estado (reset ou troca de cenário). */
  replace(db: MockDb) {
    this.#state = structuredClone(db)
    this.#persist()
    this.#notify([{ type: 'reset' }])
  }

  nextId(prefix: string) {
    this.#state.sequence += 1
    this.#persist()
    return `${prefix}_${String(this.#state.sequence).padStart(4, '0')}`
  }

  subscribe(listener: Listener) {
    this.#listeners.add(listener)
    return () => void this.#listeners.delete(listener)
  }

  #persist() {
    writeJson(this.#storage, this.#key, this.#state)
  }

  #notify(changes: Array<StoreChange>) {
    for (const listener of this.#listeners) listener(changes)
  }
}
