import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { CheckoutView } from '@/components/checkout/checkout-view'

const searchSchema = z.object({
  /** Pedido exibido no modal de confirmação sobre o pagamento. */
  pedido: z.string().min(1).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/pagamento')({
  validateSearch: searchSchema,
  // Como no carrinho: o frame mobile tem cabeçalho e botão próprios, sem a tab bar.
  staticData: {
    navSection: 'market',
    headerDivider: false,
    mobileTabBar: false,
  },
  component: CheckoutView,
})
