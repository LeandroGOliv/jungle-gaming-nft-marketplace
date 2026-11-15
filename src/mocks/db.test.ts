import { describe, expect, it, vi } from 'vitest'
import { DB_SCHEMA_VERSION, MockStore } from './db'
import { createScenarioDb } from './scenarios'
import { createMemoryStorage } from './storage'

const KEY = 'test:db'

function createStore(storage = createMemoryStorage()) {
  return new MockStore({
    storage,
    key: KEY,
    seed: () => createScenarioDb('default'),
  })
}

describe('MockStore', () => {
  it('parte das fixtures quando não há estado salvo e persiste o seed', () => {
    const storage = createMemoryStorage()
    const store = createStore(storage)

    expect(store.state.nfts.length).toBeGreaterThan(0)
    expect(storage.getItem(KEY)).not.toBeNull()
  })

  it('recupera o estado salvo, como num refresh', () => {
    const storage = createMemoryStorage()
    const store = createStore(storage)
    const nftId = store.state.nfts[0].id

    store.write((db, tx) => {
      const nft = db.nfts.find((n) => n.id === nftId)!
      nft.priceEth = '9.99'
      tx.touch('nft', nft)
    })

    const reloaded = createStore(storage)
    expect(reloaded.state.nfts[0]).toMatchObject({
      id: nftId,
      priceEth: '9.99',
      version: 2,
    })
  })

  it('volta às fixtures se o estado salvo estiver corrompido ou em outra versão', () => {
    const storage = createMemoryStorage()
    storage.setItem(KEY, '{not json')
    expect(createStore(storage).state.nfts.length).toBeGreaterThan(0)

    storage.setItem(
      KEY,
      JSON.stringify({ schemaVersion: DB_SCHEMA_VERSION + 1, nfts: [] }),
    )
    expect(createStore(storage).state.nfts.length).toBeGreaterThan(0)
  })

  it('incrementa a versão e notifica o recurso alterado', () => {
    const store = createStore()
    const listener = vi.fn()
    store.subscribe(listener)
    const nftId = store.state.nfts[0].id

    store.write((db, tx) => {
      tx.touch('nft', db.nfts[0])
      tx.touch('nft', db.nfts[0])
    })

    expect(store.state.nfts[0].version).toBe(3)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith([
      { type: 'nft', id: nftId, version: 3 },
    ])
  })

  it('não notifica escrita sem alteração de recurso', () => {
    const store = createStore()
    const listener = vi.fn()
    store.subscribe(listener)

    store.write(() => undefined)

    expect(listener).not.toHaveBeenCalled()
  })

  it('replace restaura integralmente o cenário e avisa o reset', () => {
    const storage = createMemoryStorage()
    const store = createStore(storage)
    const listener = vi.fn()
    store.subscribe(listener)

    store.write((db, tx) => {
      db.nfts[0].priceEth = '0.01'
      tx.touch('nft', db.nfts[0])
      db.favorites = {}
    })
    store.replace(createScenarioDb('default'))

    expect(store.state).toEqual(createScenarioDb('default'))
    expect(createStore(storage).state).toEqual(createScenarioDb('default'))
    expect(listener).toHaveBeenLastCalledWith([{ type: 'reset' }])
  })

  it('não altera as fixtures originais ao escrever', () => {
    const store = createStore()

    store.write((db) => {
      db.nfts[0].priceEth = '0.01'
    })

    expect(createScenarioDb('default').nfts[0].priceEth).not.toBe('0.01')
  })

  it('gera ids sequenciais que sobrevivem ao refresh', () => {
    const storage = createMemoryStorage()
    const store = createStore(storage)
    const first = store.nextId('ord')
    const second = createStore(storage).nextId('ord')

    expect(first).not.toBe(second)
    expect(second).toMatch(/^ord_\d+$/)
  })

  it('cancela a assinatura', () => {
    const store = createStore()
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    unsubscribe()

    store.write((db, tx) => tx.touch('nft', db.nfts[0]))

    expect(listener).not.toHaveBeenCalled()
  })
})
