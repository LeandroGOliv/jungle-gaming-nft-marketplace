import { createFileRoute } from '@tanstack/react-router'
import { CartView } from '@/components/cart/cart-view'

export const Route = createFileRoute('/_public/carrinho')({
  // O frame mobile tem cabeçalho e resumo próprios, sem a tab bar.
  staticData: {
    navSection: 'market',
    headerDivider: false,
    mobileTabBar: false,
  },
  component: CartView,
})
