import type { Order, OrderStatus } from '@/types/order'
import type { OrderUpdatedData, RealtimeEnvelope } from '@/types/realtime'

type OrderUpdatedEvent = RealtimeEnvelope<OrderUpdatedData>

const STATUSES: ReadonlyArray<OrderStatus> = ['pending', 'confirmed', 'refused']

export function isTerminalOrder(status: OrderStatus) {
  return status !== 'pending'
}

/** O payload chega pela rede: só o que segue o contrato entra no cache. */
export function isOrderUpdatedEvent(
  value: unknown,
): value is OrderUpdatedEvent {
  if (typeof value !== 'object' || value === null) return false
  const event = value as {
    eventId?: unknown
    resource?: { type?: unknown; id?: unknown } | null
    version?: unknown
    data?: {
      status?: unknown
      transactionHash?: unknown
      refusalReason?: unknown
      updatedAt?: unknown
    } | null
  }
  const data = event.data
  return (
    typeof event.eventId === 'string' &&
    event.resource?.type === 'order' &&
    typeof event.resource.id === 'string' &&
    Number.isInteger(event.version) &&
    STATUSES.includes(data?.status as OrderStatus) &&
    (data?.transactionHash === null ||
      typeof data?.transactionHash === 'string') &&
    (data.refusalReason === null || typeof data.refusalReason === 'string') &&
    typeof data.updatedAt === 'string'
  )
}

/**
 * Pedido com o estado do evento. Devolve o mesmo objeto quando o evento não é
 * mais novo ou quando o pedido já terminou: confirmado e recusado não mudam.
 */
export function applyOrderUpdate(
  order: Order,
  event: OrderUpdatedEvent,
): Order {
  if (event.version <= order.version || isTerminalOrder(order.status)) {
    return order
  }
  return {
    ...order,
    status: event.data.status,
    transactionHash: event.data.transactionHash,
    refusalReason: event.data.refusalReason,
    updatedAt: event.data.updatedAt,
    version: event.version,
  }
}

/** `0xA91F…E82C`, como no recibo do Figma. */
export function shortenHash(hash: string) {
  const digits = hash.replace(/^0x/i, '').toUpperCase()
  return `0x${digits.slice(0, 4)}…${digits.slice(-4)}`
}

const MONTHS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

/** `29 Jul, 2026`: o formato do recibo no Figma, com os meses em português. */
export function formatOrderDate(iso: string) {
  const date = new Date(iso)
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`
}
