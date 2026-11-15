import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'

interface CartIndicatorProps {
  /** Quantidade de itens; sem valor, o badge não aparece. */
  count?: number
  /** Contagem ainda carregando: mostra o badge em skeleton. */
  isPending?: boolean
}

function describeCart(count: number | undefined) {
  if (count === undefined) return 'Carrinho'
  return `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`
}

/** Ícone do carrinho no header; a contagem vem da consulta do carrinho. */
export function CartIndicator({
  count,
  isPending = false,
}: CartIndicatorProps) {
  return (
    <Link
      to="/carrinho"
      aria-label={describeCart(isPending ? undefined : count)}
      className="focus-ring relative grid size-6 shrink-0 rounded-sm"
    >
      <img src="/icons/cart.svg" alt="" width={24} height={24} />
      {isPending ? (
        <Skeleton className="absolute -top-0.5 left-[13px] size-5 rounded-full" />
      ) : count !== undefined && count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute top-0 left-[15px] grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-none font-medium text-ink ring-2 ring-ink"
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  )
}
