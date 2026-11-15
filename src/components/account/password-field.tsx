import { useId, useState } from 'react'
import { EyeIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PasswordFieldProps extends Omit<
  React.ComponentProps<'input'>,
  'id' | 'type'
> {
  label: string
  error?: string
}

/**
 * "Password Input" do perfil no Figma: label de 15 px, 12 px, caixa 40 px com
 * recuo de 16 e o ícone "Hide" que alterna a visibilidade.
 */
export function PasswordField({ label, error, ...props }: PasswordFieldProps) {
  const id = useId()
  const errorId = `${id}-erro`
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <Label
        htmlFor={id}
        className="text-[15px] leading-[15px] font-normal text-foreground"
      >
        {label}
      </Label>
      <div>
        <div className="relative">
          <Input
            id={id}
            type={revealed ? 'text' : 'password'}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="h-10 rounded-[3px] border-border bg-transparent pr-12 pl-4 text-sm leading-[15px] text-foreground focus-visible:border-primary focus-visible:ring-0 aria-invalid:border-destructive dark:bg-transparent"
            {...props}
          />
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
            className="focus-ring absolute top-1/2 right-2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-sm text-brand-secondary hover:text-text-secondary"
          >
            {revealed ? (
              <EyeIcon
                aria-hidden="true"
                className="size-[18px]"
                strokeWidth={1.5}
              />
            ) : (
              <span
                aria-hidden="true"
                className="block h-[14.65px] w-[18.98px] bg-current"
                style={{
                  maskImage: 'url(/icons/password-hide.svg)',
                  maskSize: '100% 100%',
                  maskRepeat: 'no-repeat',
                }}
              />
            )}
          </button>
        </div>
        {error && (
          <p
            id={errorId}
            className="mt-1.5 text-[13px] leading-4 text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
