import { publicClientApi } from '@/lib/http'
import type { NftListQuery, NftListResponse } from '@/types/nft'

export async function listNfts(query: NftListQuery, signal?: AbortSignal) {
  const { data } = await publicClientApi.get<NftListResponse>('/nfts', {
    params: query,
    signal,
  })
  return data
}
