import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { trpcRouter } from '@/integrations/trpc/router'
import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'

async function handler({ request }: { request: Request }) {
  return fetchRequestHandler({
    req: request,
    router: trpcRouter,
    endpoint: '/api/trpc',
    createContext: () => ({
      request,
      env,
    }),
    onError: ({ error }) => {
      console.error('tRPC error:', error)
    },
  })
}

export const Route = createFileRoute('/api/trpc/$')({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
})
