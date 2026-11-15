import { useId, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface MobileSearchBarProps {
  /** Termo aplicado (vem da URL); o campo acompanha mudanças externas. */
  value?: string
  onSearch: (term: string) => void
  /** Sem handler, o botão de filtros não aparece (busca da sidebar desktop). */
  onOpenFilters?: () => void
  filtersExpanded?: boolean
  className?: string
}

/** Busca do topo da Início no mobile (frame Mobile / Início, 366 × 45). */
export function MobileSearchBar({
  value,
  onSearch,
  onOpenFilters,
  filtersExpanded,
  className,
}: MobileSearchBarProps) {
  const inputId = useId()
  const [term, setTerm] = useState(value ?? '')
  // Sincroniza com voltar/avançar sem remontar o campo, que perderia o foco.
  const [syncedValue, setSyncedValue] = useState(value)
  if (value !== syncedValue) {
    setSyncedValue(value)
    setTerm(value ?? '')
  }

  return (
    <div className={cn('flex h-[45px] gap-2', className)}>
      <form
        role="search"
        className="flex min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-card pl-3 focus-within:ring-2 focus-within:ring-ring"
        onSubmit={(event) => {
          event.preventDefault()
          onSearch(term.trim())
        }}
      >
        <img
          src="/icons/search-mobile.svg"
          alt=""
          width={22}
          height={22}
          className="size-[22px] shrink-0"
        />
        <label htmlFor={inputId} className="sr-only">
          Buscar NFTs
        </label>
        <Input
          id={inputId}
          type="search"
          name="busca"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Explorar coleções"
          enterKeyHint="search"
          className="h-full flex-1 rounded-none border-0 bg-transparent py-0 text-sm leading-4 text-foreground focus-visible:ring-0 dark:bg-transparent pr-3 pl-0 font-bold"
        />
      </form>
      {onOpenFilters && (
        <button
          type="button"
          aria-label="Filtros"
          aria-expanded={Boolean(filtersExpanded)}
          aria-haspopup="dialog"
          onClick={onOpenFilters}
          className="focus-ring grid size-[45px] shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(137.05deg,rgba(210,138,76,0.45)_24.6%,var(--brand-primary)_100%)]"
        >
          <span aria-hidden="true" className="relative size-[22px]">
            <span className="absolute inset-[19.46%_13.96%_14.14%_19.46%]">
              <span className="absolute inset-[-5.14%_-5.12%_-5.13%_-5.12%]">
                <img
                  src="/icons/filter.svg"
                  alt=""
                  className="block size-full max-w-none"
                />
              </span>
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
