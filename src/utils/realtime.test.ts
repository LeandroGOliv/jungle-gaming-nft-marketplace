import { describe, expect, it } from 'vitest'
import {
  applyNftUpdate,
  createEventGate,
  describeCartChanges,
  describeNftChanges,
  isNftUpdatedEvent,
} from './realtime'
import type { CartLine } from '@/types/cart'
import type { Nft } from '@/types/nft'
import type { NftUpdatedData, RealtimeEnvelope } from '@/types/realtime'

function envelope(
  version: number,
  data: Partial<NftUpdatedData> = {},
  eventId = `evt_nft_a_v${version}`,
): RealtimeEnvelope<NftUpdatedData> {
  return {
    eventId,
    resource: { type: 'nft', id: 'a' },
    version,
    emittedAt: '2026-11-15T12:00:00.000Z',
    data: {
      priceEth: '1.5',
      editions: [
        { id: 'ed-1', available: 1 },
        { id: 'ed-10', available: 4 },
      ],
      ...data,
    },
  }
}

const nft = {
  id: 'a',
  name: 'Alpha',
  priceEth: '1.2',
  version: 2,
  updatedAt: '2026-11-01T00:00:00.000Z',
  editions: [
    { id: 'ed-1', label: '1/1', supply: 1, available: 1 },
    { id: 'ed-10', label: '1/10', supply: 10, available: 6 },
  ],
} as Nft

function line(overrides: Partial<CartLine> = {}): CartLine {
  return {
    nftId: 'a',
    editionId: 'ed-10',
    quantity: 2,
    name: 'Alpha',
    tokenId: '#0001',
    editionLabel: '1/10',
    image: { alt: '', smallUrl: '', largeUrl: '' },
    unitPriceEth: '1.2',
    lineTotalEth: '2.4',
    available: 6,
    ...overrides,
  }
}

describe('createEventGate', () => {
  it('aceita a primeira versão vista de um recurso', () => {
    expect(createEventGate().accept(envelope(3))).toBe(true)
  })

  it('descarta o mesmo evento entregue de novo', () => {
    const gate = createEventGate()
    gate.accept(envelope(3))
    expect(gate.accept(envelope(3))).toBe(false)
  })

  it('descarta versões não mais novas que a já aplicada, mesmo com outro id', () => {
    const gate = createEventGate()
    gate.accept(envelope(5))
    expect(gate.accept(envelope(4, {}, 'evt_other'))).toBe(false)
    expect(gate.accept(envelope(5, {}, 'evt_other'))).toBe(false)
    expect(gate.accept(envelope(6))).toBe(true)
  })

  it('usa a versão do dado em cache como piso quando ela é conhecida', () => {
    const gate = createEventGate()
    expect(gate.accept(envelope(2), 2)).toBe(false)
    expect(gate.accept(envelope(3), 2)).toBe(true)
  })

  it('o dado em cache prevalece sobre a memória: após um reset da API a versão pode recomeçar', () => {
    const gate = createEventGate()
    gate.accept(envelope(7, {}, 'evt_a'))
    expect(gate.accept(envelope(2, {}, 'evt_b'), 1)).toBe(true)
  })

  it('reset esquece versões e ids vistos', () => {
    const gate = createEventGate()
    gate.accept(envelope(3))
    gate.reset()
    expect(gate.accept(envelope(3))).toBe(true)
  })
})

describe('applyNftUpdate', () => {
  it('troca preço, disponibilidade e versão', () => {
    const next = applyNftUpdate(nft, envelope(3))
    expect(next.priceEth).toBe('1.5')
    expect(next.version).toBe(3)
    expect(next.updatedAt).toBe('2026-11-15T12:00:00.000Z')
    expect(next.editions.map((e) => e.available)).toEqual([1, 4])
    expect(next.editions[1].label).toBe('1/10')
    expect(nft.priceEth).toBe('1.2')
  })

  it('não regride um NFT mais novo', () => {
    expect(applyNftUpdate(nft, envelope(2))).toBe(nft)
    expect(applyNftUpdate(nft, envelope(1))).toBe(nft)
  })

  it('preserva edições que o evento não menciona', () => {
    const next = applyNftUpdate(
      nft,
      envelope(3, { editions: [{ id: 'ed-10', available: 0 }] }),
    )
    expect(next.editions.map((e) => e.available)).toEqual([1, 0])
  })
})

describe('describeNftChanges', () => {
  it('descreve preço novo e edição esgotada', () => {
    expect(
      describeNftChanges(
        nft,
        envelope(3, { editions: [{ id: 'ed-10', available: 0 }] }),
      ),
    ).toEqual([
      'O preço de Alpha mudou de 1.20 ETH para 1.50 ETH.',
      'A edição 1/10 de Alpha esgotou.',
    ])
  })

  it('não descreve nada quando os valores não mudaram', () => {
    expect(
      describeNftChanges(
        nft,
        envelope(3, {
          priceEth: '1.20',
          editions: [{ id: 'ed-10', available: 6 }],
        }),
      ),
    ).toEqual([])
  })
})

describe('describeCartChanges', () => {
  it('avisa sobre preço novo de um item do carrinho', () => {
    expect(describeCartChanges([line()], envelope(3))).toEqual([
      'O preço de Alpha mudou de 1.20 ETH para 1.50 ETH.',
    ])
  })

  it('avisa quando a edição do item esgota', () => {
    expect(
      describeCartChanges(
        [line()],
        envelope(3, {
          priceEth: '1.2',
          editions: [{ id: 'ed-10', available: 0 }],
        }),
      ),
    ).toEqual(['A edição 1/10 de Alpha esgotou.'])
  })

  it('avisa quando restam menos unidades que as do carrinho', () => {
    expect(
      describeCartChanges(
        [line({ quantity: 3 })],
        envelope(3, {
          priceEth: '1.2',
          editions: [{ id: 'ed-10', available: 1 }],
        }),
      ),
    ).toEqual(['Só resta 1 unidade da edição 1/10 de Alpha.'])
  })

  it('ignora queda de disponibilidade que ainda cobre a quantidade', () => {
    expect(
      describeCartChanges(
        [line({ quantity: 2 })],
        envelope(3, {
          priceEth: '1.2',
          editions: [{ id: 'ed-10', available: 2 }],
        }),
      ),
    ).toEqual([])
  })

  it('ignora NFTs que não estão no carrinho', () => {
    expect(describeCartChanges([line({ nftId: 'b' })], envelope(3))).toEqual([])
  })

  it('anuncia o preço uma vez quando o NFT tem várias edições no carrinho', () => {
    expect(
      describeCartChanges(
        [line(), line({ editionId: 'ed-1', editionLabel: '1/1', quantity: 1 })],
        envelope(3),
      ),
    ).toEqual(['O preço de Alpha mudou de 1.20 ETH para 1.50 ETH.'])
  })
})

describe('isNftUpdatedEvent', () => {
  it('aceita o envelope do contrato', () => {
    expect(isNftUpdatedEvent(envelope(3))).toBe(true)
  })

  it('recusa payloads fora do contrato', () => {
    expect(isNftUpdatedEvent(null)).toBe(false)
    expect(isNftUpdatedEvent({ ...envelope(3), version: '3' })).toBe(false)
    expect(
      isNftUpdatedEvent({
        ...envelope(3),
        resource: { type: 'order', id: 'a' },
      }),
    ).toBe(false)
    expect(isNftUpdatedEvent(envelope(3, { priceEth: '1,5' }))).toBe(false)
    expect(
      isNftUpdatedEvent({ ...envelope(3), data: { priceEth: '1.5' } }),
    ).toBe(false)
  })
})
