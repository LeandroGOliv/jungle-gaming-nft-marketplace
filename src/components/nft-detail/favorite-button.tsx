import { useLocation, useNavigate } from '@tanstack/react-router'
import { MaskIcon } from '@/components/layout/mask-icon'
import { useFavorites, useToggleFavorite } from '@/hooks/use-favorites'
import { cn } from '@/lib/utils'
import type { Nft } from '@/types/nft'
import { withoutAuthParams } from '@/utils/auth-location'

/**
 * Estado e ação do favorito. O visitante vai ao login e volta a este detalhe;
 * o autenticado alterna com atualização otimista (ver `useToggleFavorite`).
 */
function useFavoriteToggle(nft: Nft) {
  const favorites = useFavorites()
  const toggle = useToggleFavorite(favorites.userId ?? 'anonymous')
  const navigate = useNavigate()
  const href = useLocation({ select: (location) => location.href })

  const isFavorite = favorites.data?.nftIds.includes(nft.id) ?? false
  // Sem a lista, o estado do botão seria um palpite: espera a consulta.
  const loading = favorites.userId !== null && favorites.isPending

  const onToggle = () => {
    if (favorites.userId === null) {
      void navigate({
        to: '.',
        search: (prev) => ({
          ...prev,
          auth: 'entrar' as const,
          redirect: withoutAuthParams(href),
        }),
      })
      return
    }
    toggle.mutate({ nftId: nft.id, nftName: nft.name, favorite: !isFavorite })
  }

  return { isFavorite, loading, onToggle }
}

interface FavoriteButtonProps {
  nft: Nft
  /** `labeled` é o botão do desktop; `icon`, o círculo do hero mobile. */
  variant: 'labeled' | 'icon'
  className?: string
}

export function FavoriteButton({
  nft,
  variant,
  className,
}: FavoriteButtonProps) {
  const { isFavorite, loading, onToggle } = useFavoriteToggle(nft)

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={onToggle}
        disabled={loading}
        aria-pressed={isFavorite}
        aria-label="Favoritar"
        className={cn(
          'focus-ring flex size-[35px] cursor-pointer items-center justify-center rounded-full border border-border text-text-accent transition-colors disabled:cursor-progress disabled:opacity-60 motion-reduce:transition-none',
          isFavorite ? 'bg-primary text-ink' : 'bg-[#2f1d15]',
          className,
        )}
      >
        <MaskIcon src="/icons/detail-heart-mobile.svg" width={16} height={14} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={loading}
      aria-pressed={isFavorite}
      className={cn(
        'focus-ring flex h-10 min-w-[130px] cursor-pointer items-center justify-center gap-2 rounded-md border border-primary px-3 text-sm leading-5 font-medium transition-colors disabled:cursor-progress disabled:opacity-60 motion-reduce:transition-none',
        isFavorite
          ? 'bg-primary text-ink'
          : 'text-text-accent hover:bg-primary/10',
        className,
      )}
    >
      <MaskIcon
        src="/icons/detail-heart.svg"
        width={20}
        height={18}
        className={isFavorite ? 'text-ink' : 'text-primary'}
      />
      {/* Nome fixo com `aria-pressed`: o estado vem do botão, não do texto. */}
      Favoritar
    </button>
  )
}
