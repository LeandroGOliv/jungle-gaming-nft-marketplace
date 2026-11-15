import { expect, test } from './support/mocks'
import type { Page } from '@playwright/test'

// Baselines geradas no Windows (sufixo -win32); o CI em Linux pula esta suíte
// com `--grep-invert @visual`, já que a renderização de fontes difere entre sistemas.

const NOVA = { email: 'nova@colecionador.test', password: 'Kurio@2026' }

async function signIn(page: Page) {
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail').fill(NOVA.email)
  await dialog.getByLabel('Senha', { exact: true }).fill(NOVA.password)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).toBeHidden()
}

/** Espera fontes, imagens e o fim dos skeletons antes da captura. */
async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  // Percorre a página para as imagens com `loading="lazy"` entrarem na captura inteira.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) {
      scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    scrollTo(0, 0)
    await document.fonts.ready
  })
  await page.waitForFunction(() =>
    // Imagens lazy escondidas no viewport (`display: none`) nunca carregam.
    Array.from(document.images)
      .filter((img) => img.checkVisibility())
      .every((img) => img.complete),
  )
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
}

async function snapshot(page: Page, name: string) {
  await settle(page)
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.01,
  })
}

test.describe('regressão visual', { tag: '@visual' }, () => {
  test('início', async ({ page, mocks }) => {
    await mocks.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await snapshot(page, 'inicio')
  })

  test('detalhe do NFT', async ({ page, mocks }) => {
    await mocks.goto('/nft/emerald-ape-042')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' }),
    ).toBeVisible()
    await snapshot(page, 'detalhe')
  })

  test('carrinho', async ({ page, mocks }) => {
    await mocks.goto('/carrinho?auth=entrar', { scenario: 'checkout' })
    await signIn(page)
    await expect(
      page
        .getByRole('region', { name: 'Itens do carrinho' })
        .getByRole('listitem')
        .first(),
    ).toBeVisible()
    await snapshot(page, 'carrinho')
  })

  test('pagamento', async ({ page, mocks }) => {
    await mocks.goto('/pagamento', { scenario: 'checkout' })
    await signIn(page)
    await expect(
      page.getByRole('group', { name: 'Carteira e rede' }),
    ).toBeVisible()
    await snapshot(page, 'pagamento')
  })
})
