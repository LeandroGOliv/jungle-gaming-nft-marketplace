import { clientApi } from '@/lib/http'
import { IDEMPOTENCY_HEADER } from '@/types/checkout'
import type { CreateOrderRequest } from '@/types/checkout'
import type { Order } from '@/types/order'

export async function createOrder(
  idempotencyKey: string,
  request: CreateOrderRequest,
) {
  const { data } = await clientApi.post<Order>('/orders', request, {
    headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
  })
  return data
}

export async function getOrder(id: string, signal?: AbortSignal) {
  const { data } = await clientApi.get<Order>(
    `/orders/${encodeURIComponent(id)}`,
    { signal },
  )
  return data
}
