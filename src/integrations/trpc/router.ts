import { authRouter } from "./routers/auth";
import { createTRPCRouter } from "./init";
import { servicesRouter } from "./routers/services";
import { staffRouter } from "./routers/staff";
import { schedulesRouter } from "./routers/schedules";
import { bookingsRouter } from "./routers/bookings";

export const trpcRouter = createTRPCRouter({
  services: servicesRouter,
  staff: staffRouter,
  schedules: schedulesRouter,
  bookings: bookingsRouter,
  auth: authRouter,
});

export type TRPCRouter = typeof trpcRouter;
