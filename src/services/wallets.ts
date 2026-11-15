import { clientApi, withSession } from '@/lib/http'
import type {
  CreateWalletRequest,
  UpdateWalletRequest,
  WalletsResponse,
} from '@/types/wallet'

export async function listWallets(token: string, signal?: AbortSignal) {
  const { data } = await clientApi.get<WalletsResponse>('/wallets', {
    ...withSession(token),
    signal,
  })
  return data
}

export async function createWallet(
  token: string,
  request: CreateWalletRequest,
) {
  const { data } = await clientApi.post<WalletsResponse>(
    '/wallets',
    request,
    withSession(token),
  )
  return data
}

export async function updateWallet(
  token: string,
  walletId: string,
  request: UpdateWalletRequest,
) {
  const { data } = await clientApi.put<WalletsResponse>(
    `/wallets/${encodeURIComponent(walletId)}`,
    request,
    withSession(token),
  )
  return data
}
