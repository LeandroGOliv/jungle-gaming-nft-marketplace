import { describe, expect, it } from 'vitest'
import { quoteCart } from './cart'
import {
  orderRequestFingerprint,
  parseCollectorInput,
  parseConnectionRequest,
  prepareOrder,
  validateCollectorInput,
} from './checkout'
import { createScenarioDb } from './scenarios'
import type { WalletConnectionRecord } from './db'
import type { CollectorInput, CreateOrderRequest } from '@/types/checkout'

const NOW = Date.parse('2026-11-15T12:00:00.000Z')
const ADDRESS = '0xA91F3c6B2d8E4a7F0b19C5e3D62f8A4b7c1DE82C'

const collector: CollectorInput = {
  displayName: 'Nova Sato',
  username: 'novasato',
  network: 'ethereum',
  profileName: 'novasato',
  walletAddress: ADDRESS,
  secondaryAddress: null,
  provider: 'metamask',
  referralCode: 'KURIO2026',
  email: 'nova@colecionador.test',
  ensName: 'nova',
  note: null,
}

const connection: WalletConnectionRecord = {
  id: 'wcn_1',
  userId: 'usr_nova',
  walletAddress: ADDRESS,
  network: 'ethereum',
  provider: 'metamask',
  status: 'connected',
  connectedAt: '2026-11-15T11:59:00.000Z',
  version: 1,
  updatedAt: '2026-11-15T11:59:00.000Z',
}

function setup() {
  const db = createScenarioDb('checkout')
  const cart = db.carts.usr_nova
  const quote = quoteCart(cart, db.nfts, db.coupons, NOW)
  const request: CreateOrderRequest = {
    connectionId: connection.id,
    walletId: 'wal_nova_primary',
    collector,
    quote: { cartVersion: quote.cartVersion, totalEth: quote.totalEth },
  }
  const context = {
    userId: 'usr_nova',
    orderId: 'ord_0100',
    idempotencyKey: 'key-1',
    request,
    connection,
    cart,
    nfts: db.nfts,
    coupons: db.coupons,
    now: NOW,
  }
  return { db, quote, request, context }
}

describe('parseCollectorInput / validateCollectorInput', () => {
  it('normaliza e aceita dados válidos', () => {
    const input = parseCollectorInput({
      ...collector,
      username: ' NovaSato ',
      referralCode: 'kurio2026',
      note: '   ',
    })
    expect(input.username).toBe('novasato')
    expect(input.referralCode).toBe('KURIO2026')
    expect(input.note).toBeNull()
    expect(validateCollectorInput(input)).toEqual({})
  })

  it('aponta cada campo inválido', () => {
    const errors = validateCollectorInput(
      parseCollectorInput({
        ...collector,
        walletAddress: '0x12',
        referralCode: 'NAOEXISTE',
        note: 'x'.repeat(281),
      }),
    )
    expect(Object.keys(errors).sort()).toEqual(
      ['note', 'referralCode', 'walletAddress'].sort(),
    )
  })
})

describe('parseConnectionRequest', () => {
  it('recusa endereço, rede ou provedor inválidos', () => {
    expect(
      parseConnectionRequest({
        walletAddress: ADDRESS,
        network: 'ethereum',
        provider: 'metamask',
      }),
    ).not.toBeNull()
    expect(
      parseConnectionRequest({
        walletAddress: ADDRESS,
        network: 'solana',
        provider: 'metamask',
      }),
    ).toBeNull()
  })
})

describe('prepareOrder', () => {
  it('cria o snapshot pendente com os valores da cotação', () => {
    const { context, quote } = setup()
    const result = prepareOrder(context)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.order).toMatchObject({
      id: 'ord_0100',
      status: 'pending',
      totalEth: quote.totalEth,
      couponCode: 'KURIO10',
      walletAddress: ADDRESS,
      collector,
    })
    expect(result.order.items).toHaveLength(2)
  })

  it('recusa total diferente do revisado (preço mudou)', () => {
    const { context } = setup()
    context.nfts.find((n) => n.id === 'emerald-ape-042')!.priceEth = '9'
    expect(prepareOrder(context)).toMatchObject({
      ok: false,
      status: 409,
      reason: 'QUOTE_CHANGED',
    })
  })

  it('recusa edição esgotada', () => {
    const { context } = setup()
    const nft = context.nfts.find((n) => n.id === 'violet-nomad-314')!
    nft.editions.find((e) => e.id === 'ed-10')!.available = 0
    expect(prepareOrder(context)).toMatchObject({ reason: 'QUOTE_CHANGED' })
  })

  it('recusa cupom que expirou depois da revisão', () => {
    const { context } = setup()
    context.coupons.find((c) => c.code === 'KURIO10')!.expiresAt = new Date(
      NOW - 1,
    ).toISOString()
    expect(prepareOrder(context)).toMatchObject({ reason: 'QUOTE_CHANGED' })
  })

  it('exige conexão ativa da mesma carteira e do mesmo usuário', () => {
    const { context } = setup()
    expect(
      prepareOrder({
        ...context,
        connection: { ...connection, status: 'disconnected' },
      }),
    ).toMatchObject({ reason: 'WALLET_NOT_CONNECTED' })
    expect(
      prepareOrder({
        ...context,
        connection: { ...connection, userId: 'usr_rafael' },
      }),
    ).toMatchObject({ reason: 'WALLET_NOT_CONNECTED' })
    expect(
      prepareOrder({
        ...context,
        connection: { ...connection, network: 'polygon' },
      }),
    ).toMatchObject({ reason: 'WALLET_NOT_CONNECTED' })
  })

  it('valida o colecionador antes do resto', () => {
    const { context, request } = setup()
    const result = prepareOrder({
      ...context,
      request: { ...request, collector: { ...collector, email: 'x' } },
    })
    expect(result).toMatchObject({
      status: 422,
      fieldErrors: { email: expect.any(String) },
    })
  })

  it('recusa carrinho vazio', () => {
    const { context } = setup()
    expect(
      prepareOrder({
        ...context,
        cart: { items: [], couponCode: null, version: 2 },
      }),
    ).toMatchObject({ reason: 'CART_EMPTY' })
  })
})

describe('orderRequestFingerprint', () => {
  it('ignora a conexão e muda com o conteúdo', () => {
    const { request } = setup()
    const base = orderRequestFingerprint(request)
    expect(orderRequestFingerprint({ ...request, connectionId: 'outra' })).toBe(
      base,
    )
    expect(
      orderRequestFingerprint({
        ...request,
        quote: { ...request.quote, totalEth: '1' },
      }),
    ).not.toBe(base)
  })
})
