import { StateMessage } from '@/components/layout/state-message'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useWallets } from '@/hooks/use-wallets'
import { describeRequestError } from '@/lib/http-error'
import { AccountLayout } from './account-layout'
import { WalletSection } from './wallet-section'

export function WalletsView() {
  const wallets = useWallets()
  const { userId } = wallets

  return (
    <AccountLayout active="carteiras" title="Carteiras">
      {wallets.isPending || !userId ? (
        <WalletsSkeleton />
      ) : wallets.isError && !wallets.data ? (
        <StateMessage title="Não foi possível carregar suas carteiras">
          <p>{describeRequestError(wallets.error)}</p>
          <div className="mt-6">
            <Button onClick={() => void wallets.refetch()}>
              Tentar novamente
            </Button>
          </div>
        </StateMessage>
      ) : (
        <div
          aria-busy={wallets.isFetching}
          className="flex flex-col gap-8 md:gap-12"
        >
          {(['primary', 'secondary'] as const).map((slot) => {
            const wallet = wallets.data.wallets.find((w) => w.slot === slot)
            return (
              <WalletSection
                // Outra carteira (ou o cadastro recém-feito) recomeça o formulário.
                key={`${slot}:${wallet?.id ?? 'nova'}`}
                slot={slot}
                wallet={wallet}
                userId={userId}
              />
            )
          })}
        </div>
      )}
    </AccountLayout>
  )
}

/** Mesma geometria das seções: título, descrição e o bloco de resumo. */
function WalletsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-8 md:gap-12">
      <p className="sr-only">Carregando suas carteiras…</p>
      {[0, 1].map((index) => (
        <div key={index} className="flex flex-col gap-8">
          <div className="flex flex-col gap-2 md:gap-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-48 rounded-[3px]" />
              <Skeleton className="h-4 w-20 rounded-[3px]" />
            </div>
            <Skeleton className="h-[15px] w-full max-w-[648px] rounded-[3px]" />
          </div>
          <Skeleton className="h-[220px] w-full rounded-[3px] sm:h-[150px] md:h-[162px]" />
        </div>
      ))}
    </div>
  )
}
