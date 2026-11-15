import { PageContainer } from '@/components/layout/page-container'
import { Skeleton } from '@/components/ui/skeleton'

/** Mesmas dimensões do detalhe carregado, para o layout não saltar. */
export function NftDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      data-testid="nft-detail-loading"
      className="pb-[188px] md:pb-24"
    >
      <p className="sr-only" role="status">
        Carregando NFT…
      </p>

      <div className="md:hidden">
        <div className="flex flex-col gap-2 bg-[linear-gradient(137deg,var(--surface-card)_0%,#2f1d15_100%)] px-7 pt-[23px] pb-[84px]">
          <div className="flex justify-between">
            <Skeleton className="size-[35px] rounded-full" />
            <Skeleton className="size-[35px] rounded-full" />
          </div>
          <Skeleton className="aspect-[361/356] w-full rounded-3xl" />
        </div>
        <div className="relative z-10 -mt-[114px] flex flex-col gap-3 rounded-t-[31px] bg-card px-6 pt-8 pb-6">
          <div className="flex justify-between">
            <Skeleton className="h-[27px] w-48" />
            <Skeleton className="h-[27px] w-20 rounded-full" />
          </div>
          <Skeleton className="h-[72px] w-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-7 w-56 rounded-full" />
          <Skeleton className="h-[84px] w-3/4" />
        </div>
      </div>

      <PageContainer className="flex flex-col gap-12 pt-10 md:gap-24 md:pt-8">
        <div className="flex flex-col gap-3 max-md:hidden">
          <Skeleton className="h-4 w-36" />
          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="flex gap-4 lg:w-[573px] lg:shrink-0 lg:gap-7">
              <div className="flex w-[100px] shrink-0 flex-col gap-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="size-[100px] rounded-lg" />
                ))}
              </div>
              <Skeleton className="aspect-square min-w-0 flex-1 rounded-md lg:size-[444px] lg:flex-none" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <Skeleton className="h-[37px] w-2/3" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-[94px] w-full" />
              <Skeleton className="h-[56px] w-52" />
              <Skeleton className="h-[50px] w-full" />
              <Skeleton className="h-[114px] w-1/2" />
            </div>
          </div>
        </div>
        {/* Descrição e relacionados: reservam a altura final, senão o footer salta. */}
        <Skeleton className="h-[727px] w-full rounded-lg md:h-[439px] lg:h-[343px]" />
        <Skeleton className="h-[372px] w-full rounded-lg lg:h-[362px]" />
      </PageContainer>
    </div>
  )
}
