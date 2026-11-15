import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CatalogSection } from '@/components/catalog/catalog-section'
import { HomeHero } from '@/components/catalog/home-hero'
import { HomeBlog, HomePromos } from '@/components/catalog/home-showcase'
import { MobileSearchBar } from '@/components/layout/mobile-search-bar'
import { PageContainer } from '@/components/layout/page-container'
import { catalogSearchSchema, withFilters } from '@/utils/catalog-search'
import type { CatalogSearch } from '@/utils/catalog-search'

export const Route = createFileRoute('/_public/')({
  validateSearch: catalogSearchSchema,
  staticData: { navSection: 'home' },
  component: Home,
})

function Home() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const changeFilters = (changes: Partial<CatalogSearch>) =>
    void navigate({
      search: (prev) => withFilters(prev, changes),
      // Filtrar não deve jogar a página para o topo, longe do catálogo.
      resetScroll: false,
    })

  return (
    <PageContainer className="flex flex-col gap-6 pt-10 pb-16 md:gap-24 md:pt-8 md:pb-24">
      {/* No mobile, a busca vem antes do hero, como no Figma. */}
      <MobileSearchBar
        value={search.busca}
        onSearch={(term) => changeFilters({ busca: term || undefined })}
        onOpenFilters={() => setFiltersOpen(true)}
        filtersExpanded={filtersOpen}
        className="-mb-2 md:hidden"
      />
      <HomeHero />
      <CatalogSection
        search={search}
        onFiltersChange={changeFilters}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
      />
      <HomePromos />
      <HomeBlog />
    </PageContainer>
  )
}
