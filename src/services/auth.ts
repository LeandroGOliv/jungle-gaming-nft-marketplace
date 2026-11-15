import { clientApi, publicClientApi, withSession } from '@/lib/http'
import type {
  AuthSession,
  LoginRequest,
  SessionInfo,
  SignUpRequest,
} from '@/types/auth'

export async function signUp(request: SignUpRequest) {
  const { data } = await publicClientApi.post<AuthSession>(
    '/auth/sign-up',
    request,
  )
  return data
}

export async function login(request: LoginRequest) {
  const { data } = await publicClientApi.post<AuthSession>(
    '/auth/login',
    request,
  )
  return data
}

/** Consulta a sessão de um token específico, não necessariamente o atual. */
export async function getSession(token: string, signal?: AbortSignal) {
  const { data } = await clientApi.get<SessionInfo>('/auth/session', {
    ...withSession(token),
    signal,
  })
  return data
}

export async function logout(token: string) {
  await clientApi.post('/auth/logout', null, withSession(token))
}
