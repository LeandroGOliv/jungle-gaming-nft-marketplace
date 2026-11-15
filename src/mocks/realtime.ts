import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import type { WebSocketHandlerConnection } from 'msw'
import { orderUpdatedEnvelope } from './orders'
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
  /** Usuário dono da conexão, resolvido no handshake; `null` é visitante. */
  userId: string | null
}

export interface RealtimeHub {
  /** Handler MSW do WebSocket do Socket.IO. */
  handler: ReturnType<ReturnType<typeof ws.link>['addEventListener']>
  broadcast: (event: RealtimeEventName, payload: unknown) => void
  /** Só para as conexões do usuário: eventos privados não vão a outra sessão. */
  sendToUser: (
    userId: string,
    event: RealtimeEventName,
    payload: unknown,
  ) => void
  setAvailable: (available: boolean) => void
  /**
   * Encerra as conexões autenticadas cuja sessão deixou de valer (logout,
   * expiração, reset): o cliente reconecta, e sem sessão volta como visitante.
   */
  revalidate: () => void
  connectionCount: () => number
  /**
   * Dono de cada conexão aberta, como resolvido no handshake. Uma conexão
   * esquecida pelo cliente continua visível aqui até a sessão dela terminar.
   */
  connectionUsers: () => Array<string | null>
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
  /** Resolve o usuário pelo `auth` do handshake. */
  resolveUser: (auth: Record<string, unknown> | null) => string | null
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
      userId: null,
    }
    connections.add(entry)

    connection.client.addEventListener('message', (event) => {
      const auth = readConnectAuth(event.data)
      if (auth !== undefined) {
        entry.auth = auth
        entry.userId = options.resolveUser(auth)
      }
    })

    // O binding não implementa o heartbeat; sem ele o cliente encerra a
    // conexão por "ping timeout" e reconecta em ciclo.
    // O mesmo intervalo encerra a conexão cuja sessão venceu pelo relógio.
    const heartbeat = setInterval(() => {
      if (!isCurrent(entry)) {
        entry.close()
        return
      }
      connection.client.send(ENGINE_IO_PING)
    }, PING_INTERVAL_MS)
    connection.client.addEventListener('close', () => {
      clearInterval(heartbeat)
      connections.delete(entry)
    })
  }

  /** Visitante sempre vale; conexão autenticada só enquanto a sessão dela vale. */
  function isCurrent(entry: RealtimeConnection) {
    return (
      entry.userId === null || options.resolveUser(entry.auth) === entry.userId
    )
  }

  return {
    handler: link.addEventListener('connection', accept),
    broadcast(event, payload) {
      for (const connection of connections) connection.emit(event, payload)
    },
    sendToUser(userId, event, payload) {
      for (const connection of connections) {
        // A sessão é conferida na entrega: um token vencido ou encerrado
        // deixa de receber eventos privados mesmo antes de a conexão cair.
        if (connection.userId === userId && isCurrent(connection)) {
          connection.emit(event, payload)
        }
      }
    },
    revalidate() {
      for (const connection of connections) {
        if (!isCurrent(connection)) connection.close()
      }
    },
    setAvailable(available) {
      if (available) return
      for (const connection of connections) connection.close()
      connections.clear()
    },
    connectionCount: () => connections.size,
    connectionUsers: () => [...connections].map((c) => c.userId),
  }
}

/**
 * Toda alteração de NFT no store vira `nft.updated` (e de pedido, `order.updated`): a mesma mudança aparece na
 * REST e no Socket.IO. O id do evento deriva da versão, então reemitir a mesma
 * mudança gera uma duplicata reconhecível. A época (o reset atual) entra no id
 * porque o reset faz as versões recomeçarem, e o id não pode se repetir.
 */
export function bridgeStoreToRealtime(
  store: MockStore,
  hub: RealtimeHub,
  epoch: () => string,
) {
  return store.subscribe((changes) => {
    for (const change of changes) {
      if (change.type === 'order') {
        // Pedido é privado: o evento vai só às conexões do dono.
        const order = store.state.orders.find((o) => o.id === change.id)
        if (order) {
          hub.sendToUser(
            order.userId,
            'order.updated',
            orderUpdatedEnvelope(order, epoch()),
          )
        }
        continue
      }
      if (change.type !== 'nft') continue
      const nft = store.state.nfts.find((n) => n.id === change.id)
      if (!nft) continue

      const envelope: RealtimeEnvelope<NftUpdatedData> = {
        eventId: `evt_nft_${nft.id}_v${nft.version}_${epoch()}`,
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
