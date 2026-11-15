import { describe, expect, it } from 'vitest'
import { describeReviewChanges, toReviewSnapshot } from './checkout-review'
import type { Cart, CartLine, CartQuote } from '@/types/cart'

const line = (overrides: Partial<CartLine> = {}): CartLine => ({
  nftId: 'emerald-ape-042',
  editionId: 'ed-50',
  quantity: 2,
  name: 'Emerald Ape #042',
  tokenId: '#0042',
  editionLabel: '1/50',
  image: { alt: '', smallUrl: '', largeUrl: '' },
  unitPriceEth: '1.19',
  lineTotalEth: '2.38',
  available: 32,
  ...overrides,
})

const cart = (items: Array<CartLine>, version = 3): Cart => ({
  guestCartId: null,
  items,
  couponCode: 'KURIO10',
  itemCount: items.reduce((n, l) => n + l.quantity, 0),
  version,
})

const quote = (overrides: Partial<CartQuote> = {}): CartQuote => ({
  cartVersion: 3,
  subtotalEth: '2.38',
  discountEth: '0.238',
  networkFeeEth: '0.016',
  totalEth: '2.158',
  coupon: {
    code: 'KURIO10',
    status: 'applied',
    message: '10% de desconto aplicado.',
  },
  issues: [],
  quotedAt: '2026-11-15T12:00:00.000Z',
  ...overrides,
})

describe('describeReviewChanges', () => {
  it('não acusa mudança quando só a hora da cotação muda', () => {
    const before = toReviewSnapshot(cart([line()]), quote())
    const after = toReviewSnapshot(
      cart([line()]),
      quote({ quotedAt: '2026-11-15T12:05:00.000Z' }),
    )
    expect(describeReviewChanges(before, after)).toEqual([])
  })

  it('compara valores em ETH sem depender da escrita', () => {
    const before = toReviewSnapshot(
      cart([line()]),
      quote({ totalEth: '2.158' }),
    )
    const after = toReviewSnapshot(
      cart([line()]),
      quote({ totalEth: '2.1580' }),
    )
    expect(describeReviewChanges(before, after)).toEqual([])
  })

  it('descreve preço e total alterados', () => {
    const before = toReviewSnapshot(cart([line()]), quote())
    const after = toReviewSnapshot(
      cart([line({ unitPriceEth: '1.44', lineTotalEth: '2.88' })]),
      quote({ subtotalEth: '2.88', discountEth: '0.288', totalEth: '2.608' }),
    )
    expect(describeReviewChanges(before, after)).toEqual([
      'Preço de Emerald Ape #042: de 1.19 ETH para 1.44 ETH.',
      'Desconto: de 0.238 ETH para 0.288 ETH.',
      'Total: de 2.158 ETH para 2.608 ETH.',
    ])
  })

  it('descreve edição esgotada e quantidade insuficiente', () => {
    const violet = line({
      nftId: 'violet-nomad-314',
      editionId: 'ed-10',
      name: 'Violet Nomad #314',
      editionLabel: '1/10',
      quantity: 3,
    })
    const before = toReviewSnapshot(cart([line(), violet]), quote())
    const after = toReviewSnapshot(
      cart([line(), violet]),
      quote({
        issues: [
          {
            nftId: 'emerald-ape-042',
            editionId: 'ed-50',
            kind: 'unavailable',
            available: 0,
          },
          {
            nftId: 'violet-nomad-314',
            editionId: 'ed-10',
            kind: 'insufficient',
            available: 1,
          },
        ],
      }),
    )
    expect(describeReviewChanges(before, after)).toEqual([
      'A edição 1/50 de Emerald Ape #042 esgotou.',
      'Só resta 1 unidade da edição 1/10 de Violet Nomad #314.',
    ])
  })

  it('descreve cupom que deixou de valer', () => {
    const before = toReviewSnapshot(cart([line()]), quote())
    const after = toReviewSnapshot(
      cart([line()]),
      quote({
        discountEth: '0',
        totalEth: '2.396',
        coupon: {
          code: 'KURIO10',
          status: 'expired',
          message: 'O código KURIO10 expirou.',
        },
      }),
    )
    expect(describeReviewChanges(before, after)).toEqual([
      'O código KURIO10 expirou.',
      'Desconto: de 0.238 ETH para 0.00 ETH.',
      'Total: de 2.158 ETH para 2.396 ETH.',
    ])
  })

  it('descreve itens e quantidades alterados no carrinho', () => {
    const violet = line({
      nftId: 'violet-nomad-314',
      name: 'Violet Nomad #314',
    })
    const before = toReviewSnapshot(cart([line(), violet]), quote())
    const after = toReviewSnapshot(
      cart([line({ quantity: 1 })], 4),
      quote({ cartVersion: 4 }),
    )
    expect(describeReviewChanges(before, after)).toEqual([
      'Quantidade de Emerald Ape #042: de 2 para 1.',
      'Violet Nomad #314 saiu do pedido.',
    ])
  })

  it('descreve taxa de rede alterada', () => {
    const before = toReviewSnapshot(cart([line()]), quote())
    const after = toReviewSnapshot(
      cart([line()]),
      quote({ networkFeeEth: '0.02', totalEth: '2.162' }),
    )
    expect(describeReviewChanges(before, after)).toEqual([
      'Taxa de rede: de 0.016 ETH para 0.02 ETH.',
      'Total: de 2.158 ETH para 2.162 ETH.',
    ])
  })
})
