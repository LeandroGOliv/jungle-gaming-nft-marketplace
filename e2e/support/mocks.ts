import { test as base } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { RealtimeEventName } from '../../src/types/realtime'
import type {
  FaultRule,
  LatencyPresetId,
  LatencyProfile,
  NftPatch,
  ScenarioId,
  SimulationState,
} from '../../src/types/simulation'

interface GotoOptions {
  scenario?: ScenarioId
  /** Os testes rodam sem latência, salvo quando o cenário depende dela. */
  latency?: LatencyPresetId
}

/**
 * Controle da simulação nos testes. A navegação inicial seleciona o cenário
 * pela URL (o que restaura os dados dele); o resto passa por `window.__mocks`,
 * a mesma API que altera o store e emite pelo Socket.IO simulado.
 */
export class Mocks {
  constructor(private readonly page: Page) {}

  async goto(
    path = '/',
    { scenario = 'default', latency = 'none' }: GotoOptions = {},
  ) {
    const [pathname, query = ''] = path.split('?')
    const params = new URLSearchParams(query)
    params.set('scenario', scenario)
    params.set('latency', latency)
    await this.page.goto(`${pathname}?${params}`)
    await this.page.waitForFunction(() => window.__mocks !== undefined)
  }

  state(): Promise<SimulationState> {
    return this.page.evaluate(() => window.__mocks!.getState())
  }

  reset() {
    return this.page.evaluate(() => window.__mocks!.reset())
  }

  setLatency(latency: LatencyPresetId | LatencyProfile) {
    return this.page.evaluate((l) => window.__mocks!.setLatency(l), latency)
  }

  addFault(fault: FaultRule) {
    return this.page.evaluate((f) => window.__mocks!.addFault(f), fault)
  }

  setFaults(faults: Array<FaultRule>) {
    return this.page.evaluate((f) => window.__mocks!.setFaults(f), faults)
  }

  setRealtimeAvailable(available: boolean) {
    return this.page.evaluate(
      (a) => window.__mocks!.setRealtimeAvailable(a),
      available,
    )
  }

  /** Altera o NFT no store: a REST reflete e `nft.updated` sai pelo Socket.IO. */
  updateNft(id: string, patch: NftPatch) {
    return this.page.evaluate(
      ([nftId, p]) => window.__mocks!.updateNft(nftId, p),
      [id, patch] as const,
    )
  }

  /** Vence todas as sessões: a próxima chamada autenticada recebe 401. */
  expireSessions() {
    return this.page.evaluate(() => window.__mocks!.expireSessions())
  }

  /** Encerra as conexões de carteira: `wallet.disconnected` sai pelo Socket.IO. */
  disconnectWallets() {
    return this.page.evaluate(() => window.__mocks!.disconnectWallets())
  }

  /** Evento cru, para duplicatas e versões antigas. */
  emit(event: RealtimeEventName, payload: unknown) {
    return this.page.evaluate(
      ([name, data]) => window.__mocks!.emit(name, data),
      [event, payload] as const,
    )
  }
}

export const test = base.extend<{ mocks: Mocks }>({
  mocks: async ({ page }, use) => {
    await use(new Mocks(page))
  },
})

export { expect } from '@playwright/test'
