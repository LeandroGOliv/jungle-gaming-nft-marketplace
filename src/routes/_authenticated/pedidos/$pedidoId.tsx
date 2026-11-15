import { createFileRoute, redirect } from '@tanstack/react-router'

// O recibo é o modal sobre o pagamento (como no Figma); o endereço antigo leva a ele.
export const Route = createFileRoute('/_authenticated/pedidos/$pedidoId')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/pagamento',
      search: { pedido: params.pedidoId },
      replace: true,
    })
  },
})
