import { auth } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { QueryClient } from "@tanstack/react-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

export const $getSession = createIsomorphicFn()
  .client(async (queryClient: QueryClient) => {
    const { data: session } = await queryClient.ensureQueryData({
      queryFn: () => authClient.getSession(),
      queryKey: ["auth", "getSession"],
      staleTime: 60_000, // cache for 1 minute
      revalidateIfStale: true, // fetch in background when stale
    });
    console.log('called from client')

    return {
      session,
    };
  })
  .server(async (_: QueryClient) => {
    const headers = getRequestHeaders();
    console.log('called from server')
    if (!headers) {
      return { session: null };
    }

    const session = await auth.api.getSession({
      headers,
    });

    return {
      session,
    };
  });
