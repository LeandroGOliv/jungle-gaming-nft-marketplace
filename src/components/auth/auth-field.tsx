import { useId, useState } from 'react'
import { EyeIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface AuthFieldProps extends Omit<
  React.ComponentProps<'input'>,
  'id' | 'type'
> {
  /** Nome acessível; o Figma não desenha label visível, só o placeholder. */
  label: string
  error?: string
  type?: 'text' | 'email' | 'password'
  /** Exibe o botão de mostrar a senha (no cadastro desktop, só no primeiro campo). */
  revealable?: 'always' | 'mobile'
  /** Placeholder centralizado no mobile, como o "Nome de usuário" do Figma. */
  centerPlaceholderOnMobile?: boolean
}

/**
 * Campo dos formulários de acesso: 358 × 50 no mobile e 340 × 40 no modal,
 * com label associado, erro em `aria-describedby` e alternância de senha.
 */
export function AuthField({
  label,
  error,
  type = 'text',
  revealable,
  centerPlaceholderOnMobile,
  className,
  ...props
}: AuthFieldProps) {
  const id = useId()
  const errorId = `${id}-erro`
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            // Foco como no Figma: só a borda passa a `primary` (5:1 sobre o fundo).
            'h-[50px] rounded-[10px] border-border bg-transparent px-4 text-base leading-4 text-foreground placeholder:text-sm placeholder:leading-4 focus-visible:border-primary focus-visible:ring-0 md:h-10 md:rounded-[5px] md:text-base dark:bg-transparent',
            isPassword && revealable && 'pr-12',
            // O cadastro desktop só desenha o ícone no primeiro campo de senha.
            isPassword && revealable === 'mobile' && 'md:pr-4',
            centerPlaceholderOnMobile && 'max-md:placeholder:text-center',
          )}
          {...props}
        />
        {isPassword && revealable && (
          <button
            type="button"
            aria-label={
              revealed
                ? `Ocultar ${label.toLowerCase()}`
                : `Mostrar ${label.toLowerCase()}`
            }
            aria-pressed={revealed}
            aria-controls={id}
            onClick={() => setRevealed((value) => !value)}
            className={cn(
              'focus-ring absolute top-1/2 right-[9px] grid size-8 -translate-y-1/2 place-items-center rounded-sm text-brand-secondary hover:text-text-secondary md:right-[6px]',
              revealable === 'mobile' && 'md:hidden',
            )}
          >
            {revealed ? (
              <EyeIcon
                aria-hidden="true"
                className="size-[18px]"
                strokeWidth={1.5}
              />
            ) : (
              // Iconly "Hide" do Figma, pintado pela cor do botão.
              <span
                aria-hidden="true"
                className="block h-[13.33px] w-[15.38px] bg-current md:h-[14.65px] md:w-[18.98px]"
                style={{
                  maskImage: 'url(/icons/password-hide.svg)',
                  maskSize: '100% 100%',
                  maskRepeat: 'no-repeat',
                }}
              />
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-[13px] leading-4 text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
