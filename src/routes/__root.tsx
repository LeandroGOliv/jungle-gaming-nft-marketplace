import { Suspense, lazy } from 'react'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { RouterContext } from '@/router'

import '../styles.css'

const Devtools = import.meta.env.DEV
  ? lazy(() => import('@/components/devtools'))
  : null

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <Outlet />
      {Devtools && (
        <Suspense fallback={null}>
          <Devtools />
        </Suspense>
      )}
    </>
  )
}
