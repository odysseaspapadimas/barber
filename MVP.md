MVP — Barber booking app
=========================

Goal
----
Allow customers to view services, pick a staff/time slot, and create a booking. Admins can manage services, staff, and weekly schedules.

Core user stories
-----------------
1. As a customer I can view available services and select one.
2. As a customer I can pick a staff member or auto-assign one and see available time slots for a chosen date.
3. As a customer I can book a chosen slot (name, contact email/phone optional), receive a confirmation page with a booking ID.
4. As an admin I can CRUD services, staff, and schedules (existing admin UI covers much of this).
5. Auth: Admin users must sign in. Bookings are created without an account (guest flow).

Success criteria (acceptance)
-----------------------------
- End-to-end booking flow: service -> staff/time selection -> booking created -> confirmation page shows booking details and ID.
- Slot availability respects staff schedules and existing bookings (no double-booking).
- Admin can create/update/delete services/staff/schedules and see bookings (minimal UI listing).
- No runtime TypeScript errors; local dev runs via `pnpm dev`.
- Basic tests: 5-8 unit/integration tests to validate booking creation and availability edge cases.

Data model (Drizzle)
--------------------
- tables: services, staff, schedules (already present), bookings (new)
  - bookings:
    - id (int, pk, autoinc)
    - serviceId (fk -> services.id)
    - staffId (fk -> staff.id) nullable if auto-assigned
    - startAt (datetime / integer minute-since-epoch)
    - endAt (datetime / integer)
    - customerName (text)
    - customerContact (text)
    - createdAt (datetime default now)
    - status (enum: confirmed, cancelled)

API surface (tRPC)
------------------
- `trpc.bookings.list({ date?, staffId?, serviceId? })` -> list bookings for a date range
- `trpc.bookings.available({ date, serviceId, staffId? })` -> list of available slots (startAt, endAt, staffId)
- `trpc.bookings.create({ serviceId, staffId?, startAt, customerName, customerContact })` -> create booking, returns booking id
- `trpc.bookings.get({ id })` -> single booking

Contracts & validation
----------------------
- Validate input times are aligned to schedule slot intervals.
- Availability check must confirm no overlapping booking exists for staff at the requested time.
- If staffId omitted, server picks the first available staff for that slot (or returns error if none).

Pages & UI mapping (repo)
-------------------------
- Public:
  - `src/routes/index.tsx` — extend with booking entry
  - `src/routes/confirm/$bookingId.tsx` — already present (update to show booking details)
  - New route: `src/routes/book/[serviceId].tsx` or `src/routes/book.tsx` — service selection -> date/time -> confirm
  - Components:
    - `src/components/BookingForm.tsx` — existing; extend to handle the new flow.
    - `src/components/ui/LoadingButton.tsx` — new utility (optional)
    - `src/components/ui/Pending.tsx` — already added
- Admin:
  - `src/routes/admin/*` — admin pages exist; add `admin/bookings.tsx` to list bookings for admins.

Server-side (patterns)
----------------------
- Add `src/server/bookings.ts` that uses Drizzle `db` from `src/data/db/index.ts`.
- Expose tRPC router `bookings` and wire into `src/integrations/trpc/router.ts`.
- Use `protectedProcedure`/`adminProcedure` for admin endpoints.
- Follow `src/server/auth.ts` / `admin/route.tsx` patterns for cookie propagation.

Sprint 1 plan (6-8 days)
-------------------------
Day 1 (schema & wiring)
- Finalize `bookings` Drizzle schema and add migration (drizzle-kit).
- Add basic Drizzle queries in `src/server/bookings.ts` (list/create/check availability).
- Add tRPC endpoints in `src/integrations/trpc/bookings.ts` and wire into `router.ts`.

Day 2 (validation & tests)
- Implement availability logic and server-side validation.
- Add unit tests for availability and booking creation (Vitest).

Day 3 (frontend flow)
- Add `src/routes/book.tsx` or `src/routes/book/[serviceId].tsx`.
- Implement service selection, date picker, and slot list (`trpc.bookings.available`).
- Submit booking via `trpc.bookings.create`, redirect to confirmation.

Day 4 (confirmation + admin)
- Implement `src/routes/confirm/$bookingId.tsx` to display booking.
- Add `src/routes/admin/bookings.tsx` to list bookings for admins.

Day 5 (polish & tests)
- Add `LoadingButton`, input validations, edge-case UI messages.
- Integration tests for booking flow.
- Fix lint/type issues.

Deliverables
------------
- Drizzle schema + migration for `bookings`
- `src/server/bookings.ts` with availability and create logic
- tRPC `bookings` router
- Frontend booking flow and confirm page
- Admin bookings listing page
- 5-8 tests and README dev notes

Risks & mitigations
-------------------
- Timezones: MVP treats times as local server timezone. For production, move to UTC and implement timezone-aware rendering.
- Race conditions: re-check availability on create; return 409 on conflict. For stronger guarantees use DB-level locks/transactions.
- Schedules complexity: start with weekly templates; exclude recurring/complex rules from MVP.

Next action
-----------
I set `Define MVP` in-progress. Tell me which to start next:
- "Start schema" — I'll add Drizzle `bookings` schema and migration and wire a basic server file + tRPC router.
- "Produce task estimates" — I'll expand the sprint plan with hour estimates per task.

