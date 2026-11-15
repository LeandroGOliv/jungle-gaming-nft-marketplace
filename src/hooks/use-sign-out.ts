import { useMatch, useNavigate } from '@tanstack/react-router'
import { useAnnounce } from '@/hooks/use-announce'
import { useLogout } from '@/hooks/use-session'
import { checkoutDraft } from '@/lib/checkout-draft'
import { orderAttempt } from '@/lib/order-attempt'

/**
 * Logout pela interface: encerra a sessão, avisa na região viva e, se a tela
 * atual for privada, volta à Início em vez de pedir login de novo.
 */
export function useSignOut() {
  const logout = useLogout()
  const navigate = useNavigate()
  const announce = useAnnounce()
  const inPrivateRoute = useMatch({
    from: '/_authenticated',
    shouldThrow: false,
    select: () => true,
  })

  return {
    isPending: logout.isPending,
    signOut: () => {
      // A sessão local termina na hora; o aviso não espera a resposta da API
      // (e o callback do `mutate` não roda se a tela privada desmontar antes).
      logout.mutate()
      checkoutDraft.clearAll()
      orderAttempt.clearAll()
      announce('Você saiu da sua conta.')
      if (inPrivateRoute) void navigate({ to: '/', replace: true })
    },
  }
}
