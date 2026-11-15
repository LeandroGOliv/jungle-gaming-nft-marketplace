import { Suspense, lazy } from 'react'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { z } from 'zod'
import { AuthDialog } from '@/components/auth/auth-dialog'
import { AppShell } from '@/components/layout/app-shell'
import { NotFoundPage } from '@/components/layout/not-found-page'
import { RealtimeProvider } from '@/components/layout/realtime-provider'
import { AUTH_MODES, AUTH_REASONS } from '@/utils/auth-location'
import { safeRedirect } from '@/utils/redirect'
import type { RouterContext } from '@/router'

import '../styles.css'

const Devtools = import.meta.env.DEV
  ? lazy(() => import('@/components/devtools'))
  : null

/**
 * Login e cadastro abrem como modal sobre qualquer tela, pela URL: o acesso
 * direto e o refresh mantêm o modal e a tela de fundo.
 */
const authSearchSchema = z.object({
  auth: z.enum(AUTH_MODES).optional().catch(undefined),
  motivo: z.enum(AUTH_REASONS).optional().catch(undefined),
  // Só caminhos internos: um `redirect` externo viraria um open redirect.
  redirect: z
    .string()
    .transform((value) => safeRedirect(value, window.location.origin))
    .optional()
    .catch(undefined),
})

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: authSearchSchema,
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

function RootComponent() {
  return (
    <RealtimeProvider>
      <AppShell>
        <Outlet />
        <AuthDialog />
      </AppShell>
      {Devtools && (
        <Suspense fallback={null}>
          <Devtools />
        </Suspense>
      )}
    </RealtimeProvider>
  )
}
