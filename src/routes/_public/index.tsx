import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { MobileSearchBar } from '@/components/layout/mobile-search-bar'
import { PageContainer } from '@/components/layout/page-container'
import { NFT_CATEGORIES } from '@/types/nft'

// Parâmetro inválido na URL é descartado em vez de quebrar a página.
const catalogSearchSchema = z.object({
  busca: z.string().trim().min(1).optional().catch(undefined),
  categoria: z.enum(NFT_CATEGORIES).optional().catch(undefined),
})

export const Route = createFileRoute('/_public/')({
  validateSearch: catalogSearchSchema,
  staticData: { navSection: 'home' },
  component: Home,
})

function Home() {
  const { busca } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <PageContainer className="pt-10 md:pt-8">
      <MobileSearchBar
        key={busca}
        defaultValue={busca}
        className="md:hidden"
        onSearch={(term) =>
          void navigate({
            search: (prev) => ({ ...prev, busca: term || undefined }),
          })
        }
      />
      <h1 className="mt-4 text-2xl font-bold text-text-primary md:mt-0">
        Marketplace de NFTs
      </h1>
    </PageContainer>
  )
}
