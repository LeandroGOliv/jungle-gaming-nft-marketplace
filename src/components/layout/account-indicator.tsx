import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/hooks/use-session'
import { useSignOut } from '@/hooks/use-sign-out'

// Botão do header no Figma: 100 × 35, primário, ícone Iconly à esquerda.
const BUTTON_CLASS =
  'h-[35px] w-[100px] gap-1 rounded-md text-base leading-[normal] font-medium hover:bg-primary/90'

/** Estado da conta no header: carregando, visitante ("Entrar") ou conectado ("Sair"). */
export function AccountIndicator() {
  const session = useSession()

  if (session.status === 'pending') {
    return <Skeleton className="h-[35px] w-[100px] rounded-md" />
  }
  if (session.status === 'anonymous') return <SignInButton />
  return <SignOutButton displayName={session.user.displayName} />
}

function ButtonIcon() {
  return (
    // Caixas e recuos do ícone Iconly como estão no Figma. O Figma usa o mesmo
    // glifo de "Logout" no botão de entrar; o de sair reaproveita o arquivo.
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
  )
}

/** Abre o login sobre a tela atual: depois de entrar, o visitante continua nela. */
function SignInButton() {
  return (
    <Button asChild className={BUTTON_CLASS}>
      <Link to="." search={(prev) => ({ ...prev, auth: 'entrar' as const })}>
        <ButtonIcon />
        Entrar
      </Link>
    </Button>
  )
}

function SignOutButton({ displayName }: { displayName: string }) {
  const { signOut, isPending } = useSignOut()

  return (
    <Button
      type="button"
      className={BUTTON_CLASS}
      disabled={isPending}
      onClick={signOut}
      title={`Conectado como ${displayName}`}
    >
      <ButtonIcon />
      Sair
      <span className="sr-only"> da conta de {displayName}</span>
    </Button>
  )
}
