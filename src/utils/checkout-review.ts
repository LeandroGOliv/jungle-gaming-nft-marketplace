import type { Cart, CartQuote, QuoteCoupon } from '@/types/cart'
import type { EthAmount } from '@/types/nft'
import { compareEth, formatEth } from '@/utils/eth'

interface ReviewLine {
  key: string
  name: string
  editionLabel: string
  unitPriceEth: EthAmount
  quantity: number
}

/**
 * O que o colecionador revisou antes de confirmar: itens, valores, cupom e
 * pendências. Duas revisões iguais dispensam nova confirmação.
 */
export interface ReviewSnapshot {
  cartVersion: number
  lines: Array<ReviewLine>
  subtotalEth: EthAmount
  discountEth: EthAmount
  networkFeeEth: EthAmount
  totalEth: EthAmount
  coupon: Pick<QuoteCoupon, 'code' | 'status' | 'message'> | null
  issues: CartQuote['issues']
}

const lineKey = (nftId: string, editionId: string) => `${nftId}:${editionId}`

export function toReviewSnapshot(cart: Cart, quote: CartQuote): ReviewSnapshot {
  return {
    cartVersion: quote.cartVersion,
    lines: cart.items.map((line) => ({
      key: lineKey(line.nftId, line.editionId),
      name: line.name,
      editionLabel: line.editionLabel,
      unitPriceEth: line.unitPriceEth,
      quantity: line.quantity,
    })),
    subtotalEth: quote.subtotalEth,
    discountEth: quote.discountEth,
    networkFeeEth: quote.networkFeeEth,
    totalEth: quote.totalEth,
    coupon: quote.coupon,
    issues: quote.issues,
  }
}

const differs = (a: EthAmount, b: EthAmount) => compareEth(a, b) !== 0

const change = (label: string, before: EthAmount, after: EthAmount) =>
  `${label}: de ${formatEth(before)} para ${formatEth(after)}.`

/**
 * Mudanças entre a revisão aceita e a atual, em frases para a tela e para a
 * região viva. Lista vazia: nada que o colecionador precise reconfirmar.
 */
export function describeReviewChanges(
  before: ReviewSnapshot,
  after: ReviewSnapshot,
): Array<string> {
  const messages: Array<string> = []

  for (const line of after.lines) {
    const previous = before.lines.find((l) => l.key === line.key)
    if (!previous) {
      messages.push(`${line.name} entrou no pedido.`)
      continue
    }
    if (differs(previous.unitPriceEth, line.unitPriceEth)) {
      messages.push(
        change(
          `Preço de ${line.name}`,
          previous.unitPriceEth,
          line.unitPriceEth,
        ),
      )
    }
    if (previous.quantity !== line.quantity) {
      messages.push(
        `Quantidade de ${line.name}: de ${previous.quantity} para ${line.quantity}.`,
      )
    }
  }
  for (const line of before.lines) {
    if (!after.lines.some((l) => l.key === line.key)) {
      messages.push(`${line.name} saiu do pedido.`)
    }
  }

  for (const issue of after.issues) {
    const key = lineKey(issue.nftId, issue.editionId)
    const known = before.issues.find(
      (i) => lineKey(i.nftId, i.editionId) === key,
    )
    if (known?.kind === issue.kind && known.available === issue.available) {
      continue
    }
    const line = after.lines.find((l) => l.key === key)
    if (!line) continue
    messages.push(
      issue.available === 0
        ? `A edição ${line.editionLabel} de ${line.name} esgotou.`
        : `Só ${issue.available === 1 ? 'resta 1 unidade' : `restam ${issue.available} unidades`} da edição ${line.editionLabel} de ${line.name}.`,
    )
  }

  if (
    after.coupon &&
    after.coupon.status !== 'applied' &&
    (before.coupon?.code !== after.coupon.code ||
      before.coupon.status !== after.coupon.status)
  ) {
    messages.push(after.coupon.message)
  }

  if (differs(before.discountEth, after.discountEth)) {
    messages.push(change('Desconto', before.discountEth, after.discountEth))
  }
  if (differs(before.networkFeeEth, after.networkFeeEth)) {
    messages.push(
      change('Taxa de rede', before.networkFeeEth, after.networkFeeEth),
    )
  }
  if (differs(before.totalEth, after.totalEth)) {
    messages.push(change('Total', before.totalEth, after.totalEth))
  }
  return messages
}
