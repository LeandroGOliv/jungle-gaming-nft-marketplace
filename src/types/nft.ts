/** Valores em ETH trafegam como string decimal (ex.: `"1.19"`), nunca `number`. */
export type EthAmount = string

export const BLOCKCHAIN_NETWORKS = ['ethereum', 'polygon'] as const

export type BlockchainNetwork = (typeof BLOCKCHAIN_NETWORKS)[number]

export const NFT_CATEGORIES = [
  'art',
  'collectible',
  'music',
  'photography',
  'gaming',
] as const

export type NftCategory = (typeof NFT_CATEGORIES)[number]

export type NftRarity = 'common' | 'rare' | 'epic' | 'legendary'

/** Tiragens oferecidas no seletor de edição do detalhe. */
export type EditionLabel = '1/1' | '1/10' | '1/50'

export interface NftEdition {
  /** Único dentro do NFT; o item do carrinho é NFT + edição. */
  id: string
  label: EditionLabel
  supply: number
  /** Unidades ainda à venda; 0 indica edição esgotada. */
  available: number
}

export interface NftImage {
  alt: string
  /** 400 px, para cards e miniaturas. */
  smallUrl: string
  /** 800 px, para a imagem principal do detalhe. */
  largeUrl: string
}

export interface NftCollection {
  id: string
  name: string
}

export interface NftCreator {
  name: string
  handle: string
}

export interface Nft {
  id: string
  /** Exibido como "ID do token: #0042". */
  tokenId: string
  name: string
  /** Uma frase, para "Sobre este NFT" no detalhe. */
  summary: string
  description: string
  collection: NftCollection
  category: NftCategory
  creator: NftCreator
  rarity: NftRarity
  /** Preço unitário, o mesmo para todas as edições do NFT. */
  priceEth: EthAmount
  editions: Array<NftEdition>
  /** A primeira imagem é a principal; as demais formam a galeria. */
  images: Array<NftImage>
  network: BlockchainNetwork
  contractAddress: string
  royaltyPercent: number
  rating: number
  reviewCount: number
  featured: boolean
  /** Base da aba "Em alta": quanto maior, mais em alta. */
  trendingScore: number
  /** ISO 8601; base da aba "Novos lançamentos" e da ordenação por recência. */
  listedAt: string
  updatedAt: string
  /** Cresce a cada alteração; eventos com versão menor ou igual são descartados. */
  version: number
}

/** Recorte das abas da Início: "Novos lançamentos" e "Em alta". */
export const NFT_LIST_TABS = ['all', 'new', 'trending'] as const
export type NftListTab = (typeof NFT_LIST_TABS)[number]

export const NFT_LIST_SORTS = ['recent', 'price-asc', 'price-desc'] as const
export type NftListSort = (typeof NFT_LIST_SORTS)[number]

/** Query string de `GET /nfts`; os filtros ausentes não restringem. */
export interface NftListQuery {
  search?: string
  category?: NftCategory
  network?: BlockchainNetwork
  minPrice?: EthAmount
  maxPrice?: EthAmount
  /** Só os destaques da curadoria (banner "NFT em destaque"). */
  featured?: boolean
  tab: NftListTab
  sort: NftListSort
  /** Começa em 1. */
  page: number
  pageSize: number
}

/**
 * Contagens de cada opção de filtro, aplicando todos os outros filtros menos
 * o da própria dimensão — o número mostra o que a escolha devolveria.
 */
export interface NftListFacets {
  categories: Record<NftCategory, number>
  networks: Record<BlockchainNetwork, number>
  /** Menor e maior preço do catálogo inteiro: limites do slider. */
  priceRange: { min: EthAmount; max: EthAmount }
}

export interface NftListResponse {
  items: Array<Nft>
  page: number
  pageSize: number
  total: number
  totalPages: number
  facets: NftListFacets
}

/** `GET /nfts/:id/related`: "Mais desta coleção" no detalhe. */
export interface NftRelatedResponse {
  items: Array<Nft>
}
