import { describe, expect, it } from 'vitest'
import {
  addEth,
  compareEth,
  formatEth,
  fromHundredths,
  fromWei,
  isEthAmount,
  minEth,
  multiplyEth,
  percentOfEth,
  subEth,
  sumEth,
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

describe('aritmética em wei', () => {
  it('fromWei devolve a string decimal mínima', () => {
    expect(fromWei(0n)).toBe('0')
    expect(fromWei(1_190_000_000_000_000_000n)).toBe('1.19')
    expect(fromWei(1n)).toBe('0.000000000000000001')
    expect(fromWei(26_000_000_000_000_000_000n)).toBe('26')
  })

  it('soma e subtrai sem erro de ponto flutuante', () => {
    expect(addEth('0.1', '0.2')).toBe('0.3')
    expect(addEth('26.83', '0.016')).toBe('26.846')
    expect(subEth('0.3', '0.1')).toBe('0.2')
    expect(subEth('1', '1.000000000000000001')).toBe('0')
  })

  it('soma uma lista', () => {
    expect(sumEth([])).toBe('0')
    expect(sumEth(['2.38', '8.34', '16.11'])).toBe('26.83')
  })

  it('multiplica por quantidade inteira', () => {
    expect(multiplyEth('1.39', 6)).toBe('8.34')
    expect(multiplyEth('1.79', 9)).toBe('16.11')
    expect(multiplyEth('0.1', 3)).toBe('0.3')
    expect(() => multiplyEth('1', 1.5)).toThrow()
    expect(() => multiplyEth('1', -1)).toThrow()
  })

  it('calcula percentual arredondando para baixo no wei', () => {
    expect(percentOfEth('26.83', '10')).toBe('2.683')
    expect(percentOfEth('1', '33.3')).toBe('0.333')
    expect(percentOfEth('0.000000000000000001', '50')).toBe('0')
  })

  it('limita ao menor valor', () => {
    expect(minEth('0.05', '0.03')).toBe('0.03')
    expect(minEth('0.05', '0.050')).toBe('0.05')
  })
})
