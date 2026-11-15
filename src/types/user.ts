import type { BlockchainNetwork } from './nft'

/** Perfil público do colecionador. A senha nunca trafega nem é armazenada em claro. */
export interface User {
  id: string
  email: string
  username: string
  displayName: string
  /** Sem o sufixo `.eth`, que a interface acrescenta. */
  ensName: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export type WalletSlot = 'primary' | 'secondary'

export type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase'

export interface Wallet {
  id: string
  slot: WalletSlot
  provider: WalletProvider
  alias: string
  address: string
  network: BlockchainNetwork
  ensName: string | null
  updatedAt: string
}
