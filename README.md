# HomeBridge

Find your next home, before you arrive.

HomeBridge is a student housing MVP built with React, TypeScript, Vite, Tailwind CSS, Express, and Supabase (PostgreSQL, Auth, and Storage). It starts in Peterborough, Ontario, with city/province fields that support expansion across Canada.

## What works, and what still needs setup

The source includes student and landlord authentication, protected routes, profiles, persistent favourites, property CRUD and image uploads, combined database-backed filters, viewing availability, atomic reservations, appointment history, cancellation, and completion. The frontend is responsive and supports light/dark mode.

**No Supabase project was supplied for this build.** The published preview therefore uses clearly labelled fictional sample rentals and disables real reservations. It does not fake accounts or booking confirmations. Connect your own Supabase project and run the API to enable those features. The development seed script is provided, but has not been run against a hosted database.

Local automated tests exercise the actual migration in PGlite (PostgreSQL compiled to WebAssembly), including RLS and booking functions. This does not replace a final integration check against your Supabase project, email provider, and storage service.

## 1. Install

Requirements: Node.js 22 LTS, pnpm 11.25.0 (pinned in package.json), and a free Supabase project. Docker is not required.

```bash
corepack enable
pnpm install
cp .env.example .env
```

If your Node installation does not include Corepack, install pnpm using its official installation instructions. The committed lockfile pins the dependency graph. Production installs should use `pnpm install --frozen-lockfile`.

To explore the interface before connecting services:

```bash
pnpm dev:client
```

Open the local URL Vite prints. Sample properties are fictional; photos are illustrative images hosted on Unsplash. Fonts load from Google Fonts, with local fallback fonts. These external assets may be unavailable offline.

## 2. Create and configure Supabase

1. Create a dedicated development project at https://supabase.com/dashboard.
2. Open SQL Editor and run `supabase/migrations/001_homebridge.sql` once in a new project. It creates all tables, indexes, RLS policies, profile provisioning, booking functions, and the `property-images` bucket.
3. In Project Settings / API, copy the project URL and public publishable key (or legacy anon key). Populate both frontend and server variables below.
4. In Authentication / URL Configuration, set your Site URL to your frontend origin and add allowed redirect URLs, including `http://localhost:5173/dashboard`, `http://127.0.0.1:5173/dashboard`, and the production `/dashboard` URL.
5. Keep email confirmation enabled for normal use. Configure your own SMTP provider before inviting real users; Supabase's default email delivery has development limits. The seed script creates confirmed development-only accounts.
6. Restart Vite after changing any `VITE_` variable.

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_KEY
VITE_API_URL=
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_PUBLIC_KEY
FRONTEND_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
PORT=3001
NODE_ENV=development
```

The API uses the public key plus each request's verified user JWT. It does **not** require a service-role key. Administrative credentials are only used by the optional seed script. Never prefix an administrative key with `VITE_`, commit it, or deploy it to frontend hosting.

## 3. Run the app

```bash
pnpm dev
```

Vite serves the frontend on port 5173 and proxies `/api` to Express on port 3001. `GET /api/health` is a liveness endpoint; it does not claim that database connectivity is healthy. The API exits with a setup message if credentials are missing.

Register as a student or landlord. Confirm your email, then log in. Roles are stored in the protected `profiles` table at signup; editing Supabase user metadata later cannot change authorization. Role changes are deliberately not exposed in the app.

## 4. Optional fictional development seed

Use a **separate development Supabase project**, not your production project. This script creates confirmed Auth users, six fictional listings, two landlords, one student, and future slots. It never contacts real landlords or students. It upserts fixed sample property IDs and can reset edits made to those sample properties when rerun; it does not delete bookings or other properties.

Add these server-only variables to your local `.env`:

```dotenv
NODE_ENV=development
SUPABASE_SERVICE_ROLE_KEY=YOUR_DEVELOPMENT_PROJECT_SERVICE_ROLE_KEY
DEMO_PASSWORD=CHOOSE_A_UNIQUE_DEVELOPMENT_PASSWORD_AT_LEAST_12_CHARACTERS
```

Then explicitly acknowledge that this is a development database:

```bash
pnpm seed --confirm-development
```

Demo accounts use the password you chose:

- `student@homebridge.example`
- `landlord1@homebridge.example`
- `landlord2@homebridge.example`

Do not reuse a real password. Reruns keep existing account passwords. Remove the service-role key from `.env` after seeding. No meeting links are invented; landlords can add a real HTTPS meeting URL when creating a new virtual slot. Photos and addresses are clearly labelled as fictional/illustrative.

## 5. Verify the main journey

Use two independent browser profiles (or a normal and private window):

1. Log in as a landlord. Create a listing and upload JPEG, PNG, or WebP photos (5 MB each maximum).
2. Open Viewing times. Create a future virtual or in-person slot. Inputs explicitly use your device time zone, convert to UTC, and display in your profile's selected time zone.
3. In a student session, search by city, university, budget, room type, bedrooms, and availability. Open the listing, select the viewing type/time, and confirm.
4. Confirm the same booking appears in both dashboards. A virtual meeting link is available only to the landlord and booked student.
5. Try the same slot from another student session: the database rejects it even if a stale browser still offers the slot.
6. Cancel the upcoming booking. The slot reappears; the cancelled student loses meeting-link access.
7. After a viewing ends, the landlord can mark it completed from Past & cancelled. Completed records cannot be cancelled or removed with the slot.
8. Verify an unrelated landlord cannot edit the property, change its slots, or view its private appointments.

The landlord may mark a property unavailable. That stops new reservations and hides it from public search without silently cancelling existing appointments.

## 6. Automated checks

```bash
pnpm test
pnpm build
```

Tests cover unauthenticated API mutations; input validation; forged ownership fields; profile privilege escalation; cross-landlord writes; safe public availability; booking conflicts; participant privacy; cancellation/rebooking; unavailable and removed slots; saved-property isolation; completion preservation; and UTC time-zone conversion.

PGlite serializes statements on a single embedded connection. The competing-request test verifies the real unique constraint and RPC outcome, but is not a multi-connection stress test. For production acceptance, also run the two-browser conflict check above on Supabase. Hosted email delivery, actual storage uploads, and full live auth cannot be verified without your project.

## Project map

```text
client/src/
  main.tsx             Router and protected routes
  lib.tsx              Supabase session, API client, auth state, shared UI states
  components.tsx       Navigation, property cards, reusable layouts
  public-pages.tsx     Home, search, details, about, safety, 404
  account-pages.tsx    Registration/login, dashboard, bookings, saved homes, profile
  landlord-pages.tsx   Listing forms, uploads, viewing availability
  styles.css           Tailwind entry and responsive theme/style rules
server/src/
  app.ts               Express API, verified auth, role checks, safe error responses
  index.ts             Environment validation and server startup
shared/
  validation.ts        Zod input schemas
  types.ts             Shared domain types
  demo.ts              Explicitly fictional browse-only sample records
supabase/migrations/
  001_homebridge.sql   Tables, permissions, RLS, atomic booking functions, storage
scripts/seed.ts        Guarded, development-only Auth/database seed
tests/                PostgreSQL and API regression tests
```

The app deliberately keeps state management simple: React context for session/favourites, local state for forms, and URL parameters for search. SQL owns reservation and authorization invariants. Express validates input and verifies Supabase access tokens rather than trusting client-supplied IDs.

## Database and security model

- All six required entities exist: profiles, properties, property_images, viewing_slots, bookings, saved_properties.
- Every application table has RLS. Profiles are self-readable; bookings are visible only to the student and property owner. Public visitors see active listings and safe slot projections.
- The API derives owner/student IDs from `auth.getUser(token)`. Supabase validates the same JWT again when evaluating RLS.
- `book_viewing` locks the property, then its slot, and inserts in one database transaction. A partial unique index on `slot_id` for non-cancelled reservations is the final double-booking safeguard.
- Table grants deny direct booking/slot writes. Only constrained RPC functions can mutate them. `SECURITY DEFINER` functions use an empty search path and explicit schema names; their default public execute grants are revoked.
- `owns_property` and `has_booking` helper functions avoid recursive RLS policies.
- Full slot records include private meeting links. Public availability exposes only ID, time, and viewing type. Cancellation removes access to the meeting URL.
- Slot removal is soft deletion. Reserved/completed slots cannot be removed; cancelled reservation history is retained.
- `timestamptz` stores absolute instants; the frontend uses `Intl.DateTimeFormat` and profile-selected IANA time zones. Date-only move-in availability remains a calendar date.
- Photos are public listing assets in a size/type-limited bucket, with owner-folder upload/delete policies. Do not upload identity documents.
- The SPA stores Supabase sessions using its standard browser client. No HTML injection APIs are used. Enforce HTTPS in production, and keep dependencies updated.
- Express applies Helmet, bounded JSON request bodies, CORS origin restrictions, and an in-memory per-process rate limiter. For multiple backend instances, use a shared limiter. Only configure Express `trust proxy` for the exact proxy topology of your host; do not blindly trust forwarded headers.
- Search combines filters with AND and caps results at 200. Pagination and saved searches are intentionally future work.

## Deploy frontend to Vercel

1. Push this source directory to your Git repository and import it into Vercel.
2. Use this directory as the project root. Set build command `pnpm build` and output directory `dist` (also defined in `vercel.json`).
3. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL=https://YOUR_BACKEND_HOST`.
4. Deploy, then add its origin/redirect URL in Supabase and its exact origin in the backend's `FRONTEND_ORIGIN` list.
5. The SPA rewrite ensures `/properties/:id`, `/dashboard`, and other deep links load correctly on refresh.

Vite variables are compiled into the frontend bundle. Changing one requires rebuilding. Do not set server/service-role credentials in Vercel's frontend environment.

## Deploy API to a Node.js host (Render example)

A `render.yaml` blueprint is included. You can also configure a Node web service manually:

- Build: `corepack enable && pnpm install --frozen-lockfile && pnpm build`
- Start: `pnpm start`
- Runtime: Node 22 or newer
- Health check: `/api/health`
- Environment: `NODE_ENV=production`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `FRONTEND_ORIGIN=https://YOUR_FRONTEND`
- Let the host set `PORT`. Express listens on that port.

No database passwords or service-role keys are needed by the API. It communicates with Supabase over HTTPS. Confirm your host's proxy/rate-limiter configuration before opening registration to real users.

## Private Sites preview

The `.openai/hosting.json` manifest is for the companion private Sites preview only. That preview serves the Vite static build; it does **not** host the Express process or provision Supabase. Use the Vercel + Node hosting instructions above for the requested full-stack deployment. No real reservations are accepted in the unconfigured preview.

## Rental-safety content sources

- Ontario tenant guidance: https://www.ontario.ca/page/renting-ontario-your-rights
- Ontario Landlord and Tenant Board: https://tribunalsontario.ca/ltb/
- University of Toronto rental scam guidance: https://www.communitysafety.utoronto.ca/fraud-prevention/types-of-frauds-and-scams/rental-and-landlord-scams/
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control

HomeBridge does not verify landlords or listings, guarantee housing, offer legal advice, or accept rental payments. The guide is educational and links to official sources for current rules.
