import { describe, expect, it } from 'vitest'
import {
  authReasonFor,
  withAuthParams,
  withoutAuthParams,
} from './auth-location'

describe('withAuthParams', () => {
  it('acrescenta os parâmetros do modal preservando busca e hash', () => {
    expect(
      withAuthParams('/?busca=ape&categoria=art#catalogo', {
        auth: 'entrar',
        motivo: 'sessao-expirada',
      }),
    ).toBe(
      '/?busca=ape&categoria=art&auth=entrar&motivo=sessao-expirada#catalogo',
    )
  })

  it('substitui parâmetros do modal que já estavam na URL', () => {
    expect(withAuthParams('/?auth=cadastro', { auth: 'entrar' })).toBe(
      '/?auth=entrar',
    )
  })
})

describe('withoutAuthParams', () => {
  it('remove auth, motivo e redirect e mantém o resto', () => {
    expect(
      withoutAuthParams(
        '/perfil?aba=dados&auth=entrar&motivo=sessao-expirada&redirect=%2Fx#topo',
      ),
    ).toBe('/perfil?aba=dados#topo')
  })

  it('devolve só o caminho quando não sobra nenhum parâmetro', () => {
    expect(withoutAuthParams('/carteiras?auth=entrar')).toBe('/carteiras')
  })
})

describe('authReasonFor', () => {
  it('distingue sessão expirada de sessão encerrada', () => {
    expect(authReasonFor('SESSION_EXPIRED')).toBe('sessao-expirada')
    expect(authReasonFor('SESSION_INVALID')).toBe('sessao-encerrada')
    expect(authReasonFor(undefined)).toBe('sessao-encerrada')
  })
})
