import type { User } from './user'

/** Corpo de `POST /auth/login`. */
export interface LoginRequest {
  email: string
  password: string
}

/** Corpo de `POST /auth/sign-up`. A confirmação de senha fica só no formulário. */
export interface SignUpRequest {
  username: string
  email: string
  password: string
}

/**
 * Resposta de login e cadastro: o token opaco vai no header `Authorization`
 * das chamadas autenticadas e vale até `expiresAt`.
 */
export interface AuthSession {
  token: string
  expiresAt: string
  user: User
}

/** Resposta de `GET /auth/session`: a sessão do token enviado. */
export interface SessionInfo {
  expiresAt: string
  user: User
}

/** `reason` dos erros de autenticação e cadastro. */
export type AuthErrorReason =
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'SESSION_INVALID'
  | 'EMAIL_TAKEN'
  | 'USERNAME_TAKEN'
