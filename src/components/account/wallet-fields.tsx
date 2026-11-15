import { useId } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// Caixa dos campos do Figma: 40 px, borda `border-strong`, raio 3, texto a 13 px.
const BOX =
  'h-10 rounded-[3px] border-border bg-transparent px-[13px] text-sm leading-[15px] text-foreground focus-visible:border-primary focus-visible:ring-0 aria-invalid:border-destructive dark:bg-transparent'

const ARROW = (
  <img
    src="/icons/select-arrow-down.svg"
    alt=""
    width={20}
    height={20}
    aria-hidden="true"
    className="pointer-events-none shrink-0"
  />
)

interface FieldShellProps {
  id: string
  label: string
  /** Label só para leitores de tela (o campo opcional do Figma não tem rótulo). */
  hiddenLabel?: boolean
  required?: boolean
  error?: string
  children: React.ReactNode
}

/** Label com asterisco coral, campo e erro associado, na métrica do Figma. */
function FieldShell({
  id,
  label,
  hiddenLabel,
  required,
  error,
  children,
}: FieldShellProps) {
  return (
    <div className="flex min-w-0 flex-col">
      <Label
        htmlFor={id}
        className={cn(
          'flex h-[29px] items-center gap-0 text-[15px] leading-[15px] font-normal text-foreground',
          // Mantém o alinhamento da linha no desktop mesmo sem rótulo visível.
          hiddenLabel && 'sr-only md:not-sr-only md:invisible md:h-[29px]',
        )}
      >
        {label}
        {required && (
          <span
            aria-hidden="true"
            className="text-[22px] leading-[29px] text-destructive"
          >
            *
          </span>
        )}
      </Label>
      <div className="-mt-1">{children}</div>
      {error && (
        <p
          id={`${id}-erro`}
          className="mt-1.5 text-[13px] leading-4 text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  )
}

interface WalletInputFieldProps extends Omit<
  React.ComponentProps<'input'>,
  'id'
> {
  label: string
  hiddenLabel?: boolean
  error?: string
}

export function WalletInputField({
  label,
  hiddenLabel,
  error,
  required,
  className,
  ...props
}: WalletInputFieldProps) {
  const id = useId()
  return (
    <FieldShell
      id={id}
      label={label}
      hiddenLabel={hiddenLabel}
      required={required}
      error={error}
    >
      <Input
        id={id}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-erro` : undefined}
        className={cn(BOX, 'placeholder:text-brand-secondary', className)}
        {...props}
      />
    </FieldShell>
  )
}

interface WalletSelectFieldProps<TValue extends string> {
  label: string
  placeholder: string
  options: ReadonlyArray<{ value: TValue; label: string }>
  value: TValue | ''
  onChange: (value: TValue) => void
  onBlur: () => void
  name: string
  error?: string
  disabled?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

export function WalletSelectField<TValue extends string>({
  label,
  placeholder,
  options,
  value,
  onChange,
  onBlur,
  name,
  error,
  disabled,
  ref,
}: WalletSelectFieldProps<TValue>) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} required error={error}>
      <Select
        name={name}
        value={value}
        onValueChange={(next) => onChange(next as TValue)}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          ref={ref}
          onBlur={onBlur}
          aria-required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-erro` : undefined}
          className={cn(
            BOX,
            'w-full border pr-2 data-placeholder:text-brand-secondary data-[size=default]:h-10 [&>svg]:hidden',
          )}
        >
          <SelectValue placeholder={placeholder} />
          {ARROW}
        </SelectTrigger>
        <SelectContent
          position="popper"
          className="rounded-[3px] border border-border bg-card"
        >
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-sm text-foreground focus:bg-surface-dark"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  )
}

interface EnsFieldProps extends Omit<React.ComponentProps<'input'>, 'id'> {
  error?: string
}

/**
 * "Nome ENS": sufixo `.eth` (único domínio aceito, por isso fixo) ao lado do
 * campo, nas larguras do Figma (78 + 10 + 329).
 */
export function EnsField({ error, className, ...props }: EnsFieldProps) {
  const id = useId()
  return (
    <FieldShell id={id} label="Nome ENS" required error={error}>
      <div className="flex gap-2.5">
        <span
          className="flex h-10 w-[78px] shrink-0 items-center justify-between rounded-[3px] border border-border pr-[5px] pl-2.5 text-[15px] leading-[15px] text-foreground"
          title="Domínio do nome ENS"
        >
          .eth
          {ARROW}
        </span>
        <Input
          id={id}
          aria-required
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(`${id}-sufixo`, error && `${id}-erro`)}
          className={cn(BOX, 'min-w-0 flex-1', className)}
          {...props}
        />
        <span id={`${id}-sufixo`} className="sr-only">
          O nome termina em .eth
        </span>
      </div>
    </FieldShell>
  )
}
