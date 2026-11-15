import { createContext, useContext } from 'react'

export type AnnounceUrgency = 'polite' | 'assertive'

export type Announce = (message: string, urgency?: AnnounceUrgency) => void

export const AnnouncerContext = createContext<Announce | null>(null)

/**
 * Publica uma mensagem nas regiões vivas do layout, para leitores de tela.
 * Use `assertive` só para falhas que interrompem a tarefa.
 */
export function useAnnounce(): Announce {
  const announce = useContext(AnnouncerContext)
  if (!announce) {
    throw new Error('useAnnounce precisa estar dentro de <LiveAnnouncer>.')
  }
  return announce
}
