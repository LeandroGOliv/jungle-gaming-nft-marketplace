import { createFileRoute } from '@tanstack/react-router'
import { ProfileView } from '@/components/account/profile-view'

export const Route = createFileRoute('/_authenticated/perfil')({
  component: ProfileView,
})
