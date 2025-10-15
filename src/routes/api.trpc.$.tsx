import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { trpcRouter } from "../integrations/trpc/router";
import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

async function handler({ request }: { request: Request }) {
  const response = await fetchRequestHandler({
    req: request,
    router: trpcRouter,
    endpoint: "/api/trpc",
    createContext: ({ resHeaders }) => ({
      request,
      env,
      responseHeaders: resHeaders,
    }),
    onError: ({ error }) => {
      console.error("tRPC error:", error);
    },
  });

  return response;
}

export const Route = createFileRoute("/api/trpc/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
});
