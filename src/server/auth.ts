import { publicProcedure } from "@/integrations/trpc/init";
import { auth } from "@/lib/auth";

import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authRouter = {
  login: publicProcedure.input(LoginSchema).mutation(({ input }) => {
    return auth.api.signInEmail({ body: input });
  }),
} satisfies TRPCRouterRecord;
