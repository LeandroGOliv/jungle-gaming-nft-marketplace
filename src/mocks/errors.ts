import { HttpResponse } from 'msw'
import { API_ERROR_CODES } from '@/types/api'
import type { ApiError, ApiErrorStatus } from '@/types/api'

const DEFAULT_MESSAGES: Record<ApiErrorStatus, string> = {
  401: 'Sua sessão expirou. Entre novamente para continuar.',
  403: 'Você não tem permissão para acessar este recurso.',
  404: 'Recurso não encontrado.',
  409: 'A operação conflita com o estado atual.',
  422: 'Revise os dados informados.',
  500: 'Erro inesperado. Tente novamente.',
  503: 'Serviço temporariamente indisponível. Tente novamente.',
}

interface ApiErrorOptions {
  message?: string
  reason?: string
  fieldErrors?: Record<string, string>
}

export function buildApiError(
  status: ApiErrorStatus,
  options: ApiErrorOptions = {},
): ApiError {
  return {
    status,
    code: API_ERROR_CODES[status],
    message: options.message ?? DEFAULT_MESSAGES[status],
    ...(options.reason !== undefined && { reason: options.reason }),
    ...(options.fieldErrors !== undefined && {
      fieldErrors: options.fieldErrors,
    }),
    retryable: status >= 500,
  }
}

/** Resposta de erro no formato único da API, para todos os handlers. */
export function apiErrorResponse(
  status: ApiErrorStatus,
  options?: ApiErrorOptions,
) {
  return HttpResponse.json(buildApiError(status, options), { status })
}
