import { clientApi, withSession } from '@/lib/http'
import { GUEST_CART_HEADER } from '@/types/cart'
import type {
  AddCartItemRequest,
  ApplyCouponRequest,
  Cart,
  CartQuote,
  UpdateCartItemRequest,
} from '@/types/cart'

/**
 * Dono do carrinho em cada chamada: a sessão do usuário (a da chave do cache)
 * ou o id do carrinho de visitante, que segue no header.
 */
export type CartActor =
  | { token: string; guestCartId?: undefined }
  | { token?: undefined; guestCartId: string | null }

function actorConfig({ token, guestCartId }: CartActor) {
  return {
    ...(token ? withSession(token) : {}),
    headers: guestCartId ? { [GUEST_CART_HEADER]: guestCartId } : {},
  }
}

const itemPath = (nftId: string, editionId: string) =>
  `/cart/items/${encodeURIComponent(nftId)}/${encodeURIComponent(editionId)}`

export async function getCart(actor: CartActor, signal?: AbortSignal) {
  const { data } = await clientApi.get<Cart>('/cart', {
    ...actorConfig(actor),
    signal,
  })
  return data
}

export async function getCartQuote(actor: CartActor, signal?: AbortSignal) {
  const { data } = await clientApi.get<CartQuote>('/cart/quote', {
    ...actorConfig(actor),
    signal,
  })
  return data
}

export async function addCartItem(actor: CartActor, item: AddCartItemRequest) {
  const { data } = await clientApi.post<Cart>(
    '/cart/items',
    item,
    actorConfig(actor),
  )
  return data
}

export async function updateCartItem(
  actor: CartActor,
  nftId: string,
  editionId: string,
  body: UpdateCartItemRequest,
) {
  const { data } = await clientApi.patch<Cart>(
    itemPath(nftId, editionId),
    body,
    actorConfig(actor),
  )
  return data
}

export async function removeCartItem(
  actor: CartActor,
  nftId: string,
  editionId: string,
) {
  const { data } = await clientApi.delete<Cart>(
    itemPath(nftId, editionId),
    actorConfig(actor),
  )
  return data
}

export async function applyCoupon(actor: CartActor, body: ApplyCouponRequest) {
  const { data } = await clientApi.put<Cart>(
    '/cart/coupon',
    body,
    actorConfig(actor),
  )
  return data
}

export async function removeCoupon(actor: CartActor) {
  const { data } = await clientApi.delete<Cart>(
    '/cart/coupon',
    actorConfig(actor),
  )
  return data
}

/** Leva o carrinho do visitante para o do usuário da sessão. */
export async function mergeGuestCart(
  token: string,
  guestCartId: string,
  signal?: AbortSignal,
) {
  const { data } = await clientApi.post<Cart>('/cart/merge', undefined, {
    ...withSession(token),
    headers: { [GUEST_CART_HEADER]: guestCartId },
    signal,
  })
  return data
}
