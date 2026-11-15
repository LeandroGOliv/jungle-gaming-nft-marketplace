import { compareEth, formatEth, isEthAmount } from '@/utils/eth'
import type { CartLine } from '@/types/cart'
import type { Nft } from '@/types/nft'
import type { NftUpdatedData, RealtimeEnvelope } from '@/types/realtime'

type NftEvent = RealtimeEnvelope<NftUpdatedData>

const SEEN_EVENTS_LIMIT = 500

/** O payload chega pela rede: só o que segue o contrato entra no cache. */
export function isNftUpdatedEvent(value: unknown): value is NftEvent {
  if (typeof value !== 'object' || value === null) return false
  const event = value as {
    eventId?: unknown
    resource?: { type?: unknown; id?: unknown } | null
    version?: unknown
    emittedAt?: unknown
    data?: { priceEth?: unknown; editions?: unknown } | null
  }
  const editions = event.data?.editions
  return (
    typeof event.eventId === 'string' &&
    event.resource?.type === 'nft' &&
    typeof event.resource.id === 'string' &&
    Number.isInteger(event.version) &&
    typeof event.emittedAt === 'string' &&
    typeof event.data?.priceEth === 'string' &&
    isEthAmount(event.data.priceEth) &&
    Array.isArray(editions) &&
    editions.every(
      (edition: { id?: unknown; available?: unknown } | null) =>
        typeof edition?.id === 'string' && Number.isInteger(edition.available),
    )
  )
}

/**
 * Filtro de entrega: descarta duplicatas (mesmo `eventId`) e versões que não
 * sejam mais novas que a já conhecida. Quando há dado em cache, a versão dele
 * é o piso — a REST é a referência; a memória só vale para recursos sem cache.
 */
export function createEventGate() {
  const seen = new Set<string>()
  const versions = new Map<string, number>()

  return {
    accept(event: RealtimeEnvelope<unknown>, cachedVersion?: number) {
      if (seen.has(event.eventId)) return false
      const key = `${event.resource.type}:${event.resource.id}`
      const floor = cachedVersion ?? versions.get(key) ?? 0
      if (event.version <= floor) return false

      seen.add(event.eventId)
      if (seen.size > SEEN_EVENTS_LIMIT) {
        seen.delete(seen.values().next().value!)
      }
      versions.set(key, event.version)
      return true
    },
    reset() {
      seen.clear()
      versions.clear()
    },
  }
}

export type EventGate = ReturnType<typeof createEventGate>

/** NFT com preço e disponibilidade do evento; devolve o mesmo objeto se o evento não for mais novo. */
export function applyNftUpdate(nft: Nft, event: NftEvent): Nft {
  if (event.version <= nft.version) return nft
  const available = new Map(event.data.editions.map((e) => [e.id, e.available]))
  return {
    ...nft,
    priceEth: event.data.priceEth,
    editions: nft.editions.map((edition) => ({
      ...edition,
      available: available.get(edition.id) ?? edition.available,
    })),
    version: event.version,
    updatedAt: event.emittedAt,
  }
}

function priceMessage(name: string, from: string, to: string) {
  return `O preço de ${name} mudou de ${formatEth(from)} para ${formatEth(to)}.`
}

function priceChanged(from: string, to: string) {
  return compareEth(from, to) !== 0
}

/** O que mudou num NFT exibido: preço e edições que esgotaram. */
export function describeNftChanges(nft: Nft, event: NftEvent): Array<string> {
  const messages: Array<string> = []
  if (priceChanged(nft.priceEth, event.data.priceEth)) {
    messages.push(priceMessage(nft.name, nft.priceEth, event.data.priceEth))
  }
  for (const update of event.data.editions) {
    const edition = nft.editions.find((e) => e.id === update.id)
    if (edition && edition.available > 0 && update.available === 0) {
      messages.push(`A edição ${edition.label} de ${nft.name} esgotou.`)
    }
  }
  return messages
}

/**
 * O que importa a quem tem o NFT no carrinho: preço novo e edições que não
 * cobrem mais a quantidade escolhida.
 */
export function describeCartChanges(
  lines: Array<CartLine>,
  event: NftEvent,
): Array<string> {
  const affected = lines.filter((l) => l.nftId === event.resource.id)
  if (affected.length === 0) return []

  const messages: Array<string> = []
  const [first] = affected
  if (priceChanged(first.unitPriceEth, event.data.priceEth)) {
    messages.push(
      priceMessage(first.name, first.unitPriceEth, event.data.priceEth),
    )
  }
  for (const line of affected) {
    const update = event.data.editions.find((e) => e.id === line.editionId)
    if (!update || update.available >= line.quantity) continue
    if (update.available === line.available) continue
    messages.push(
      update.available === 0
        ? `A edição ${line.editionLabel} de ${line.name} esgotou.`
        : `Só ${update.available === 1 ? 'resta 1 unidade' : `restam ${update.available} unidades`} da edição ${line.editionLabel} de ${line.name}.`,
    )
  }
  return messages
}
