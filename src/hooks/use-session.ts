import { useSyncExternalStore } from 'react'
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { sessionToken, sessionUser } from '@/lib/session'
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
    queryFn: async ({ signal }): Promise<SessionInfo | null> => {
      if (!token) return null
      const info = await getSession(token, signal)
      sessionUser.note(token, info.user.id)
      return info
    },
    // Fresca logo após o login (sem refetch redundante). A expiração aparece
    // pelo guarda das rotas privadas, que revalida a cada entrada, e pela
    // volta à aba, que revalida sempre.
    staleTime: 60_000,
    refetchOnWindowFocus: 'always',
    // Sem resposta (rede, timeout, 5xx) o token continua valendo: a consulta
    // segue tentando em vez de deixar a sessão sem confirmação para sempre.
    refetchInterval: (query) =>
      query.state.status === 'error' ? SESSION_RETRY_MS : false,
  })
}

const SESSION_RETRY_MS = 10_000

/** Usuário da sessão `token`, se ela já foi confirmada neste navegador. */
export function sessionUserId(queryClient: QueryClient, token: string | null) {
  if (!token) return null
  return (
    queryClient.getQueryData<SessionInfo | null>(sessionKeys.detail(token))
      ?.user.id ?? sessionUser.of(token)
  )
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
  sessionUser.note(session.token, session.user.id)
  sessionToken.set(session.token)
}

/** Encerra `token` (por padrão, o atual) e descarta os dados privados. */
export function endSession(
  queryClient: QueryClient,
  token: string | null = sessionToken.get(),
) {
  sessionToken.clear(token)
  clearPrivateCache(queryClient, sessionToken.get())
}

/**
 * Outra aba entrou, saiu ou trocou de usuário: esta aba adota a sessão dela
 * e descarta os dados privados de qualquer outra.
 */
export function adoptExternalSession(queryClient: QueryClient) {
  clearPrivateCache(queryClient, sessionToken.get())
}

export function useSessionToken() {
  return useSyncExternalStore(sessionToken.subscribe, sessionToken.get)
}

export type SessionState =
  | {
      status: 'pending'
      /** A verificação falhou sem resposta; a consulta segue tentando sozinha. */
      failed: boolean
      retry: () => void
    }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: User; token: string }

export function useSession(): SessionState {
  const token = useSessionToken()
  const query = useQuery(sessionQueryOptions(token))
  if (!token) return { status: 'anonymous' }
  if (query.data)
    return { status: 'authenticated', user: query.data.user, token }
  // Um 401 já teria apagado o token. Falha sem resposta (rede, timeout, 5xx)
  // não rebaixa o colecionador a visitante: a sessão segue sem confirmação.
  return {
    status: 'pending',
    failed: query.isError,
    retry: () => void query.refetch(),
  }
}

/**
 * A sessão `token` ainda é a desta aba. Uma resposta que chega depois de uma
 * troca de sessão não volta a gravar o cache que a troca acabou de limpar.
 */
export function isCurrentSession(token: string | null | undefined) {
  return token != null && sessionToken.get() === token
}

/** Dono das chamadas privadas: usuário e token vêm do mesmo estado da sessão. */
export interface SessionOwner {
  userId: string
  token: string
}

export function useSessionOwner(): SessionOwner | null {
  const session = useSession()
  return session.status === 'authenticated'
    ? { userId: session.user.id, token: session.token }
    : null
}

/**
 * Token da sessão dona dos dados de `userId`. Se a sessão já é de outro
 * usuário, a chamada não sai: a resposta iria para a chave de quem saiu.
 */
export function ownerToken(owner: SessionOwner | null, userId: string) {
  if (!owner || owner.userId !== userId) throw new Error('Sessão encerrada.')
  return owner.token
}

/**
 * `queryFn` de uma consulta privada chaveada por `owner.userId`. O token fica
 * fora da chave de propósito: o mesmo usuário reentrando reaproveita o cache,
 * e o token enviado é sempre o da sessão em que a chave foi montada.
 */
export function ownerQueryFn<T>(
  owner: SessionOwner | null,
  fetcher: (token: string, signal: AbortSignal) => Promise<T>,
) {
  return ({ signal }: { signal: AbortSignal }) => {
    if (!owner) throw new Error('Sessão encerrada.')
    return fetcher(owner.token, signal)
  }
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
