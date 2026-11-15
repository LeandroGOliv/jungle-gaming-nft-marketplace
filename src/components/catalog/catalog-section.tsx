import { useEffect, useRef } from 'react'
import { MobileSearchBar } from '@/components/layout/mobile-search-bar'
import { StateMessage } from '@/components/layout/state-message'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAnnounce } from '@/hooks/use-announce'
import { useNftList } from '@/hooks/use-nfts'
import { cn } from '@/lib/utils'
import { CATALOG_PAGE_SIZE, toNftListQuery } from '@/utils/catalog-search'
import type { CatalogSearch } from '@/utils/catalog-search'
import { CatalogFilters } from './catalog-filters'
import { CatalogPagination } from './catalog-pagination'
import { CatalogSortSelect, CatalogTabs } from './catalog-toolbar'
import { FeaturedNftBanner } from './home-showcase'
import { NftCard, NftCardSkeleton, NftGrid } from './nft-card'

interface CatalogSectionProps {
  /** O botão de filtros da busca mobile (fora da seção) abre o sheet daqui. */
  filtersOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
  search: CatalogSearch
  /** Mudança de filtro, busca ou ordenação: a página volta para 1. */
  onFiltersChange: (changes: Partial<CatalogSearch>) => void
}

const hasFilters = (search: CatalogSearch) =>
  Boolean(
    search.busca ||
    search.categoria ||
    search.rede ||
    search.precoMin ||
    search.precoMax ||
    search.aba,
  )

export function CatalogSection({
  search,
  onFiltersChange,
  filtersOpen,
  onFiltersOpenChange: setFiltersOpen,
}: CatalogSectionProps) {
  const filtersOpener = useRef<HTMLElement | null>(null)
  const query = toNftListQuery(search)
  const list = useNftList(query)
  const facets = list.data?.facets
  const refreshing =
    list.isPlaceholderData || (list.isFetching && !list.isPending)

  useResultAnnouncement(
    list.isPlaceholderData ? undefined : list.data?.total,
    query,
  )

  const clearFilters = () =>
    onFiltersChange({
      busca: undefined,
      categoria: undefined,
      rede: undefined,
      precoMin: undefined,
      precoMax: undefined,
      aba: undefined,
    })

  return (
    <section
      id="catalogo"
      aria-labelledby="catalog-title"
      className="scroll-mt-6 lg:flex lg:items-start lg:gap-12"
    >
      <h2 id="catalog-title" className="sr-only">
        Catálogo de NFTs
      </h2>

      <aside
        aria-label="Busca e filtros"
        className="hidden w-[310px] shrink-0 flex-col gap-6 lg:flex"
      >
        <DesktopSearch
          value={search.busca}
          onSearch={(busca) => onFiltersChange({ busca })}
        />
        <CatalogFilters
          search={search}
          facets={facets}
          onChange={onFiltersChange}
        />
        <FeaturedNftBanner />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-10 lg:gap-[88px]">
        <div className="flex flex-col gap-4 md:gap-8">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <CatalogTabs active={search.aba} />
            <div className="flex items-center gap-4 max-md:hidden">
              <Button
                variant="outline"
                onClick={() => setFiltersOpen(true)}
                aria-expanded={filtersOpen}
                className="lg:hidden"
              >
                Filtros
              </Button>
              <CatalogSortSelect
                value={search.ordem}
                onChange={(ordem) =>
                  onFiltersChange({
                    ordem: ordem === 'recentes' ? undefined : ordem,
                  })
                }
              />
            </div>
          </div>

          <div aria-busy={list.isFetching} className="relative">
            {list.isPending ? (
              <NftGrid
                aria-label="Carregando NFTs"
                data-testid="catalog-loading"
              >
                {Array.from({ length: CATALOG_PAGE_SIZE }, (_, i) => (
                  <li key={i}>
                    <NftCardSkeleton />
                  </li>
                ))}
              </NftGrid>
            ) : list.isError && !list.data ? (
              <StateMessage title="Não foi possível carregar o catálogo">
                <p>Verifique sua conexão e tente novamente.</p>
                <div className="mt-6">
                  <Button onClick={() => void list.refetch()}>
                    Tentar novamente
                  </Button>
                </div>
              </StateMessage>
            ) : list.data.items.length === 0 ? (
              <StateMessage title="Nenhum NFT encontrado">
                <p>
                  {hasFilters(search)
                    ? 'Nenhum NFT corresponde à busca e aos filtros escolhidos.'
                    : 'Ainda não há NFTs à venda no catálogo.'}
                </p>
                {hasFilters(search) && (
                  <div className="mt-6">
                    <Button onClick={clearFilters}>Limpar filtros</Button>
                  </div>
                )}
              </StateMessage>
            ) : (
              <>
                {list.isError && (
                  <p
                    role="alert"
                    className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-card px-4 py-3 text-sm text-text-secondary"
                  >
                    Não foi possível atualizar o catálogo.
                    <Button size="sm" onClick={() => void list.refetch()}>
                      Tentar novamente
                    </Button>
                  </p>
                )}
                <NftGrid
                  aria-label="NFTs à venda"
                  data-testid="catalog-grid"
                  data-refreshing={refreshing || undefined}
                  className={cn(
                    'transition-opacity duration-200 motion-reduce:transition-none',
                    refreshing && 'opacity-60',
                  )}
                >
                  {list.data.items.map((nft, index) => (
                    <li key={nft.id}>
                      <NftCard nft={nft} eager={index < 3} />
                    </li>
                  ))}
                </NftGrid>
              </>
            )}
            {refreshing && (
              <span
                aria-hidden="true"
                data-testid="catalog-refreshing"
                className="absolute inset-x-0 -top-3 h-0.5 animate-pulse bg-primary motion-reduce:animate-none md:-top-4"
              />
            )}
          </div>
        </div>

        {list.data && (
          <CatalogPagination
            page={query.page}
            totalPages={list.data.totalPages}
            className="self-end max-md:self-center"
          />
        )}
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent
          // Aberta por gatilhos fora de um SheetTrigger (busca mobile e botão
          // do tablet): o Radix não saberia a quem devolver o foco.
          onOpenAutoFocus={() => {
            filtersOpener.current = document.activeElement as HTMLElement | null
          }}
          onCloseAutoFocus={(event) => {
            const opener = filtersOpener.current
            if (opener?.isConnected && opener !== document.body) {
              event.preventDefault()
              opener.focus()
            }
          }}
          side="bottom"
          className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-[20px] border-border bg-card"
        >
          <SheetHeader className="px-5 pt-5 pb-0">
            <SheetTitle className="text-lg font-bold text-foreground">
              Filtros
            </SheetTitle>
            <SheetDescription className="text-text-secondary">
              {list.data
                ? `${list.data.total} NFTs encontrados`
                : 'Carregando resultados'}
            </SheetDescription>
          </SheetHeader>
          <CatalogSortSelect
            value={search.ordem}
            onChange={(ordem) =>
              onFiltersChange({
                ordem: ordem === 'recentes' ? undefined : ordem,
              })
            }
            className="px-5 pt-6 md:hidden"
          />
          <CatalogFilters
            search={search}
            facets={facets}
            onChange={onFiltersChange}
          />
        </SheetContent>
      </Sheet>
    </section>
  )
}

/** Campo de busca do desktop, no topo da sidebar (o Figma não desenha um). */
function DesktopSearch({
  value,
  onSearch,
}: {
  value?: string
  onSearch: (term: string | undefined) => void
}) {
  return (
    <MobileSearchBar
      value={value}
      onSearch={(term) => onSearch(term || undefined)}
    />
  )
}

/** Anuncia o total na região viva quando o resultado de uma nova consulta chega. */
function useResultAnnouncement(total: number | undefined, query: unknown) {
  const announce = useAnnounce()
  const key = JSON.stringify(query)
  const lastKey = useRef<string | null>(null)

  useEffect(() => {
    if (total === undefined || lastKey.current === key) return
    const isFirst = lastKey.current === null
    lastKey.current = key
    // O carregamento inicial não é uma mudança feita pelo usuário.
    if (isFirst) return
    announce(
      total === 0
        ? 'Nenhum NFT encontrado.'
        : `${total} ${total === 1 ? 'NFT encontrado' : 'NFTs encontrados'}.`,
    )
  }, [announce, key, total])
}
