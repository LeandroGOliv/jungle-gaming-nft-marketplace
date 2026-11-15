import { NftShelf } from '@/components/catalog/nft-shelf'
import { useRelatedNfts } from '@/hooks/use-nfts'

/** "Mais desta coleção" do detalhe. */
export function RelatedNfts({ nftId }: { nftId: string }) {
  const related = useRelatedNfts(nftId)

  return (
    <NftShelf
      title="Mais desta coleção"
      query={related}
      listLabel="NFTs da mesma coleção"
      errorTitle="Não foi possível carregar esta coleção"
      emptyTitle="Nenhum outro NFT nesta coleção"
      emptyText="Este é o único NFT da coleção à venda no momento."
    />
  )
}
