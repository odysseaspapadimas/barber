import { db } from "@/db";
import { services } from "@/db/schema";
import { publicProcedure, protectedProcedure } from "@/integrations/trpc/init";
import { servicesInsertSchema } from "@/lib/types";
import type { TRPCRouterRecord } from "@trpc/server";

export const servicesRouter = {
  list: publicProcedure.query(() => db.query.services.findMany()),
  add: protectedProcedure.input(servicesInsertSchema).mutation(({ input }) => {
    return db.insert(services).values(input).returning();
  }),
} satisfies TRPCRouterRecord;
