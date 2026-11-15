import { describe, expect, it } from 'vitest'
import {
  addCartItem,
  applyCoupon,
  emptyCart,
  mergeCarts,
  quoteCart,
  removeCartItem,
  setCartItemQuantity,
  toCart,
} from './cart'
import { couponFixtures } from './fixtures/coupons'
import { nftFixtures } from './fixtures/nfts'
import type { CartRecord } from './db'

const NOW = Date.parse('2026-11-15T12:00:00.000Z')
const nfts = () => structuredClone(nftFixtures)

function cartWith(...items: CartRecord['items']): CartRecord {
  return { items, couponCode: null, version: 1 }
}

describe('itens do carrinho', () => {
  it('inclui e soma a quantidade do mesmo NFT e edição', () => {
    const cart = emptyCart()
    const item = { nftId: 'emerald-ape-042', editionId: 'ed-50', quantity: 2 }
    expect(addCartItem(cart, nfts(), item).ok).toBe(true)
    expect(addCartItem(cart, nfts(), item).ok).toBe(true)
    expect(cart.items).toEqual([{ ...item, quantity: 4 }])
    expect(cart.version).toBe(3)
  })

  it('recusa passar das unidades disponíveis da edição', () => {
    const cart = cartWith({
      nftId: 'golden-beat-207',
      editionId: 'ed-10',
      quantity: 2,
    })
    const result = addCartItem(cart, nfts(), {
      nftId: 'golden-beat-207',
      editionId: 'ed-10',
      quantity: 1,
    })
    expect(result).toMatchObject({
      ok: false,
      status: 409,
      reason: 'CART_QUANTITY_UNAVAILABLE',
    })
    expect(cart.items[0].quantity).toBe(2)
  })

  it('recusa edição esgotada, inexistente e quantidade não inteira', () => {
    const cart = emptyCart()
    expect(
      addCartItem(cart, nfts(), {
        nftId: 'ivory-baron-088',
        editionId: 'ed-1',
        quantity: 1,
      }),
    ).toMatchObject({ ok: false, reason: 'CART_QUANTITY_UNAVAILABLE' })
    expect(
      addCartItem(cart, nfts(), {
        nftId: 'emerald-ape-042',
        editionId: 'ed-999',
        quantity: 1,
      }),
    ).toMatchObject({ ok: false, status: 404, reason: 'EDITION_NOT_FOUND' })
    expect(
      addCartItem(cart, nfts(), {
        nftId: 'emerald-ape-042',
        editionId: 'ed-50',
        quantity: 1.5,
      }),
    ).toMatchObject({ ok: false, status: 422 })
  })

  it('altera a quantidade dentro do disponível e remove o item', () => {
    const cart = cartWith({
      nftId: 'emerald-ape-042',
      editionId: 'ed-10',
      quantity: 1,
    })
    expect(
      setCartItemQuantity(cart, nfts(), 'emerald-ape-042', 'ed-10', 7).ok,
    ).toBe(true)
    expect(
      setCartItemQuantity(cart, nfts(), 'emerald-ape-042', 'ed-10', 8),
    ).toMatchObject({ ok: false, reason: 'CART_QUANTITY_UNAVAILABLE' })
    expect(
      setCartItemQuantity(cart, nfts(), 'emerald-ape-042', 'ed-10', 0),
    ).toMatchObject({ ok: false, status: 422 })
    expect(removeCartItem(cart, 'emerald-ape-042', 'ed-10').ok).toBe(true)
    expect(cart.items).toEqual([])
    expect(removeCartItem(cart, 'emerald-ape-042', 'ed-10')).toMatchObject({
      ok: false,
      reason: 'CART_ITEM_NOT_FOUND',
    })
  })

  it('monta as linhas com os dados atuais do catálogo', () => {
    const cart = toCart(
      cartWith({ nftId: 'violet-nomad-314', editionId: 'ed-50', quantity: 6 }),
      nfts(),
      null,
    )
    expect(cart.itemCount).toBe(6)
    expect(cart.items[0]).toMatchObject({
      name: 'Violet Nomad #314',
      tokenId: '#0314',
      editionLabel: '1/50',
      unitPriceEth: '1.39',
      lineTotalEth: '8.34',
      available: 18,
    })
  })
})

describe('mesclagem do visitante ao autenticar', () => {
  it('soma quantidades limitadas ao disponível e mantém o cupom do visitante', () => {
    const user = cartWith({
      nftId: 'golden-beat-207',
      editionId: 'ed-10',
      quantity: 1,
    })
    const guest: CartRecord = {
      items: [
        { nftId: 'golden-beat-207', editionId: 'ed-10', quantity: 2 },
        { nftId: 'emerald-ape-042', editionId: 'ed-50', quantity: 1 },
      ],
      couponCode: 'KURIO10',
      version: 4,
    }
    mergeCarts(user, guest, nfts())
    expect(user.items).toEqual([
      { nftId: 'golden-beat-207', editionId: 'ed-10', quantity: 2 },
      { nftId: 'emerald-ape-042', editionId: 'ed-50', quantity: 1 },
    ])
    expect(user.couponCode).toBe('KURIO10')
  })
})

describe('cupom', () => {
  const cart = () =>
    cartWith({ nftId: 'violet-nomad-314', editionId: 'ed-50', quantity: 1 })

  it('aplica código válido sem diferenciar maiúsculas', () => {
    const target = cart()
    expect(
      applyCoupon(target, nfts(), couponFixtures, ' kurio10 ', NOW),
    ).toEqual({ ok: true })
    expect(target.couponCode).toBe('KURIO10')
  })

  it('distingue código inválido, expirado e abaixo do mínimo', () => {
    expect(
      applyCoupon(cart(), nfts(), couponFixtures, 'NAOEXISTE', NOW),
    ).toMatchObject({ ok: false, status: 422, reason: 'COUPON_INVALID' })
    expect(
      applyCoupon(cart(), nfts(), couponFixtures, 'VERAO25', NOW),
    ).toMatchObject({ ok: false, status: 422, reason: 'COUPON_EXPIRED' })
    const small = cartWith({
      nftId: 'citrine-cadence-023',
      editionId: 'ed-50',
      quantity: 1,
    })
    expect(
      applyCoupon(small, nfts(), couponFixtures, 'GENESIS05', NOW),
    ).toMatchObject({ ok: false, reason: 'COUPON_MIN_SUBTOTAL' })
  })
})

describe('cotação', () => {
  it('reproduz o resumo do Figma: subtotal, taxa e total', () => {
    const quote = quoteCart(
      cartWith(
        { nftId: 'emerald-ape-042', editionId: 'ed-50', quantity: 2 },
        { nftId: 'violet-nomad-314', editionId: 'ed-50', quantity: 6 },
        { nftId: 'ivory-baron-088', editionId: 'ed-50', quantity: 9 },
      ),
      nfts(),
      couponFixtures,
      NOW,
    )
    expect(quote).toMatchObject({
      subtotalEth: '26.83',
      discountEth: '0',
      networkFeeEth: '0.016',
      totalEth: '26.846',
      coupon: null,
      issues: [],
    })
  })

  it('aplica desconto percentual e fixo', () => {
    const percent = cartWith({
      nftId: 'violet-nomad-314',
      editionId: 'ed-50',
      quantity: 6,
    })
    percent.couponCode = 'KURIO10'
    expect(quoteCart(percent, nfts(), couponFixtures, NOW)).toMatchObject({
      subtotalEth: '8.34',
      discountEth: '0.834',
      totalEth: '7.522',
      coupon: { code: 'KURIO10', status: 'applied' },
    })

    const fixed = cartWith({
      nftId: 'emerald-ape-042',
      editionId: 'ed-50',
      quantity: 1,
    })
    fixed.couponCode = 'GENESIS05'
    expect(quoteCart(fixed, nfts(), couponFixtures, NOW)).toMatchObject({
      discountEth: '0.05',
      totalEth: '1.156',
    })
  })

  it('revalida o cupom guardado e a disponibilidade', () => {
    const catalog = nfts()
    const cart = cartWith({
      nftId: 'citrine-cadence-023',
      editionId: 'ed-50',
      quantity: 2,
    })
    cart.couponCode = 'GENESIS05'
    catalog.find((n) => n.id === 'citrine-cadence-023')!.editions[0].available =
      1
    const quote = quoteCart(cart, catalog, couponFixtures, NOW)
    expect(quote.coupon).toMatchObject({ status: 'min-subtotal' })
    expect(quote.discountEth).toBe('0')
    expect(quote.issues).toEqual([
      {
        nftId: 'citrine-cadence-023',
        editionId: 'ed-50',
        kind: 'insufficient',
        available: 1,
      },
    ])
  })

  it('carrinho vazio não cobra taxa de rede', () => {
    expect(quoteCart(emptyCart(), nfts(), couponFixtures, NOW)).toMatchObject({
      subtotalEth: '0',
      networkFeeEth: '0',
      totalEth: '0',
    })
  })
})
