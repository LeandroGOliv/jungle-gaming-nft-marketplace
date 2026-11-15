import { useNftRealtime } from '@/hooks/use-nft-realtime'

/** Assina os eventos de tempo real; fica dentro do layout para usar as regiões vivas. */
export function RealtimeSync() {
  useNftRealtime()
  return null
}
