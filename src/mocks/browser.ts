import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

export async function enableMocking() {
  await worker.start({
    onUnhandledRequest(request, print) {
      // Só a API simulada precisa de handler; assets e HMR seguem para a rede.
      if (new URL(request.url).pathname.startsWith('/api/')) {
        print.error()
      }
    },
  })
}
