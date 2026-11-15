import { useSyncExternalStore } from 'react'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useAnnounce } from '@/hooks/use-announce'
import { useSession, userKeys } from '@/hooks/use-session'
import { guestCartId } from '@/lib/guest-cart'
import {
  describeRequestError,
  getApiError,
  isUnauthorized,
} from '@/lib/http-error'
import {
  addCartItem,
  applyCoupon,
  getCart,
  getCartQuote,
  mergeGuestCart,
  removeCartItem,
  removeCoupon,
  updateCartItem,
} from '@/services/cart'
import type { QueryClient } from '@tanstack/react-query'
import type { AddCartItemRequest, Cart } from '@/types/cart'

type CartOwner =
  | { kind: 'pending' }
  | { kind: 'user'; userId: string }
  | { kind: 'guest'; guestCartId: string | null }

/**
 * O carrinho do usuário fica sob o id dele (sai do cache no logout, com os
 * demais dados privados); o do visitante, sob o id do carrinho de visitante.
 */
export const cartKeys = {
  user: (userId: string) => [...userKeys.detail(userId), 'cart'] as const,
  guest: (id: string | null) => ['cart', 'guest', id ?? 'none'] as const,
}

function ownerKey(owner: Exclude<CartOwner, { kind: 'pending' }>) {
  return owner.kind === 'user'
    ? cartKeys.user(owner.userId)
    : cartKeys.guest(owner.guestCartId)
}

function useGuestCartId() {
  return useSyncExternalStore(guestCartId.subscribe, guestCartId.get)
}

function useCartOwner(): CartOwner {
  const session = useSession()
  const guestId = useGuestCartId()
  if (session.status === 'pending') return { kind: 'pending' }
  if (session.status === 'authenticated') {
    return { kind: 'user', userId: session.user.id }
  }
  return { kind: 'guest', guestCartId: guestId }
}

/**
 * Carrinho de quem está navegando. No primeiro carregamento após o login, a
 * consulta mescla o carrinho do visitante antes de devolver o do usuário; o
 * id do visitante só é descartado depois que a API confirma a mescla, então
 * uma falha (ou um refresh no meio) apenas repete a tentativa.
 */
export function useCart() {
  const owner = useCartOwner()
  const query = useQuery({
    queryKey: owner.kind === 'pending' ? ['cart', 'pending'] : ownerKey(owner),
    queryFn: async ({ signal }) => {
      const pendingGuest = guestCartId.get()
      if (owner.kind === 'user' && pendingGuest) {
        const merged = await mergeGuestCart(pendingGuest, signal)
        guestCartId.clear()
        return merged
      }
      return getCart(owner.kind === 'guest' ? owner.guestCartId : null, signal)
    },
    enabled: owner.kind !== 'pending',
  })
  return { ...query, owner }
}

/**
 * Cotação do carrinho: chaveada pela versão, para nunca exibir valores de um
 * carrinho que já mudou. Enquanto a nova chega, a anterior continua na tela
 * (`isPlaceholderData`), marcada como em atualização.
 */
export function useCartQuote(cart: Cart | undefined, owner: CartOwner) {
  return useQuery({
    queryKey: [
      ...(owner.kind === 'pending' ? ['cart', 'pending'] : ownerKey(owner)),
      'quote',
      cart?.version ?? 0,
    ],
    queryFn: ({ signal }) =>
      getCartQuote(owner.kind === 'guest' ? owner.guestCartId : null, signal),
    enabled: cart !== undefined && cart.items.length > 0,
    placeholderData: keepPreviousData,
  })
}

/**
 * Grava o carrinho devolvido pela mutation. A primeira inclusão do visitante
 * traz o id novo: os dados entram no cache sob a chave nova antes de o id
 * mudar, para a tela não passar por um carregamento.
 */
function storeCart(queryClient: QueryClient, owner: CartOwner, cart: Cart) {
  if (owner.kind === 'user') {
    queryClient.setQueryData(cartKeys.user(owner.userId), cart)
    return
  }
  queryClient.setQueryData(cartKeys.guest(cart.guestCartId), cart)
  if (cart.guestCartId) guestCartId.set(cart.guestCartId)
}

interface CartMutationOptions<TVariables> {
  mutationFn: (guestId: string | null, variables: TVariables) => Promise<Cart>
  successMessage?: (variables: TVariables, cart: Cart) => string
  failureMessage: (variables: TVariables) => string
}

/**
 * Base das alterações do carrinho. Não há atualização otimista: quantidade e
 * cupom dependem da disponibilidade e das regras da API, então a tela mostra
 * o estado pendente e aplica a resposta. Um conflito recarrega o carrinho,
 * porque o motivo costuma ser estoque que mudou.
 */
function useCartMutation<TVariables>({
  mutationFn,
  successMessage,
  failureMessage,
}: CartMutationOptions<TVariables>) {
  const queryClient = useQueryClient()
  const announce = useAnnounce()
  const owner = useCartOwner()

  return useMutation({
    mutationFn: (variables: TVariables) =>
      mutationFn(owner.kind === 'guest' ? owner.guestCartId : null, variables),
    onSuccess: (cart, variables) => {
      storeCart(queryClient, owner, cart)
      const message = successMessage?.(variables, cart)
      if (message) announce(message)
    },
    onError: (error, variables) => {
      if (isUnauthorized(error)) return
      if (getApiError(error)?.status === 409 && owner.kind !== 'pending') {
        void queryClient.invalidateQueries({ queryKey: ownerKey(owner) })
      }
      announce(
        `${failureMessage(variables)} ${describeRequestError(error)}`,
        'assertive',
      )
    },
  })
}

interface AddItemVariables extends AddCartItemRequest {
  nftName: string
}

export function useAddToCart() {
  return useCartMutation<AddItemVariables>({
    mutationFn: (guestId, { nftName: _name, ...item }) =>
      addCartItem(guestId, item),
    successMessage: ({ nftName, quantity }) =>
      `${quantity} ${quantity === 1 ? 'unidade' : 'unidades'} de ${nftName} no carrinho.`,
    failureMessage: ({ nftName }) =>
      `Não foi possível adicionar ${nftName} ao carrinho.`,
  })
}

interface ItemVariables {
  nftId: string
  editionId: string
  nftName: string
}

export function useUpdateCartItem() {
  return useCartMutation<ItemVariables & { quantity: number }>({
    mutationFn: (guestId, { nftId, editionId, quantity }) =>
      updateCartItem(guestId, nftId, editionId, { quantity }),
    successMessage: ({ nftName, quantity }) =>
      `Quantidade de ${nftName}: ${quantity}.`,
    failureMessage: ({ nftName }) =>
      `Não foi possível alterar a quantidade de ${nftName}.`,
  })
}

export function useRemoveCartItem() {
  return useCartMutation<ItemVariables>({
    mutationFn: (guestId, { nftId, editionId }) =>
      removeCartItem(guestId, nftId, editionId),
    successMessage: ({ nftName }) => `${nftName} removido do carrinho.`,
    failureMessage: ({ nftName }) =>
      `Não foi possível remover ${nftName} do carrinho.`,
  })
}

/** Erros de cupom vão para o campo do formulário; o anúncio fica com o resto. */
export function useApplyCoupon() {
  const queryClient = useQueryClient()
  const announce = useAnnounce()
  const owner = useCartOwner()
  return useMutation({
    mutationFn: (code: string) =>
      applyCoupon(owner.kind === 'guest' ? owner.guestCartId : null, { code }),
    onSuccess: (cart) => {
      storeCart(queryClient, owner, cart)
      announce(`Código ${cart.couponCode ?? ''} aplicado.`)
    },
  })
}

export function useRemoveCoupon() {
  return useCartMutation<{ code: string }>({
    mutationFn: (guestId) => removeCoupon(guestId),
    successMessage: ({ code }) => `Código ${code} removido.`,
    failureMessage: ({ code }) => `Não foi possível remover o código ${code}.`,
  })
}
