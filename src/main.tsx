import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { endSession } from '@/hooks/use-session'
import { env } from '@/lib/env'
import { setUnauthorizedHandler } from '@/lib/http'
import { createQueryClient } from '@/lib/query-client'
import { authReasonFor, withAuthParams } from '@/utils/auth-location'
import { getRouter } from './router'

async function bootstrap() {
  if (env.enableMocks) {
    const { enableMocking } = await import('./mocks/browser')
    await enableMocking()
  }

  const queryClient = createQueryClient()
  const router = getRouter({ queryClient })

  // Sessão recusada pela API: limpa os dados privados e abre o login sobre o
  // endereço mais recente (o de uma navegação em curso, se houver). Numa rota
  // privada, o guarda leva à Início guardando esse endereço para a volta.
  setUnauthorizedHandler((error) => {
    endSession(queryClient)
    void router.navigate({
      href: withAuthParams(router.latestLocation.href, {
        auth: 'entrar',
        motivo: authReasonFor(error?.reason),
      }),
      replace: true,
    })
  })

  ReactDOM.createRoot(document.getElementById('app')!).render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

void bootstrap()
