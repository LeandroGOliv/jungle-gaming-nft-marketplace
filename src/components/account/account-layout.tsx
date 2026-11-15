import { Link, useRouter } from '@tanstack/react-router'
import { MaskIcon } from '@/components/layout/mask-icon'
import { PageContainer } from '@/components/layout/page-container'
import { useSignOut } from '@/hooks/use-sign-out'
import { cn } from '@/lib/utils'
import type { OutOfScopeSection } from '@/components/layout/out-of-scope'

type AccountSection = 'perfil' | 'carteiras'

interface NavItem {
  label: string
  icon: { src: string; size: number }
  /** Telas da entrega; as demais levam à explicação de fora do escopo. */
  to: { section: AccountSection } | { outOfScope: OutOfScopeSection }
}

// Ordem, ícones e tamanhos da "Account Sidebar" do Figma (70420:4594).
const NAV_ITEMS: Array<NavItem> = [
  {
    label: 'Dados do perfil',
    icon: { src: '/icons/account-user.svg', size: 18 },
    to: { section: 'perfil' },
  },
  {
    label: 'Carteiras',
    icon: { src: '/icons/account-wallets.svg', size: 20 },
    to: { section: 'carteiras' },
  },
  {
    label: 'Atividade',
    icon: { src: '/icons/account-activity.svg', size: 18 },
    to: { outOfScope: 'atividade' },
  },
  {
    label: 'Lista de interesse',
    icon: { src: '/icons/account-watchlist.svg', size: 16 },
    to: { outOfScope: 'lista-de-interesse' },
  },
  {
    label: 'Ofertas',
    icon: { src: '/icons/account-offers.svg', size: 18 },
    to: { outOfScope: 'ofertas' },
  },
  {
    label: 'Arquivos baixados',
    icon: { src: '/icons/account-downloads.svg', size: 18 },
    to: { outOfScope: 'arquivos-baixados' },
  },
  {
    label: 'Suporte',
    icon: { src: '/icons/account-support.svg', size: 18 },
    to: { outOfScope: 'suporte' },
  },
]

interface AccountLayoutProps {
  active: AccountSection
  /** Título da tela: visível no mobile, só para leitores de tela no desktop. */
  title: string
  children: React.ReactNode
}

/**
 * Moldura das telas da conta: a "Account Sidebar" do Figma ao lado do
 * conteúdo a partir de 1024 px; abaixo disso (sem frame mobile no Figma),
 * cabeçalho com voltar e título, como no carrinho mobile.
 */
export function AccountLayout({ active, title, children }: AccountLayoutProps) {
  return (
    <PageContainer className="pt-8 pb-16 md:pb-24">
      <MobileHeader title={title} />
      <h1 className="sr-only">{title}</h1>
      <div className="flex flex-col gap-7 lg:flex-row lg:items-start">
        <AccountSidebar active={active} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </PageContainer>
  )
}

function MobileHeader({ title }: { title: string }) {
  const router = useRouter()
  const goBack = () => {
    if (router.history.canGoBack()) router.history.back()
    else void router.navigate({ to: '/' })
  }
  return (
    <div className="relative mb-6 flex h-11 items-start lg:hidden">
      <button
        type="button"
        onClick={goBack}
        aria-label="Voltar"
        className="focus-ring flex size-[35px] cursor-pointer items-center justify-center rounded-full border border-border bg-[#2f1d15] text-text-secondary"
      >
        <MaskIcon src="/icons/detail-arrow-left.svg" width={8} height={14} />
      </button>
      <p
        aria-hidden="true"
        className="absolute inset-x-12 top-[9px] text-center text-xl leading-4 font-bold text-foreground"
      >
        {title}
      </p>
    </div>
  )
}

function AccountSidebar({ active }: { active: AccountSection }) {
  const { signOut, isPending } = useSignOut()

  return (
    <nav
      aria-label="Minha conta"
      className="w-[310px] shrink-0 bg-card py-2 max-lg:hidden"
    >
      <p className="p-2.5 text-lg leading-4 font-bold text-foreground">
        Meu perfil
      </p>
      <ul>
        {NAV_ITEMS.map((item) => {
          const current = 'section' in item.to && item.to.section === active
          const className = cn(
            'focus-ring flex h-[45px] items-center px-4 text-[15px] leading-[45px] text-text-accent hover:bg-surface-dark/60',
            // Item ativo: borda esquerda de 6 px por dentro, como no Figma.
            current && 'shadow-[inset_6px_0_0_var(--brand-primary)]',
            // Só "Dados do perfil" tem 16 px entre ícone e texto no Figma.
            'section' in item.to && item.to.section === 'perfil'
              ? 'gap-4'
              : 'gap-3',
          )
          const content = (
            <>
              <img
                src={item.icon.src}
                alt=""
                width={item.icon.size}
                height={item.icon.size}
                className="shrink-0"
              />
              {item.label}
            </>
          )
          return (
            <li key={item.label}>
              {'section' in item.to ? (
                <Link
                  to={item.to.section === 'perfil' ? '/perfil' : '/carteiras'}
                  aria-current={current ? 'page' : undefined}
                  className={className}
                >
                  {content}
                </Link>
              ) : (
                <Link
                  to="/em-breve"
                  search={{ secao: item.to.outOfScope }}
                  className={className}
                >
                  {content}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
      <div className="border-t border-primary/30">
        <button
          type="button"
          onClick={signOut}
          disabled={isPending}
          className="focus-ring flex h-10 w-full cursor-pointer items-center gap-2 px-4 text-[15px] leading-[15px] font-bold text-text-accent hover:bg-surface-dark/60 disabled:opacity-50"
        >
          <img src="/icons/account-logout.svg" alt="" width={20} height={20} />
          Sair
        </button>
      </div>
    </nav>
  )
}
