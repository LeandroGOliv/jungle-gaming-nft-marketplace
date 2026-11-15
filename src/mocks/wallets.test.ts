import { describe, expect, it } from 'vitest'
import { walletFixtures } from './fixtures/users'
import { parseWalletInput, validateWalletInput } from './wallets'
import type { WalletInput } from '@/types/wallet'

const valid: WalletInput = {
  displayName: 'Nova Sato',
  alias: 'Cofre',
  network: 'ethereum',
  profileName: 'novasato',
  address: '0x1111111111111111111111111111111111111111',
  secondaryAddress: null,
  provider: 'metamask',
  referralCode: 'KURIO2026',
  email: 'nova@colecionador.test',
  ensName: 'nova-cofre',
}

const novaPrimary = walletFixtures.usr_nova[0]

describe('parseWalletInput', () => {
  it('normaliza espaços, caixa e o opcional vazio', () => {
    const input = parseWalletInput({
      ...valid,
      displayName: '  Nova  ',
      referralCode: ' kurio2026 ',
      email: 'NOVA@Colecionador.test',
      secondaryAddress: '   ',
    })
    expect(input.displayName).toBe('Nova')
    expect(input.referralCode).toBe('KURIO2026')
    expect(input.email).toBe('nova@colecionador.test')
    expect(input.secondaryAddress).toBeNull()
  })

  it('trata corpo inválido como campos vazios', () => {
    expect(validateWalletInput(parseWalletInput(null), undefined)).toEqual(
      expect.objectContaining({
        displayName: expect.any(String),
        address: expect.any(String),
        network: expect.any(String),
        provider: expect.any(String),
      }),
    )
  })
})

describe('validateWalletInput', () => {
  it('aceita uma carteira válida', () => {
    expect(validateWalletInput(valid, novaPrimary)).toEqual({})
  })

  it('aceita ENS ou endereço 0x no campo opcional', () => {
    expect(
      validateWalletInput(
        { ...valid, secondaryAddress: 'nova.eth' },
        undefined,
      ),
    ).toEqual({})
    expect(
      validateWalletInput(
        { ...valid, secondaryAddress: 'nao-e-ens' },
        undefined,
      ),
    ).toHaveProperty('secondaryAddress')
  })

  it('recusa endereço fora do formato EVM', () => {
    expect(
      validateWalletInput({ ...valid, address: '0x123' }, undefined),
    ).toHaveProperty('address')
  })

  it('recusa código de indicação desconhecido, regra só do servidor', () => {
    expect(
      validateWalletInput({ ...valid, referralCode: 'XPTO99' }, undefined),
    ).toEqual({ referralCode: 'Código de indicação inválido ou expirado.' })
  })

  it('recusa o mesmo endereço da outra carteira, sem diferenciar caixa', () => {
    expect(
      validateWalletInput(
        { ...valid, address: novaPrimary.address.toLowerCase() },
        novaPrimary,
      ),
    ).toEqual({ address: 'Este endereço já é a sua carteira principal.' })
  })
})
