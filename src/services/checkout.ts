import { clientApi } from '@/lib/http'
import { IDEMPOTENCY_HEADER } from '@/types/checkout'
import type {
  CreateOrderRequest,
  CreateWalletConnectionRequest,
  WalletConnection,
} from '@/types/checkout'
import type { Order } from '@/types/order'

const connectionPath = (id: string) =>
  `/wallet-connections/${encodeURIComponent(id)}`

export async function connectWallet(request: CreateWalletConnectionRequest) {
  const { data } = await clientApi.post<WalletConnection>(
    '/wallet-connections',
    request,
  )
  return data
}

export async function getWalletConnection(id: string, signal?: AbortSignal) {
  const { data } = await clientApi.get<WalletConnection>(connectionPath(id), {
    signal,
  })
  return data
}

export async function disconnectWallet(id: string) {
  await clientApi.delete(connectionPath(id))
}

export async function createOrder(
  idempotencyKey: string,
  request: CreateOrderRequest,
) {
  const { data } = await clientApi.post<Order>('/orders', request, {
    headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
  })
  return data
}
