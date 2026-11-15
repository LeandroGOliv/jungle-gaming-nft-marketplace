import type {
  BlockchainNetwork,
  EditionLabel,
  Nft,
  NftCategory,
  NftCollection,
  NftCreator,
  NftEdition,
  NftImage,
  NftRarity,
} from '@/types/nft'

/** O Figma tem quatro artes únicas; os NFTs as reutilizam. */
type Artwork = 'emerald' | 'violet' | 'ivory' | 'golden'

const ARTWORK_ALT: Record<Artwork, string> = {
  emerald:
    'Retrato ilustrado de um macaco com jaqueta college verde e óculos redondos',
  violet:
    'Retrato ilustrado de um macaco grisalho com moletom roxo e chapéu bucket',
  ivory:
    'Retrato ilustrado de um macaco de pelo escuro com blazer creme e gola alta verde',
  golden:
    'Retrato ilustrado de um macaco dourado com fones de ouvido verdes e jaqueta clara',
}

const ARTWORKS: Array<Artwork> = ['emerald', 'violet', 'ivory', 'golden']

interface CollectionSpec extends NftCollection {
  creator: NftCreator
  network: BlockchainNetwork
  contractAddress: string
}

const COLLECTIONS = {
  kurio: {
    id: 'kurio-editions',
    name: 'Kurio Editions',
    creator: { name: 'Nova Sato', handle: 'novasato' },
    network: 'ethereum',
    contractAddress: '0x7A42c3D9e1B5f08A6E2d4C7b91F3a5E0d8C219E8',
  },
  genesis: {
    id: 'genesis-drops',
    name: 'Genesis Drops',
    creator: { name: 'Iara Mendes', handle: 'iaramendes' },
    network: 'ethereum',
    contractAddress: '0x5C19aE07b3D4f2C8e6A1B90d7F3c2E4a8B6D10F4',
  },
  curated: {
    id: 'curated-art',
    name: 'Curated Art',
    creator: { name: 'Theo Kanji', handle: 'theokanji' },
    network: 'ethereum',
    contractAddress: '0x9E3b71Fd0A2c6E8b4D5f1C7a93B0e2D6c4A85B21',
  },
  jungle: {
    id: 'jungle-signals',
    name: 'Jungle Signals',
    creator: { name: 'Luna Arce', handle: 'lunaarce' },
    network: 'polygon',
    contractAddress: '0x2F8d64C1e9A0b3D7f5E2c8B1a6D490e3F7C5A6D3',
  },
} satisfies Record<string, CollectionSpec>

type CollectionKey = keyof typeof COLLECTIONS

/**
 * Disponibilidade das edições 1/1, 1/10 e 1/50, nessa ordem; `-` indica que o
 * NFT não oferece a edição. Ex.: `'1,7,32'`, `'-,0,0'`.
 */
type EditionSpec = `${string},${string},${string}`

type NftSpec = [
  name: string,
  token: string,
  artwork: Artwork,
  collection: CollectionKey,
  category: NftCategory,
  priceEth: string,
  editions: EditionSpec,
  rarity: NftRarity,
  featured?: boolean,
]

// Os quatro primeiros e os preços seguem o Figma (cards, carrinho e recibo).
// prettier-ignore
const SPECS: Array<NftSpec> = [
  ['Emerald Ape', '042', 'emerald', 'kurio', 'art', '1.19', '1,7,32', 'rare', true],
  ['Violet Nomad', '314', 'violet', 'kurio', 'collectible', '1.39', '-,4,18', 'rare'],
  ['Ivory Baron', '088', 'ivory', 'kurio', 'art', '1.79', '0,5,40', 'epic'],
  ['Golden Beat', '207', 'golden', 'genesis', 'music', '0.99', '-,2,12', 'common'],
  ['Sage Nomad', '009', 'emerald', 'genesis', 'collectible', '1.29', '-,-,21', 'common'],
  ['Golden Signal', '160', 'golden', 'jungle', 'music', '1.69', '1,6,-', 'rare'],
  ['Cosmic Bloom', '118', 'violet', 'curated', 'art', '0.39', '-,0,0', 'common'],
  ['Neon Vessel', '552', 'violet', 'curated', 'gaming', '1.99', '1,3,9', 'legendary', true],
  ['Pearl Envoy', '071', 'ivory', 'curated', 'photography', '2.29', '-,8,44', 'rare'],
  ['Jade Rhythm', '233', 'emerald', 'jungle', 'music', '0.59', '-,-,37', 'common'],
  ['Amber Pulse', '405', 'golden', 'jungle', 'music', '0.84', '-,9,0', 'common'],
  ['Lilac Drifter', '129', 'violet', 'genesis', 'collectible', '0.45', '-,10,50', 'common'],
  ['Linen Count', '302', 'ivory', 'kurio', 'art', '3.15', '1,2,-', 'epic'],
  ['Moss Sentinel', '017', 'emerald', 'genesis', 'gaming', '0.72', '-,6,29', 'common'],
  ['Honey Static', '388', 'golden', 'jungle', 'music', '1.05', '-,1,15', 'rare'],
  ['Plum Wanderer', '246', 'violet', 'kurio', 'collectible', '0.95', '-,-,8', 'common'],
  ['Cream Regent', '011', 'ivory', 'curated', 'art', '4.40', '1,-,-', 'legendary'],
  ['Fern Courier', '194', 'emerald', 'jungle', 'photography', '0.27', '-,-,46', 'common'],
  ['Saffron Echo', '461', 'golden', 'genesis', 'music', '2.05', '0,4,-', 'epic'],
  ['Orchid Ranger', '077', 'violet', 'curated', 'gaming', '1.12', '-,7,33', 'rare'],
  ['Bone Diplomat', '355', 'ivory', 'genesis', 'photography', '0.68', '-,0,0', 'common'],
  ['Ivy Scout', '128', 'emerald', 'kurio', 'collectible', '0.33', '-,-,50', 'common'],
  ['Brass Tempo', '509', 'golden', 'curated', 'music', '1.47', '-,5,27', 'rare'],
  ['Mauve Pilgrim', '260', 'violet', 'jungle', 'collectible', '0.21', '-,-,41', 'common'],
  ['Chalk Marquis', '143', 'ivory', 'jungle', 'art', '2.89', '1,3,-', 'epic'],
  ['Clover Warden', '398', 'emerald', 'curated', 'gaming', '1.58', '-,6,19', 'rare'],
  ['Topaz Groove', '036', 'golden', 'kurio', 'music', '0.77', '-,10,0', 'common'],
  ['Iris Voyager', '421', 'violet', 'genesis', 'photography', '0.12', '-,-,50', 'common'],
  ['Alabaster Duke', '099', 'ivory', 'curated', 'art', '8.92', '1,2,-', 'legendary', true],
  ['Pine Keeper', '271', 'emerald', 'genesis', 'gaming', '0.49', '-,8,36', 'common'],
  ['Gilded Chorus', '333', 'golden', 'curated', 'music', '3.30', '0,1,-', 'epic'],
  ['Amethyst Rover', '187', 'violet', 'kurio', 'gaming', '0.88', '0,0,0', 'rare'],
  ['Opal Consul', '415', 'ivory', 'jungle', 'photography', '1.24', '-,4,22', 'rare'],
  ['Basil Watcher', '062', 'emerald', 'jungle', 'collectible', '0.18', '-,-,12', 'common'],
  ['Marigold Riff', '290', 'golden', 'genesis', 'music', '0.63', '-,9,31', 'common'],
  ['Lavender Nomad', '504', 'violet', 'curated', 'collectible', '1.36', '-,3,17', 'rare'],
  ['Porcelain Earl', '176', 'ivory', 'genesis', 'art', '5.75', '1,1,-', 'epic'],
  ['Olive Guardian', '348', 'emerald', 'curated', 'gaming', '2.12', '-,5,0', 'rare'],
  ['Citrine Cadence', '023', 'golden', 'kurio', 'music', '0.05', '-,-,49', 'common'],
  ['Velvet Wayfarer', '437', 'violet', 'jungle', 'photography', '0.99', '-,7,28', 'common'],
]

const EDITION_LABELS: Array<EditionLabel> = ['1/1', '1/10', '1/50']

function parseEditions(spec: EditionSpec): Array<NftEdition> {
  return spec.split(',').flatMap((value, index) => {
    if (value === '-') return []
    const label = EDITION_LABELS[index]
    const supply = Number(label.split('/')[1])
    return [{ id: `ed-${supply}`, label, supply, available: Number(value) }]
  })
}

function artworkImage(artwork: Artwork, name: string): NftImage {
  return {
    alt: `${name}: ${ARTWORK_ALT[artwork].toLowerCase()}`,
    smallUrl: `/images/nft-artwork-${artwork}-400.webp`,
    largeUrl: `/images/nft-artwork-${artwork}-800.webp`,
  }
}

/** Principal + as outras três artes, como na galeria do detalhe no Figma. */
function gallery(artwork: Artwork, name: string) {
  const others = ARTWORKS.filter((a) => a !== artwork)
  return [artwork, ...others].map((a) => artworkImage(a, name))
}

const FIGMA_DESCRIPTION =
  'Emerald Ape #042 é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.\n\nA propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.'

const FIGMA_SUMMARY =
  'Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.'

function summarize(collection: CollectionSpec) {
  const network = collection.network === 'polygon' ? 'Polygon' : 'Ethereum'
  return `Um colecionável digital finalizado à mão da coleção ${collection.name}, verificado na ${network}, com arte desbloqueável e acesso para colecionadores.`
}

function describe(
  title: string,
  collection: CollectionSpec,
  royaltyPercent: number,
) {
  const network = collection.network === 'polygon' ? 'Polygon' : 'Ethereum'
  return `${title} é um colecionável digital finalizado à mão da coleção ${collection.name}, verificado na ${network}, com arte desbloqueável e acesso para colecionadores.\n\nA propriedade inclui a arte em alta resolução e um registro permanente de procedência na rede. ${collection.creator.name} recebe ${royaltyPercent}% de direitos autorais nas vendas secundárias.`
}

const DAY_MS = 86_400_000
const FIRST_LISTING = Date.parse('2026-01-06T12:00:00.000Z')

function buildNft(spec: NftSpec, index: number): Nft {
  const [
    name,
    token,
    artwork,
    collectionKey,
    category,
    priceEth,
    editions,
    rarity,
    featured,
  ] = spec
  const collection = COLLECTIONS[collectionKey]
  const title = `${name} #${token}`
  const royaltyPercent = collectionKey === 'kurio' ? 5 : 2.5 + (index % 3) * 2.5
  // Listagens a cada 6 dias, alternando a ordem para não coincidir com o índice.
  const listedAt = new Date(
    FIRST_LISTING + ((index * 17) % SPECS.length) * 6 * DAY_MS,
  ).toISOString()

  return {
    id: `${name.toLowerCase().replace(/\s+/g, '-')}-${token}`,
    tokenId: `#${token.padStart(4, '0')}`,
    name: title,
    summary: index === 0 ? FIGMA_SUMMARY : summarize(collection),
    description:
      index === 0
        ? FIGMA_DESCRIPTION
        : describe(title, collection, royaltyPercent),
    collection: { id: collection.id, name: collection.name },
    category,
    creator: collection.creator,
    rarity,
    priceEth,
    editions: parseEditions(editions),
    images: gallery(artwork, title),
    network: collection.network,
    contractAddress: collection.contractAddress,
    royaltyPercent,
    rating:
      index === 0 ? 4.8 : Number((3.6 + ((index * 7) % 15) / 10).toFixed(1)),
    reviewCount: index === 0 ? 19 : 3 + ((index * 11) % 60),
    featured: featured === true,
    trendingScore: (index * 37) % 100,
    listedAt,
    updatedAt: listedAt,
    version: 1,
  }
}

export const nftFixtures: Array<Nft> = SPECS.map(buildNft)
