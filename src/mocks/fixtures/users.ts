import type { PasswordCredential } from '../password'
import type { CartRecord } from '../db'
import type { Order } from '@/types/order'
import type { User, Wallet } from '@/types/user'

export interface UserRecord extends User, PasswordCredential {}

/**
 * Credenciais documentadas no README: nova@colecionador.test / Kurio@2026 e
 * rafael@colecionador.test / Selva#2026. Só o hash SHA-256 de `salt:senha` fica aqui.
 */
export const userFixtures: Array<UserRecord> = [
  {
    id: 'usr_nova',
    email: 'nova@colecionador.test',
    username: 'novasato',
    displayName: 'Nova Sato',
    ensName: 'nova.kurio',
    avatarUrl: null,
    createdAt: '2026-02-11T14:20:00.000Z',
    updatedAt: '2026-02-11T14:20:00.000Z',
    passwordSalt: 'b7c1f0a94e2d3586',
    passwordHash:
      '385d3f2bac34bc948627a0ab7269f9573cc894e9fc83635efe5e5b1aadc34afa',
  },
  {
    id: 'usr_rafael',
    email: 'rafael@colecionador.test',
    username: 'rafalima',
    displayName: 'Rafael Lima',
    ensName: null,
    avatarUrl: null,
    createdAt: '2026-04-03T09:05:00.000Z',
    updatedAt: '2026-04-03T09:05:00.000Z',
    passwordSalt: '4e9a2c7d1b08f356',
    passwordHash:
      '0a9613615ceb997573c2e9092463e1333daa2ff07223617d2fe141891c07b71b',
  },
]

// Nova reproduz o Figma: só a carteira principal, na Polygon, com ENS.
export const walletFixtures: Record<string, Array<Wallet>> = {
  usr_nova: [
    {
      id: 'wal_nova_primary',
      slot: 'primary',
      provider: 'metamask',
      alias: 'Carteira principal',
      address: '0xA91F3c6B2d8E4a7F0b19C5e3D62f8A4b7c1DE82C',
      network: 'polygon',
      ensName: 'nova.kurio',
      updatedAt: '2026-02-11T14:25:00.000Z',
    },
  ],
  usr_rafael: [
    {
      id: 'wal_rafael_primary',
      slot: 'primary',
      provider: 'coinbase',
      alias: 'Coinbase do dia a dia',
      address: '0x4D2e8B7a1C9f03E6b5A47d2C8e1F9a0B3c6D7E15',
      network: 'ethereum',
      ensName: null,
      updatedAt: '2026-04-03T09:10:00.000Z',
    },
    {
      id: 'wal_rafael_secondary',
      slot: 'secondary',
      provider: 'walletconnect',
      alias: 'Cofre',
      address: '0x8B1c5F3e7A2d9C04e6B8a1D3f5C7e9A2b4D6F890',
      network: 'polygon',
      ensName: null,
      updatedAt: '2026-04-05T18:40:00.000Z',
    },
  ],
}

export const favoriteFixtures: Record<string, Array<string>> = {
  usr_nova: ['emerald-ape-042', 'ivory-baron-088', 'neon-vessel-552'],
  usr_rafael: ['golden-beat-207', 'alabaster-duke-099'],
}

export const cartFixtures: Record<string, CartRecord> = {
  usr_nova: { items: [], couponCode: null, version: 1 },
  usr_rafael: {
    items: [{ nftId: 'golden-signal-160', editionId: 'ed-10', quantity: 1 }],
    couponCode: null,
    version: 1,
  },
}

const NETWORK_FEE_ETH = '0.016'

export const orderFixtures: Array<Order> = [
  // Reproduz o recibo da Confirmação de Pedido no Figma.
  {
    id: 'ord_0001',
    userId: 'usr_nova',
    idempotencyKey: 'fixture-nova-0001',
    status: 'confirmed',
    items: [
      {
        nftId: 'emerald-ape-042',
        editionId: 'ed-50',
        name: 'Emerald Ape #042',
        tokenId: '#0042',
        editionLabel: '1/50',
        imageUrl: '/images/nft-artwork-emerald-400.webp',
        unitPriceEth: '1.19',
        quantity: 2,
        lineTotalEth: '2.38',
      },
      {
        nftId: 'violet-nomad-314',
        editionId: 'ed-50',
        name: 'Violet Nomad #314',
        tokenId: '#0314',
        editionLabel: '1/50',
        imageUrl: '/images/nft-artwork-violet-400.webp',
        unitPriceEth: '1.39',
        quantity: 6,
        lineTotalEth: '8.34',
      },
      {
        nftId: 'ivory-baron-088',
        editionId: 'ed-50',
        name: 'Ivory Baron #088',
        tokenId: '#0088',
        editionLabel: '1/50',
        imageUrl: '/images/nft-artwork-ivory-400.webp',
        unitPriceEth: '1.79',
        quantity: 9,
        lineTotalEth: '16.11',
      },
    ],
    subtotalEth: '26.83',
    discountEth: '0',
    networkFeeEth: NETWORK_FEE_ETH,
    totalEth: '26.846',
    couponCode: null,
    walletId: 'wal_nova_primary',
    network: 'ethereum',
    transactionHash:
      '0xa91f6c0d3e8b27f4a5c19d0e7b3f62a8c4d1e9f05b7a3c6d2e8f14b09c5de82c',
    refusalReason: null,
    createdAt: '2026-07-29T15:42:00.000Z',
    updatedAt: '2026-07-29T15:42:30.000Z',
    version: 2,
  },
  {
    id: 'ord_0002',
    userId: 'usr_rafael',
    idempotencyKey: 'fixture-rafael-0001',
    status: 'refused',
    items: [
      {
        nftId: 'golden-beat-207',
        editionId: 'ed-50',
        name: 'Golden Beat #207',
        tokenId: '#0207',
        editionLabel: '1/50',
        imageUrl: '/images/nft-artwork-golden-400.webp',
        unitPriceEth: '0.99',
        quantity: 1,
        lineTotalEth: '0.99',
      },
    ],
    subtotalEth: '0.99',
    discountEth: '0',
    networkFeeEth: NETWORK_FEE_ETH,
    totalEth: '1.006',
    couponCode: null,
    walletId: 'wal_rafael_primary',
    network: 'ethereum',
    transactionHash: null,
    refusalReason: 'Saldo insuficiente na carteira selecionada.',
    createdAt: '2026-08-14T10:03:00.000Z',
    updatedAt: '2026-08-14T10:03:20.000Z',
    version: 2,
  },
]
