import { describe, expect, it } from 'vitest'
import { safeRedirect } from './redirect'

const ORIGIN = 'https://marketplace.example'

describe('safeRedirect', () => {
  it.each([
    ['/carrinho', '/carrinho'],
    ['/em-breve?secao=aprenda', '/em-breve?secao=aprenda'],
    ['/nft/42#galeria', '/nft/42#galeria'],
    ['/a/../perfil', '/perfil'],
  ])('mantém o caminho interno %s', (value, expected) => {
    expect(safeRedirect(value, ORIGIN)).toBe(expected)
  })

  it.each([
    ['', 'vazio'],
    ['carrinho', 'relativo sem barra'],
    ['//evil.com', 'protocolo relativo'],
    ['/\\evil.com', 'barra invertida'],
    ['/\t/evil.com', 'tab descartado pelo parser'],
    ['/\n/evil.com', 'quebra de linha descartada pelo parser'],
    ['https://evil.com/x', 'URL absoluta externa'],
    [`${ORIGIN}/perfil`, 'URL absoluta, mesmo da origem'],
    ['javascript:alert(1)', 'esquema javascript'],
  ])('rejeita %j (%s)', (value) => {
    expect(safeRedirect(value, ORIGIN)).toBeUndefined()
  })
})
