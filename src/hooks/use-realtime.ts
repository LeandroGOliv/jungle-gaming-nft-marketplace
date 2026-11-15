import { createContext, useContext } from 'react'
import type { Socket } from 'socket.io-client'

/**
 * Socket da sessão atual, ou `null` enquanto conecta. Cada troca de sessão
 * cria um socket novo: quem assina eventos refaz a assinatura nele.
 */
export const RealtimeContext = createContext<Socket | null>(null)

export function useRealtimeSocket() {
  return useContext(RealtimeContext)
}
