import { Link } from '@tanstack/react-router'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { withFilters } from '@/utils/catalog-search'
import type { CatalogSearch, CatalogSort } from '@/utils/catalog-search'
import { SORT_LABELS, TAB_LABELS } from './labels'

/**
 * Abas "Todos os NFTs / Novos lançamentos / Em alta". São links que recortam o
 * catálogo pela URL (`?aba=`), então voltar/avançar e refresh as preservam.
 */
export function CatalogTabs({ active }: { active?: CatalogSearch['aba'] }) {
  return (
    // `overflow-x-auto` também recorta no eixo vertical: o padding de baixo
    // abriga o sublinhado da aba ativa, senão ele vira um scroll vertical. No
    // desktop a margem negativa devolve o espaço, mantendo o alinhamento.
    <nav
      aria-label="Recortes do catálogo"
      className="-mx-1 overflow-x-auto px-1 pb-2 md:-mb-2"
    >
      <ul className="flex gap-3 md:gap-5">
        {TAB_LABELS.map(([aba, label]) => {
          const current = aba === active
          return (
            <li key={label}>
              <Link
                to="/"
                search={(prev) => withFilters(prev, { aba })}
                resetScroll={false}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'focus-ring relative block rounded-sm text-sm leading-4 whitespace-nowrap md:text-[15px] md:font-medium',
                  current
                    ? 'font-bold text-text-accent after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-primary md:after:-bottom-1.5'
                    : 'text-foreground hover:text-text-accent',
                )}
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function CatalogSortSelect({
  value = 'recentes',
  onChange,
  className,
}: {
  value?: CatalogSort
  onChange: (value: CatalogSort) => void
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-px text-[15px]', className)}>
      <span id="catalog-sort-label" className="text-foreground">
        Ordenar por:
      </span>
      <Select
        value={value}
        onValueChange={(next) => onChange(next as CatalogSort)}
      >
        <SelectTrigger
          aria-labelledby="catalog-sort-label catalog-sort-value"
          className="focus-ring h-auto gap-2 rounded-sm border-0 bg-transparent p-0 text-[15px] text-foreground shadow-none hover:text-text-accent dark:bg-transparent dark:hover:bg-transparent [&>svg]:hidden"
        >
          <span id="catalog-sort-value">{SORT_LABELS[value]}</span>
          <img
            src="/icons/arrow-down-2.svg"
            alt=""
            width={11}
            height={6}
            className="mx-[2.5px]"
          />
        </SelectTrigger>
        <SelectContent
          align="end"
          position="popper"
          className="border border-border"
        >
          {Object.entries(SORT_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
