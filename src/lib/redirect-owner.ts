/**
 * Quem estava em cada tela quando a sessão terminou sem um "Sair" (expirou,
 * foi recusada, outra aba saiu ou trocou de usuário). Por aba, como o
 * histórico: o retorno após o login só leva de volta o mesmo usuário.
 */
const STORAGE_KEY = 'nft-marketplace:redirect-owner'

interface OwnerRecord {
  path: string
  userId: string
}

function readJson<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Sem storage, o retorno segue para quem entrar.
  }
}

export const redirectOwner = {
  remember(path: string, userId: string) {
    writeJson(STORAGE_KEY, { path, userId } satisfies OwnerRecord)
  },
  /** Dono registrado para `path`; `null` se ninguém estava nele. */
  ownerOf(path: string) {
    const record = readJson<OwnerRecord>(STORAGE_KEY)
    return record?.path === path ? record.userId : null
  },
  clear() {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Nada a limpar.
    }
  },
}
