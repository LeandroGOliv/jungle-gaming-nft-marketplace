/**
 * Valida o local de retorno após o login e devolve só o caminho normalizado.
 * Checar o prefixo não basta: o parser de URL trata `\` como `/` e descarta
 * tab e quebra de linha, então `/\evil.com` resolve para outro host.
 */
export function safeRedirect(
  value: string,
  origin: string,
): string | undefined {
  if (!value.startsWith('/')) return undefined
  let url: URL
  try {
    url = new URL(value, origin)
  } catch {
    return undefined
  }
  if (url.origin !== new URL(origin).origin) return undefined
  return url.pathname + url.search + url.hash
}

interface ReturnAfterLoginInput {
  /** Tela onde o login foi pedido. */
  redirect: string
  /** Quem estava nela quando a sessão terminou; `null` se era um visitante. */
  previousUserId: string | null
  /** Quem acabou de entrar. */
  userId: string
}

/**
 * Destino após o login. A tela de outro usuário (o pedido, o perfil) não é
 * de quem entrou agora: nesse caso, a Início.
 */
export function returnAfterLogin({
  redirect,
  previousUserId,
  userId,
}: ReturnAfterLoginInput) {
  return previousUserId === null || previousUserId === userId ? redirect : '/'
}
