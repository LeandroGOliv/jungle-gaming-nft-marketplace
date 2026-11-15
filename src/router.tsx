import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'

export interface RouterContext {
  queryClient: QueryClient
}

export function getRouter(context: RouterContext) {
  return createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    // O cache é do TanStack Query; o router não mantém uma cópia própria.
    defaultPreloadStaleTime: 0,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }

  /** Opções do layout comum; a rota mais interna que define uma opção vence. */
  interface StaticDataRouteOption {
    /** Item do header destacado: Início ou Mercado (fluxo de compra). */
    navSection?: 'home' | 'market'
    /** O Figma usa o filete sob o header em todas as telas, exceto as do Mercado. */
    headerDivider?: boolean
    /** Telas com barra inferior própria no mobile (compra, carrinho) escondem a tab bar. */
    mobileTabBar?: boolean
  }
}
