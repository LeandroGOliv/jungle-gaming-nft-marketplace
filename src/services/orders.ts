import { clientApi, withSession } from '@/lib/http'
import { IDEMPOTENCY_HEADER } from '@/types/checkout'
import type { CreateOrderRequest } from '@/types/checkout'
import type { Order } from '@/types/order'

export async function createOrder(
  token: string,
  idempotencyKey: string,
  request: CreateOrderRequest,
) {
  const { data } = await clientApi.post<Order>('/orders', request, {
    ...withSession(token),
    headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
  })
  return data
}

export async function getOrder(
  token: string,
  id: string,
  signal?: AbortSignal,
) {
  const { data } = await clientApi.get<Order>(
    `/orders/${encodeURIComponent(id)}`,
    { ...withSession(token), signal },
  )
  return data
}
