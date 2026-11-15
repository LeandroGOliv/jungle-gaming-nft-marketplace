import type { WalletProvider, WalletSlot } from '@/types/wallet'

export const PROVIDER_LABELS: Record<WalletProvider, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

export const SLOT_TITLES: Record<WalletSlot, string> = {
  primary: 'Carteira principal',
  secondary: 'Carteira secundária',
}

/** `0xA91F…E82C`: o endereço inteiro não cabe no resumo mobile. */
export const shortAddress = (address: string) =>
  `${address.slice(0, 6)}…${address.slice(-4)}`
