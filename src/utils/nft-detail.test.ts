import { describe, expect, it } from 'vitest'
import {
  clampQuantity,
  defaultEditionId,
  formatPercent,
  shortenAddress,
} from './nft-detail'
import type { NftEdition } from '@/types/nft'

const edition = (id: string, available: number): NftEdition => ({
  id,
  label: '1/10',
  supply: 10,
  available,
})

describe('defaultEditionId', () => {
  it('escolhe a primeira edição com unidades à venda', () => {
    expect(defaultEditionId([edition('a', 0), edition('b', 3)])).toBe('b')
  })

  it('cai na primeira edição quando todas estão esgotadas', () => {
    expect(defaultEditionId([edition('a', 0), edition('b', 0)])).toBe('a')
  })

  it('devolve undefined sem edições', () => {
    expect(defaultEditionId([])).toBeUndefined()
  })
})

describe('clampQuantity', () => {
  it('mantém um inteiro dentro de 1..disponível', () => {
    expect(clampQuantity(3, 5)).toBe(3)
    expect(clampQuantity(9, 5)).toBe(5)
    expect(clampQuantity(0, 5)).toBe(1)
  })

  it('descarta frações', () => {
    expect(clampQuantity(2.7, 5)).toBe(2)
  })

  it('fica em 1 quando a edição está esgotada', () => {
    expect(clampQuantity(4, 0)).toBe(1)
  })
})

describe('shortenAddress', () => {
  it('mantém os 4 primeiros e os 4 últimos dígitos hexadecimais', () => {
    expect(shortenAddress('0x7A42c9F1e0B3d5A8f2C4e6B9a1D3f5E7c2B019E8')).toBe(
      '0x7A42...19E8',
    )
  })
})

describe('formatPercent', () => {
  it('usa vírgula decimal e omite casas desnecessárias', () => {
    expect(formatPercent(5)).toBe('5%')
    expect(formatPercent(2.5)).toBe('2,5%')
  })
})
