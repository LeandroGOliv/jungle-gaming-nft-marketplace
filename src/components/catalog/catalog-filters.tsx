import { useId, useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { BLOCKCHAIN_NETWORKS } from '@/types/nft'
import type { NftListFacets } from '@/types/nft'
import type { CatalogSearch } from '@/utils/catalog-search'
import { fromHundredths, toHundredths } from '@/utils/eth'
import { CATEGORY_LABELS, NETWORK_LABELS, ethWithComma } from './labels'

interface CatalogFiltersProps {
  search: CatalogSearch
  /** Ausente enquanto a primeira resposta não chega. */
  facets?: NftListFacets
  onChange: (changes: Partial<CatalogSearch>) => void
  className?: string
}

/**
 * Painel "Filters" do Figma (310 de largura no desktop). Coleção e rede são de
 * escolha única, como no Figma: clicar no item ativo remove o filtro.
 */
export function CatalogFilters({
  search,
  facets,
  onChange,
  className,
}: CatalogFiltersProps) {
  return (
    <div
      className={cn('flex flex-col gap-10 bg-card p-5', className)}
      data-testid="catalog-filters"
    >
      <FilterGroup title="Coleções">
        <OptionList
          options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
            value,
            label,
            count: facets?.categories[value as keyof typeof CATEGORY_LABELS],
          }))}
          selected={search.categoria}
          boldCount
          onSelect={(value) =>
            onChange({ categoria: value as CatalogSearch['categoria'] })
          }
        />
      </FilterGroup>

      <FilterGroup title="Faixa de preço">
        {facets ? (
          <PriceRange
            // Remonta quando a faixa aplicada ou os limites mudam por fora
            // (voltar/avançar, limpar filtros), descartando o rascunho.
            key={`${search.precoMin}-${search.precoMax}-${facets.priceRange.min}-${facets.priceRange.max}`}
            bounds={facets.priceRange}
            applied={{ min: search.precoMin, max: search.precoMax }}
            onApply={(min, max) => onChange({ precoMin: min, precoMax: max })}
          />
        ) : (
          <Skeleton className="ml-3 h-[109px]" />
        )}
      </FilterGroup>

      <FilterGroup title="Rede">
        <OptionList
          options={BLOCKCHAIN_NETWORKS.map((value) => ({
            value,
            label: NETWORK_LABELS[value],
            count: facets?.networks[value],
          }))}
          selected={search.rede}
          onSelect={(value) =>
            onChange({ rede: value as CatalogSearch['rede'] })
          }
        />
      </FilterGroup>
    </div>
  )
}

function FilterGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h3
        id={headingId}
        className="text-lg leading-4 font-bold text-foreground"
      >
        {title}
      </h3>
      {children}
    </section>
  )
}

interface Option {
  value: string
  label: string
  count?: number
}

function OptionList({
  options,
  selected,
  boldCount = false,
  onSelect,
}: {
  options: Array<Option>
  selected?: string
  boldCount?: boolean
  onSelect: (value: string | undefined) => void
}) {
  return (
    <ul className="flex flex-col px-3">
      {options.map((option) => {
        const active = option.value === selected
        return (
          <li key={option.value}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(active ? undefined : option.value)}
              className={cn(
                'focus-ring flex w-full items-start justify-between rounded-sm text-[15px] leading-10 hover:text-text-accent',
                active ? 'text-text-accent' : 'text-text-secondary',
              )}
            >
              <span>{option.label}</span>
              <span className={cn('text-right', boldCount && 'font-bold')}>
                {option.count === undefined ? '' : `(${option.count})`}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function PriceRange({
  bounds,
  applied,
  onApply,
}: {
  bounds: NftListFacets['priceRange']
  applied: { min?: string; max?: string }
  onApply: (min: string | undefined, max: string | undefined) => void
}) {
  // O slider anda em centésimos de ETH (inteiros); a URL e a API recebem
  // strings decimais, nunca o número do slider.
  const lower = toHundredths(bounds.min)
  const upper = Math.max(toHundredths(bounds.max), lower + 1)
  const clamp = (value: number) => Math.min(upper, Math.max(lower, value))
  const [draft, setDraft] = useState<[number, number]>([
    clamp(applied.min ? toHundredths(applied.min) : lower),
    clamp(applied.max ? toHundredths(applied.max) : upper),
  ])
  const [min, max] = draft.map(fromHundredths)

  return (
    <div className="flex flex-col gap-3 pl-3">
      <Slider
        min={lower}
        max={upper}
        step={1}
        minStepsBetweenThumbs={0}
        value={draft}
        onValueChange={(value) => setDraft([value[0], value[1]])}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
        className="py-2"
      />
      <p className="text-[15px] text-foreground" aria-live="polite">
        Preço: {ethWithComma(min)} - {ethWithComma(max)} ETH
      </p>
      <button
        type="button"
        onClick={() =>
          // Os extremos do catálogo valem como "sem limite".
          onApply(
            draft[0] <= lower ? undefined : min,
            draft[1] >= upper ? undefined : max,
          )
        }
        className="focus-ring self-start rounded-md bg-primary px-3 py-2 text-base leading-5 font-bold text-ink hover:bg-primary/90"
      >
        Aplicar
      </button>
    </div>
  )
}
