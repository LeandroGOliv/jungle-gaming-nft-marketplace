import type { BlockchainNetwork, EthAmount } from './nft'
import type { WalletProvider } from './wallet'

/** Header da chave de idempotência em `POST /orders`. */
export const IDEMPOTENCY_HEADER = 'Idempotency-Key'

/**
 * Conexão simulada de uma carteira com um provedor (MetaMask, WalletConnect,
 * Coinbase). Pertence ao usuário da sessão; o pedido só é aceito com uma
 * conexão ativa para o mesmo endereço, rede e provedor.
 */
export interface WalletConnection {
  id: string
  walletAddress: string
  network: BlockchainNetwork
  provider: WalletProvider
  status: 'connected' | 'disconnected'
  connectedAt: string
  version: number
  updatedAt: string
}

/** `POST /wallet-connections`. */
export interface CreateWalletConnectionRequest {
  walletAddress: string
  network: BlockchainNetwork
  provider: WalletProvider
}

/** Dados do colecionador enviados com o pedido ("Perfil do colecionador" do Figma). */
export interface CollectorInput {
  displayName: string
  username: string
  network: BlockchainNetwork
  profileName: string
  walletAddress: string
  /** ENS (`nome.eth`) ou outro endereço `0x`; opcional. */
  secondaryAddress: string | null
  provider: WalletProvider
  referralCode: string
  email: string
  /** Sem o sufixo `.eth`. */
  ensName: string
  note: string | null
}

/**
 * `POST /orders`, com a chave em `Idempotency-Key`. `quote` é a cotação que o
 * usuário revisou: se a do servidor divergir, o pedido não é criado (409).
 */
export interface CreateOrderRequest {
  connectionId: string
  /** Carteira cadastrada usada; `null` quando o colecionador informou outra. */
  walletId: string | null
  collector: CollectorInput
  quote: { cartVersion: number; totalEth: EthAmount }
}

export type CheckoutErrorReason =
  | 'QUOTE_CHANGED'
  | 'CART_EMPTY'
  | 'WALLET_CONNECTION_REFUSED'
  | 'WALLET_NOT_CONNECTED'
  | 'WALLET_CONNECTION_NOT_FOUND'
  | 'IDEMPOTENCY_KEY_REUSED'
