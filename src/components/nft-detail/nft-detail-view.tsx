import { useState } from 'react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { CATEGORY_LABELS } from '@/components/catalog/labels'
import { MaskIcon } from '@/components/layout/mask-icon'
import { PageContainer } from '@/components/layout/page-container'
import { useAddToCart } from '@/hooks/use-cart'
import { describeRequestError } from '@/lib/http-error'
import { cn } from '@/lib/utils'
import type { Nft, NftRarity } from '@/types/nft'
import { formatEth } from '@/utils/eth'
import { clampQuantity, defaultEditionId } from '@/utils/nft-detail'
import { EditionPicker } from './edition-picker'
import { FavoriteButton } from './favorite-button'
import { NftDescription } from './nft-description'
import { NftGallery, NftHeroImage } from './nft-gallery'
import { QuantityStepper } from './quantity-stepper'
import { RelatedNfts } from './related-nfts'

const RARITY_NAMES: Record<NftRarity, string> = {
  common: 'Comum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
}

/**
 * Seleção de edição e quantidade. A quantidade volta a 1 ao trocar de edição
 * e é sempre limitada às unidades disponíveis da edição atual.
 */
function usePurchaseSelection(nft: Nft) {
  const [editionId, setEditionId] = useState(() =>
    defaultEditionId(nft.editions),
  )
  const [quantity, setQuantity] = useState(1)
  const edition = nft.editions.find((e) => e.id === editionId)
  const available = edition?.available ?? 0

  return {
    edition,
    available,
    soldOut: available === 0,
    // Derivada: se a disponibilidade cair, o valor exibido acompanha.
    quantity: clampQuantity(quantity, available),
    selectEdition: (id: string) => {
      setEditionId(id)
      setQuantity(1)
    },
    changeQuantity: (value: number) =>
      setQuantity(clampQuantity(value, available)),
  }
}

type PurchaseSelection = ReturnType<typeof usePurchaseSelection>

/**
 * Inclusão no carrinho a partir do detalhe. "Comprar" inclui e leva ao
 * carrinho; o botão do carrinho (mobile) inclui e fica na página, com o
 * resultado visível ao lado dos botões.
 */
function useAddSelectionToCart(nft: Nft, selection: PurchaseSelection) {
  const navigate = useNavigate()
  const add = useAddToCart()
  const [lastAdded, setLastAdded] = useState<string | null>(null)

  const submit = (goToCart: boolean) => {
    if (!selection.edition || selection.soldOut || add.isPending) return
    setLastAdded(null)
    add.mutate(
      {
        nftId: nft.id,
        editionId: selection.edition.id,
        quantity: selection.quantity,
        nftName: nft.name,
      },
      {
        onSuccess: () => {
          if (goToCart) void navigate({ to: '/carrinho' })
          else setLastAdded(`${nft.name} adicionado ao carrinho.`)
        },
      },
    )
  }

  return {
    buy: () => submit(true),
    addAndStay: () => submit(false),
    isPending: add.isPending,
    disabled: selection.soldOut || !selection.edition,
    status: add.isError
      ? { tone: 'error' as const, text: describeRequestError(add.error) }
      : lastAdded
        ? { tone: 'success' as const, text: lastAdded }
        : null,
  }
}

type AddToCartAction = ReturnType<typeof useAddSelectionToCart>

export function NftDetailView({ nft }: { nft: Nft }) {
  const [imageIndex, setImageIndex] = useState(0)
  const selection = usePurchaseSelection(nft)
  const cart = useAddSelectionToCart(nft, selection)

  const editionPicker = (
    <EditionPicker
      editions={nft.editions}
      value={selection.edition?.id}
      onChange={selection.selectEdition}
    />
  )
  const tokenInfo = (
    <dl className="flex flex-col gap-3 text-[15px] leading-5 text-brand-secondary">
      <div>
        <dt className="inline">ID do token: </dt>
        <dd className="inline">{nft.tokenId}</dd>
      </div>
      <div>
        <dt className="inline">Coleção: </dt>
        <dd className="inline">{nft.collection.name}</dd>
      </div>
      <div>
        <dt className="inline">Atributos: </dt>
        <dd className="inline">
          {CATEGORY_LABELS[nft.category]}, {RARITY_NAMES[nft.rarity]}
        </dd>
      </div>
    </dl>
  )

  return (
    <article aria-labelledby="nft-title" className="pb-[188px] md:pb-24">
      {/* Mobile: hero com a arte e o sheet de detalhes, como no Figma. */}
      <div className="md:hidden">
        <MobileHero
          nft={nft}
          imageIndex={imageIndex}
          onSelectImage={setImageIndex}
        />
        <div className="relative z-10 -mt-[114px] flex flex-col gap-3 rounded-t-[31px] bg-card px-6 pt-8 pb-6">
          <div className="flex items-start justify-between gap-3">
            <h1
              id="nft-title"
              className="text-xl leading-[27px] font-bold text-foreground"
            >
              {nft.name}
            </h1>
            <RatingBadge rating={nft.rating} reviewCount={nft.reviewCount} />
          </div>
          <p className="text-sm leading-6 text-text-secondary">{nft.summary}</p>
          {editionPicker}
          {tokenInfo}
        </div>
      </div>

      <PageContainer className="flex flex-col gap-12 pt-10 md:gap-24 md:pt-8">
        <div className="flex flex-col gap-3 max-md:hidden">
          <Breadcrumb />
          <div className="flex flex-col gap-8 lg:flex-row">
            <NftGallery
              images={nft.images}
              nftName={nft.name}
              selected={imageIndex}
              onSelect={setImageIndex}
            />

            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <div className="flex flex-col gap-3">
                <h1
                  id="nft-title-desktop"
                  className="text-[28px] leading-[37px] font-bold text-foreground"
                >
                  {nft.name}
                </h1>
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                  <p className="text-[22px] leading-4 font-bold text-text-accent">
                    <span className="sr-only">Preço por unidade: </span>
                    {formatEth(nft.priceEth)}
                  </p>
                  <RatingStars
                    rating={nft.rating}
                    reviewCount={nft.reviewCount}
                  />
                </div>
                <hr className="border-primary/30 lg:mr-[22px]" />
              </div>

              <div className="flex flex-col gap-3 lg:pr-[21px]">
                <h2 className="text-[15px] leading-4 font-bold text-foreground">
                  Sobre este NFT:
                </h2>
                <p className="text-sm leading-6 text-text-secondary">
                  {nft.summary}
                </p>
              </div>

              {editionPicker}

              <div className="flex flex-wrap items-center justify-between gap-4">
                <QuantityStepper
                  size="large"
                  value={selection.quantity}
                  max={selection.available}
                  onChange={selection.changeQuantity}
                  disabled={selection.soldOut}
                />
                <div className="flex gap-2">
                  <BuyButton
                    action={cart}
                    className="h-10 min-w-[130px] rounded-md text-sm leading-5 font-bold"
                  >
                    COMPRAR
                  </BuyButton>
                  <FavoriteButton nft={nft} variant="labeled" />
                </div>
              </div>
              <CartStatus status={cart.status} className="-mt-2" />

              <div className="flex flex-col gap-3">
                {tokenInfo}
                <ShareLinks nft={nft} />
              </div>
            </div>
          </div>
        </div>

        <NftDescription nft={nft} />
        <RelatedNfts nftId={nft.id} />
      </PageContainer>

      <MobileBuyBar
        priceEth={nft.priceEth}
        quantity={selection.quantity}
        available={selection.available}
        soldOut={selection.soldOut}
        onQuantityChange={selection.changeQuantity}
        action={cart}
      />
    </article>
  )
}

/** Inclui a seleção no carrinho e leva até ele. */
function BuyButton({
  action,
  className,
  children,
}: {
  action: AddToCartAction
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={action.buy}
      disabled={action.disabled}
      aria-busy={action.isPending}
      className={cn(
        'focus-ring cursor-pointer bg-primary px-4 text-ink disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress aria-busy:opacity-70',
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Resultado da última inclusão, visível; o anúncio para leitores de tela sai do hook. */
function CartStatus({
  status,
  className,
}: {
  status: AddToCartAction['status']
  className?: string
}) {
  if (!status) return null
  return (
    <p
      className={cn(
        'text-sm leading-5',
        status.tone === 'error' ? 'text-text-coral' : 'text-text-secondary',
        className,
      )}
    >
      {status.text}{' '}
      {status.tone === 'success' && (
        <Link
          to="/carrinho"
          className="focus-ring rounded-sm font-bold text-text-accent underline underline-offset-2"
        >
          Ver carrinho
        </Link>
      )}
    </p>
  )
}

function Breadcrumb() {
  return (
    <nav aria-label="Trilha de navegação">
      <ol className="flex gap-2 text-[15px] leading-4 font-bold text-cream">
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
      </ol>
    </nav>
  )
}

const ratingFormat = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function RatingStars({
  rating,
  reviewCount,
}: {
  rating: number
  reviewCount: number
}) {
  const filled = Math.round(rating)
  return (
    <p className="flex items-center gap-1 text-[15px] leading-5 text-cream">
      <span className="sr-only">Nota {ratingFormat.format(rating)} de 5, </span>
      <span aria-hidden="true" className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className="flex size-[15px] items-center justify-center"
          >
            <MaskIcon
              src="/icons/detail-star.svg"
              width={13}
              height={12}
              className={i < filled ? 'text-primary' : 'text-text-secondary'}
            />
          </span>
        ))}
      </span>
      {reviewCount} avaliações de colecionadores
    </p>
  )
}

function RatingBadge({
  rating,
  reviewCount,
}: {
  rating: number
  reviewCount: number
}) {
  return (
    <p className="flex h-[27px] shrink-0 items-center gap-1 rounded-full border border-primary px-1.5 text-sm leading-4">
      <MaskIcon
        src="/icons/detail-star.svg"
        width={12}
        height={11}
        className="text-[#e3a44e]"
      />
      <span className="sr-only">Nota </span>
      <span className="font-medium text-cream">
        {ratingFormat.format(rating)}
      </span>
      <span className="text-text-secondary">
        <span className="sr-only">, </span>({reviewCount}
        <span className="sr-only"> avaliações</span>)
      </span>
    </p>
  )
}

function ShareLinks({ nft }: { nft: Nft }) {
  const url = typeof window === 'undefined' ? '' : window.location.href
  const text = `${nft.name} na Kurio`
  const links = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: '/icons/detail-share-linkedin.svg',
      width: 15,
      height: 15,
    },
    {
      label: 'e-mail',
      href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
      icon: '/icons/detail-share-mail.svg',
      width: 15,
      height: 12,
    },
    {
      label: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      icon: '/icons/detail-share-twitter.svg',
      width: 16,
      height: 13,
    },
  ]

  return (
    <div className="flex items-center gap-2">
      <p className="text-[15px] leading-4 font-bold text-cream">
        Compartilhar este NFT:
      </p>
      <ul className="flex items-center gap-2">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Compartilhar por ${link.label} (abre em nova aba)`}
              className="focus-ring flex size-[18px] items-center justify-center rounded-sm text-cream hover:text-text-accent"
            >
              <MaskIcon
                src={link.icon}
                width={link.width}
                height={link.height}
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MobileHero({
  nft,
  imageIndex,
  onSelectImage,
}: {
  nft: Nft
  imageIndex: number
  onSelectImage: (index: number) => void
}) {
  const router = useRouter()
  const goBack = () => {
    // Acesso direto não tem histórico no app: volta para a Início.
    if (router.history.canGoBack()) router.history.back()
    else void router.navigate({ to: '/' })
  }

  return (
    <div className="flex flex-col gap-2 bg-[linear-gradient(137deg,var(--surface-card)_0%,#2f1d15_100%)] px-7 pt-[23px] pb-[84px]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          aria-label="Voltar"
          className="focus-ring flex size-[35px] cursor-pointer items-center justify-center rounded-full border border-border bg-[#2f1d15] text-text-secondary"
        >
          <MaskIcon src="/icons/detail-arrow-left.svg" width={8} height={14} />
        </button>
        <FavoriteButton nft={nft} variant="icon" />
      </div>
      <NftHeroImage
        images={nft.images}
        nftName={nft.name}
        selected={imageIndex}
        onSelect={onSelectImage}
      />
    </div>
  )
}

function MobileBuyBar({
  priceEth,
  quantity,
  available,
  soldOut,
  onQuantityChange,
  action,
}: {
  priceEth: string
  quantity: number
  available: number
  soldOut: boolean
  onQuantityChange: (value: number) => void
  action: AddToCartAction
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 rounded-t-[40px] bg-card px-6 pt-5 pb-9 shadow-[0_0_20px_rgb(10_6_4/0.45)] md:hidden">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <QuantityStepper
            size="compact"
            value={quantity}
            max={available}
            onChange={onQuantityChange}
            disabled={soldOut}
          />
          <p className="text-xl leading-4 font-bold text-text-accent">
            <span className="sr-only">Preço por unidade: </span>
            {formatEth(priceEth)}
          </p>
        </div>
        <CartStatus status={action.status} className="-my-2" />
        <div className="flex gap-3">
          <BuyButton
            action={action}
            className="h-[60px] w-[196px] rounded-[40px] bg-[linear-gradient(103deg,var(--brand-primary)_0%,rgb(210_138_76/0.8)_100%)] text-base leading-5 font-bold"
          >
            Comprar NFT
          </BuyButton>
          <button
            type="button"
            onClick={action.addAndStay}
            disabled={action.disabled}
            aria-busy={action.isPending}
            aria-label="Adicionar ao carrinho"
            className="focus-ring flex size-[60px] cursor-pointer items-center justify-center rounded-[40px] border border-border bg-[#2f1d15] text-brand-secondary disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress"
          >
            <MaskIcon src="/icons/detail-shop.svg" width={18} height={17} />
          </button>
        </div>
      </div>
    </div>
  )
}
