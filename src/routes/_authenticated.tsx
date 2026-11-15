import { createFileRoute } from '@tanstack/react-router'

/**
 * Telas que exigem sessão: checkout, perfil, carteiras, pedidos. O guarda
 * (`beforeLoad` redirecionando ao login com o retorno) entra com a sessão.
 */
export const Route = createFileRoute('/_authenticated')({
  staticData: { navSection: 'home' },
})
