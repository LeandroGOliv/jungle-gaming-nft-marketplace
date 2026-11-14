import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'

// Engine.IO: o servidor envia "2" (ping) e o cliente responde "3" (pong).
const ENGINE_IO_PING = '2'
// Abaixo do pingInterval + pingTimeout (30s) anunciado no handshake do binding.
const PING_INTERVAL_MS = 20_000

// O caminho precisa ser o mesmo de `env.socketPath`. Um caminho próprio evita
// capturar outros WebSockets da mesma origem, como o HMR do Vite.
const realtime = ws.link('*/realtime/')

export const realtimeHandlers = [
  realtime.addEventListener('connection', (connection) => {
    toSocketIo(connection)

    // O binding não implementa o heartbeat; sem ele o cliente encerra a
    // conexão por "ping timeout" e reconecta em ciclo.
    const heartbeat = setInterval(
      () => connection.client.send(ENGINE_IO_PING),
      PING_INTERVAL_MS,
    )
    connection.client.addEventListener('close', () => clearInterval(heartbeat))
  }),
]
