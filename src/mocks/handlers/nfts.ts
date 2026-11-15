import { HttpResponse, http } from 'msw'
import { listNfts, parseNftListQuery } from '../catalog'
import { apiErrorResponse } from '../errors'
import type { MockRuntime } from '../runtime'
import type { NftListResponse } from '@/types/nft'

export function createNftHandlers(apiUrl: string, runtime: MockRuntime) {
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
  ]
}
