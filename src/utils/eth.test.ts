import { describe, expect, it } from 'vitest'
import {
  compareEth,
  formatEth,
  fromHundredths,
  isEthAmount,
  toHundredths,
} from './eth'

describe('isEthAmount', () => {
  it('aceita decimais não negativos com até 18 casas', () => {
    expect(isEthAmount('0')).toBe(true)
    expect(isEthAmount('1.19')).toBe(true)
    expect(isEthAmount('0.000000000000000001')).toBe(true)
  })

  it('rejeita formatos que não são valores em ETH', () => {
    for (const value of ['', '-1', '1,2', '.5', '1.', 'abc', '1e3']) {
      expect(isEthAmount(value)).toBe(false)
    }
    expect(isEthAmount('0.0000000000000000001')).toBe(false)
  })
})

describe('compareEth', () => {
  it('compara sem erro de ponto flutuante', () => {
    expect(compareEth('0.3', '0.30')).toBe(0)
    expect(compareEth('0.1', '0.09')).toBe(1)
    expect(compareEth('1.19', '1.2')).toBe(-1)
    expect(compareEth('10', '9.999999999999999999')).toBe(1)
  })
})

describe('formatEth', () => {
  it('mantém ao menos duas casas, como o Figma', () => {
    expect(formatEth('1.19')).toBe('1.19 ETH')
    expect(formatEth('2')).toBe('2.00 ETH')
    expect(formatEth('0.125')).toBe('0.125 ETH')
    expect(formatEth('3.10')).toBe('3.10 ETH')
  })
})

describe('centésimos', () => {
  it('converte para a posição do slider arredondando para baixo', () => {
    expect(toHundredths('1.19')).toBe(119)
    expect(toHundredths('0.125')).toBe(12)
    expect(toHundredths('8')).toBe(800)
  })

  it('volta para string decimal', () => {
    expect(fromHundredths(119)).toBe('1.19')
    expect(fromHundredths(5)).toBe('0.05')
    expect(fromHundredths(800)).toBe('8.00')
  })
})
