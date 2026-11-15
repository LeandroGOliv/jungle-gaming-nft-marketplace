import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/layout/page-container'
import { StateMessage } from '@/components/layout/state-message'
import { Button } from '@/components/ui/button'
import { useSession } from '@/hooks/use-session'
import { useSignOut } from '@/hooks/use-sign-out'

// Rota reservada: a tela de perfil entra na etapa própria. Até lá, mostra quem
// está conectado e o "Sair", que no mobile não tem outro lugar (sem header).
export const Route = createFileRoute('/_authenticated/perfil')({
  component: Page,
})

function Page() {
  const session = useSession()
  const { signOut, isPending } = useSignOut()

  return (
    <PageContainer className="pt-8 md:pt-12">
      <StateMessage
        title="Perfil do colecionador"
        headingLevel={1}
        actions={
          <Button
            type="button"
            className="h-10 rounded-md px-6 text-base font-medium"
            disabled={isPending}
            onClick={signOut}
          >
            Sair
          </Button>
        }
      >
        {session.status === 'authenticated' && (
          <p>
            Conectado como{' '}
            <strong className="text-foreground">
              {session.user.displayName}
            </strong>{' '}
            ({session.user.email}).
          </p>
        )}
        <p>Esta tela ainda está em construção.</p>
      </StateMessage>
    </PageContainer>
  )
}
