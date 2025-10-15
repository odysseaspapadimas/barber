## Overview

This project is a barber shop management dashboard built with TanStack Start, tRPC, Drizzle ORM, and Better Auth. It provides a secure admin experience for managing services, staff, and bookings while preserving end-to-end type safety.

Key features:

- **Authenticated admin area** backed by Better Auth sessions that work during SSR and client navigations.
- **Service management** with TanStack Query powered data fetching and cache invalidation.
- **Staff management** with full CRUD flows for adding, editing, and retiring team members.
- **Cloudflare D1 + Drizzle ORM** for a lightweight, serverless-friendly datastore.
- **Modern UI** built with Tailwind CSS and shadcn/ui primitives.

## Prerequisites

- Node.js 22+
- pnpm 9+

Install dependencies once:

```bash
pnpm install
```

## Running Locally

Start the development server with hot module reloading:

```bash
pnpm dev
```

By default the app runs on <http://localhost:3000>. The admin area lives under `/admin` and requires an authenticated Better Auth session. Sign in via `/admin/login` and ensure the user has the `isAdmin` flag set.

## Production Build

Create an optimized build that matches the Cloudflare Workers deployment target:

```bash
pnpm build
```

You can preview the production build locally with:

```bash
pnpm serve
```

## Testing

Vitest powers the test suite. Run all tests with:

```bash
pnpm test
```

## Architecture Notes

- **tRPC**: All server interactions flow through `src/integrations/trpc`. We use `adminProcedure` and `protectedProcedure` helpers to guard endpoints. After the latest update, SSR queries reuse incoming cookies via `getRequestHeaders`, fixing `NOT_AUTHENTICATED` errors on server-rendered pages.
- **TanStack Query**: Queries live in route loaders for SSR prefetching and in components via `useSuspenseQuery`. Mutations invalidate the relevant query keys to keep data fresh.
- **Database**: Table schemas are defined in `src/db/schema.ts` and mirrored in Drizzle migrations under `drizzle/migrations`.

## Styling & Components

Tailwind CSS provides utility-first styling. You can augment the design system with shadcn/ui components:

```bash
pnpx shadcn@latest add button
```

## Project Structure Highlights

- `src/routes` – file-based route tree (generated definitions live in `routeTree.gen.ts`).
- `src/integrations` – framework wiring for tRPC, TanStack Query, and auth.
- `src/server` – tRPC routers exposed to the client.
- `src/components` – shared UI primitives and composites.

For more information on TanStack Router and TanStack Query, visit the [TanStack documentation](https://tanstack.com).
