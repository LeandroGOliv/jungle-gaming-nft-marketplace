import { createLink } from '@tanstack/react-router'

interface NavAnchorProps extends React.ComponentProps<'a'> {
  /** Item destacado na navegação; o `aria-current` acompanha o destaque. */
  current: boolean
}

/**
 * O Link do TanStack marca `aria-current` pela URL exata, mas o destaque do
 * layout segue a seção da rota (ex.: Mercado em todo o fluxo de compra).
 * Esta âncora sobrescreve o atributo para os dois dizerem o mesmo.
 */
function NavAnchor({ current, ...props }: NavAnchorProps) {
  return <a {...props} aria-current={current ? 'page' : undefined} />
}

export const NavLink = createLink(NavAnchor)
