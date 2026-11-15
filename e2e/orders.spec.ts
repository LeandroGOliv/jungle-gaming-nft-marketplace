import { expect, test } from './support/mocks'
import type { Page } from '@playwright/test'
import type { Mocks } from './support/mocks'
import type { OrderUpdatedData, RealtimeEnvelope } from '../src/types/realtime'
import type { ScenarioId } from '../src/types/simulation'

const NOVA = { email: 'nova@colecionador.test', password: 'Kurio@2026' }
// As fixtures já trazem dois pedidos (um da Nova, um do Rafael).
const FIXTURE_ORDERS = 2

const visible = { visible: true } as const

async function signIn(page: Page, user = NOVA) {
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail').fill(user.email)
  await dialog.getByLabel('Senha', { exact: true }).fill(user.password)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).toBeHidden()
}

const providers = (page: Page) =>
  page.getByRole('group', { name: 'Carteira e rede' })

const confirmButton = (page: Page) =>
  page.getByRole('button', { name: 'Confirmar compra' })

const orderDialog = (page: Page) => page.getByRole('dialog')

async function connect(page: Page) {
  const radio = providers(page).getByRole('radio', { name: 'MetaMask' })
  if (await radio.isChecked()) {
    await providers(page).getByRole('button', { name: 'Conectar' }).click()
  } else {
    await radio.check()
  }
  await expect(providers(page)).toContainText('Conectada')
}

/** Abre o pagamento já com o carrinho do cenário, entra como Nova e conecta. */
async function readyToBuy(page: Page, mocks: Mocks, scenario: ScenarioId) {
  await mocks.goto('/pagamento', { scenario })
  await signIn(page)
  await expect(providers(page)).toBeVisible()
  await connect(page)
}

async function orderIdFromUrl(page: Page) {
  await expect(page).toHaveURL(/\/pagamento\?pedido=ord_\d+$/)
  return new URL(page.url()).searchParams.get('pedido')!
}

const ordersCount = async (mocks: Mocks) => (await mocks.state()).counts.orders

function orderEvent(
  orderId: string,
  eventId: string,
  version: number,
  data: Partial<OrderUpdatedData>,
): RealtimeEnvelope<OrderUpdatedData> {
  return {
    eventId,
    resource: { type: 'order', id: orderId },
    version,
    emittedAt: new Date().toISOString(),
    data: {
      status: 'pending',
      transactionHash: null,
      refusalReason: null,
      updatedAt: new Date().toISOString(),
      ...data,
    },
  }
}

test.describe('pedido e confirmação', () => {
  test('compra completa do catálogo ao recibo confirmado (cenário 6)', async ({
    page,
    mocks,
  }) => {
    // Pedido decidido pelo teste: nada depende de relógio.
    await mocks.goto('/', { scenario: 'order-pending' })
    await page
      .getByRole('link', { name: /Ivory Baron #088/ })
      .filter(visible)
      .first()
      .click()
    await expect(page).toHaveURL(/\/nft\/ivory-baron-088/)
    await page
      .getByRole('button', { name: /^comprar/i })
      .filter(visible)
      .click()
    await expect(page).toHaveURL(/\/carrinho$/)
    await page.goto('/pagamento')
    await signIn(page)
    await expect(providers(page)).toBeVisible()
    await connect(page)

    await confirmButton(page).click()
    const orderId = await orderIdFromUrl(page)
    await expect(
      orderDialog(page).getByRole('heading', {
        name: 'Aguardando a confirmação do pagamento',
      }),
    ).toBeVisible()
    // Pendente não é confirmação: nada de recibo ainda.
    await expect(
      orderDialog(page).getByRole('link', { name: 'Ver no Etherscan' }),
    ).toHaveCount(0)

    await mocks.settleOrder(orderId, 'confirmed')

    const dialog = orderDialog(page)
    await expect(
      dialog.getByRole('heading', {
        name: 'Seus NFTs agora estão na sua carteira',
      }),
    ).toBeVisible()
    await expect(dialog.getByText(/^0x[0-9A-F]{4}…[0-9A-F]{4}$/)).toBeVisible()
    const items = dialog.getByRole('table', {
      name: `Itens do pedido ${orderId}`,
    })
    await expect(items.getByRole('row')).toHaveCount(4)
    await expect(items).toContainText('Ivory Baron #088')
    await expect(dialog).toContainText('Taxa de rede')
    await expect(
      dialog.getByText('Hash e explorador simulados', { exact: false }),
    ).toBeVisible()

    // O recibo reproduz o snapshot: mudar o catálogo depois não altera nada.
    const before = await items.textContent()
    await mocks.updateNft('ivory-baron-088', { priceEth: '9.99' })
    await page.reload()
    await expect(
      orderDialog(page).getByRole('heading', {
        name: 'Seus NFTs agora estão na sua carteira',
      }),
    ).toBeVisible()
    await expect(
      orderDialog(page).getByRole('table', {
        name: `Itens do pedido ${orderId}`,
      }),
    ).toHaveText(before!)

    // Comprado sai do carrinho.
    await orderDialog(page).getByRole('button', { name: 'Fechar' }).click()
    await expect(
      page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
    ).toBeVisible()
    expect(await ordersCount(mocks)).toBe(FIXTURE_ORDERS + 1)
  })

  test('sai do carrinho só o que foi comprado', async ({ page, mocks }) => {
    await readyToBuy(page, mocks, 'order-pending')
    await confirmButton(page).click()
    const orderId = await orderIdFromUrl(page)

    // Enquanto o pedido está pendente, outro NFT entra no carrinho.
    await page.goto('/nft/golden-beat-207')
    await page
      .getByRole('button', { name: /^comprar/i })
      .filter(visible)
      .click()
    await expect(page).toHaveURL(/\/carrinho$/)

    await mocks.settleOrder(orderId, 'confirmed')
    await page.goto('/carrinho')
    const lines = page
      .getByRole('region', { name: 'Itens do carrinho' })
      .getByRole('listitem')
    await expect(lines).toHaveCount(1)
    await expect(lines).toContainText('Golden Beat #207')
  })

  test('pagamento recusado preserva o carrinho e permite nova tentativa (cenário 7)', async ({
    page,
    mocks,
  }) => {
    await readyToBuy(page, mocks, 'order-refused')
    await confirmButton(page).click()
    const first = await orderIdFromUrl(page)

    const dialog = orderDialog(page)
    await expect(
      dialog.getByRole('heading', { name: 'Pagamento recusado' }),
    ).toBeVisible()
    await expect(dialog).toContainText('saldo insuficiente')
    await expect(
      dialog.getByRole('link', { name: 'Ver no Etherscan' }),
    ).toHaveCount(0)

    await dialog.getByRole('button', { name: 'Voltar ao pagamento' }).click()
    await expect(page).toHaveURL(/\/pagamento$/)
    await expect(confirmButton(page)).toBeVisible()
    expect(await ordersCount(mocks)).toBe(FIXTURE_ORDERS + 1)

    // Nova tentativa é outra compra: chave nova, pedido novo.
    await confirmButton(page).click()
    const second = await orderIdFromUrl(page)
    expect(second).not.toBe(first)
    expect(await ordersCount(mocks)).toBe(FIXTURE_ORDERS + 2)
  })

  test('cliques repetidos criam um único pedido (cenário 7)', async ({
    page,
    mocks,
  }) => {
    await readyToBuy(page, mocks, 'order-pending')
    await mocks.setLatency({ kind: 'fixed', ms: 800 })
    // Três cliques no mesmo instante, antes de qualquer re-render.
    await confirmButton(page).evaluate((button: HTMLElement) => {
      button.click()
      button.click()
      button.click()
    })
    await orderIdFromUrl(page)
    expect(await ordersCount(mocks)).toBe(FIXTURE_ORDERS + 1)
  })

  test('timeout após criar o pedido recupera o mesmo pedido (cenário 7)', async ({
    page,
    mocks,
  }) => {
    // O cliente HTTP espera 15 s antes de desistir da primeira resposta.
    test.setTimeout(60_000)
    await readyToBuy(page, mocks, 'order-timeout')
    await confirmButton(page).click()

    // O pedido já existe na API enquanto o cliente ainda espera.
    await expect.poll(() => ordersCount(mocks)).toBe(FIXTURE_ORDERS + 1)

    const orderId = await (async () => {
      await expect(page).toHaveURL(/\?pedido=ord_\d+$/, { timeout: 30_000 })
      return new URL(page.url()).searchParams.get('pedido')!
    })()
    await expect(
      orderDialog(page).getByRole('heading', {
        name: 'Seus NFTs agora estão na sua carteira',
      }),
    ).toBeVisible()
    const state = await mocks.state()
    expect(state.counts.orders).toBe(FIXTURE_ORDERS + 1)
    expect(orderId).toMatch(/^ord_/)
  })

  test('pedido pendente sobrevive a queda do socket e refresh (cenário 10)', async ({
    page,
    mocks,
  }) => {
    await readyToBuy(page, mocks, 'order-pending')
    await confirmButton(page).click()
    const orderId = await orderIdFromUrl(page)
    await expect(
      orderDialog(page).getByRole('heading', {
        name: 'Aguardando a confirmação do pagamento',
      }),
    ).toBeVisible()

    // Refresh com o pedido pendente: o estado volta, sem outra compra.
    await page.reload()
    await expect(
      orderDialog(page).getByRole('heading', {
        name: 'Aguardando a confirmação do pagamento',
      }),
    ).toBeVisible()
    await expect
      .poll(async () => (await mocks.state()).realtimeConnections)
      .toBeGreaterThan(0)

    // A confirmação sai com o socket fora: o evento se perde.
    await mocks.setRealtimeAvailable(false)
    await mocks.settleOrder(orderId, 'confirmed')
    await expect(
      orderDialog(page).getByRole('heading', {
        name: 'Aguardando a confirmação do pagamento',
      }),
    ).toBeVisible()

    // Ao reconectar, a REST reconcilia.
    await mocks.setRealtimeAvailable(true)
    await expect(
      orderDialog(page).getByRole('heading', {
        name: 'Seus NFTs agora estão na sua carteira',
      }),
    ).toBeVisible({ timeout: 15_000 })
    expect(await ordersCount(mocks)).toBe(FIXTURE_ORDERS + 1)
  })

  test('order.updated duplicado ou antigo não regride o pedido (cenário 10)', async ({
    page,
    mocks,
  }) => {
    await readyToBuy(page, mocks, 'order-pending')
    await confirmButton(page).click()
    const orderId = await orderIdFromUrl(page)
    await expect
      .poll(async () => (await mocks.state()).realtimeConnections)
      .toBeGreaterThan(0)

    // Versão antiga (a do pedido recém-criado) é ignorada.
    await mocks.emit(
      'order.updated',
      orderEvent(orderId, 'evt_old', 1, { status: 'refused' }),
    )
    await mocks.settleOrder(orderId, 'confirmed')
    const confirmed = orderDialog(page).getByRole('heading', {
      name: 'Seus NFTs agora estão na sua carteira',
    })
    await expect(confirmed).toBeVisible()

    // Terminal: nem uma versão "mais nova" recusando, nem duplicata, mudam o recibo.
    await mocks.emit(
      'order.updated',
      orderEvent(orderId, 'evt_late', 9, {
        status: 'refused',
        refusalReason: 'Falso.',
      }),
    )
    await mocks.emit(
      'order.updated',
      orderEvent(orderId, 'evt_late', 9, { status: 'pending' }),
    )
    await expect(confirmed).toBeVisible()
    await expect(orderDialog(page)).not.toContainText('Falso.')
  })

  test('pedido de outro usuário não é acessível', async ({ page, mocks }) => {
    // ord_0002 é do Rafael.
    await mocks.goto('/pagamento?pedido=ord_0002', { scenario: 'checkout' })
    await signIn(page)
    await expect(
      orderDialog(page).getByRole('heading', { name: 'Pedido não encontrado' }),
    ).toBeVisible()
    await expect(orderDialog(page)).not.toContainText('Golden Beat')

    // O endereço antigo leva ao mesmo modal; o pedido da própria conta abre.
    await page.goto('/pedidos/ord_0001')
    await expect(page).toHaveURL(/\/pagamento\?pedido=ord_0001$/)
    await expect(
      orderDialog(page).getByRole('heading', {
        name: 'Seus NFTs agora estão na sua carteira',
      }),
    ).toBeVisible()
  })
})
