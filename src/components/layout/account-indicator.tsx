import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/hooks/use-session'
import { useSignOut } from '@/hooks/use-sign-out'
import type { User } from '@/types/user'

// Botão do header no Figma: 100 × 35, primário, ícone Iconly à esquerda.
const BUTTON_CLASS =
  'h-[35px] w-[100px] gap-1 rounded-md text-base leading-[normal] font-medium hover:bg-primary/90'

/** Estado da conta no header: carregando, visitante ("Entrar") ou conectado ("Sair"). */
export function AccountIndicator() {
  const session = useSession()

  if (session.status === 'pending') {
    return <SessionPending failed={session.failed} onRetry={session.retry} />
  }
  if (session.status === 'anonymous') return <SignInButton />
  return (
    <div className="flex items-center gap-4">
      <ProfileLink user={session.user} />
      <SignOutButton displayName={session.user.displayName} />
    </div>
  )
}

/**
 * Sessão salva ainda sem confirmação. Fora do Figma (desvio registrado): se a
 * verificação falha sem resposta, o colecionador não vira visitante; o header
 * oferece nova tentativa em vez de "Entrar", e a consulta também repete sozinha.
 */
function SessionPending({
  failed,
  onRetry,
}: {
  failed: boolean
  onRetry: () => void
}) {
  return (
    <>
      <p role="status" className="sr-only">
        {failed
          ? 'Não foi possível confirmar sua sessão. Tentando de novo.'
          : 'Verificando sua sessão…'}
      </p>
      {failed ? (
        <Button
          type="button"
          variant="outline"
          className="h-[35px] w-[100px] rounded-md text-base leading-[normal] font-medium"
          onClick={onRetry}
        >
          Reconectar
          <span className="sr-only"> sua sessão</span>
        </Button>
      ) : (
        <Skeleton className="h-[35px] w-[100px] rounded-md" />
      )}
    </>
  )
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/)
  return (
    parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')
  ).toUpperCase()
}

/**
 * Fora do Figma (desvio registrado): o header não desenha acesso ao perfil.
 * O avatar (ou as iniciais) leva ao perfil e mostra na hora o que foi salvo.
 */
function ProfileLink({ user }: { user: User }) {
  return (
    <Link
      to="/perfil"
      title={user.displayName}
      className="focus-ring grid size-[35px] shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-[#2f1d15] text-[13px] leading-none font-bold text-text-accent"
    >
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initialsOf(user.displayName)}</span>
      )}
      <span className="sr-only">Perfil de {user.displayName}</span>
    </Link>
  )
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
