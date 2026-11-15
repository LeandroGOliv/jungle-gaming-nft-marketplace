import { describe, expect, it } from 'vitest'
import { createDelayResolver, findFault, matchesPath } from './network'
import type { FaultRule } from '@/types/simulation'

describe('createDelayResolver', () => {
  it('não atrasa no perfil none', () => {
    const resolve = createDelayResolver(1)
    expect(resolve({ kind: 'none' }, 'GET /nfts')).toBe(0)
  })

  it('usa o valor do perfil fixed', () => {
    const resolve = createDelayResolver(1)
    expect(resolve({ kind: 'fixed', ms: 750 }, 'GET /nfts')).toBe(750)
  })

  it('sorteia dentro da faixa e repete a sequência com a mesma semente', () => {
    const profile = { kind: 'range', minMs: 200, maxMs: 400 } as const
    const first = createDelayResolver(42)
    const second = createDelayResolver(42)
    const a = Array.from({ length: 20 }, () => first(profile, 'GET /nfts'))
    const b = Array.from({ length: 20 }, () => second(profile, 'GET /nfts'))

    expect(a).toEqual(b)
    expect(a.every((ms) => ms >= 200 && ms <= 400)).toBe(true)
    expect(new Set(a).size).toBeGreaterThan(1)
  })

  it('alterna lenta e rápida por endpoint no perfil out-of-order', () => {
    const resolve = createDelayResolver(1)
    const profile = { kind: 'out-of-order', slowMs: 1500, fastMs: 100 } as const

    expect(resolve(profile, 'GET /nfts')).toBe(1500)
    expect(resolve(profile, 'GET /nfts/:id')).toBe(1500)
    expect(resolve(profile, 'GET /nfts')).toBe(100)
    expect(resolve(profile, 'GET /nfts')).toBe(1500)
  })
})

describe('matchesPath', () => {
  it('aceita curinga, parâmetros e caminhos exatos', () => {
    expect(matchesPath('*', '/nfts/abc')).toBe(true)
    expect(matchesPath('/nfts/:id', '/nfts/abc')).toBe(true)
    expect(matchesPath('/nfts/:id', '/nfts')).toBe(false)
    expect(matchesPath('/nfts', '/nfts')).toBe(true)
    expect(matchesPath('/nfts/*', '/nfts/abc/x')).toBe(true)
  })
})

describe('findFault', () => {
  const rule = (overrides: Partial<FaultRule>): FaultRule => ({
    id: 'r1',
    path: '*',
    effect: { kind: 'http', status: 503 },
    ...overrides,
  })

  it('casa por método e caminho', () => {
    const rules = [rule({ method: 'POST', path: '/favorites' })]
    const hits = {}

    expect(findFault(rules, hits, 'GET', '/favorites')).toBeUndefined()
    expect(findFault(rules, hits, 'POST', '/favorites')?.id).toBe('r1')
  })

  it('respeita skip e times', () => {
    const rules = [rule({ skip: 1, times: 2 })]
    const hits: Record<string, number> = {}
    const results = Array.from({ length: 5 }, () =>
      findFault(rules, hits, 'GET', '/nfts'),
    )

    expect(results.map((r) => r?.id ?? null)).toEqual([
      null,
      'r1',
      'r1',
      null,
      null,
    ])
    expect(hits.r1).toBe(5)
  })

  it('usa a primeira regra aplicável', () => {
    const rules = [
      rule({ id: 'a', path: '/nfts/:id' }),
      rule({ id: 'b', path: '*' }),
    ]
    expect(findFault(rules, {}, 'GET', '/nfts/1')?.id).toBe('a')
    expect(findFault(rules, {}, 'GET', '/cart')?.id).toBe('b')
  })
})
