import { HttpResponse, http } from 'msw'
import { apiErrorResponse } from '../errors'
import { lookupSession, readBearerToken } from '../sessions'
import type { MockRuntime } from '../runtime'
import type { FavoritesResponse } from '@/types/favorite'

/** Favoritos do usuário da sessão: consulta, inclusão e remoção idempotentes. */
export function createFavoriteHandlers(apiUrl: string, runtime: MockRuntime) {
  const { store } = runtime

  function authenticate(request: Request) {
    return lookupSession(store.state, readBearerToken(request), Date.now())
  }

  const listOf = (userId: string): FavoritesResponse => ({
    nftIds: [...(store.state.favorites[userId] ?? [])],
  })

  return [
    http.get(`${apiUrl}/favorites`, ({ request }) => {
      const lookup = authenticate(request)
      if (!lookup.ok) return apiErrorResponse(401, { reason: lookup.reason })
      return HttpResponse.json<FavoritesResponse>(listOf(lookup.user.id))
    }),

    http.put<{ nftId: string }>(
      `${apiUrl}/favorites/:nftId`,
      ({ request, params }) => {
        const lookup = authenticate(request)
        if (!lookup.ok) return apiErrorResponse(401, { reason: lookup.reason })
        if (!store.state.nfts.some((nft) => nft.id === params.nftId)) {
          return apiErrorResponse(404, {
            message: 'Este NFT não existe ou foi removido do mercado.',
          })
        }
        const userId = lookup.user.id
        store.write((db) => {
          const current = db.favorites[userId] ?? []
          if (!current.includes(params.nftId)) {
            db.favorites[userId] = [...current, params.nftId]
          }
        })
        return HttpResponse.json<FavoritesResponse>(listOf(userId))
      },
    ),

    http.delete<{ nftId: string }>(
      `${apiUrl}/favorites/:nftId`,
      ({ request, params }) => {
        const lookup = authenticate(request)
        if (!lookup.ok) return apiErrorResponse(401, { reason: lookup.reason })
        const userId = lookup.user.id
        store.write((db) => {
          db.favorites[userId] = (db.favorites[userId] ?? []).filter(
            (id) => id !== params.nftId,
          )
        })
        return HttpResponse.json<FavoritesResponse>(listOf(userId))
      },
    ),
  ]
}
