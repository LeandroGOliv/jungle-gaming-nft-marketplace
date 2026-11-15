import { isAxiosError } from 'axios'
import { isApiError } from '@/types/api'
import type { ApiError } from '@/types/api'

/** Corpo de erro da API, quando a falha chegou a ter resposta. */
export function getApiError(error: unknown): ApiError | null {
  if (!isAxiosError(error)) return null
  const body: unknown = error.response?.data
  return isApiError(body) ? body : null
}

/** Resposta 401: sessão ausente, inválida ou expirada. */
export function isUnauthorized(error: unknown) {
  return isAxiosError(error) && error.response?.status === 401
}

/** Mensagem curta para o usuário, distinguindo timeout e falta de conexão. */
export function describeRequestError(error: unknown) {
  const apiError = getApiError(error)
  if (apiError) return apiError.message
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'O servidor demorou demais para responder.'
    }
    if (!error.response) return 'Sem conexão com o servidor.'
  }
  return 'Algo deu errado. Tente novamente.'
}
