import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAnnounce } from '@/hooks/use-announce'
import { useRealtimeSocket } from '@/hooks/use-realtime'
import { useSessionOwner } from '@/hooks/use-session'
import {
  describeRequestError,
  getApiError,
  isUnauthorized,
} from '@/lib/http-error'
import {
  connectWallet,
  disconnectWallet,
  getWalletConnection,
} from '@/services/checkout'
import type {
  CreateWalletConnectionRequest,
  WalletConnection,
} from '@/types/checkout'
import type { WalletProvider } from '@/types/wallet'
import { createEventGate, isWalletDisconnectedEvent } from '@/utils/realtime'

export type ConnectionState =
  | { status: 'idle' }
  | { status: 'connecting'; request: CreateWalletConnectionRequest }
  | {
      status: 'connected'
      connection: WalletConnection
      /** Sessão que abriu a conexão: só ela a consulta e a encerra. */
      token: string
    }
  | {
      status: 'refused' | 'disconnected' | 'error'
      provider: WalletProvider
      message: string
    }

const sameTarget = (
  connection: WalletConnection,
  target: CreateWalletConnectionRequest,
) =>
  connection.walletAddress.toLowerCase() ===
    target.walletAddress.toLowerCase() &&
  connection.network === target.network &&
  connection.provider === target.provider

/**
 * Conexão simulada da carteira escolhida no pagamento. Recusa e desconexão
 * vêm da API e do Socket.IO (`wallet.disconnected`); trocar endereço, rede ou
 * provedor encerra a conexão, que só vale para aquela combinação.
 */
export function useWalletConnection() {
  const announce = useAnnounce()
  const socket = useRealtimeSocket()
  const token = useSessionOwner()?.token ?? null
  const [state, setState] = useState<ConnectionState>({ status: 'idle' })
  // Só a resposta do pedido de conexão mais recente vale.
  const attempt = useRef(0)
  const connected = state.status === 'connected' ? state : null
  const connectionId = connected?.connection.id ?? null
  const connectionToken = connected?.token ?? null

  const mutation = useMutation({
    mutationFn: (request: CreateWalletConnectionRequest) => {
      if (!token) throw new Error('Sessão encerrada.')
      return connectWallet(token, request).then((connection) => ({
        connection,
        token,
      }))
    },
  })

  const connect = useCallback(
    (request: CreateWalletConnectionRequest) => {
      const id = ++attempt.current
      setState({ status: 'connecting', request })
      mutation.mutate(request, {
        onSuccess: ({ connection, token: owner }) => {
          if (id !== attempt.current) {
            void disconnectWallet(owner, connection.id).catch(() => {})
            return
          }
          setState({ status: 'connected', connection, token: owner })
          announce('Carteira conectada.')
        },
        onError: (error) => {
          if (id !== attempt.current || isUnauthorized(error)) return
          const refused =
            getApiError(error)?.reason === 'WALLET_CONNECTION_REFUSED'
          const message = describeRequestError(error)
          setState({
            status: refused ? 'refused' : 'error',
            provider: request.provider,
            message,
          })
          announce(message, 'assertive')
        },
      })
    },
    // `mutation.mutate` é estável; o objeto da mutation não é.
    [announce, mutation.mutate],
  )

  /** Encerra a conexão atual (troca de carteira, rede ou provedor). */
  const reset = useCallback(() => {
    attempt.current += 1
    setState((current) => {
      if (current.status === 'connected') {
        void disconnectWallet(current.token, current.connection.id).catch(
          () => {},
        )
      }
      return { status: 'idle' }
    })
  }, [])

  /** A API respondeu que a conexão não vale mais (pedido recusado por isso). */
  const markDisconnected = useCallback(
    (message: string) => {
      setState((current) =>
        current.status === 'connected'
          ? {
              status: 'disconnected',
              provider: current.connection.provider,
              message,
            }
          : current,
      )
      announce(message, 'assertive')
    },
    [announce],
  )

  // A desconexão chega pelo socket da sessão; após reconectar, a REST confirma
  // se a conexão sobreviveu à queda (o evento pode ter se perdido).
  useEffect(() => {
    if (!socket || !connectionId || !connectionToken) return
    const gate = createEventGate()
    const controller = new AbortController()

    function onDisconnected(payload: unknown) {
      if (!isWalletDisconnectedEvent(payload)) return
      if (payload.resource.id !== connectionId) return
      if (!gate.accept(payload, 1)) return
      markDisconnected(payload.data.reason)
    }

    function onReconnect() {
      gate.reset()
      getWalletConnection(
        connectionToken!,
        connectionId!,
        controller.signal,
      ).then(
        (connection) => {
          if (connection.status !== 'connected') {
            markDisconnected('A carteira foi desconectada.')
          }
        },
        (error: unknown) => {
          if (getApiError(error)?.status === 404) {
            markDisconnected('A carteira foi desconectada.')
          }
        },
      )
    }

    socket.on('wallet.disconnected', onDisconnected)
    socket.io.on('reconnect', onReconnect)
    return () => {
      controller.abort()
      socket.off('wallet.disconnected', onDisconnected)
      socket.io.off('reconnect', onReconnect)
    }
  }, [socket, connectionId, connectionToken, markDisconnected])

  // A conexão é da tela: sair do pagamento a encerra.
  const latest = useRef(state)
  useEffect(() => {
    latest.current = state
  }, [state])
  useEffect(
    () => () => {
      const current = latest.current
      if (current.status === 'connected') {
        void disconnectWallet(current.token, current.connection.id).catch(
          () => {},
        )
      }
    },
    [],
  )

  const isConnectedTo = useCallback(
    (target: CreateWalletConnectionRequest | null) =>
      target !== null &&
      state.status === 'connected' &&
      sameTarget(state.connection, target),
    [state],
  )

  return { state, connect, reset, markDisconnected, isConnectedTo }
}
