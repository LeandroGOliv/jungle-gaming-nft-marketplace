import { expect, test } from './support/mocks'
import type { Page } from '@playwright/test'

const NOVA = { email: 'nova@colecionador.test', password: 'Kurio@2026' }
const RAFAEL = { email: 'rafael@colecionador.test', password: 'Selva#2026' }

/** PNG válido gerado pelo próprio navegador, para a API simulada decodificar. */
async function makePng(page: Page) {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 48
    const context = canvas.getContext('2d')!
    context.fillStyle = '#d28a4c'
    context.fillRect(0, 0, 64, 48)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  return Buffer.from(base64, 'base64')
}

async function signIn(page: Page, user = NOVA) {
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail').fill(user.email)
  await dialog.getByLabel('Senha', { exact: true }).fill(user.password)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).toBeHidden()
}

const form = (page: Page) => page.getByRole('form', { name: 'Dados do perfil' })
const field = (page: Page, name: string) =>
  form(page).getByRole('textbox', { name, exact: true })
const save = (page: Page) =>
  form(page).getByRole('button', { name: 'Salvar', exact: true })
const isMobile = (width: number | undefined) => (width ?? 1440) < 768

test.describe('perfil', () => {
  test('rota exige autenticação e carrega os dados do usuário', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/perfil')
    await expect(page.getByRole('dialog')).toBeVisible()
    await signIn(page)

    await expect(field(page, 'Nome de exibição')).toHaveValue('Nova Sato')
    await expect(field(page, 'Nome de usuário')).toHaveValue('novasato')
    await expect(field(page, 'E-mail')).toHaveValue('nova@colecionador.test')
    await expect(field(page, 'E-mail')).toBeDisabled()
    await expect(field(page, 'Nome ENS')).toHaveValue('nova.kurio')
    await expect(field(page, 'Apelido da carteira')).toHaveValue(
      'Cofre da Nova',
    )
  })

  test('edição valida no cliente e na API, persiste após o refresh e reflete no header', async ({
    page,
    mocks,
    viewport,
  }) => {
    await mocks.goto('/perfil')
    await signIn(page)

    // Validação do cliente: obrigatório vazio e formato, antes de enviar.
    await field(page, 'Nome de exibição').fill('')
    await field(page, 'Nome ENS').fill('NO')
    await save(page).click()
    await expect(field(page, 'Nome de exibição')).toHaveAccessibleDescription(
      'Informe o nome de exibição.',
    )
    await expect(field(page, 'Nome de exibição')).toBeFocused()
    await expect(field(page, 'Nome ENS')).toHaveAccessibleDescription(
      /O nome termina em \.eth.*Use de 3 a 32 caracteres/,
    )

    // Nome reservado só a API conhece: o 422 volta no campo.
    await field(page, 'Nome de exibição').fill('Nova Kurio')
    await field(page, 'Nome ENS').fill('nova-kurio')
    await field(page, 'Nome de usuário').fill('admin')
    await save(page).click()
    await expect(field(page, 'Nome de usuário')).toHaveAccessibleDescription(
      'Este nome de usuário é reservado.',
    )
    // Outro colecionador já usa este nome.
    await field(page, 'Nome de usuário').fill('rafalima')
    await save(page).click()
    await expect(field(page, 'Nome de usuário')).toHaveAccessibleDescription(
      'Este nome de usuário já está em uso.',
    )

    await field(page, 'Nome de usuário').fill('nova.kurio')
    await save(page).click()
    await expect(page.getByText('Perfil atualizado.')).toBeAttached()

    await page.reload()
    await expect(field(page, 'Nome de exibição')).toHaveValue('Nova Kurio')
    await expect(field(page, 'Nome de usuário')).toHaveValue('nova.kurio')
    await expect(field(page, 'Nome ENS')).toHaveValue('nova-kurio')
    if (!isMobile(viewport?.width)) {
      await expect(
        page
          .getByRole('banner')
          .getByRole('link', { name: 'Perfil de Nova Kurio' }),
      ).toBeVisible()
    }
  })

  test('avatar valida o arquivo, pré-visualiza, persiste e pode ser removido', async ({
    page,
    mocks,
    viewport,
  }) => {
    await mocks.goto('/perfil')
    await signIn(page)
    const input = page.getByTestId('avatar-input')
    const avatarGroup = form(page).getByRole('group', { name: 'Avatar' })

    await input.setInputFiles({
      name: 'animacao.gif',
      mimeType: 'image/gif',
      buffer: Buffer.from('GIF89a'),
    })
    await expect(avatarGroup).toContainText('Use uma imagem PNG, JPEG ou WebP.')

    await input.setInputFiles({
      name: 'grande.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
    })
    await expect(avatarGroup).toContainText(
      'A imagem precisa ter no máximo 2 MB.',
    )

    // Extensão certa, conteúdo inválido: só a API, ao decodificar, percebe.
    await input.setInputFiles({
      name: 'quebrado.png',
      mimeType: 'image/png',
      buffer: Buffer.from('não é uma imagem'),
    })
    const preview = avatarGroup.getByRole('img', {
      name: 'Pré-visualização do avatar',
    })
    await expect(preview).toHaveAttribute('src', /^blob:/)
    await save(page).click()
    await expect(avatarGroup).toContainText(
      'Não foi possível ler esta imagem. Tente outra.',
    )

    await input.setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: await makePng(page),
    })
    await expect(preview).toHaveAttribute('src', /^blob:/)
    await save(page).click()
    await expect(page.getByText('Perfil atualizado.')).toBeAttached()
    await expect(preview).toHaveAttribute('src', /^data:image\/webp/)

    await page.reload()
    await expect(preview).toHaveAttribute('src', /^data:image\/webp/)
    if (!isMobile(viewport?.width)) {
      await expect(
        page.getByRole('banner').locator('img[src^="data:image/webp"]'),
      ).toBeVisible()
    }

    await avatarGroup.getByRole('button', { name: 'Remover avatar' }).click()
    await expect(preview).toBeHidden()
    await save(page).click()
    await expect(page.getByText('Perfil atualizado.')).toBeAttached()
    await page.reload()
    await expect(field(page, 'Nome de exibição')).toHaveValue('Nova Sato')
    await expect(preview).toBeHidden()
  })

  test('alteração de senha valida, recusa a senha atual errada e vale no próximo login', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/perfil')
    await signIn(page)
    const password = (name: string) =>
      form(page).getByLabel(name, { exact: true })

    await password('Nova senha').fill('curta')
    await save(page).click()
    await expect(password('Senha atual')).toHaveAccessibleDescription(
      'Informe a senha atual.',
    )
    await expect(password('Nova senha')).toHaveAccessibleDescription(
      'A senha precisa de ao menos 8 caracteres, com letras e números.',
    )
    await expect(password('Confirmar nova senha')).toHaveAccessibleDescription(
      'Confirme a nova senha.',
    )

    await password('Senha atual').fill('Errada123')
    await password('Nova senha').fill('Floresta2027')
    await password('Confirmar nova senha').fill('Floresta2027')
    await save(page).click()
    await expect(password('Senha atual')).toHaveAccessibleDescription(
      'Senha atual incorreta.',
    )

    await password('Senha atual').fill(NOVA.password)
    await save(page).click()
    await expect(page.getByText('Perfil e senha atualizados.')).toBeAttached()
    await expect(password('Senha atual')).toHaveValue('')

    // A senha nunca fica em claro no estado persistido dos mocks.
    const persisted = await page.evaluate(() =>
      Object.values(localStorage).join(''),
    )
    expect(persisted).not.toContain('Floresta2027')

    await page.getByRole('button', { name: 'Sair' }).last().click()
    // Sem `mocks.goto`, que reaplicaria o cenário e desfaria a alteração.
    await page.goto('/perfil')
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('E-mail').fill(NOVA.email)
    await dialog.getByLabel('Senha', { exact: true }).fill(NOVA.password)
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(dialog).toContainText('E-mail ou senha incorretos.')
    await signIn(page, { ...NOVA, password: 'Floresta2027' })
    await expect(field(page, 'Nome de exibição')).toHaveValue('Nova Sato')
  })

  test('falha transitória mostra o erro sem aparentar sucesso e a nova tentativa salva', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/perfil')
    await signIn(page)
    await mocks.addFault({
      id: 'profile-503',
      method: 'PATCH',
      path: '/profile',
      effect: { kind: 'http', status: 503 },
      times: 1,
    })

    await field(page, 'Apelido da carteira').fill('Cofre novo')
    await save(page).click()
    await expect(form(page).getByRole('alert')).toContainText(
      'Serviço temporariamente indisponível',
    )
    await expect(page.getByText('Perfil atualizado.')).not.toBeAttached()

    await save(page).click()
    await expect(page.getByText('Perfil atualizado.')).toBeAttached()
    await expect(form(page).getByRole('alert')).toBeHidden()
  })

  test('falha ao carregar oferece nova tentativa', async ({ page, mocks }) => {
    await mocks.goto('/perfil')
    await mocks.addFault({
      id: 'profile-get-503',
      method: 'GET',
      path: '/profile',
      effect: { kind: 'http', status: 503 },
    })
    await signIn(page)

    // A falha aparece depois das repetições automáticas.
    await expect(
      page.getByRole('heading', {
        name: 'Não foi possível carregar seu perfil',
      }),
    ).toBeVisible({ timeout: 20_000 })
    await mocks.setFaults([])
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(field(page, 'Nome de exibição')).toHaveValue('Nova Sato')
  })

  test('dados de um colecionador não aparecem para outro', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/perfil')
    await signIn(page)
    await field(page, 'Apelido da carteira').fill('Só da Nova')
    await save(page).click()
    await expect(page.getByText('Perfil atualizado.')).toBeAttached()

    await page.getByRole('button', { name: 'Sair' }).last().click()
    // Sem `mocks.goto`, que reaplicaria o cenário e desfaria a alteração.
    await page.goto('/perfil')
    await signIn(page, RAFAEL)
    await expect(field(page, 'Nome de exibição')).toHaveValue('Rafael Lima')
    await expect(field(page, 'Apelido da carteira')).toHaveValue('')
  })
})
