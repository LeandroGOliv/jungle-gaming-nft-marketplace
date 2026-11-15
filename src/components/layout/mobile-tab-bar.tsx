import { useEffect, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { useAnnounce } from '@/hooks/use-announce'
import { cn } from '@/lib/utils'
import { MaskIcon } from './mask-icon'
import { NavLink } from './nav-link'
import type { LinkProps, RegisteredRouter } from '@tanstack/react-router'

type RoutePath = keyof RegisteredRouter['routesByPath']

interface TabItem {
  label: string
  link: LinkProps
  /** Caminhos em que a aba aparece ativa. */
  paths: Array<RoutePath>
  icon: { src: string; width: number; height: number }
  /** Centro do ícone no frame de 414 px, em %, para escalar com a largura. */
  left: string
}

const TABS: Array<TabItem> = [
  {
    label: 'Início',
    link: { to: '/' },
    paths: ['/'],
    icon: { src: '/icons/tab-home.svg', width: 15.83, height: 16.67 },
    left: 'left-[11.111%]',
  },
  {
    label: 'Favoritos',
    link: { to: '/em-breve', search: { secao: 'favoritos' } },
    paths: [],
    icon: { src: '/icons/tab-heart.svg', width: 20, height: 17.79 },
    left: 'left-[28.502%]',
  },
  {
    label: 'Carrinho',
    link: { to: '/carrinho' },
    paths: ['/carrinho'],
    icon: { src: '/icons/tab-shop.svg', width: 20, height: 20 },
    left: 'left-[72.947%]',
  },
  {
    label: 'Minha conta',
    link: { to: '/perfil' },
    paths: ['/perfil', '/carteiras'],
    icon: { src: '/icons/tab-user.svg', width: 20, height: 20 },
    left: 'left-[87.923%]',
  },
]

const SCAN_NOTICE =
  'A leitura de QR code não está disponível nesta demonstração.'

/** Navegação do mobile (abaixo de 768 px), desenhada sobre 414 × 126. */
export function MobileTabBar() {
  const pathname = useLocation({
    select: (location) => location.pathname,
  }) as RoutePath

  return (
    <nav
      aria-label="Principal"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto h-[126px] w-full max-w-[414px] md:hidden"
    >
      <div aria-hidden="true" className="absolute inset-[24.6%_0_0.04%_0]">
        <div className="absolute inset-[-42.13%_-7.25%_-21.06%_-7.25%]">
          <img
            src="/icons/tab-bar-bg.svg"
            alt=""
            className="block size-full max-w-none"
          />
        </div>
      </div>

      <ul>
        {TABS.slice(0, 2).map((tab) => (
          <TabLink
            key={tab.label}
            tab={tab}
            active={tab.paths.includes(pathname)}
          />
        ))}
        <li>
          <ScanButton />
        </li>
        {TABS.slice(2).map((tab) => (
          <TabLink
            key={tab.label}
            tab={tab}
            active={tab.paths.includes(pathname)}
          />
        ))}
      </ul>
    </nav>
  )
}

function TabLink({ tab, active }: { tab: TabItem; active: boolean }) {
  return (
    <li>
      <NavLink
        {...tab.link}
        current={active}
        aria-label={tab.label}
        className={cn(
          'focus-ring pointer-events-auto absolute top-[59px] grid size-11 -translate-x-1/2 place-items-center rounded-md',
          tab.left,
          active
            ? 'text-text-accent'
            : 'text-text-secondary hover:text-foreground',
        )}
      >
        <span className="grid size-5 place-items-center">
          <MaskIcon {...tab.icon} />
        </span>
      </NavLink>
    </li>
  )
}

/** Fora do escopo: o botão avisa que a leitura não existe, sem simular nada. */
function ScanButton() {
  const announce = useAnnounce()
  // Cada clique gera um novo id, o que reinicia o prazo do aviso aberto.
  const [noticeId, setNoticeId] = useState(0)

  useEffect(() => {
    if (noticeId === 0) return
    const timer = window.setTimeout(() => setNoticeId(0), 4000)
    return () => window.clearTimeout(timer)
  }, [noticeId])

  return (
    <>
      <button
        type="button"
        aria-label="Ler QR code"
        onClick={() => {
          setNoticeId((id) => id + 1)
          announce(SCAN_NOTICE)
        }}
        // O círculo do Figma é translúcido sobre o fundo `ink` do frame; o
        // disco opaco evita que o conteúdo rolando por baixo apareça nele.
        className="focus-ring pointer-events-auto absolute top-0 left-1/2 size-[65px] -translate-x-1/2 rounded-full bg-background"
      >
        <img
          src="/icons/tab-scan-circle.svg"
          alt=""
          width={65}
          height={65}
          className="absolute inset-0 size-full"
        />
        {/* Glifo de scan: 5 vetores do Figma nas posições do grupo 26.8 × 24. */}
        <span
          aria-hidden="true"
          className="absolute top-[21px] left-[19px] h-6 w-[26.82px]"
        >
          <img
            src="/icons/tab-scan-corner-tl.svg"
            alt=""
            className="absolute top-0 left-[1.33px] h-[10.31px] w-[10.39px] max-w-none"
          />
          <img
            src="/icons/tab-scan-corner-tr.svg"
            alt=""
            className="absolute top-[0.08px] left-[15.11px] h-[10.3px] w-[10.39px] max-w-none"
          />
          <img
            src="/icons/tab-scan-line.svg"
            alt=""
            className="absolute top-[11.1px] left-0 h-[1.79px] w-[26.82px] max-w-none"
          />
          <img
            src="/icons/tab-scan-corner-bl.svg"
            alt=""
            className="absolute top-[13.69px] left-[1.33px] h-[10.31px] w-[10.35px] max-w-none"
          />
          <img
            src="/icons/tab-scan-corner-br.svg"
            alt=""
            className="absolute top-[13.7px] left-[15.11px] h-[10.25px] w-[10.32px] max-w-none"
          />
        </span>
      </button>
      {noticeId > 0 && (
        <p
          aria-hidden="true"
          className="absolute bottom-[calc(100%+8px)] left-1/2 w-max max-w-[calc(100vw-48px)] -translate-x-1/2 rounded-md border border-border-soft bg-surface-dark px-3 py-2 text-center text-xs leading-4 text-foreground shadow-[0_0_10px_rgba(10,6,4,0.45)]"
        >
          {SCAN_NOTICE}
        </p>
      )}
    </>
  )
}
