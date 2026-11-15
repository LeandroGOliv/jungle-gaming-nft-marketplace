import { describe, expect, it } from 'vitest'
import {
  applyOrderUpdate,
  formatOrderDate,
  isOrderUpdatedEvent,
  isTerminalOrder,
  shortenHash,
} from './order'
import type { Order } from '@/types/order'
import type { OrderUpdatedData, RealtimeEnvelope } from '@/types/realtime'

const pending = {
  id: 'ord_1',
  status: 'pending',
  transactionHash: null,
  refusalReason: null,
  updatedAt: '2026-11-15T12:00:00.000Z',
  version: 1,
} as Order

function event(
  version: number,
  data: Partial<OrderUpdatedData> = {},
): RealtimeEnvelope<OrderUpdatedData> {
  return {
    eventId: `evt_${version}`,
    resource: { type: 'order', id: 'ord_1' },
    version,
    emittedAt: '2026-11-15T12:00:03.000Z',
    data: {
      status: 'confirmed',
      transactionHash: '0xabc',
      refusalReason: null,
      updatedAt: '2026-11-15T12:00:03.000Z',
      ...data,
    },
  }
}

describe('applyOrderUpdate', () => {
  it('aplica o estado de uma versão mais nova', () => {
    const next = applyOrderUpdate(pending, event(2))
    expect(next).toMatchObject({
      status: 'confirmed',
      transactionHash: '0xabc',
      version: 2,
    })
  })

  it('ignora versão igual ou mais antiga', () => {
    expect(applyOrderUpdate(pending, event(1))).toBe(pending)
    const confirmed = applyOrderUpdate(pending, event(3))
    expect(applyOrderUpdate(confirmed, event(2, { status: 'pending' }))).toBe(
      confirmed,
    )
  })

  it('pedido terminal não regride nem troca de desfecho', () => {
    const confirmed = applyOrderUpdate(pending, event(2))
    expect(applyOrderUpdate(confirmed, event(5, { status: 'pending' }))).toBe(
      confirmed,
    )
    expect(applyOrderUpdate(confirmed, event(6, { status: 'refused' }))).toBe(
      confirmed,
    )
  })
})

describe('isTerminalOrder', () => {
  it('confirmado e recusado são terminais', () => {
    expect(isTerminalOrder('pending')).toBe(false)
    expect(isTerminalOrder('confirmed')).toBe(true)
    expect(isTerminalOrder('refused')).toBe(true)
  })
})

describe('isOrderUpdatedEvent', () => {
  it('aceita o contrato e recusa payloads malformados', () => {
    expect(isOrderUpdatedEvent(event(2))).toBe(true)
    expect(isOrderUpdatedEvent({ ...event(2), version: '2' })).toBe(false)
    expect(
      isOrderUpdatedEvent({ ...event(2), resource: { type: 'nft', id: 'x' } }),
    ).toBe(false)
    expect(
      isOrderUpdatedEvent({ ...event(2), data: { status: 'shipped' } }),
    ).toBe(false)
    expect(isOrderUpdatedEvent(null)).toBe(false)
  })
})

describe('shortenHash', () => {
  it('mantém os 4 primeiros e os 4 últimos dígitos', () => {
    expect(shortenHash('0xa91f3c6b2d8e4a7f0b19c5e3d62f8a4b7c1de82c')).toBe(
      '0xA91F…E82C',
    )
  })
})

describe('formatOrderDate', () => {
  it('segue o formato do recibo, no fuso local', () => {
    expect(formatOrderDate('2026-07-29T15:00:00.000Z')).toBe('29 Jul, 2026')
    expect(formatOrderDate('2026-02-03T15:00:00.000Z')).toBe('3 Fev, 2026')
  })
})
