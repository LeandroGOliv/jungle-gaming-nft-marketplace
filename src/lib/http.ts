import axios, { isAxiosError } from 'axios'
import { env } from '@/lib/env'
import { getApiError, isUnauthorized } from '@/lib/http-error'
import { sessionToken } from '@/lib/session'
import type { ApiError } from '@/types/api'

const TIMEOUT_MS = 15_000

/** Endpoints que não exigem sessão: catálogo, login, cadastro. */
export const publicClientApi = axios.create({
  baseURL: env.apiUrl,
  timeout: TIMEOUT_MS,
})

/** Endpoints autenticados: anexa a sessão e centraliza o tratamento de 401. */
export const clientApi = axios.create({
  baseURL: env.apiUrl,
  timeout: TIMEOUT_MS,
})

type UnauthorizedHandler = (error: ApiError | null) => void

let onUnauthorized: UnauthorizedHandler = () => {}

/** Quem encerra a sessão e leva ao login é registrado na inicialização. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  onUnauthorized = handler
}

function bearer(token: string) {
  return `Bearer ${token}`
}

/**
 * Configuração de uma chamada feita com um token específico (consulta da
 * sessão, logout), não necessariamente o atual. O formato do header fica só
 * aqui: o tratamento de 401 compara o header enviado com o token atual.
 */
export function withSession(token: string) {
  return { headers: { Authorization: bearer(token) } }
}

clientApi.interceptors.request.use((config) => {
  const token = sessionToken.get()
  // Um token explícito (consulta da sessão, logout) prevalece sobre o atual.
  if (token && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', bearer(token))
  }
  return config
})

clientApi.interceptors.response.use(undefined, (error: unknown) => {
  if (isAxiosError(error) && isUnauthorized(error)) {
    const sent = error.config?.headers.get('Authorization')
    const token = sessionToken.get()
    // Um 401 de uma requisição feita com outra sessão (já encerrada ou
    // trocada) não derruba a sessão atual.
    if (token && sent === bearer(token)) onUnauthorized(getApiError(error))
  }
  return Promise.reject(error)
})
