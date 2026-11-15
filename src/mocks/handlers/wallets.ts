import { HttpResponse, http } from 'msw'
import { apiErrorResponse } from '../errors'
import { lookupSession, readBearerToken } from '../sessions'
import { parseWalletInput, validateWalletInput } from '../wallets'
import type { MockRuntime } from '../runtime'
import { WALLET_SLOTS } from '@/types/wallet'
import type { Wallet, WalletSlot, WalletsResponse } from '@/types/wallet'

const SLOT_ORDER: Record<WalletSlot, number> = { primary: 0, secondary: 1 }

/** Carteiras do usuário da sessão: consulta, cadastro (por posição) e atualização. */
export function createWalletHandlers(apiUrl: string, runtime: MockRuntime) {
  const { store } = runtime

  function authenticate(request: Request) {
    return lookupSession(store.state, readBearerToken(request), Date.now())
  }

  const listOf = (userId: string): WalletsResponse => ({
    wallets: [...(store.state.wallets[userId] ?? [])]
      .sort((a, b) => SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot])
      .map((wallet) => ({ ...wallet })),
  })

  return [
    http.get(`${apiUrl}/wallets`, ({ request }) => {
      const lookup = authenticate(request)
      if (!lookup.ok) return apiErrorResponse(401, { reason: lookup.reason })
      return HttpResponse.json<WalletsResponse>(listOf(lookup.user.id))
    }),

    http.post(`${apiUrl}/wallets`, async ({ request }) => {
      const lookup = authenticate(request)
      if (!lookup.ok) return apiErrorResponse(401, { reason: lookup.reason })
      const userId = lookup.user.id
      const body: unknown = await request.json().catch(() => null)
      const slot = (body as { slot?: unknown } | null)?.slot
      if (!WALLET_SLOTS.includes(slot as WalletSlot)) {
        return apiErrorResponse(422, {
          message: 'Posição de carteira inválida.',
        })
      }
      const wallets = store.state.wallets[userId] ?? []
      if (wallets.some((w) => w.slot === slot)) {
        return apiErrorResponse(409, {
          reason: 'WALLET_SLOT_TAKEN',
          message: 'Esta carteira já foi cadastrada. Recarregue para editá-la.',
        })
      }
      const input = parseWalletInput(body)
      const fieldErrors = validateWalletInput(
        input,
        wallets.find((w) => w.slot !== slot),
      )
      if (Object.keys(fieldErrors).length > 0) {
        return apiErrorResponse(422, { fieldErrors })
      }
      const wallet: Wallet = {
        ...input,
        id: store.nextId('wal'),
        slot: slot as WalletSlot,
        updatedAt: new Date().toISOString(),
      }
      store.write((db) => {
        db.wallets[userId] = [...(db.wallets[userId] ?? []), wallet]
      })
      return HttpResponse.json<WalletsResponse>(listOf(userId), { status: 201 })
    }),

    http.put<{ walletId: string }>(
      `${apiUrl}/wallets/:walletId`,
      async ({ request, params }) => {
        const lookup = authenticate(request)
        if (!lookup.ok) return apiErrorResponse(401, { reason: lookup.reason })
        const userId = lookup.user.id
        const wallets = store.state.wallets[userId] ?? []
        // Carteira de outro usuário responde como inexistente: não vaza o id.
        const current = wallets.find((w) => w.id === params.walletId)
        if (!current) {
          return apiErrorResponse(404, {
            reason: 'WALLET_NOT_FOUND',
            message: 'Esta carteira não existe mais. Recarregue a página.',
          })
        }
        const input = parseWalletInput(await request.json().catch(() => null))
        const fieldErrors = validateWalletInput(
          input,
          wallets.find((w) => w.slot !== current.slot),
        )
        if (Object.keys(fieldErrors).length > 0) {
          return apiErrorResponse(422, { fieldErrors })
        }
        store.write((db) => {
          db.wallets[userId] = (db.wallets[userId] ?? []).map((w) =>
            w.id === current.id
              ? { ...w, ...input, updatedAt: new Date().toISOString() }
              : w,
          )
        })
        return HttpResponse.json<WalletsResponse>(listOf(userId))
      },
    ),
  ]
}
