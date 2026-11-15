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
