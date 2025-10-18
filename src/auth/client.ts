import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Use relative URL - works in both dev and production
  // Browser automatically resolves to the current origin
  baseURL: typeof window !== "undefined" ? window.location.origin : ""
});
