import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import {
  adoptExternalSession,
  endSession,
  sessionUserId,
} from '@/hooks/use-session'
import { env } from '@/lib/env'
import { setUnauthorizedHandler } from '@/lib/http'
import { createQueryClient } from '@/lib/query-client'
import { redirectOwner } from '@/lib/redirect-owner'
import { sessionToken } from '@/lib/session'
import {
  authReasonFor,
  withAuthParams,
  withoutAuthParams,
} from '@/utils/auth-location'
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
  // Quem estava na tela quando a sessão caiu: o retorno após o login só leva
  // de volta o mesmo usuário.
  function rememberOwner(token: string | null) {
    const userId = sessionUserId(queryClient, token)
    if (userId) {
      redirectOwner.remember(
        withoutAuthParams(router.latestLocation.href),
        userId,
      )
    }
  }

  setUnauthorizedHandler((error, token) => {
    rememberOwner(token)
    endSession(queryClient, token)
    void router.navigate({
      href: withAuthParams(router.latestLocation.href, {
        auth: 'entrar',
        motivo: authReasonFor(error?.reason),
      }),
      replace: true,
    })
  })

  // Outra aba entrou, saiu ou trocou de usuário: esta descarta os dados da
  // sessão anterior e revalida a rota, cujo guarda pede login se preciso.
  let previousToken = sessionToken.get()
  sessionToken.subscribe(({ external }) => {
    const token = sessionToken.get()
    const previous = previousToken
    previousToken = token
    if (!external || token === previous) return
    // Só quando a outra aba saiu: o login que vier depois decide o retorno.
    // Numa troca direta de usuário não há login nesta aba para consumir o registro.
    if (!token) rememberOwner(previous)
    adoptExternalSession(queryClient)
    void router.invalidate()
  })

  ReactDOM.createRoot(document.getElementById('app')!).render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

void bootstrap()
