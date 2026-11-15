import type { EditionLabel, EthAmount, NftImage } from './nft'

/** Item do carrinho como a API devolve: NFT + edição com os dados atuais do catálogo. */
export interface CartLine {
  nftId: string
  editionId: string
  quantity: number
  name: string
  tokenId: string
  editionLabel: EditionLabel
  image: NftImage
  unitPriceEth: EthAmount
  lineTotalEth: EthAmount
  /** Unidades ainda à venda da edição: limite do seletor de quantidade. */
  available: number
}

export interface Cart {
  /**
   * Carrinho do visitante: o id que o cliente guarda e envia em `X-Cart-Id`.
   * `null` para o carrinho do usuário autenticado, que é resolvido pela sessão.
   */
  guestCartId: string | null
  items: Array<CartLine>
  couponCode: string | null
  /** Soma das quantidades: o número do indicador no header. */
  itemCount: number
  /** Cresce a cada alteração; a cotação é chaveada por ela. */
  version: number
}

export interface AddCartItemRequest {
  nftId: string
  editionId: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

export interface ApplyCouponRequest {
  code: string
}

export type QuoteIssueKind = 'unavailable' | 'insufficient'

/** Item que não pode ser comprado como está: a edição esgotou ou baixou do pedido. */
export interface QuoteIssue {
  nftId: string
  editionId: string
  kind: QuoteIssueKind
  available: number
}

export type QuoteCouponStatus =
  'applied' | 'invalid' | 'expired' | 'min-subtotal'

export interface QuoteCoupon {
  code: string
  status: QuoteCouponStatus
  /** Texto para o usuário: o desconto aplicado ou por que não vale. */
  message: string
}

/**
 * `GET /cart/quote`: a referência de valores para exibir e para finalizar.
 * O cliente mostra estes números; não os recalcula.
 */
export interface CartQuote {
  cartVersion: number
  subtotalEth: EthAmount
  discountEth: EthAmount
  networkFeeEth: EthAmount
  totalEth: EthAmount
  coupon: QuoteCoupon | null
  issues: Array<QuoteIssue>
  quotedAt: string
}

export type CartErrorReason =
  | 'CART_QUANTITY_UNAVAILABLE'
  | 'CART_ITEM_NOT_FOUND'
  | 'CART_NOT_FOUND'
  | 'EDITION_NOT_FOUND'
  | 'COUPON_INVALID'
  | 'COUPON_EXPIRED'
  | 'COUPON_MIN_SUBTOTAL'

/** Header com o id do carrinho do visitante; ignorado quando há sessão. */
export const GUEST_CART_HEADER = 'X-Cart-Id'
