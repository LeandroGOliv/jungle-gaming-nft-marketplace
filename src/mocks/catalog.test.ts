import { describe, expect, it } from 'vitest'
import { listNfts, parseNftListQuery, relatedNfts } from './catalog'
import { nftFixtures } from './fixtures/nfts'
import type { NftListQuery } from '@/types/nft'
import { compareEth } from '@/utils/eth'

const base: NftListQuery = {
  tab: 'all',
  sort: 'recent',
  page: 1,
  pageSize: 9,
}

const list = (query: Partial<NftListQuery>) =>
  listNfts(nftFixtures, { ...base, ...query })

describe('parseNftListQuery', () => {
  it('aplica os padrões quando a query está vazia', () => {
    expect(parseNftListQuery(new URLSearchParams())).toEqual({
      ok: true,
      query: base,
    })
  })

  it('lê todos os parâmetros', () => {
    const params = new URLSearchParams({
      search: ' ape ',
      category: 'art',
      network: 'polygon',
      minPrice: '0.5',
      maxPrice: '2',
      tab: 'trending',
      sort: 'price-desc',
      page: '2',
      pageSize: '12',
    })
    expect(parseNftListQuery(params)).toEqual({
      ok: true,
      query: {
        search: 'ape',
        category: 'art',
        network: 'polygon',
        minPrice: '0.5',
        maxPrice: '2',
        tab: 'trending',
        sort: 'price-desc',
        page: 2,
        pageSize: 12,
      },
    })
  })

  it('recusa parâmetros inválidos com erro por campo', () => {
    const result = parseNftListQuery(
      new URLSearchParams({
        category: 'pintura',
        minPrice: '1,5',
        page: '0',
        pageSize: '500',
        sort: 'random',
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(Object.keys(result.fieldErrors).sort()).toEqual([
      'category',
      'minPrice',
      'page',
      'pageSize',
      'sort',
    ])
  })

  it('recusa faixa de preço invertida', () => {
    const result = parseNftListQuery(
      new URLSearchParams({ minPrice: '3', maxPrice: '1' }),
    )
    expect(result.ok).toBe(false)
  })
})

describe('listNfts', () => {
  it('pagina e informa o total', () => {
    const first = list({})
    expect(first.items).toHaveLength(9)
    expect(first.total).toBe(nftFixtures.length)
    expect(first.totalPages).toBe(Math.ceil(nftFixtures.length / 9))

    const last = list({ page: first.totalPages })
    expect(last.items).toHaveLength(nftFixtures.length % 9 || 9)
  })

  it('devolve página vazia além do fim, mantendo o total', () => {
    const result = list({ page: 99 })
    expect(result.items).toEqual([])
    expect(result.total).toBe(nftFixtures.length)
  })

  it('busca no nome, na coleção e no criador, sem diferenciar caixa e acento', () => {
    expect(list({ search: 'emerald' }).items.map((n) => n.name)).toEqual([
      'Emerald Ape #042',
    ])
    expect(list({ search: 'GENESIS', pageSize: 48 }).total).toBe(
      nftFixtures.filter((n) => n.collection.id === 'genesis-drops').length,
    )
    expect(list({ search: 'íara' }).total).toBeGreaterThan(0)
  })

  it('combina filtros', () => {
    const { items } = list({
      category: 'music',
      network: 'polygon',
      maxPrice: '1',
      pageSize: 48,
    })
    expect(items.length).toBeGreaterThan(0)
    for (const nft of items) {
      expect(nft.category).toBe('music')
      expect(nft.network).toBe('polygon')
      expect(compareEth(nft.priceEth, '1')).toBeLessThanOrEqual(0)
    }
  })

  it('filtra a faixa de preço com os limites inclusivos', () => {
    const { items } = list({ minPrice: '1.19', maxPrice: '1.39', pageSize: 48 })
    const prices = items.map((n) => n.priceEth).sort()
    expect(prices).toContain('1.19')
    expect(prices).toContain('1.39')
    for (const price of prices) {
      expect(compareEth(price, '1.19')).toBeGreaterThanOrEqual(0)
      expect(compareEth(price, '1.39')).toBeLessThanOrEqual(0)
    }
  })

  it('ordena por preço e por recência', () => {
    const asc = list({ sort: 'price-asc', pageSize: 48 }).items
    for (let i = 1; i < asc.length; i++) {
      expect(compareEth(asc[i - 1].priceEth, asc[i].priceEth)).toBeLessThan(1)
    }
    const desc = list({ sort: 'price-desc', pageSize: 48 }).items
    expect(desc[0].priceEth).toBe(asc.at(-1)!.priceEth)

    const recent = list({ pageSize: 48 }).items
    for (let i = 1; i < recent.length; i++) {
      expect(recent[i - 1].listedAt >= recent[i].listedAt).toBe(true)
    }
  })

  it('recorta as abas Novos lançamentos e Em alta', () => {
    const all = list({ pageSize: 48 })
    const fresh = list({ tab: 'new', pageSize: 48 })
    const trending = list({ tab: 'trending', pageSize: 48 })
    expect(fresh.total).toBeGreaterThan(0)
    expect(fresh.total).toBeLessThan(all.total)
    expect(trending.total).toBeGreaterThan(0)
    expect(trending.total).toBeLessThan(all.total)
    for (const nft of trending.items)
      expect(nft.trendingScore).toBeGreaterThanOrEqual(70)
  })

  it('conta cada opção aplicando os outros filtros, menos o da dimensão', () => {
    const { facets, total } = list({ category: 'music', network: 'polygon' })
    const polygonMusic = facets.categories.music
    expect(polygonMusic).toBe(total)
    expect(facets.networks.polygon).toBe(total)
    expect(facets.networks.ethereum).toBe(
      nftFixtures.filter(
        (n) => n.category === 'music' && n.network === 'ethereum',
      ).length,
    )
  })

  it('filtra os destaques', () => {
    const { items } = list({ featured: true, pageSize: 48 })
    expect(items.length).toBe(nftFixtures.filter((n) => n.featured).length)
    expect(items.every((n) => n.featured)).toBe(true)
  })

  it('expõe a faixa de preço do catálogo inteiro', () => {
    const { facets } = list({ category: 'music' })
    expect(facets.priceRange).toEqual({ min: '0.05', max: '8.92' })
  })

  it('responde vazio sem quebrar quando não há NFTs', () => {
    const result = listNfts([], base)
    expect(result).toMatchObject({ items: [], total: 0, totalPages: 0 })
    expect(result.facets.priceRange).toEqual({ min: '0', max: '0' })
  })
})

describe('relatedNfts', () => {
  it('devolve até 5 NFTs da mesma coleção, sem o próprio, dos mais recentes', () => {
    const source = nftFixtures[0]
    const related = relatedNfts(nftFixtures, source.id)
    expect(related).toHaveLength(5)
    expect(related.map((n) => n.id)).not.toContain(source.id)
    for (const nft of related) {
      expect(nft.collection.id).toBe(source.collection.id)
    }
    const dates = related.map((n) => n.listedAt)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it('devolve lista vazia para um NFT inexistente', () => {
    expect(relatedNfts(nftFixtures, 'nao-existe')).toEqual([])
  })
})
