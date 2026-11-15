import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { env } from '@/lib/env'

interface SocketOptions {
  /** Token da sessão; `null` conecta como visitante, só a eventos públicos. */
  token: string | null
}

export function createSocket({ token }: SocketOptions): Socket {
  return io(env.socketUrl, {
    // O binding do MSW para Socket.IO só intercepta WebSocket, não long-polling.
    transports: ['websocket'],
    path: env.socketPath,
    autoConnect: false,
    auth: token ? { token } : {},
  })
}
