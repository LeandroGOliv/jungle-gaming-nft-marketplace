import type { MockDb, SessionRecord } from './db'
import type { UserRecord } from './fixtures/users'
import type { AuthErrorReason } from '@/types/auth'
import type { User } from '@/types/user'

/** Validade padrão de uma sessão; o cenário `short-session` encurta. */
export const DEFAULT_SESSION_TTL_MS = 2 * 60 * 60 * 1000

export function createToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Perfil público: o hash e o salt da senha nunca saem dos mocks. */
export function toPublicUser({
  passwordHash: _hash,
  passwordSalt: _salt,
  ...user
}: UserRecord): User {
  return user
}

export function readBearerToken(request: Request) {
  const header = request.headers.get('Authorization') ?? ''
  const match = /^Bearer\s+(\S+)$/.exec(header)
  return match ? match[1] : null
}

export type SessionLookup =
  | { ok: true; session: SessionRecord; user: UserRecord }
  | { ok: false; reason: Extract<AuthErrorReason, `SESSION_${string}`> }

/**
 * Resolve o token enviado. Sessão vencida é `SESSION_EXPIRED`; token ausente,
 * desconhecido (logout, reset dos mocks) ou de usuário removido é `SESSION_INVALID`.
 */
export function lookupSession(
  db: MockDb,
  token: string | null,
  now: number,
): SessionLookup {
  if (!token) return { ok: false, reason: 'SESSION_INVALID' }
  const session = db.sessions.find((s) => s.token === token)
  if (!session) return { ok: false, reason: 'SESSION_INVALID' }
  if (Date.parse(session.expiresAt) <= now) {
    return { ok: false, reason: 'SESSION_EXPIRED' }
  }
  const user = db.users.find((u) => u.id === session.userId)
  if (!user) return { ok: false, reason: 'SESSION_INVALID' }
  return { ok: true, session, user }
}
