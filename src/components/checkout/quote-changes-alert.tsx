import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QuoteChangesAlertProps {
  changes: Array<string>
  onAccept: () => void
  className?: string
  ref?: React.Ref<HTMLDivElement>
}

/**
 * Valores que mudaram desde a revisão (evento `nft.updated`, cupom vencido,
 * resposta do pedido). A compra só segue depois de o colecionador aceitar.
 */
export function QuoteChangesAlert({
  changes,
  onAccept,
  className,
  ref,
}: QuoteChangesAlertProps) {
  return (
    <div ref={ref} tabIndex={-1} className={cn('outline-none', className)}>
      {changes.length > 0 && (
        <section
          aria-labelledby="checkout-alteracoes"
          className="flex flex-col gap-3 rounded-[10px] border border-text-coral/60 bg-card px-4 py-4"
        >
          <h2
            id="checkout-alteracoes"
            className="text-base leading-5 font-bold text-text-coral"
          >
            Os valores do pedido mudaram
          </h2>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm leading-5 text-foreground">
            {changes.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          <Button
            type="button"
            onClick={onAccept}
            className="h-10 self-start rounded-[3px] px-4 text-sm font-bold text-ink"
          >
            Aceitar novos valores
          </Button>
        </section>
      )}
    </div>
  )
}
