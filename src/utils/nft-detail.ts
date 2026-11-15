import type { NftEdition } from '@/types/nft'

/** Edição selecionada ao abrir o detalhe: a primeira ainda à venda. */
export function defaultEditionId(editions: Array<NftEdition>) {
  return (editions.find((e) => e.available > 0) ?? editions.at(0))?.id
}

/** Quantidade inteira entre 1 e as unidades disponíveis da edição. */
export function clampQuantity(quantity: number, available: number) {
  return Math.min(Math.max(1, Math.trunc(quantity)), Math.max(1, available))
}

/** "0x7A42...19E8", como o Figma mostra o contrato. */
export function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const percentFormat = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
})

export function formatPercent(value: number) {
  return `${percentFormat.format(value)}%`
}
