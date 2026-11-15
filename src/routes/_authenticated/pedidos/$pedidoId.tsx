import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/layout/page-container'
import { StateMessage } from '@/components/layout/state-message'

// Rota reservada e já protegida pela sessão; o recibo entra na etapa própria.
export const Route = createFileRoute('/_authenticated/pedidos/$pedidoId')({
  staticData: { navSection: 'market' },
  component: Page,
})

function Page() {
  return (
    <PageContainer className="pt-8 md:pt-12">
      <StateMessage title="Confirmação de pedido" headingLevel={1}>
        <p>Esta tela ainda está em construção.</p>
      </StateMessage>
    </PageContainer>
  )
}
