import { authRouter } from "@/server/auth";
import { createTRPCRouter } from "./init";
import { servicesRouter } from "@/server/services";
import { staffRouter } from "@/server/staff";
import { schedulesRouter } from "@/server/schedules";
import { bookingsRouter } from "@/server/bookings";

export const trpcRouter = createTRPCRouter({
  services: servicesRouter,
  staff: staffRouter,
  schedules: schedulesRouter,
  bookings: bookingsRouter,
  auth: authRouter,
});

export type TRPCRouter = typeof trpcRouter;
