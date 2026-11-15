import { clientApi, withSession } from '@/lib/http'
import type {
  CreateWalletConnectionRequest,
  WalletConnection,
} from '@/types/checkout'

const connectionPath = (id: string) =>
  `/wallet-connections/${encodeURIComponent(id)}`

export async function connectWallet(
  token: string,
  request: CreateWalletConnectionRequest,
) {
  const { data } = await clientApi.post<WalletConnection>(
    '/wallet-connections',
    request,
    withSession(token),
  )
  return data
}

export async function getWalletConnection(
  token: string,
  id: string,
  signal?: AbortSignal,
) {
  const { data } = await clientApi.get<WalletConnection>(connectionPath(id), {
    ...withSession(token),
    signal,
  })
  return data
}

export async function disconnectWallet(token: string, id: string) {
  await clientApi.delete(connectionPath(id), withSession(token))
}
