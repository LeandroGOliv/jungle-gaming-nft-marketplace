import { useId } from 'react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'
import type { NftEdition } from '@/types/nft'

interface EditionPickerProps {
  editions: Array<NftEdition>
  value: string | undefined
  onChange: (editionId: string) => void
  className?: string
}

/**
 * Pílulas de edição do Figma como um grupo de rádio: setas trocam a opção e
 * a edição esgotada fica desabilitada, riscada e anunciada como esgotada.
 */
export function EditionPicker({
  editions,
  value,
  onChange,
  className,
}: EditionPickerProps) {
  const labelId = useId()
  const statusId = useId()
  const selected = editions.find((e) => e.id === value)

  return (
    <div className={cn('flex flex-col gap-2 md:gap-3', className)}>
      <p
        id={labelId}
        className="text-[15px] leading-4 font-bold text-foreground"
      >
        Edição:
      </p>
      <RadioGroupPrimitive.Root
        aria-labelledby={labelId}
        aria-describedby={statusId}
        value={value}
        onValueChange={onChange}
        orientation="horizontal"
        className="flex flex-wrap gap-3 md:gap-1.5"
      >
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          return (
            <RadioGroupPrimitive.Item
              key={edition.id}
              value={edition.id}
              disabled={soldOut}
              aria-label={
                soldOut ? `${edition.label}, esgotada` : edition.label
              }
              className={cn(
                'focus-ring h-7 min-w-9 cursor-pointer rounded-full border border-border px-1 text-sm leading-4 text-text-secondary transition-colors hover:border-primary motion-reduce:transition-none',
                'data-[state=checked]:border-primary data-[state=checked]:px-1.5 data-[state=checked]:font-medium data-[state=checked]:text-text-accent',
                'disabled:cursor-not-allowed disabled:line-through disabled:opacity-50 disabled:hover:border-border',
              )}
            >
              {edition.label}
            </RadioGroupPrimitive.Item>
          )
        })}
      </RadioGroupPrimitive.Root>
      <p id={statusId} className="text-[13px] leading-4 text-brand-secondary">
        {selected
          ? selected.available === 0
            ? 'Esta edição está esgotada.'
            : `${selected.available} de ${selected.supply} disponíveis`
          : 'Nenhuma edição à venda.'}
      </p>
    </div>
  )
}
