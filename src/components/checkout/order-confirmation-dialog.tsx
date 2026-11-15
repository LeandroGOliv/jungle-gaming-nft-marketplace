import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { PROVIDER_LABELS } from '@/components/account/labels'
import { NETWORK_LABELS } from '@/components/catalog/labels'
import { MAIN_CONTENT_ID } from '@/components/layout/skip-link'
import { MaskIcon } from '@/components/layout/mask-icon'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrder } from '@/hooks/use-order'
import { describeRequestError, getApiError } from '@/lib/http-error'
import { cn } from '@/lib/utils'
import type { Order } from '@/types/order'
import { compareEth, formatEth } from '@/utils/eth'
import { formatOrderDate, shortenHash } from '@/utils/order'

interface OrderConfirmationDialogProps {
  orderId: string | undefined
  onClose: () => void
}

/**
 * Resultado do pedido sobre o pagamento, aberto por `?pedido=<id>` (acesso
 * direto e refresh funcionam). Tudo vem do pedido devolvido pela API: o recibo
 * só aparece quando a simulação confirmou, e os valores são os do snapshot.
 */
export function OrderConfirmationDialog({
  orderId,
  onClose,
}: OrderConfirmationDialogProps) {
  return (
    <Dialog
      open={orderId !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      {orderId !== undefined && <OrderDialogContent orderId={orderId} />}
    </Dialog>
  )
}

function OrderDialogContent({ orderId }: { orderId: string }) {
  const order = useOrder(orderId)
  const returnFocus = useRef<HTMLElement | null>(null)

  let body: React.ReactNode
  if (order.data) {
    body = <OrderResult order={order.data} refreshing={order.isFetching} />
  } else if (order.isError) {
    const missing = getApiError(order.error)?.status === 404
    body = (
      <StateBlock
        title={
          missing
            ? 'Pedido não encontrado'
            : 'Não foi possível carregar o pedido'
        }
        description={
          missing
            ? 'Este pedido não existe ou pertence a outra conta.'
            : describeRequestError(order.error)
        }
      >
        {!missing && (
          <Button
            className="h-12 px-4 text-base font-bold"
            onClick={() => void order.refetch()}
          >
            Tentar novamente
          </Button>
        )}
      </StateBlock>
    )
  } else {
    body = <OrderSkeleton />
  }

  return (
    <DialogContent
      showCloseButton={false}
      aria-busy={order.isPending}
      onOpenAutoFocus={() => {
        returnFocus.current = document.activeElement as HTMLElement | null
      }}
      onCloseAutoFocus={(event) => {
        // Aberto pela URL ou por um envio que sumiu da tela: o foco vai ao conteúdo.
        const target = returnFocus.current
        event.preventDefault()
        const destination =
          target && target !== document.body && target.isConnected
            ? target
            : document.getElementById(MAIN_CONTENT_ID)
        destination?.focus()
      }}
      className={cn(
        // Mobile: tela cheia, como o login (não há frame mobile do recibo).
        'flex max-w-none flex-col gap-0 overflow-y-auto rounded-none bg-card p-0 sm:max-w-none max-md:inset-0 max-md:translate-x-0 max-md:translate-y-0',
        // Desktop: os 578 px do Figma a 166 px do topo, subindo e rolando por
        // dentro quando a altura (ou o zoom) não comporta.
        'md:top-[min(166px,max(24px,calc(100dvh_-_845px)))] md:max-h-[calc(100dvh_-_48px)] md:w-[578px] md:translate-y-0',
      )}
    >
      {body}
      <span aria-hidden="true" className="mt-auto h-2.5 shrink-0 bg-primary" />
      <DialogClose className="focus-ring absolute top-4 right-4 grid size-8 place-items-center rounded-sm md:top-[9px] md:right-[5px]">
        <MaskIcon
          src="/icons/close.svg"
          width={18}
          height={18}
          className="text-primary"
        />
        <span className="sr-only">Fechar</span>
      </DialogClose>
    </DialogContent>
  )
}

const HEADER_COPY: Record<
  Order['status'],
  { title: string; description: string }
> = {
  pending: {
    title: 'Aguardando a confirmação do pagamento',
    description:
      'O pedido foi criado e a simulação está processando o pagamento. Você pode fechar esta janela: o resultado continua disponível neste endereço.',
  },
  confirmed: {
    title: 'Seus NFTs agora estão na sua carteira',
    description: 'Pagamento confirmado. Confira o recibo do pedido.',
  },
  refused: {
    title: 'Pagamento recusado',
    description:
      'Nenhum valor foi cobrado e os itens continuam no seu carrinho.',
  },
}

function OrderResult({
  order,
  refreshing,
}: {
  order: Order
  refreshing: boolean
}) {
  const copy = HEADER_COPY[order.status]
  return (
    <>
      <header className="flex min-h-[156px] flex-col items-center justify-center gap-4 px-12 pt-16 pb-6 text-center md:py-[22px]">
        <StatusMark status={order.status} />
        <DialogTitle className="text-base leading-4 font-bold text-text-secondary">
          {copy.title}
        </DialogTitle>
        <DialogDescription
          className={cn(
            'text-sm leading-[22px] text-text-secondary',
            order.status === 'confirmed' && 'sr-only',
          )}
        >
          {order.status === 'refused' && order.refusalReason
            ? `${order.refusalReason} ${copy.description}`
            : copy.description}
        </DialogDescription>
        {/* Reconciliação em segundo plano (após reconectar, ou a checagem periódica). */}
        <p
          aria-hidden="true"
          className={cn(
            'text-xs text-brand-secondary transition-opacity',
            refreshing && order.status === 'pending'
              ? 'opacity-100'
              : 'opacity-0',
          )}
        >
          Atualizando…
        </p>
      </header>
      <hr className="h-px shrink-0 border-0 bg-primary" />
      <TransactionMeta order={order} />
      <hr className="h-px shrink-0 border-0 bg-primary" />
      <section
        aria-labelledby="order-details-title"
        className="flex flex-col gap-3 px-6 pt-5 pb-12 md:px-11"
      >
        <h3
          id="order-details-title"
          className="text-[15px] leading-4 font-bold text-foreground"
        >
          Detalhes da transação
        </h3>
        <OrderTable order={order} />
        <hr className="mt-3 h-px border-0 bg-primary/30" />
        <OrderFooter order={order} />
      </section>
    </>
  )
}

function StatusMark({ status }: { status: Order['status'] }) {
  if (status === 'confirmed') {
    return (
      <MaskIcon
        src="/icons/thank-you.svg"
        width={80}
        height={80}
        className="text-primary"
      />
    )
  }
  if (status === 'pending') {
    return (
      <span
        aria-hidden="true"
        className="size-20 rounded-full border-4 border-primary/30 border-t-primary motion-safe:animate-spin motion-safe:[animation-duration:1.4s]"
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className="grid size-20 place-items-center rounded-full border-4 border-text-coral text-[40px] leading-none font-bold text-text-coral"
    >
      !
    </span>
  )
}

function TransactionMeta({ order }: { order: Order }) {
  const items = [
    {
      label: 'ID da transação',
      value: order.transactionHash
        ? shortenHash(order.transactionHash)
        : order.status === 'pending'
          ? 'Aguardando'
          : 'Não gerada',
      title: order.transactionHash ?? undefined,
      bold: true,
    },
    { label: 'Data', value: formatOrderDate(order.createdAt) },
    { label: 'Total', value: formatEth(order.totalEth) },
    { label: 'Carteira', value: PROVIDER_LABELS[order.provider] },
  ]
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-4 px-6 py-[14.5px] md:flex md:items-center md:gap-0 md:px-9">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            'flex min-w-0 flex-col',
            index > 0 &&
              'md:ml-[17.5px] md:border-l md:border-primary md:pl-[17.5px] md:[border-image:linear-gradient(transparent_2.5px,var(--primary)_2.5px,var(--primary)_33.5px,transparent_33.5px)_1]',
          )}
        >
          <dt
            className={cn(
              'text-sm leading-4 whitespace-nowrap text-text-secondary',
              item.bold && 'font-bold',
            )}
          >
            {item.label}
          </dt>
          <dd
            className={cn(
              'text-[15px] leading-5 break-words text-text-secondary',
              // Só o nome da carteira pode ser longo; o resto cabe numa linha.
              item.label !== 'Carteira' && 'whitespace-nowrap',
            )}
            title={item.title}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function OrderTable({ order }: { order: Order }) {
  const hasDiscount = compareEth(order.discountEth, '0') > 0
  return (
    <div className="flex flex-col gap-3">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Itens do pedido {order.id}</caption>
        <thead>
          <tr className="border-b border-primary/30 text-sm leading-4 text-foreground md:text-base">
            <th scope="col" className="pb-3 font-bold">
              NFTs
            </th>
            <th scope="col" className="pb-3 pl-2 text-right font-bold">
              Edições
            </th>
            <th
              scope="col"
              className="pb-3 pl-3 text-right font-medium md:pl-12"
            >
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={`${item.nftId}-${item.editionId}`}>
              <td className="pt-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <img
                    src={item.imageUrl}
                    alt=""
                    width={70}
                    height={70}
                    loading="lazy"
                    className="size-11 shrink-0 rounded-lg object-cover md:size-[70px]"
                  />
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-sm leading-4 font-bold text-foreground md:text-base">
                      {item.name}
                    </span>
                    <span className="text-xs leading-4 whitespace-nowrap text-brand-secondary md:text-sm">
                      ID do token: {item.tokenId}
                    </span>
                    <span className="text-xs leading-4 text-brand-secondary">
                      Edição {item.editionLabel}
                    </span>
                  </div>
                </div>
              </td>
              <td className="pt-3 pl-2 text-right text-sm leading-4 whitespace-nowrap text-text-secondary">
                <span aria-hidden="true">(x {item.quantity})</span>
                <span className="sr-only">
                  {item.quantity} {item.quantity === 1 ? 'unidade' : 'unidades'}
                </span>
              </td>
              <td className="pt-3 pl-3 text-right text-base leading-4 font-bold whitespace-nowrap text-text-accent md:pl-12 md:text-lg">
                {formatEth(item.lineTotalEth)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto flex w-full max-w-[321px] flex-col gap-3 text-foreground">
        {hasDiscount && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-[15px] leading-5">
              Desconto{order.couponCode ? ` (${order.couponCode})` : ''}
            </dt>
            <dd className="text-lg leading-4">
              − {formatEth(order.discountEth)}
            </dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-[15px] leading-5">Taxa de rede</dt>
          <dd className="text-lg leading-4">
            {formatEth(order.networkFeeEth)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-base leading-4 font-bold">Total</dt>
          <dd className="text-lg leading-4 font-bold text-text-accent">
            {formatEth(order.totalEth)}
          </dd>
        </div>
      </dl>
    </div>
  )
}

function OrderFooter({ order }: { order: Order }) {
  if (order.status === 'confirmed') {
    return (
      <div className="flex flex-col items-center gap-6 pt-3 md:gap-12">
        <p className="text-center text-sm leading-[22px] text-text-secondary">
          Transação confirmada na {NETWORK_LABELS[order.network]}. A propriedade
          foi transferida para sua carteira conectada e registrada na rede.
        </p>
        <div className="flex flex-col items-center gap-2">
          {/* Explorador simulado: o hash não existe em rede nenhuma. */}
          <Button
            asChild
            className="h-12 w-[186px] rounded-[5px] p-4 text-base leading-4 font-bold text-ink"
          >
            <Link
              to="/em-breve"
              search={{ secao: 'explorador-de-blocos' }}
              aria-describedby="order-explorer-note"
            >
              Ver no Etherscan
            </Link>
          </Button>
          <p
            id="order-explorer-note"
            className="text-center text-xs leading-4 text-brand-secondary"
          >
            Hash e explorador simulados: nenhuma transação real foi feita.
          </p>
        </div>
      </div>
    )
  }
  if (order.status === 'refused') {
    return (
      <div className="flex flex-col items-center gap-6 pt-3">
        <p className="text-center text-sm leading-[22px] text-text-secondary">
          Revise a carteira e tente de novo. Uma nova tentativa gera um novo
          pedido.
        </p>
        <DialogClose asChild>
          <Button className="h-12 rounded-[5px] p-4 text-base leading-4 font-bold text-ink">
            Voltar ao pagamento
          </Button>
        </DialogClose>
      </div>
    )
  }
  return (
    <p className="pt-3 text-center text-sm leading-[22px] text-text-secondary">
      Pedido {order.id}. Não envie a compra de novo: o resultado aparece aqui
      assim que a simulação responder.
    </p>
  )
}

function StateBlock({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-12 py-24 text-center md:min-h-[600px]">
      <DialogTitle className="text-base leading-4 font-bold text-foreground">
        {title}
      </DialogTitle>
      <DialogDescription className="text-sm leading-[22px] text-text-secondary">
        {description}
      </DialogDescription>
      {children}
    </div>
  )
}

const SHIMMER =
  'bg-[linear-gradient(90deg,var(--surface-dark)_0%,var(--border-soft)_50%,var(--surface-dark)_100%)]'

/** Mesmas alturas do recibo: o modal não muda de tamanho quando o pedido chega. */
function OrderSkeleton() {
  return (
    <>
      <DialogTitle className="sr-only">Carregando o pedido</DialogTitle>
      <DialogDescription className="sr-only">
        Buscando o estado do pedido.
      </DialogDescription>
      <div className="flex min-h-[156px] flex-col items-center justify-center gap-4 pt-16 pb-6 md:py-[22px]">
        <Skeleton className={cn('size-20 rounded-full', SHIMMER)} />
        <Skeleton className={cn('h-4 w-[356px] max-w-[80%]', SHIMMER)} />
      </div>
      <hr className="h-px shrink-0 border-0 bg-primary" />
      <div className="grid h-[65px] grid-cols-4 items-center gap-3 px-9">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className={cn('h-9', SHIMMER)} />
        ))}
      </div>
      <hr className="h-px shrink-0 border-0 bg-primary" />
      <div className="flex flex-col gap-3 px-6 pt-5 pb-12 md:px-11">
        <Skeleton className={cn('h-4 w-[190px]', SHIMMER)} />
        <Skeleton className={cn('h-4', SHIMMER)} />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className={cn('h-[70px]', SHIMMER)} />
        ))}
        <Skeleton
          className={cn('ml-auto h-12 w-[321px] max-w-full', SHIMMER)}
        />
        <Skeleton className={cn('mt-3 h-[134px]', SHIMMER)} />
      </div>
    </>
  )
}
