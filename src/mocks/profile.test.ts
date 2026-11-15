import { describe, expect, it } from 'vitest'
import { userFixtures } from './fixtures/users'
import {
  parseProfileInput,
  validatePasswordChange,
  validateProfileInput,
} from './profile'
import type { UpdateProfileRequest } from '@/types/user'

const nova = userFixtures[0]
const rafael = userFixtures[1]

const valid: UpdateProfileRequest = {
  displayName: 'Nova Sato',
  username: 'novasato',
  ensName: 'nova-kurio',
  walletNickname: 'Cofre',
}

describe('parseProfileInput', () => {
  it('apara espaços, baixa a caixa do usuário e do ENS e tira o .eth', () => {
    expect(
      parseProfileInput({
        displayName: '  Nova  ',
        username: ' NovaSato ',
        ensName: 'Nova.ETH',
        walletNickname: ' Cofre ',
        email: 'outro@x.test',
      }),
    ).toEqual({
      displayName: 'Nova',
      username: 'novasato',
      ensName: 'nova',
      walletNickname: 'Cofre',
    })
  })

  it('transforma corpo inválido em campos vazios', () => {
    expect(parseProfileInput(null)).toEqual({
      displayName: '',
      username: '',
      ensName: '',
      walletNickname: '',
    })
  })
})

describe('validateProfileInput', () => {
  it('aceita dados válidos e o próprio nome de usuário', () => {
    expect(validateProfileInput(valid, nova, userFixtures)).toEqual({})
  })

  it('aponta cada campo inválido', () => {
    expect(
      validateProfileInput(
        { displayName: 'N', username: 'A!', ensName: 'x', walletNickname: '' },
        nova,
        userFixtures,
      ),
    ).toEqual({
      displayName: expect.any(String),
      username: expect.any(String),
      ensName: expect.any(String),
      walletNickname: expect.any(String),
    })
  })

  it('recusa nome reservado e nome de outro colecionador', () => {
    expect(
      validateProfileInput({ ...valid, username: 'admin' }, nova, userFixtures)
        .username,
    ).toBe('Este nome de usuário é reservado.')
    expect(
      validateProfileInput(
        { ...valid, username: rafael.username },
        nova,
        userFixtures,
      ).username,
    ).toBe('Este nome de usuário já está em uso.')
  })
})

describe('validatePasswordChange', () => {
  it('exige a senha atual e uma nova senha forte e diferente', () => {
    expect(
      validatePasswordChange({ currentPassword: '', newPassword: 'abc' }),
    ).toEqual({
      currentPassword: expect.any(String),
      newPassword: expect.any(String),
    })
    expect(
      validatePasswordChange({
        currentPassword: 'Kurio@2026',
        newPassword: 'Kurio@2026',
      }).newPassword,
    ).toBe('A nova senha precisa ser diferente da atual.')
    expect(
      validatePasswordChange({
        currentPassword: 'Kurio@2026',
        newPassword: 'NovaSenha1',
      }),
    ).toEqual({})
  })
})
