import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAnnounce } from '@/hooks/use-announce'
import { sessionKeys, useSession, userKeys } from '@/hooks/use-session'
import {
  changePassword,
  getProfile,
  removeAvatar,
  updateProfile,
  uploadAvatar,
} from '@/services/profile'
import type { QueryClient } from '@tanstack/react-query'
import type { SessionInfo } from '@/types/auth'
import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
  User,
} from '@/types/user'

/** O perfil é privado: fica sob o id do usuário e sai do cache no logout. */
export const profileKeys = {
  detail: (userId: string) => [...userKeys.detail(userId), 'profile'] as const,
}

/** Perfil do usuário autenticado (a rota já exige sessão). */
export function useProfile() {
  const session = useSession()
  const userId = session.status === 'authenticated' ? session.user.id : null
  const query = useQuery({
    queryKey: profileKeys.detail(userId ?? 'anonymous'),
    queryFn: ({ signal }) => getProfile(signal),
    enabled: userId !== null,
  })
  return { ...query, userId }
}

/**
 * Leva o perfil confirmado pela API ao cache do perfil e ao da sessão, que
 * alimenta o header. Só toca a sessão do mesmo usuário: uma resposta que chega
 * depois de uma troca de conta não vaza para a sessão nova.
 */
function applyUser(queryClient: QueryClient, user: User) {
  queryClient.setQueryData(profileKeys.detail(user.id), user)
  queryClient.setQueriesData<SessionInfo | null>(
    { queryKey: sessionKeys.all },
    (info) => (info && info.user.id === user.id ? { ...info, user } : info),
  )
}

export type AvatarChange =
  { kind: 'keep' } | { kind: 'upload'; file: File } | { kind: 'remove' }

export interface SaveProfileVariables {
  profile: UpdateProfileRequest
  avatar: AvatarChange
  /** Ausente: os campos de senha ficaram em branco e a senha não muda. */
  password: ChangePasswordRequest | null
}

export interface SaveProfileResult {
  passwordChanged: boolean
}

/**
 * O "Salvar" único do Figma: dados, depois avatar, depois senha. Cada etapa
 * confirmada já vira cache; se uma falha, as anteriores continuam valendo e o
 * erro (com `fieldErrors` de nomes distintos) aponta o campo da etapa.
 */
export function useSaveProfile(userId: string) {
  const queryClient = useQueryClient()
  const announce = useAnnounce()
  const queryKey = profileKeys.detail(userId)

  return useMutation({
    mutationKey: [...queryKey, 'save'],
    mutationFn: async ({
      profile,
      avatar,
      password,
    }: SaveProfileVariables): Promise<SaveProfileResult> => {
      applyUser(queryClient, await updateProfile(profile))
      if (avatar.kind === 'upload') {
        applyUser(queryClient, await uploadAvatar(avatar.file))
      } else if (avatar.kind === 'remove') {
        applyUser(queryClient, await removeAvatar())
      }
      if (password) await changePassword(password)
      return { passwordChanged: password !== null }
    },
    onSuccess: ({ passwordChanged }) => {
      announce(
        passwordChanged ? 'Perfil e senha atualizados.' : 'Perfil atualizado.',
      )
    },
    onError: () => announce('Não foi possível salvar o perfil.', 'assertive'),
    onSettled: () => void queryClient.invalidateQueries({ queryKey }),
  })
}
