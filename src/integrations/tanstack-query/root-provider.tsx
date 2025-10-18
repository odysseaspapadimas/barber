import { QueryCache, QueryClient } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchLink,
  httpBatchStreamLink,
  loggerLink,
  splitLink,
  TRPCClientErrorLike,
} from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import type { TRPCRouter } from "../trpc/router";

import { TRPCProvider } from "../trpc/react";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

function getUrl() {
  if (typeof window !== "undefined") {
    // Client-side: always use relative URL
    return "/api/trpc";
  }
  
  // Server-side: use the incoming request's host to construct URL
  // This works in both local dev and production
  try {
    const headers = getRequestHeaders();
    const host = headers.get("host");
    
    if (host) {
      const protocol = headers.get("x-forwarded-proto") || 
                      (host.includes("localhost") ? "http" : "https");
      return `${protocol}://${host}/api/trpc`;
    }
  } catch (e) {
    // Ignore errors
  }
  
  // Fallback for local dev
  return "http://localhost:3000/api/trpc";
}

const headers = createIsomorphicFn()
  .client(() => ({}))
  .server(() => getRequestHeaders());

export const trpcClient = createTRPCClient<TRPCRouter>({
  links: [
    loggerLink({
      enabled: (op) =>
        process.env.NODE_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
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

const FIVE_MINUTES_CACHE = 5 * 60 * 1000;

export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      dehydrate: { serializeData: superjson.serialize },
      hydrate: { deserializeData: superjson.deserialize },
      queries: {
        staleTime: FIVE_MINUTES_CACHE,
        gcTime: FIVE_MINUTES_CACHE,
        retry(failureCount, _err) {
          const err = _err as unknown as TRPCClientErrorLike<TRPCRouter>;
          const code = err?.data?.code;
          if (
            code === "BAD_REQUEST" ||
            code === "FORBIDDEN" ||
            code === "UNAUTHORIZED"
          ) {
            return false;
          }
          const MAX_QUERY_RETRIES = 0;
          return failureCount < MAX_QUERY_RETRIES;
        },
      },
    },
    queryCache: new QueryCache(),
  });
};

export const createServerHelpers = ({
  queryClient,
}: {
  queryClient: QueryClient;
}) => {
  const serverHelpers = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient: queryClient,
  });
  return serverHelpers;
};

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
