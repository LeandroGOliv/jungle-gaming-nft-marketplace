import { HttpResponse, http } from 'msw'
import { emptyCart } from '../cart'
import { apiErrorResponse } from '../errors'
import { createSalt, hashPassword, verifyPassword } from '../password'
import {
  PASSWORD_RULE_MESSAGE,
  RESERVED_USERNAMES,
  USERNAME,
  USERNAME_FORMAT_MESSAGE,
  isStrongPassword,
} from '../profile'
import {
  createToken,
  lookupSession,
  readBearerToken,
  toPublicUser,
} from '../sessions'
import type { MockRuntime } from '../runtime'
import type { UserRecord } from '../fixtures/users'
import type {
  AuthSession,
  LoginRequest,
  SessionInfo,
  SignUpRequest,
} from '@/types/auth'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json().catch(() => null)
  return typeof body === 'object' && body !== null
    ? (body as Record<string, unknown>)
    : {}
}

function validateSignUp(body: SignUpRequest) {
  const fieldErrors: Record<string, string> = {}
  if (!USERNAME.test(body.username)) {
    fieldErrors.username = USERNAME_FORMAT_MESSAGE
  } else if (RESERVED_USERNAMES.has(body.username)) {
    fieldErrors.username = 'Este nome de usuário é reservado.'
  }
  if (!EMAIL.test(body.email)) fieldErrors.email = 'Informe um e-mail válido.'
  if (!isStrongPassword(body.password)) {
    fieldErrors.password = PASSWORD_RULE_MESSAGE
  }
  return fieldErrors
}

/** Cadastro, login, consulta da sessão e logout. */
export function createAuthHandlers(apiUrl: string, runtime: MockRuntime) {
  const { store } = runtime

  function openSession(user: UserRecord): AuthSession {
    const now = Date.now()
    const session = {
      token: createToken(),
      userId: user.id,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + runtime.sessionTtlMs()).toISOString(),
    }
    store.write((db) => {
      // Sessões vencidas não servem para nada: são descartadas a cada login.
      db.sessions = db.sessions.filter((s) => Date.parse(s.expiresAt) > now)
      db.sessions.push(session)
    })
    return {
      token: session.token,
      expiresAt: session.expiresAt,
      user: toPublicUser(user),
    }
  }

  return [
    http.post(`${apiUrl}/auth/sign-up`, async ({ request }) => {
      const raw = await readJson(request)
      const body: SignUpRequest = {
        username: asText(raw.username).toLowerCase(),
        email: asText(raw.email).toLowerCase(),
        password: typeof raw.password === 'string' ? raw.password : '',
      }

      const fieldErrors = validateSignUp(body)
      if (Object.keys(fieldErrors).length > 0) {
        return apiErrorResponse(422, { fieldErrors })
      }

      const conflicts: Record<string, string> = {}
      if (store.state.users.some((u) => u.email === body.email)) {
        conflicts.email = 'Este e-mail já está cadastrado.'
      }
      if (store.state.users.some((u) => u.username === body.username)) {
        conflicts.username = 'Este nome de usuário já está em uso.'
      }
      if (Object.keys(conflicts).length > 0) {
        return apiErrorResponse(409, {
          message: 'Já existe uma conta com estes dados.',
          reason: conflicts.email ? 'EMAIL_TAKEN' : 'USERNAME_TAKEN',
          fieldErrors: conflicts,
        })
      }

      const salt = createSalt()
      const passwordHash = await hashPassword(body.password, salt)
      const now = new Date().toISOString()
      const user: UserRecord = {
        id: store.nextId('usr'),
        email: body.email,
        username: body.username,
        displayName: body.username,
        ensName: null,
        walletNickname: null,
        avatarUrl: null,
        createdAt: now,
        updatedAt: now,
        passwordSalt: salt,
        passwordHash,
      }
      store.write((db) => {
        db.users.push(user)
        db.wallets[user.id] = []
        db.favorites[user.id] = []
        db.carts[user.id] = emptyCart()
      })

      return HttpResponse.json(openSession(user), { status: 201 })
    }),

    http.post(`${apiUrl}/auth/login`, async ({ request }) => {
      const raw = await readJson(request)
      const body: LoginRequest = {
        email: asText(raw.email).toLowerCase(),
        password: typeof raw.password === 'string' ? raw.password : '',
      }

      const fieldErrors: Record<string, string> = {}
      if (!EMAIL.test(body.email))
        fieldErrors.email = 'Informe um e-mail válido.'
      if (!body.password) fieldErrors.password = 'Informe sua senha.'
      if (Object.keys(fieldErrors).length > 0) {
        return apiErrorResponse(422, { fieldErrors })
      }

      const user = store.state.users.find((u) => u.email === body.email)
      // Mesma resposta para e-mail inexistente e senha errada: não revela contas.
      if (!user || !(await verifyPassword(body.password, user))) {
        return apiErrorResponse(401, {
          message: 'E-mail ou senha incorretos.',
          reason: 'INVALID_CREDENTIALS',
        })
      }

      return HttpResponse.json(openSession(user))
    }),

    http.get(`${apiUrl}/auth/session`, ({ request }) => {
      const lookup = lookupSession(
        store.state,
        readBearerToken(request),
        Date.now(),
      )
      if (!lookup.ok) {
        return apiErrorResponse(401, {
          reason: lookup.reason,
          ...(lookup.reason === 'SESSION_INVALID' && {
            message: 'Sessão inválida. Entre novamente para continuar.',
          }),
        })
      }
      return HttpResponse.json<SessionInfo>({
        expiresAt: lookup.session.expiresAt,
        user: toPublicUser(lookup.user),
      })
    }),

    http.post(`${apiUrl}/auth/logout`, ({ request }) => {
      const token = readBearerToken(request)
      // Idempotente: encerrar uma sessão já inexistente também é sucesso.
      if (token && store.state.sessions.some((s) => s.token === token)) {
        store.write((db) => {
          db.sessions = db.sessions.filter((s) => s.token !== token)
        })
      }
      runtime.revalidateRealtime()
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}
