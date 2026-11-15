import { Link, createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/layout/page-container'
import { StateMessage } from '@/components/layout/state-message'
import { NftDetailSkeleton } from '@/components/nft-detail/nft-detail-skeleton'
import { NftDetailView } from '@/components/nft-detail/nft-detail-view'
import { Button } from '@/components/ui/button'
import { useNft } from '@/hooks/use-nfts'
import { getApiError } from '@/lib/http-error'

export const Route = createFileRoute('/_public/nft/$nftId')({
  staticData: {
    navSection: 'market',
    headerDivider: false,
    mobileTabBar: false,
  },
  component: NftDetailPage,
})

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const nft = useNft(nftId)

  if (nft.isPending) return <NftDetailSkeleton />

  if (nft.isError && !nft.data) {
    const notFound = getApiError(nft.error)?.status === 404
    return (
      <PageContainer className="pt-8 pb-16 md:pt-12 md:pb-24">
        {notFound ? (
          <StateMessage
            eyebrow="404"
            title="NFT não encontrado"
            headingLevel={1}
            actions={
              <Button asChild>
                <Link to="/" hash="catalogo">
                  Voltar ao catálogo
                </Link>
              </Button>
            }
          >
            <p>Este NFT não existe ou foi removido do mercado.</p>
          </StateMessage>
        ) : (
          <StateMessage
            title="Não foi possível carregar este NFT"
            headingLevel={1}
            actions={
              <Button onClick={() => void nft.refetch()}>
                Tentar novamente
              </Button>
            }
          >
            <p>Verifique sua conexão e tente novamente.</p>
          </StateMessage>
        )}
      </PageContainer>
    )
  }

  return (
    <div aria-busy={nft.isFetching}>
      {nft.isError && (
        <PageContainer className="pt-4">
          <p
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-lg bg-card px-4 py-3 text-sm text-text-secondary"
          >
            Não foi possível atualizar este NFT.
            <Button size="sm" onClick={() => void nft.refetch()}>
              Tentar novamente
            </Button>
          </p>
        </PageContainer>
      )}
      {/* A chave reinicia edição, quantidade e imagem ao trocar de NFT. */}
      <NftDetailView key={nft.data.id} nft={nft.data} />
    </div>
  )
}
