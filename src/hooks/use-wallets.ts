import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAnnounce } from '@/hooks/use-announce'
import {
  isCurrentSession,
  ownerQueryFn,
  ownerToken,
  useSessionOwner,
  userKeys,
} from '@/hooks/use-session'
import { createWallet, listWallets, updateWallet } from '@/services/wallets'
import type { WalletInput, WalletSlot, WalletsResponse } from '@/types/wallet'

/** Carteiras são privadas: ficam sob o id do usuário e saem do cache no logout. */
export const walletKeys = {
  list: (userId: string) => [...userKeys.detail(userId), 'wallets'] as const,
}

/** Carteiras do usuário autenticado (a rota já exige sessão). */
export function useWallets() {
  const owner = useSessionOwner()
  const userId = owner?.userId ?? null
  const query = useQuery({
    queryKey: walletKeys.list(userId ?? 'anonymous'),
    queryFn: ownerQueryFn(owner, listWallets),
    enabled: owner !== null,
  })
  return { ...query, userId }
}

interface SaveWalletVariables {
  slot: WalletSlot
  /** Ausente cadastra a carteira da posição; presente, atualiza a existente. */
  walletId: string | null
  input: WalletInput
}

/**
 * Cadastra ou atualiza uma carteira. Sem atualização otimista: o formulário só
 * fecha com a resposta da API, que devolve a lista completa e vira o cache.
 */
export function useSaveWallet(userId: string) {
  const queryClient = useQueryClient()
  const announce = useAnnounce()
  const owner = useSessionOwner()
  const queryKey = walletKeys.list(userId)

  return useMutation({
    mutationKey: [...queryKey, 'save'],
    mutationFn: ({ slot, walletId, input }: SaveWalletVariables) =>
      walletId
        ? updateWallet(ownerToken(owner, userId), walletId, input)
        : createWallet(ownerToken(owner, userId), { ...input, slot }),
    onSuccess: (data, { slot, walletId }) => {
      if (isCurrentSession(owner?.token)) {
        queryClient.setQueryData<WalletsResponse>(queryKey, data)
      }
      announce(
        `Carteira ${slot === 'primary' ? 'principal' : 'secundária'} ${walletId ? 'atualizada' : 'cadastrada'}.`,
      )
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey }),
  })
}
