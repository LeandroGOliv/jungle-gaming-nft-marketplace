/**
 * Token da sessão do colecionador. Só o token opaco fica no navegador (nunca
 * a senha nem o perfil), para a sessão sobreviver ao refresh; os dados do
 * usuário vêm de `GET /auth/session`.
 */
const STORAGE_KEY = 'nft-marketplace:session'

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

function store(token: string | null) {
  current = token
  try {
    if (token) window.localStorage.setItem(STORAGE_KEY, token)
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage bloqueado: a sessão vale só enquanto a aba estiver aberta.
  }
  for (const listener of listeners) listener()
}

export const sessionToken = {
  get: () => current,
  set: (token: string) => store(token),
  clear: () => store(null),
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => void listeners.delete(listener)
  },
}
