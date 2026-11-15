import { describe, expect, it } from 'vitest'
import { createMockRuntime } from './runtime'
import { createScenarioDb } from './scenarios'
import { createMemoryStorage } from './storage'

function createRuntime(storage = createMemoryStorage()) {
  return createMockRuntime({
    storage,
    apiUrl: '/api',
    socketPath: '/realtime/',
  })
}

describe('createMockRuntime', () => {
  it('começa no cenário padrão com a latência de 200–400 ms', () => {
    const state = createRuntime().control.getState()

    expect(state.scenarioId).toBe('default')
    expect(state.latency).toEqual({ kind: 'range', minMs: 200, maxMs: 400 })
    expect(state.faults).toEqual([])
    expect(state.counts.nfts).toBe(createScenarioDb('default').nfts.length)
  })

  it('troca de cenário restaura os dados dele e aplica as falhas', () => {
    const { control, store } = createRuntime()

    control.selectScenario('empty', 'none')
    expect(store.state.nfts).toEqual([])
    expect(control.getState().latency).toEqual({ kind: 'none' })

    control.selectScenario('offline')
    expect(store.state.nfts.length).toBeGreaterThan(0)
    expect(control.getState()).toMatchObject({
      scenarioId: 'offline',
      realtimeAvailable: false,
      faults: [{ effect: { kind: 'network-error' } }],
    })
  })

  it('reset desfaz alterações nos dados e preserva a latência', () => {
    const { control, store } = createRuntime()
    const [nft] = store.state.nfts
    control.setLatency('slow')
    control.updateNft(nft.id, { priceEth: '9.5' })
    control.addFault({
      id: 'x',
      path: '*',
      effect: { kind: 'http', status: 500 },
    })

    control.reset()

    expect(store.state).toEqual(createScenarioDb('default'))
    expect(control.getState().faults).toEqual([])
    expect(control.getState().latency).toEqual({ kind: 'fixed', ms: 2500 })
  })

  it('mantém cenário, configurações e dados após um refresh', () => {
    const storage = createMemoryStorage()
    const first = createRuntime(storage)
    first.control.selectScenario('flaky', 'none')
    const [nft] = first.store.state.nfts
    first.control.updateNft(nft.id, { available: { [nft.editions[0].id]: 0 } })

    const reloaded = createRuntime(storage)

    expect(reloaded.control.getState().scenarioId).toBe('flaky')
    expect(reloaded.control.getState().latency).toEqual({ kind: 'none' })
    expect(reloaded.store.state.nfts[0].editions[0].available).toBe(0)
  })

  it('updateNft valida antes de alterar e notifica a mudança', () => {
    const { control, store } = createRuntime()
    const [nft] = store.state.nfts
    const changes: Array<unknown> = []
    store.subscribe((c) => changes.push(...c))

    expect(() => control.updateNft(nft.id, { priceEth: '1,5' })).toThrow()
    expect(() =>
      control.updateNft(nft.id, { priceEth: '2', available: { nope: 1 } }),
    ).toThrow()
    expect(() => control.updateNft('inexistente', { priceEth: '2' })).toThrow()
    expect(store.state.nfts[0].priceEth).toBe(nft.priceEth)
    expect(changes).toEqual([])

    control.updateNft(nft.id, {
      priceEth: '2.5',
      available: { [nft.editions[1].id]: 999 },
    })

    expect(store.state.nfts[0].priceEth).toBe('2.5')
    expect(store.state.nfts[0].editions[1].available).toBe(
      nft.editions[1].supply,
    )
    expect(changes).toEqual([{ type: 'nft', id: nft.id, version: 2 }])
  })

  it('rejeita cenário desconhecido', () => {
    const { control } = createRuntime()

    expect(() => control.selectScenario('nope' as never)).toThrow()
    expect(control.getState().scenarioId).toBe('default')
  })
})
