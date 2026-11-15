/** Valores de `?auth=`: qual formulário o modal mostra. */
export const AUTH_MODES = ['entrar', 'cadastro'] as const

/** Valores de `?motivo=`: por que o login foi pedido. */
export const AUTH_REASONS = ['sessao-expirada', 'sessao-encerrada'] as const

/** Parâmetros de URL que abrem e contextualizam o modal de login/cadastro. */
export interface AuthParams {
  auth?: (typeof AUTH_MODES)[number]
  motivo?: (typeof AUTH_REASONS)[number]
  redirect?: string
}

/** O `motivo` exibido para o `reason` de um 401 da API. */
export function authReasonFor(
  reason: string | undefined,
): NonNullable<AuthParams['motivo']> {
  return reason === 'SESSION_EXPIRED' ? 'sessao-expirada' : 'sessao-encerrada'
}

const AUTH_PARAM_NAMES = ['auth', 'motivo', 'redirect'] as const

// Só a origem fictícia é descartada: os caminhos tratados aqui são internos.
const BASE = 'http://local.invalid'

function toHref(url: URL) {
  return url.pathname + url.search + url.hash
}

/** O mesmo endereço, com os parâmetros do modal definidos. */
export function withAuthParams(href: string, params: AuthParams) {
  const url = new URL(href, BASE)
  for (const name of AUTH_PARAM_NAMES) {
    const value = params[name]
    if (value !== undefined) url.searchParams.set(name, value)
  }
  return toHref(url)
}

/** O endereço sem os parâmetros do modal: o destino de retorno após o login. */
export function withoutAuthParams(href: string) {
  const url = new URL(href, BASE)
  for (const name of AUTH_PARAM_NAMES) url.searchParams.delete(name)
  return toHref(url)
}
