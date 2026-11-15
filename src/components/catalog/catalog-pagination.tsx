import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { withPage } from '@/utils/catalog-search'

const WINDOW = 5

/** Até 5 números ao redor da página atual, como os quatro do Figma. */
function pageWindow(page: number, totalPages: number) {
  const start = Math.max(
    1,
    Math.min(page - Math.floor(WINDOW / 2), totalPages - WINDOW + 1),
  )
  const end = Math.min(totalPages, start + WINDOW - 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

const boxClass =
  'focus-ring grid size-[35px] place-items-center rounded-[4px] text-lg leading-4'

export function CatalogPagination({
  page,
  totalPages,
  className,
}: {
  page: number
  totalPages: number
  className?: string
}) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginação do catálogo" className={className}>
      <ul className="flex items-center gap-2">
        {page > 1 && (
          <li>
            <ArrowLink page={page - 1} label="Página anterior" flip />
          </li>
        )}
        {pageWindow(page, totalPages).map((n) => (
          <li key={n}>
            <Link
              to="/"
              search={(prev) => withPage(prev, n)}
              hash="catalogo"
              aria-label={`Página ${n}`}
              aria-current={n === page ? 'page' : undefined}
              className={cn(
                boxClass,
                n === page
                  ? 'bg-primary font-bold text-ink'
                  : 'border border-border text-foreground hover:border-primary',
              )}
            >
              {n}
            </Link>
          </li>
        ))}
        {page < totalPages && (
          <li>
            <ArrowLink page={page + 1} label="Próxima página" />
          </li>
        )}
      </ul>
    </nav>
  )
}

function ArrowLink({
  page,
  label,
  flip = false,
}: {
  page: number
  label: string
  flip?: boolean
}) {
  return (
    <Link
      to="/"
      search={(prev) => withPage(prev, page)}
      hash="catalogo"
      aria-label={label}
      className={cn(boxClass, 'border border-border hover:border-primary')}
    >
      {/* O ícone do Figma é a seta para baixo girada. */}
      <img
        src="/icons/arrow-right-2.svg"
        alt=""
        width={12}
        height={7}
        className={flip ? 'rotate-90' : '-rotate-90'}
      />
    </Link>
  )
}
