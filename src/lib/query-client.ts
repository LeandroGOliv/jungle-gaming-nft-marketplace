import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

const MAX_QUERY_RETRIES = 2

function isClientError(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  return status !== undefined && status >= 400 && status < 500
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Um 4xx é resposta definitiva; repetir só mascara o erro.
        retry: (failureCount, error) =>
          !isClientError(error) && failureCount < MAX_QUERY_RETRIES,
      },
      mutations: {
        // Mutations não são repetidas automaticamente para não duplicar operações.
        retry: false,
      },
    },
  })
}
