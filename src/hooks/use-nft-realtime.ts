import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAnnounce } from '@/hooks/use-announce'
import { useCartKey } from '@/hooks/use-cart'
import { cartNotices } from '@/hooks/use-cart-notices'
import { nftKeys } from '@/hooks/use-nfts'
import { useRealtimeSocket } from '@/hooks/use-realtime'
import {
  applyNftUpdate,
  createEventGate,
  describeCartChanges,
  describeNftChanges,
  isNftUpdatedEvent,
} from '@/utils/realtime'
import type { QueryClient, QueryKey } from '@tanstack/react-query'
import type { Cart } from '@/types/cart'
import type { Nft, NftListResponse, NftRelatedResponse } from '@/types/nft'
import type { NftUpdatedData, RealtimeEnvelope } from '@/types/realtime'

type NftEvent = RealtimeEnvelope<NftUpdatedData>
type NftCollection = NftListResponse | NftRelatedResponse

// O formato de cada entrada vem da chave, não dos dados: uma consulta nova sob
// `nftKeys.all` com outro formato não é alterada por engano.
const isDetailKey = (key: QueryKey) => key[1] === 'detail' && key.length === 3
const isCollectionKey = (key: QueryKey) =>
  key[1] === 'list' || (key[1] === 'detail' && key.at(-1) === 'related')

function queriesWhere(predicate: (key: QueryKey) => boolean) {
  return {
    queryKey: nftKeys.all,
    predicate: (query: { queryKey: QueryKey }) => predicate(query.queryKey),
  }
}

/** Maior versão do NFT entre detalhe, listas e relacionados em cache. */
function cachedVersion(queryClient: QueryClient, id: string) {
  const versions = [
    ...queryClient
      .getQueriesData<Nft>(queriesWhere(isDetailKey))
      .map(([, nft]) => nft),
    ...queryClient
      .getQueriesData<NftCollection>(queriesWhere(isCollectionKey))
      .flatMap(([, data]) => data?.items ?? []),
  ]
    .filter((nft) => nft?.id === id)
    .map((nft) => nft!.version)
  return versions.length > 0 ? Math.max(...versions) : undefined
}

function patchNftCaches(queryClient: QueryClient, event: NftEvent) {
  const id = event.resource.id
  queryClient.setQueriesData<Nft>(queriesWhere(isDetailKey), (nft) =>
    nft?.id === id ? applyNftUpdate(nft, event) : nft,
  )
  queryClient.setQueriesData<NftCollection>(
    queriesWhere(isCollectionKey),
    (data) => {
      if (!data?.items.some((nft) => nft.id === id)) return data
      return {
        ...data,
        items: data.items.map((nft) =>
          nft.id === id ? applyNftUpdate(nft, event) : nft,
        ),
      }
    },
  )
  // O preço novo pode tirar o NFT de um filtro ou mudar a ordenação: as
  // listas ficam marcadas para a REST recompor na próxima vez que montarem.
  void queryClient.invalidateQueries({
    queryKey: nftKeys.lists(),
    refetchType: 'none',
  })
}

function isObserved(
  queryClient: QueryClient,
  queryKey: ReadonlyArray<unknown>,
) {
  const query = queryClient.getQueryCache().find({ queryKey, exact: true })
  return (query?.getObserversCount() ?? 0) > 0
}

/**
 * Aplica `nft.updated` do socket da sessão ao catálogo, ao detalhe e ao
 * carrinho, e reconcilia pela REST após reconexão. Os listeners pertencem ao
 * socket atual: trocar de sessão troca o socket e descarta os avisos da anterior.
 */
export function useNftRealtime() {
  const socket = useRealtimeSocket()
  const queryClient = useQueryClient()
  const announce = useAnnounce()
  const cartKey = useCartKey()
  // Lido no momento do evento: a chave muda no login sem trocar de listener.
  const cartKeyRef = useRef(cartKey)
  useEffect(() => {
    cartKeyRef.current = cartKey
  }, [cartKey])

  useEffect(() => {
    if (!socket) return
    const gate = createEventGate()

    function onNftUpdated(payload: unknown) {
      if (!isNftUpdatedEvent(payload)) return
      const id = payload.resource.id
      if (!gate.accept(payload, cachedVersion(queryClient, id))) return

      const detailKey = nftKeys.detail(id)
      const shown = queryClient.getQueryData<Nft>(detailKey)
      const detailMessages =
        shown && isObserved(queryClient, detailKey)
          ? describeNftChanges(shown, payload)
          : []
      patchNftCaches(queryClient, payload)

      const key = cartKeyRef.current
      const cart = key ? queryClient.getQueryData<Cart>(key) : undefined
      let cartMessages: Array<string> = []
      if (key && cart?.items.some((line) => line.nftId === id)) {
        cartMessages = describeCartChanges(cart.items, payload)
        cartNotices.add(cartMessages)
        // Itens e cotação vêm da API: o carrinho recarrega e o resumo é recotado.
        void queryClient.invalidateQueries({ queryKey: key })
      }

      const messages = [...new Set([...detailMessages, ...cartMessages])]
      if (messages.length > 0) announce(messages.join(' '))
    }

    // Eventos perdidos durante a queda não voltam: a REST recompõe o que está na tela.
    function onReconnect() {
      gate.reset()
      void queryClient.invalidateQueries({ queryKey: nftKeys.all })
      const key = cartKeyRef.current
      if (key) void queryClient.invalidateQueries({ queryKey: key })
    }

    socket.on('nft.updated', onNftUpdated)
    socket.io.on('reconnect', onReconnect)
    return () => {
      socket.off('nft.updated', onNftUpdated)
      socket.io.off('reconnect', onReconnect)
      cartNotices.clear()
    }
  }, [socket, queryClient, announce])
}
