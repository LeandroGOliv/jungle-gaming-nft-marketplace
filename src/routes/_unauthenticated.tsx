import { createFileRoute } from '@tanstack/react-router'

/**
 * Login e cadastro. Com a sessão, um colecionador já autenticado é levado
 * de volta ao destino em vez de ver estas telas.
 */
export const Route = createFileRoute('/_unauthenticated')({
  staticData: { navSection: 'home' },
})
