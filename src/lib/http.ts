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

/** `token`: a sessão recusada, que é a atual quando o handler é chamado. */
type UnauthorizedHandler = (error: ApiError | null, token: string) => void

let onUnauthorized: UnauthorizedHandler = () => {}

/** Quem encerra a sessão e leva ao login é registrado na inicialização. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  onUnauthorized = handler
}

declare module 'axios' {
  interface AxiosRequestConfig {
    /**
     * Token da sessão dona da chamada: o da sessão em que a consulta foi
     * chaveada, não o atual no momento do envio. Sem ele, vai sem sessão.
     */
    session?: string | null
  }
}

function bearer(token: string) {
  return `Bearer ${token}`
}

/** Configuração de uma chamada feita em nome de uma sessão. */
export function withSession(token: string) {
  return { session: token }
}

// O token nunca vem do estado global no envio: durante uma troca de usuário,
// a resposta seria gravada sob a chave do usuário anterior.
clientApi.interceptors.request.use((config) => {
  if (config.session)
    config.headers.set('Authorization', bearer(config.session))
  return config
})

clientApi.interceptors.response.use(undefined, (error: unknown) => {
  if (isAxiosError(error) && isUnauthorized(error)) {
    const sent = error.config?.session
    // Um 401 de uma requisição feita com outra sessão (já encerrada ou
    // trocada) não derruba a sessão atual.
    if (sent && sent === sessionToken.get()) {
      onUnauthorized(getApiError(error), sent)
    }
  }
  return Promise.reject(error)
})
