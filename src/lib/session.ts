/**
 * Token da sessão do colecionador. Só o token opaco fica no navegador (nunca
 * a senha nem o perfil), para a sessão sobreviver ao refresh; os dados do
 * usuário vêm de `GET /auth/session`. O `localStorage` é compartilhado entre
 * as abas: entrar, sair ou trocar de usuário numa aba vale para todas.
 */
const STORAGE_KEY = 'nft-marketplace:session'

/** `external`: a mudança veio de outra aba, não de uma ação desta. */
type Listener = (change: { external: boolean }) => void

const listeners = new Set<Listener>()

function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

let current: string | null = readStored()

function notify(external: boolean) {
  for (const listener of listeners) listener({ external })
}

function store(token: string | null) {
  current = token
  try {
    if (token) window.localStorage.setItem(STORAGE_KEY, token)
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage bloqueado: a sessão vale só enquanto a aba estiver aberta.
  }
  notify(false)
}

// O evento `storage` só dispara nas outras abas, nunca na que gravou.
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY && event.key !== null) return
  const next = readStored()
  if (next === current) return
  current = next
  notify(true)
})

// Usuário da última sessão confirmada nesta aba (`sessionStorage`): depois de
// um refresh o cache está vazio, e um 401 ainda precisa saber de quem era a tela.
const SESSION_USER_KEY = 'nft-marketplace:session-user'

export const sessionUser = {
  /** A sessão `token` foi confirmada como sendo de `userId`. */
  note(token: string, userId: string) {
    try {
      window.sessionStorage.setItem(
        SESSION_USER_KEY,
        JSON.stringify({ token, userId }),
      )
    } catch {
      // Sem storage, o dono só é conhecido enquanto a sessão está em cache.
    }
  },
  of(token: string) {
    try {
      const raw = window.sessionStorage.getItem(SESSION_USER_KEY)
      const record = raw
        ? (JSON.parse(raw) as { token: string; userId: string })
        : null
      return record?.token === token ? record.userId : null
    } catch {
      return null
    }
  },
}

export const sessionToken = {
  get: () => current,
  set: (token: string) => store(token),
  /**
   * Encerra `token`, se ainda for o da sessão. Um encerramento atrasado
   * (o 401 de uma sessão antiga) não apaga a sessão que outra aba já abriu.
   */
  clear(token: string | null = current) {
    if (token === null || readStored() !== token) {
      if (current === token) {
        current = readStored()
        notify(true)
      }
      return
    }
    store(null)
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => void listeners.delete(listener)
  },
}
