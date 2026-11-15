import { HttpResponse, http } from 'msw'
import { apiErrorResponse } from '../errors'
import { CONTROL_PATH } from '../runtime'
import type { MockRuntime } from '../runtime'
import type {
  HealthStatus,
  SimulationResetRequest,
  SimulationUpdate,
} from '@/types/simulation'

function invalid(error: unknown) {
  return apiErrorResponse(422, {
    message: error instanceof Error ? error.message : 'Requisição inválida.',
  })
}

/**
 * API de controle usada pela página /simulacao. Fica isenta da latência e das
 * falhas do cenário, para continuar operável mesmo em "Sem conexão".
 */
export function createSimulationHandlers(apiUrl: string, runtime: MockRuntime) {
  const { control } = runtime
  const base = `${apiUrl}${CONTROL_PATH}`

  return [
    http.get(base, () => HttpResponse.json(control.getState())),

    http.patch(base, async ({ request }) => {
      try {
        runtime.update((await request.json()) as SimulationUpdate)
        return HttpResponse.json(control.getState())
      } catch (error) {
        return invalid(error)
      }
    }),

    http.post(`${base}/reset`, async ({ request }) => {
      try {
        const body = (await request
          .json()
          .catch(() => ({}))) as SimulationResetRequest
        if (body.scenarioId)
          control.selectScenario(body.scenarioId, body.latency)
        else control.reset()
        return HttpResponse.json(control.getState())
      } catch (error) {
        return invalid(error)
      }
    }),

    http.post<{ orderId: string }>(
      `${base}/orders/:orderId/settle`,
      async ({ request, params }) => {
        const body = (await request.json().catch(() => ({}))) as {
          outcome?: unknown
        }
        if (body.outcome !== 'confirmed' && body.outcome !== 'refused') {
          return invalid(new Error('Informe o desfecho: confirmed ou refused.'))
        }
        try {
          control.settleOrder(params.orderId, body.outcome)
          return HttpResponse.json(control.getState())
        } catch (error) {
          return invalid(error)
        }
      },
    ),

    http.post(`${base}/expire-sessions`, () => {
      control.expireSessions()
      return HttpResponse.json(control.getState())
    }),

    // Sonda da rede simulada: passa pela latência e pelas falhas do cenário.
    http.get(`${apiUrl}/health`, () =>
      HttpResponse.json<HealthStatus>({
        status: 'ok',
        checkedAt: new Date().toISOString(),
      }),
    ),
  ]
}
