import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
  const queryClient = TanstackQuery.createQueryClient();
  const serverHelpers = TanstackQuery.createServerHelpers({
    queryClient,
  });

  const router = createRouter({
    routeTree,
    context: {
      queryClient,
      trpc: serverHelpers,
    },
    defaultPreload: "intent",
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <TanstackQuery.Provider queryClient={queryClient}>
          {props.children}
        </TanstackQuery.Provider>
      );
    },
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
};
