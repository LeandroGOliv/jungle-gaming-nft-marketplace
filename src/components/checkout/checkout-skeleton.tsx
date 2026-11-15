import { Skeleton } from '@/components/ui/skeleton'

/** Mesma grade do pagamento (763 + 405 no desktop, coluna no mobile). */
export function CheckoutSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando o pagamento"
      className="flex flex-col gap-8 lg:flex-row lg:gap-8"
    >
      <div className="flex flex-col gap-4 lg:w-[763px]">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-[93px] rounded-[14px] md:hidden" />
        <Skeleton className="h-[93px] rounded-[14px] md:hidden" />
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 max-md:hidden md:grid-cols-2">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-[15px] w-36" />
              <Skeleton className="h-10 rounded-[3px]" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 lg:w-[405px]">
        <Skeleton className="h-4 w-28 max-md:hidden" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[70px] rounded-none max-md:hidden" />
        ))}
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={i}
            className="h-[65px] rounded-[15px] md:h-[45px] md:rounded-[3px]"
          />
        ))}
        <Skeleton className="h-[60px] rounded-[40px] md:h-[45px] md:rounded-[8px]" />
      </div>
    </div>
  )
}
