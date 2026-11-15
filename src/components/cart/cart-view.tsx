import { Link, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { NftShelf } from '@/components/catalog/nft-shelf'
import { MaskIcon } from '@/components/layout/mask-icon'
import { PageContainer } from '@/components/layout/page-container'
import { StateMessage } from '@/components/layout/state-message'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCart, useCartQuote } from '@/hooks/use-cart'
import { nftListQueryOptions } from '@/hooks/use-nfts'
import { describeRequestError } from '@/lib/http-error'
import { cn } from '@/lib/utils'
import { CART_COLUMNS, CartLine } from './cart-line'
import { CartSummary } from './cart-summary'

export function CartView() {
  const cart = useCart()
  const quote = useCartQuote(cart.data, cart.owner)
  const issues = quote.data?.issues ?? []

  return (
    <div className="pb-16 md:pb-24">
      <PageContainer className="flex flex-col gap-3 px-7 pt-8 md:px-6 md:pt-8">
        <MobileHeader />
        <Breadcrumb />

        {cart.isPending ? (
          <CartSkeleton />
        ) : cart.isError && !cart.data ? (
          <StateMessage title="Não foi possível carregar o carrinho">
            <p>{describeRequestError(cart.error)}</p>
            <div className="mt-6">
              <Button onClick={() => void cart.refetch()}>
                Tentar novamente
              </Button>
            </div>
          </StateMessage>
        ) : cart.data.items.length === 0 ? (
          <StateMessage title="Seu carrinho está vazio" className="mt-3">
            <p>Explore o mercado e adicione NFTs para vê-los aqui.</p>
            <div className="mt-6">
              <Button asChild className="h-10 px-5 font-bold text-ink">
                <Link to="/" hash="catalogo">
                  Explorar o mercado
                </Link>
              </Button>
            </div>
          </StateMessage>
        ) : (
          <div
            aria-busy={cart.isFetching}
            className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12"
          >
            <section
              aria-label="Itens do carrinho"
              className="flex min-w-0 flex-col gap-3 lg:max-w-[782px] lg:flex-1"
            >
              <TableHeader />
              <ul className="flex flex-col gap-5 md:gap-3">
                {cart.data.items.map((line) => (
                  <CartLine
                    key={`${line.nftId}:${line.editionId}`}
                    line={line}
                    issue={issues.find(
                      (i) =>
                        i.nftId === line.nftId &&
                        i.editionId === line.editionId,
                    )}
                  />
                ))}
              </ul>
            </section>
            <CartSummary
              quote={quote}
              cartVersion={cart.data.version}
              // Mobile: painel fixo no rodapé, como no Figma; com pouca altura
              // (zoom, paisagem) volta ao fluxo para não cobrir os itens.
              className="-mx-7 max-md:sticky max-md:bottom-0 max-md:z-10 max-md:shadow-[0_-10px_20px_rgb(10_6_4/0.45)] md:mx-0 lg:w-[332px] lg:shrink-0 [@media(max-height:640px)]:static"
            />
          </div>
        )}
      </PageContainer>

      <PageContainer className="mt-24 max-md:hidden">
        <AlsoViewed />
      </PageContainer>
    </div>
  )
}

function MobileHeader() {
  const router = useRouter()
  const goBack = () => {
    if (router.history.canGoBack()) router.history.back()
    else void router.navigate({ to: '/' })
  }
  return (
    <div className="relative flex h-11 items-start md:hidden">
      <button
        type="button"
        onClick={goBack}
        aria-label="Voltar"
        className="focus-ring flex size-[35px] cursor-pointer items-center justify-center rounded-full border border-border bg-[#2f1d15] text-text-secondary"
      >
        <MaskIcon src="/icons/detail-arrow-left.svg" width={8} height={14} />
      </button>
      <h1 className="absolute inset-x-12 top-[9px] text-center text-xl leading-4 font-bold text-foreground">
        Carrinho de NFTs
      </h1>
    </div>
  )
}

function Breadcrumb() {
  return (
    <nav aria-label="Trilha de navegação" className="max-md:hidden">
      <h1 className="sr-only">Carrinho de NFTs</h1>
      <ol className="flex gap-2 text-[15px] leading-4 font-bold text-foreground">
        <li>
          <Link to="/" className="focus-ring rounded-sm hover:text-text-accent">
            Início
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link
            to="/"
            hash="catalogo"
            className="focus-ring rounded-sm hover:text-text-accent"
          >
            Mercado
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">Carrinho</li>
      </ol>
    </nav>
  )
}

/** Cabeçalho visual da tabela; cada célula das linhas leva o próprio rótulo para leitores de tela. */
function TableHeader() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 max-md:hidden">
      <div
        className={cn(
          'grid pr-6 text-base leading-4 text-foreground',
          CART_COLUMNS,
        )}
      >
        <span className="font-bold">NFTs</span>
        <span className="font-medium">Preço</span>
        <span className="font-bold">Edições</span>
        <span className="font-medium">Total</span>
      </div>
      <hr className="border-primary/30" />
    </div>
  )
}

function CartSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando o carrinho"
      className="flex flex-col gap-8 lg:flex-row lg:justify-between lg:gap-12"
    >
      <div className="flex flex-col gap-3 lg:max-w-[782px] lg:flex-1">
        <Skeleton className="h-[28px] max-md:hidden" />
        <div className="flex flex-col gap-5 md:gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton
              key={i}
              className="h-[100px] rounded-[14px] md:h-[70px] md:rounded-none"
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-6 lg:w-[332px]">
        <Skeleton className="h-7 max-md:hidden" />
        <Skeleton className="h-[50px] rounded-[40px] md:h-16 md:rounded-[3px]" />
        <Skeleton className="h-[136px]" />
        <Skeleton className="h-[60px] rounded-[40px] md:h-10 md:rounded-[3px]" />
      </div>
    </div>
  )
}

/** "Colecionadores também viram": os NFTs em alta do catálogo. */
function AlsoViewed() {
  const trending = useQuery(
    nftListQueryOptions({
      tab: 'trending',
      sort: 'recent',
      page: 1,
      pageSize: 5,
    }),
  )
  return (
    <NftShelf
      title="Colecionadores também viram"
      query={trending}
      listLabel="NFTs em alta"
      errorTitle="Não foi possível carregar as sugestões"
      emptyTitle="Nenhuma sugestão no momento"
      emptyText="Volte mais tarde para ver o que outros colecionadores estão olhando."
    />
  )
}
