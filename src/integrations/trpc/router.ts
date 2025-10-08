import { createTRPCRouter, publicProcedure } from "./init";

import { db } from "@/db";
import { services } from "@/db/schema";
import { servicesInsertSchema } from "@/lib/types";
import type { TRPCRouterRecord } from "@trpc/server";

const servicesRouter = {
  list: publicProcedure.query(() => db.query.services.findMany()),
  add: publicProcedure.input(servicesInsertSchema).mutation(({ input }) => {
    return db.insert(services).values(input).returning();
  }),
} satisfies TRPCRouterRecord;

export const trpcRouter = createTRPCRouter({
  services: servicesRouter,
});
export type TRPCRouter = typeof trpcRouter;
