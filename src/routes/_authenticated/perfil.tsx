import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/layout/page-container'
import { StateMessage } from '@/components/layout/state-message'

// Rota reservada para os links do layout; a tela entra na etapa própria.
export const Route = createFileRoute('/_authenticated/perfil')({
  component: Page,
})

function Page() {
  return (
    <PageContainer className="pt-8 md:pt-12">
      <StateMessage title="Perfil do colecionador" headingLevel={1}>
        <p>Esta tela ainda está em construção.</p>
      </StateMessage>
    </PageContainer>
  )
}
