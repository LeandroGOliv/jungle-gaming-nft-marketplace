import type { AuthErrorReason } from './auth'
import type { CartErrorReason } from './cart'
import type { CheckoutErrorReason } from './checkout'
import type { WalletErrorReason } from './wallet'

/**
 * Casos de negócio que o cliente distingue dentro de uma categoria de erro.
 * Cada fluxo acrescenta os seus (carrinho, checkout...).
 */
export type ApiErrorReason =
  AuthErrorReason | CartErrorReason | CheckoutErrorReason | WalletErrorReason

/**
 * Corpo de toda resposta de erro da API. `code` é a categoria genérica,
 * derivada do status; `reason` detalha o caso de negócio quando o cliente
 * precisa distinguir (ex.: `EMAIL_TAKEN` dentro de um 409).
 */
export interface ApiError {
  status: ApiErrorStatus
  code: ApiErrorCode
  message: string
  reason?: ApiErrorReason
  /** Mensagens por campo do formulário, presentes nos erros 422. */
  fieldErrors?: Record<string, string>
  /** Indica se repetir a mesma requisição pode dar certo. */
  retryable: boolean
}

export type ApiErrorStatus = 401 | 403 | 404 | 409 | 422 | 500 | 503

export type ApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_FAILED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'

export const API_ERROR_CODES: Record<ApiErrorStatus, ApiErrorCode> = {
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_FAILED',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
}

export function isApiError(value: unknown): value is ApiError {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<ApiError>
  return (
    typeof candidate.status === 'number' &&
    typeof candidate.code === 'string' &&
    typeof candidate.message === 'string'
  )
}
