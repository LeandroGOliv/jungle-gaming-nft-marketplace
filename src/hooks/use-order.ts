import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useAnnounce } from '@/hooks/use-announce'
import { cartKeys } from '@/hooks/use-cart'
import { nftKeys } from '@/hooks/use-nfts'
import { useRealtimeSocket } from '@/hooks/use-realtime'
import { ownerQueryFn, useSessionOwner, userKeys } from '@/hooks/use-session'
import { getApiError, isNoResponse } from '@/lib/http-error'
import { orderAttempt } from '@/lib/order-attempt'
import { createOrder, getOrder } from '@/services/orders'
import type { CreateOrderRequest } from '@/types/checkout'
import type { Order } from '@/types/order'
import { formatEth } from '@/utils/eth'
import {
  applyOrderUpdate,
  isOrderUpdatedEvent,
  isTerminalOrder,
} from '@/utils/order'
import { createEventGate } from '@/utils/realtime'

export const orderKeys = {
  detail: (userId: string, orderId: string) =>
    [...userKeys.detail(userId), 'orders', orderId] as const,
}

// Rede de segurança enquanto pendente: o desfecho chega pelo Socket.IO, mas o
// tempo real pode estar fora (cenário "Sem conexão" do socket).
const PENDING_REFETCH_MS = 10_000

/**
 * `POST /orders` com a chave da tentativa. Sem resposta (timeout, queda), o
 * envio se repete com a mesma chave: se o pedido já existia, a API devolve o
 * mesmo, nunca um segundo.
 */
export function useCreateOrder() {
  const owner = useSessionOwner()
  const navigate = useNavigate()
  const announce = useAnnounce()
  return useMutation({
    mutationFn: async (request: CreateOrderRequest) => {
      if (!owner) throw new Error('Sessão encerrada.')
      const key = orderAttempt.begin(owner.userId, request)
      try {
        const order = await createOrder(owner.token, key, request)
        orderAttempt.settle(owner.userId, key)
        return order
      } catch (error) {
        if (!isNoResponse(error)) orderAttempt.settle(owner.userId, key)
        throw error
      }
    },
    retry: (failures, error) => isNoResponse(error) && failures < 2,
    retryDelay: 1_000,
    // Aqui, e não no `mutate`: o pagamento pode desmontar o formulário antes da
    // resposta (o pedido já confirmado esvazia o carrinho) e o resultado tem de abrir.
    onSuccess: (order) => {
      announce(
        `Pedido ${order.id} criado no valor de ${formatEth(order.totalEth)}.`,
      )
      void navigate({ to: '/pagamento', search: { pedido: order.id } })
    },
  })
}

/**
 * Pedido do usuário, mantido em dia pelo `order.updated`: duplicatas e
 * versões antigas são descartadas, e confirmado/recusado não regridem. Após
 * reconectar, a REST reconcilia o que se perdeu durante a queda.
 */
export function useOrder(orderId: string | undefined) {
  const owner = useSessionOwner()
  const userId = owner?.userId ?? null
  const socket = useRealtimeSocket()
  const queryClient = useQueryClient()
  const announce = useAnnounce()
  const query = useQuery({
    queryKey: orderKeys.detail(userId ?? '', orderId ?? ''),
    queryFn: ownerQueryFn<Order>(owner, (token, signal) =>
      getOrder(token, orderId!, signal),
    ),
    enabled: userId !== null && orderId !== undefined,
    retry: (failures, error) =>
      getApiError(error)?.status !== 404 && failures < 2,
    refetchInterval: (q) =>
      q.state.data?.status === 'pending' ? PENDING_REFETCH_MS : false,
  })

  useEffect(() => {
    if (!socket || !userId || !orderId) return
    const key = orderKeys.detail(userId, orderId)
    const gate = createEventGate()

    function onUpdated(payload: unknown) {
      if (!isOrderUpdatedEvent(payload)) return
      if (payload.resource.id !== orderId) return
      const cached = queryClient.getQueryData<Order>(key)
      if (!gate.accept(payload, cached?.version)) return
      if (cached) {
        queryClient.setQueryData<Order>(key, applyOrderUpdate(cached, payload))
      } else {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    }

    function onReconnect() {
      void queryClient.invalidateQueries({ queryKey: key })
    }

    socket.on('order.updated', onUpdated)
    socket.io.on('reconnect', onReconnect)
    return () => {
      socket.off('order.updated', onUpdated)
      socket.io.off('reconnect', onReconnect)
    }
  }, [socket, userId, orderId, queryClient])

  // Reação ao desfecho, venha ele do socket ou da REST após reconectar.
  const order = query.data
  const seen = useRef<string | null>(null)
  useEffect(() => {
    if (!order || !userId) return
    const marker = `${order.id}:${order.status}`
    if (seen.current === marker) return
    const first = seen.current === null
    seen.current = marker
    if (!isTerminalOrder(order.status)) return

    orderAttempt.release(userId, order.idempotencyKey)
    if (order.status === 'confirmed') {
      // Carrinho e estoque mudaram na API com a confirmação.
      void queryClient.invalidateQueries({ queryKey: cartKeys.user(userId) })
      void queryClient.invalidateQueries({ queryKey: nftKeys.all })
    }
    // Abrir um recibo já terminado não é novidade para anunciar.
    if (first) return
    announce(
      order.status === 'confirmed'
        ? `Pagamento confirmado. Pedido ${order.id} no valor de ${formatEth(order.totalEth)}.`
        : `Pagamento recusado. ${order.refusalReason ?? ''} Os itens continuam no carrinho.`,
      order.status === 'confirmed' ? 'polite' : 'assertive',
    )
  }, [order, userId, queryClient, announce])

  return query
}

/**
 * Envio que ficou sem resposta antes de um refresh: ao voltar ao pagamento,
 * repete-se com a mesma chave para descobrir o pedido, sem criar outro.
 */
export function usePendingOrderAttempt() {
  const userId = useSessionOwner()?.userId ?? null
  // Lido só ao montar: um envio em curso nesta tela também fica marcado.
  const [pending] = useState(() =>
    userId ? (orderAttempt.read(userId)?.inFlight ?? null) : null,
  )
  return pending
}
