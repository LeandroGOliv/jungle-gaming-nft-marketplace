import { expect, test } from './support/mocks'
import type { Page } from '@playwright/test'

const NOVA = { email: 'nova@colecionador.test', password: 'Kurio@2026' }

async function signIn(page: Page) {
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail').fill(NOVA.email)
  await dialog.getByLabel('Senha', { exact: true }).fill(NOVA.password)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).toBeHidden()
}

const favoriteButton = (page: Page) =>
  page.getByRole('button', { name: 'Favoritar' })

const editions = (page: Page) =>
  page.getByRole('radiogroup', { name: 'Edição:' })

test.describe('detalhe do NFT', () => {
  test('acesso direto mostra galeria, informações, descrição e relacionados', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/nft/emerald-ape-042')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' }),
    ).toBeVisible()
    await expect(
      page.getByText('1.19 ETH').filter({ visible: true }).first(),
    ).toBeVisible()
    await expect(
      page.getByRole('img', { name: /^Emerald Ape #042:/ }).first(),
    ).toBeVisible()
    await expect(
      page.getByText('ID do token: #0042').filter({ visible: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('tabpanel', { name: 'Detalhes do NFT' }),
    ).toContainText('Contrato inteligente ERC-721 verificado.')
    await expect(
      page
        .getByRole('list', { name: 'NFTs da mesma coleção' })
        .getByRole('listitem'),
    ).toHaveCount(5)

    // O card relacionado leva a outro detalhe, que reinicia a seleção.
    await page
      .getByRole('list', { name: 'NFTs da mesma coleção' })
      .getByRole('link', { name: 'Ivory Baron #088' })
      .click()
    await expect(page).toHaveURL(/\/nft\/ivory-baron-088/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Ivory Baron #088' }),
    ).toBeVisible()
  })

  test('NFT inexistente exibe estado próprio', async ({ page, mocks }) => {
    await mocks.goto('/nft/nao-existe-999')

    await expect(
      page.getByRole('heading', { level: 1, name: 'NFT não encontrado' }),
    ).toBeVisible()
    await page.getByRole('link', { name: 'Voltar ao catálogo' }).click()
    await expect(page).toHaveURL(/#catalogo$/)
  })

  test('edição esgotada fica indisponível e a quantidade respeita o limite', async ({
    page,
    mocks,
  }) => {
    // Ivory Baron: 1/1 esgotada, 5 unidades da 1/10, 40 da 1/50.
    await mocks.goto('/nft/ivory-baron-088')

    const soldOut = editions(page).getByRole('radio', { name: '1/1, esgotada' })
    await expect(soldOut).toBeDisabled()
    await expect(
      editions(page).getByRole('radio', { name: '1/10' }),
    ).toBeChecked()
    await expect(
      page.getByText('5 de 10 disponíveis').filter({ visible: true }),
    ).toBeVisible()

    const increase = page.getByRole('button', { name: 'Aumentar quantidade' })
    const decrease = page.getByRole('button', { name: 'Diminuir quantidade' })
    const value = page.getByRole('group', { name: 'Qtd.' }).locator('output')
    await expect(decrease).toBeDisabled()
    for (let i = 0; i < 4; i++) await increase.click()
    await expect(value).toHaveText('5')
    await expect(increase).toBeDisabled()

    // Trocar de edição volta a quantidade para 1.
    await editions(page).getByRole('radio', { name: '1/50' }).click()
    await expect(value).toHaveText('1')
    await expect(increase).toBeEnabled()
  })

  test('visitante vai ao login ao favoritar e volta ao detalhe', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/nft/violet-nomad-314')
    await favoriteButton(page).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page).toHaveURL(/auth=entrar/)
    await signIn(page)

    await expect(page).toHaveURL(/\/nft\/violet-nomad-314$/)
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false')
  })

  test('favoritar e desfavoritar persistem para o usuário', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/nft/violet-nomad-314?auth=entrar')
    await signIn(page)

    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false')
    await favoriteButton(page).click()
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
    await expect(
      page.getByText('Violet Nomad #314 adicionado aos favoritos.'),
    ).toBeAttached()

    await page.reload()
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')

    await favoriteButton(page).click()
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false')
    // O otimista muda o botão antes da resposta: recarrega só após a confirmação.
    await expect(
      page.getByText('Violet Nomad #314 removido dos favoritos.'),
    ).toBeAttached()
    await page.reload()
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false')
  })

  test('falha ao favoritar desfaz a atualização otimista e permite recuperar', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/nft/violet-nomad-314?auth=entrar', {
      scenario: 'favorite-error',
    })
    await signIn(page)
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false')

    // A latência deixa observar o estado otimista antes da recusa.
    await mocks.setLatency({ kind: 'fixed', ms: 800 })
    await favoriteButton(page).click()
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByRole('alert')).toContainText(
      'Não foi possível favoritar Violet Nomad #314.',
    )

    // Com a API recuperada, a mesma ação funciona e persiste.
    await mocks.setFaults([])
    await mocks.setLatency('none')
    await favoriteButton(page).click()
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
    await page.reload()
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
  })

  test('skeleton durante carregamento lento', async ({ page, mocks }) => {
    await mocks.goto('/nft/emerald-ape-042', { latency: 'slow' })

    await expect(page.getByTestId('nft-detail-loading')).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' }),
    ).toBeVisible()
    await expect(page.getByTestId('nft-detail-loading')).toBeHidden()
  })
})
