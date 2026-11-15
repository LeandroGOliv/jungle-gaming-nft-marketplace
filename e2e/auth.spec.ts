import { expect, test } from './support/mocks'
import type { Page } from '@playwright/test'

const NOVA = { email: 'nova@colecionador.test', password: 'Kurio@2026' }
const RAFAEL = { email: 'rafael@colecionador.test', password: 'Selva#2026' }

const isMobile = (width: number | undefined) => (width ?? 0) < 768

function authDialog(page: Page) {
  return page.getByRole('dialog')
}

async function signIn(page: Page, credentials: typeof NOVA) {
  const dialog = authDialog(page)
  await dialog.getByLabel('E-mail').fill(credentials.email)
  await dialog.getByLabel('Senha', { exact: true }).fill(credentials.password)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).toBeHidden()
}

/** Usuário dono de cada conexão Socket.IO aberta, segundo o servidor simulado. */
/** Navega pela interface: o footer no desktop, a barra de abas no mobile. */
async function openProfile(page: Page) {
  const footer = page.getByRole('contentinfo')
  await (
    (await footer.isVisible())
      ? footer.getByRole('link', { name: 'Meu perfil' })
      : page.getByRole('link', { name: 'Minha conta' })
  ).click()
}

async function realtimeUsers(page: Page) {
  return page.evaluate(() => window.__mocks!.getState().realtimeUsers)
}

test.describe('login e cadastro', () => {
  test('rota privada sem sessão leva ao login e volta ao destino', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/perfil')

    await expect(page).toHaveURL(/[?&]auth=entrar/)
    await expect(page).toHaveURL(/redirect=%2Fperfil/)
    const dialog = authDialog(page)
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('E-mail')).toBeFocused()

    // Validação no cliente, com as mensagens associadas aos campos.
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(dialog.getByLabel('E-mail')).toHaveAccessibleDescription(
      'Informe seu e-mail.',
    )
    await expect(
      dialog.getByLabel('Senha', { exact: true }),
    ).toHaveAccessibleDescription('Informe sua senha.')

    // Erro devolvido pela API.
    await dialog.getByLabel('E-mail').fill(NOVA.email)
    await dialog.getByLabel('Senha', { exact: true }).fill('senha-errada1')
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(dialog.getByRole('alert')).toHaveText(
      'E-mail ou senha incorretos.',
    )

    await signIn(page, NOVA)
    await expect(page).toHaveURL(/\/perfil$/)
    await expect(page.getByText('Você entrou como Nova Sato.')).toBeAttached()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Perfil do colecionador' }),
    ).toBeVisible()
    await expect(
      page.getByRole('main').getByRole('textbox', { name: 'Nome de exibição' }),
    ).toHaveValue('Nova Sato')
  })

  test('retorno após o login aceita só caminhos internos', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/?auth=entrar&redirect=%2Fcarrinho')
    await signIn(page, NOVA)
    await expect(page).toHaveURL(/\/carrinho$/)

    // Novo visitante: sem sessão salva, o modal abre de novo.
    await page.evaluate(() =>
      localStorage.removeItem('nft-marketplace:session'),
    )
    // `/\evil.com` resolve para outro host no parser de URL do navegador.
    await mocks.goto('/?auth=entrar&redirect=%2F%5Cevil.com')
    await signIn(page, NOVA)
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/)
  })

  test('cadastro aponta conflito e validação da API no campo e entra na conta', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/?auth=cadastro')
    const dialog = authDialog(page)
    const username = dialog.getByLabel('Nome de usuário')
    const email = dialog.getByLabel('E-mail')
    const password = dialog.getByLabel('Senha', { exact: true })
    const confirmation = dialog.getByLabel('Confirmação de senha', {
      exact: true,
    })
    const submit = dialog.getByRole('button', {
      name: /^Criar (conta|perfil)$/,
    })

    await username.fill('novasato')
    await email.fill(NOVA.email)
    await password.fill('Colecao2026')
    await confirmation.fill('Colecao2027')
    await submit.click()
    await expect(confirmation).toHaveAccessibleDescription(
      'As senhas não conferem.',
    )

    // 409: e-mail e usuário já cadastrados, apontados nos próprios campos.
    await confirmation.fill('Colecao2026')
    await submit.click()
    await expect(username).toHaveAccessibleDescription(
      'Este nome de usuário já está em uso.',
    )
    await expect(email).toHaveAccessibleDescription(
      'Este e-mail já está cadastrado.',
    )
    await expect(username).toBeFocused()

    // 422: regra que só o servidor conhece.
    await username.fill('admin')
    await email.fill('ana@colecionador.test')
    await submit.click()
    await expect(username).toHaveAccessibleDescription(
      'Este nome de usuário é reservado.',
    )

    await username.fill('ana.lopes')
    await submit.click()
    await expect(dialog).toBeHidden()
    await expect(
      page.getByText('Conta criada. Você entrou como ana.lopes.'),
    ).toBeAttached()
    await expect(page).not.toHaveURL(/auth=/)

    await page.goto('/perfil')
    await expect(
      page.getByRole('main').getByRole('textbox', { name: 'Nome de usuário' }),
    ).toHaveValue('ana.lopes')
  })

  test('sessão sobrevive ao refresh', async ({ page, mocks }) => {
    await mocks.goto('/perfil')
    await signIn(page, NOVA)
    await expect(
      page.getByRole('main').getByRole('textbox', { name: 'Nome de exibição' }),
    ).toHaveValue('Nova Sato')

    await page.reload()
    await expect(page).toHaveURL(/\/perfil$/)
    await expect(
      page.getByRole('main').getByRole('textbox', { name: 'Nome de exibição' }),
    ).toHaveValue('Nova Sato')
    await expect(authDialog(page)).toBeHidden()
  })

  test('expiração durante a navegação pede login e retoma o destino', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/?auth=entrar')
    await signIn(page, NOVA)

    // Sem tempo real: o servidor encerraria o socket da sessão vencida e a
    // reconciliação já pediria login; aqui a expiração aparece na navegação.
    await mocks.setRealtimeAvailable(false)
    await mocks.expireSessions()
    await openProfile(page)

    const dialog = authDialog(page)
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(
      'Sua sessão expirou. Entre novamente para continuar.',
    )
    await expect(page).toHaveURL(/redirect=%2Fperfil/)
    await expect(page).toHaveURL(/motivo=sessao-expirada/)

    await signIn(page, NOVA)
    await expect(page).toHaveURL(/\/perfil$/)
    await expect(
      page.getByRole('main').getByRole('textbox', { name: 'Nome de exibição' }),
    ).toHaveValue('Nova Sato')
  })

  test('logout e troca de usuário não deixam dados nem socket da sessão anterior', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/perfil')
    await signIn(page, NOVA)
    await expect(
      page.getByRole('main').getByRole('textbox', { name: 'Nome de exibição' }),
    ).toHaveValue('Nova Sato')
    await expect.poll(() => realtimeUsers(page)).toEqual(['usr_nova'])

    await page.getByRole('main').getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('Você saiu da sua conta.')).toBeAttached()
    await expect.poll(() => realtimeUsers(page)).toEqual([null])

    await openProfile(page)
    await expect(authDialog(page)).toBeVisible()
    await signIn(page, RAFAEL)

    await expect(page).toHaveURL(/\/perfil$/)
    await expect(
      page.getByRole('main').getByRole('textbox', { name: 'Nome de exibição' }),
    ).toHaveValue('Rafael Lima')
    await expect.poll(() => realtimeUsers(page)).toEqual(['usr_rafael'])
  })

  test('login social e recuperação de senha não aparentam sucesso', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/?auth=entrar')
    const dialog = authDialog(page)

    await dialog.getByRole('button', { name: 'Continuar com Google' }).click()
    await expect(dialog.getByRole('status')).toHaveText(
      'Entrar com Google não está disponível nesta demonstração. Use e-mail e senha.',
    )
    await dialog.getByRole('button', { name: 'Esqueceu a senha?' }).click()
    await expect(dialog.getByRole('status')).toHaveText(
      'A recuperação de senha não está disponível nesta demonstração.',
    )
    await expect(dialog).toBeVisible()
    expect(
      await page.evaluate(() =>
        localStorage.getItem('nft-marketplace:session'),
      ),
    ).toBeNull()
  })

  test('foco preso no modal, Esc fecha e devolve o foco à origem', async ({
    page,
    mocks,
    viewport,
  }) => {
    await mocks.goto('/')

    // Desktop abre pelo "Entrar" do header; mobile, pela aba "Minha conta".
    const trigger = isMobile(viewport?.width)
      ? page.getByRole('link', { name: 'Minha conta' })
      : page.getByRole('banner').getByRole('link', { name: 'Entrar' })
    await trigger.focus()
    await page.keyboard.press('Enter')

    const dialog = authDialog(page)
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('E-mail')).toBeFocused()

    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab')
      const inside = await dialog.evaluate((node) =>
        node.contains(document.activeElement),
      )
      expect(inside).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page).not.toHaveURL(/auth=/)
    await expect(trigger).toBeFocused()
  })
})
