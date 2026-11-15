import { useEffect, useState } from 'react'
import { RealtimeContext } from '@/hooks/use-realtime'
import { useSessionToken } from '@/hooks/use-session'
import type { Socket } from 'socket.io-client'

/**
 * Uma conexão Socket.IO por sessão. O token vai no `auth` do handshake; ao
 * entrar, sair ou trocar de usuário, o socket anterior é desconectado com
 * todos os seus listeners, e eventos dele não chegam à sessão nova.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const token = useSessionToken()
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    let active = true
    let current: Socket | null = null

    // Import dinâmico: o engine.io captura o WebSocket global ao carregar, e
    // ele precisa ser o já interceptado pelo MSW.
    void import('@/lib/socket').then(({ createSocket }) => {
      if (!active) return
      current = createSocket({ token })
      current.connect()
      setSocket(current)
    })

    return () => {
      active = false
      current?.removeAllListeners()
      current?.disconnect()
      setSocket(null)
    }
  }, [token])

  return <RealtimeContext value={socket}>{children}</RealtimeContext>
}
