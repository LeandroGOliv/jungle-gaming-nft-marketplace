import { expect, test } from './support/mocks'
import type { Locator, Page } from '@playwright/test'

// Cenário 11: cada diálogo prende o foco, fecha com Esc e devolve o foco a
// quem o abriu; ações e formulários respondem só ao teclado.

const NOVA = { email: 'nova@colecionador.test', password: 'Kurio@2026' }

const isMobile = (width: number | undefined) => (width ?? 0) < 768

/** Tabula além do número de controles do diálogo: o foco não pode sair dele. */
async function expectFocusTrapped(page: Page, dialog: Locator) {
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab')
    expect(
      await dialog.evaluate((node) => node.contains(document.activeElement)),
    ).toBe(true)
  }
}

test.describe('teclado e foco (cenário 11)', () => {
  test('login: foco no primeiro campo, validação, foco preso e Esc', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/?auth=entrar')
    const dialog = page.getByRole('dialog')
    const email = dialog.getByLabel('E-mail')
    await expect(email).toBeFocused()

    // Enviar vazio pelo teclado: erros nos campos e foco no primeiro inválido.
    await page.keyboard.press('Enter')
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toBeFocused()

    await expectFocusTrapped(page, dialog)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page).not.toHaveURL(/auth=/)
    await expect(page.locator('#conteudo')).toBeFocused()

    // Reabrir e entrar só pelo teclado.
    await mocks.goto('/?auth=entrar')
    await expect(email).toBeFocused()
    await page.keyboard.type(NOVA.email)
    await page.keyboard.press('Tab')
    await page.keyboard.type(NOVA.password)
    await page.keyboard.press('Enter')
    await expect(dialog).toBeHidden()
  })

  test('zoom da galeria abre pelo teclado e devolve o foco', async ({
    page,
    mocks,
    viewport,
  }) => {
    test.skip(isMobile(viewport?.width), 'O zoom é da galeria desktop.')
    await mocks.goto('/nft/emerald-ape-042')
    const zoom = page.getByRole('button', { name: 'Ampliar imagem' })
    await zoom.focus()
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expectFocusTrapped(page, dialog)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(zoom).toBeFocused()
  })

  test('filtros do catálogo no mobile prendem o foco e devolvem ao botão', async ({
    page,
    mocks,
    viewport,
  }) => {
    test.skip(!isMobile(viewport?.width), 'A folha de filtros é do mobile.')
    await mocks.goto('/')
    const trigger = page
      .getByRole('button', { name: 'Filtros' })
      .filter({ visible: true })
    await trigger.focus()
    await page.keyboard.press('Enter')

    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible()
    await expectFocusTrapped(page, sheet)

    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('compra confirmada e modal do pedido operados pelo teclado', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/pagamento', { scenario: 'order-pending' })
    await expect(page.getByRole('dialog').getByLabel('E-mail')).toBeFocused()
    await page.keyboard.type(NOVA.email)
    await page.keyboard.press('Tab')
    await page.keyboard.type(NOVA.password)
    await page.keyboard.press('Enter')

    const providers = page.getByRole('group', { name: 'Carteira e rede' })
    await expect(providers).toBeVisible()
    const metamask = providers.getByRole('radio', { name: 'MetaMask' })
    await metamask.focus()
    if (await metamask.isChecked()) {
      await providers.getByRole('button', { name: 'Conectar' }).focus()
      await page.keyboard.press('Enter')
    } else {
      await page.keyboard.press('Space')
    }
    await expect(providers).toContainText('Conectada')

    await page.getByRole('button', { name: 'Confirmar compra' }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/pagamento\?pedido=ord_\d+$/)
    const orderId = new URL(page.url()).searchParams.get('pedido')!

    const dialog = page.getByRole('dialog')
    await expect(
      dialog.getByRole('heading', {
        name: 'Aguardando a confirmação do pagamento',
      }),
    ).toBeVisible()
    await expectFocusTrapped(page, dialog)

    await mocks.settleOrder(orderId, 'confirmed')
    const close = dialog.getByRole('button', { name: 'Fechar' })
    await close.focus()
    await page.keyboard.press('Enter')
    await expect(dialog).toBeHidden()
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe(
      'BODY',
    )
  })
})
