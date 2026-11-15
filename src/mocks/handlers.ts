import { createAuthHandlers } from './handlers/auth'
import { createCartHandlers } from './handlers/cart'
import { createCheckoutHandlers } from './handlers/checkout'
import { createFavoriteHandlers } from './handlers/favorites'
import { createNftHandlers } from './handlers/nfts'
import { createProfileHandlers } from './handlers/profile'
import { createSimulationHandlers } from './handlers/simulation'
import { createWalletHandlers } from './handlers/wallets'
import type { MockRuntime } from './runtime'

/**
 * A ordem importa: o handler de rede vem primeiro para aplicar latência e
 * falhas antes de qualquer recurso; sem falha, ele deixa a requisição seguir.
 */
export function createHandlers(apiUrl: string, runtime: MockRuntime) {
  return [
    runtime.networkHandler,
    ...createSimulationHandlers(apiUrl, runtime),
    ...createAuthHandlers(apiUrl, runtime),
    ...createProfileHandlers(apiUrl, runtime),
    ...createNftHandlers(apiUrl, runtime),
    ...createFavoriteHandlers(apiUrl, runtime),
    ...createCartHandlers(apiUrl, runtime),
    ...createWalletHandlers(apiUrl, runtime),
    ...createCheckoutHandlers(apiUrl, runtime),
    runtime.realtimeHandler,
  ]
}
