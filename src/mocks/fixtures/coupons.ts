import type { EthAmount } from '@/types/nft'

export interface CouponRecord {
  code: string
  kind: 'percent' | 'fixed'
  /** Percentual (`"10"`) ou valor em ETH (`"0.05"`), conforme `kind`. */
  value: string
  minSubtotalEth: EthAmount | null
  /** ISO 8601; `null` não expira. */
  expiresAt: string | null
}

export const couponFixtures: Array<CouponRecord> = [
  {
    code: 'KURIO10',
    kind: 'percent',
    value: '10',
    minSubtotalEth: null,
    expiresAt: null,
  },
  {
    code: 'GENESIS05',
    kind: 'fixed',
    value: '0.05',
    minSubtotalEth: '1',
    expiresAt: null,
  },
  {
    code: 'VERAO25',
    kind: 'percent',
    value: '25',
    minSubtotalEth: null,
    expiresAt: '2026-03-31T23:59:59.000Z',
  },
]
