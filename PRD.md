Kypseli Cuts — Product Requirements (PRD)

Scope: Barber/Salon booking microsite for Kypseli.
Stack (chosen): TanStack Start (React) • Cloudflare Workers (edge) • D1 (SQLite) + Drizzle ORM • Tailwind/shadcn for UI.
Out of scope (explicitly excluded in v1): emails, analytics, automated reminders.

1) Objectives & Constraints
1.1 Business Objectives

Convert walk-ins/DMs to booked slots with minimal friction.

Reduce owner’s coordination time (calls/DMs).

Provide a simple self-service booking that reflects real availability.

1.2 Success (qualitative, no analytics in v1)

Owner can manage services/staff/hours without code changes.

A visitor can book in ≤ 60 seconds from the homepage.

Mobile Lighthouse ≥ 95; CLS < 0.05; TTI < 2.5s on mid devices.

Zero double bookings under normal use.

1.3 Constraints

Edge-hosted on Cloudflare Workers; single Worker exports fetch (app + API).

No email/SMS/analytics/reminder systems in v1.
# Kypseli Cuts — Product Requirements (PRD)

**Scope:** Barber/Salon booking microsite for Kypseli.

**Stack (chosen):** TanStack Start (React) • Cloudflare Workers (edge) • D1 (SQLite) + Drizzle ORM • Tailwind/shadcn for UI

**Out of scope (v1):** emails, analytics, automated reminders

---

## 1) Objectives & Constraints

### 1.1 Business Objectives

- Convert walk-ins/DMs to booked slots with minimal friction
- Reduce owner’s coordination time (calls/DMs)
- Provide a simple self-service booking that reflects real availability

### 1.2 Success (qualitative)

- Owner can manage services/staff/hours without code changes
- A visitor can book in ≤ 60 seconds from the homepage
- Mobile Lighthouse ≥ 95; CLS < 0.05; TTI < 2.5s on mid devices
- Zero double bookings under normal use

### 1.3 Constraints

- Edge-hosted on Cloudflare Workers; single Worker exports fetch (app + server functions)
- No email/SMS/analytics/reminder systems in v1
- Minimal data collection (name, phone; email optional and unused in v1)

---

## 2) Users & Use Cases

### 2.1 Personas

- Client (Guest): 18–55, books via phone; wants today/tomorrow slots quickly
- Owner: non-technical; needs to adjust prices, hours, off-days
- Staff (optional): view personal schedule (read-only in v1)

### 2.2 Top Use Cases

- Guest: Open site → see today’s slots → select service & barber → pick time → enter name/phone → confirm
- Owner: Sign in (single password env) → edit services (price/duration) → edit weekly hours → add blackout
- Owner: Inspect bookings for a day; manually cancel a slot if needed

---

## 3) User Journeys & Flows

### 3.1 Booking Flow (Guest)

- Home: Hero + “Κλείσε ραντεβού” CTA + “Διαθεσιμότητα σήμερα”
- Service selection: choose service (e.g., “Κούρεμα 30′, €15”)
- Staff (optional): pick barber or “No preference”
- Date: default today; arrows to next/prev days (max 14 days ahead)
- Time slot: list of valid slots (based on schedule & collisions)
- Details form: name (required), phone (required), email (optional), consent checkbox
- Confirm screen: success state with booking code
- Manage (optional): short-lived link to cancel/reschedule from success page (v1: cancel only)

### 3.2 Admin Flow (Owner)

- Auth: `/admin/login` → single password (env) or Lucia local user
- Dashboard: tabs: Bookings (Day) • Services • Staff • Hours • Blackouts
- Edit: update values → Save → optimistic refresh
- Cancel booking: click item → “Ακύρωση” → confirm → slot reappears

---

## 4) Information Architecture

- `/` Home (Hero, Services, Today’s Availability, Map, Hours, FAQ, CTA bar)
- `/book` (multi-step or single page form with steps)
- `/confirm/:bookingId` (success page)
- `/admin/login` (password gate)
- `/admin` (dashboard)
- `/admin/bookings?date=YYYY-MM-DD`
- `/admin/services`
- `/admin/staff`
- `/admin/hours` (weekly schedule)
- `/admin/blackouts`

---

## 5) Functional Requirements

### 5.1 Services

- Fields: `name`, `durationMin`, `priceCents`, `active`
- CRUD in admin; deactivating a service hides it from booking UI

### 5.2 Staff

- Fields: `name`, `active`
- Optional staff selection by guest; if not selected, system auto-assigns

### 5.3 Working Hours / Schedules

- Weekly schedule per staff: `weekday` (0–6), `startMin`, `endMin`, `slotIntervalMin`
- Support blackout periods (per-staff or global)

### 5.4 Availability & Slots

Slot generation respects service duration, staff schedule window, slot interval, existing bookings, blackouts, lead time and booking horizon.

### 5.5 Booking

- Required: `name`, `phone`, `serviceId`, `staffId` (or auto), `startTs`
- Server validates slot still free at commit time and creates booking with `confirmed` status
- Use DB unique constraint on `(staffId, startTs)` to guard collisions

### 5.6 Cancel (Guest)

- Simple cancel page (no login): prompts for phone + booking code → cancels if match & in the future

### 5.7 Admin

- Bookings (Day) view: list, filter by staff; cancel
- Services: CRUD
- Staff: CRUD
- Hours: per-weekday grid; bulk copy
- Blackouts: CRUD

All admin routes protected by session/password middleware.

---

## 6) Non-Functional Requirements

- Performance: TTFB < 300ms (edge); first interaction < 2.5s on mid-tier mobile
- Reliability: unique DB constraint + transaction-like booking logic
- Security: input validation (Zod), rate limits, httpOnly admin cookie
- Accessibility: WCAG 2.1 AA
- Internationalization: primary Greek microcopy; English option

---

## 7) Copy & Content (EN/EL samples)

- Hero (EL): “Κλείσε ραντεβού για κούρεμα στην Κυψέλη.”
- CTA: “Κλείσε ραντεβού” • Secondary: “Κάλεσέ μας”
- Services: examples like “Κούρεμα — 30′ — €15”

---

## 8) Data Model (Drizzle • D1)

Suggested tables (v1):

- `services` (id, name, durationMin, priceCents, active)
- `staff` (id, name, active)
- `staff_schedules` (id, staffId, weekday, startMin, endMin, slotIntervalMin)
- `blackouts` (id, staffId|null, startTs, endTs, reason)
- `customers` (id, name, email?, phone, createdAt)
- `bookings` (id, customerId, serviceId, staffId, startTs, endTs, status, paymentStatus, notes, createdAt, updatedAt)
FAQ: cancellation, delays, payments (cash/card), hygiene.

- `events` reserved for future

---

## 9) Server functions (TanStack Start)

We will use TanStack Start server functions (createServerFn / useServerFn) as the primary backend surface instead of building traditional API routes. The Cloudflare Worker will host the UI and server function handlers.

Guidelines:

- Use server functions for all application logic that doesn't need a public HTTP callback (slot queries, bookings, admin actions).
- Call server functions from route loaders, components, or TanStack Query hooks (server functions play nicely with react-query patterns).
- Only implement public HTTP endpoints (file route server handlers / raw fetch handlers) for external webhooks or callbacks that require a public URL (e.g., payment webhooks). Keep these minimal and in `src/server/webhooks/`.
- Validate inputs using Zod in server functions and handle errors with clear codes (e.g., `SLOT_TAKEN`, `INVALID_INPUT`).

Example server function sketch:

```ts
import { createServerFn } from '@tanstack/react-start'
import { todos } from '~/lib/schema'
import { db } from '~/lib/db'

export const getTodo = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ input }) => {
    const row = await db.select().from(todos).where(/* ... */).get()
    return row
  })
```

---

## 10) Slot generation rules

Algorithm:

- For each staff's window on the weekday, step by `slotIntervalMin` and produce candidate starts where `end = start + duration`.
- Reject candidates that overlap existing non-canceled bookings or blackouts.
- Reject if start < now + leadTime or outside booking horizon.
- Return available slots; if staffId = -1 (auto), dedupe/merge per-business rule.

Collision guard: rely on DB unique constraint and return a `SLOT_TAKEN` error to the client if an insert race occurs.

---

## 11) UI Requirements

- Home: hero, services, today availability chips
- Booking: stepper or single page with large touch targets
- Confirm page: booking code, cancel link
- Admin: CRUD pages and day-bookings view

---

## 12) Security & Privacy

- Admin auth via httpOnly cookie
- Rate limits on booking and admin actions
- Minimal PII retention; logs scrubbed

---

## 13) Testing & Acceptance

- Manual cases: slot correctness, booking happy path, conflict handling, cancel flow, admin CRUD
- Performance target: `/slots` p95 < 150ms in-region

---

## 14) Release Plan

- MVP (Week 1): Home, Services, Booking, Confirm, Admin CRUD, Cancel (guest)
- v1.1: Reschedule, improved auto-assign
- v1.2: Emails/Reminders (future)

---

## 15) Risks & Mitigations

- Owner edits break hours: validation on save
- Double bookings: DB unique + graceful UI retry
- Timezones: store UTC ms; render in Europe/Athens

---

## 16) Definition of Done (MVP)

- Guest can book and cancel; admin can manage services/staff/hours/blackouts
- App deployed to Workers; README includes D1 setup & seed instructions

11.2 Booking

Stepper or single page with progressive disclosure.

Large touch targets for time chips (44px min height).

Validation inline; phone mask +30 friendly.

Consent checkbox with link to Terms (cancel window).

11.3 Confirmation

Large check icon, booking code, date/time, staff, service.

“Τέλος” button back to Home.

Optional button “Ακύρωση” (goes to cancel page).

11.4 Admin

Clean table views, filters by date/staff; edit forms with server validation & toasts.

Footer shows app version and last updated (for owner trust).

12) Security & Privacy

Auth: Admin login → httpOnly session cookie (HMAC-signed).

Rate limits:

Booking POST: 5/min/IP; Admin POST: 10/min/IP.

Validation: All inputs Zod-validated and sanitized.

PII minimal: Store name, phone; optional email (not used in v1).

Data retention: Keep bookings for 12 months; soft-delete on request.

Error handling: No PII in logs; generic error messages on client.

13) Testing & Acceptance
13.1 Manual Test Cases

Slots: Correct for weekday; no past slots; respects blackouts.

Booking: Happy path; conflict path (simulate double click) → shows “Slot taken”.

Cancel (guest): Wrong phone → reject; right phone & future slot → success and slot reappears.

Admin: Create service/staff; update hours; blackout hides slots; cancel from admin.

Accessibility: Keyboard nav; focus order; labels.

13.2 Performance

Home cold load < 2.5s on 4G mid device.

/api/slots < 150ms p95 near region.

14) Release Plan

MVP (Week 1): Home, Services, Booking, Confirm, Admin CRUD, Cancel (guest).

v1.1: Reschedule (guest), staff assignment improvements (“no preference” auto-assign).

v1.2 (future, not now): Emails/SMS, reminders, review prompts, deposits (Stripe), staff portal.

15) Risks & Mitigations

Owner edits break hours: add simple validation (start < end; intervals 15/30/60).

Double bookings under race: DB unique + graceful error and UI retry.

Timezone confusion: store UTC ms; render local; lock business TZ to “Europe/Athens”.

No-shows (business pain): (Future) introduce deposits/cancel windows; excluded in v1.

16) Definition of Done (MVP)

All flows above work on mobile and desktop.

Admin can change services, staff, hours, blackouts; changes reflect in slots.

Guest can book/cancel without contacting owner.

No emails/analytics/reminders are present.

Accessibility checks pass; Lighthouse mobile ≥ 95.

Deployed to Workers; README includes setup (D1 create, seed, deploy).