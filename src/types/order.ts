import type { BlockchainNetwork, EditionLabel, EthAmount } from './nft'

export interface CartItem {
  nftId: string
  editionId: string
  quantity: number
}

/** Pedidos confirmados e recusados são terminais. */
export type OrderStatus = 'pending' | 'confirmed' | 'refused'

/** Cópia dos dados do NFT no momento da compra; o recibo nunca relê o catálogo. */
export interface OrderItem {
  nftId: string
  editionId: string
  name: string
  tokenId: string
  editionLabel: EditionLabel
  imageUrl: string
  unitPriceEth: EthAmount
  quantity: number
  lineTotalEth: EthAmount
}

export interface Order {
  id: string
  userId: string
  idempotencyKey: string
  status: OrderStatus
  items: Array<OrderItem>
  subtotalEth: EthAmount
  discountEth: EthAmount
  networkFeeEth: EthAmount
  totalEth: EthAmount
  couponCode: string | null
  walletId: string
  network: BlockchainNetwork
  /** Presente quando a simulação confirma o pagamento. */
  transactionHash: string | null
  refusalReason: string | null
  createdAt: string
  updatedAt: string
  version: number
}
