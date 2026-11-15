import type { MockDb, StoreTransaction } from './db'
import type { Order } from '@/types/order'
import type { OrderOutcome } from '@/types/simulation'
import type { OrderUpdatedData, RealtimeEnvelope } from '@/types/realtime'

export const DEFAULT_REFUSAL_REASON =
  'A carteira recusou o pagamento: saldo insuficiente na rede escolhida.'

/** FNV-1a de 32 bits: basta para um hash simulado estável. */
function fnv1a(input: string) {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash
}

/**
 * Hash de transação simulado, derivado do pedido: o mesmo pedido sempre gera
 * o mesmo hash, e nenhum vem de uma rede real.
 */
export function simulatedTransactionHash(
  order: Pick<Order, 'id' | 'idempotencyKey'>,
) {
  let hex = ''
  for (let i = 0; hex.length < 64; i++) {
    hex += fnv1a(`${order.id}:${order.idempotencyKey}:${i}`)
      .toString(16)
      .padStart(8, '0')
  }
  return `0x${hex.slice(0, 64)}`
}

/**
 * Leva um pedido pendente ao estado final. Confirmar tira do carrinho só os
 * itens e quantidades comprados e baixa o estoque das edições; recusar não
 * mexe em mais nada. Pedido que já terminou não muda (devolve `null`).
 */
export function settleOrder(
  db: MockDb,
  tx: StoreTransaction,
  orderId: string,
  outcome: OrderOutcome,
  reason: string = DEFAULT_REFUSAL_REASON,
): Order | null {
  const order = db.orders.find((o) => o.id === orderId)
  if (!order || order.status !== 'pending') return null

  if (outcome === 'refused') {
    order.status = 'refused'
    order.refusalReason = reason
    tx.touch('order', order)
    return structuredClone(order)
  }

  order.status = 'confirmed'
  order.transactionHash = simulatedTransactionHash(order)

  const cart = order.userId in db.carts ? db.carts[order.userId] : undefined
  if (cart) {
    let changed = false
    for (const item of order.items) {
      const line = cart.items.find(
        (l) => l.nftId === item.nftId && l.editionId === item.editionId,
      )
      if (!line) continue
      line.quantity -= item.quantity
      changed = true
    }
    if (changed) {
      cart.items = cart.items.filter((l) => l.quantity > 0)
      // O cupom foi usado nesta compra.
      if (order.couponCode !== null && cart.couponCode === order.couponCode) {
        cart.couponCode = null
      }
      cart.version += 1
    }
  }

  const touched = new Set<string>()
  for (const item of order.items) {
    const nft = db.nfts.find((n) => n.id === item.nftId)
    const edition = nft?.editions.find((e) => e.id === item.editionId)
    if (!nft || !edition) continue
    edition.available = Math.max(0, edition.available - item.quantity)
    touched.add(nft.id)
  }
  for (const nft of db.nfts) if (touched.has(nft.id)) tx.touch('nft', nft)

  tx.touch('order', order)
  return structuredClone(order)
}

/** O id deriva da versão: reemitir a mesma mudança gera uma duplicata reconhecível. */
export function orderUpdatedEnvelope(
  order: Order,
  epoch: string,
): RealtimeEnvelope<OrderUpdatedData> {
  return {
    eventId: `evt_order_${order.id}_v${order.version}_${epoch}`,
    resource: { type: 'order', id: order.id },
    version: order.version,
    emittedAt: new Date().toISOString(),
    data: {
      status: order.status,
      transactionHash: order.transactionHash,
      refusalReason: order.refusalReason,
      updatedAt: order.updatedAt,
    },
  }
}
