import { describe, expect, it } from 'vitest'
import { createScenarioDb } from '../scenarios'

const ETH = /^\d+(\.\d{1,18})?$/

describe('fixtures', () => {
  const db = createScenarioDb('default')

  it('têm NFTs suficientes para pelo menos três páginas de 12', () => {
    expect(db.nfts.length).toBeGreaterThanOrEqual(36)
  })

  it('têm ids únicos e valores em ETH como string decimal', () => {
    expect(new Set(db.nfts.map((n) => n.id)).size).toBe(db.nfts.length)
    for (const nft of db.nfts) {
      expect(nft.priceEth).toMatch(ETH)
      expect(nft.editions.length).toBeGreaterThan(0)
      expect(nft.images.length).toBeGreaterThan(0)
    }
  })

  it('variam coleção, categoria, raridade, rede e faixa de preço', () => {
    const distinct = <T>(values: Array<T>) => new Set(values).size

    expect(
      distinct(db.nfts.map((n) => n.collection.id)),
    ).toBeGreaterThanOrEqual(4)
    expect(distinct(db.nfts.map((n) => n.category))).toBe(5)
    expect(distinct(db.nfts.map((n) => n.rarity))).toBe(4)
    expect(distinct(db.nfts.map((n) => n.network))).toBe(2)

    const prices = db.nfts.map((n) => Number(n.priceEth))
    expect(prices.some((p) => p < 0.5)).toBe(true)
    expect(prices.some((p) => p >= 0.5 && p < 2)).toBe(true)
    expect(prices.some((p) => p >= 2)).toBe(true)
  })

  it('cobrem edições indisponíveis e NFTs esgotados', () => {
    const soldOut = db.nfts.filter((n) =>
      n.editions.every((e) => e.available === 0),
    )
    const partiallyUnavailable = db.nfts.filter(
      (n) =>
        n.editions.some((e) => e.available === 0) &&
        n.editions.some((e) => e.available > 0),
    )

    expect(soldOut.length).toBeGreaterThanOrEqual(2)
    expect(partiallyUnavailable.length).toBeGreaterThanOrEqual(2)
    for (const nft of db.nfts) {
      for (const edition of nft.editions) {
        expect(edition.available).toBeLessThanOrEqual(edition.supply)
      }
    }
  })

  it('têm destaques', () => {
    expect(db.nfts.filter((n) => n.featured).length).toBeGreaterThanOrEqual(2)
  })

  it('têm dois usuários com carteiras, favoritos e pedidos distintos', () => {
    const [a, b] = db.users

    expect(db.users).toHaveLength(2)
    expect(a.id).not.toBe(b.id)
    expect(db.wallets[a.id]).not.toEqual(db.wallets[b.id])
    expect(db.favorites[a.id]).not.toEqual(db.favorites[b.id])
    expect(db.orders.filter((o) => o.userId === a.id).length).toBeGreaterThan(0)
    expect(db.orders.filter((o) => o.userId === b.id).length).toBeGreaterThan(0)

    const nftIds = new Set(db.nfts.map((n) => n.id))
    for (const ids of Object.values(db.favorites)) {
      for (const id of ids) expect(nftIds.has(id)).toBe(true)
    }
  })

  it('o cenário vazio não tem NFTs mas mantém os usuários', () => {
    const empty = createScenarioDb('empty')

    expect(empty.nfts).toEqual([])
    expect(empty.users).toHaveLength(2)
  })
})
