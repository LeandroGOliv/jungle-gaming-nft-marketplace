import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { PageContainer } from '@/components/layout/page-container'
import { StateMessage } from '@/components/layout/state-message'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { sessionQueryOptions } from '@/hooks/use-session'
import { describeRequestError, isUnauthorized } from '@/lib/http-error'
import { sessionToken } from '@/lib/session'
import { withoutAuthParams } from '@/utils/auth-location'
import type { ErrorComponentProps } from '@tanstack/react-router'

/**
 * Telas que exigem sessão: checkout, pedidos, perfil, carteiras. Sem sessão
 * válida, o colecionador vai ao login sobre a Início e volta ao destino.
 */
export const Route = createFileRoute('/_authenticated')({
  staticData: { navSection: 'home' },
  beforeLoad: async ({ context, location, search }) => {
    const token = sessionToken.get()
    const session = token
      ? await context.queryClient
          .ensureQueryData({
            ...sessionQueryOptions(token),
            // A sessão em cache libera a navegação na hora; a revalidação em
            // segundo plano (sempre, por isso `staleTime` 0) detecta a
            // expiração e o 401 leva ao login.
            revalidateIfStale: true,
            staleTime: 0,
            // Sem cache, a tela espera esta resposta: uma repetição basta antes
            // de mostrar o erro com "Tentar novamente".
            retry: 1,
          })
          .catch((error: unknown) => {
            if (isUnauthorized(error)) return null
            throw error
          })
      : null

    if (!session) {
      throw redirect({
        to: '/',
        search: {
          auth: 'entrar',
          motivo: search.motivo,
          redirect: withoutAuthParams(location.href),
        },
        replace: true,
      })
    }
  },
  pendingComponent: SessionCheckPending,
  errorComponent: SessionCheckError,
})

/** Verificação da sessão no acesso direto: skeleton no lugar do conteúdo. */
function SessionCheckPending() {
  return (
    <PageContainer className="pt-8 md:pt-12" aria-busy="true">
      <p className="sr-only">Verificando sua sessão…</p>
      <Skeleton className="h-[260px] w-full rounded-[10px]" />
    </PageContainer>
  )
}

/** A sessão não pôde ser verificada (rede, timeout, 5xx): oferece nova tentativa. */
function SessionCheckError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <PageContainer className="pt-8 md:pt-12">
      <StateMessage
        title="Não foi possível verificar sua sessão"
        headingLevel={1}
        actions={
          <Button
            className="h-10 rounded-md px-6 text-base font-medium"
            onClick={() => {
              reset()
              void router.invalidate()
            }}
          >
            Tentar novamente
          </Button>
        }
      >
        <p>{describeRequestError(error)}</p>
      </StateMessage>
    </PageContainer>
  )
}
