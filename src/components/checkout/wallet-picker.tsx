import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import { WalletSelectField } from '@/components/account/wallet-fields'
import { shortAddress } from '@/components/account/labels'
import { NETWORK_LABELS } from '@/components/catalog/labels'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Radio } from './provider-options'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Wallet, WalletsResponse } from '@/types/wallet'

const SLOT_NAMES = { primary: 'Principal', secondary: 'Reserva' } as const

const walletLabel = (wallet: Wallet) =>
  `${SLOT_NAMES[wallet.slot]} — ${wallet.alias}`

interface WalletPickerProps {
  wallets: UseQueryResult<WalletsResponse>
  value: string | null
  onChange: (walletId: string) => void
}

/**
 * Carteira cadastrada usada no pagamento. Mobile: os cards "Carteira
 * conectada" do Figma; desktop: um select no estilo dos campos (o frame
 * desktop não desenha a escolha).
 */
export function WalletPicker({ wallets, value, onChange }: WalletPickerProps) {
  const headingId = useId()

  if (wallets.isPending) {
    return (
      <div
        role="status"
        aria-label="Carregando carteiras"
        className="flex flex-col gap-5"
      >
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-[93px] rounded-[14px] md:h-10 md:rounded-[3px]" />
        <Skeleton className="h-[93px] rounded-[14px] md:hidden" />
      </div>
    )
  }

  if (wallets.isError && !wallets.data) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-sm leading-5 text-text-coral">
          Não foi possível carregar suas carteiras.
        </p>
        <Button
          variant="outline"
          className="h-9 px-4"
          onClick={() => void wallets.refetch()}
        >
          Tentar novamente
        </Button>
      </div>
    )
  }

  const list = wallets.data.wallets
  if (list.length === 0) {
    return (
      <p className="text-sm leading-5 text-text-secondary">
        Você ainda não tem carteiras cadastradas.{' '}
        <Link
          to="/carteiras"
          className="focus-ring rounded-sm font-bold text-text-accent hover:underline"
        >
          Cadastrar carteira
        </Link>{' '}
        ou informe outra carteira abaixo.
      </p>
    )
  }

  return (
    <>
      <section
        aria-labelledby={headingId}
        className="flex flex-col gap-4 md:hidden"
      >
        <div className="flex items-center justify-between gap-3">
          <h2
            id={headingId}
            className="text-base leading-4 font-bold text-foreground"
          >
            Carteira conectada
          </h2>
          <Link
            to="/carteiras"
            className="focus-ring rounded-sm text-sm leading-4 font-bold text-text-accent hover:underline"
          >
            Trocar carteira
          </Link>
        </div>
        <div
          role="radiogroup"
          aria-labelledby={headingId}
          className="flex flex-col gap-5"
        >
          {list.map((wallet) => {
            const checked = value === wallet.id
            return (
              <label
                key={wallet.id}
                className={cn(
                  'flex min-h-[93px] cursor-pointer items-center gap-[19px] rounded-[14px] bg-card px-[19px] py-[15px] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary',
                  checked && 'shadow-[0_20px_20px_rgb(10_6_4/0.45)]',
                )}
              >
                <input
                  type="radio"
                  name={`${headingId}-carteira`}
                  value={wallet.id}
                  checked={checked}
                  onChange={() => onChange(wallet.id)}
                  className="sr-only"
                />
                <Radio checked={checked} />
                <span className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-base leading-4 font-bold text-foreground">
                    {SLOT_NAMES[wallet.slot]}
                  </span>
                  <span className="truncate text-sm leading-[22px] text-text-secondary">
                    {wallet.secondaryAddress?.endsWith('.eth')
                      ? wallet.secondaryAddress
                      : shortAddress(wallet.address)}
                    <br />
                    Rede {NETWORK_LABELS[wallet.network]}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </section>

      <div className="max-md:hidden md:max-w-[370px]">
        <WalletSelectField
          name="carteira-cadastrada"
          label="Carteira cadastrada"
          placeholder="Selecione uma carteira"
          options={list.map((wallet) => ({
            value: wallet.id,
            label: walletLabel(wallet),
          }))}
          value={value ?? ''}
          onChange={onChange}
          onBlur={() => {}}
        />
      </div>
    </>
  )
}
