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
