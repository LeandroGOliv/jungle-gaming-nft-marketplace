import { z } from 'zod'
import { BLOCKCHAIN_NETWORKS, NFT_CATEGORIES } from '@/types/nft'
import type { NftListQuery, NftListSort, NftListTab } from '@/types/nft'
import { compareEth, isEthAmount } from './eth'

/** 3 × 3 cards, como a grade do Figma. */
export const CATALOG_PAGE_SIZE = 9

export const CATALOG_TABS = {
  novos: 'new',
  'em-alta': 'trending',
} as const satisfies Record<string, Exclude<NftListTab, 'all'>>

export const CATALOG_SORTS = {
  recentes: 'recent',
  'menor-preco': 'price-asc',
  'maior-preco': 'price-desc',
} as const satisfies Record<string, NftListSort>

export type CatalogTab = keyof typeof CATALOG_TABS
export type CatalogSort = keyof typeof CATALOG_SORTS

const keysOf = <T extends object>(record: T) =>
  Object.keys(record) as [keyof T & string, ...Array<keyof T & string>]

const ethAmount = z.string().refine(isEthAmount).optional().catch(undefined)

// Parâmetro inválido na URL é descartado em vez de quebrar a página. O router
// faz JSON.parse dos valores, então `?busca=2024` digitado chega como número.
export const catalogSearchSchema = z
  .object({
    busca: z
      .union([z.string(), z.number()])
      .transform(String)
      .pipe(z.string().trim().min(1))
      .optional()
      .catch(undefined),
    categoria: z.enum(NFT_CATEGORIES).optional().catch(undefined),
    rede: z.enum(BLOCKCHAIN_NETWORKS).optional().catch(undefined),
    precoMin: ethAmount,
    precoMax: ethAmount,
    aba: z.enum(keysOf(CATALOG_TABS)).optional().catch(undefined),
    ordem: z.enum(keysOf(CATALOG_SORTS)).optional().catch(undefined),
    pagina: z.coerce.number().int().min(1).optional().catch(undefined),
  })
  .transform((search) => {
    const { precoMin, precoMax } = search
    if (precoMin && precoMax && compareEth(precoMin, precoMax) > 0) {
      return { ...search, precoMin: undefined, precoMax: undefined }
    }
    return search
  })
  // Remove as chaves vazias para a URL não carregar `?categoria=undefined`.
  .transform(
    (search) =>
      Object.fromEntries(
        Object.entries(search as Record<string, unknown>).filter(
          ([, value]) => value !== undefined,
        ),
      ) as Partial<typeof search>,
  )

export type CatalogSearch = z.output<typeof catalogSearchSchema>

/** Query da API a partir da URL: a URL é o estado, a query é derivada. */
export function toNftListQuery(search: CatalogSearch): NftListQuery {
  const query: NftListQuery = {
    tab: search.aba ? CATALOG_TABS[search.aba] : 'all',
    sort: CATALOG_SORTS[search.ordem ?? 'recentes'],
    page: search.pagina ?? 1,
    pageSize: CATALOG_PAGE_SIZE,
  }
  if (search.busca) query.search = search.busca
  if (search.categoria) query.category = search.categoria
  if (search.rede) query.network = search.rede
  if (search.precoMin) query.minPrice = search.precoMin
  if (search.precoMax) query.maxPrice = search.precoMax
  return query
}

/**
 * Próxima URL ao mudar um filtro: aplica as mudanças, volta para a primeira
 * página e remove chaves vazias. Preserva parâmetros de outras rotas (`auth`).
 */
export function withFilters<T extends CatalogSearch>(
  prev: T,
  changes: Partial<CatalogSearch>,
): T {
  const next: Record<string, unknown> = { ...prev, ...changes }
  delete next.pagina
  for (const key of Object.keys(next))
    if (next[key] === undefined) delete next[key]
  return next as T
}

/** Próxima URL ao trocar de página; a página 1 não aparece na URL. */
export function withPage<T extends CatalogSearch>(prev: T, page: number): T {
  const next: Record<string, unknown> = { ...prev, pagina: page }
  if (page <= 1) delete next.pagina
  return next as T
}
