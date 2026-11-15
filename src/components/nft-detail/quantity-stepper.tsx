import { useId } from 'react'
import { MaskIcon } from '@/components/layout/mask-icon'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  /** Unidades disponíveis da edição selecionada. */
  max: number
  onChange: (quantity: number) => void
  disabled?: boolean
  /** `compact` é a barra de compra mobile (20 × 30); `large`, o desktop (33 × 50). */
  size: 'compact' | 'large'
  className?: string
}

/**
 * Quantidade inteira entre 1 e o disponível. Os botões ficam desabilitados
 * nos limites, e o valor é anunciado a cada alteração.
 */
export function QuantityStepper({
  value,
  max,
  onChange,
  disabled = false,
  size,
  className,
}: QuantityStepperProps) {
  const labelId = useId()
  const large = size === 'large'
  const button = cn(
    'focus-ring flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-ink bg-primary text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none',
    large
      ? 'h-[50px] w-[33px] shadow-[0_6.6px_19.8px_rgb(20_13_10/0.15)]'
      : 'h-[30px] w-5 shadow-[0_4px_12px_rgb(20_13_10/0.15)]',
  )
  const icon = large ? 26 : 16

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={cn('flex items-center gap-2', className)}
    >
      <span
        id={labelId}
        className={cn(
          'text-[15px] leading-4 font-medium text-text-secondary',
          large && 'sr-only',
        )}
      >
        Qtd.
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={button}
          onClick={() => onChange(value - 1)}
          disabled={disabled || value <= 1}
          aria-label="Diminuir quantidade"
        >
          <span
            className="flex items-center justify-center"
            style={{ width: icon, height: icon }}
          >
            <MaskIcon
              src="/icons/detail-minus.svg"
              width={large ? 15 : 9}
              height={large ? 2 : 1}
            />
          </span>
        </button>
        <output
          aria-live="polite"
          className={cn(
            'min-w-3 text-center text-foreground tabular-nums',
            large ? 'text-xl leading-7' : 'text-lg leading-[25px] font-medium',
          )}
        >
          {value}
        </output>
        <button
          type="button"
          className={button}
          onClick={() => onChange(value + 1)}
          disabled={disabled || value >= max}
          aria-label="Aumentar quantidade"
        >
          <span
            className="flex items-center justify-center"
            style={{ width: icon, height: icon }}
          >
            <MaskIcon
              src="/icons/detail-plus.svg"
              width={large ? 15 : 9}
              height={large ? 15 : 9}
            />
          </span>
        </button>
      </div>
    </div>
  )
}
