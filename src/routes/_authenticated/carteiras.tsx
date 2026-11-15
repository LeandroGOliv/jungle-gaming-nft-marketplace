import { createFileRoute } from '@tanstack/react-router'
import { WalletsView } from '@/components/account/wallets-view'

export const Route = createFileRoute('/_authenticated/carteiras')({
  component: WalletsView,
})
