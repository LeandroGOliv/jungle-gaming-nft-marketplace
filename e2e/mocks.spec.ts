import { expect, test } from './support/mocks'

const FIXTURE_NFTS = 40

test.describe('camada de mocks', () => {
  test('seleciona o cenário pela URL e remove o parâmetro', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/simulacao', { scenario: 'empty' })

    await expect(page.getByTestId('active-scenario')).toHaveText(
      'Catálogo vazio',
    )
    await expect(page.getByTestId('data-counts')).toContainText('0 NFTs')
    expect(new URL(page.url()).search).toBe('')
  })

  test('cenário sem conexão falha e o reset pela interface restaura o padrão', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/simulacao', { scenario: 'offline' })
    const probe = page.getByTestId('probe-result')

    await page.getByRole('button', { name: 'Enviar requisição' }).click()
    await expect(probe).toHaveText('Falhou: Sem conexão com o servidor.')

    await page.getByRole('radio', { name: 'Padrão', exact: true }).check()
    await page.getByRole('button', { name: 'Aplicar cenário' }).click()
    await expect(page.getByTestId('active-scenario')).toHaveText('Padrão')

    await page.getByRole('button', { name: 'Enviar requisição' }).click()
    await expect(probe).toContainText('Resposta recebida')
  })

  test('responde com o erro HTTP configurado no formato padrão', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/simulacao')
    await mocks.addFault({
      id: 'health-503',
      method: 'GET',
      path: '/health',
      effect: { kind: 'http', status: 503 },
      times: 1,
    })

    const first = await page.evaluate(async () => {
      const response = await fetch('/api/health')
      return { status: response.status, body: await response.json() }
    })
    const second = await page.evaluate(
      async () => (await fetch('/api/health')).status,
    )

    expect(first).toEqual({
      status: 503,
      body: expect.objectContaining({
        status: 503,
        code: 'SERVICE_UNAVAILABLE',
        retryable: true,
      }),
    })
    expect(second).toBe(200)
  })

  test('controla a latência pelo relógio do teste', async ({ page, mocks }) => {
    await page.clock.install({ time: new Date('2026-12-01T10:00:00Z') })
    await mocks.goto('/simulacao')
    await expect(page.getByTestId('active-scenario')).toHaveText('Padrão')
    // Congela o relógio: daqui em diante o tempo só anda com runFor.
    await page.clock.pauseAt(new Date('2026-12-01T10:05:00Z'))
    await mocks.setLatency({ kind: 'fixed', ms: 5000 })

    const probe = page.getByTestId('probe-result')
    const waiting = page.getByRole('button', { name: 'Aguardando resposta…' })
    // Com o relógio parado a UI só atualiza quando o tempo anda: o TanStack
    // Query agenda as notificações com setTimeout.
    const advanceUntil = (ms: number, read: () => Promise<unknown>) =>
      expect.poll(async () => {
        await page.clock.runFor(ms)
        return read()
      })

    await page.getByRole('button', { name: 'Enviar requisição' }).click()
    await advanceUntil(1, () => waiting.count()).toBe(1)

    await page.clock.runFor(4000)
    await expect(waiting).toBeDisabled()
    await expect(probe).toHaveText('')

    await page.clock.runFor(1500)
    await advanceUntil(10, () => probe.textContent()).toMatch(
      /^Resposta recebida em 5\d{3} ms\.$/,
    )
  })

  test('mantém cenário e latência após o refresh', async ({ page, mocks }) => {
    await mocks.goto('/simulacao', { scenario: 'flaky', latency: 'slow' })

    await page.reload()

    await expect(page.getByTestId('active-scenario')).toHaveText('Instável')
    expect(await mocks.state()).toMatchObject({
      scenarioId: 'flaky',
      latency: { kind: 'fixed', ms: 2500 },
    })
  })
})

test.describe('isolamento entre testes', () => {
  // Em série no mesmo worker: o segundo roda depois do primeiro ter alterado o estado.
  test.describe.configure({ mode: 'serial' })

  test('altera o estado e não restaura', async ({ mocks }) => {
    await mocks.goto('/simulacao', { scenario: 'empty' })

    expect((await mocks.state()).counts.nfts).toBe(0)
  })

  test('o teste seguinte parte do cenário padrão', async ({ page }) => {
    await page.goto('/simulacao')

    await expect(page.getByTestId('active-scenario')).toHaveText('Padrão')
    await expect(page.getByTestId('data-counts')).toContainText(
      `${FIXTURE_NFTS} NFTs`,
    )
  })
})
