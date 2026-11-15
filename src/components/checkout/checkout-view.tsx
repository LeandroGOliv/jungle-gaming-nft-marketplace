import { useEffect, useId, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormAlert } from '@/components/auth/auth-form-parts'
import { MaskIcon } from '@/components/layout/mask-icon'
import { PageContainer } from '@/components/layout/page-container'
import { StateMessage } from '@/components/layout/state-message'
import { Button } from '@/components/ui/button'
import { useAnnounce } from '@/hooks/use-announce'
import {
  useCart,
  useCartKey,
  useCartQuote,
  useRevalidateCart,
} from '@/hooks/use-cart'
import { useWalletConnection } from '@/hooks/use-checkout'
import { useCreateOrder, usePendingOrderAttempt } from '@/hooks/use-order'
import { useSession } from '@/hooks/use-session'
import { useWallets } from '@/hooks/use-wallets'
import { checkoutDraft } from '@/lib/checkout-draft'
import { applyApiFieldErrors } from '@/lib/form-errors'
import {
  describeRequestError,
  getApiError,
  isUnauthorized,
} from '@/lib/http-error'
import { cn } from '@/lib/utils'
import { checkoutSchema } from '@/schemas/checkout'
import { CheckoutSkeleton } from './checkout-skeleton'
import { CollectorFields } from './collector-fields'
import { OrderConfirmationDialog } from './order-confirmation-dialog'
import { OrderItems, OrderTotals, OrderTotalsSkeleton } from './order-review'
import { ProviderOptions } from './provider-options'
import { QuoteChangesAlert } from './quote-changes-alert'
import { WalletPicker } from './wallet-picker'
import type { CheckoutFormOutput, CheckoutFormValues } from '@/schemas/checkout'
import type { User } from '@/types/user'
import type { Wallet } from '@/types/wallet'
import type { CreateWalletConnectionRequest } from '@/types/checkout'
import {
  describeReviewChanges,
  toReviewSnapshot,
} from '@/utils/checkout-review'
import type { ReviewSnapshot } from '@/utils/checkout-review'
import { formatEth } from '@/utils/eth'
import type { ProviderStatus } from './provider-options'

const FORM_FIELDS = [
  'displayName',
  'username',
  'network',
  'profileName',
  'walletAddress',
  'secondaryAddress',
  'provider',
  'referralCode',
  'email',
  'ensName',
  'note',
] as const satisfies ReadonlyArray<keyof CheckoutFormValues>

const EMPTY: CheckoutFormValues = {
  displayName: '',
  username: '',
  network: '',
  profileName: '',
  walletAddress: '',
  secondaryAddress: '',
  provider: '',
  referralCode: '',
  email: '',
  ensName: '',
  note: '',
}

/** Dados do colecionador a partir da carteira cadastrada e do perfil da sessão. */
function fromWallet(
  wallet: Wallet,
  user: User,
  current: CheckoutFormValues,
): CheckoutFormValues {
  return {
    displayName: wallet.displayName,
    username: current.username || user.username,
    network: wallet.network,
    profileName: wallet.profileName,
    walletAddress: wallet.address,
    secondaryAddress: wallet.secondaryAddress ?? '',
    provider: wallet.provider,
    referralCode: wallet.referralCode,
    email: wallet.email,
    ensName: wallet.ensName,
    note: current.note,
  }
}

function connectionTarget(
  values: Pick<CheckoutFormValues, 'walletAddress' | 'network' | 'provider'>,
): CreateWalletConnectionRequest | null {
  if (!/^0x[0-9a-fA-F]{40}$/.test(values.walletAddress.trim())) return null
  if (values.network === '' || values.provider === '') return null
  return {
    walletAddress: values.walletAddress.trim(),
    network: values.network,
    provider: values.provider,
  }
}

/** Pagamento: carrega carrinho, cotação e carteiras e decide o estado da tela. */
export function CheckoutView() {
  const { pedido } = useSearch({ from: '/_authenticated/pagamento' })
  const navigate = useNavigate()
  const session = useSession()
  const cart = useCart()
  const quote = useCartQuote(cart.data, cart.owner)
  const wallets = useWallets()

  let content: React.ReactNode
  if (
    cart.isPending ||
    wallets.isPending ||
    session.status !== 'authenticated'
  ) {
    content = <CheckoutSkeleton />
  } else if (cart.isError && !cart.data) {
    content = (
      <StateMessage title="Não foi possível carregar o pagamento">
        <p>{describeRequestError(cart.error)}</p>
        <div className="mt-6">
          <Button onClick={() => void cart.refetch()}>Tentar novamente</Button>
        </div>
      </StateMessage>
    )
  } else if (cart.data.items.length === 0) {
    content = (
      <StateMessage title="Seu carrinho está vazio">
        <p>Adicione NFTs ao carrinho para seguir para o pagamento.</p>
        <div className="mt-6">
          <Button asChild className="h-10 px-5 font-bold text-ink">
            <Link to="/" hash="catalogo">
              Explorar o mercado
            </Link>
          </Button>
        </div>
      </StateMessage>
    )
  } else {
    content = (
      <CheckoutForm
        user={session.user}
        cart={cart.data}
        cartFetching={cart.isFetching}
        quote={quote}
        wallets={wallets}
      />
    )
  }

  return (
    <PageContainer className="flex flex-col gap-4 px-7 pt-8 pb-16 md:gap-8 md:px-6 md:pb-24">
      <MobileHeader />
      <Breadcrumb />
      {content}
      <OrderConfirmationDialog
        orderId={pedido}
        onClose={() =>
          void navigate({
            to: '/pagamento',
            search: (prev) => ({ ...prev, pedido: undefined }),
            replace: true,
          })
        }
      />
      {pedido === undefined && <ResumeOrderAttempt />}
    </PageContainer>
  )
}

/**
 * Um envio ficou sem resposta antes do refresh (ou da queda): repete-se com a
 * mesma chave. Se o pedido existe, a API devolve o mesmo e o resultado abre;
 * se não chegou a ser criado, nada acontece além de liberar a tentativa.
 */
function ResumeOrderAttempt() {
  const pending = usePendingOrderAttempt()
  const createOrder = useCreateOrder()
  const started = useRef(false)

  useEffect(() => {
    if (!pending || started.current) return
    started.current = true
    createOrder.mutate(pending)
  }, [pending, createOrder])

  return null
}

interface CheckoutFormProps {
  user: User
  cart: NonNullable<ReturnType<typeof useCart>['data']>
  cartFetching: boolean
  quote: ReturnType<typeof useCartQuote>
  wallets: ReturnType<typeof useWallets>
}

function CheckoutForm({
  user,
  cart,
  cartFetching,
  quote,
  wallets,
}: CheckoutFormProps) {
  const announce = useAnnounce()
  const queryClient = useQueryClient()
  const cartKey = useCartKey()
  const revalidate = useRevalidateCart()
  const connection = useWalletConnection()
  const createOrder = useCreateOrder()
  const formId = useId()
  const hintId = useId()
  const changesRef = useRef<HTMLDivElement>(null)
  const providerRef = useRef<HTMLFieldSetElement>(null)
  const [details, setDetails] = useState(false)
  const [review, setReview] = useState(false)
  const [blocker, setBlocker] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  const draft = useState(() => checkoutDraft.read(user.id))[0]
  const list = wallets.data?.wallets
  // Sem rascunho, a primeira carteira cadastrada (a principal) vem escolhida.
  const initialWallet = draft ? undefined : list?.[0]
  const [walletId, setWalletId] = useState<string | null>(
    draft ? draft.walletId : (initialWallet?.id ?? null),
  )
  const [useOther, setUseOther] = useState(
    draft ? draft.walletId === null : initialWallet === undefined,
  )
  const registered = list?.find((w) => w.id === walletId)

  const form = useForm<CheckoutFormValues, unknown, CheckoutFormOutput>({
    resolver: zodResolver(checkoutSchema),
    // O foco vai ao campo depois de abrir a seção (no mobile ela pode estar fechada).
    shouldFocusError: false,
    defaultValues:
      draft?.values ??
      (initialWallet
        ? fromWallet(initialWallet, user, { ...EMPTY })
        : { ...EMPTY, username: user.username }),
  })

  const values = useWatch({ control: form.control })
  // O rascunho acompanha o formulário: se a sessão expirar, nada se perde.
  useEffect(() => {
    checkoutDraft.write(user.id, {
      values: { ...EMPTY, ...values },
      walletId: useOther ? null : walletId,
    })
  }, [user.id, values, walletId, useOther])

  // --- Revisão: a cotação aceita só muda quando o colecionador aceita a nova.
  const quoted = quote.data
  const snapshot =
    quoted &&
    quoted.cartVersion === cart.version &&
    !quote.isFetching &&
    !cartFetching
      ? toReviewSnapshot(cart, quoted)
      : null
  const [accepted, setAccepted] = useState<ReviewSnapshot | null>(null)
  if (accepted === null && snapshot) setAccepted(snapshot)
  const changes =
    accepted && snapshot ? describeReviewChanges(accepted, snapshot) : []
  const changesKey = changes.join('|')
  useEffect(() => {
    if (changesKey) {
      announce(
        `Os valores do pedido mudaram. ${changesKey.split('|').join(' ')} Revise e confirme novamente.`,
        'assertive',
      )
    }
  }, [changesKey, announce])

  const refreshing =
    quote.isFetching ||
    cartFetching ||
    (quote.data !== undefined && quote.data.cartVersion !== cart.version)
  const issues = quote.data?.issues ?? []

  // --- Conexão: só vale para o endereço, a rede e o provedor atuais.
  const target = connectionTarget({
    walletAddress: values.walletAddress ?? '',
    network: values.network ?? '',
    provider: values.provider ?? '',
  })
  const connected = connection.isConnectedTo(target)
  const state = connection.state
  const providerStatus: ProviderStatus =
    state.status === 'connected'
      ? connected
        ? 'connected'
        : 'idle'
      : state.status === 'connecting'
        ? 'connecting'
        : state.status === 'idle'
          ? 'idle'
          : state.provider === values.provider
            ? state.status
            : 'idle'
  const providerMessage =
    state.status === 'refused' ||
    state.status === 'disconnected' ||
    state.status === 'error'
      ? state.message
      : null

  async function startConnection() {
    const ok = await form.trigger(['walletAddress', 'network', 'provider'])
    const next = connectionTarget(form.getValues())
    if (!ok || !next) {
      flushSync(() => setDetails(true))
      const errors = form.formState.errors
      const first = (['walletAddress', 'network', 'provider'] as const).find(
        (field) => field in errors,
      )
      if (first) form.setFocus(first)
      return
    }
    connection.connect(next)
  }

  function selectProvider(provider: CheckoutFormValues['provider']) {
    form.setValue('provider', provider, { shouldDirty: true })
    void startConnection()
  }

  function chooseWallet(id: string) {
    const wallet = list?.find((w) => w.id === id)
    if (!wallet) return
    setWalletId(id)
    setUseOther(false)
    form.reset(fromWallet(wallet, user, form.getValues()))
  }

  function toggleOtherWallet(other: boolean) {
    setUseOther(other)
    if (other) {
      const current = form.getValues()
      form.reset({
        ...current,
        network: '',
        walletAddress: '',
        secondaryAddress: '',
        ensName: '',
      })
      setDetails(true)
    } else if (list && list.length > 0) {
      chooseWallet(walletId ?? list[0].id)
    }
  }

  function acceptChanges() {
    if (!snapshot) return
    setAccepted(snapshot)
    setBlocker(null)
    announce('Novos valores aceitos. Confirme a compra quando quiser.')
  }

  const submit = form.handleSubmit(
    async (output) => {
      if (verifying || createOrder.isPending) return
      setBlocker(null)
      if (!connected || !target) {
        setBlocker('Conecte a carteira para confirmar a compra.')
        providerRef.current?.focus()
        return
      }
      if (!accepted) return

      // Revalida preço, disponibilidade, cupom e taxas na API antes de enviar.
      setVerifying(true)
      let fresh: Awaited<ReturnType<typeof revalidate>>
      try {
        fresh = await revalidate()
      } catch (error) {
        setVerifying(false)
        if (!isUnauthorized(error)) setBlocker(describeRequestError(error))
        return
      }
      setVerifying(false)
      const freshSnapshot = toReviewSnapshot(fresh.cart, fresh.quote)
      if (
        fresh.cart.items.length === 0 ||
        describeReviewChanges(accepted, freshSnapshot).length > 0 ||
        fresh.quote.issues.length > 0
      ) {
        // A tela já recebeu os valores novos: o alerta pede a nova confirmação.
        setBlocker('Os valores mudaram. Revise e aceite os novos valores.')
        changesRef.current?.focus()
        return
      }

      createOrder.mutate(
        {
          connectionId:
            (state.status === 'connected' && state.connection.id) || '',
          walletId: useOther ? null : walletId,
          collector: {
            ...output,
            secondaryAddress: output.secondaryAddress || null,
            referralCode: output.referralCode.toUpperCase(),
            note: output.note || null,
          },
          quote: {
            cartVersion: fresh.quote.cartVersion,
            totalEth: fresh.quote.totalEth,
          },
        },
        {
          onSuccess: () => checkoutDraft.clear(user.id),
          onError: (error) => {
            const reason = getApiError(error)?.reason
            if (reason === 'QUOTE_CHANGED' || reason === 'CART_EMPTY') {
              createOrder.reset()
              if (cartKey)
                void queryClient.invalidateQueries({ queryKey: cartKey })
              setBlocker(getApiError(error)!.message)
              changesRef.current?.focus()
            } else if (reason === 'WALLET_NOT_CONNECTED') {
              createOrder.reset()
              connection.markDisconnected(getApiError(error)!.message)
              providerRef.current?.focus()
            } else {
              flushSync(() => setDetails(true))
              if (applyApiFieldErrors(error, FORM_FIELDS, form.setError)) {
                createOrder.reset()
              }
            }
          },
        },
      )
    },
    (errors) => {
      flushSync(() => setDetails(true))
      const first = FORM_FIELDS.find((field) => field in errors)
      if (first) form.setFocus(first)
    },
  )

  // O 401 já encerra a sessão e abre o login; repetir o aviso confundiria.
  const orderError =
    createOrder.isError && !isUnauthorized(createOrder.error)
      ? describeRequestError(createOrder.error)
      : null

  const busy = verifying || createOrder.isPending
  const hint = busy
    ? null
    : changes.length > 0
      ? 'Os valores mudaram: aceite os novos valores para confirmar.'
      : issues.length > 0
        ? 'Ajuste no carrinho os itens indicados para continuar.'
        : !snapshot
          ? 'Atualizando a cotação…'
          : !connected
            ? 'Conecte a carteira para confirmar a compra.'
            : null
  const blocked =
    changes.length > 0 || issues.length > 0 || !snapshot || !connected

  const locked = !useOther && registered !== undefined

  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => void submit(event)}
      aria-label="Pagamento"
      className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8"
    >
      {/* Coluna do formulário (desktop) e topo do mobile. */}
      <div className="flex min-w-0 flex-col gap-4 max-md:contents lg:w-[763px] lg:shrink-0">
        <div className="max-md:order-1">
          <WalletPicker
            wallets={wallets}
            value={useOther ? null : walletId}
            onChange={chooseWallet}
          />
        </div>

        <Disclosure
          label="Dados do colecionador"
          open={details}
          onOpenChange={setDetails}
          className="max-md:order-5"
        >
          <section
            aria-labelledby={`${formId}-perfil`}
            className="flex flex-col gap-3"
          >
            <h2
              id={`${formId}-perfil`}
              className="text-[17px] leading-4 font-bold text-foreground max-md:sr-only"
            >
              Perfil do colecionador
            </h2>
            <CollectorFields
              control={form.control}
              locked={locked}
              useOtherWallet={useOther}
              onUseOtherWalletChange={toggleOtherWallet}
              canUseRegistered={(list?.length ?? 0) > 0}
            />
          </section>
        </Disclosure>
      </div>

      {/* Coluna "Seus NFTs" (desktop); no mobile, os itens entram na ordem do Figma. */}
      <div className="flex min-w-0 flex-col gap-4 max-md:contents md:gap-3 lg:w-[405px] lg:shrink-0">
        <QuoteChangesAlert
          ref={changesRef}
          changes={changes}
          onAccept={acceptChanges}
          className="max-md:order-3"
        />

        <Disclosure
          label={`Revisar pedido (${cart.itemCount} ${cart.itemCount === 1 ? 'item' : 'itens'})`}
          open={review}
          onOpenChange={setReview}
          className="max-md:order-4"
        >
          <section
            aria-labelledby={`${formId}-nfts`}
            aria-busy={refreshing}
            className="flex flex-col gap-3"
          >
            <h2
              id={`${formId}-nfts`}
              className="text-[17px] leading-4 font-bold text-foreground max-md:sr-only"
            >
              Seus NFTs
            </h2>
            <OrderItems cart={cart} issues={issues} />
            {quote.isPending ? (
              <OrderTotalsSkeleton />
            ) : quote.isError && !quote.data ? (
              <div
                role="alert"
                className="flex flex-col items-start gap-3 py-2"
              >
                <p className="text-sm leading-5 text-text-coral">
                  Não foi possível calcular os valores.{' '}
                  {describeRequestError(quote.error)}
                </p>
                <Button
                  variant="outline"
                  className="h-9 px-4"
                  onClick={() => void quote.refetch()}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <OrderTotals quote={quote.data} refreshing={refreshing} />
            )}
          </section>
        </Disclosure>
        <p aria-live="polite" className="sr-only">
          {refreshing ? 'Atualizando valores.' : ''}
        </p>

        <div className="max-md:order-2 md:mt-3">
          <ProviderOptions
            ref={providerRef}
            value={values.provider ?? ''}
            status={providerStatus}
            message={providerMessage}
            error={form.formState.errors.provider?.message}
            onSelect={selectProvider}
            onRetry={() => void startConnection()}
          />
        </div>

        <div className="flex items-center justify-end gap-7 max-md:order-6 md:hidden">
          <span className="text-base leading-4 font-bold text-foreground">
            Total:
          </span>
          <span className="text-lg leading-4 font-bold text-text-accent">
            {quote.data ? formatEth(quote.data.totalEth) : '—'}
          </span>
        </div>

        <div className="flex flex-col gap-3  max-md:sticky max-md:bottom-0 max-md:order-7 max-md:-mx-7 max-md:bg-background max-md:px-7 max-md:pt-3 max-md:pb-4 md:mt-3 [@media(max-height:640px)]:static">
          <FormAlert message={orderError} />
          {blocker && (
            <p role="alert" className="text-sm leading-5 text-text-coral">
              {blocker}
            </p>
          )}
          <button
            type="submit"
            aria-disabled={blocked || busy || undefined}
            aria-busy={busy || undefined}
            aria-describedby={hint ? hintId : undefined}
            className={cn(
              'focus-ring flex h-[60px] w-full cursor-pointer items-center justify-center rounded-[40px] bg-primary text-[15px] leading-4 font-bold text-ink hover:brightness-110 md:h-[45px] md:rounded-[8px]',
              (blocked || busy) &&
                'cursor-not-allowed opacity-50 hover:brightness-100',
            )}
          >
            {verifying
              ? 'Verificando valores…'
              : createOrder.isPending
                ? 'Enviando pedido…'
                : 'Confirmar compra'}
          </button>
          {hint && (
            <p
              id={hintId}
              className="text-center text-[13px] leading-4 text-text-secondary"
            >
              {hint}
            </p>
          )}
        </div>
      </div>
    </form>
  )
}

function MobileHeader() {
  const router = useRouter()
  const goBack = () => {
    if (router.history.canGoBack()) router.history.back()
    else void router.navigate({ to: '/carrinho' })
  }
  return (
    <div className="relative flex h-[35px] items-start md:hidden">
      <button
        type="button"
        onClick={goBack}
        aria-label="Voltar"
        className="focus-ring flex size-[35px] cursor-pointer items-center justify-center rounded-full border border-border bg-[#2f1d15] text-text-secondary"
      >
        <MaskIcon src="/icons/detail-arrow-left.svg" width={8} height={14} />
      </button>
      <h1 className="absolute top-[9px] right-0 left-[59px] text-xl leading-4 font-bold whitespace-nowrap text-foreground max-[360px]:text-base">
        Pagamento com carteira
      </h1>
    </div>
  )
}

function Breadcrumb() {
  return (
    <nav aria-label="Trilha de navegação" className="max-md:hidden">
      <h1 className="sr-only">Pagamento</h1>
      <ol className="flex gap-2 text-[15px] leading-4 font-bold text-foreground">
        <li>
          <Link to="/" className="focus-ring rounded-sm hover:text-text-accent">
            Início
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link
            to="/"
            hash="catalogo"
            className="focus-ring rounded-sm hover:text-text-accent"
          >
            Mercado
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">Pagamento</li>
      </ol>
    </nav>
  )
}

interface DisclosureProps {
  label: string
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
  children: React.ReactNode
}

/**
 * Seção recolhível só no mobile (o frame mobile não desenha formulário nem
 * itens); a partir de 768 px o conteúdo fica sempre aberto, como no desktop.
 */
function Disclosure({
  label,
  open,
  onOpenChange,
  className,
  children,
}: DisclosureProps) {
  const panelId = useId()
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
        className="focus-ring flex w-full cursor-pointer items-center justify-between rounded-[3px] py-2 text-base leading-4 font-bold text-foreground md:hidden"
      >
        {label}
        <MaskIcon
          src="/icons/arrow-down-2.svg"
          width={14}
          height={8}
          className={cn(
            'transition-transform motion-reduce:transition-none',
            open && 'rotate-180',
          )}
        />
      </button>
      <div id={panelId} className={cn('max-md:pt-3', !open && 'max-md:hidden')}>
        {children}
      </div>
    </div>
  )
}
