import { useId } from 'react'
import { PROVIDER_LABELS } from '@/components/account/labels'
import { MaskIcon } from '@/components/layout/mask-icon'
import { cn } from '@/lib/utils'
import type { ConnectionState } from '@/hooks/use-checkout'
import type { WalletProvider } from '@/types/wallet'

/** Ordem do Figma mobile; no desktop a primeira opção leva o selo dos três provedores. */
const OPTIONS: ReadonlyArray<{ value: WalletProvider; mark: string | null }> = [
  { value: 'walletconnect', mark: 'W' },
  { value: 'metamask', mark: 'M' },
  { value: 'coinbase', mark: null },
]

/** Situação mostrada para a opção escolhida; `idle` quando a conexão não vale para a seleção atual. */
export type ProviderStatus = ConnectionState['status'] | 'idle'

interface ProviderOptionsProps {
  value: WalletProvider | ''
  status: ProviderStatus
  message: string | null
  error?: string
  onSelect: (provider: WalletProvider) => void
  onRetry: () => void
  ref?: React.Ref<HTMLFieldSetElement>
}

const STATUS_TEXT: Partial<Record<ProviderStatus, string>> = {
  connecting: 'Conectando…',
  connected: 'Conectada',
  refused: 'Conexão recusada',
  disconnected: 'Desconectada',
  error: 'Falha ao conectar',
}

/**
 * "Carteira e rede": escolher o provedor conecta a carteira (simulação). O
 * estado da conexão aparece na opção escolhida, com nova tentativa quando a
 * carteira recusa ou cai.
 */
export function ProviderOptions({
  value,
  status,
  message,
  error,
  onSelect,
  onRetry,
  ref,
}: ProviderOptionsProps) {
  const name = useId()
  const statusId = `${name}-status`
  const errorId = `${name}-erro`
  const canRetry =
    status === 'refused' || status === 'disconnected' || status === 'error'

  return (
    <fieldset
      ref={ref}
      tabIndex={-1}
      aria-describedby={cn(value && statusId, error && errorId) || undefined}
      className="flex min-w-0 flex-col gap-4 outline-none"
    >
      <legend className="mb-4 w-full text-base leading-4 font-bold text-foreground md:text-center md:text-[17px]">
        Carteira e rede
      </legend>
      {OPTIONS.map((option, index) => {
        const checked = value === option.value
        const label = PROVIDER_LABELS[option.value]
        return (
          <label
            key={option.value}
            className={cn(
              'relative flex cursor-pointer items-center gap-[11px] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary',
              // Mobile: card 65 de altura com marca; desktop: linha 45 com borda.
              'h-[65px] rounded-[15px] bg-card pr-[17px] pl-[14px] shadow-[0_0_20px_rgb(10_6_4/0.45)]',
              'md:h-[45px] md:rounded-[3px] md:border md:bg-transparent md:pl-3 md:shadow-none',
              checked ? 'md:border-primary' : 'md:border-border',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onSelect(option.value)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-[#2f1d15] text-sm leading-[18px] font-bold text-text-accent md:hidden"
            >
              {option.mark ?? (
                <MaskIcon
                  src="/icons/account-wallets.svg"
                  width={18}
                  height={18}
                />
              )}
            </span>
            <Radio
              checked={checked}
              className="max-md:order-last max-md:ml-auto"
            />
            {index === 0 ? (
              <>
                <span className="text-sm leading-4 text-foreground md:sr-only">
                  {label}
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-[26px] items-center rounded-[6px] border border-[#55321f] bg-[#38220f] px-2 text-[9px] leading-3 font-bold tracking-normal text-text-accent max-md:hidden"
                >
                  METAMASK&nbsp;&nbsp;•&nbsp;&nbsp;WALLETCONNECT&nbsp;&nbsp;•&nbsp;&nbsp;COINBASE
                </span>
              </>
            ) : (
              <span className="text-sm leading-4 text-foreground md:text-[15px] md:leading-5">
                {label}
              </span>
            )}
            {checked && STATUS_TEXT[status] && (
              <span
                className={cn(
                  'text-xs leading-4 max-md:absolute max-md:bottom-2 max-md:left-[65px] md:ml-auto',
                  status === 'connected'
                    ? 'text-text-accent'
                    : status === 'connecting'
                      ? 'text-text-secondary'
                      : 'text-text-coral',
                )}
              >
                {STATUS_TEXT[status]}
              </span>
            )}
          </label>
        )
      })}
      <p id={statusId} aria-live="polite" className="sr-only">
        {value ? (STATUS_TEXT[status] ?? 'Carteira não conectada.') : ''}
      </p>
      {canRetry && message && (
        <div className="flex items-start justify-between gap-3 text-sm leading-5">
          <p className="text-text-coral">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="focus-ring shrink-0 cursor-pointer rounded-sm font-bold text-text-accent hover:underline"
          >
            {status === 'disconnected' ? 'Reconectar' : 'Tentar novamente'}
          </button>
        </div>
      )}
      {status === 'idle' && value && (
        <div className="flex items-center justify-between gap-3 text-sm leading-5">
          <p className="text-text-secondary">Carteira não conectada.</p>
          <button
            type="button"
            onClick={onRetry}
            className="focus-ring shrink-0 cursor-pointer rounded-sm font-bold text-text-accent hover:underline"
          >
            Conectar
          </button>
        </div>
      )}
      {error && (
        <p id={errorId} className="text-[13px] leading-4 text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  )
}

/** Radio do Figma: 16 px, contorno 1,2 `primary` (mobile apagado `#55321f`), ponto 10 quando marcado. */
export function Radio({
  checked,
  className,
}: {
  checked: boolean
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-full border-[1.2px]',
        checked ? 'border-primary' : 'border-[#55321f] md:border-primary',
        className,
      )}
    >
      {checked && <span className="size-2.5 rounded-full bg-primary" />}
    </span>
  )
}
