/** Valores em ETH trafegam como string decimal (ex.: `"1.19"`), nunca `number`. */
export type EthAmount = string

export type BlockchainNetwork = 'ethereum' | 'polygon'

export type NftCategory =
  'art' | 'collectible' | 'music' | 'photography' | 'gaming'

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
