import { useSyncExternalStore } from 'react'

export interface CartNotice {
  id: string
  message: string
}

type Listener = () => void

const listeners = new Set<Listener>()
let notices: Array<CartNotice> = []
let nextId = 0

function publish(next: Array<CartNotice>) {
  notices = next
  for (const listener of listeners) listener()
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

/**
 * Alterações de tempo real que afetaram o carrinho. Vivem fora da tela do
 * carrinho porque a mudança pode chegar enquanto o usuário navega em outra
 * página; ficam até ele dispensar ou a sessão mudar.
 */
export const cartNotices = {
  add(messages: Array<string>) {
    if (messages.length === 0) return
    publish([
      ...notices,
      ...messages.map((message) => ({ id: String(nextId++), message })),
    ])
  },
  dismiss(id: string) {
    publish(notices.filter((n) => n.id !== id))
  },
  clear() {
    if (notices.length > 0) publish([])
  },
}

export function useCartNotices() {
  return useSyncExternalStore(subscribe, () => notices)
}
