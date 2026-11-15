import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  checkHealth,
  expireSessions,
  getSimulation,
  resetSimulation,
  updateSimulation,
} from '@/services/simulation'
import type {
  SimulationResetRequest,
  SimulationState,
} from '@/types/simulation'

export const simulationKeys = {
  state: ['simulation'] as const,
}

export function useSimulation() {
  return useQuery({
    queryKey: simulationKeys.state,
    queryFn: ({ signal }) => getSimulation(signal),
  })
}

export function useUpdateSimulation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateSimulation,
    onSuccess: (state) => queryClient.setQueryData(simulationKeys.state, state),
  })
}

export function useResetSimulation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: SimulationResetRequest) => resetSimulation(request),
    onSuccess: async (state: SimulationState) => {
      queryClient.setQueryData(simulationKeys.state, state)
      // Todos os dados simulados mudaram: nada do cache anterior continua válido.
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] !== simulationKeys.state[0],
      })
    },
  })
}

/** Vence as sessões abertas; a próxima chamada autenticada recebe 401. */
export function useExpireSessions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: expireSessions,
    onSuccess: (state) => queryClient.setQueryData(simulationKeys.state, state),
  })
}

/** Uma requisição comum à API, sujeita à latência e às falhas do cenário. */
export function useHealthCheck() {
  return useMutation({
    mutationFn: async () => {
      const startedAt = performance.now()
      await checkHealth()
      return { durationMs: Math.round(performance.now() - startedAt) }
    },
  })
}
