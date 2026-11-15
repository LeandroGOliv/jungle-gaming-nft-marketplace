import { expect, test } from './support/mocks'
import type { Page } from '@playwright/test'

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 768

const grid = (page: Page) => page.getByRole('list', { name: 'NFTs à venda' })
const cardNames = (page: Page) =>
  grid(page).getByRole('heading', { level: 3 }).allTextContents()

/** Parâmetros da última chamada a `GET /nfts` (sem os destaques da sidebar). */
function captureListRequests(page: Page) {
  const calls: Array<URLSearchParams> = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.endsWith('/nfts') && !url.searchParams.has('featured'))
      calls.push(url.searchParams)
  })
  return calls
}

/** No desktop o painel fica na sidebar; abaixo de `lg`, num bottom sheet. */
async function withFilters(page: Page, action: () => Promise<void>) {
  if (!isMobile(page)) return action()
  await page.getByRole('button', { name: 'Filtros' }).click()
  await action()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
}

const filters = (page: Page) =>
  isMobile(page)
    ? page.getByRole('dialog')
    : page.getByTestId('catalog-filters')

async function search(page: Page, term: string) {
  const field = page
    .getByRole('searchbox', { name: 'Buscar NFTs' })
    .filter({ visible: true })
  await field.fill(term)
  await field.press('Enter')
}

test.describe('catálogo da Início', () => {
  test('busca, filtros combinados, ordenação, paginação e histórico', async ({
    page,
    mocks,
  }) => {
    const calls = captureListRequests(page)
    await mocks.goto('/')
    await expect(grid(page).getByRole('listitem')).toHaveCount(9)

    // Paginação primeiro, para provar que o filtro a reinicia.
    await page
      .getByRole('navigation', { name: 'Paginação do catálogo' })
      .getByRole('link', { name: 'Página 2' })
      .click()
    await expect(page).toHaveURL(/pagina=2/)
    await expect(
      page.getByRole('link', { name: 'Página 2', exact: true }),
    ).toHaveAttribute('aria-current', 'page')

    await withFilters(page, () =>
      filters(page)
        .getByRole('button', { name: /^Música/ })
        .click(),
    )
    await expect(page).toHaveURL(/categoria=music/)
    await expect(page).not.toHaveURL(/pagina=/)

    await withFilters(page, () =>
      filters(page)
        .getByRole('button', { name: /^Polygon/ })
        .click(),
    )
    await expect(page).toHaveURL(/rede=polygon/)

    await withFilters(page, async () => {
      await page
        .getByRole('combobox')
        .filter({ hasText: 'Listados' })
        .first()
        .click()
      await page.getByRole('option', { name: 'Menor preço' }).click()
    })
    await expect(page).toHaveURL(/ordem=menor-preco/)

    // Polygon + música: Jade Rhythm (0.59), Amber Pulse (0.84), Honey Static
    // (1.05), Golden Signal (1.69), na ordem de preço.
    await expect
      .poll(() => cardNames(page))
      .toEqual([
        'Jade Rhythm #233',
        'Amber Pulse #405',
        'Honey Static #388',
        'Golden Signal #160',
      ])

    // A última consulta reflete exatamente o estado da URL.
    const last = calls.at(-1)!
    expect(Object.fromEntries(last)).toEqual({
      category: 'music',
      network: 'polygon',
      tab: 'all',
      sort: 'price-asc',
      page: '1',
      pageSize: '9',
    })

    await search(page, 'golden')
    await expect(page).toHaveURL(/busca=golden/)
    await expect.poll(() => cardNames(page)).toEqual(['Golden Signal #160'])

    // Voltar desfaz um passo por vez; refresh mantém o estado.
    await page.goBack()
    await expect(page).not.toHaveURL(/busca=/)
    await expect.poll(() => cardNames(page)).toHaveLength(4)
    await page.goBack()
    await expect(page).not.toHaveURL(/ordem=/)
    await expect.poll(() => cardNames(page)).toHaveLength(4)
    await page.reload()
    await expect(page).toHaveURL(
      /categoria=music&rede=polygon|rede=polygon.*categoria=music/,
    )
    await expect.poll(() => cardNames(page)).toHaveLength(4)
    await page.goForward()
    await expect(page).toHaveURL(/ordem=menor-preco/)
    await expect.poll(() => cardNames(page)).toHaveLength(4)
  })

  test('abas recortam o catálogo e reiniciam a paginação', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/?pagina=3')
    await page.getByRole('link', { name: 'Em alta' }).click()
    await expect(page).toHaveURL(/aba=em-alta/)
    await expect(page).not.toHaveURL(/pagina=/)
    await expect(page.getByRole('link', { name: 'Em alta' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(grid(page).getByRole('listitem')).not.toHaveCount(0)
  })

  test('faixa de preço aplicada vai para a URL e para a API', async ({
    page,
    mocks,
  }) => {
    const calls = captureListRequests(page)
    await mocks.goto('/')
    await expect(grid(page)).toBeVisible()

    await withFilters(page, async () => {
      const max = filters(page).getByRole('slider', { name: 'Preço máximo' })
      await max.focus()
      // Cada PageDown desce 10 passos de 0,01 ETH no Radix.
      for (let i = 0; i < 80; i++) await max.press('PageDown')
      await expect(
        filters(page).getByText('Preço: 0,05 - 0,92 ETH'),
      ).toBeVisible()
      await filters(page).getByRole('button', { name: 'Aplicar' }).click()
    })

    await expect(page).toHaveURL(/precoMax=0.92/)
    await expect.poll(() => calls.at(-1)?.get('maxPrice')).toBe('0.92')
    // Todos abaixo de 1 ETH: o limite chegou à API e voltou aplicado.
    for (const price of await grid(page).getByText(/ETH$/).allTextContents())
      expect(price).toMatch(/^Preço: 0\.\d{2} ETH$/)
  })

  test('resposta antiga fora de ordem não sobrescreve a busca mais recente', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/')
    await expect(grid(page)).toBeVisible()
    // Alterna 1,5 s e 150 ms: a primeira busca demora mais que a segunda.
    await mocks.setLatency('out-of-order')

    await search(page, 'emerald')
    await search(page, 'golden')

    const golden = ['Golden Beat #207', 'Golden Signal #160']
    await expect
      .poll(async () => (await cardNames(page)).sort())
      .toEqual(golden)
    // Depois que a resposta lenta chega, o resultado continua o da última busca.
    await page.waitForTimeout(1700)
    expect((await cardNames(page)).sort()).toEqual(golden)
  })

  test('troca de página mantém a lista anterior enquanto atualiza', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/')
    await expect(grid(page).getByRole('listitem')).toHaveCount(9)
    await mocks.setLatency({ kind: 'fixed', ms: 1200 })

    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page.getByTestId('catalog-refreshing')).toBeVisible()
    await expect(grid(page).getByRole('listitem')).toHaveCount(9)
    await expect(page.getByTestId('catalog-loading')).toHaveCount(0)
    await expect(page.getByTestId('catalog-refreshing')).toBeHidden()
  })

  test('busca sem resultado mostra o vazio e permite limpar', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/?busca=inexistente')
    await expect(
      page.getByRole('heading', { name: 'Nenhum NFT encontrado' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Limpar filtros' }).click()
    await expect(page).not.toHaveURL(/busca=/)
    await expect(grid(page).getByRole('listitem')).toHaveCount(9)
  })

  test('catálogo vazio no cenário sem NFTs', async ({ page, mocks }) => {
    await mocks.goto('/', { scenario: 'empty' })
    await expect(
      page.getByText('Ainda não há NFTs à venda no catálogo.'),
    ).toBeVisible()
  })

  test('skeleton em carregamento lento, falha e recuperação com nova tentativa', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/', { scenario: 'server-error', latency: 'slow' })
    await expect(page.getByTestId('catalog-loading')).toBeVisible()

    // A falha aparece depois da tentativa e das repetições automáticas.
    await expect(
      page.getByRole('heading', {
        name: 'Não foi possível carregar o catálogo',
      }),
    ).toBeVisible({ timeout: 20_000 })

    await mocks.setFaults([])
    await mocks.setLatency('none')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(grid(page).getByRole('listitem')).toHaveCount(9)
  })

  test('card leva ao detalhe do NFT', async ({ page, mocks }) => {
    await mocks.goto('/?busca=emerald')
    await grid(page).getByRole('link', { name: 'Emerald Ape #042' }).click()
    await expect(page).toHaveURL(/\/nft\/emerald-ape-042$/)
  })
})
