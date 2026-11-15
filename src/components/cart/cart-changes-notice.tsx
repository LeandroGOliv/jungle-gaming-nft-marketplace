import { MaskIcon } from '@/components/layout/mask-icon'
import { cartNotices, useCartNotices } from '@/hooks/use-cart-notices'

/**
 * Alterações de preço e disponibilidade recebidas em tempo real para itens do
 * carrinho. Não é região viva: o anúncio sai pelas regiões do layout quando o
 * evento chega, e aqui o aviso fica visível até ser dispensado.
 */
export function CartChangesNotice() {
  const notices = useCartNotices()
  if (notices.length === 0) return null

  return (
    <section
      aria-labelledby="cart-changes-title"
      className="rounded-[14px] border border-text-coral/60 bg-card px-5 py-4 md:rounded-[6px]"
    >
      <h2
        id="cart-changes-title"
        className="text-base leading-5 font-bold text-foreground"
      >
        Itens do carrinho foram atualizados
      </h2>
      <ul className="mt-2 flex flex-col gap-2">
        {notices.map((notice) => (
          <li
            key={notice.id}
            className="flex items-start justify-between gap-3 text-sm leading-5 text-text-secondary"
          >
            <span>{notice.message}</span>
            <button
              type="button"
              onClick={() => cartNotices.dismiss(notice.id)}
              aria-label={`Dispensar aviso: ${notice.message}`}
              className="focus-ring grid size-5 shrink-0 cursor-pointer place-items-center rounded-sm text-brand-secondary hover:text-text-accent"
            >
              <MaskIcon src="/icons/close.svg" width={12} height={12} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
