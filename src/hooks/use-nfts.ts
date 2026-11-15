import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { getNft, listNfts, listRelatedNfts } from '@/services/nfts'
import type { NftListQuery } from '@/types/nft'

/** O catálogo é público: as chaves não dependem do usuário. */
export const nftKeys = {
  all: ['nfts'] as const,
  lists: () => [...nftKeys.all, 'list'] as const,
  list: (query: NftListQuery) => [...nftKeys.lists(), query] as const,
  detail: (id: string) => [...nftKeys.all, 'detail', id] as const,
  related: (id: string) => [...nftKeys.detail(id), 'related'] as const,
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

export function nftDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: ({ signal }) => getNft(id, signal),
  })
}

export function useNft(id: string) {
  return useQuery(nftDetailQueryOptions(id))
}

export function useRelatedNfts(id: string) {
  return useQuery({
    queryKey: nftKeys.related(id),
    queryFn: ({ signal }) => listRelatedNfts(id, signal),
  })
}
