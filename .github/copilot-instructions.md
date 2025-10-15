This repository uses TanStack Start (React), tRPC, Drizzle (Cloudflare D1), and Better Auth. The note below highlights the codebase-specific patterns and workflows an AI coding agent should follow to make safe, useful changes.

Key quick facts
- Dev: pnpm dev (Vite on port 3000)
- Build: pnpm build
- DB migrations: drizzle-kit generate / drizzle-kit migrate (migrations in `drizzle/migrations`)
- Cloudflare Worker entry: `src/server.ts`, Wrangler config at `wrangler.json` (d1 binding `barber`)

Architecture / major components (read these files):
- Routes & SSR: `src/routes/*` (file-based routes). Root: `src/routes/__root.tsx` and admin guard `src/routes/admin/route.tsx`.
- tRPC wiring: `src/integrations/trpc/*` — `init.ts` (context, protected/admin procedures), `router.ts` (combined routers), `react.ts` (TRPC provider). The tRPC HTTP adapter is routed at `src/routes/api.trpc.$.tsx`.
- Auth: `src/lib/auth.ts` (Better Auth config + reactStartCookies integration). Server endpoints that call Better Auth (set-cookie propagation) are in `src/server/auth.ts` and `/api/auth/$` route.
- DB: `src/db/schema.ts` defines Drizzle tables (source of truth). `src/db/index.ts` wires D1 via drizzle. Use drizzle-kit to generate migrations from schema changes.
- UI: `src/components/*` and `src/routes/admin/*` for admin pages.

Important patterns and gotchas
- SSR cookie propagation: server-side tRPC calls rely on passing incoming request headers to Better Auth. The `api.trpc` route creates a `responseHeaders` Headers object and returns them via `responseMeta()` so server-side calls can set `set-cookie` and propagate them to the client. Keep that pattern when adding endpoints that may set cookies.
- Header access in procedures: use the tRPC context `ctx.request.headers` on the server to call Better Auth (do not assume `getRequestHeaders()` from client components). For client-side calls, tRPC client links are configured to forward headers during SSR (see `root-provider.tsx`).
- Authentication helpers: `protectedProcedure` and `adminProcedure` are implemented in `src/integrations/trpc/init.ts`. Use them to protect tRPC routes (do not duplicate logic).
- TanStack Query SSR prefetch: route `loader` functions call `context.trpc.*.queryOptions()` and `context.queryClient.prefetchQuery(...)` to prefetch data. Follow the same approach for new routes to preserve SSR hydration.
- Mutations must invalidate queries: use `trpc.*.mutationOptions({ onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.<collection>.list.queryKey() }) })` or call `queryClient.invalidateQueries` manually after mutation success. This codebase uses `useMutation` + `mutationOptions` patterns.

Where to look for examples
- Implemented service CRUD patterns: `src/server/services.ts`, `src/routes/admin/index.tsx` (CreateServiceForm, ServiceRow) — shows validation, mutationOptions, and invalidation.
- Staff CRUD: `src/server/staff.ts`, `src/routes/admin/staff.tsx` — full create/update/delete flows and prefetch in loader.
- Login/logout + Set-Cookie: `src/server/auth.ts`, `src/routes/admin/login.tsx`.

Developer workflows & commands
- Install: `pnpm install`
- Run dev server: `pnpm dev` (port 3000). Uses Vite + TanStack Start dev server.
- Run migrations: `pnpm db:generate` to regenerate Drizzle migration files, `pnpm db:migrate` to apply. Migrations live in `drizzle/migrations` and are applied by Wrangler/D1 in production via `wrangler deploy`.
- Build for production (Cloudflare Workers): `pnpm build` then `wrangler deploy`.
- Run tests: `pnpm test` (Vitest). Tests are minimal; run locally.

Project-specific conventions
- File-based routes use `createFileRoute` with `loader` and `ssr` decisions. Prefer `useSuspenseQuery` for data-bound components when SSR prefetching is used.
- Use `trpc.<router>.<endpoint>.<queryOptions|mutationOptions|queryKey>()` helpers to integrate tRPC + tanstack-query. Example: `trpc.services.list.queryOptions()` used in route loader prefetch.
- Better Auth integration uses `auth.api.*` methods directly in server code and always forwards `ctx.request.headers` and collects `Set-Cookie` from responses into `ctx.responseHeaders` so the outer HTTP reply includes cookie headers.
- Database code uses Drizzle `sqliteTable` + `db.query`/`db.insert`/`db.update` patterns. The canonical table shapes are in `src/db/schema.ts`.

Safety and style notes for changes
- Preserve `responseHeaders` propagation in any new server handler that uses Better Auth (login, logout, sign-up). Missing this will break cookie setting during SSR.
- Keep all auth checks in `protectedProcedure`/`adminProcedure` rather than scattering header/session checks around.
- When adding client components that run during SSR, ensure loaders prefetch the queries (use `context.trpc...queryOptions()` in `loader`) so the HTML contains hydrated data.

If anything above is unclear or you need examples of any pattern, ask for a targeted snippet and I will expand.
