import { publicClientApi } from '@/lib/http'
import type {
  HealthStatus,
  SimulationResetRequest,
  SimulationState,
  SimulationUpdate,
} from '@/types/simulation'

export async function getSimulation(signal?: AbortSignal) {
  const { data } = await publicClientApi.get<SimulationState>('/__simulation', {
    signal,
  })
  return data
}

export async function updateSimulation(update: SimulationUpdate) {
  const { data } = await publicClientApi.patch<SimulationState>(
    '/__simulation',
    update,
  )
  return data
}

export async function resetSimulation(request: SimulationResetRequest = {}) {
  const { data } = await publicClientApi.post<SimulationState>(
    '/__simulation/reset',
    request,
  )
  return data
}

export async function expireSessions() {
  const { data } = await publicClientApi.post<SimulationState>(
    '/__simulation/expire-sessions',
  )
  return data
}

export async function checkHealth() {
  const { data } = await publicClientApi.get<HealthStatus>('/health')
  return data
}
