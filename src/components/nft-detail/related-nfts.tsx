import { Link } from '@tanstack/react-router'
import { StateMessage } from '@/components/layout/state-message'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRelatedNfts } from '@/hooks/use-nfts'
import type { Nft } from '@/types/nft'
import { formatEth } from '@/utils/eth'

const list =
  'flex snap-x snap-mandatory gap-7 overflow-x-auto pb-2 [scrollbar-width:thin] lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0'
const item = 'w-[219px] shrink-0 snap-start lg:w-auto'

/** "Mais desta coleção": rolagem horizontal até `lg`; 5 colunas no desktop. */
export function RelatedNfts({ nftId }: { nftId: string }) {
  const related = useRelatedNfts(nftId)

  return (
    <section
      aria-labelledby="related-title"
      aria-busy={related.isFetching}
      className="flex flex-col gap-8"
    >
      <h2
        id="related-title"
        className="border-b border-primary/30 pb-3 text-[17px] leading-4 font-bold text-text-accent"
      >
        Mais desta coleção
      </h2>

      {related.isPending ? (
        <ul aria-label="Carregando NFTs da coleção" className={list}>
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className={item}>
              <Skeleton className="aspect-[219/255] rounded-none" />
              <Skeleton className="mt-3 h-5 w-4/5" />
              <Skeleton className="mt-1 h-4 w-1/3" />
            </li>
          ))}
        </ul>
      ) : related.isError ? (
        <StateMessage title="Não foi possível carregar esta coleção">
          <p>Verifique sua conexão e tente novamente.</p>
          <div className="mt-6">
            <Button onClick={() => void related.refetch()}>
              Tentar novamente
            </Button>
          </div>
        </StateMessage>
      ) : related.data.items.length === 0 ? (
        <StateMessage title="Nenhum outro NFT nesta coleção">
          <p>Este é o único NFT da coleção à venda no momento.</p>
        </StateMessage>
      ) : (
        <ul aria-label="NFTs da mesma coleção" className={list}>
          {related.data.items.map((nft) => (
            <li key={nft.id} className={item}>
              <RelatedCard nft={nft} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function RelatedCard({ nft }: { nft: Nft }) {
  const image = nft.images[0]
  return (
    <article className="group relative flex flex-col gap-3">
      <div className="flex aspect-[219/255] items-center justify-center bg-card px-1">
        <img
          src={image.smallUrl}
          alt={image.alt}
          width={400}
          height={400}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full rounded-[13px] object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
        />
      </div>
      <div className="flex flex-col">
        <h3 className="text-[15px] leading-5 text-cream">
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            className="focus-ring rounded-sm after:absolute after:inset-0 after:content-['']"
          >
            {nft.name}
          </Link>
        </h3>
        <p className="text-base leading-4 font-bold text-text-accent">
          <span className="sr-only">Preço: </span>
          {formatEth(nft.priceEth)}
        </p>
      </div>
    </article>
  )
}
