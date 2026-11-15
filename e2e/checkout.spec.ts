import { expect, test } from './support/mocks'
import type { Page } from '@playwright/test'
import type { ScenarioId } from '../src/types/simulation'

const NOVA = { email: 'nova@colecionador.test', password: 'Kurio@2026' }

async function signIn(page: Page) {
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail').fill(NOVA.email)
  await dialog.getByLabel('Senha', { exact: true }).fill(NOVA.password)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).toBeHidden()
}

const providers = (page: Page) =>
  page.getByRole('group', { name: 'Carteira e rede' })

const confirmButton = (page: Page) =>
  page.getByRole('button', { name: 'Confirmar compra' })

/** Tenta confirmar pelo teclado: com a compra bloqueada o botão fica `aria-disabled`. */
async function attemptConfirm(page: Page) {
  await confirmButton(page).focus()
  await page.keyboard.press('Enter')
}

const changesAlert = (page: Page) =>
  page.getByRole('region', { name: 'Os valores do pedido mudaram' })

/** Abre o pagamento no cenário, entra como Nova e conecta a MetaMask. */
async function openCheckout(
  page: Page,
  mocks: { goto: (path: string, o: { scenario: ScenarioId }) => Promise<void> },
  scenario: ScenarioId = 'checkout',
) {
  await mocks.goto('/pagamento', { scenario })
  await signIn(page)
  await expect(page).toHaveURL(/\/pagamento$/)
  await expect(providers(page)).toBeVisible()
}

/** No mobile os dados do colecionador ficam numa seção recolhível. */
async function openCollector(page: Page) {
  const toggle = page.getByRole('button', { name: 'Dados do colecionador' })
  if (
    (await toggle.isVisible()) &&
    (await toggle.getAttribute('aria-expanded')) === 'false'
  ) {
    await toggle.click()
  }
}

/** O provedor da carteira cadastrada já vem marcado: aí a conexão é pelo "Conectar". */
async function startConnection(page: Page, provider = 'MetaMask') {
  const radio = providers(page).getByRole('radio', { name: provider })
  if (await radio.isChecked()) {
    await providers(page).getByRole('button', { name: 'Conectar' }).click()
  } else {
    await radio.check()
  }
}

async function connect(page: Page, provider = 'MetaMask') {
  await startConnection(page, provider)
  await expect(providers(page)).toContainText('Conectada')
}

test.describe('pagamento', () => {
  test('exige login e não segue com o carrinho vazio', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/pagamento', { scenario: 'default' })
    await expect(page.getByRole('dialog')).toBeVisible()
    await signIn(page)
    await expect(page).toHaveURL(/\/pagamento$/)
    await expect(
      page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
    ).toBeVisible()
    await expect(confirmButton(page)).toHaveCount(0)
  })

  test('valida os campos pelo teclado, com erros associados', async ({
    page,
    mocks,
  }) => {
    await openCheckout(page, mocks)
    await openCollector(page)

    // "Usar outra carteira?" libera e limpa endereço, rede e ENS.
    const other = page.getByRole('checkbox', { name: 'Usar outra carteira?' })
    await other.focus()
    await page.keyboard.press('Space')
    await expect(other).toBeChecked()

    await confirmButton(page).focus()
    await page.keyboard.press('Enter')

    // O foco vai ao primeiro campo inválido, na ordem do formulário.
    const network = page.getByRole('combobox', { name: 'Rede' })
    await expect(network).toBeFocused()
    await expect(network).toHaveAccessibleDescription('Selecione uma rede.')
    const address = page.getByRole('textbox', { name: 'Endereço da carteira' })
    await expect(address).toHaveAccessibleDescription(
      'Informe o endereço da carteira.',
    )

    await address.focus()
    await page.keyboard.type('0x123')
    await page.keyboard.press('Tab')
    await confirmButton(page).focus()
    await page.keyboard.press('Enter')
    await expect(address).toHaveAccessibleDescription(
      'Informe um endereço 0x com 40 caracteres hexadecimais.',
    )
    await expect(page).toHaveURL(/\/pagamento$/)
  })

  test('evento nft.updated no checkout exige nova confirmação (cenário 9)', async ({
    page,
    mocks,
  }) => {
    await openCheckout(page, mocks)
    await connect(page)

    await mocks.updateNft('emerald-ape-042', { priceEth: '1.5' })

    await expect(changesAlert(page)).toContainText(
      'Preço de Emerald Ape #042: de 1.19 ETH para 1.50 ETH.',
    )
    await expect(changesAlert(page)).toContainText(
      'Total: de 3.409 ETH para 3.967 ETH.',
    )
    // Com a cotação desatualizada, confirmar não cria o pedido.
    await attemptConfirm(page)
    await expect(
      page.getByRole('alert').filter({ hasText: 'Os valores mudaram' }),
    ).toBeVisible()
    await expect(page).toHaveURL(/\/pagamento$/)

    await changesAlert(page)
      .getByRole('button', { name: 'Aceitar novos valores' })
      .click()
    await expect(changesAlert(page)).toHaveCount(0)
    await confirmButton(page).click()
    await expect(page).toHaveURL(/\/pagamento\?pedido=ord_\d+$/)
    const state = await mocks.state()
    expect(state.counts.orders).toBe(3)
  })

  test('edição esgotada durante o checkout bloqueia a compra', async ({
    page,
    mocks,
  }) => {
    await openCheckout(page, mocks)
    await connect(page)

    await mocks.updateNft('violet-nomad-314', { available: { 'ed-10': 0 } })

    await expect(changesAlert(page)).toContainText(
      'A edição 1/10 de Violet Nomad #314 esgotou.',
    )
    await changesAlert(page)
      .getByRole('button', { name: 'Aceitar novos valores' })
      .click()
    await expect(
      page.getByText('Ajuste no carrinho os itens indicados para continuar.'),
    ).toBeVisible()
    await attemptConfirm(page)
    await expect(page).toHaveURL(/\/pagamento$/)
  })

  test('preço alterado na confirmação: a API recusa e pede nova revisão', async ({
    page,
    mocks,
  }) => {
    await openCheckout(page, mocks, 'checkout-price-change')
    await connect(page)

    await confirmButton(page).click()
    await expect(changesAlert(page)).toContainText('Preço de Emerald Ape #042')
    await expect(page).toHaveURL(/\/pagamento$/)

    await changesAlert(page)
      .getByRole('button', { name: 'Aceitar novos valores' })
      .click()
    await confirmButton(page).click()
    await expect(page).toHaveURL(/\/pagamento\?pedido=ord_\d+$/)
  })

  test('cupom expirado na confirmação muda o total', async ({
    page,
    mocks,
  }) => {
    await openCheckout(page, mocks, 'checkout-coupon-expired')
    await connect(page)

    await confirmButton(page).click()
    await expect(changesAlert(page)).toContainText('O código KURIO10 expirou.')
    await expect(changesAlert(page)).toContainText(
      'Total: de 3.409 ETH para 3.786 ETH.',
    )
  })

  test('carteira recusa a conexão e conecta na nova tentativa', async ({
    page,
    mocks,
  }) => {
    await openCheckout(page, mocks, 'wallet-refused')

    await startConnection(page)
    await expect(providers(page)).toContainText('Conexão recusada')
    await attemptConfirm(page)
    await expect(page).toHaveURL(/\/pagamento$/)

    await providers(page)
      .getByRole('button', { name: 'Tentar novamente' })
      .click()
    await expect(providers(page)).toContainText('Conectada')
  })

  test('desconexão da carteira pelo Socket.IO bloqueia a compra', async ({
    page,
    mocks,
  }) => {
    await openCheckout(page, mocks)
    await connect(page)

    await mocks.disconnectWallets()
    await expect(providers(page)).toContainText('Desconectada')
    await expect(
      page.getByText('Conecte a carteira para confirmar a compra.'),
    ).toBeVisible()

    await providers(page).getByRole('button', { name: 'Reconectar' }).click()
    await expect(providers(page)).toContainText('Conectada')
  })

  test('sessão expirada no checkout preserva o que foi digitado', async ({
    page,
    mocks,
  }) => {
    await openCheckout(page, mocks)
    const note = page.getByRole('textbox', {
      name: 'Observação do colecionador (opcional)',
    })
    await openCollector(page)
    await note.fill('Entregar na carteira fria')
    await connect(page)

    await mocks.expireSessions()
    await confirmButton(page).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await signIn(page)
    await expect(page).toHaveURL(/\/pagamento$/)
    await openCollector(page)
    await expect(note).toHaveValue('Entregar na carteira fria')
  })
})
