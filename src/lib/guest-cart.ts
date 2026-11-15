/**
 * Id do carrinho do visitante, emitido pela API na primeira inclusão. Só o id
 * opaco fica no navegador, para o carrinho sobreviver ao refresh; os itens
 * vivem na API. Some quando o carrinho é mesclado ao do usuário no login.
 */
const STORAGE_KEY = 'nft-marketplace:guest-cart'

type Listener = () => void

const listeners = new Set<Listener>()

function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

let current: string | null = readStored()

function store(id: string | null) {
  if (id === current) return
  current = id
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id)
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage bloqueado: o carrinho do visitante vale só enquanto a aba estiver aberta.
  }
  for (const listener of listeners) listener()
}

export const guestCartId = {
  get: () => current,
  set: (id: string) => store(id),
  clear: () => store(null),
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => void listeners.delete(listener)
  },
}
