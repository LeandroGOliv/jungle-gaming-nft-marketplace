import { useRef, useState } from 'react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearch,
} from '@tanstack/react-router'
import { MAIN_CONTENT_ID } from '@/components/layout/skip-link'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAnnounce } from '@/hooks/use-announce'
import { useSession } from '@/hooks/use-session'
import { cn } from '@/lib/utils'
import { withoutAuthParams } from '@/utils/auth-location'
import { LoginForm } from './login-form'
import { SignUpForm } from './sign-up-form'
import { SocialSignIn } from './social-sign-in'
import type { AuthSession } from '@/types/auth'
import type { AuthParams } from '@/utils/auth-location'

type Mode = NonNullable<AuthParams['auth']>

const COPY = {
  entrar: {
    title: 'Entrar',
    mobileTitle: 'Entrar',
    description:
      'Entre para gerenciar sua carteira, coleção e perfil de criador.',
    switchPrompt: 'Novo na Kurio? Crie uma conta',
  },
  cadastro: {
    title: 'Criar conta',
    mobileTitle: 'Criar perfil de colecionador',
    description:
      'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
    switchPrompt: 'Já tem uma conta? Entre',
  },
} satisfies Record<Mode, Record<string, string>>

const NOTICES: Record<NonNullable<AuthParams['motivo']>, string> = {
  'sessao-expirada': 'Sua sessão expirou. Entre novamente para continuar.',
  'sessao-encerrada':
    'Sua sessão foi encerrada. Entre novamente para continuar.',
}

/**
 * Login e cadastro sobre a tela atual, abertos por `?auth=entrar|cadastro`.
 * No desktop é o modal de 500 px do Figma; abaixo de 768 px ocupa a tela
 * inteira, como os frames mobile. Com sessão ativa, segue para o `redirect`
 * (ou fica na tela, sem os parâmetros do modal).
 */
export function AuthDialog() {
  const { auth, motivo, redirect } = useSearch({ from: '__root__' })
  const href = useLocation({ select: (location) => location.href })
  const session = useSession()
  const navigate = useNavigate()

  if (auth && session.status === 'authenticated') {
    // `href` prevalece sobre `to`, que o componente exige nos tipos.
    return (
      <Navigate to="." href={redirect ?? withoutAuthParams(href)} replace />
    )
  }

  const open = auth !== undefined && session.status === 'anonymous'

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) return
        void navigate({
          to: '.',
          search: (prev) => ({
            ...prev,
            auth: undefined,
            motivo: undefined,
            redirect: undefined,
          }),
          replace: true,
        })
      }}
    >
      {auth && <AuthDialogContent mode={auth} motivo={motivo} />}
    </Dialog>
  )
}

interface AuthDialogContentProps {
  mode: Mode
  motivo: AuthParams['motivo']
}

function AuthDialogContent({ mode, motivo }: AuthDialogContentProps) {
  const copy = COPY[mode]
  const announce = useAnnounce()
  const returnFocus = useRef<HTMLElement | null>(null)
  // Aviso dos recursos fora do escopo; a região vive dentro do modal porque o
  // Radix esconde o resto da página dos leitores de tela enquanto ele está aberto.
  // Guardado com o modo: ao trocar entre Entrar e Criar conta, o aviso some.
  const [unavailable, setUnavailableState] = useState({ mode, text: '' })
  const setUnavailable = (text: string) => setUnavailableState({ mode, text })

  function handleSuccess(session: AuthSession) {
    const name = session.user.displayName
    announce(
      mode === 'entrar'
        ? `Você entrou como ${name}.`
        : `Conta criada. Você entrou como ${name}.`,
    )
  }

  return (
    <DialogContent
      showCloseButton={false}
      onOpenAutoFocus={(event) => {
        returnFocus.current = document.activeElement as HTMLElement | null
        // O foco começa no primeiro campo, não nas abas nem no "X".
        const field = (
          event.currentTarget as HTMLElement | null
        )?.querySelector('form input')
        if (field instanceof HTMLElement) {
          event.preventDefault()
          field.focus()
        }
      }}
      onCloseAutoFocus={(event) => {
        // O foco volta a quem abriu o modal; se ele sumiu (o "Entrar" vira
        // "Sair" ao autenticar) ou o modal veio da URL, vai para o conteúdo.
        // Feito aqui porque o Radix guarda o foco de quando o efeito de foco
        // roda de novo, já dentro do modal, e o devolveria ao <body>.
        const target = returnFocus.current
        event.preventDefault()
        const destination =
          target && target !== document.body && target.isConnected
            ? target
            : document.getElementById(MAIN_CONTENT_ID)
        destination?.focus()
      }}
      className={cn(
        // Mobile: tela cheia, como os frames de 414 px.
        'flex max-w-none flex-col gap-10 overflow-y-auto rounded-none bg-background px-7 pt-20 pb-6 sm:max-w-none max-md:inset-0 max-md:translate-x-0 max-md:translate-y-0',
        // Desktop: modal de 500 px a 160 px do topo, como no Figma, sempre que
        // couber com 24 px de folga embaixo; em telas baixas (ou com zoom) sobe
        // até 24 px do topo e rola por dentro, sem cortar conteúdo.
        'md:top-(--auth-top) md:max-h-[calc(100dvh_-_var(--auth-top)_-_24px)] md:w-[500px] md:translate-y-0 md:gap-0 md:bg-card md:p-0',
        mode === 'entrar'
          ? 'md:[--auth-top:min(160px,max(24px,calc(100dvh_-_624px)))] md:min-h-[min(600px,calc(100dvh_-_var(--auth-top)_-_24px))]'
          : 'md:[--auth-top:min(160px,max(24px,calc(100dvh_-_680px)))] md:min-h-[min(656px,calc(100dvh_-_var(--auth-top)_-_24px))] md:rounded-[8px]',
      )}
    >
      <header className="flex flex-col items-center gap-10 md:px-12 md:pt-12">
        <p
          aria-hidden="true"
          className="flex h-[136px] items-center text-[32px] leading-[normal] font-bold tracking-[3.2px] text-foreground md:hidden"
        >
          KURIO
        </p>
        <ModeTabs mode={mode} />
        <DialogTitle className="text-center leading-4 font-bold text-foreground max-md:text-[20px] md:sr-only">
          <span
            className={cn(
              'md:hidden',
              mode === 'cadastro' && 'text-lg leading-4',
            )}
          >
            {copy.mobileTitle}
          </span>
          <span className="max-md:hidden">{copy.title}</span>
        </DialogTitle>
        <DialogDescription className="text-center text-[13px] leading-4 text-foreground max-md:sr-only">
          {copy.description}
          {/* O aviso visível fica abaixo; aqui ele entra na descrição do diálogo. */}
          {motivo && <span className="sr-only"> {NOTICES[motivo]}</span>}
        </DialogDescription>
      </header>

      {motivo && (
        <p
          aria-hidden="true"
          className="rounded-[5px] border border-primary/60 px-4 py-3 text-center text-[13px] leading-4 text-text-accent md:mx-20 md:mt-6"
        >
          {NOTICES[motivo]}
        </p>
      )}

      {mode === 'entrar' ? (
        <LoginForm onSuccess={handleSuccess} onUnavailable={setUnavailable} />
      ) : (
        <SignUpForm onSuccess={handleSuccess} />
      )}

      <div className="flex flex-col md:pt-6 md:pb-6">
        <SocialSignIn
          variant={mode === 'entrar' ? 'login' : 'sign-up'}
          onUnavailable={setUnavailable}
        />
        {/* Sempre montada: leitores de tela ignoram regiões vivas recém-criadas. */}
        <p
          role="status"
          className="mt-3 text-center text-[13px] leading-4 text-text-secondary empty:mt-0 md:px-20"
        >
          {unavailable.mode === mode ? unavailable.text : ''}
        </p>
      </div>

      <Link
        to="."
        search={(prev) => ({
          ...prev,
          auth: mode === 'entrar' ? ('cadastro' as const) : ('entrar' as const),
        })}
        replace
        className="focus-ring self-center rounded-sm text-[15px] leading-[normal] text-text-secondary hover:text-foreground md:hidden"
      >
        {copy.switchPrompt}
      </Link>

      <span
        aria-hidden="true"
        className="mt-auto h-2.5 shrink-0 bg-primary max-md:hidden"
      />

      {/* Por último no DOM: o "X" fica no canto, mas no fim da ordem de tabulação. */}
      <DialogClose className="focus-ring absolute top-4 right-4 grid size-8 place-items-center rounded-sm md:top-1 md:right-[5px]">
        <img src="/icons/close.svg" alt="" width={18} height={18} />
        <span className="sr-only">Fechar</span>
      </DialogClose>
    </DialogContent>
  )
}

/** "Entrar | Criar conta" do modal desktop: troca o formulário pela URL. */
function ModeTabs({ mode }: { mode: Mode }) {
  const tabs = [
    { mode: 'entrar', label: 'Entrar' },
    { mode: 'cadastro', label: 'Criar conta' },
  ] as const

  return (
    <nav aria-label="Acesso à conta" className="max-md:hidden">
      <ul className="flex h-5 items-center gap-2">
        {tabs.map((tab, index) => (
          <li key={tab.mode} className="flex h-full items-center gap-2">
            {index > 0 && (
              <span aria-hidden="true" className="h-full w-px bg-text-coral" />
            )}
            <Link
              to="."
              search={(prev) => ({ ...prev, auth: tab.mode })}
              replace
              aria-current={tab.mode === mode ? 'page' : undefined}
              className={cn(
                'focus-ring rounded-sm text-[20px] leading-4 font-medium',
                tab.mode === mode
                  ? 'text-text-accent'
                  : 'text-foreground hover:text-text-accent',
              )}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
