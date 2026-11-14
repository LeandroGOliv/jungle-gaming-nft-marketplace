import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { createQueryClient } from '@/lib/query-client'
import { getRouter } from './router'

async function bootstrap() {
  if (env.enableMocks) {
    const { enableMocking } = await import('./mocks/browser')
    await enableMocking()
  }

  const queryClient = createQueryClient()
  const router = getRouter({ queryClient })

  ReactDOM.createRoot(document.getElementById('app')!).render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

void bootstrap()
