import { describe, expect, it } from 'vitest'
import {
  orderUpdatedEnvelope,
  settleOrder,
  simulatedTransactionHash,
} from './orders'
import { createScenarioDb } from './scenarios'
import type { MockDb, StoreTransaction } from './db'
import type { Order } from '@/types/order'

function recordingTx() {
  const touched: Array<string> = []
  const tx: StoreTransaction = {
    touch: (type, entity) => {
      entity.version += 1
      entity.updatedAt = '2026-11-15T12:00:05.000Z'
      touched.push(`${type}:${entity.id}`)
    },
  }
  return { tx, touched }
}

/** Pedido pendente da Nova com 1 unidade de cada linha do carrinho do cenário. */
function withPendingOrder(db: MockDb): Order {
  const base = structuredClone(db.orders[0])
  const order: Order = {
    ...base,
    id: 'ord_9001',
    idempotencyKey: 'key-1',
    status: 'pending',
    transactionHash: null,
    refusalReason: null,
    couponCode: 'KURIO10',
    version: 1,
    items: [
      {
        ...base.items[0],
        nftId: 'emerald-ape-042',
        editionId: 'ed-50',
        quantity: 1,
      },
      {
        ...base.items[0],
        nftId: 'violet-nomad-314',
        editionId: 'ed-10',
        quantity: 1,
      },
    ],
  }
  db.orders.push(order)
  return order
}

describe('settleOrder', () => {
  it('confirma: hash simulado, baixa só o comprado do carrinho e do estoque', () => {
    const db = createScenarioDb('checkout')
    const order = withPendingOrder(db)
    const stock = db.nfts
      .find((n) => n.id === 'emerald-ape-042')!
      .editions.find((e) => e.id === 'ed-50')!.available
    const { tx, touched } = recordingTx()

    const result = settleOrder(db, tx, order.id, 'confirmed')

    expect(result?.status).toBe('confirmed')
    expect(result?.transactionHash).toMatch(/^0x[0-9a-f]{64}$/)
    expect(result?.version).toBe(2)
    // Emerald tinha 2 no carrinho: sobra 1. Violet tinha 1: sai.
    expect(db.carts.usr_nova.items).toEqual([
      { nftId: 'emerald-ape-042', editionId: 'ed-50', quantity: 1 },
    ])
    expect(db.carts.usr_nova.couponCode).toBeNull()
    expect(db.carts.usr_nova.version).toBe(2)
    expect(
      db.nfts
        .find((n) => n.id === 'emerald-ape-042')!
        .editions.find((e) => e.id === 'ed-50')!.available,
    ).toBe(stock - 1)
    expect(touched).toContain('order:ord_9001')
    expect(touched).toContain('nft:emerald-ape-042')
  })

  it('recusa sem mexer em carrinho nem estoque', () => {
    const db = createScenarioDb('checkout')
    const order = withPendingOrder(db)
    const before = structuredClone({ carts: db.carts, nfts: db.nfts })
    const { tx, touched } = recordingTx()

    const result = settleOrder(db, tx, order.id, 'refused', 'Sem saldo.')

    expect(result?.status).toBe('refused')
    expect(result?.refusalReason).toBe('Sem saldo.')
    expect(result?.transactionHash).toBeNull()
    expect({ carts: db.carts, nfts: db.nfts }).toEqual(before)
    expect(touched).toEqual(['order:ord_9001'])
  })

  it('pedido terminal não regride nem muda de desfecho', () => {
    const db = createScenarioDb('checkout')
    const order = withPendingOrder(db)
    const { tx } = recordingTx()
    settleOrder(db, tx, order.id, 'confirmed')

    expect(settleOrder(db, tx, order.id, 'refused')).toBeNull()
    expect(settleOrder(db, tx, order.id, 'confirmed')).toBeNull()
    expect(db.orders.find((o) => o.id === order.id)?.status).toBe('confirmed')
  })

  it('ignora pedido inexistente', () => {
    const db = createScenarioDb('checkout')
    expect(settleOrder(db, recordingTx().tx, 'ord_x', 'confirmed')).toBeNull()
  })
})

describe('simulatedTransactionHash', () => {
  it('é estável por pedido e diferente entre pedidos', () => {
    const a = simulatedTransactionHash({ id: 'ord_1', idempotencyKey: 'k' })
    expect(simulatedTransactionHash({ id: 'ord_1', idempotencyKey: 'k' })).toBe(
      a,
    )
    expect(
      simulatedTransactionHash({ id: 'ord_2', idempotencyKey: 'k' }),
    ).not.toBe(a)
  })
})

describe('orderUpdatedEnvelope', () => {
  it('deriva o id do evento da versão e da época', () => {
    const db = createScenarioDb('checkout')
    const order = db.orders[0]
    const envelope = orderUpdatedEnvelope(order, 'e1')
    expect(envelope.eventId).toBe(`evt_order_${order.id}_v${order.version}_e1`)
    expect(envelope.resource).toEqual({ type: 'order', id: order.id })
    expect(envelope.data.status).toBe(order.status)
  })
})
