import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import type { WebSocketHandlerConnection } from 'msw'
import type { MockStore } from './db'
import type {
  NftUpdatedData,
  RealtimeEnvelope,
  RealtimeEventName,
} from '@/types/realtime'

// Engine.IO: o servidor envia "2" (ping) e o cliente responde "3" (pong).
const ENGINE_IO_PING = '2'
// Abaixo do pingInterval + pingTimeout (30s) anunciado no handshake do binding.
const PING_INTERVAL_MS = 20_000
// Pacote CONNECT do namespace padrão: "4" (mensagem Engine.IO) + "0" (CONNECT Socket.IO).
const SOCKET_IO_CONNECT = '40'

interface RealtimeConnection {
  emit: (event: string, ...data: Array<unknown>) => void
  close: () => void
  /** `auth` enviado pelo cliente no handshake; o binding não o expõe. */
  auth: Record<string, unknown> | null
}

export interface RealtimeHub {
  /** Handler MSW do WebSocket do Socket.IO. */
  handler: ReturnType<ReturnType<typeof ws.link>['addEventListener']>
  broadcast: (event: RealtimeEventName, payload: unknown) => void
  setAvailable: (available: boolean) => void
  connectionCount: () => number
}

function readConnectAuth(data: unknown) {
  if (typeof data !== 'string' || !data.startsWith(SOCKET_IO_CONNECT)) {
    return undefined
  }
  const body = data.slice(SOCKET_IO_CONNECT.length)
  if (!body.startsWith('{')) return null
  try {
    return JSON.parse(body) as Record<string, unknown>
  } catch {
    return null
  }
}

export function createRealtimeHub(options: {
  path: string
  isAvailable: () => boolean
}): RealtimeHub {
  const connections = new Set<RealtimeConnection>()
  // O caminho precisa ser o mesmo de `env.socketPath`. Um caminho próprio evita
  // capturar outros WebSockets da mesma origem, como o HMR do Vite.
  const link = ws.link(`*${options.path}`)

  function accept(connection: WebSocketHandlerConnection) {
    if (!options.isAvailable()) {
      connection.client.close()
      return
    }

    const io = toSocketIo(connection)
    const entry: RealtimeConnection = {
      emit: (event, ...data) => io.client.emit(event, ...data),
      close: () => connection.client.close(),
      auth: null,
    }
    connections.add(entry)

    connection.client.addEventListener('message', (event) => {
      const auth = readConnectAuth(event.data)
      if (auth !== undefined) entry.auth = auth
    })

    // O binding não implementa o heartbeat; sem ele o cliente encerra a
    // conexão por "ping timeout" e reconecta em ciclo.
    const heartbeat = setInterval(
      () => connection.client.send(ENGINE_IO_PING),
      PING_INTERVAL_MS,
    )
    connection.client.addEventListener('close', () => {
      clearInterval(heartbeat)
      connections.delete(entry)
    })
  }

  return {
    handler: link.addEventListener('connection', accept),
    broadcast(event, payload) {
      for (const connection of connections) connection.emit(event, payload)
    },
    setAvailable(available) {
      if (available) return
      for (const connection of connections) connection.close()
      connections.clear()
    },
    connectionCount: () => connections.size,
  }
}

/**
 * Toda alteração de NFT no store vira `nft.updated`: a mesma mudança aparece na
 * REST e no Socket.IO. O id do evento deriva da versão, então reemitir a mesma
 * mudança gera uma duplicata reconhecível.
 */
export function bridgeStoreToRealtime(store: MockStore, hub: RealtimeHub) {
  return store.subscribe((changes) => {
    for (const change of changes) {
      if (change.type !== 'nft') continue
      const nft = store.state.nfts.find((n) => n.id === change.id)
      if (!nft) continue

      const envelope: RealtimeEnvelope<NftUpdatedData> = {
        eventId: `evt_nft_${nft.id}_v${nft.version}`,
        resource: { type: 'nft', id: nft.id },
        version: nft.version,
        emittedAt: new Date().toISOString(),
        data: {
          priceEth: nft.priceEth,
          editions: nft.editions.map(({ id, available }) => ({
            id,
            available,
          })),
        },
      }
      hub.broadcast('nft.updated', envelope)
    }
  })
}
