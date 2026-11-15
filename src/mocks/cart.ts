import type { CartRecord } from './db'
import type { CouponRecord } from './fixtures/coupons'
import type { ApiErrorStatus } from '@/types/api'
import type {
  AddCartItemRequest,
  Cart,
  CartErrorReason,
  CartLine,
  CartQuote,
  QuoteCoupon,
  QuoteIssue,
} from '@/types/cart'
import type { Nft, NftEdition } from '@/types/nft'
import {
  compareEth,
  formatEth,
  minEth,
  multiplyEth,
  percentOfEth,
  subEth,
  sumEth,
  addEth,
} from '@/utils/eth'

/** Taxa de rede estimada da simulação, a mesma do Figma e dos recibos. */
export const NETWORK_FEE_ETH = '0.016'

export type CartResult =
  | { ok: true }
  | {
      ok: false
      status: ApiErrorStatus
      reason?: CartErrorReason
      message: string
      fieldErrors?: Record<string, string>
    }

const OK: CartResult = { ok: true }

export function emptyCart(): CartRecord {
  return { items: [], couponCode: null, version: 1 }
}

function findEdition(nfts: Array<Nft>, nftId: string, editionId: string) {
  const nft = nfts.find((n) => n.id === nftId)
  const edition = nft?.editions.find((e) => e.id === editionId)
  return nft && edition ? { nft, edition } : null
}

function invalidQuantity(): CartResult {
  return {
    ok: false,
    status: 422,
    message: 'A quantidade precisa ser um número inteiro maior que zero.',
    fieldErrors: { quantity: 'Informe uma quantidade inteira maior que zero.' },
  }
}

function unavailable(nft: Nft, edition: NftEdition): CartResult {
  return {
    ok: false,
    status: 409,
    reason: 'CART_QUANTITY_UNAVAILABLE',
    message:
      edition.available === 0
        ? `A edição ${edition.label} de ${nft.name} está esgotada.`
        : `Só há ${edition.available} ${edition.available === 1 ? 'unidade disponível' : 'unidades disponíveis'} da edição ${edition.label} de ${nft.name}.`,
  }
}

const isQuantity = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0

export function addCartItem(
  cart: CartRecord,
  nfts: Array<Nft>,
  { nftId, editionId, quantity }: AddCartItemRequest,
): CartResult {
  if (!isQuantity(quantity)) return invalidQuantity()
  const found = findEdition(nfts, nftId, editionId)
  if (!found) {
    return {
      ok: false,
      status: 404,
      reason: 'EDITION_NOT_FOUND',
      message: 'Esta edição não existe ou foi removida do mercado.',
    }
  }
  const current = cart.items.find(
    (i) => i.nftId === nftId && i.editionId === editionId,
  )
  const next = (current?.quantity ?? 0) + quantity
  if (next > found.edition.available) {
    return unavailable(found.nft, found.edition)
  }
  if (current) current.quantity = next
  else cart.items.push({ nftId, editionId, quantity })
  cart.version += 1
  return OK
}

function itemNotFound(): CartResult {
  return {
    ok: false,
    status: 404,
    reason: 'CART_ITEM_NOT_FOUND',
    message: 'Este item não está mais no carrinho.',
  }
}

export function setCartItemQuantity(
  cart: CartRecord,
  nfts: Array<Nft>,
  nftId: string,
  editionId: string,
  quantity: unknown,
): CartResult {
  if (!isQuantity(quantity)) return invalidQuantity()
  const item = cart.items.find(
    (i) => i.nftId === nftId && i.editionId === editionId,
  )
  if (!item) return itemNotFound()
  const found = findEdition(nfts, nftId, editionId)
  // Diminuir sempre é permitido: é o caminho para resolver uma disponibilidade que caiu.
  if (found && quantity > item.quantity && quantity > found.edition.available) {
    return unavailable(found.nft, found.edition)
  }
  item.quantity = quantity
  cart.version += 1
  return OK
}

export function removeCartItem(
  cart: CartRecord,
  nftId: string,
  editionId: string,
): CartResult {
  const index = cart.items.findIndex(
    (i) => i.nftId === nftId && i.editionId === editionId,
  )
  if (index === -1) return itemNotFound()
  cart.items.splice(index, 1)
  cart.version += 1
  return OK
}

/**
 * Traz os itens do visitante para o carrinho do usuário: o mesmo NFT e edição
 * somam as quantidades, limitadas ao disponível; o cupom do visitante, se
 * houver, prevalece por ser a escolha mais recente.
 */
export function mergeCarts(
  target: CartRecord,
  source: CartRecord,
  nfts: Array<Nft>,
) {
  for (const item of source.items) {
    const available =
      findEdition(nfts, item.nftId, item.editionId)?.edition.available ?? 0
    const current = target.items.find(
      (i) => i.nftId === item.nftId && i.editionId === item.editionId,
    )
    const merged = Math.min((current?.quantity ?? 0) + item.quantity, available)
    if (current) current.quantity = Math.max(current.quantity, merged)
    else if (merged > 0) target.items.push({ ...item, quantity: merged })
  }
  if (source.couponCode) target.couponCode = source.couponCode
  target.version += 1
}

export function subtotalOf(cart: CartRecord, nfts: Array<Nft>) {
  return sumEth(
    cart.items.flatMap((item) => {
      const nft = nfts.find((n) => n.id === item.nftId)
      return nft ? [multiplyEth(nft.priceEth, item.quantity)] : []
    }),
  )
}

type CouponCheck =
  | { ok: true; coupon: CouponRecord }
  | {
      ok: false
      reason: Extract<CartErrorReason, `COUPON_${string}`>
      message: string
      coupon?: CouponRecord
    }

function checkCoupon(
  code: string,
  coupons: Array<CouponRecord>,
  subtotal: string,
  now: number,
): CouponCheck {
  const coupon = coupons.find((c) => c.code === code)
  if (!coupon) {
    return {
      ok: false,
      reason: 'COUPON_INVALID',
      message: 'Código promocional inválido.',
    }
  }
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) <= now) {
    return {
      ok: false,
      reason: 'COUPON_EXPIRED',
      message: `O código ${coupon.code} expirou.`,
      coupon,
    }
  }
  if (
    coupon.minSubtotalEth &&
    compareEth(subtotal, coupon.minSubtotalEth) < 0
  ) {
    return {
      ok: false,
      reason: 'COUPON_MIN_SUBTOTAL',
      message: `O código ${coupon.code} vale para compras a partir de ${formatEth(coupon.minSubtotalEth)}.`,
      coupon,
    }
  }
  return { ok: true, coupon }
}

export function applyCoupon(
  cart: CartRecord,
  nfts: Array<Nft>,
  coupons: Array<CouponRecord>,
  rawCode: string,
  now: number,
): CartResult {
  const code = rawCode.trim().toUpperCase()
  if (!code) {
    return {
      ok: false,
      status: 422,
      reason: 'COUPON_INVALID',
      message: 'Informe o código promocional.',
      fieldErrors: { code: 'Informe o código promocional.' },
    }
  }
  const check = checkCoupon(code, coupons, subtotalOf(cart, nfts), now)
  if (!check.ok) {
    return {
      ok: false,
      status: 422,
      reason: check.reason,
      message: check.message,
      fieldErrors: { code: check.message },
    }
  }
  cart.couponCode = check.coupon.code
  cart.version += 1
  return OK
}

export function removeCoupon(cart: CartRecord): CartResult {
  if (cart.couponCode === null) return OK
  cart.couponCode = null
  cart.version += 1
  return OK
}

const COUPON_STATUS = {
  COUPON_INVALID: 'invalid',
  COUPON_EXPIRED: 'expired',
  COUPON_MIN_SUBTOTAL: 'min-subtotal',
} as const

function discountOf(coupon: CouponRecord, subtotal: string) {
  const raw =
    coupon.kind === 'percent'
      ? percentOfEth(subtotal, coupon.value)
      : coupon.value
  return minEth(raw, subtotal)
}

export function toCart(
  cart: CartRecord,
  nfts: Array<Nft>,
  guestCartId: string | null,
): Cart {
  const items = cart.items.flatMap((item): Array<CartLine> => {
    const found = findEdition(nfts, item.nftId, item.editionId)
    if (!found) return []
    const { nft, edition } = found
    return [
      {
        nftId: nft.id,
        editionId: edition.id,
        quantity: item.quantity,
        name: nft.name,
        tokenId: nft.tokenId,
        editionLabel: edition.label,
        image: nft.images[0],
        unitPriceEth: nft.priceEth,
        lineTotalEth: multiplyEth(nft.priceEth, item.quantity),
        available: edition.available,
      },
    ]
  })
  return {
    guestCartId,
    items,
    couponCode: cart.couponCode,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    version: cart.version,
  }
}

/** Cotação a partir do estado atual do catálogo e dos cupons; nunca do que o cliente enviou. */
export function quoteCart(
  cart: CartRecord,
  nfts: Array<Nft>,
  coupons: Array<CouponRecord>,
  now: number,
): CartQuote {
  const subtotalEth = subtotalOf(cart, nfts)
  const issues = cart.items.flatMap((item): Array<QuoteIssue> => {
    const available =
      findEdition(nfts, item.nftId, item.editionId)?.edition.available ?? 0
    if (available >= item.quantity) return []
    return [
      {
        nftId: item.nftId,
        editionId: item.editionId,
        kind: available === 0 ? 'unavailable' : 'insufficient',
        available,
      },
    ]
  })

  let coupon: QuoteCoupon | null = null
  let discountEth = '0'
  if (cart.couponCode) {
    const check = checkCoupon(cart.couponCode, coupons, subtotalEth, now)
    if (check.ok) {
      discountEth = discountOf(check.coupon, subtotalEth)
      coupon = {
        code: check.coupon.code,
        status: 'applied',
        message:
          check.coupon.kind === 'percent'
            ? `${check.coupon.value}% de desconto aplicado.`
            : `${formatEth(check.coupon.value)} de desconto aplicado.`,
      }
    } else {
      coupon = {
        code: cart.couponCode,
        status: COUPON_STATUS[check.reason],
        message: check.message,
      }
    }
  }

  const networkFeeEth = cart.items.length > 0 ? NETWORK_FEE_ETH : '0'
  return {
    cartVersion: cart.version,
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth: addEth(subEth(subtotalEth, discountEth), networkFeeEth),
    coupon,
    issues,
    quotedAt: new Date(now).toISOString(),
  }
}
