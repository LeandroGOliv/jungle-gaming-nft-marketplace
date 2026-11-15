import { useId } from 'react'
import { Controller } from 'react-hook-form'
import { PROVIDER_LABELS } from '@/components/account/labels'
import {
  EnsField,
  WalletInputField,
  WalletSelectField,
} from '@/components/account/wallet-fields'
import { NETWORK_LABELS } from '@/components/catalog/labels'
import { cn } from '@/lib/utils'
import { BLOCKCHAIN_NETWORKS } from '@/types/nft'
import { WALLET_PROVIDERS } from '@/types/wallet'
import type { Control } from 'react-hook-form'
import type { CheckoutFormOutput, CheckoutFormValues } from '@/schemas/checkout'

const NETWORK_OPTIONS = BLOCKCHAIN_NETWORKS.map((value) => ({
  value,
  label: NETWORK_LABELS[value],
}))

const PROVIDER_OPTIONS = WALLET_PROVIDERS.map((value) => ({
  value,
  label: PROVIDER_LABELS[value],
}))

/** Campos que descrevem a carteira cadastrada: fixos enquanto ela estiver escolhida. */
const LOCKED_HINT =
  'Vem da carteira cadastrada; marque "Usar outra carteira?" para alterar.'

interface CollectorFieldsProps {
  control: Control<CheckoutFormValues, unknown, CheckoutFormOutput>
  /** Carteira cadastrada escolhida: endereço, rede e ENS ficam somente leitura. */
  locked: boolean
  useOtherWallet: boolean
  onUseOtherWalletChange: (value: boolean) => void
  canUseRegistered: boolean
}

/** "Perfil do colecionador": grade 2 × 370 do Figma, observação e "Usar outra carteira?". */
export function CollectorFields({
  control,
  locked,
  useOtherWallet,
  onUseOtherWalletChange,
  canUseRegistered,
}: CollectorFieldsProps) {
  const otherId = useId()
  const lockedClass = locked
    ? 'read-only:text-text-secondary read-only:cursor-default'
    : undefined
  const lockedHint = locked ? LOCKED_HINT : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2 md:gap-y-3">
        <Controller
          control={control}
          name="displayName"
          render={({ field, fieldState }) => (
            <WalletInputField
              {...field}
              label="Nome de exibição"
              required
              autoComplete="name"
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="username"
          render={({ field, fieldState }) => (
            <WalletInputField
              {...field}
              label="Nome de usuário"
              required
              autoComplete="username"
              autoCapitalize="none"
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="network"
          render={({ field, fieldState }) => (
            <WalletSelectField
              {...field}
              label="Rede"
              placeholder="Selecione uma rede"
              options={NETWORK_OPTIONS}
              disabled={locked}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="profileName"
          render={({ field, fieldState }) => (
            <WalletInputField
              {...field}
              label="Nome do perfil"
              required
              autoComplete="off"
              autoCapitalize="none"
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="walletAddress"
          render={({ field, fieldState }) => (
            <WalletInputField
              {...field}
              label="Endereço da carteira"
              required
              placeholder="Endereço 0x da carteira"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              readOnly={locked}
              title={lockedHint}
              className={lockedClass}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="secondaryAddress"
          render={({ field, fieldState }) => (
            <WalletInputField
              {...field}
              label="ENS ou carteira secundária (opcional)"
              hiddenLabel
              placeholder="ENS ou carteira secundária (opcional)"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              readOnly={locked}
              title={lockedHint}
              className={lockedClass}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="provider"
          render={({ field, fieldState }) => (
            <WalletSelectField
              {...field}
              label="Tipo de carteira"
              placeholder="Selecione uma carteira"
              options={PROVIDER_OPTIONS}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="referralCode"
          render={({ field, fieldState }) => (
            <WalletInputField
              {...field}
              label="Código de indicação"
              required
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <WalletInputField
              {...field}
              label="E-mail"
              type="email"
              required
              autoComplete="email"
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="ensName"
          render={({ field, fieldState }) => (
            <EnsField
              {...field}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              readOnly={locked}
              title={lockedHint}
              className={lockedClass}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      {canUseRegistered && (
        <label
          htmlFor={otherId}
          className="flex w-fit cursor-pointer items-center gap-2 text-[15px] leading-5 text-foreground"
        >
          <input
            id={otherId}
            type="checkbox"
            checked={useOtherWallet}
            onChange={(event) => onUseOtherWalletChange(event.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="flex size-[15px] items-center justify-center rounded-full border-2 border-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary"
          >
            {useOtherWallet && (
              <span className="size-[7px] rounded-full bg-primary" />
            )}
          </span>
          Usar outra carteira?
        </label>
      )}

      <Controller
        control={control}
        name="note"
        render={({ field, fieldState }) => (
          <NoteField {...field} error={fieldState.error?.message} />
        )}
      />
    </div>
  )
}

interface NoteFieldProps extends Omit<React.ComponentProps<'textarea'>, 'id'> {
  error?: string
}

function NoteField({ error, className, ...props }: NoteFieldProps) {
  const id = useId()
  return (
    <div className="flex max-w-[350px] flex-col gap-3">
      <label
        htmlFor={id}
        className="text-[15px] leading-[15px] text-foreground"
      >
        Observação do colecionador (opcional)
      </label>
      <textarea
        id={id}
        rows={6}
        maxLength={300}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-erro` : undefined}
        className={cn(
          'focus-ring h-[152px] resize-none rounded-[3px] border border-border bg-transparent p-3 text-sm leading-5 text-foreground focus-visible:border-primary aria-invalid:border-destructive',
          className,
        )}
        {...props}
      />
      {error && (
        <p id={`${id}-erro`} className="text-[13px] leading-4 text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
