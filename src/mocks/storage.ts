export interface KeyValueStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export const STORAGE_PREFIX = 'nft-marketplace:mocks'

export function createMemoryStorage(): KeyValueStorage {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  }
}

/** localStorage quando disponível; senão memória (aba anônima com storage bloqueado). */
export function createBrowserStorage(): KeyValueStorage {
  try {
    const probe = `${STORAGE_PREFIX}:probe`
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    return createMemoryStorage()
  }
}

export function readJson<T>(
  storage: KeyValueStorage,
  key: string,
  isValid: (value: unknown) => value is T,
): T | null {
  const raw = storage.getItem(key)
  if (raw === null) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeJson(
  storage: KeyValueStorage,
  key: string,
  value: unknown,
) {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // Sem espaço ou storage bloqueado: o estado segue em memória até o refresh.
  }
}
