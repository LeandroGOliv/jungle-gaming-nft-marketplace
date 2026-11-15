import { clientApi } from '@/lib/http'
import { GUEST_CART_HEADER } from '@/types/cart'
import type {
  AddCartItemRequest,
  ApplyCouponRequest,
  Cart,
  CartQuote,
  UpdateCartItemRequest,
} from '@/types/cart'

/**
 * O carrinho atende visitante e usuário: `clientApi` anexa a sessão quando
 * existe, e o id do visitante segue no header (a API o ignora com sessão).
 */
function guestHeaders(guestCartId: string | null) {
  return guestCartId ? { [GUEST_CART_HEADER]: guestCartId } : {}
}

const itemPath = (nftId: string, editionId: string) =>
  `/cart/items/${encodeURIComponent(nftId)}/${encodeURIComponent(editionId)}`

export async function getCart(
  guestCartId: string | null,
  signal?: AbortSignal,
) {
  const { data } = await clientApi.get<Cart>('/cart', {
    headers: guestHeaders(guestCartId),
    signal,
  })
  return data
}

export async function getCartQuote(
  guestCartId: string | null,
  signal?: AbortSignal,
) {
  const { data } = await clientApi.get<CartQuote>('/cart/quote', {
    headers: guestHeaders(guestCartId),
    signal,
  })
  return data
}

export async function addCartItem(
  guestCartId: string | null,
  item: AddCartItemRequest,
) {
  const { data } = await clientApi.post<Cart>('/cart/items', item, {
    headers: guestHeaders(guestCartId),
  })
  return data
}

export async function updateCartItem(
  guestCartId: string | null,
  nftId: string,
  editionId: string,
  body: UpdateCartItemRequest,
) {
  const { data } = await clientApi.patch<Cart>(
    itemPath(nftId, editionId),
    body,
    { headers: guestHeaders(guestCartId) },
  )
  return data
}

export async function removeCartItem(
  guestCartId: string | null,
  nftId: string,
  editionId: string,
) {
  const { data } = await clientApi.delete<Cart>(itemPath(nftId, editionId), {
    headers: guestHeaders(guestCartId),
  })
  return data
}

export async function applyCoupon(
  guestCartId: string | null,
  body: ApplyCouponRequest,
) {
  const { data } = await clientApi.put<Cart>('/cart/coupon', body, {
    headers: guestHeaders(guestCartId),
  })
  return data
}

export async function removeCoupon(guestCartId: string | null) {
  const { data } = await clientApi.delete<Cart>('/cart/coupon', {
    headers: guestHeaders(guestCartId),
  })
  return data
}

/** Leva o carrinho do visitante para o do usuário da sessão atual. */
export async function mergeGuestCart(
  guestCartId: string,
  signal?: AbortSignal,
) {
  const { data } = await clientApi.post<Cart>('/cart/merge', undefined, {
    headers: guestHeaders(guestCartId),
    signal,
  })
  return data
}
