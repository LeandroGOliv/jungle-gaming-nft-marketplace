import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { listNfts } from '@/services/nfts'
import type { NftListQuery } from '@/types/nft'

/** O catálogo é público: as chaves não dependem do usuário. */
export const nftKeys = {
  all: ['nfts'] as const,
  lists: () => [...nftKeys.all, 'list'] as const,
  list: (query: NftListQuery) => [...nftKeys.lists(), query] as const,
}

export function nftListQueryOptions(query: NftListQuery) {
  return queryOptions({
    // Cada combinação de parâmetros tem a própria entrada: a resposta de uma
    // consulta antiga nunca ocupa a da consulta atual, mesmo chegando depois.
    queryKey: nftKeys.list(query),
    // Sem observadores, o TanStack aborta a requisição pelo `signal`.
    queryFn: ({ signal }) => listNfts(query, signal),
  })
}

/**
 * Lista do catálogo. Ao trocar página ou filtro, mantém a lista anterior na
 * tela (`isPlaceholderData`) até a nova chegar, em vez de voltar ao skeleton.
 */
export function useNftList(query: NftListQuery) {
  return useQuery({
    ...nftListQueryOptions(query),
    placeholderData: keepPreviousData,
  })
}

export function useFeaturedNfts() {
  return useQuery(
    nftListQueryOptions({
      featured: true,
      tab: 'all',
      sort: 'recent',
      page: 1,
      pageSize: 3,
    }),
  )
}
