import { cn } from '@/lib/utils'

const PROVIDERS = [
  { name: 'Google', icon: '/icons/signin-google.svg' },
  { name: 'Facebook', icon: '/icons/signin-facebook.svg' },
] as const

interface SocialSignInProps {
  /** O modal de cadastro espaça os botões em 16 px; o de login, em 12. */
  variant: 'login' | 'sign-up'
  onUnavailable: (message: string) => void
}

/**
 * "Ou continue com": login social fora do escopo. Os botões existem como no
 * Figma, mas só avisam que não estão disponíveis, sem simular uma conexão.
 */
export function SocialSignIn({ variant, onUnavailable }: SocialSignInProps) {
  return (
    <div
      className={cn('flex flex-col gap-3', variant === 'sign-up' && 'md:gap-4')}
    >
      <div className="flex items-center gap-2.5 md:gap-3">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <p className="text-[13px] leading-4 text-foreground">Ou continue com</p>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
      <ul
        className={cn(
          'flex flex-col gap-4 md:px-20',
          variant === 'login' && 'md:gap-3',
        )}
      >
        {PROVIDERS.map((provider) => (
          <li key={provider.name}>
            <button
              type="button"
              onClick={() =>
                onUnavailable(
                  `Entrar com ${provider.name} não está disponível nesta demonstração. Use e-mail e senha.`,
                )
              }
              className="focus-ring flex h-10 w-full items-center justify-center gap-3 rounded-[5px] border border-border text-[13px] leading-4 font-medium text-text-secondary transition-colors hover:border-border-soft hover:text-foreground"
            >
              <img src={provider.icon} alt="" width={20} height={20} />
              Continuar com {provider.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
