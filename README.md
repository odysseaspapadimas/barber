## Overview

A barber shop booking and management system built with **TanStack Start**, **tRPC**, **Drizzle ORM**, and **Better Auth**. Deployed on **Cloudflare Workers** with **D1 database**.

### Key Features

- 🔐 **Secure admin dashboard** with Better Auth (email/password, SSR-safe sessions)
- ✂️ **Service & staff management** with full CRUD operations
- 📅 **Schedule management** for staff availability and bookings
- 🎨 **Modern UI** with Tailwind CSS 4 + shadcn/ui components
- ⚡ **Type-safe API** via tRPC with end-to-end TypeScript
- 🌐 **SSR + streaming** with TanStack Start for optimal performance
- 🗄️ **Serverless database** with Cloudflare D1 + Drizzle ORM

## Prerequisites

- **Node.js** 22+ (LTS recommended)
- **pnpm** 9+
- **Cloudflare account** (for deployment)

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server (localhost:3000)
pnpm dev

# Build for production
pnpm build

# Deploy to Cloudflare Workers
pnpm deploy
```

### First-Time Setup

1. **Create admin user**: Sign up at `/admin/signup` (ensure `disableSignUp: false` in `src/auth/server.ts`)
2. **Mark user as admin**: Update `user.isAdmin = true` in D1 database via Drizzle Studio (`pnpm db:studio`) or SQL
3. **Disable signup** (optional): Set `disableSignUp: true` in `src/auth/server.ts` after creating admin

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Vite dev server with HMR (port 3000) |
| `pnpm build` | Build for Cloudflare Workers production |
| `pnpm serve` | Preview production build locally |
| `pnpm deploy` | Deploy to Cloudflare (via Wrangler) |
| `pnpm db:generate` | Generate Drizzle migrations from schema |
| `pnpm db:migrate` | Apply migrations to D1 database |
| `pnpm db:studio` | Open Drizzle Studio GUI for database |
| `pnpm db:push` | Push schema directly to D1 (dev only) |
| `pnpm test` | Run Vitest test suite |

## Architecture

### Stack Overview

- **Frontend**: React 19 + TanStack Router (file-based routing) + TanStack Query (data fetching)
- **Backend**: tRPC (type-safe API) + Cloudflare Workers (serverless runtime)
- **Database**: Cloudflare D1 (SQLite) + Drizzle ORM (schema & migrations)
- **Auth**: Better Auth (sessions, password hashing, SSR cookie handling)
- **Styling**: Tailwind CSS 4 + shadcn/ui components

### Key Directories

```
src/
├── routes/              # File-based routes (pages + API)
│   ├── __root.tsx       # Root layout with devtools
│   ├── admin/           # Admin dashboard pages (guarded)
│   └── api/             # API endpoints (auth, trpc)
├── integrations/        # Framework integrations
│   ├── trpc/            # tRPC routers, procedures, context
│   └── tanstack-query/  # Query client setup, SSR config
├── auth/                # Better Auth server & client config
├── db/                  # Drizzle schema & database client
├── components/          # React components (UI + forms)
└── lib/                 # Shared utilities & types
```

### Important Patterns

#### 1. SSR Data Prefetching

Routes use `loader` functions to prefetch data during SSR. Components consume data via `useSuspenseQuery`:

```tsx
// src/routes/admin/services.tsx
export const Route = createFileRoute("/admin/services")({
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.services.list.queryOptions()
    );
  },
  component: ServicesPage,
});

function ServicesPage() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.services.list.queryOptions());
  // Component has data immediately, even during SSR
}
```

#### 2. Query Invalidation After Mutations

Always invalidate queries after mutations to keep UI in sync:

```tsx
const { mutateAsync } = useMutation(
  trpc.services.add.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.services.list.queryKey()
      });
    },
  })
);
```

#### 3. Protected Routes & Procedures

Use `protectedProcedure` and `adminProcedure` for auth-guarded endpoints (defined in `src/integrations/trpc/init.ts`):

```ts
// src/integrations/trpc/routers/services.ts
export const servicesRouter = {
  list: publicProcedure.query(async () => { /* ... */ }),
  add: adminProcedure.input(schema).mutation(async ({ input }) => { /* ... */ }),
};
```

#### 4. SSR Cookie Propagation

Better Auth mutations (login/logout) must propagate `set-cookie` headers. The tRPC context includes `responseHeaders` for this:

```ts
// src/integrations/trpc/routers/auth.ts
const response = await auth.api.signInEmail({
  body: input,
  headers: ctx.request.headers,
  asResponse: true,
});

const setCookieHeader = response.headers.get("set-cookie");
if (setCookieHeader && ctx.responseHeaders) {
  ctx.responseHeaders.set("set-cookie", setCookieHeader);
}
```

## Database Management

### Schema Changes

1. Edit `src/db/schema.ts` (add/modify tables)
2. Generate migration: `pnpm db:generate`
3. Apply migration: `pnpm db:migrate` (local) or `wrangler deploy` (production)
4. Commit migration files in `drizzle/migrations/`

### Database Schema

Tables: `services`, `staff`, `staff_schedules`, `blackouts`, `customers`, `bookings`, `user`, `session`, `account`, `verification`

- Timestamps stored as integer ms (`timestamp_ms` mode)
- Booleans stored as 0/1 (`boolean` mode)
- Auto-updated `updatedAt` via `$onUpdate(() => new Date())`

## Deployment

### Cloudflare Workers

1. **Configure Wrangler**: Edit `wrangler.json` (set `database_id`, `vars`)
2. **Set secrets**: Add `ADMIN_PASSWORD`, `SESSION_SECRET` in Cloudflare dashboard or `.dev.vars`
3. **Deploy**: `pnpm build && pnpm deploy`

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SESSION_SECRET` | 32+ char secret for session encryption | Yes |
| `ADMIN_PASSWORD` | Initial admin password | Yes (dev only) |
| `D1_DATABASE_ID` | Cloudflare D1 database ID | Yes (prod) |
| `D1_ACCOUNT_ID` | Cloudflare account ID | Yes (prod) |
| `D1_TOKEN` | Cloudflare API token | Yes (prod) |

## Development Workflow

### Adding a New Feature

1. **Define schema** (if needed): Edit `src/db/schema.ts` → `pnpm db:generate` → `pnpm db:migrate`
2. **Create tRPC router**: Add to `src/integrations/trpc/routers/` and register in `router.ts`
3. **Build UI**: Create route in `src/routes/admin/` with `loader` for SSR prefetch
4. **Test locally**: `pnpm dev` and verify functionality
5. **Deploy**: `pnpm build && pnpm deploy`

### Code Quality

- **Type safety**: Use Zod for input validation on tRPC procedures
- **Error handling**: Use tRPC error codes (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, etc.)
- **Testing**: Add Vitest tests for business logic (current coverage is minimal)

## Styling & Components

### Tailwind CSS 4

Uses `@tailwindcss/vite` plugin for fast builds. Config lives in `tailwind.config.js`.

### shadcn/ui

Add components via CLI:

```bash
pnpx shadcn@latest add [component-name]
```

Components live in `src/components/ui/` and use `class-variance-authority` for variants.

## Troubleshooting

### "NOT_AUTHENTICATED" errors during SSR
- Ensure `getRequestHeaders()` is called in tRPC client during SSR (see `src/integrations/tanstack-query/root-provider.tsx`)
- Verify `ctx.request.headers` is passed to `auth.api.*` methods

### Cookies not setting after login
- Check `ctx.responseHeaders` is passed to `fetchRequestHandler` in `src/routes/api.trpc.$.tsx`
- Ensure `auth.api.*` calls use `asResponse: true` and extract `set-cookie` header

### Database migration conflicts
- Never edit migration files manually
- If schema changes fail, reset with `pnpm db:generate` and create a new migration

## Resources

- **TanStack Start**: [tanstack.com/start](https://tanstack.com/start)
- **tRPC**: [trpc.io](https://trpc.io)
- **Better Auth**: [better-auth.com](https://better-auth.com)
- **Drizzle ORM**: [orm.drizzle.team](https://orm.drizzle.team)
- **Cloudflare D1**: [developers.cloudflare.com/d1](https://developers.cloudflare.com/d1)

## License

This project is licensed under the MIT License.

---

**AI Agent Instructions**: See [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for detailed architecture patterns and conventions.
