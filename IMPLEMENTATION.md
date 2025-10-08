IMPLEMENTATION PLAN — Kypseli Cuts

This document converts the PRD into a practical, phase-driven implementation plan. Each phase contains goals, deliverables, technical notes, files to create/update, server functions to add, acceptance criteria, and estimated risk/effort.

Principles
- Edge-first: UI + server functions run inside a single Cloudflare Worker process.
- Drizzle + D1: use Drizzle ORM (sqlite-core + d1) and keep migrations offline until user approval.
- Server functions: prefer TanStack Start `createServerFn` / `useServerFn` hooks instead of REST API routes.
- Zod-first validation: validate all server-function inputs with Zod.
- No migrations run without explicit approval: migrations SQL and drizzle config will be authored and committed, but not executed.

Phase 0 — Repo hygiene & small infra
- Goal: Make sure the repo has clear places for schema, server functions, and Drizzle config; add a short DEV checklist.
- Deliverables:
  - `drizzle.config.ts` (committed, not run)
  - `drizzle/migrations/0001_init.sql` (example SQL; not applied)
  - `src/lib/schema.ts` (already present)
  - `src/lib/db.ts` (Drizzle client factory; already present)
  - `IMPLEMENTATION.md` (this file)
- Acceptance:
  - Files exist and TypeScript compiles.
- Risk: very low.

Phase 1 — Data model & types (safe, no migrations run)
- Goal: Finalize Drizzle schema, inference types, and Zod schemas used by server functions.
- Deliverables:
  - `src/lib/schema.ts` (finalized table definitions)
  - `src/lib/types.ts` (Drizzle inferred Select/Insert types + Zod schemas & mappers)
  - `drizzle/migrations/` SQL files (committed, await approval)
- Files to review/expect:
  - `src/lib/schema.ts` — services, staff, staff_schedules, blackouts, customers, bookings
  - `src/lib/types.ts` — `$inferSelect` / `$inferInsert` exports and Zod validators
- Acceptance:
  - `pnpm exec tsc --noEmit` passes.
- Risk: low.

Phase 2 — Server functions & admin CRUD (admin-first)
- Goal: Replace dummy admin UI with real server-function-driven CRUD for Services (extend to Staff, Hours, Blackouts next).
- Deliverables:
  - `src/server/services.server-fns.ts` — `createService`, `listServices`, `updateService`, `deleteService` (CRUD)
  - `src/routes/admin/*` — use `listServices` to render, use `createService` from a small admin form
  - Zod validation for all server fn inputs
- Acceptance:
  - Admin page can create a service and list it (persisted to D1 when connected at runtime).
  - No dummy data in admin UI.
- Notes:
  - Server functions written and committed; they'll run against D1 at runtime via `env` binding.
  - Don't run migrations until the owner approves.
- Risk: medium (runtime binding issues); mitigations: local typecheck and small smoke tests.

Phase 3 — Bookings & availability core
- Goal: Implement slot generation, create booking server function with concurrency guard, and the booking UI flow.
- Deliverables:
  - Server functions: `getSlots`, `createBooking`, `getBooking`, `cancelBooking`
  - Booking UI pages: `/book`, booking stepper, `/confirm/:bookingId`
  - DB constraints/migration SQL for unique `(staffId, startTs)`
  - Tests: unit tests for slot generation and booking collision handling
- Acceptance:
  - Booking creation works and validator prevents overlapping booking in normal use.
  - Unique constraint SQL ready for migration.
- Notes on concurrency:
  - Use DB unique constraint + handle duplicate-key error in `createBooking` to return SLOT_TAKEN.
- Risk: high (edge-case handling and date math). Start with simple optimistic approach and add robust checks.

Phase 4 — Admin: staff, schedules, blackouts
- Goal: Complete Admin CRUD for staff, weekly schedules, and blackouts. Ensure slot generation uses these models.
- Deliverables:
  - Server functions and admin pages for Staff, StaffSchedules, Blackouts
  - Small UI components for weekly schedule editing & copy/paste
- Acceptance:
  - Editing staff hours and blackouts affects `getSlots` results.
- Risk: medium.

Phase 5 — Auth, sessions, and admin security
- Goal: Replace client-side localStorage auth with httpOnly cookie session (HMAC-signed) or lightweight auth.
- Deliverables:
  - Server function `adminLogin` that verifies env.PASSWORD and sets a secure cookie
  - Middleware helper to enforce admin session on server functions and admin loaders
- Acceptance:
  - Admin routes protected by server-session cookie; login sets cookie; logout clears it.
- Notes:
  - For v1 a single env password is acceptable; longer-term: Lucia/third-party auth.
- Risk: medium (cookie handling on Workers). Use `createResponse` patterns from TanStack Start examples.

Phase 6 — Tests, migrations, deployment plan
- Goal: Add CI checks, migration release steps, and a safe deploy checklist.
- Deliverables:
  - Unit tests (Vitest) for core logic
  - `drizzle/migrations/*.sql` with migration plan and `drizzle.config.ts`
  - `README.md` dev & deploy checklist (how to apply migrations manually, how to create D1 db, env vars)
- Acceptance:
  - CI runs tsc and tests; migration SQL reviewed and approved by owner before running.
- Risk: low to medium.

Phase 7 — Polish, perf, and accessibility
- Goal: Improve UI polish, accessibility, and perf to meet PRD targets (Lighthouse, TTI).
- Deliverables:
  - Accessibility pass, focus order, keyboard navigation
  - Performance improvements (code-splitting, cache headers, edge caching where safe)
  - Analytics/monitoring hooks (opt-in, excluded from v1)
- Acceptance:
  - Lighthouse Mobile >= 95 target (iterative)
- Risk: medium.

Migration & Deployment Policy (important)
- All migration SQL and drizzle configs are authored, committed, and reviewed but never run without explicit owner approval.
- To apply migrations: owner runs `pnpm run drizzle:push` (or `drizzle-kit` commands) from a machine with access to the D1 DB and a vetted secret set.
- Keep migrations small and reversible when possible; prefer many small migrations over large ones.

Files to add / edit (summary)
- src/lib/schema.ts (exists)
- src/lib/types.ts (exists/iterate)
- src/lib/db.ts (exists)
- src/server/services.server-fns.ts (added)
- src/server/bookings.server-fns.ts (planned)
- src/routes/admin/index.tsx (edited)
- drizzle.config.ts, drizzle/migrations/*.sql (committed)

Acceptance & QA checklist
- Typecheck: `pnpm exec tsc --noEmit` (green)
- Unit tests for core slot & booking logic (Vitest)
- Manual QA: create service via admin, view service in booking UI, create booking, confirm booking appears in admin
- Security: admin login via httpOnly cookie; input validation with Zod

Next actions (short-term)
1. Finish admin CRUD for Services (update & delete) and wire inline edit UX.
2. Implement booking slot generator server function and mock UI to consume it.
3. Add DB unique constraint migration SQL for booking collisions and review with owner.

If you want, I can now:
- Create `IMPLEMENTATION.md` (done) and open a PR with these changes.
- Continue implementing the next concrete code step: finish `src/server/services.server-fns.ts` CRUD and add tests.


