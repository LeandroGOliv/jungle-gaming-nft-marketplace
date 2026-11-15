import { Suspense, lazy } from 'react'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { NotFoundPage } from '@/components/layout/not-found-page'
import type { RouterContext } from '@/router'

import '../styles.css'

const Devtools = import.meta.env.DEV
  ? lazy(() => import('@/components/devtools'))
  : null

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

function RootComponent() {
  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>
      {Devtools && (
        <Suspense fallback={null}>
          <Devtools />
        </Suspense>
      )}
    </>
  )
}
