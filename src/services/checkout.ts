import { clientApi } from '@/lib/http'
import type {
  CreateWalletConnectionRequest,
  WalletConnection,
} from '@/types/checkout'

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
