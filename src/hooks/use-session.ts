import { useSyncExternalStore } from 'react'
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { sessionToken } from '@/lib/session'
import { getSession, login, logout, signUp } from '@/services/auth'
import type { QueryClient } from '@tanstack/react-query'
import type { AuthSession, SessionInfo } from '@/types/auth'
import type { User } from '@/types/user'

/**
 * A sessão é chaveada pelo token: a resposta de uma sessão nunca serve a outra,
 * nem quando uma consulta antiga termina depois da troca de usuário.
 */
export const sessionKeys = {
  all: ['session'] as const,
  detail: (token: string | null) => ['session', token ?? 'anonymous'] as const,
}

/** Raiz de toda consulta privada: os dados de cada usuário ficam sob o id dele. */
export const userKeys = {
  all: ['user'] as const,
  detail: (userId: string) => ['user', userId] as const,
}

export function sessionQueryOptions(token: string | null) {
  return queryOptions({
    queryKey: sessionKeys.detail(token),
    queryFn: ({ signal }): Promise<SessionInfo | null> =>
      token ? getSession(token, signal) : Promise.resolve(null),
    // Fresca logo após o login (sem refetch redundante). A expiração aparece
    // pelo guarda das rotas privadas, que revalida a cada entrada, e pela
    // volta à aba, que revalida sempre.
    staleTime: 60_000,
    refetchOnWindowFocus: 'always',
  })
}

/** Remove do cache tudo o que pertence a uma sessão que não é a atual. */
function clearPrivateCache(queryClient: QueryClient, keepToken: string | null) {
  void queryClient.cancelQueries({ queryKey: userKeys.all })
  queryClient.removeQueries({ queryKey: userKeys.all })
  queryClient.removeQueries({
    queryKey: sessionKeys.all,
    predicate: (query) =>
      query.queryKey[1] !== 'anonymous' && query.queryKey[1] !== keepToken,
  })
}

export function startSession(queryClient: QueryClient, session: AuthSession) {
  clearPrivateCache(queryClient, session.token)
  // O cache recebe a sessão antes do token, para a interface trocar de usuário
  // sem passar por um estado de carregamento.
  const info: SessionInfo = { expiresAt: session.expiresAt, user: session.user }
  queryClient.setQueryData(sessionQueryOptions(session.token).queryKey, info)
  sessionToken.set(session.token)
}

export function endSession(queryClient: QueryClient) {
  sessionToken.clear()
  clearPrivateCache(queryClient, null)
}

export function useSessionToken() {
  return useSyncExternalStore(sessionToken.subscribe, sessionToken.get)
}

export type SessionState =
  | { status: 'pending' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: User; token: string }

export function useSession(): SessionState {
  const token = useSessionToken()
  const query = useQuery(sessionQueryOptions(token))
  if (!token) return { status: 'anonymous' }
  if (query.data)
    return { status: 'authenticated', user: query.data.user, token }
  // Falha sem resposta (rede, timeout): sem sessão confirmada, trata como visitante.
  return query.isPending ? { status: 'pending' } : { status: 'anonymous' }
}

interface AuthMutationOptions {
  /**
   * Roda no nível do hook, depois de a sessão começar. O callback do `mutate`
   * não serviria: o formulário desmonta assim que a sessão começa.
   */
  onSuccess?: (session: AuthSession) => void
}

export function useLogin({ onSuccess }: AuthMutationOptions = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      startSession(queryClient, session)
      onSuccess?.(session)
    },
  })
}

export function useSignUp({ onSuccess }: AuthMutationOptions = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: signUp,
    onSuccess: (session) => {
      startSession(queryClient, session)
      onSuccess?.(session)
    },
  })
}

/**
 * Encerra a sessão localmente na hora e avisa a API em seguida: uma falha de
 * rede no logout não pode manter o colecionador conectado neste navegador.
 */
export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const token = sessionToken.get()
      endSession(queryClient)
      if (token) await logout(token).catch(() => undefined)
    },
  })
}
