import { referralCodeFixtures } from './fixtures/users'
import { BLOCKCHAIN_NETWORKS } from '@/types/nft'
import { WALLET_PROVIDERS } from '@/types/wallet'
import type { Wallet, WalletInput, WalletSlot } from '@/types/wallet'

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/
const ENS_FULL = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.eth$/
const ENS_LABEL = /^[a-z0-9-]{3,32}$/
const PROFILE_NAME = /^[a-z0-9._]{3,20}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SLOT_LABEL: Record<WalletSlot, string> = {
  primary: 'principal',
  secondary: 'secundária',
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Normaliza o corpo recebido; campos ausentes ou de tipo errado viram vazio e
 * caem na validação, como faria um servidor que não confia no cliente.
 */
export function parseWalletInput(body: unknown): WalletInput {
  const raw = (typeof body === 'object' && body !== null ? body : {}) as Record<
    string,
    unknown
  >
  const secondary = text(raw.secondaryAddress)
  return {
    displayName: text(raw.displayName),
    alias: text(raw.alias),
    network: text(raw.network) as WalletInput['network'],
    profileName: text(raw.profileName),
    address: text(raw.address),
    secondaryAddress: secondary === '' ? null : secondary,
    provider: text(raw.provider) as WalletInput['provider'],
    referralCode: text(raw.referralCode).toUpperCase(),
    email: text(raw.email).toLowerCase(),
    ensName: text(raw.ensName).toLowerCase(),
  }
}

/**
 * Regras do servidor: as mesmas do formulário e mais duas que só ele conhece
 * (código de indicação existente e endereço diferente da outra carteira).
 */
export function validateWalletInput(
  input: WalletInput,
  otherWallet: Wallet | undefined,
) {
  const errors: Record<string, string> = {}

  if (input.displayName.length < 2 || input.displayName.length > 40) {
    errors.displayName = 'Use de 2 a 40 caracteres.'
  }
  if (input.alias.length < 2 || input.alias.length > 30) {
    errors.alias = 'Use de 2 a 30 caracteres.'
  }
  if (!BLOCKCHAIN_NETWORKS.includes(input.network)) {
    errors.network = 'Selecione uma rede.'
  }
  if (!PROFILE_NAME.test(input.profileName)) {
    errors.profileName =
      'Use de 3 a 20 caracteres: letras minúsculas, números, ponto ou _.'
  }
  if (!EVM_ADDRESS.test(input.address)) {
    errors.address = 'Informe um endereço 0x com 40 caracteres hexadecimais.'
  } else if (
    otherWallet &&
    otherWallet.address.toLowerCase() === input.address.toLowerCase()
  ) {
    errors.address = `Este endereço já é a sua carteira ${SLOT_LABEL[otherWallet.slot]}.`
  }
  if (
    input.secondaryAddress !== null &&
    !EVM_ADDRESS.test(input.secondaryAddress) &&
    !ENS_FULL.test(input.secondaryAddress)
  ) {
    errors.secondaryAddress = 'Informe um nome ENS (.eth) ou um endereço 0x.'
  }
  if (!WALLET_PROVIDERS.includes(input.provider)) {
    errors.provider = 'Selecione o tipo de carteira.'
  }
  if (!referralCodeFixtures.includes(input.referralCode)) {
    errors.referralCode = 'Código de indicação inválido ou expirado.'
  }
  if (!EMAIL.test(input.email)) errors.email = 'Informe um e-mail válido.'
  if (!ENS_LABEL.test(input.ensName)) {
    errors.ensName =
      'Use de 3 a 32 caracteres: letras minúsculas, números ou -.'
  }

  return errors
}
