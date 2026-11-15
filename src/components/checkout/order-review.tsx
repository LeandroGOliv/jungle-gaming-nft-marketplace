import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Cart, CartQuote, QuoteIssue } from '@/types/cart'
import { formatEth } from '@/utils/eth'

interface OrderItemsProps {
  cart: Cart
  issues: Array<QuoteIssue>
}

/** Linhas de "Seus NFTs": 405 × 70, arte 70, nome, token, quantidade e total. */
export function OrderItems({ cart, issues }: OrderItemsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div
        aria-hidden="true"
        className="flex justify-between text-base leading-4 text-foreground"
      >
        <span className="font-bold">NFTs</span>
        <span className="font-medium">Subtotal</span>
      </div>
      <hr className="border-primary/30" />
      <ul aria-label="Itens do pedido" className="flex flex-col gap-3">
        {cart.items.map((line) => {
          const issue = issues.find(
            (i) => i.nftId === line.nftId && i.editionId === line.editionId,
          )
          return (
            <li
              key={`${line.nftId}:${line.editionId}`}
              className="flex min-h-[70px] items-center gap-2 bg-card py-1 pr-4 pl-1"
            >
              <img
                src={line.image.smallUrl}
                alt=""
                width={66}
                height={66}
                className="size-[66px] shrink-0 rounded-[8px] object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="truncate text-base leading-4 font-bold text-foreground">
                  {line.name}
                </p>
                <p className="text-sm leading-4 text-brand-secondary">
                  ID do token: {line.tokenId}
                  <span className="sr-only">, edição {line.editionLabel}</span>
                </p>
                {issue && (
                  <p className="text-[13px] leading-4 text-text-coral">
                    {issue.available === 0
                      ? 'Edição esgotada.'
                      : `Só ${issue.available === 1 ? 'resta 1 unidade' : `restam ${issue.available} unidades`}.`}
                  </p>
                )}
              </div>
              <p className="shrink-0 text-sm leading-4 text-text-secondary">
                <span className="sr-only">Quantidade: </span>(x {line.quantity})
              </p>
              <p className="w-[92px] shrink-0 text-right text-lg leading-4 font-bold text-text-accent">
                <span className="sr-only">Subtotal: </span>
                {formatEth(line.lineTotalEth)}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

interface OrderTotalsProps {
  quote: CartQuote
  refreshing: boolean
}

/** Totais do Figma; todo número é da cotação da API. */
export function OrderTotals({ quote, refreshing }: OrderTotalsProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 transition-opacity motion-reduce:transition-none',
        refreshing && 'opacity-60',
      )}
    >
      <p className="text-center text-sm leading-4 text-foreground">
        Tem um código promocional?{' '}
        <Link
          to="/carrinho"
          className="focus-ring rounded-sm text-text-accent hover:underline"
        >
          Aplique aqui
        </Link>
      </p>
      {quote.coupon && (
        <p
          className={cn(
            'text-center text-[13px] leading-4',
            quote.coupon.status === 'applied'
              ? 'text-text-secondary'
              : 'text-text-coral',
          )}
        >
          <span className="font-bold">{quote.coupon.code}</span>:{' '}
          {quote.coupon.message}
        </p>
      )}
      <dl className="flex flex-col gap-3 text-[15px] text-foreground">
        <div className="flex items-center justify-between gap-4">
          <dt className="leading-5">Subtotal</dt>
          <dd className="text-lg leading-4">{formatEth(quote.subtotalEth)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="leading-5">Desconto do lançamento</dt>
          <dd className="leading-5">(-) {formatEth(quote.discountEth)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="leading-5">Taxa de rede</dt>
          <dd className="text-lg leading-4">
            {formatEth(quote.networkFeeEth)}
          </dd>
        </div>
      </dl>
      <p className="text-center text-xs leading-4 text-text-accent">
        Taxa estimada
      </p>
      <hr className="border-primary/30" />
      <dl className="text-foreground">
        <div className="flex items-center justify-between gap-4 px-[42px]">
          <dt className="text-base leading-4 font-bold">Total</dt>
          <dd className="text-lg leading-4 font-bold text-text-accent">
            {formatEth(quote.totalEth)}
          </dd>
        </div>
      </dl>
      {refreshing && (
        <p
          aria-hidden="true"
          className="text-right text-xs leading-4 text-text-secondary"
        >
          Atualizando valores…
        </p>
      )}
    </div>
  )
}

/** Mesmas alturas dos totais, para os valores entrarem sem deslocar a tela. */
export function OrderTotalsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Calculando valores"
      className="flex flex-col gap-3"
    >
      <Skeleton className="mx-auto h-4 w-64" />
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex h-5 items-center justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
      <Skeleton className="mx-auto h-4 w-24" />
      <div className="flex h-4 items-center justify-between px-[42px]">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  )
}
