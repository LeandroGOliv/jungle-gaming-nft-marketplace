import { Link, useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { PageContainer } from './page-container'
import { StateMessage } from './state-message'

export function NotFoundPage() {
  const pathname = useLocation({ select: (location) => location.pathname })

  return (
    <PageContainer className="pt-8 md:pt-12">
      <StateMessage
        eyebrow="404"
        title="Página não encontrada"
        headingLevel={1}
        actions={
          <Button
            asChild
            className="h-10 rounded-md px-6 text-base font-medium"
          >
            <Link to="/">Voltar ao início</Link>
          </Button>
        }
      >
        <p>
          O endereço{' '}
          <code className="break-all text-foreground">{pathname}</code> não
          existe no marketplace. Confira o link ou continue explorando a partir
          da página inicial.
        </p>
      </StateMessage>
    </PageContainer>
  )
}
