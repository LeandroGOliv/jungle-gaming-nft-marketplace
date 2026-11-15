import { HttpResponse, delay, http } from 'msw'
import {
  orderRequestFingerprint,
  parseConnectionRequest,
  parseOrderRequest,
  prepareOrder,
} from '../checkout'
import { apiErrorResponse } from '../errors'
import { lookupSession, readBearerToken } from '../sessions'
import type { WalletConnectionRecord } from '../db'
import type { MockRuntime } from '../runtime'
import { IDEMPOTENCY_HEADER } from '@/types/checkout'
import type { WalletConnection } from '@/types/checkout'
import type { Order } from '@/types/order'
import { addEth } from '@/utils/eth'

const toConnection = ({
  userId: _userId,
  ...connection
}: WalletConnectionRecord): WalletConnection => ({ ...connection })

/**
 * Conexão simulada de carteira e pedidos. O pedido nasce `pending`; o runtime
 * agenda o desfecho do cenário, que sai como `order.updated` ao dono.
 */
export function createCheckoutHandlers(apiUrl: string, runtime: MockRuntime) {
  const { store } = runtime

  function authenticate(request: Request) {
    return lookupSession(store.state, readBearerToken(request), Date.now())
  }

  /** Mudança "durante a compra" do cenário, uma vez por reset. */
  function fireOrderTrigger(userId: string) {
    const trigger = runtime.checkoutScenario()?.onOrderAttempt
    if (!trigger || store.state.checkoutTriggers.includes(trigger)) return
    store.write((db) => {
      db.checkoutTriggers.push(trigger)
    })
    if (!(userId in store.state.carts)) return
    const cart = store.state.carts[userId]
    const first = cart.items.at(0)
    if (trigger === 'coupon-expired') {
      const code = cart.couponCode
      store.write((db) => {
        const coupon = db.coupons.find((c) => c.code === code)
        if (coupon) coupon.expiresAt = new Date(Date.now() - 1000).toISOString()
      })
      return
    }
    if (!first) return
    const nft = store.state.nfts.find((n) => n.id === first.nftId)
    if (!nft) return
    if (trigger === 'price-change') {
      runtime.updateNft(nft.id, { priceEth: addEth(nft.priceEth, '0.25') })
    } else {
      runtime.updateNft(nft.id, { available: { [first.editionId]: 0 } })
    }
  }

  return [
    http.post(`${apiUrl}/wallet-connections`, async ({ request }) => {
      const lookup = authenticate(request)
      if (!lookup.ok) return apiErrorResponse(401, { reason: lookup.reason })
      const userId = lookup.user.id
      const input = parseConnectionRequest(
        await request.json().catch(() => null),
      )
      if (!input) {
        return apiErrorResponse(422, {
          message: 'Informe endereço, rede e provedor válidos para conectar.',
        })
      }
      if (
        runtime.checkoutScenario()?.connection === 'refuse-first' &&
        !store.state.checkoutTriggers.includes('refuse-first')
      ) {
        store.write((db) => {
          db.checkoutTriggers.push('refuse-first')
        })
        return apiErrorResponse(403, {
          reason: 'WALLET_CONNECTION_REFUSED',
          message: 'A carteira recusou a conexão. Tente novamente.',
        })
      }
      const now = new Date().toISOString()
      const record: WalletConnectionRecord = {
        id: store.nextId('wcn'),
        userId,
        ...input,
        status: 'connected',
        connectedAt: now,
        version: 1,
        updatedAt: now,
      }
      store.write((db) => {
        // Uma conexão ativa por usuário: conectar outra encerra a anterior.
        for (const c of db.walletConnections) {
          if (c.userId === userId) c.status = 'disconnected'
        }
        db.walletConnections.push(record)
      })
      runtime.onWalletConnected(record)
      return HttpResponse.json<WalletConnection>(toConnection(record), {
        status: 201,
      })
    }),

    http.get<{ connectionId: string }>(
      `${apiUrl}/wallet-connections/:connectionId`,
      ({ request, params }) => {
        const lookup = authenticate(request)
        if (!lookup.ok) return apiErrorResponse(401, { reason: lookup.reason })
        const record = store.state.walletConnections.find(
          (c) => c.id === params.connectionId && c.userId === lookup.user.id,
        )
        if (!record) {
          return apiErrorResponse(404, {
            reason: 'WALLET_CONNECTION_NOT_FOUND',
            message: 'Conexão de carteira não encontrada.',
          })
        }
        return HttpResponse.json<WalletConnection>(toConnection(record))
      },
    ),

    http.delete<{ connectionId: string }>(
      `${apiUrl}/wallet-connections/:connectionId`,
      ({ request, params }) => {
        const lookup = authenticate(request)
        if (!lookup.ok) return apiErrorResponse(401, { reason: lookup.reason })
        store.write((db, tx) => {
          const record = db.walletConnections.find(
            (c) => c.id === params.connectionId && c.userId === lookup.user.id,
          )
          if (record?.status === 'connected') {
            record.status = 'disconnected'
            tx.touch('wallet-connection', record)
          }
        })
        return new HttpResponse(null, { status: 204 })
      },
    ),

    http.post(`${apiUrl}/orders`, async ({ request }) => {
      const lookup = authenticate(request)
      if (!lookup.ok) return apiErrorResponse(401, { reason: lookup.reason })
      const userId = lookup.user.id
      const key = request.headers.get(IDEMPOTENCY_HEADER)?.trim() ?? ''
      if (key === '' || key.length > 100) {
        return apiErrorResponse(422, {
          message: `Envie o header ${IDEMPOTENCY_HEADER}.`,
        })
      }
      const body = parseOrderRequest(await request.json().catch(() => null))

      const previous = store.state.orders.find(
        (o) => o.userId === userId && o.idempotencyKey === key,
      )
      if (previous) {
        const same =
          store.state.orderRequests[previous.id] ===
          orderRequestFingerprint(body)
        if (!same) {
          return apiErrorResponse(409, {
            reason: 'IDEMPOTENCY_KEY_REUSED',
            message: 'Esta tentativa de compra já foi usada com outros dados.',
          })
        }
        return HttpResponse.json<Order>(structuredClone(previous))
      }

      fireOrderTrigger(userId)

      const attempt = prepareOrder({
        userId,
        orderId: store.nextId('ord'),
        idempotencyKey: key,
        request: body,
        connection: store.state.walletConnections.find(
          (c) => c.id === body.connectionId,
        ),
        cart: store.state.carts[userId],
        nfts: store.state.nfts,
        coupons: store.state.coupons,
        now: Date.now(),
      })
      if (!attempt.ok) {
        return apiErrorResponse(attempt.status, {
          message: attempt.message,
          reason: attempt.reason,
          fieldErrors: attempt.fieldErrors,
        })
      }
      store.write((db) => {
        db.orders.push(attempt.order)
        db.orderRequests[attempt.order.id] = orderRequestFingerprint(body)
      })
      runtime.scheduleSettlement(attempt.order)

      if (
        runtime.checkoutScenario()?.order?.timeoutAfterCreate &&
        !store.state.checkoutTriggers.includes('order-timeout')
      ) {
        store.write((db) => {
          db.checkoutTriggers.push('order-timeout')
        })
        // O pedido existe, mas a resposta se perde: vale o timeout do cliente.
        await delay('infinite')
      }
      return HttpResponse.json<Order>(structuredClone(attempt.order), {
        status: 201,
      })
    }),

    http.get<{ orderId: string }>(
      `${apiUrl}/orders/:orderId`,
      ({ request, params }) => {
        const lookup = authenticate(request)
        if (!lookup.ok) return apiErrorResponse(401, { reason: lookup.reason })
        // Pedido de outro usuário responde como inexistente: nem a existência vaza.
        const order = store.state.orders.find(
          (o) => o.id === params.orderId && o.userId === lookup.user.id,
        )
        if (!order) {
          return apiErrorResponse(404, {
            reason: 'ORDER_NOT_FOUND',
            message: 'Pedido não encontrado.',
          })
        }
        return HttpResponse.json<Order>(structuredClone(order))
      },
    ),
  ]
}
