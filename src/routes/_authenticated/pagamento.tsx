import { createFileRoute } from '@tanstack/react-router'
import { CheckoutView } from '@/components/checkout/checkout-view'

export const Route = createFileRoute('/_authenticated/pagamento')({
  // Como no carrinho: o frame mobile tem cabeçalho e botão próprios, sem a tab bar.
  staticData: {
    navSection: 'market',
    headerDivider: false,
    mobileTabBar: false,
  },
  component: CheckoutView,
})
