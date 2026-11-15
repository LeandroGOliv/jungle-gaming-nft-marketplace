import { Link, createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PageContainer } from '@/components/layout/page-container'
import { StateMessage } from '@/components/layout/state-message'
import {
  OUT_OF_SCOPE_SECTIONS,
  OUT_OF_SCOPE_SECTION_IDS,
} from '@/components/layout/out-of-scope'
import { Button } from '@/components/ui/button'

const searchSchema = z.object({
  secao: z.enum(OUT_OF_SCOPE_SECTION_IDS).optional().catch(undefined),
})

export const Route = createFileRoute('/_public/em-breve')({
  validateSearch: searchSchema,
  component: ComingSoonPage,
})

function ComingSoonPage() {
  const { secao } = Route.useSearch()
  const section = secao ? OUT_OF_SCOPE_SECTIONS[secao] : 'Esta seção'

  return (
    <PageContainer className="pt-8 md:pt-12">
      <StateMessage
        eyebrow="Em breve"
        title={`${section} não faz parte desta demonstração`}
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
          O marketplace de demonstração cobre catálogo, detalhe do NFT,
          carrinho, pagamento e conta do colecionador. Nenhuma ação foi
          executada.
        </p>
      </StateMessage>
    </PageContainer>
  )
}
