import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PageContainer } from '@/components/layout/page-container'
import { StateMessage } from '@/components/layout/state-message'
import { safeRedirect } from '@/utils/redirect'

// Só caminhos internos: um `redirect` externo viraria um open redirect.
const loginSearchSchema = z.object({
  redirect: z
    .string()
    .transform((value) => safeRedirect(value, window.location.origin))
    .optional()
    .catch(undefined),
})

// Rota reservada para os links do layout; a tela entra na etapa própria.
export const Route = createFileRoute('/_unauthenticated/login')({
  validateSearch: loginSearchSchema,
  component: Page,
})

function Page() {
  return (
    <PageContainer className="pt-8 md:pt-12">
      <StateMessage title="Entrar" headingLevel={1}>
        <p>Esta tela ainda está em construção.</p>
      </StateMessage>
    </PageContainer>
  )
}
