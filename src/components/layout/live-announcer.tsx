import { useCallback, useEffect, useRef, useState } from 'react'
import { AnnouncerContext } from '@/hooks/use-announce'
import type { Announce, AnnounceUrgency } from '@/hooks/use-announce'

type Messages = Record<AnnounceUrgency, string>

/**
 * Regiões vivas únicas da aplicação. Ficam montadas desde o início porque
 * leitores de tela ignoram mensagens escritas numa região recém-criada.
 */
export function LiveAnnouncer({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Messages>({
    polite: '',
    assertive: '',
  })
  const timers = useRef<Partial<Record<AnnounceUrgency, number>>>({})

  const announce = useCallback<Announce>((message, urgency = 'polite') => {
    window.clearTimeout(timers.current[urgency])
    // Esvazia antes de escrever para que a mesma mensagem seja lida de novo.
    setMessages((current) => ({ ...current, [urgency]: '' }))
    timers.current[urgency] = window.setTimeout(() => {
      setMessages((current) => ({ ...current, [urgency]: message }))
    }, 50)
  }, [])

  useEffect(() => {
    const pending = timers.current
    return () => {
      window.clearTimeout(pending.polite)
      window.clearTimeout(pending.assertive)
    }
  }, [])

  return (
    <AnnouncerContext value={announce}>
      {children}
      <div className="sr-only" role="status" aria-live="polite">
        {messages.polite}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive">
        {messages.assertive}
      </div>
    </AnnouncerContext>
  )
}
