import {
  BLOCKCHAIN_NETWORKS,
  NFT_CATEGORIES,
  NFT_LIST_SORTS,
  NFT_LIST_TABS,
} from '@/types/nft'
import type {
  BlockchainNetwork,
  Nft,
  NftCategory,
  NftListQuery,
  NftListResponse,
} from '@/types/nft'
import { compareEth, isEthAmount } from '@/utils/eth'

export const MAX_PAGE_SIZE = 48
const DEFAULT_PAGE_SIZE = 9
/** "Novos lançamentos": listados até 60 dias antes da listagem mais recente. */
const NEW_WINDOW_MS = 60 * 86_400_000
/** "Em alta": pontuação de tendência a partir de 70. */
const TRENDING_THRESHOLD = 70

type ParseResult =
  | { ok: true; query: NftListQuery }
  | { ok: false; fieldErrors: Record<string, string> }

function oneOf<T extends string>(
  values: ReadonlyArray<T>,
  raw: string | null,
): T | undefined | null {
  if (raw === null || raw === '') return undefined
  return values.includes(raw as T) ? (raw as T) : null
}

function positiveInt(raw: string | null, max = Infinity) {
  if (raw === null) return undefined
  if (!/^\d+$/.test(raw)) return null
  const value = Number(raw)
  return value >= 1 && value <= max ? value : null
}

/** Valida a query string de `GET /nfts`; valores inválidos viram 422. */
export function parseNftListQuery(params: URLSearchParams): ParseResult {
  const fieldErrors: Record<string, string> = {}
  const query: NftListQuery = {
    tab: 'all',
    sort: 'recent',
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  }

  const search = params.get('search')?.trim()
  if (search) query.search = search

  const category = oneOf(NFT_CATEGORIES, params.get('category'))
  if (category === null) fieldErrors.category = 'Categoria desconhecida.'
  else if (category) query.category = category

  const network = oneOf(BLOCKCHAIN_NETWORKS, params.get('network'))
  if (network === null) fieldErrors.network = 'Rede desconhecida.'
  else if (network) query.network = network

  for (const field of ['minPrice', 'maxPrice'] as const) {
    const raw = params.get(field)
    if (raw === null || raw === '') continue
    if (isEthAmount(raw)) query[field] = raw
    else fieldErrors[field] = 'Informe um valor em ETH, como 1.25.'
  }
  if (
    query.minPrice &&
    query.maxPrice &&
    compareEth(query.minPrice, query.maxPrice) > 0
  ) {
    fieldErrors.maxPrice = 'O preço máximo deve ser maior que o mínimo.'
  }

  const featured = params.get('featured')
  if (featured === 'true') query.featured = true
  else if (featured !== null && featured !== 'false')
    fieldErrors.featured = 'Use true ou false.'

  const tab = oneOf(NFT_LIST_TABS, params.get('tab'))
  if (tab === null) fieldErrors.tab = 'Aba desconhecida.'
  else if (tab) query.tab = tab

  const sort = oneOf(NFT_LIST_SORTS, params.get('sort'))
  if (sort === null) fieldErrors.sort = 'Ordenação desconhecida.'
  else if (sort) query.sort = sort

  const page = positiveInt(params.get('page'))
  if (page === null) fieldErrors.page = 'A página começa em 1.'
  else if (page) query.page = page

  const pageSize = positiveInt(params.get('pageSize'), MAX_PAGE_SIZE)
  if (pageSize === null)
    fieldErrors.pageSize = `Use de 1 a ${MAX_PAGE_SIZE} itens por página.`
  else if (pageSize) query.pageSize = pageSize

  return Object.keys(fieldErrors).length > 0
    ? { ok: false, fieldErrors }
    : { ok: true, query }
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

type Dimension = 'category' | 'network'

function createMatcher(nfts: Array<Nft>, query: NftListQuery) {
  const newest = Math.max(0, ...nfts.map((n) => Date.parse(n.listedAt)))
  const term = query.search ? normalize(query.search) : null

  return (nft: Nft, ignore?: Dimension) => {
    if (
      term &&
      ![nft.name, nft.collection.name, nft.creator.name].some((text) =>
        normalize(text).includes(term),
      )
    )
      return false
    if (
      ignore !== 'category' &&
      query.category &&
      nft.category !== query.category
    )
      return false
    if (ignore !== 'network' && query.network && nft.network !== query.network)
      return false
    if (query.featured && !nft.featured) return false
    if (query.minPrice && compareEth(nft.priceEth, query.minPrice) < 0)
      return false
    if (query.maxPrice && compareEth(nft.priceEth, query.maxPrice) > 0)
      return false
    if (
      query.tab === 'new' &&
      newest - Date.parse(nft.listedAt) > NEW_WINDOW_MS
    )
      return false
    if (query.tab === 'trending' && nft.trendingScore < TRENDING_THRESHOLD)
      return false
    return true
  }
}

function countBy<TKey extends string>(
  keys: ReadonlyArray<TKey>,
  nfts: Array<Nft>,
  pick: (nft: Nft) => TKey,
) {
  const counts = Object.fromEntries(keys.map((k) => [k, 0])) as Record<
    TKey,
    number
  >
  for (const nft of nfts) counts[pick(nft)] += 1
  return counts
}

const SORTERS: Record<NftListQuery['sort'], (a: Nft, b: Nft) => number> = {
  recent: (a, b) => b.listedAt.localeCompare(a.listedAt),
  'price-asc': (a, b) => compareEth(a.priceEth, b.priceEth),
  'price-desc': (a, b) => compareEth(b.priceEth, a.priceEth),
}

export function listNfts(
  nfts: Array<Nft>,
  query: NftListQuery,
): NftListResponse {
  const matches = createMatcher(nfts, query)
  // Desempate pelo id: a mesma consulta devolve sempre a mesma página.
  const results = nfts
    .filter((nft) => matches(nft))
    .sort((a, b) => SORTERS[query.sort](a, b) || a.id.localeCompare(b.id))

  const byPrice = [...nfts].sort((a, b) => compareEth(a.priceEth, b.priceEth))
  const start = (query.page - 1) * query.pageSize

  return {
    items: results.slice(start, start + query.pageSize),
    page: query.page,
    pageSize: query.pageSize,
    total: results.length,
    totalPages: Math.ceil(results.length / query.pageSize),
    facets: {
      categories: countBy<NftCategory>(
        NFT_CATEGORIES,
        nfts.filter((nft) => matches(nft, 'category')),
        (nft) => nft.category,
      ),
      networks: countBy<BlockchainNetwork>(
        BLOCKCHAIN_NETWORKS,
        nfts.filter((nft) => matches(nft, 'network')),
        (nft) => nft.network,
      ),
      priceRange: {
        min: byPrice[0]?.priceEth ?? '0',
        max: byPrice.at(-1)?.priceEth ?? '0',
      },
    },
  }
}
