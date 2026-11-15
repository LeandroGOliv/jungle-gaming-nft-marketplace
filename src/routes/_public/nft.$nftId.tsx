import { Link, createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/layout/page-container'
import { StateMessage } from '@/components/layout/state-message'
import { Button } from '@/components/ui/button'

// Destino dos cards do catálogo. A tela de detalhe (galeria, edição,
// quantidade, favoritos) substitui este conteúdo na issue de Detalhes do NFT.
export const Route = createFileRoute('/_public/nft/$nftId')({
  component: NftDetailPage,
})

function NftDetailPage() {
  return (
    <PageContainer className="pt-8 md:pt-12">
      <StateMessage
        eyebrow="Em breve"
        title="Os detalhes do NFT ainda não estão disponíveis"
        headingLevel={1}
        actions={
          <Button asChild>
            <Link to="/" hash="catalogo">
              Voltar ao catálogo
            </Link>
          </Button>
        }
      />
    </PageContainer>
  )
}
