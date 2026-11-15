import type { EthAmount } from '@/types/nft'

const DECIMALS = 18
const ETH_AMOUNT = /^\d+(\.\d{1,18})?$/

export function isEthAmount(value: string): value is EthAmount {
  return ETH_AMOUNT.test(value)
}

/** Valor em wei, para comparar e somar sem ponto flutuante. */
export function toWei(value: EthAmount): bigint {
  if (!isEthAmount(value)) throw new Error(`Valor em ETH inválido: ${value}`)
  const [whole, fraction = ''] = value.split('.')
  return BigInt(whole + fraction.padEnd(DECIMALS, '0'))
}

export function compareEth(a: EthAmount, b: EthAmount): -1 | 0 | 1 {
  const diff = toWei(a) - toWei(b)
  return diff === 0n ? 0 : diff > 0n ? 1 : -1
}

/** "1.19 ETH"; completa até duas casas e preserva as demais. */
export function formatEth(value: EthAmount) {
  const [whole, fraction = ''] = value.split('.')
  return `${whole}.${fraction.padEnd(2, '0')} ETH`
}

/** Posição inteira do slider de preço (passo de 0,01 ETH), truncada. */
export function toHundredths(value: EthAmount): number {
  return Number(toWei(value) / 10n ** BigInt(DECIMALS - 2))
}

export function fromHundredths(hundredths: number): EthAmount {
  const digits = String(Math.trunc(hundredths)).padStart(3, '0')
  return `${digits.slice(0, -2)}.${digits.slice(-2)}`
}

const WEI_PER_ETH = 10n ** BigInt(DECIMALS)

/** String decimal mínima: sem zeros à direita nem ponto sobrando. */
export function fromWei(wei: bigint): EthAmount {
  if (wei < 0n) throw new Error('Valor em ETH negativo.')
  const whole = wei / WEI_PER_ETH
  const fraction = (wei % WEI_PER_ETH)
    .toString()
    .padStart(DECIMALS, '0')
    .replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : `${whole}`
}

export function addEth(a: EthAmount, b: EthAmount): EthAmount {
  return fromWei(toWei(a) + toWei(b))
}

/** Diferença sem ficar negativa: um desconto nunca passa do valor. */
export function subEth(a: EthAmount, b: EthAmount): EthAmount {
  const diff = toWei(a) - toWei(b)
  return fromWei(diff > 0n ? diff : 0n)
}

export function sumEth(values: Array<EthAmount>): EthAmount {
  return fromWei(values.reduce((total, value) => total + toWei(value), 0n))
}

/** Preço unitário × quantidade inteira não negativa. */
export function multiplyEth(value: EthAmount, quantity: number): EthAmount {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new Error(`Quantidade inválida: ${quantity}`)
  }
  return fromWei(toWei(value) * BigInt(quantity))
}

/** `percent` em string decimal (`"10"`, `"12.5"`); arredonda para baixo no wei. */
export function percentOfEth(value: EthAmount, percent: string): EthAmount {
  const scaled = toWei(percent)
  return fromWei((toWei(value) * scaled) / (100n * WEI_PER_ETH))
}

export function minEth(a: EthAmount, b: EthAmount): EthAmount {
  return compareEth(a, b) <= 0 ? fromWei(toWei(a)) : fromWei(toWei(b))
}
