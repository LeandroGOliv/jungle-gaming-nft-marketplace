import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { env } from '@/lib/env'

export function createSocket(): Socket {
  return io(env.socketUrl, {
    // O binding do MSW para Socket.IO só intercepta WebSocket, não long-polling.
    transports: ['websocket'],
    path: env.socketPath,
    autoConnect: false,
  })
}
