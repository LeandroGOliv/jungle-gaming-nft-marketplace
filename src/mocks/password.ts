export interface PasswordCredential {
  passwordHash: string
  passwordSalt: string
}

/** SHA-256 de `salt:senha` em hex. Basta para a simulação: a senha nunca fica em claro. */
export async function hashPassword(password: string, salt: string) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('')
}

export async function verifyPassword(
  password: string,
  credential: PasswordCredential,
) {
  const hash = await hashPassword(password, credential.passwordSalt)
  return hash === credential.passwordHash
}

export function createSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
