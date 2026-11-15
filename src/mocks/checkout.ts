import { quoteCart } from './cart'
import { referralCodeFixtures } from './fixtures/users'
import type { CouponRecord } from './fixtures/coupons'
import type { CartRecord, WalletConnectionRecord } from './db'
import type { ApiErrorStatus } from '@/types/api'
import type {
  CheckoutErrorReason,
  CollectorInput,
  CreateOrderRequest,
  CreateWalletConnectionRequest,
} from '@/types/checkout'
import { BLOCKCHAIN_NETWORKS } from '@/types/nft'
import type { Nft } from '@/types/nft'
import type { Order, OrderItem } from '@/types/order'
import { WALLET_PROVIDERS } from '@/types/wallet'
import { compareEth, multiplyEth } from '@/utils/eth'

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/
const ENS_FULL = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.eth$/
const ENS_LABEL = /^[a-z0-9-]{3,32}$/
const PROFILE_NAME = /^[a-z0-9._]{3,20}$/
const USERNAME = /^[a-z0-9._]{3,20}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NOTE_MAX = 280

type Body = Record<string, unknown>

const asBody = (value: unknown): Body =>
  typeof value === 'object' && value !== null ? (value as Body) : {}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

/** Corpo normalizado: o servidor não confia no formato que o cliente mandou. */
export function parseCollectorInput(body: unknown): CollectorInput {
  const raw = asBody(body)
  const secondary = text(raw.secondaryAddress)
  const note = text(raw.note)
  return {
    displayName: text(raw.displayName),
    username: text(raw.username).toLowerCase(),
    network: text(raw.network) as CollectorInput['network'],
    profileName: text(raw.profileName),
    walletAddress: text(raw.walletAddress),
    secondaryAddress: secondary === '' ? null : secondary,
    provider: text(raw.provider) as CollectorInput['provider'],
    referralCode: text(raw.referralCode).toUpperCase(),
    email: text(raw.email).toLowerCase(),
    ensName: text(raw.ensName).toLowerCase(),
    note: note === '' ? null : note,
  }
}

/** Mesmas regras do formulário, mais o código de indicação que só o servidor conhece. */
export function validateCollectorInput(input: CollectorInput) {
  const errors: Record<string, string> = {}
  if (input.displayName.length < 2 || input.displayName.length > 40) {
    errors.displayName = 'Use de 2 a 40 caracteres.'
  }
  if (!USERNAME.test(input.username)) {
    errors.username =
      'Use de 3 a 20 caracteres: letras minúsculas, números, ponto ou _.'
  }
  if (!BLOCKCHAIN_NETWORKS.includes(input.network)) {
    errors.network = 'Selecione uma rede.'
  }
  if (!PROFILE_NAME.test(input.profileName)) {
    errors.profileName =
      'Use de 3 a 20 caracteres: letras minúsculas, números, ponto ou _.'
  }
  if (!EVM_ADDRESS.test(input.walletAddress)) {
    errors.walletAddress =
      'Informe um endereço 0x com 40 caracteres hexadecimais.'
  }
  if (
    input.secondaryAddress !== null &&
    !EVM_ADDRESS.test(input.secondaryAddress) &&
    !ENS_FULL.test(input.secondaryAddress)
  ) {
    errors.secondaryAddress = 'Informe um nome ENS (.eth) ou um endereço 0x.'
  }
  if (!WALLET_PROVIDERS.includes(input.provider)) {
    errors.provider = 'Selecione o tipo de carteira.'
  }
  if (!referralCodeFixtures.includes(input.referralCode)) {
    errors.referralCode = 'Código de indicação inválido ou expirado.'
  }
  if (!EMAIL.test(input.email)) errors.email = 'Informe um e-mail válido.'
  if (!ENS_LABEL.test(input.ensName)) {
    errors.ensName =
      'Use de 3 a 32 caracteres: letras minúsculas, números ou -.'
  }
  if (input.note !== null && input.note.length > NOTE_MAX) {
    errors.note = `Use até ${NOTE_MAX} caracteres.`
  }
  return errors
}

export function parseConnectionRequest(
  body: unknown,
): CreateWalletConnectionRequest | null {
  const raw = asBody(body)
  const walletAddress = text(raw.walletAddress)
  const network = text(raw.network) as CreateWalletConnectionRequest['network']
  const provider = text(
    raw.provider,
  ) as CreateWalletConnectionRequest['provider']
  if (
    !EVM_ADDRESS.test(walletAddress) ||
    !BLOCKCHAIN_NETWORKS.includes(network) ||
    !WALLET_PROVIDERS.includes(provider)
  ) {
    return null
  }
  return { walletAddress, network, provider }
}

export function parseOrderRequest(body: unknown): CreateOrderRequest {
  const raw = asBody(body)
  const quote = asBody(raw.quote)
  const walletId = text(raw.walletId)
  return {
    connectionId: text(raw.connectionId),
    walletId: walletId === '' ? null : walletId,
    collector: parseCollectorInput(raw.collector),
    quote: {
      cartVersion:
        typeof quote.cartVersion === 'number' ? quote.cartVersion : -1,
      totalEth: text(quote.totalEth),
    },
  }
}

/**
 * Conteúdo que a chave de idempotência protege: repetir a chave com outro
 * conteúdo é conflito, não a mesma tentativa.
 */
export function orderRequestFingerprint(request: CreateOrderRequest) {
  return JSON.stringify([
    request.walletId,
    request.collector,
    request.quote.cartVersion,
    request.quote.totalEth,
  ])
}

export type OrderAttempt =
  | { ok: true; order: Order }
  | {
      ok: false
      status: ApiErrorStatus
      reason?: CheckoutErrorReason
      message: string
      fieldErrors?: Record<string, string>
    }

interface OrderContext {
  userId: string
  orderId: string
  idempotencyKey: string
  request: CreateOrderRequest
  connection: WalletConnectionRecord | undefined
  cart: CartRecord | undefined
  nfts: Array<Nft>
  coupons: Array<CouponRecord>
  now: number
}

/**
 * Valida o pedido contra o estado atual e monta o snapshot. A cotação é
 * recalculada aqui; se divergir da que o usuário revisou, nada é criado.
 */
export function prepareOrder({
  userId,
  orderId,
  idempotencyKey,
  request,
  connection,
  cart,
  nfts,
  coupons,
  now,
}: OrderContext): OrderAttempt {
  const fieldErrors = validateCollectorInput(request.collector)
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      status: 422,
      message: 'Revise os dados do colecionador.',
      fieldErrors,
    }
  }

  const { collector } = request
  if (
    !connection ||
    connection.userId !== userId ||
    connection.status !== 'connected' ||
    connection.walletAddress.toLowerCase() !==
      collector.walletAddress.toLowerCase() ||
    connection.network !== collector.network ||
    connection.provider !== collector.provider
  ) {
    return {
      ok: false,
      status: 409,
      reason: 'WALLET_NOT_CONNECTED',
      message: 'Conecte a carteira novamente para confirmar a compra.',
    }
  }

  if (!cart || cart.items.length === 0) {
    return {
      ok: false,
      status: 409,
      reason: 'CART_EMPTY',
      message: 'Seu carrinho está vazio.',
    }
  }

  const quote = quoteCart(cart, nfts, coupons, now)
  if (
    quote.issues.length > 0 ||
    quote.cartVersion !== request.quote.cartVersion ||
    !/^\d+(\.\d+)?$/.test(request.quote.totalEth) ||
    compareEth(quote.totalEth, request.quote.totalEth) !== 0
  ) {
    return {
      ok: false,
      status: 409,
      reason: 'QUOTE_CHANGED',
      message:
        quote.issues.length > 0
          ? 'Itens do pedido não estão mais disponíveis na quantidade escolhida.'
          : 'Os valores do pedido mudaram. Revise e confirme novamente.',
    }
  }

  const items = cart.items.map((item): OrderItem => {
    const nft = nfts.find((n) => n.id === item.nftId)!
    const edition = nft.editions.find((e) => e.id === item.editionId)!
    return {
      nftId: nft.id,
      editionId: edition.id,
      name: nft.name,
      tokenId: nft.tokenId,
      editionLabel: edition.label,
      imageUrl: nft.images[0].smallUrl,
      unitPriceEth: nft.priceEth,
      quantity: item.quantity,
      lineTotalEth: multiplyEth(nft.priceEth, item.quantity),
    }
  })
  const timestamp = new Date(now).toISOString()
  return {
    ok: true,
    order: {
      id: orderId,
      userId,
      idempotencyKey,
      status: 'pending',
      items,
      subtotalEth: quote.subtotalEth,
      discountEth: quote.discountEth,
      networkFeeEth: quote.networkFeeEth,
      totalEth: quote.totalEth,
      couponCode: quote.coupon?.status === 'applied' ? quote.coupon.code : null,
      walletId: request.walletId,
      walletAddress: collector.walletAddress,
      provider: collector.provider,
      network: collector.network,
      collector,
      transactionHash: null,
      refusalReason: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1,
    },
  }
}
