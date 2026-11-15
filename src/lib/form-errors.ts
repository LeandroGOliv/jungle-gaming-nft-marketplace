import { getApiError } from '@/lib/http-error'

type SetFieldError<TField extends string> = (
  field: TField,
  error: { type: string; message: string },
  options?: { shouldFocus: boolean },
) => void

/**
 * Leva os `fieldErrors` de uma resposta da API (422, 409) para os campos do
 * formulário, focando o primeiro. Devolve `false` quando o erro não aponta
 * nenhum campo conhecido e precisa ser exibido como erro do formulário.
 */
export function applyApiFieldErrors<TField extends string>(
  error: unknown,
  fields: ReadonlyArray<TField>,
  setError: SetFieldError<TField>,
) {
  const fieldErrors = getApiError(error)?.fieldErrors ?? {}
  const matched = fields.filter((field) => field in fieldErrors)
  matched.forEach((field, index) =>
    setError(
      field,
      { type: 'server', message: fieldErrors[field] },
      { shouldFocus: index === 0 },
    ),
  )
  return matched.length > 0
}
