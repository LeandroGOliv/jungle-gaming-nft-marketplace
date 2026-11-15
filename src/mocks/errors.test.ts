import { describe, expect, it } from 'vitest'
import { buildApiError } from './errors'
import { isApiError } from '@/types/api'

describe('buildApiError', () => {
  it.each([
    [401, 'UNAUTHENTICATED', false],
    [403, 'FORBIDDEN', false],
    [404, 'NOT_FOUND', false],
    [409, 'CONFLICT', false],
    [422, 'VALIDATION_FAILED', false],
    [500, 'INTERNAL_ERROR', true],
    [503, 'SERVICE_UNAVAILABLE', true],
  ] as const)('status %i vira %s', (status, code, retryable) => {
    const error = buildApiError(status)

    expect(error).toMatchObject({ status, code, retryable })
    expect(error.message).not.toBe('')
    expect(isApiError(error)).toBe(true)
  })

  it('carrega motivo e erros por campo', () => {
    const error = buildApiError(422, {
      message: 'Dados inválidos.',
      fieldErrors: { email: 'E-mail já cadastrado.' },
      reason: 'EMAIL_TAKEN',
    })

    expect(error).toEqual({
      status: 422,
      code: 'VALIDATION_FAILED',
      message: 'Dados inválidos.',
      reason: 'EMAIL_TAKEN',
      fieldErrors: { email: 'E-mail já cadastrado.' },
      retryable: false,
    })
  })
})
