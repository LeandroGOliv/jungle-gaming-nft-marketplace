import type { BlockchainNetwork, NftCategory, NftRarity } from '@/types/nft'
import type { CatalogSort, CatalogTab } from '@/utils/catalog-search'

/** Ordem e nomes da lista "Coleções" do Figma, restritos às categorias da API. */
export const CATEGORY_LABELS: Record<NftCategory, string> = {
  art: 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  collectible: 'Colecionáveis',
  gaming: 'Jogos',
}

export const NETWORK_LABELS: Record<BlockchainNetwork, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
}

export const TAB_LABELS: Array<[CatalogTab | undefined, string]> = [
  [undefined, 'Todos os NFTs'],
  ['novos', 'Novos lançamentos'],
  ['em-alta', 'Em alta'],
]

export const SORT_LABELS: Record<CatalogSort, string> = {
  recentes: 'Listados recentemente',
  'menor-preco': 'Menor preço',
  'maior-preco': 'Maior preço',
}

export const RARITY_LABELS: Record<NftRarity, string | null> = {
  common: null,
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
}

/** "0,02" — o Figma mostra a faixa de preço com vírgula decimal. */
export const ethWithComma = (value: string) => value.replace('.', ',')
