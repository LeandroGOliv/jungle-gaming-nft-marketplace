import { publicClientApi } from '@/lib/http'
import type {
  Nft,
  NftListQuery,
  NftListResponse,
  NftRelatedResponse,
} from '@/types/nft'

export async function listNfts(query: NftListQuery, signal?: AbortSignal) {
  const { data } = await publicClientApi.get<NftListResponse>('/nfts', {
    params: query,
    signal,
  })
  return data
}

export async function getNft(id: string, signal?: AbortSignal) {
  const { data } = await publicClientApi.get<Nft>(
    `/nfts/${encodeURIComponent(id)}`,
    { signal },
  )
  return data
}

export async function listRelatedNfts(id: string, signal?: AbortSignal) {
  const { data } = await publicClientApi.get<NftRelatedResponse>(
    `/nfts/${encodeURIComponent(id)}/related`,
    { signal },
  )
  return data
}
