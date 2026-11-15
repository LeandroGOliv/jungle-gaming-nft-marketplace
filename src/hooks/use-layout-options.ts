import { useMatches } from '@tanstack/react-router'
import type {
  MakeRouteMatchUnion,
  StaticDataRouteOption,
} from '@tanstack/react-router'

export interface LayoutOptions {
  navSection: StaticDataRouteOption['navSection']
  headerDivider: boolean
  mobileTabBar: boolean
}

const DEFAULTS: LayoutOptions = {
  navSection: undefined,
  headerDivider: true,
  mobileTabBar: true,
}

/** Junta o `staticData` das rotas ativas, da raiz para a mais interna. */
function mergeLayoutOptions(
  matches: Array<MakeRouteMatchUnion>,
): LayoutOptions {
  const options = { ...DEFAULTS }
  for (const match of matches) {
    const data = match.staticData
    if (data.navSection !== undefined) options.navSection = data.navSection
    if (data.headerDivider !== undefined)
      options.headerDivider = data.headerDivider
    if (data.mobileTabBar !== undefined)
      options.mobileTabBar = data.mobileTabBar
  }
  return options
}

/**
 * Opções de layout da rota atual. O compartilhamento estrutural mantém a
 * mesma referência enquanto as opções não mudam, então trocar de search
 * params ou de fase da navegação não re-renderiza o shell inteiro.
 */
export function useLayoutOptions(): LayoutOptions {
  return useMatches({ select: mergeLayoutOptions, structuralSharing: true })
}
