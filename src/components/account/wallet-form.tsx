import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormAlert } from '@/components/auth/auth-form-parts'
import { NETWORK_LABELS } from '@/components/catalog/labels'
import { Button } from '@/components/ui/button'
import { useSaveWallet } from '@/hooks/use-wallets'
import { applyApiFieldErrors } from '@/lib/form-errors'
import { describeRequestError, isUnauthorized } from '@/lib/http-error'
import { walletSchema } from '@/schemas/wallet'
import { BLOCKCHAIN_NETWORKS } from '@/types/nft'
import { WALLET_PROVIDERS } from '@/types/wallet'
import { EnsField, WalletInputField, WalletSelectField } from './wallet-fields'
import { PROVIDER_LABELS } from './labels'
import type { WalletFormOutput, WalletFormValues } from '@/schemas/wallet'
import type { Wallet, WalletInput, WalletSlot } from '@/types/wallet'

const API_FIELDS = [
  'displayName',
  'alias',
  'network',
  'profileName',
  'address',
  'secondaryAddress',
  'provider',
  'referralCode',
  'email',
  'ensName',
] as const satisfies ReadonlyArray<keyof WalletFormValues>

const NETWORK_OPTIONS = BLOCKCHAIN_NETWORKS.map((value) => ({
  value,
  label: NETWORK_LABELS[value],
}))

const PROVIDER_OPTIONS = WALLET_PROVIDERS.map((value) => ({
  value,
  label: PROVIDER_LABELS[value],
}))

function toFormValues(wallet: Wallet | undefined): WalletFormValues {
  return {
    displayName: wallet?.displayName ?? '',
    alias: wallet?.alias ?? '',
    network: wallet?.network ?? '',
    profileName: wallet?.profileName ?? '',
    address: wallet?.address ?? '',
    secondaryAddress: wallet?.secondaryAddress ?? '',
    provider: wallet?.provider ?? '',
    referralCode: wallet?.referralCode ?? '',
    email: wallet?.email ?? '',
    ensName: wallet?.ensName ?? '',
  }
}

function toInput(values: WalletFormOutput): WalletInput {
  return {
    ...values,
    secondaryAddress: values.secondaryAddress || null,
    referralCode: values.referralCode.toUpperCase(),
  }
}

interface WalletFormProps {
  id: string
  userId: string
  slot: WalletSlot
  wallet: Wallet | undefined
  onSaved: () => void
}

/** Formulário "Carteira principal" do Figma, usado também pela secundária. */
export function WalletForm({
  id,
  userId,
  slot,
  wallet,
  onSaved,
}: WalletFormProps) {
  const save = useSaveWallet(userId)
  const form = useForm<WalletFormValues, unknown, WalletFormOutput>({
    resolver: zodResolver(walletSchema),
    defaultValues: toFormValues(wallet),
  })

  const submit = form.handleSubmit((values) => {
    if (save.isPending) return
    save.mutate(
      { slot, walletId: wallet?.id ?? null, input: toInput(values) },
      {
        onSuccess: onSaved,
        onError: (error) => {
          // 422 da API (código de indicação, endereço repetido) aponta o campo.
          if (applyApiFieldErrors(error, API_FIELDS, form.setError)) {
            save.reset()
          }
        },
      },
    )
  })

  // O 401 já encerra a sessão e abre o login; repetir o aviso confundiria.
  const formError =
    save.isError && !isUnauthorized(save.error)
      ? describeRequestError(save.error)
      : null

  return (
    <form
      id={id}
      noValidate
      onSubmit={submit}
      aria-label={`Dados da carteira ${slot === 'primary' ? 'principal' : 'secundária'}`}
      className="flex flex-col gap-8"
    >
      <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2">
        <Controller
          control={form.control}
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
          control={form.control}
          name="alias"
          render={({ field, fieldState }) => (
            <WalletInputField
              {...field}
              label="Apelido da carteira"
              required
              autoComplete="off"
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="network"
          render={({ field, fieldState }) => (
            <WalletSelectField
              {...field}
              label="Rede"
              placeholder="Selecione uma rede"
              options={NETWORK_OPTIONS}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="profileName"
          render={({ field, fieldState }) => (
            <WalletInputField
              {...field}
              label="Nome do perfil"
              required
              autoComplete="username"
              autoCapitalize="none"
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="address"
          render={({ field, fieldState }) => (
            <WalletInputField
              {...field}
              label="Endereço da carteira"
              required
              placeholder="Endereço 0x da carteira"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
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
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
          control={form.control}
          name="ensName"
          render={({ field, fieldState }) => (
            <EnsField
              {...field}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      <div className="flex flex-col items-start gap-3">
        <FormAlert message={formError} />
        <Button
          type="submit"
          // Como no login: `aria-disabled` mantém o foco no botão durante o envio.
          aria-disabled={save.isPending || undefined}
          aria-busy={save.isPending || undefined}
          className="h-10 rounded-[3px] px-0.5 text-sm leading-4 font-bold text-ink hover:bg-primary/90 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 max-md:w-full md:w-[131px]"
        >
          {save.isPending ? 'Salvando…' : 'Salvar carteira'}
        </Button>
      </div>
    </form>
  )
}
