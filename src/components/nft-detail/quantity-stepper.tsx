import { useId } from 'react'
import { MaskIcon } from '@/components/layout/mask-icon'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  /** Unidades disponíveis da edição selecionada. */
  max: number
  onChange: (quantity: number) => void
  disabled?: boolean
  /**
   * `compact`: barra de compra mobile do detalhe (20 × 30); `large`: detalhe
   * desktop (33 × 50); `cart`: linha do carrinho desktop (20 × 30, sem rótulo
   * visível); `cart-mobile`: card do carrinho mobile (24 × 24, botões escuros).
   */
  size: 'compact' | 'large' | 'cart' | 'cart-mobile'
  /** Nome do grupo; no carrinho inclui o NFT, para distinguir as linhas. */
  label?: string
  className?: string
}

const BUTTON_SIZE = {
  compact: 'h-[30px] w-5 shadow-[0_4px_12px_rgb(20_13_10/0.15)]',
  cart: 'h-[30px] w-5 shadow-[0_4px_12px_-2px_rgb(20_13_10/0.15)]',
  large: 'h-[50px] w-[33px] shadow-[0_6.6px_19.8px_rgb(20_13_10/0.15)]',
  'cart-mobile': 'size-6',
}

const VALUE_TEXT = {
  compact: 'text-lg leading-[25px] font-medium',
  cart: 'text-[17px] leading-6',
  large: 'text-xl leading-7',
  'cart-mobile': 'text-base leading-[22px]',
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
  label = 'Qtd.',
  className,
}: QuantityStepperProps) {
  const labelId = useId()
  const large = size === 'large'
  const dark = size === 'cart-mobile'
  const button = cn(
    'focus-ring flex shrink-0 cursor-pointer items-center justify-center rounded-full border transition-opacity disabled:cursor-not-allowed motion-reduce:transition-none',
    dark
      ? // Figma: o "−" no limite aparece apagado (#55321f), não translúcido.
        'border-border bg-[#2f1d15] text-foreground disabled:text-border-soft'
      : 'border-ink bg-primary text-black disabled:opacity-40',
    BUTTON_SIZE[size],
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
          size !== 'compact' && 'sr-only',
        )}
      >
        {label}
      </span>
      <div className={cn('flex items-center', dark ? 'gap-2.5' : 'gap-3')}>
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
              height={large ? 2 : dark ? 2 : 1}
            />
          </span>
        </button>
        <output
          aria-live="polite"
          className={cn(
            'min-w-3 text-center text-foreground tabular-nums',
            VALUE_TEXT[size],
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
              width={large ? 15 : dark ? 10 : 9}
              height={large ? 15 : dark ? 10 : 9}
            />
          </span>
        </button>
      </div>
    </div>
  )
}
