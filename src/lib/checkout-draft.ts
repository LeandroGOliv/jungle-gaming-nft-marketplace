import type { CheckoutFormValues } from '@/schemas/checkout'

/**
 * Rascunho do pagamento por usuário, na sessão da aba: se a sessão expira no
 * meio do checkout, o colecionador entra de novo e encontra o que digitou.
 * Fica fora do cache de consultas, que é limpo no fim da sessão.
 */
export interface CheckoutDraft {
  values: CheckoutFormValues
  /** Carteira cadastrada escolhida; `null` com "Usar outra carteira?". */
  walletId: string | null
}

const PREFIX = 'nft-marketplace:checkout-draft:'

export const checkoutDraft = {
  read(userId: string): CheckoutDraft | null {
    try {
      const raw = window.sessionStorage.getItem(PREFIX + userId)
      return raw ? (JSON.parse(raw) as CheckoutDraft) : null
    } catch {
      return null
    }
  },
  write(userId: string, draft: CheckoutDraft) {
    try {
      window.sessionStorage.setItem(PREFIX + userId, JSON.stringify(draft))
    } catch {
      // Storage bloqueado: o rascunho vale só enquanto a tela estiver aberta.
    }
  },
  clear(userId: string) {
    try {
      window.sessionStorage.removeItem(PREFIX + userId)
    } catch {
      // Nada a limpar.
    }
  },
  /** Logout explícito: nenhum rascunho fica para o próximo a usar a aba. */
  clearAll() {
    try {
      for (const key of Object.keys(window.sessionStorage)) {
        if (key.startsWith(PREFIX)) window.sessionStorage.removeItem(key)
      }
    } catch {
      // Nada a limpar.
    }
  },
}
