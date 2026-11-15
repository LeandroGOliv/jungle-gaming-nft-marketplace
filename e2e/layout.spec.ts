import { expect, test } from './support/mocks'

const isMobile = (width: number | undefined) => (width ?? 0) < 768

test.describe('layout base', () => {
  test('rota inexistente exibe a 404 com caminho de volta ao início', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/colecao/nao-existe')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeVisible()
    await expect(page.getByText('/colecao/nao-existe')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()

    await page.getByRole('link', { name: 'Voltar ao início' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Marketplace de NFTs' }),
    ).toBeVisible()
  })

  test('link de "pular para o conteúdo" leva o foco ao conteúdo principal', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/')

    // O worker sobe antes do React: espera a aplicação montar.
    await expect(page.getByRole('main')).toBeAttached()
    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skipLink).toBeFocused()
    await expect(skipLink).toBeInViewport()

    await page.keyboard.press('Enter')
    await expect(page.getByRole('main')).toBeFocused()
  })

  test('header navegável por teclado, na ordem visual', async ({
    page,
    mocks,
    viewport,
  }) => {
    test.skip(isMobile(viewport?.width), 'O header é do desktop e do tablet.')
    await mocks.goto('/')

    const header = page.getByRole('banner')
    const order = [
      header.getByRole('link', { name: 'KURIO' }),
      header.getByRole('link', { name: 'Início' }),
      header.getByRole('link', { name: 'Mercado' }),
      header.getByRole('link', { name: 'Criadores' }),
      header.getByRole('link', { name: 'Aprenda' }),
      header.getByRole('link', { name: 'Buscar NFTs' }),
      header.getByRole('link', { name: 'Carrinho' }),
      header.getByRole('link', { name: 'Entrar' }),
    ]

    // O worker sobe antes do React: espera a aplicação montar.
    await expect(page.getByRole('main')).toBeAttached()
    await page.keyboard.press('Tab') // skip link
    for (const link of order) {
      await page.keyboard.press('Tab')
      await expect(link).toBeFocused()
    }

    // Item fora do escopo leva à página que explica isso, sem simular a seção.
    await header.getByRole('link', { name: 'Criadores' }).focus()
    await page.keyboard.press('Enter')
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Criadores não faz parte desta demonstração',
      }),
    ).toBeVisible()
  })

  test('"Entrar" leva ao login carregando o local de retorno', async ({
    page,
    mocks,
    viewport,
  }) => {
    test.skip(isMobile(viewport?.width), 'O botão Entrar fica no header.')
    await mocks.goto('/em-breve?secao=aprenda')

    await page.getByRole('banner').getByRole('link', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/login\?redirect=/)
    const redirect = new URL(page.url()).searchParams.get('redirect')
    expect(redirect).toBe('/em-breve?secao=aprenda')
  })

  test('no login, "Entrar" preserva o retorno e descarta destino externo', async ({
    page,
    mocks,
    viewport,
  }) => {
    test.skip(isMobile(viewport?.width), 'O botão Entrar fica no header.')
    const signIn = page
      .getByRole('banner')
      .getByRole('link', { name: 'Entrar' })

    await mocks.goto('/login?redirect=%2Fcarrinho')
    await expect(signIn).toHaveAttribute('href', '/login?redirect=%2Fcarrinho')

    // `/\evil.com` resolve para outro host no parser de URL do navegador.
    await mocks.goto('/login?redirect=%2F%5Cevil.com')
    await expect(signIn).toHaveAttribute('href', '/login')
  })

  test('destaque do header e aria-current indicam a mesma seção', async ({
    page,
    mocks,
    viewport,
  }) => {
    test.skip(isMobile(viewport?.width), 'O header é do desktop e do tablet.')
    const nav = page.getByRole('banner').getByRole('navigation')

    await mocks.goto('/carrinho')
    await expect(nav.getByRole('link', { name: 'Mercado' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(nav.locator('[aria-current]')).toHaveCount(1)

    await mocks.goto('/em-breve?secao=criadores')
    await expect(nav.locator('[aria-current]')).toHaveCount(0)
  })

  test('links do footer e parâmetros inválidos na URL', async ({
    page,
    mocks,
  }) => {
    await mocks.goto('/')
    const footer = page.getByRole('contentinfo')

    await footer.getByRole('link', { name: 'Arte digital' }).click()
    await expect(page).toHaveURL(/\/\?categoria=art$/)

    await footer.getByRole('link', { name: 'Arte 3D' }).click()
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Arte 3D não faz parte desta demonstração',
      }),
    ).toBeVisible()

    await mocks.goto('/?categoria=banana')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Marketplace de NFTs' }),
    ).toBeVisible()

    await mocks.goto('/em-breve?secao=banana')
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Esta seção não faz parte desta demonstração',
      }),
    ).toBeVisible()
  })

  test('busca mobile grava o termo na URL e mantém o foco no campo', async ({
    page,
    mocks,
    viewport,
  }) => {
    test.skip(!isMobile(viewport?.width), 'A barra de busca é do mobile.')
    await mocks.goto('/')
    const field = page.getByRole('searchbox', { name: 'Buscar NFTs' })

    await field.fill('emerald')
    await field.press('Enter')

    await expect(page).toHaveURL(/busca=/)
    expect(new URL(page.url()).searchParams.get('busca')).toContain('emerald')
    await expect(field).toBeFocused()

    await page.goBack()
    await expect(field).toHaveValue('')
  })

  test('tab bar navegável por teclado, com a aba ativa marcada', async ({
    page,
    mocks,
    viewport,
  }) => {
    test.skip(!isMobile(viewport?.width), 'A tab bar é só do mobile.')
    await mocks.goto('/')

    const tabBar = page.getByRole('navigation', {
      name: 'Principal',
      exact: true,
    })
    await expect(tabBar).toBeVisible()
    await expect(page.getByRole('banner')).toBeHidden()

    const order = [
      tabBar.getByRole('link', { name: 'Início' }),
      tabBar.getByRole('link', { name: 'Favoritos' }),
      tabBar.getByRole('button', { name: 'Ler QR code' }),
      tabBar.getByRole('link', { name: 'Carrinho' }),
      tabBar.getByRole('link', { name: 'Minha conta' }),
    ]
    // O worker sobe antes do React: espera a aplicação montar.
    await expect(page.getByRole('main')).toBeAttached()
    await page.keyboard.press('Tab') // skip link
    for (const item of order) {
      await page.keyboard.press('Tab')
      await expect(item).toBeFocused()
    }
    await expect(tabBar.getByRole('link', { name: 'Início' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await tabBar.getByRole('link', { name: 'Carrinho' }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(
      tabBar.getByRole('link', { name: 'Carrinho' }),
    ).toHaveAttribute('aria-current', 'page')

    // "Minha conta" agrupa perfil, carteiras e login.
    await mocks.goto('/login')
    await expect(
      tabBar.getByRole('link', { name: 'Minha conta' }),
    ).toHaveAttribute('aria-current', 'page')
  })

  test('scan da tab bar avisa que está fora do escopo', async ({
    page,
    mocks,
    viewport,
  }) => {
    test.skip(!isMobile(viewport?.width), 'A tab bar é só do mobile.')
    await mocks.goto('/')

    await page.getByRole('button', { name: 'Ler QR code' }).click()

    await expect(
      page
        .getByRole('status')
        .filter({ hasText: 'A leitura de QR code não está disponível' }),
    ).toHaveCount(1)
  })

  test('newsletter não simula cadastro', async ({ page, mocks }) => {
    await mocks.goto('/')
    const footer = page.getByRole('contentinfo')

    await footer
      .getByLabel('Antecipe-se ao próximo lançamento')
      .fill('colecionador@example.com')
    await footer.getByRole('button', { name: 'Enviar' }).click()

    await expect(footer.getByRole('status')).toHaveText(
      'A newsletter não está disponível nesta demonstração. Nenhum e-mail foi cadastrado.',
    )
  })

  test('não há rolagem horizontal', async ({ page, mocks }) => {
    for (const path of ['/', '/carrinho', '/em-breve', '/nao-existe']) {
      await mocks.goto(path)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(overflow, path).toBeLessThanOrEqual(0)
    }
  })
})
