import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useApplyCoupon, useRemoveCoupon } from '@/hooks/use-cart'
import { applyApiFieldErrors } from '@/lib/form-errors'
import { describeRequestError } from '@/lib/http-error'
import { cn } from '@/lib/utils'
import { couponSchema } from '@/schemas/cart'
import type { UseQueryResult } from '@tanstack/react-query'
import type { CouponValues } from '@/schemas/cart'
import type { CartQuote, QuoteCoupon } from '@/types/cart'
import { formatEth } from '@/utils/eth'

interface CartSummaryProps {
  quote: UseQueryResult<CartQuote>
  /** Versão do carrinho exibido: a cotação só vale se for desta versão. */
  cartVersion: number
  className?: string
}

/**
 * "Resumo da carteira": cupom, valores e o caminho para o pagamento. Todo
 * número vem da cotação da API; enquanto a cotação da versão atual não chega,
 * a anterior fica na tela marcada como em atualização e o checkout espera.
 */
export function CartSummary({
  quote,
  cartVersion,
  className,
}: CartSummaryProps) {
  const headingId = useId()
  const current = quote.data?.cartVersion === cartVersion
  const refreshing = quote.isFetching || (quote.data !== undefined && !current)
  const hasIssues = (quote.data?.issues.length ?? 0) > 0
  const canCheckout = quote.isSuccess && current && !refreshing && !hasIssues

  return (
    <section
      aria-labelledby={headingId}
      aria-busy={refreshing}
      className={cn(
        'flex flex-col gap-3 rounded-t-[40px] bg-card px-6 pt-6 pb-9 md:gap-6 md:rounded-none md:bg-transparent md:p-0',
        className,
      )}
    >
      <div className="flex flex-col gap-3 max-md:sr-only">
        <h2
          id={headingId}
          className="text-lg leading-4 font-bold text-foreground"
        >
          Resumo da carteira
        </h2>
        <hr className="border-primary/30" />
      </div>

      <CouponForm coupon={quote.data?.coupon ?? null} />

      {quote.isPending ? (
        <SummarySkeleton />
      ) : quote.isError && !quote.data ? (
        <div role="alert" className="flex flex-col items-start gap-3 py-2">
          <p className="text-sm leading-5 text-text-coral">
            Não foi possível calcular os valores.{' '}
            {describeRequestError(quote.error)}
          </p>
          <Button
            variant="outline"
            onClick={() => void quote.refetch()}
            className="h-9 px-4"
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <SummaryValues quote={quote.data} refreshing={refreshing} />
      )}

      <div className="mt-3 flex flex-col items-center gap-3 md:mt-0">
        {hasIssues && (
          <p className="text-center text-sm leading-5 text-text-coral">
            Ajuste os itens indicados para continuar.
          </p>
        )}
        {canCheckout ? (
          <Link to="/pagamento" className={checkoutClass}>
            Conectar e finalizar
          </Link>
        ) : (
          <button type="button" disabled className={checkoutClass}>
            Conectar e finalizar
          </button>
        )}
        <Link
          to="/"
          hash="catalogo"
          className="focus-ring rounded-sm text-[15px] text-text-accent hover:underline max-md:hidden"
        >
          Continuar explorando
        </Link>
      </div>
    </section>
  )
}

const checkoutClass =
  'focus-ring flex w-full cursor-pointer items-center justify-center font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50 h-[60px] rounded-[40px] bg-[linear-gradient(90deg,var(--brand-primary)_0%,rgb(210_138_76/0.8)_100%)] text-base leading-4 md:h-10 md:rounded-[3px] md:bg-primary md:bg-none md:text-[15px] hover:brightness-110'

function SummaryValues({
  quote,
  refreshing,
}: {
  quote: CartQuote
  refreshing: boolean
}) {
  const value = 'text-right text-base leading-4 md:text-lg'
  return (
    <div
      className={cn(
        'flex flex-col gap-3 transition-opacity motion-reduce:transition-none md:gap-6',
        refreshing && 'opacity-60',
      )}
    >
      <dl className="flex flex-col gap-3 text-[15px] text-foreground">
        <div className="flex items-start justify-between gap-4">
          <dt className="leading-5">Subtotal</dt>
          <dd className={value}>{formatEth(quote.subtotalEth)}</dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="leading-5">
            Desconto do lançamento
            {quote.coupon?.status === 'applied' && (
              <span className="sr-only"> ({quote.coupon.code})</span>
            )}
          </dt>
          <dd className="text-right leading-5">
            (-) {formatEth(quote.discountEth)}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="leading-5">Taxa de rede</dt>
          <dd className="flex flex-col items-end md:gap-3">
            <span className={cn(value, 'pt-0.5')}>
              {formatEth(quote.networkFeeEth)}
            </span>
            <span className="text-xs leading-4 text-text-accent">
              Taxa estimada
            </span>
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4 md:mt-3">
          <dt className="text-base leading-4 font-bold">Total</dt>
          <dd className="text-right text-lg leading-4 font-bold text-text-accent">
            {formatEth(quote.totalEth)}
          </dd>
        </div>
      </dl>
      <p aria-live="polite" className="sr-only">
        {refreshing ? 'Atualizando valores.' : ''}
      </p>
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

/** Mesmas linhas e alturas do resumo, para os valores entrarem sem deslocar a tela. */
function SummarySkeleton() {
  return (
    <div
      role="status"
      aria-label="Calculando valores"
      className="flex flex-col gap-3 md:gap-6"
    >
      <div className="flex flex-col gap-3">
        {[0, 1].map((row) => (
          <div key={row} className="flex h-5 items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
        <div className="flex flex-col items-end md:gap-3">
          <div className="flex h-5 w-full items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex h-4 items-center justify-between md:mt-3">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    </div>
  )
}

function CouponForm({ coupon }: { coupon: QuoteCoupon | null }) {
  const inputId = useId()
  const errorId = `${inputId}-erro`
  const statusId = `${inputId}-status`
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const form = useForm<CouponValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: { code: '' },
  })

  const onSubmit = form.handleSubmit((values) =>
    apply.mutateAsync(values.code).then(
      () => form.reset({ code: '' }),
      (error: unknown) => {
        if (!applyApiFieldErrors(error, ['code'], form.setError)) {
          form.setError(
            'code',
            { type: 'server', message: describeRequestError(error) },
            { shouldFocus: true },
          )
        }
      },
    ),
  )

  return (
    <div className="flex flex-col gap-2 md:gap-2">
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-2">
        <label
          htmlFor={inputId}
          className="text-sm leading-4 font-bold text-foreground max-md:sr-only"
        >
          Código promocional
        </label>
        <Controller
          control={form.control}
          name="code"
          render={({ field, fieldState }) => (
            <div
              className={cn(
                'flex h-[50px] items-center overflow-hidden rounded-[40px] border border-border bg-card pl-4 shadow-[0_6px_20px_rgb(10_6_4/0.45)] focus-within:border-primary md:h-10 md:rounded-[3px] md:border-primary md:bg-transparent md:pl-2 md:shadow-none',
                fieldState.error && 'border-text-coral md:border-text-coral',
              )}
            >
              <input
                {...field}
                id={inputId}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="Digite o código promocional..."
                aria-invalid={fieldState.error ? true : undefined}
                aria-describedby={
                  [fieldState.error && errorId, coupon && statusId]
                    .filter(Boolean)
                    .join(' ') || undefined
                }
                className="h-full min-w-0 flex-1 bg-transparent text-[13px] leading-[22px] text-foreground uppercase outline-none placeholder:text-brand-secondary placeholder:normal-case md:text-xs md:leading-4"
              />
              <button
                type="submit"
                disabled={apply.isPending}
                aria-busy={apply.isPending}
                className="focus-ring h-full w-[97px] shrink-0 cursor-pointer rounded-[40px] bg-[linear-gradient(90deg,rgb(210_138_76/0.54)_0%,var(--brand-primary)_100%)] text-[15px] leading-4 font-bold text-foreground disabled:cursor-progress disabled:opacity-70 md:w-[102px] md:rounded-none md:bg-primary md:bg-none md:text-ink"
              >
                Aplicar
              </button>
            </div>
          )}
        />
        {form.formState.errors.code && (
          <p
            id={errorId}
            role="alert"
            className="text-sm leading-5 text-text-coral"
          >
            {form.formState.errors.code.message}
          </p>
        )}
      </form>

      {coupon && (
        <div
          id={statusId}
          className="flex items-start justify-between gap-3 text-sm leading-5"
        >
          <p
            className={
              coupon.status === 'applied'
                ? 'text-text-secondary'
                : 'text-text-coral'
            }
          >
            <span className="font-bold text-foreground">{coupon.code}</span>:{' '}
            {coupon.message}
          </p>
          <button
            type="button"
            onClick={() => remove.mutate({ code: coupon.code })}
            disabled={remove.isPending}
            aria-label={`Remover o código ${coupon.code}`}
            className="focus-ring shrink-0 cursor-pointer rounded-sm font-bold text-text-accent hover:underline disabled:opacity-50"
          >
            Remover
          </button>
        </div>
      )}
    </div>
  )
}
