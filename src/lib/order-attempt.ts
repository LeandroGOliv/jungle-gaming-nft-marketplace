import type { CreateOrderRequest } from '@/types/checkout'

/**
 * Tentativa de compra em andamento, por usuário, na sessão da aba. A chave de
 * idempotência vale enquanto o conteúdo do pedido não muda e sobrevive a
 * refresh; `inFlight` guarda o envio que ficou sem resposta (timeout, queda,
 * refresh no meio), para ser repetido com a mesma chave em vez de virar outra
 * compra.
 */
export interface OrderAttempt {
  fingerprint: string
  key: string
  inFlight: CreateOrderRequest | null
}

const PREFIX = 'nft-marketplace:order-attempt:'

function read(userId: string): OrderAttempt | null {
  try {
    const raw = window.sessionStorage.getItem(PREFIX + userId)
    return raw ? (JSON.parse(raw) as OrderAttempt) : null
  } catch {
    return null
  }
}

function write(userId: string, attempt: OrderAttempt | null) {
  try {
    if (attempt) {
      window.sessionStorage.setItem(PREFIX + userId, JSON.stringify(attempt))
    } else {
      window.sessionStorage.removeItem(PREFIX + userId)
    }
  } catch {
    // Storage bloqueado: a chave vale só enquanto a tela estiver aberta.
  }
}

// Fallback em memória para quando o storage está bloqueado.
const memory = new Map<string, OrderAttempt>()

function current(userId: string) {
  return read(userId) ?? memory.get(userId) ?? null
}

function save(userId: string, attempt: OrderAttempt | null) {
  if (attempt) memory.set(userId, attempt)
  else memory.delete(userId)
  write(userId, attempt)
}

/** O que a chave protege; a conexão da carteira muda a cada reconexão e fica de fora. */
export function orderFingerprint({
  connectionId: _connectionId,
  ...rest
}: CreateOrderRequest) {
  return JSON.stringify(rest)
}

export const orderAttempt = {
  read: current,

  /** Chave do envio: a mesma para o mesmo conteúdo, uma nova se algo mudou. */
  begin(userId: string, request: CreateOrderRequest) {
    const fingerprint = orderFingerprint(request)
    const previous = current(userId)
    const key =
      previous?.fingerprint === fingerprint ? previous.key : crypto.randomUUID()
    save(userId, { fingerprint, key, inFlight: request })
    return key
  },

  /** A API respondeu (com o pedido ou com um erro definitivo): nada em dúvida. */
  settle(userId: string, key: string) {
    const attempt = current(userId)
    if (attempt?.key === key) save(userId, { ...attempt, inFlight: null })
  },

  /** O pedido dessa chave terminou: a próxima compra é outra tentativa. */
  release(userId: string, key: string) {
    if (current(userId)?.key === key) save(userId, null)
  },

  /** Logout explícito: nada fica para o próximo a usar a aba. */
  clearAll() {
    memory.clear()
    try {
      for (const key of Object.keys(window.sessionStorage)) {
        if (key.startsWith(PREFIX)) window.sessionStorage.removeItem(key)
      }
    } catch {
      // Nada a limpar.
    }
  },
}
