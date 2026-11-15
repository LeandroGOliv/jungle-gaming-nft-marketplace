import { clientApi } from '@/lib/http'
import type { FavoritesResponse } from '@/types/favorite'

export async function listFavorites(signal?: AbortSignal) {
  const { data } = await clientApi.get<FavoritesResponse>('/favorites', {
    signal,
  })
  return data
}

export async function addFavorite(nftId: string) {
  const { data } = await clientApi.put<FavoritesResponse>(
    `/favorites/${encodeURIComponent(nftId)}`,
  )
  return data
}

export async function removeFavorite(nftId: string) {
  const { data } = await clientApi.delete<FavoritesResponse>(
    `/favorites/${encodeURIComponent(nftId)}`,
  )
  return data
}
