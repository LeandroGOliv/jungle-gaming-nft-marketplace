import { useId, useRef, useState } from 'react'
import { NETWORK_LABELS } from '@/components/catalog/labels'
import { PROVIDER_LABELS, SLOT_TITLES, shortAddress } from './labels'
import { WalletForm } from './wallet-form'
import type { Wallet, WalletSlot } from '@/types/wallet'

const DESCRIPTION: Record<WalletSlot, string> = {
  primary:
    'Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.',
  secondary: 'Você ainda não adicionou uma carteira secundária.',
}

const LINK_BUTTON =
  'focus-ring cursor-pointer rounded-sm text-base leading-4 font-medium text-text-accent hover:underline'

interface WalletSectionProps {
  slot: WalletSlot
  wallet: Wallet | undefined
  userId: string
}

/**
 * Uma posição de carteira. Sem carteira principal, o formulário fica aberto
 * (o estado desenhado no Figma); com carteira, mostra o resumo e "Editar".
 */
export function WalletSection({ slot, wallet, userId }: WalletSectionProps) {
  const alwaysOpen = slot === 'primary' && !wallet
  const [editing, setEditing] = useState(false)
  const open = alwaysOpen || editing
  const formId = useId()
  const headingId = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const sectionRef = useRef<HTMLElement>(null)

  const focusFirstField = () =>
    requestAnimationFrame(() =>
      sectionRef.current?.querySelector<HTMLElement>('form input')?.focus(),
    )

  const close = () => {
    setEditing(false)
    requestAnimationFrame(() => toggleRef.current?.focus())
  }

  const toggleLabel = alwaysOpen
    ? 'Adicionar'
    : editing
      ? 'Cancelar'
      : wallet
        ? 'Editar'
        : 'Adicionar'

  return (
    <section
      ref={sectionRef}
      aria-labelledby={headingId}
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col gap-2 md:gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <h2
            id={headingId}
            className="text-[17px] leading-4 font-bold text-foreground"
          >
            {SLOT_TITLES[slot]}
          </h2>
          <div className="flex items-center gap-2">
            {slot === 'secondary' && <SameAsPrimary />}
            <button
              ref={toggleRef}
              type="button"
              className={LINK_BUTTON}
              aria-expanded={alwaysOpen ? undefined : open}
              aria-controls={open ? formId : undefined}
              aria-label={`${toggleLabel} ${SLOT_TITLES[slot].toLowerCase()}`}
              onClick={() => {
                if (alwaysOpen) return focusFirstField()
                if (editing) return close()
                setEditing(true)
                focusFirstField()
              }}
            >
              {toggleLabel}
            </button>
          </div>
        </div>
        {(slot === 'primary' || (!wallet && !open)) && (
          <p className="text-sm leading-[15px] text-text-secondary">
            {DESCRIPTION[slot]}
          </p>
        )}
      </div>

      {open ? (
        <WalletForm
          id={formId}
          userId={userId}
          slot={slot}
          wallet={wallet}
          onSaved={close}
        />
      ) : (
        wallet && <WalletSummary wallet={wallet} />
      )}
    </section>
  )
}

/**
 * "Igual à carteira principal" está no Figma, mas o enunciado não descreve
 * esse vínculo: fica visível e desabilitado, sem aparentar funcionar.
 */
function SameAsPrimary() {
  const id = useId()
  return (
    <span className="flex items-center gap-2 text-sm leading-4 text-foreground opacity-60">
      <input
        id={id}
        type="checkbox"
        disabled
        aria-describedby={`${id}-nota`}
        className="size-4 appearance-none rounded-full border-[1.5px] border-primary"
      />
      <label htmlFor={id}>Igual à carteira principal</label>
      <span id={`${id}-nota`} className="sr-only">
        (indisponível nesta versão)
      </span>
    </span>
  )
}

function WalletSummary({ wallet }: { wallet: Wallet }) {
  const rows: Array<[string, React.ReactNode]> = [
    ['Apelido', wallet.alias],
    ['Rede', NETWORK_LABELS[wallet.network]],
    ['Tipo de carteira', PROVIDER_LABELS[wallet.provider]],
    [
      'Endereço',
      <>
        <span className="md:hidden">{shortAddress(wallet.address)}</span>
        <span className="break-all max-md:hidden">{wallet.address}</span>
      </>,
    ],
    ['Nome ENS', `${wallet.ensName}.eth`],
  ]
  return (
    <dl className="grid grid-cols-1 gap-x-7 gap-y-4 rounded-[3px] border border-border p-4 sm:grid-cols-2 md:p-5">
      {rows.map(([term, value]) => (
        <div key={term} className="flex min-w-0 flex-col gap-1.5">
          <dt className="text-sm leading-[15px] text-text-secondary">{term}</dt>
          <dd className="text-[15px] leading-[18px] text-foreground">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
