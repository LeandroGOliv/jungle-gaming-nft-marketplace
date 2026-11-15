import { expect, test } from './support/mocks'
import type { Page } from '@playwright/test'

const NOVA = { email: 'nova@colecionador.test', password: 'Kurio@2026' }
const RAFAEL = { email: 'rafael@colecionador.test', password: 'Selva#2026' }

async function signIn(page: Page, user = NOVA) {
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail').fill(user.email)
  await dialog.getByLabel('Senha', { exact: true }).fill(user.password)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).toBeHidden()
}

const section = (page: Page, name: string) => page.getByRole('region', { name })

const form = (page: Page, slot: 'principal' | 'secundária') =>
  page.getByRole('form', { name: `Dados da carteira ${slot}` })

async function pick(page: Page, label: string, option: string) {
  await page.getByRole('combobox', { name: label }).click()
  await page.getByRole('option', { name: option }).click()
}

test.describe('carteiras', () => {
  test('rota exige autenticação e volta às carteiras após o login', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/carteiras')

    await expect(page.getByRole('dialog')).toBeVisible()
    await signIn(page)
    await expect(page).toHaveURL(/\/carteiras/)
    await expect(
      page.getByRole('heading', { level: 2, name: 'Carteira principal' }),
    ).toBeVisible()
  })

  test('edição valida campos no cliente e na API e persiste após o refresh', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/carteiras')
    await signIn(page)

    const primary = section(page, 'Carteira principal')
    await expect(
      primary.getByText('0xA91F3c6B2d8E4a7F0b19C5e3D62f8A4b7c1DE82C'),
    ).toBeAttached()
    await primary
      .getByRole('button', { name: 'Editar carteira principal' })
      .click()

    const fields = form(page, 'principal')
    const address = fields.getByRole('textbox', {
      name: 'Endereço da carteira',
    })
    await expect(
      fields.getByRole('textbox', { name: 'Nome de exibição' }),
    ).toBeFocused()

    // Validação do cliente: formato do endereço e campo obrigatório vazio.
    await address.fill('0x123')
    await fields.getByRole('textbox', { name: 'Apelido da carteira' }).fill('')
    await fields.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(address).toHaveAccessibleDescription(
      'Informe um endereço 0x com 40 caracteres hexadecimais.',
    )
    await expect(
      fields.getByRole('textbox', { name: 'Apelido da carteira' }),
    ).toHaveAccessibleDescription('Informe um apelido para a carteira.')

    // Validação da API: código de indicação inexistente volta no campo.
    await address.fill('0x2222222222222222222222222222222222222222')
    await fields
      .getByRole('textbox', { name: 'Apelido da carteira' })
      .fill('Cofre novo')
    const referral = fields.getByRole('textbox', {
      name: 'Código de indicação',
    })
    await referral.fill('XPTO99')
    await fields.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(referral).toHaveAccessibleDescription(
      'Código de indicação inválido ou expirado.',
    )
    await expect(referral).toBeFocused()

    await referral.fill('GREENMINT')
    await pick(page, 'Rede', 'Ethereum')
    await fields.getByRole('button', { name: 'Salvar carteira' }).click()

    await expect(fields).toBeHidden()
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: 'Carteira principal atualizada.' }),
    ).toBeAttached()
    await expect(primary.getByText('Cofre novo', { exact: true })).toBeVisible()

    await page.reload()
    await expect(primary.getByText('Cofre novo', { exact: true })).toBeVisible()
    await expect(primary.getByText('Ethereum', { exact: true })).toBeVisible()
    await expect(
      primary.getByText('0x2222222222222222222222222222222222222222'),
    ).toBeAttached()
  })

  test('cadastra a secundária e recusa o endereço da principal', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/carteiras')
    await signIn(page)

    const secondary = section(page, 'Carteira secundária')
    await expect(
      secondary.getByText('Você ainda não adicionou uma carteira secundária.'),
    ).toBeVisible()
    await expect(
      secondary.getByRole('checkbox', { name: 'Igual à carteira principal' }),
    ).toBeDisabled()
    await secondary
      .getByRole('button', { name: 'Adicionar carteira secundária' })
      .click()

    const fields = form(page, 'secundária')
    await fields
      .getByRole('textbox', { name: 'Nome de exibição' })
      .fill('Nova Sato')
    await fields
      .getByRole('textbox', { name: 'Apelido da carteira' })
      .fill('Reserva')
    await pick(page, 'Rede', 'Polygon')
    await fields
      .getByRole('textbox', { name: 'Nome do perfil' })
      .fill('novasato')
    const address = fields.getByRole('textbox', {
      name: 'Endereço da carteira',
    })
    await address.fill('0xa91f3c6b2d8e4a7f0b19c5e3d62f8a4b7c1de82c')
    await pick(page, 'Tipo de carteira', 'WalletConnect')
    await fields
      .getByRole('textbox', { name: 'Código de indicação' })
      .fill('kurio2026')
    await fields
      .getByRole('textbox', { name: 'E-mail' })
      .fill('nova@colecionador.test')
    await fields.getByRole('textbox', { name: 'Nome ENS' }).fill('nova-reserva')
    await fields.getByRole('button', { name: 'Salvar carteira' }).click()

    await expect(address).toHaveAccessibleDescription(
      'Este endereço já é a sua carteira principal.',
    )

    await address.fill('0x3333333333333333333333333333333333333333')
    await fields.getByRole('button', { name: 'Salvar carteira' }).click()

    await expect(secondary.getByText('Reserva', { exact: true })).toBeVisible()
    await expect(secondary.getByText('nova-reserva.eth')).toBeVisible()
    await page.reload()
    await expect(secondary.getByText('Reserva', { exact: true })).toBeVisible()
  })

  test('falha transitória mantém o formulário e a nova tentativa salva', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/carteiras', { scenario: 'wallet-error' })
    await signIn(page)

    const primary = section(page, 'Carteira principal')
    await primary
      .getByRole('button', { name: 'Editar carteira principal' })
      .click()
    const fields = form(page, 'principal')
    await fields
      .getByRole('textbox', { name: 'Apelido da carteira' })
      .fill('Depois da falha')
    await fields.getByRole('button', { name: 'Salvar carteira' }).click()

    await expect(fields.getByRole('alert')).toContainText(
      'Serviço temporariamente indisponível',
    )
    await expect(
      fields.getByRole('textbox', { name: 'Apelido da carteira' }),
    ).toHaveValue('Depois da falha')

    await fields.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(fields).toBeHidden()
    await expect(
      primary.getByText('Depois da falha', { exact: true }),
    ).toBeVisible()
  })

  test('dados isolados por usuário após trocar de conta', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/carteiras')
    await signIn(page)
    await expect(
      page.getByText('0xA91F3c6B2d8E4a7F0b19C5e3D62f8A4b7c1DE82C'),
    ).toBeAttached()

    // O "Sair" da tela de perfil existe em todos os viewports.
    await page.goto('/perfil')
    await page.getByRole('button', { name: 'Sair' }).last().click()
    await page.goto('/carteiras')
    await signIn(page, RAFAEL)

    await expect(
      section(page, 'Carteira principal').getByText('Coinbase do dia a dia', {
        exact: true,
      }),
    ).toBeVisible()
    await expect(
      section(page, 'Carteira secundária').getByText('Cofre', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText('0xA91F3c6B2d8E4a7F0b19C5e3D62f8A4b7c1DE82C'),
    ).toHaveCount(0)
  })
})
