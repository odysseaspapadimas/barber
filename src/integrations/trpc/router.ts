import { authRouter } from "@/server/auth";
import { createTRPCRouter } from "./init";
import { servicesRouter } from "@/server/services";

export const trpcRouter = createTRPCRouter({
  services: servicesRouter,
  auth: authRouter,
});

export type TRPCRouter = typeof trpcRouter;
