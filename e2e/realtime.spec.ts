import { expect, test } from './support/mocks'
import type { Page } from '@playwright/test'
import type { NftUpdatedData, RealtimeEnvelope } from '../src/types/realtime'

const visible = { visible: true } as const

/** Golden Beat #207: 0.99 ETH, edições 1/10 (2 disponíveis) e 1/50 (12). */
const NFT_ID = 'golden-beat-207'
const NFT_NAME = 'Golden Beat #207'

const detailPrice = (page: Page) =>
  page
    .locator('p')
    .filter({ hasText: /^Preço por unidade:/ })
    .filter(visible)
    .first()

const editions = (page: Page) =>
  page.getByRole('radiogroup', { name: 'Edição:' }).filter(visible)

const politeRegion = (page: Page) =>
  page.locator('[role="status"][aria-live="polite"]')

const summaryValue = (page: Page, term: string) =>
  page
    .getByRole('region', { name: 'Resumo da carteira' })
    .getByRole('term')
    .filter({ hasText: new RegExp(`^${term}`) })
    .locator('xpath=following-sibling::dd[1]')

/** Envelope cru, para duplicatas e versões antigas que o store não geraria. */
function nftEvent(
  eventId: string,
  version: number,
  priceEth: string,
): RealtimeEnvelope<NftUpdatedData> {
  return {
    eventId,
    resource: { type: 'nft', id: NFT_ID },
    version,
    emittedAt: new Date().toISOString(),
    data: {
      priceEth,
      editions: [
        { id: 'ed-10', available: 2 },
        { id: 'ed-50', available: 12 },
      ],
    },
  }
}

test.describe('tempo real: nft.updated', () => {
  test('o catálogo e o detalhe refletem preço e disponibilidade pelo Socket.IO', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/?busca=Golden%20Beat')
    const card = page.getByRole('article').filter({ hasText: NFT_NAME })
    await expect(card).toContainText('0.99 ETH')
    await expect
      .poll(async () => (await mocks.state()).realtimeConnections)
      .toBe(1)

    await mocks.updateNft(NFT_ID, { priceEth: '1.25' })
    await expect(card).toContainText('1.25 ETH')

    await card.getByRole('link', { name: NFT_NAME }).click()
    await expect(detailPrice(page)).toHaveText('Preço por unidade: 1.25 ETH')

    await mocks.updateNft(NFT_ID, {
      priceEth: '1.4',
      available: { 'ed-10': 0 },
    })
    await expect(detailPrice(page)).toHaveText('Preço por unidade: 1.40 ETH')
    await expect(
      editions(page).getByRole('radio', { name: '1/10, esgotada' }),
    ).toBeDisabled()
    await expect(politeRegion(page)).toHaveText(
      `O preço de ${NFT_NAME} mudou de 1.25 ETH para 1.40 ETH. A edição 1/10 de ${NFT_NAME} esgotou.`,
    )
  })

  test('eventos duplicados ou antigos não regridem o estado', async ({
    page,
    mocks,
  }) => {
    await mocks.goto(`/nft/${NFT_ID}`)
    await expect
      .poll(async () => (await mocks.state()).realtimeConnections)
      .toBe(1)

    await mocks.emit('nft.updated', nftEvent('evt_test_a', 2, '2.00'))
    await expect(detailPrice(page)).toHaveText('Preço por unidade: 2.00 ETH')

    // Antigo, duplicata pelo id e duplicata pela versão: nenhum deve valer.
    await mocks.emit('nft.updated', nftEvent('evt_test_old', 1, '0.01'))
    await mocks.emit('nft.updated', nftEvent('evt_test_a', 2, '2.00'))
    await mocks.emit('nft.updated', nftEvent('evt_test_b', 2, '7.77'))
    // Os eventos chegam em ordem: quando este aparece, os anteriores já passaram.
    await mocks.emit('nft.updated', {
      ...nftEvent('evt_test_c', 3, '2.00'),
      data: {
        priceEth: '2.00',
        editions: [
          { id: 'ed-10', available: 2 },
          { id: 'ed-50', available: 5 },
        ],
      },
    })
    await editions(page).getByRole('radio', { name: '1/50' }).click()
    await expect(
      page.getByText('5 de 50 disponíveis').filter(visible),
    ).toBeVisible()
    await expect(detailPrice(page)).toHaveText('Preço por unidade: 2.00 ETH')
  })

  test('após a queda da conexão, a reconexão reconcilia o detalhe pela REST', async ({
    page,
    mocks,
  }) => {
    await mocks.goto(`/nft/${NFT_ID}`)
    await expect(detailPrice(page)).toHaveText('Preço por unidade: 0.99 ETH')
    await expect
      .poll(async () => (await mocks.state()).realtimeConnections)
      .toBe(1)

    await mocks.setRealtimeAvailable(false)
    await expect
      .poll(async () => (await mocks.state()).realtimeConnections)
      .toBe(0)

    // Sem conexão, a mudança só existe na REST: nenhum evento chega.
    await mocks.updateNft(NFT_ID, { priceEth: '3.21' })
    await expect(detailPrice(page)).toHaveText('Preço por unidade: 0.99 ETH')

    await mocks.setRealtimeAvailable(true)
    await expect(detailPrice(page)).toHaveText('Preço por unidade: 3.21 ETH', {
      timeout: 15_000,
    })
  })

  test('com o NFT no carrinho, a mudança é informada e o resumo é recotado', async ({
    page,
    mocks,
  }) => {
    await mocks.goto(`/nft/${NFT_ID}`)
    await editions(page).getByRole('radio', { name: '1/10' }).click()
    await page
      .getByRole('button', { name: 'Aumentar quantidade' })
      .filter(visible)
      .click()
    await page
      .getByRole('button', { name: /^comprar/i })
      .filter(visible)
      .click()
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(summaryValue(page, 'Subtotal')).toHaveText('1.98 ETH')

    // Navegando fora do carrinho: o anúncio sai na hora e o aviso espera no carrinho.
    await page.goBack()
    await expect(page).toHaveURL(new RegExp(`/nft/${NFT_ID}$`))
    await mocks.updateNft(NFT_ID, {
      priceEth: '2.5',
      available: { 'ed-10': 1 },
    })
    await expect(politeRegion(page)).toHaveText(
      `O preço de ${NFT_NAME} mudou de 0.99 ETH para 2.50 ETH. Só resta 1 unidade da edição 1/10 de ${NFT_NAME}.`,
    )

    await page.goForward()
    await expect(page).toHaveURL(/\/carrinho$/)
    const notice = page.getByRole('region', {
      name: 'Itens do carrinho foram atualizados',
    })
    await expect(notice).toContainText(
      `O preço de ${NFT_NAME} mudou de 0.99 ETH para 2.50 ETH.`,
    )
    await expect(notice).toContainText(
      `Só resta 1 unidade da edição 1/10 de ${NFT_NAME}.`,
    )
    await expect(summaryValue(page, 'Subtotal')).toHaveText('5.00 ETH')
    await expect(
      page.getByText(/Só resta 1 unidade desta edição/),
    ).toBeVisible()

    // Com o carrinho aberto, o resumo acompanha a mudança.
    await mocks.updateNft(NFT_ID, { priceEth: '3' })
    await expect(summaryValue(page, 'Subtotal')).toHaveText('6.00 ETH')
    await expect(notice).toContainText(
      `O preço de ${NFT_NAME} mudou de 2.50 ETH para 3.00 ETH.`,
    )

    await notice
      .getByRole('button', {
        name: `Dispensar aviso: O preço de ${NFT_NAME} mudou de 0.99 ETH para 2.50 ETH.`,
      })
      .click()
    await expect(notice).not.toContainText('0.99 ETH')
  })
})
