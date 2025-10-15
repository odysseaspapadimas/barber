import { QueryClient } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchLink,
  httpBatchStreamLink,
  splitLink,
} from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import type { TRPCRouter } from "@/integrations/trpc/router";

import { TRPCProvider } from "@/integrations/trpc/react";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") return "";
    return `http://localhost:${process.env.PORT ?? 3000}`;
  })();
  return `${base}/api/trpc`;
}

const headers = createIsomorphicFn()
  .client(() => ({}))
  .server(() => getRequestHeaders());

export const trpcClient = createTRPCClient<TRPCRouter>({
  links: [
    splitLink({
      condition(op) {
        // Route auth.* operations to the non-streaming httpBatchLink
        return op.path.startsWith("auth.");
      },
      true: httpBatchLink({
        transformer: superjson,
        url: getUrl(),
        headers,
      }),
      false: httpBatchStreamLink({
        transformer: superjson,
        url: getUrl(),
        headers,
      }),
    }),
  ],
});

export const queryClient = new QueryClient({
  defaultOptions: {
    dehydrate: { serializeData: superjson.serialize },
    hydrate: { deserializeData: superjson.deserialize },
    queries: {
      staleTime: 60_000,
      
    }
  },
});

export const trpc = createTRPCOptionsProxy({
  client: trpcClient,
  queryClient: queryClient,
});

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      {children}
    </TRPCProvider>
  );
}
