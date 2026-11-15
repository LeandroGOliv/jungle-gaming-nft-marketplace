import type { BlockchainNetwork } from './nft'

export const WALLET_SLOTS = ['primary', 'secondary'] as const

export type WalletSlot = (typeof WALLET_SLOTS)[number]

export const WALLET_PROVIDERS = [
  'metamask',
  'walletconnect',
  'coinbase',
] as const

export type WalletProvider = (typeof WALLET_PROVIDERS)[number]

/** Campos editáveis de uma carteira, na ordem do formulário do Figma. */
export interface WalletInput {
  displayName: string
  alias: string
  network: BlockchainNetwork
  profileName: string
  /** Endereço EVM `0x` + 40 dígitos hexadecimais. */
  address: string
  /** ENS (`nome.eth`) ou outro endereço `0x`; opcional. */
  secondaryAddress: string | null
  provider: WalletProvider
  referralCode: string
  email: string
  /** Sem o sufixo `.eth`, que a interface acrescenta. */
  ensName: string
}

/** Carteira cadastrada: uma por posição (principal e secundária) e por usuário. */
export interface Wallet extends WalletInput {
  id: string
  slot: WalletSlot
  updatedAt: string
}

/** `GET /wallets` e resposta das mutations: sempre a lista completa do usuário. */
export interface WalletsResponse {
  wallets: Array<Wallet>
}

/** `POST /wallets`: cadastra a carteira da posição, que precisa estar livre. */
export interface CreateWalletRequest extends WalletInput {
  slot: WalletSlot
}

/** `PUT /wallets/:walletId`: substitui os campos de uma carteira existente. */
export type UpdateWalletRequest = WalletInput

export type WalletErrorReason = 'WALLET_SLOT_TAKEN' | 'WALLET_NOT_FOUND'
