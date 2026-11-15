import { HttpResponse, http } from 'msw'
import {
  addCartItem,
  applyCoupon,
  emptyCart,
  mergeCarts,
  quoteCart,
  removeCartItem,
  removeCoupon,
  setCartItemQuantity,
  toCart,
} from '../cart'
import { apiErrorResponse } from '../errors'
import { lookupSession, readBearerToken } from '../sessions'
import type { CartResult } from '../cart'
import type { CartRecord, MockDb } from '../db'
import type { MockRuntime } from '../runtime'
import type {
  AddCartItemRequest,
  ApplyCouponRequest,
  Cart,
  CartQuote,
  UpdateCartItemRequest,
} from '@/types/cart'
import { GUEST_CART_HEADER } from '@/types/cart'

const GUEST_PREFIX = 'guest'

type Owner =
  | { kind: 'user'; key: string }
  | { kind: 'guest'; key: string }
  | { kind: 'none' }

type OwnerLookup =
  { ok: true; owner: Owner } | { ok: false; response: Response }

async function readJsonBody<T>(request: Request): Promise<Partial<T>> {
  try {
    const body: unknown = await request.json()
    return typeof body === 'object' && body !== null ? body : {}
  } catch {
    return {}
  }
}

const isGuestId = (value: string | null): value is string =>
  value?.startsWith(`${GUEST_PREFIX}_`) ?? false

/**
 * Carrinho de quem está pedindo: o do usuário quando há sessão (um token
 * inválido é 401, como em toda rota autenticada); sem sessão, o do visitante
 * indicado em `X-Cart-Id`, se ainda existir.
 */
function resolveOwner(db: MockDb, request: Request): OwnerLookup {
  const token = readBearerToken(request)
  if (token) {
    const lookup = lookupSession(db, token, Date.now())
    if (!lookup.ok) {
      return {
        ok: false,
        response: apiErrorResponse(401, { reason: lookup.reason }),
      }
    }
    return { ok: true, owner: { kind: 'user', key: lookup.user.id } }
  }
  const guestId = request.headers.get(GUEST_CART_HEADER)
  if (isGuestId(guestId) && Object.hasOwn(db.carts, guestId)) {
    return { ok: true, owner: { kind: 'guest', key: guestId } }
  }
  return { ok: true, owner: { kind: 'none' } }
}

export function createCartHandlers(apiUrl: string, runtime: MockRuntime) {
  const { store } = runtime

  const recordOf = (owner: Owner): CartRecord | null =>
    owner.kind === 'none' ? null : (store.state.carts[owner.key] ?? null)

  const cartResponse = (owner: Owner) => {
    const record = recordOf(owner)
    const cart: Cart = record
      ? toCart(
          record,
          store.state.nfts,
          owner.kind === 'guest' ? owner.key : null,
        )
      : {
          guestCartId: null,
          items: [],
          couponCode: null,
          itemCount: 0,
          version: 0,
        }
    return HttpResponse.json<Cart>(cart)
  }

  const failure = (result: Extract<CartResult, { ok: false }>) =>
    apiErrorResponse(result.status, {
      message: result.message,
      reason: result.reason,
      fieldErrors: result.fieldErrors,
    })

  /**
   * Aplica uma alteração ao carrinho de quem pede. O visitante sem carrinho
   * ganha um novo na primeira alteração bem-sucedida; o id volta em `guestCartId`.
   */
  function mutate(request: Request, change: (cart: CartRecord) => CartResult) {
    const resolved = resolveOwner(store.state, request)
    if (!resolved.ok) return resolved.response
    const current = resolved.owner
    // Mexe numa cópia: uma alteração recusada não deixa rastro no store.
    const draft = structuredClone(recordOf(current) ?? emptyCart())
    const result = change(draft)
    if (!result.ok) return failure(result)
    const owner: Owner =
      current.kind === 'none'
        ? { kind: 'guest', key: store.nextId(GUEST_PREFIX) }
        : current
    store.write((db) => {
      db.carts[owner.key] = draft
    })
    return cartResponse(owner)
  }

  return [
    http.get(`${apiUrl}/cart`, ({ request }) => {
      const resolved = resolveOwner(store.state, request)
      if (!resolved.ok) return resolved.response
      return cartResponse(resolved.owner)
    }),

    http.get(`${apiUrl}/cart/quote`, ({ request }) => {
      const resolved = resolveOwner(store.state, request)
      if (!resolved.ok) return resolved.response
      const record = recordOf(resolved.owner) ?? {
        ...emptyCart(),
        version: 0,
      }
      return HttpResponse.json<CartQuote>(
        quoteCart(record, store.state.nfts, store.state.coupons, Date.now()),
      )
    }),

    http.post(`${apiUrl}/cart/items`, async ({ request }) => {
      const body = await readJsonBody<AddCartItemRequest>(request)
      return mutate(request, (cart) =>
        addCartItem(cart, store.state.nfts, {
          nftId: String(body.nftId ?? ''),
          editionId: String(body.editionId ?? ''),
          quantity: body.quantity as number,
        }),
      )
    }),

    http.patch<{ nftId: string; editionId: string }>(
      `${apiUrl}/cart/items/:nftId/:editionId`,
      async ({ request, params }) => {
        const body = await readJsonBody<UpdateCartItemRequest>(request)
        return mutate(request, (cart) =>
          setCartItemQuantity(
            cart,
            store.state.nfts,
            params.nftId,
            params.editionId,
            body.quantity,
          ),
        )
      },
    ),

    http.delete<{ nftId: string; editionId: string }>(
      `${apiUrl}/cart/items/:nftId/:editionId`,
      ({ request, params }) =>
        mutate(request, (cart) =>
          removeCartItem(cart, params.nftId, params.editionId),
        ),
    ),

    http.put(`${apiUrl}/cart/coupon`, async ({ request }) => {
      const body = await readJsonBody<ApplyCouponRequest>(request)
      return mutate(request, (cart) =>
        applyCoupon(
          cart,
          store.state.nfts,
          store.state.coupons,
          typeof body.code === 'string' ? body.code : '',
          Date.now(),
        ),
      )
    }),

    http.delete(`${apiUrl}/cart/coupon`, ({ request }) =>
      mutate(request, removeCoupon),
    ),

    /**
     * Ao autenticar: leva o carrinho do visitante (`X-Cart-Id`) para o do
     * usuário e apaga o do visitante. Repetir é inofensivo: sem carrinho de
     * visitante, só devolve o do usuário.
     */
    http.post(`${apiUrl}/cart/merge`, ({ request }) => {
      const lookup = lookupSession(
        store.state,
        readBearerToken(request),
        Date.now(),
      )
      if (!lookup.ok) return apiErrorResponse(401, { reason: lookup.reason })
      const userId = lookup.user.id
      const guestId = request.headers.get(GUEST_CART_HEADER)
      store.write((db) => {
        db.carts[userId] ??= emptyCart()
        if (!isGuestId(guestId) || !Object.hasOwn(db.carts, guestId)) return
        mergeCarts(db.carts[userId], db.carts[guestId], db.nfts)
        delete db.carts[guestId]
      })
      return cartResponse({ kind: 'user', key: userId })
    }),
  ]
}
