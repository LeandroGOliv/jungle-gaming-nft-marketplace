import { Link } from '@tanstack/react-router'
import { MaskIcon } from '@/components/layout/mask-icon'
import { QuantityStepper } from '@/components/nft-detail/quantity-stepper'
import { useRemoveCartItem, useUpdateCartItem } from '@/hooks/use-cart'
import { cn } from '@/lib/utils'
import type { CartLine as CartLineData, QuoteIssue } from '@/types/cart'
import { formatEth } from '@/utils/eth'

/**
 * Colunas da tabela do Figma (782 de largura, 24 de respiro à direita):
 * NFT 311.25 · Preço 138.25 · Edições 136.25 · Total 148.25 · remover 24.
 */
export const CART_COLUMNS = 'md:grid-cols-[311fr_138fr_136fr_148fr_24px]'

function describeIssue(issue: QuoteIssue) {
  return issue.kind === 'unavailable'
    ? 'Esta edição esgotou. Remova o item para continuar.'
    : `Só ${issue.available === 1 ? 'resta 1 unidade' : `restam ${issue.available} unidades`} desta edição. Diminua a quantidade para continuar.`
}

interface CartLineProps {
  line: CartLineData
  issue?: QuoteIssue
}

/**
 * Item do carrinho. Desktop: linha da tabela (70 px). Mobile: card de 100 px
 * com a edição e o total da linha, como no frame mobile.
 */
export function CartLine({ line, issue }: CartLineProps) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const busy = update.isPending || remove.isPending
  const issueId = `cart-issue-${line.nftId}-${line.editionId}`
  const target = {
    nftId: line.nftId,
    editionId: line.editionId,
    nftName: line.name,
  }
  const changeQuantity = (quantity: number) => {
    if (quantity === line.quantity || busy) return
    update.mutate({ ...target, quantity })
  }
  const stepperProps = {
    value: line.quantity,
    // Disponibilidade abaixo da quantidade: o "+" trava e o "−" segue livre.
    max: line.available,
    onChange: changeQuantity,
    disabled: busy,
    label: `Quantidade de ${line.name}, edição ${line.editionLabel}`,
  }

  return (
    <li
      aria-busy={busy}
      aria-describedby={issue ? issueId : undefined}
      className="flex flex-col gap-2"
    >
      <div
        className={cn(
          'relative grid grid-cols-[100px_minmax(0,1fr)_auto] items-center rounded-[14px] bg-card shadow-[0_6px_20px_rgb(10_6_4/0.45)] transition-opacity motion-reduce:transition-none md:h-[70px] md:rounded-none md:pr-6 md:shadow-none',
          CART_COLUMNS,
          busy && 'opacity-70',
          issue && 'ring-1 ring-text-coral',
        )}
      >
        {/* NFT: arte + nome + token (desktop) ou edição + total (mobile). */}
        <div className="contents md:flex md:items-center md:gap-4">
          <img
            src={line.image.smallUrl}
            alt=""
            width={100}
            height={100}
            className="size-[100px] rounded-l max-md:self-start-[14px] object-cover md:size-[70px] md:rounded-[6px]"
          />
          <div className="flex min-w-0 flex-col py-3 pl-[9px] md:gap-1.5 md:p-0">
            <h3 className="line-clamp-2 text-[15px] break-words leading-4 font-bold text-foreground md:text-base">
              <Link
                to="/nft/$nftId"
                params={{ nftId: line.nftId }}
                className="focus-ring rounded-sm hover:text-text-accent"
              >
                {line.name}
              </Link>
            </h3>
            <p className="mt-1.5 text-sm leading-4 text-text-secondary md:hidden">
              Edição: {line.editionLabel}
            </p>
            <p className="text-sm leading-4 text-brand-secondary max-md:hidden">
              ID do token: {line.tokenId} · {line.editionLabel}
            </p>
            <p className="mt-[18px] text-lg leading-4 font-bold text-text-accent md:hidden">
              <span className="sr-only">Total do item: </span>
              {formatEth(line.lineTotalEth)}
            </p>
          </div>
        </div>

        <p className="text-base leading-4 font-bold text-text-secondary max-md:hidden">
          <span className="sr-only">Preço por unidade: </span>
          {formatEth(line.unitPriceEth)}
        </p>

        <div className="pr-4 md:pr-0">
          <QuantityStepper
            {...stepperProps}
            size="cart-mobile"
            className="md:hidden"
          />
          <QuantityStepper
            {...stepperProps}
            size="cart"
            className="max-md:hidden"
          />
        </div>

        <p className="text-base leading-4 font-bold text-text-accent max-md:hidden">
          <span className="sr-only">Total do item: </span>
          {formatEth(line.lineTotalEth)}
        </p>

        <button
          type="button"
          onClick={() => remove.mutate(target)}
          disabled={busy}
          aria-label={`Remover ${line.name}, edição ${line.editionLabel}, do carrinho`}
          className="focus-ring absolute top-1.5 right-2.5 grid size-6 cursor-pointer place-items-center rounded-sm text-brand-secondary hover:text-text-accent disabled:cursor-not-allowed disabled:opacity-50 md:static"
        >
          <MaskIcon src="/icons/cart-delete.svg" width={24} height={24} />
        </button>
      </div>
      {issue && (
        <p id={issueId} className="text-sm leading-5 text-text-coral">
          {describeIssue(issue)}
        </p>
      )}
    </li>
  )
}
