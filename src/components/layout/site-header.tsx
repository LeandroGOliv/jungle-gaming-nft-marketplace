import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { AccountIndicator } from './account-indicator'
import { CartIndicator } from './cart-indicator'
import { NavLink } from './nav-link'
import { PageContainer } from './page-container'
import type { LinkProps } from '@tanstack/react-router'
import type { LayoutOptions } from '@/hooks/use-layout-options'

interface NavItem {
  label: string
  link: LinkProps
  section?: LayoutOptions['navSection']
}

const NAV_ITEMS: Array<NavItem> = [
  { label: 'Início', link: { to: '/' }, section: 'home' },
  { label: 'Mercado', link: { to: '/', hash: 'catalogo' }, section: 'market' },
  {
    label: 'Criadores',
    link: { to: '/em-breve', search: { secao: 'criadores' } },
  },
  { label: 'Aprenda', link: { to: '/em-breve', search: { secao: 'aprenda' } } },
]

interface SiteHeaderProps {
  navSection: LayoutOptions['navSection']
  divider: boolean
}

/** Header do desktop e do tablet; abaixo de 768 px a navegação é a tab bar. */
export function SiteHeader({ navSection, divider }: SiteHeaderProps) {
  return (
    <header className="hidden pt-6 md:block">
      <PageContainer>
        <div
          className={cn(
            'flex h-[45px] items-start justify-between gap-6',
            // Filete de 0,3 px do Figma: 1 px com 30% de opacidade dá a mesma cobertura.
            divider && 'border-b border-primary/30',
          )}
        >
          <Link
            to="/"
            aria-label="KURIO, página inicial"
            className="focus-ring h-[34.3px] shrink-0 rounded-sm pt-[8.15px] text-sm leading-[normal] font-bold tracking-widest text-foreground lg:w-40"
          >
            KURIO
          </Link>

          <nav aria-label="Principal" className="h-full">
            <ul className="flex h-full gap-6 lg:gap-10">
              {NAV_ITEMS.map((item) => (
                <li key={item.label} className="h-full">
                  <HeaderNavItem
                    item={item}
                    active={
                      navSection !== undefined && item.section === navSection
                    }
                  />
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-7">
            <Link
              to="/"
              hash="catalogo"
              aria-label="Buscar NFTs"
              className="focus-ring grid size-5 place-items-center rounded-sm"
            >
              <img src="/icons/search.svg" alt="" width={20} height={20} />
            </Link>
            {/* A contagem entra com a consulta do carrinho. */}
            <CartIndicator />
            <AccountIndicator />
          </div>
        </div>
      </PageContainer>
    </header>
  )
}

function HeaderNavItem({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <NavLink
      {...item.link}
      current={active}
      className={cn(
        'focus-ring relative flex h-full flex-col rounded-sm text-base leading-[normal] whitespace-nowrap',
        active
          ? 'font-bold text-text-accent'
          : 'text-foreground hover:text-text-accent',
      )}
    >
      {item.label}
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[3px] bg-primary"
        />
      )}
    </NavLink>
  )
}
