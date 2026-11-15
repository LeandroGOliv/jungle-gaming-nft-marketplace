import { clientApi } from '@/lib/http'
import type {
  CreateWalletRequest,
  UpdateWalletRequest,
  WalletsResponse,
} from '@/types/wallet'

export async function listWallets(signal?: AbortSignal) {
  const { data } = await clientApi.get<WalletsResponse>('/wallets', { signal })
  return data
}

export async function createWallet(request: CreateWalletRequest) {
  const { data } = await clientApi.post<WalletsResponse>('/wallets', request)
  return data
}

export async function updateWallet(
  walletId: string,
  request: UpdateWalletRequest,
) {
  const { data } = await clientApi.put<WalletsResponse>(
    `/wallets/${encodeURIComponent(walletId)}`,
    request,
  )
  return data
}
