import { expect, test } from './support/mocks'
import type { Page } from '@playwright/test'
import type { Mocks } from './support/mocks'
import type { OrderUpdatedData, RealtimeEnvelope } from '../src/types/realtime'

const NOVA = { email: 'nova@colecionador.test', password: 'Kurio@2026' }
const RAFAEL = { email: 'rafael@colecionador.test', password: 'Selva#2026' }

const dialog = (page: Page) => page.getByRole('dialog')
const nameField = (page: Page) =>
  page.getByRole('main').getByRole('textbox', { name: 'Nome de exibição' })
const header = (page: Page) => page.getByRole('banner')

async function signIn(page: Page, credentials: typeof NOVA) {
  await dialog(page).getByLabel('E-mail').fill(credentials.email)
  await dialog(page)
    .getByLabel('Senha', { exact: true })
    .fill(credentials.password)
  await dialog(page)
    .getByRole('button', { name: 'Entrar', exact: true })
    .click()
  // Só o formulário: o modal do pedido pode abrir logo em seguida.
  await expect(
    page
      .getByRole('dialog')
      .getByRole('button', { name: 'Entrar', exact: true }),
  ).toHaveCount(0)
}

async function realtimeUsers(mocks: Mocks) {
  return [...(await mocks.state()).realtimeUsers].sort()
}

/** Token de uma sessão aberta direto na API, como num outro dispositivo. */
async function apiLogin(page: Page, credentials: typeof NOVA) {
  return page.evaluate(async (body) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return ((await response.json()) as { token: string }).token
  }, credentials)
}

interface PeerSocket {
  events: Array<unknown>
  closed: boolean
}

declare global {
  interface Window {
    __peer?: PeerSocket
  }
}

/**
 * Conexão Socket.IO de outra sessão, aberta na página com o protocolo do
 * Engine.IO (o MSW a intercepta como a da aplicação). Prova o que o servidor
 * simulado entrega a cada conexão, independente da tela.
 */
async function openPeerSocket(page: Page, token: string) {
  await page.evaluate(
    (auth) =>
      new Promise<void>((resolve, reject) => {
        const url = new URL(
          '/realtime/?EIO=4&transport=websocket',
          location.href,
        )
        url.protocol = url.protocol.replace('http', 'ws')
        const peer: PeerSocket = { events: [], closed: false }
        window.__peer = peer
        const socket = new WebSocket(url)
        socket.addEventListener('message', ({ data }) => {
          const packet = String(data)
          if (packet.startsWith('0')) socket.send(`40${JSON.stringify(auth)}`)
          else if (packet.startsWith('40')) resolve()
          else if (packet.startsWith('42'))
            peer.events.push(JSON.parse(packet.slice(2)))
          else if (packet === '2') socket.send('3')
        })
        socket.addEventListener('close', () => (peer.closed = true))
        socket.addEventListener('error', () => reject(new Error('socket')))
      }),
    { token },
  )
}

const peer = (page: Page) => page.evaluate(() => window.__peer!)

function orderEvent(
  orderId: string,
  data: Partial<OrderUpdatedData>,
): RealtimeEnvelope<OrderUpdatedData> {
  return {
    eventId: `evt_${orderId}_${Date.now()}`,
    resource: { type: 'order', id: orderId },
    version: 99,
    emittedAt: new Date().toISOString(),
    data: {
      status: 'confirmed',
      transactionHash: `0x${'a'.repeat(64)}`,
      refusalReason: null,
      updatedAt: new Date().toISOString(),
      ...data,
    },
  }
}

test.describe('isolamento por usuário', () => {
  test('troca de usuário: evento privado do anterior não altera a tela do novo (cenário 3)', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/perfil', { scenario: 'checkout' })
    await signIn(page, NOVA)
    await expect(nameField(page)).toHaveValue('Nova Sato')
    await page.getByRole('main').getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/$/)

    // ord_0002 é do Rafael, recusado.
    await page.goto('/pagamento?pedido=ord_0002')
    await signIn(page, RAFAEL)
    const refused = dialog(page).getByRole('heading', {
      name: 'Pagamento recusado',
    })
    await expect(refused).toBeVisible()

    // A Nova segue conectada em outra sessão, ao mesmo tempo que o Rafael.
    await openPeerSocket(page, await apiLogin(page, NOVA))
    await expect
      .poll(() => realtimeUsers(mocks))
      .toEqual(['usr_nova', 'usr_rafael'])

    // O evento da Nova, sobre o pedido aberto na tela do Rafael, chega só a ela.
    await mocks.emitToUser(
      'usr_nova',
      'order.updated',
      orderEvent('ord_0002', { status: 'confirmed' }),
    )
    await expect.poll(async () => (await peer(page)).events).toHaveLength(1)
    await expect(refused).toBeVisible()
    await expect(dialog(page)).not.toContainText(
      'Seus NFTs agora estão na sua carteira',
    )
  })

  test('evento privado de outra sessão ou de token vencido é ignorado (cenário 10)', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/pagamento?pedido=ord_0001', { scenario: 'checkout' })
    await signIn(page, RAFAEL)
    await expect(
      dialog(page).getByRole('heading', { name: 'Pedido não encontrado' }),
    ).toBeVisible()
    await openPeerSocket(page, await apiLogin(page, NOVA))
    await expect
      .poll(() => realtimeUsers(mocks))
      .toEqual(['usr_nova', 'usr_rafael'])

    // Evento privado da Nova: chega à conexão dela, não à do Rafael.
    await mocks.emitToUser(
      'usr_nova',
      'order.updated',
      orderEvent('ord_0001', { status: 'refused', refusalReason: 'Vazou.' }),
    )
    await expect.poll(async () => (await peer(page)).events).toHaveLength(1)
    await expect(dialog(page)).not.toContainText('Vazou.')

    // Token vencido: o servidor encerra a conexão e não entrega mais nada.
    await mocks.expireSessions()
    await expect.poll(async () => (await peer(page)).closed).toBe(true)
    await mocks.emitToUser(
      'usr_nova',
      'order.updated',
      orderEvent('ord_0001', { status: 'refused' }),
    )
    expect((await peer(page)).events).toHaveLength(1)
    await expect.poll(() => realtimeUsers(mocks)).not.toContain('usr_rafael')
  })

  test('o mesmo usuário volta à tela após expirar e recarregar', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/perfil')
    await signIn(page, NOVA)
    await expect(nameField(page)).toHaveValue('Nova Sato')

    await mocks.expireSessions()
    await page.reload()
    await expect(page).toHaveURL(/redirect=%2Fperfil/)
    await signIn(page, NOVA)
    await expect(page).toHaveURL(/\/perfil$/)
    await expect(nameField(page)).toHaveValue('Nova Sato')
  })

  test('retorno após o login só leva de volta o mesmo usuário', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/perfil')
    await signIn(page, NOVA)
    await expect(nameField(page)).toHaveValue('Nova Sato')

    await mocks.expireSessions()
    await page.reload()
    await expect(dialog(page)).toBeVisible()
    await expect(page).toHaveURL(/redirect=%2Fperfil/)

    // Outro usuário: a tela da Nova não é dele, vai para a Início.
    await signIn(page, RAFAEL)
    await expect(page).toHaveURL(/\/$/)
    await expect(nameField(page)).toBeHidden()
  })

  test('falha transitória ao verificar a sessão não vira visitante', async ({
    page,
    mocks,
  }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) < 768,
      'O estado da conta no header só existe a partir de 768 px.',
    )
    await mocks.goto('/?auth=entrar')
    await signIn(page, NOVA)
    const profileLink = header(page).getByRole('link', {
      name: 'Perfil de Nova Sato',
    })
    await expect(profileLink).toBeVisible()

    await mocks.addFault({
      id: 'session-503',
      method: 'GET',
      path: '/auth/session',
      effect: { kind: 'http', status: 503 },
    })
    await page.reload()
    const reconnect = header(page).getByRole('button', {
      name: 'Reconectar sua sessão',
    })
    await expect(reconnect).toBeVisible()
    await expect(
      header(page).getByRole('link', { name: 'Entrar' }),
    ).toHaveCount(0)

    await mocks.setFaults([])
    await reconnect.click()
    await expect(profileLink).toBeVisible()
  })

  test('entrar, sair e trocar de usuário refletem entre abas', async ({
    page,
    context,
    mocks,
  }) => {
    await mocks.goto('/perfil')
    const other = await context.newPage()
    await other.goto('/')
    await other.waitForFunction(() => window.__mocks !== undefined)

    // Entrar numa aba vale para a outra, sem derrubar a primeira.
    await signIn(page, NOVA)
    await expect(nameField(page)).toHaveValue('Nova Sato')
    await other.goto('/perfil')
    await expect(nameField(other)).toHaveValue('Nova Sato')
    await expect(nameField(page)).toHaveValue('Nova Sato')

    // Sair numa aba: a outra deixa a tela privada e pede login.
    await other.getByRole('main').getByRole('button', { name: 'Sair' }).click()
    await expect(dialog(page)).toBeVisible()
    await expect(nameField(page)).toBeHidden()

    // Outro usuário entra: a tela privada da Nova não é retomada por ele.
    await other.goto('/?auth=entrar')
    await signIn(other, RAFAEL)
    await expect(dialog(page)).toBeHidden()
    await expect(page).toHaveURL(/\/$/)
    await page.goto('/perfil')
    await expect(nameField(page)).toHaveValue('Rafael Lima')
    await expect(nameField(other)).toBeHidden()
  })
})
