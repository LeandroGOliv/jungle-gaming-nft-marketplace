import { HttpResponse, http } from 'msw'
import { listNfts, parseNftListQuery, relatedNfts } from '../catalog'
import { apiErrorResponse } from '../errors'
import type { MockRuntime } from '../runtime'
import type { Nft, NftListResponse, NftRelatedResponse } from '@/types/nft'

const NFT_NOT_FOUND = 'Este NFT não existe ou foi removido do mercado.'

export function createNftHandlers(apiUrl: string, runtime: MockRuntime) {
  const findNft = (id: string) =>
    runtime.store.state.nfts.find((nft) => nft.id === id)

  return [
    http.get(`${apiUrl}/nfts`, ({ request }) => {
      const parsed = parseNftListQuery(new URL(request.url).searchParams)
      if (!parsed.ok) {
        return apiErrorResponse(422, {
          message: 'Parâmetros de busca inválidos.',
          fieldErrors: parsed.fieldErrors,
        })
      }
      return HttpResponse.json<NftListResponse>(
        listNfts(runtime.store.state.nfts, parsed.query),
      )
    }),

    http.get<{ id: string }>(`${apiUrl}/nfts/:id`, ({ params }) => {
      const nft = findNft(params.id)
      if (!nft) return apiErrorResponse(404, { message: NFT_NOT_FOUND })
      return HttpResponse.json<Nft>(nft)
    }),

    http.get<{ id: string }>(`${apiUrl}/nfts/:id/related`, ({ params }) => {
      if (!findNft(params.id)) {
        return apiErrorResponse(404, { message: NFT_NOT_FOUND })
      }
      return HttpResponse.json<NftRelatedResponse>({
        items: relatedNfts(runtime.store.state.nfts, params.id),
      })
    }),
  ]
}
