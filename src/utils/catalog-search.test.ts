import { describe, expect, it } from 'vitest'
import {
  CATALOG_PAGE_SIZE,
  catalogSearchSchema,
  toNftListQuery,
  withFilters,
  withPage,
} from './catalog-search'

describe('catalogSearchSchema', () => {
  it('descarta valores inválidos em vez de quebrar a página', () => {
    expect(
      catalogSearchSchema.parse({
        busca: '  ',
        categoria: 'pintura',
        rede: 'solana',
        precoMin: '1,5',
        aba: 'antigos',
        ordem: 'aleatoria',
        pagina: -2,
      }),
    ).toEqual({})
  })

  it('aceita busca numérica e página como texto da URL', () => {
    expect(catalogSearchSchema.parse({ busca: 2024, pagina: '3' })).toEqual({
      busca: '2024',
      pagina: 3,
    })
  })

  it('mantém os valores válidos', () => {
    const search = {
      busca: 'ape',
      categoria: 'music',
      rede: 'polygon',
      precoMin: '0.5',
      precoMax: '2',
      aba: 'em-alta',
      ordem: 'menor-preco',
      pagina: 3,
    } as const
    expect(catalogSearchSchema.parse(search)).toEqual(search)
  })

  it('descarta faixa de preço invertida', () => {
    expect(catalogSearchSchema.parse({ precoMin: '3', precoMax: '1' })).toEqual(
      {},
    )
  })
})

describe('toNftListQuery', () => {
  it('traduz a URL para a query da API', () => {
    expect(
      toNftListQuery({
        busca: 'ape',
        categoria: 'music',
        rede: 'polygon',
        precoMin: '0.5',
        precoMax: '2',
        aba: 'novos',
        ordem: 'maior-preco',
        pagina: 2,
      }),
    ).toEqual({
      search: 'ape',
      category: 'music',
      network: 'polygon',
      minPrice: '0.5',
      maxPrice: '2',
      tab: 'new',
      sort: 'price-desc',
      page: 2,
      pageSize: CATALOG_PAGE_SIZE,
    })
  })

  it('usa os padrões da Início', () => {
    expect(toNftListQuery({})).toEqual({
      tab: 'all',
      sort: 'recent',
      page: 1,
      pageSize: CATALOG_PAGE_SIZE,
    })
  })
})

describe('withFilters', () => {
  it('reinicia a paginação e remove filtros limpos', () => {
    expect(
      withFilters(
        { busca: 'ape', categoria: 'art', pagina: 3 },
        { categoria: undefined, rede: 'polygon' },
      ),
    ).toEqual({ busca: 'ape', rede: 'polygon' })
  })
})

describe('withPage', () => {
  it('omite a página 1 e mantém os filtros', () => {
    expect(withPage({ busca: 'ape', pagina: 3 }, 1)).toEqual({ busca: 'ape' })
    expect(withPage({ busca: 'ape' }, 2)).toEqual({ busca: 'ape', pagina: 2 })
  })
})
