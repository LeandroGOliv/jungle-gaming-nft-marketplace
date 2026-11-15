import { expect, test } from './support/mocks'
import type { Mocks } from './support/mocks'
import type { Page } from '@playwright/test'

const NOVA = { email: 'nova@colecionador.test', password: 'Kurio@2026' }

const visible = { visible: true } as const

const items = (page: Page) =>
  page.getByRole('region', { name: 'Itens do carrinho' }).getByRole('listitem')

const summary = (page: Page) =>
  page.getByRole('region', { name: 'Resumo da carteira' })

const summaryValue = (page: Page, term: string) =>
  summary(page)
    .getByRole('term')
    .filter({ hasText: new RegExp(`^${term}`) })
    .locator('xpath=following-sibling::dd[1]')

const quantity = (page: Page, nftName: string) =>
  page
    .getByRole('group', { name: new RegExp(`^Quantidade de ${nftName}`) })
    .filter(visible)

/** Inclui pelo detalhe: escolhe a edição, ajusta a quantidade e compra. */
async function addFromDetail(
  page: Page,
  mocks: Mocks,
  nftId: string,
  {
    edition,
    quantity: units = 1,
  }: { edition?: string; quantity?: number } = {},
) {
  await mocks.goto(`/nft/${nftId}`)
  if (edition) {
    await page
      .getByRole('radiogroup', { name: 'Edição:' })
      .getByRole('radio', { name: edition })
      .click()
  }
  const increase = page
    .getByRole('button', { name: 'Aumentar quantidade' })
    .filter(visible)
  for (let i = 1; i < units; i++) await increase.click()
  await page
    .getByRole('button', { name: /^comprar/i })
    .filter(visible)
    .click()
  await expect(page).toHaveURL(/\/carrinho$/)
}

async function signIn(page: Page) {
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail').fill(NOVA.email)
  await dialog.getByLabel('Senha', { exact: true }).fill(NOVA.password)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).toBeHidden()
}

test.describe('carrinho', () => {
  test('inclui pelo detalhe, altera quantidade, remove e mostra o vazio', async ({
    page,
    mocks,
  }) => {
    await addFromDetail(page, mocks, 'violet-nomad-314', {
      edition: '1/50',
      quantity: 2,
    })

    await expect(items(page)).toHaveCount(1)
    const group = quantity(page, 'Violet Nomad #314')
    await expect(group.locator('output')).toHaveText('2')
    await expect(summaryValue(page, 'Subtotal')).toHaveText('2.78 ETH')
    await expect(summaryValue(page, 'Total')).toHaveText('2.796 ETH')

    await group.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(group.locator('output')).toHaveText('3')
    await expect(summaryValue(page, 'Subtotal')).toHaveText('4.17 ETH')
    await expect(summaryValue(page, 'Taxa de rede')).toContainText('0.016 ETH')
    await expect(summaryValue(page, 'Total')).toHaveText('4.186 ETH')
    await expect(
      page.getByText('Quantidade de Violet Nomad #314: 3.'),
    ).toBeAttached()

    await page
      .getByRole('button', { name: /^Remover Violet Nomad #314/ })
      .click()
    await expect(
      page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
    ).toBeVisible()
    await expect(
      page.getByText('Violet Nomad #314 removido do carrinho.'),
    ).toBeAttached()
  })

  test('indicador do header acompanha a quantidade', async ({
    page,
    mocks,
    isMobile,
  }) => {
    test.skip(
      isMobile,
      'O header com o indicador só existe a partir de 768 px.',
    )
    await addFromDetail(page, mocks, 'emerald-ape-042', {
      edition: '1/50',
      quantity: 2,
    })
    await expect(
      page.getByRole('link', { name: 'Carrinho, 2 itens' }),
    ).toBeVisible()
    await quantity(page, 'Emerald Ape #042')
      .getByRole('button', { name: 'Diminuir quantidade' })
      .click()
    await expect(
      page.getByRole('link', { name: 'Carrinho, 1 item' }),
    ).toBeVisible()
  })

  test('respeita a disponibilidade por edição', async ({ page, mocks }) => {
    // Golden Beat 1/10: 2 unidades à venda.
    await addFromDetail(page, mocks, 'golden-beat-207', {
      edition: '1/10',
      quantity: 2,
    })
    const group = quantity(page, 'Golden Beat #207')
    await expect(
      group.getByRole('button', { name: 'Aumentar quantidade' }),
    ).toBeDisabled()

    // Incluir mais pelo detalhe passa do disponível: a API recusa.
    // (`page.goto`: `mocks.goto` restauraria o cenário e esvaziaria o carrinho.)
    await page.goto('/nft/golden-beat-207')
    await page
      .getByRole('radiogroup', { name: 'Edição:' })
      .getByRole('radio', { name: '1/10' })
      .click()
    await page
      .getByRole('button', { name: /^comprar/i })
      .filter(visible)
      .click()
    await expect(
      page
        .getByText(/Só há 2 unidades disponíveis da edição 1\/10/)
        .filter(visible)
        .first(),
    ).toBeVisible()
    await expect(page).toHaveURL(/\/nft\/golden-beat-207/)

    // A disponibilidade cai com o item no carrinho: a cotação aponta e o checkout trava.
    await mocks.updateNft('golden-beat-207', { available: { 'ed-10': 1 } })
    await page.goto('/carrinho')
    await expect(
      page.getByText(/Só resta 1 unidade desta edição/),
    ).toBeVisible()
    const checkout = page.getByRole('button', { name: 'Conectar e finalizar' })
    await expect(checkout).toBeDisabled()
    await quantity(page, 'Golden Beat #207')
      .getByRole('button', { name: 'Diminuir quantidade' })
      .click()
    await expect(
      page.getByRole('link', { name: 'Conectar e finalizar' }),
    ).toBeVisible()
  })

  test('cupom inválido, expirado, aplicado e removido', async ({
    page,
    mocks,
  }) => {
    await addFromDetail(page, mocks, 'violet-nomad-314', {
      edition: '1/50',
      quantity: 6,
    })
    const field = page.getByLabel('Código promocional')
    const apply = page.getByRole('button', { name: 'Aplicar' })

    await apply.click()
    await expect(page.getByText('Informe o código promocional.')).toBeVisible()

    await field.fill('NAOEXISTE')
    await apply.click()
    await expect(page.getByText('Código promocional inválido.')).toBeVisible()
    await expect(field).toHaveAttribute('aria-invalid', 'true')

    await field.fill('verao25')
    await apply.click()
    await expect(page.getByText('O código VERAO25 expirou.')).toBeVisible()
    await expect(summaryValue(page, 'Desconto')).toHaveText('(-) 0.00 ETH')

    await field.fill('kurio10')
    await apply.click()
    await expect(page.getByText('10% de desconto aplicado.')).toBeVisible()
    await expect(summaryValue(page, 'Subtotal')).toHaveText('8.34 ETH')
    await expect(summaryValue(page, 'Desconto')).toHaveText('(-) 0.834 ETH')
    await expect(summaryValue(page, 'Total')).toHaveText('7.522 ETH')

    await page.getByRole('button', { name: 'Remover o código KURIO10' }).click()
    await expect(summaryValue(page, 'Desconto')).toHaveText('(-) 0.00 ETH')
    await expect(summaryValue(page, 'Total')).toHaveText('8.356 ETH')
  })

  test('persiste após refresh e preserva os itens do visitante ao entrar', async ({
    page,
    mocks,
  }) => {
    await addFromDetail(page, mocks, 'emerald-ape-042', {
      edition: '1/50',
      quantity: 2,
    })
    await page.getByLabel('Código promocional').fill('KURIO10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('10% de desconto aplicado.')).toBeVisible()

    await page.reload()
    await expect(items(page)).toHaveCount(1)
    await expect(
      quantity(page, 'Emerald Ape #042').locator('output'),
    ).toHaveText('2')

    await page.goto('/carrinho?auth=entrar')
    await signIn(page)
    await expect(items(page)).toHaveCount(1)
    await expect(
      quantity(page, 'Emerald Ape #042').locator('output'),
    ).toHaveText('2')
    await expect(page.getByText('10% de desconto aplicado.')).toBeVisible()

    // Agora é o carrinho da conta: continua depois do refresh.
    await page.reload()
    await expect(items(page)).toHaveCount(1)
    await expect(summaryValue(page, 'Total')).toHaveText('2.158 ETH')
  })

  test('skeleton do carrinho e do resumo em carregamento lento', async ({
    page,
    mocks,
  }) => {
    await addFromDetail(page, mocks, 'emerald-ape-042', { edition: '1/50' })
    await mocks.setLatency({ kind: 'fixed', ms: 1500 })
    await page.reload()

    await expect(
      page.getByRole('status', { name: 'Carregando o carrinho' }),
    ).toBeVisible()
    await expect(
      page.getByRole('status', { name: 'Calculando valores' }),
    ).toBeVisible()
    await expect(summaryValue(page, 'Total')).toHaveText('1.206 ETH')
    await expect(
      page.getByRole('status', { name: 'Calculando valores' }),
    ).toBeHidden()
  })
})
