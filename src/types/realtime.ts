import type { EthAmount } from './nft'
import type { OrderStatus } from './order'

export type RealtimeResourceType = 'nft' | 'order' | 'wallet-connection'

/**
 * Envelope comum a todos os eventos de tempo real. `eventId` identifica a
 * emissão (duplicatas repetem o mesmo id) e `version` é a do recurso após a
 * mudança, para o cliente descartar o que não for mais novo.
 */
export interface RealtimeEnvelope<TData> {
  eventId: string
  resource: { type: RealtimeResourceType; id: string }
  version: number
  emittedAt: string
  data: TData
}

export interface NftUpdatedData {
  priceEth: EthAmount
  editions: Array<{ id: string; available: number }>
}

/** A carteira encerrou a conexão (o usuário desconectou no provedor). */
export interface WalletDisconnectedData {
  reason: string
}

/**
 * Mudança de estado do pedido, só para as sessões do dono. Leva o estado
 * completo do ciclo de vida: o recibo (itens e valores) nunca muda.
 */
export interface OrderUpdatedData {
  status: OrderStatus
  transactionHash: string | null
  refusalReason: string | null
  updatedAt: string
}

export interface RealtimeEventMap {
  'nft.updated': RealtimeEnvelope<NftUpdatedData>
  'order.updated': RealtimeEnvelope<OrderUpdatedData>
  'wallet.disconnected': RealtimeEnvelope<WalletDisconnectedData>
}

export type RealtimeEventName = keyof RealtimeEventMap
