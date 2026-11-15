import { createFileRoute } from '@tanstack/react-router'

/** Telas abertas a qualquer visitante: catálogo, detalhe, carrinho. */
export const Route = createFileRoute('/_public')()
