import { clientApi, withSession } from '@/lib/http'
import type { FavoritesResponse } from '@/types/favorite'

export async function listFavorites(token: string, signal?: AbortSignal) {
  const { data } = await clientApi.get<FavoritesResponse>('/favorites', {
    ...withSession(token),
    signal,
  })
  return data
}

export async function addFavorite(token: string, nftId: string) {
  const { data } = await clientApi.put<FavoritesResponse>(
    `/favorites/${encodeURIComponent(nftId)}`,
    undefined,
    withSession(token),
  )
  return data
}

export async function removeFavorite(token: string, nftId: string) {
  const { data } = await clientApi.delete<FavoritesResponse>(
    `/favorites/${encodeURIComponent(nftId)}`,
    withSession(token),
  )
  return data
}
