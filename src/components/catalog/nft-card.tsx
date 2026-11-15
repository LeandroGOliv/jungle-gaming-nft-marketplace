import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Nft } from '@/types/nft'
import { formatEth } from '@/utils/eth'
import { RARITY_LABELS } from './labels'

/**
 * Card da grade. Abaixo de `md` segue o card mobile (fundo em gradiente,
 * raio 20, selo de raridade); a partir dele, o card desktop (258 × 356).
 */
export function NftCard({ nft, eager = false }: { nft: Nft; eager?: boolean }) {
  const image = nft.images[0]
  const rarity = RARITY_LABELS[nft.rarity]

  return (
    <article className="group relative flex flex-col gap-2 md:gap-3">
      <div className="relative flex aspect-[175/200] items-center justify-center overflow-hidden rounded-[20px] bg-[linear-gradient(137deg,var(--surface-card)_0%,#2f1d15_100%)] md:aspect-[258/300] md:rounded-none md:bg-card md:bg-none">
        <img
          src={image.smallUrl}
          alt={image.alt}
          width={400}
          height={400}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="aspect-square w-[96%] rounded-2xl object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none md:w-[96.9%] md:rounded-[15px]"
        />
        {rarity && (
          <span className="absolute top-4 left-0 min-w-[68px] bg-primary py-2 pr-2 pl-2 text-[13px] leading-4 font-medium text-ink uppercase md:hidden">
            {rarity}
          </span>
        )}
      </div>
      <div className="flex flex-col pl-2 md:gap-3 md:pl-0">
        <h3 className="text-[15px] leading-5 text-foreground md:text-base md:leading-4">
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            className="focus-ring rounded-sm after:absolute after:inset-0 after:content-['']"
          >
            {nft.name}
          </Link>
        </h3>
        <p className="text-base leading-4 font-bold text-text-accent md:text-lg">
          <span className="sr-only">Preço: </span>
          {formatEth(nft.priceEth)}
        </p>
      </div>
    </article>
  )
}

/** Mesmas proporções do card, para a grade não mudar de altura ao carregar. */
export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 md:gap-3">
      <Skeleton className="aspect-[175/200] rounded-[20px] md:aspect-[258/300] md:rounded-none" />
      <div className="flex flex-col gap-1 pl-2 md:gap-3 md:pl-0">
        <Skeleton className="h-5 w-4/5 md:h-4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}

/**
 * 2 colunas defasadas no mobile (a direita desce 32 px, como no Figma) e
 * 3 colunas a partir de `md`, com 72 px entre as linhas no desktop.
 */
export function NftGrid({
  children,
  className,
  ...props
}: React.ComponentProps<'ul'>) {
  return (
    <ul
      className={cn(
        'grid grid-cols-2 gap-x-4 gap-y-6 pb-8 max-md:[&>li:nth-child(even)]:translate-y-8 md:grid-cols-3 md:gap-x-[34px] md:gap-y-12 md:pb-0 lg:gap-y-[72px]',
        className,
      )}
      {...props}
    >
      {children}
    </ul>
  )
}
