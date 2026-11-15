import { useLayoutOptions } from '@/hooks/use-layout-options'
import { cn } from '@/lib/utils'
import { LiveAnnouncer } from './live-announcer'
import { MobileTabBar } from './mobile-tab-bar'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'
import { MAIN_CONTENT_ID, SkipLink } from './skip-link'

/** Estrutura comum a todas as telas, configurada pelo `staticData` da rota. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { navSection, headerDivider, mobileTabBar } = useLayoutOptions()

  return (
    <LiveAnnouncer>
      <div
        className={cn(
          'flex min-h-dvh flex-col',
          // Reserva a altura da tab bar fixa para ela não cobrir o fim da página.
          mobileTabBar && 'pb-[126px] md:pb-0',
        )}
      >
        <SkipLink />
        <SiteHeader navSection={navSection} divider={headerDivider} />
        {/* Antes do <main> para vir logo após o skip link na ordem de foco. */}
        {mobileTabBar && <MobileTabBar />}
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="flex-1 outline-none"
        >
          {children}
        </main>
        <SiteFooter />
      </div>
    </LiveAnnouncer>
  )
}
