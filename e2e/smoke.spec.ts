import { expect, test } from '@playwright/test'

test('carrega a página inicial com os mocks ativos', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Marketplace de NFTs' }),
  ).toBeVisible()

  const hasWorker = await page.evaluate(
    async () => (await navigator.serviceWorker.getRegistrations()).length > 0,
  )
  expect(hasWorker).toBe(true)
})
