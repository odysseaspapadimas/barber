# Barber Shop Management System - AI Agent Guide

This is a barber shop booking and management system built with **TanStack Start (React)**, **tRPC**, **Drizzle ORM (Cloudflare D1)**, and **Better Auth**. Read this guide to understand the architecture and conventions before making changes.

## Quick Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Build for Cloudflare Workers
pnpm deploy           # Deploy to Cloudflare (wrangler deploy)
pnpm db:generate      # Generate Drizzle migrations from schema
pnpm db:migrate       # Apply migrations to D1
pnpm db:studio        # Open Drizzle Studio GUI
pnpm test             # Run Vitest tests
```

## Architecture Overview

### File-Based Routing (`src/routes/*`)
- TanStack Start uses file-based routing with `createFileRoute`
- Root layout: `src/routes/__root.tsx` (includes devtools, head tags)
- Admin guard: `src/routes/admin/route.tsx` (checks auth via `beforeLoad`, redirects to `/admin/login`)
- Route files can export `loader` (SSR data fetching), `component`, `pendingComponent`, `errorComponent`
- Server routes can define GET/POST handlers via `server.handlers` (see `src/routes/api/auth/$.ts`)

### tRPC Integration (`src/integrations/trpc/*`)
- **Context & procedures**: `init.ts` defines tRPC context with `request`, `env`, `responseHeaders`. Exports `publicProcedure`, `protectedProcedure`, `adminProcedure`.
- **Router**: `router.ts` combines sub-routers (`services`, `staff`, `schedules`, `bookings`, `auth`)
- **React client**: `react.ts` exports `useTRPC()` hook
- **TanStack Query provider**: `src/integrations/tanstack-query/root-provider.tsx` wires tRPC client with superjson transformer and SSR header forwarding via `getRequestHeaders()` during SSR
- **HTTP adapter**: `src/routes/api.trpc.$.tsx` routes `/api/trpc/*` to `fetchRequestHandler`, passing `resHeaders` to tRPC context as `responseHeaders`

### Better Auth (`src/auth/server.ts`)
- Config uses `drizzleAdapter`, `emailAndPassword` provider, `reactStartCookies()` plugin for SSR cookie handling
- Session lifetime: 30 days, cookie cache enabled
- API endpoints at `/api/auth/*` (see `src/routes/api/auth/$.ts` for catch-all handler)
- **Critical**: All tRPC procedures that call `auth.api.*` must pass `ctx.request.headers` and capture `set-cookie` from responses into `ctx.responseHeaders` (see `src/integrations/trpc/routers/auth.ts` for example)

### Database (Drizzle + D1)
- Schema: `src/db/schema.ts` (source of truth). Tables: `services`, `staff`, `staff_schedules`, `blackouts`, `customers`, `bookings`, `user`, `session`, `account`, `verification`
- Timestamps are stored as integer ms (`timestamp_ms` mode), booleans as 0/1 (`boolean` mode)
- Migrations: `drizzle/migrations/*`, generated via `drizzle-kit generate`, applied during deployment
- D1 binding: `barber` (see `wrangler.json`)

### UI Components (`src/components/*`)
- Tailwind CSS 4 + shadcn/ui primitives (button, card, input, dialog, etc.)
- Admin-specific components in `src/components/admin/` (e.g., `AdminHeader.tsx`)
- Forms use controlled state + Zod validation (see `src/routes/admin/services.tsx` for example)

## Critical Patterns & Gotchas

### SSR Cookie Propagation
**Problem**: Server-side tRPC mutations that set cookies (login, logout) must propagate `set-cookie` headers to the client.

**Solution**: The tRPC HTTP adapter in `src/routes/api.trpc.$.tsx` passes `resHeaders` as `responseHeaders` in context. Mutations that call `auth.api.*` with `asResponse: true` extract `set-cookie` and add to `ctx.responseHeaders`:

```ts
const response = await auth.api.signInEmail({ body: input, headers: ctx.request.headers, asResponse: true });
const setCookieHeader = response.headers.get("set-cookie");
if (setCookieHeader && ctx.responseHeaders) {
  ctx.responseHeaders.set("set-cookie", setCookieHeader);
}
```

**Where to see this**: `src/integrations/trpc/routers/auth.ts` (login, logout mutations)

### SSR Data Prefetching
**Pattern**: Route `loader` functions prefetch tRPC queries so SSR renders with data. Components use `useSuspenseQuery` to consume prefetched data.

**Example** (`src/routes/admin/services.tsx`):
```ts
export const Route = createFileRoute("/admin/services")({
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(context.trpc.services.list.queryOptions());
  },
  component: RouteComponent,
});

function ServicesList() {
  const trpc = useTRPC();
  const { data: services } = useSuspenseQuery(trpc.services.list.queryOptions());
  // ...
}
```

### Query Invalidation After Mutations
**Rule**: Always invalidate relevant queries after mutations to keep UI in sync.

**Pattern** (`src/routes/admin/services.tsx`):
```ts
const { mutateAsync: addService } = useMutation(
  trpc.services.add.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.services.list.queryKey() });
    },
  })
);
```

### Authentication Procedures
- Use `protectedProcedure` for any endpoint requiring a valid session
- Use `adminProcedure` for admin-only endpoints (checks `user.isAdmin` flag in DB)
- **Never** duplicate auth checks—rely on these helpers in `src/integrations/trpc/init.ts`

**Example** (`src/integrations/trpc/routers/services.ts`):
```ts
export const servicesRouter = {
  list: publicProcedure.query(async () => { /* ... */ }),
  add: adminProcedure.input(serviceBaseSchema).mutation(async ({ input }) => { /* ... */ }),
};
```

### Database Schema Changes
1. Edit `src/db/schema.ts`
2. Run `pnpm db:generate` to create migration SQL in `drizzle/migrations/`
3. Run `pnpm db:migrate` to apply locally (or `wrangler deploy` applies in production)
4. **Never** manually edit migration files; regenerate from schema

## Development Guidelines

### Build and Run Commands
- **Do not run `pnpm dev` or `pnpm build` unless absolutely necessary** to check app integrity
- Only build when you need to verify TypeScript compilation or test the complete application
- Avoid running the development server during development unless specifically requested by the user
- Focus on code changes and let the user handle running/testing the application

## Code Examples

### Type-safe booking payloads (preferred)

When sending booking payloads from the client to the server prefer using the schema-derived types and select only the fields you need. This keeps client code aligned with the DB schema and avoids duplicate type declarations.

Example (preferred):

```ts
import type { BookingInsert } from "@/lib/types";

type CreateBookingPayload = Pick<
  BookingInsert,
  "serviceId" | "startTs" | "staffId" | "customerName" | "customerContact"
>;

// then use CreateBookingPayload where you craft the mutation input
```

This pattern is recommended over re-declaring ad-hoc types like `{ startTs: number; staffId: number }` so any schema changes propagate into your client types automatically.


### Adding a New tRPC Router
1. Create `src/integrations/trpc/routers/myrouter.ts`:
   ```ts
   import { adminProcedure, publicProcedure } from "../init";
   import type { TRPCRouterRecord } from "@trpc/server";
   import { z } from "zod";

   export const myRouter = {
     list: publicProcedure.query(async () => { /* ... */ }),
     create: adminProcedure.input(z.object({ name: z.string() })).mutation(async ({ input }) => { /* ... */ }),
   } satisfies TRPCRouterRecord;
   ```
2. Register in `src/integrations/trpc/router.ts`:
   ```ts
   export const trpcRouter = createTRPCRouter({
     // ...existing routers
     myRouter,
   });
   ```

### Adding a New Admin Page with Prefetch
1. Create `src/routes/admin/mypage.tsx`:
   ```tsx
   import { createFileRoute } from "@tanstack/react-router";
   import { useTRPC } from "@/integrations/trpc/react";
   import { useSuspenseQuery } from "@tanstack/react-query";

   export const Route = createFileRoute("/admin/mypage")({
     loader: async ({ context }) => {
       await context.queryClient.prefetchQuery(context.trpc.myRouter.list.queryOptions());
     },
     component: MyPageComponent,
   });

   function MyPageComponent() {
     const trpc = useTRPC();
     const { data } = useSuspenseQuery(trpc.myRouter.list.queryOptions());
     return <div>{JSON.stringify(data)}</div>;
   }
   ```

### Form Submission with Mutation + Invalidation
See `src/routes/admin/services.tsx` `CreateServiceForm` and `ServiceRow` for full CRUD patterns including:
- Controlled form state
- Zod validation before mutation
- `useMutation` with `mutationOptions({ onSuccess: () => invalidateQueries(...) })`
- Optimistic UI updates optional (not used currently)

## Reference Files for Common Tasks

| Task | Reference Files |
|------|----------------|
| CRUD patterns (services) | `src/integrations/trpc/routers/services.ts`, `src/routes/admin/services.tsx` |
| CRUD patterns (staff) | `src/integrations/trpc/routers/staff.ts`, `src/routes/admin/staff.tsx` |
| Auth login/logout | `src/integrations/trpc/routers/auth.ts`, `src/routes/admin/login.tsx` |
| Admin route guard | `src/routes/admin/route.tsx` |
| SSR data prefetch | `src/routes/admin/services.tsx` (loader + useSuspenseQuery) |
| Cookie propagation | `src/routes/api.trpc.$.tsx`, `src/integrations/trpc/routers/auth.ts` |
| Database schema | `src/db/schema.ts` |
| tRPC procedures | `src/integrations/trpc/init.ts` |

## Safety Checklist

Before submitting a PR or making changes:
- [ ] Auth mutations propagate `set-cookie` to `ctx.responseHeaders`
- [ ] Mutations invalidate relevant queries in `onSuccess`
- [ ] SSR routes prefetch data in `loader` and use `useSuspenseQuery`
- [ ] Protected routes use `protectedProcedure` or `adminProcedure`, not manual checks
- [ ] Schema changes followed by `pnpm db:generate` and migration committed
- [ ] Forms validate inputs with Zod before calling tRPC mutations

## Deployment

- **Local dev**: `pnpm dev` (uses `.dev.vars` for secrets, local D1 database)
- **Production**: `pnpm build && pnpm deploy` (reads `wrangler.json`, uses remote D1)

## Need Help?

- TanStack Start docs: [tanstack.com/start](https://tanstack.com/start)
- tRPC docs: [trpc.io](https://trpc.io)
- Better Auth docs: [better-auth.com](https://better-auth.com)
- Drizzle ORM docs: [orm.drizzle.team](https://orm.drizzle.team)
