import { setupWorker } from 'msw/browser'
import { createHandlers } from './handlers'
import { resolveLatency } from './network'
import { createMockRuntime } from './runtime'
import { isScenarioId } from './scenarios'
import { createBrowserStorage } from './storage'
import type { MockRuntime } from './runtime'
import type { LatencyPresetId } from '@/types/simulation'
import { env } from '@/lib/env'

const SCENARIO_PARAM = 'scenario'
const LATENCY_PARAM = 'latency'

function isLatencyPreset(value: string | null): value is LatencyPresetId {
  if (value === null) return false
  try {
    resolveLatency(value as LatencyPresetId)
    return true
  } catch {
    return false
  }
}

/**
 * `?scenario=<id>` restaura os dados do cenário e `?latency=<preset>` troca a
 * latência. Os parâmetros saem da URL antes do router iniciar, para um refresh
 * não repetir o reset.
 */
function applyUrlParams(runtime: MockRuntime) {
  const url = new URL(window.location.href)
  const scenario = url.searchParams.get(SCENARIO_PARAM)
  const latency = url.searchParams.get(LATENCY_PARAM)
  if (scenario === null && latency === null) return

  if (scenario !== null && !isScenarioId(scenario)) {
    console.warn(`[mocks] cenário desconhecido: ${scenario}`)
  }
  if (latency !== null && !isLatencyPreset(latency)) {
    console.warn(`[mocks] latência desconhecida: ${latency}`)
  }
  const preset = isLatencyPreset(latency) ? latency : undefined

  if (isScenarioId(scenario)) runtime.control.selectScenario(scenario, preset)
  else if (preset) runtime.control.setLatency(preset)

  url.searchParams.delete(SCENARIO_PARAM)
  url.searchParams.delete(LATENCY_PARAM)
  window.history.replaceState(window.history.state, '', url)
}

export async function enableMocking() {
  const runtime = createMockRuntime({
    storage: createBrowserStorage(),
    apiUrl: env.apiUrl,
    socketPath: env.socketPath,
  })
  applyUrlParams(runtime)

  const worker = setupWorker(...createHandlers(env.apiUrl, runtime))
  await worker.start({
    onUnhandledRequest(request, print) {
      // Só a API simulada precisa de handler; assets e HMR seguem para a rede.
      if (new URL(request.url).pathname.startsWith('/api/')) {
        print.error()
      }
    },
  })
  // Exposto só com o worker ativo: quem espera por ele já pode fazer requisições.
  window.__mocks = runtime.control
}
