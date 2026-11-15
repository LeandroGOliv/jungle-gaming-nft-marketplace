import { Link, useLocation, useMatch, useSearch } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Estado da conta no header. A sessão autenticada acrescenta aqui a variante
 * com os dados do colecionador.
 */
export type AccountIndicatorProps =
  { status: 'pending' } | { status: 'anonymous' }

export function AccountIndicator(props: AccountIndicatorProps) {
  if (props.status === 'pending') {
    return <Skeleton className="h-[35px] w-[100px] rounded-md" />
  }
  return <SignInButton />
}

function SignInButton() {
  const href = useLocation({ select: (location) => location.href })
  const inAuthFlow = useMatch({
    from: '/_unauthenticated',
    shouldThrow: false,
    select: () => true,
  })
  const pendingRedirect = useSearch({
    strict: false,
    select: (search) => search.redirect,
  })
  // Fora do login, volta para onde o visitante estava. Dentro do fluxo de
  // login e cadastro, preserva o retorno que já veio na URL.
  const redirect = inAuthFlow ? pendingRedirect : href

  return (
    <Button
      asChild
      className="h-[35px] w-[100px] gap-1 rounded-md text-base leading-[normal] font-medium hover:bg-primary/90"
    >
      <Link to="/login" search={{ redirect }}>
        {/* Caixas e recuos do ícone Iconly como estão no Figma. */}
        <span aria-hidden="true" className="relative size-5 shrink-0">
          <span className="absolute inset-[13.75%_-8.96%_-6.25%_11.29%]">
            <span className="absolute inset-[-4.86%_-4.61%]">
              <img
                src="/icons/login.svg"
                alt=""
                className="block size-full max-w-none"
              />
            </span>
          </span>
        </span>
        Entrar
      </Link>
    </Button>
  )
}
