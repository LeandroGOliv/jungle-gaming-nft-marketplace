import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAnnounce } from '@/hooks/use-announce'
import { useSession, userKeys } from '@/hooks/use-session'
import { describeRequestError, isUnauthorized } from '@/lib/http-error'
import {
  addFavorite,
  listFavorites,
  removeFavorite,
} from '@/services/favorites'
import type { FavoritesResponse } from '@/types/favorite'

/** Favoritos são privados: ficam sob o id do usuário e saem do cache no logout. */
export const favoriteKeys = {
  list: (userId: string) => [...userKeys.detail(userId), 'favorites'] as const,
}

/** Favoritos do usuário autenticado; desligado para visitantes. */
export function useFavorites() {
  const session = useSession()
  const userId = session.status === 'authenticated' ? session.user.id : null
  const query = useQuery({
    queryKey: favoriteKeys.list(userId ?? 'anonymous'),
    queryFn: ({ signal }) => listFavorites(signal),
    enabled: userId !== null,
  })
  return { ...query, userId }
}

interface ToggleFavoriteVariables {
  nftId: string
  nftName: string
  favorite: boolean
}

/**
 * Inclui ou remove um favorito com atualização otimista: a lista em cache
 * muda na hora e volta ao estado anterior se a API recusar.
 */
export function useToggleFavorite(userId: string) {
  const queryClient = useQueryClient()
  const announce = useAnnounce()
  const queryKey = favoriteKeys.list(userId)
  const mutationKey = [...queryKey, 'toggle']
  // Cliques seguidos geram mutations concorrentes: só a última a terminar
  // escreve no cache, para uma resposta antiga não desfazer um clique novo.
  const isLastPending = () => queryClient.isMutating({ mutationKey }) === 1

  return useMutation({
    mutationKey,
    mutationFn: ({ nftId, favorite }: ToggleFavoriteVariables) =>
      favorite ? addFavorite(nftId) : removeFavorite(nftId),
    onMutate: async ({ nftId, favorite }) => {
      // Uma consulta em andamento sobrescreveria o valor otimista ao chegar.
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<FavoritesResponse>(queryKey)
      queryClient.setQueryData<FavoritesResponse>(queryKey, (current) => {
        const ids = (current?.nftIds ?? []).filter((id) => id !== nftId)
        return { nftIds: favorite ? [...ids, nftId] : ids }
      })
      return { previous }
    },
    onError: (error, { favorite, nftName }, context) => {
      if (isLastPending()) queryClient.setQueryData(queryKey, context?.previous)
      // O 401 já encerra a sessão e abre o login; o aviso seria redundante.
      if (isUnauthorized(error)) return
      announce(
        `Não foi possível ${favorite ? 'favoritar' : 'desfavoritar'} ${nftName}. ${describeRequestError(error)}`,
        'assertive',
      )
    },
    onSuccess: (data, { favorite, nftName }) => {
      if (isLastPending()) queryClient.setQueryData(queryKey, data)
      announce(
        favorite
          ? `${nftName} adicionado aos favoritos.`
          : `${nftName} removido dos favoritos.`,
      )
    },
    onSettled: () => {
      if (isLastPending()) void queryClient.invalidateQueries({ queryKey })
    },
  })
}
