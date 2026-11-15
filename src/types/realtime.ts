import type { EthAmount } from './nft'

export type RealtimeResourceType = 'nft' | 'order'

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

export interface RealtimeEventMap {
  'nft.updated': RealtimeEnvelope<NftUpdatedData>
}

export type RealtimeEventName = keyof RealtimeEventMap
