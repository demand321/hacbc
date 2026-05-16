# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev           # Start dev server (Next.js 16 with Turbopack)
npm run build         # prisma generate && next build (used by CI — no DB needed)
npm run vercel-build  # prisma migrate deploy && prisma generate && next build (Vercel uses this)
npm run lint          # ESLint
npx prisma generate   # Regenerate Prisma client (required after schema changes)
npx prisma migrate dev --name <name>  # Create migration
npx prisma db seed    # Seed database (admin@hacbc.no / admin123)
```

Vercel automatically prefers `vercel-build` over `build`, so prod migrations run on every deploy. CI runs `build` against placeholder env vars (no DB available), which is why `migrate deploy` is split out of the regular `build` script.

After changing `prisma/schema.prisma`, you must run `prisma generate` AND restart the dev server — the cached Prisma client won't know about new models otherwise.

## Architecture

**Next.js 16 App Router** with TypeScript, React 19 Server Components, and Norwegian (`nb-NO`) locale throughout.

### Prisma 7 — Adapter Pattern (Important)

Prisma 7 does NOT use a `url` in `schema.prisma`. Instead:
- `prisma.config.ts` configures the `DIRECT_URL` environment variable
- `src/lib/prisma.ts` creates the client with `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`
- Generated client output: `src/generated/prisma/client`

### Authentication & Authorization

NextAuth.js 4 with credentials provider and JWT strategy. Three roles: `VISITOR`, `MEMBER`, `ADMIN`. Members go through approval: `PENDING` → `APPROVED` / `REJECTED` / `DELETED`.

- **Member layout** (`src/app/medlem/layout.tsx`): requires session + `APPROVED` status
- **Admin layout** (`src/app/admin/layout.tsx`): requires `role === "ADMIN"`, renders sidebar nav
- **API routes**: use `getServerSession(authOptions)` from `src/lib/auth.ts`
- **DELETED users** are rejected at `authorize` and on JWT refresh — they cannot hold a session even with the right password

### Soft-delete of members

Admin can delete a member from `/admin/medlemmer` via the **Slett** button. Soft delete only — record stays, `memberStatus` becomes `DELETED`:
- Cannot delete self; cannot delete the last admin
- Confirmation requires typing the user's exact name
- Each delete writes an `AuditLog` row (`action="user.deleted"`, actor + target captured). Audit table is DB-only (no UI), read it via Supabase Studio when needed.
- Public `/kjoretoy` (list + detail) filters out vehicles where `owner.memberStatus === "DELETED"`
- Photos, comments, likes, and cruising entries remain visible — their `authorName` / `uploaderName` strings are already stored standalone, so no anonymization needed

### Transactional email (Resend)

`src/lib/email.ts` wraps the Resend SDK. Silently no-ops if `RESEND_API_KEY` is unset.
- New-member registrations trigger `sendMembershipApplicationEmail` from `POST /api/auth/registrer`. Email failure is caught and logged — never blocks the registration flow.
- Subject is prefixed with `[TEST] ` and a yellow banner is added to the body whenever `NEXTAUTH_URL` hostname is not `hacbc.no` (so dev + local sends are visually distinct from prod)
- **CC opt-in:** Each `User` has a `notifyOnMemberApplication` boolean. Admin toggles it via the **Søknadsvarsel** button in `/admin/medlemmer`. Email send loads all opted-in `APPROVED` users and adds them as CC. DB-load failure is logged but does not block the primary send.

### Theme System

Three switchable themes (Garage/Route66/Chrome) via CSS variables and `data-theme` attribute on `<html>`. Defined in `src/app/globals.css` and `src/lib/themes.ts`. ThemeProvider uses localStorage. Always use CSS variables (`--primary`, `--accent`, etc.) — never hardcode theme colors.

Fonts per theme: Oswald (garage), Righteous (route66), Montserrat (chrome). Loaded in `src/app/layout.tsx`.

### shadcn/ui v4 Specifics

Uses `@base-ui/react` internally (not Radix, except Button which uses `@radix-ui/react-slot` for `asChild`). Dialog/Sheet components use `render` prop for close buttons. DropdownMenu doesn't support `asChild` — Navbar uses a custom dropdown.

### Key Patterns

- **Server pages with DB access** must export `const dynamic = "force-dynamic"` to avoid Vercel build failures (Supabase connection pool limits during static generation)
- **Map components** (Leaflet) are dynamically imported (`next/dynamic` with `ssr: false`)
- **Cruising chat** uses polling (5-second intervals) with `after` timestamp parameter
- **Guest cruising signups** persist via `localStorage` key `cruising-signup-${eventId}`
- **Prices** stored in øre (integer); divide by 100 for display
- **Photo system** is dual: `PhotoComment`/`PhotoLike` have nullable FKs to both `Photo` (gallery) and `CruisingPhoto` (cruising)
- **PhotoLightbox** (`src/components/PhotoLightbox.tsx`) is the shared lightbox with likes, comments, and delete — used by both gallery and cruising pages
- **Supabase Storage** bucket `uploads` for images; paths like `cruising/{eventId}/` or `gallery/{albumId}/`
- **OSRM** (`router.project-osrm.org`) for road-following cruising routes — free, no API key, coordinate order is `lng,lat`

### Route Structure

| Area | Path | Guard |
|------|------|-------|
| Public | `/`, `/kjoretoy`, `/arrangementer`, `/galleri`, `/cruising`, `/shop` | None |
| Auth | `/logg-inn`, `/registrer` | None |
| Member | `/medlem/**` | Session + APPROVED |
| Admin | `/admin/**` | ADMIN role |
| API | `/api/**` | Per-route |

### Environment Variables

`DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

Seed-only (dev): `SEED_ADMIN_PASSWORD` (min 12 chars, required by `prisma/seed.ts`).

Email (optional — `src/lib/email.ts` skips sending silently if unset):
- `RESEND_API_KEY` — Resend API key (domain hacbc.no must be verified at resend.com first)
- `EMAIL_FROM` — sender, default `HACBC <noreply@hacbc.no>`
- `EMAIL_MEMBERSHIP_NOTIFY` — recipient for new membership applications, default `post@hacbc.no`

### Path Alias

`@/*` maps to `./src/*` (tsconfig.json).

## Branching & Deployment

### Git branches

- `main` — production. Protected: PR required, CI must pass, no force-push, no deletion.
- `dev` — integration branch for ongoing work. All changes merge here first, then PR to `main`.

Direct pushes to `main` are blocked. Workflow is `feature → dev → PR → main`.

### CI (.github/workflows/ci.yml)

Runs on PRs to `main` and pushes to `dev`/`main`. Three steps: `npm run lint`, `npx tsc --noEmit`, `npm run build`. The build uses placeholder env vars (no real DB connection needed — server pages with DB access use `force-dynamic`).

### Vercel projects (two)

| Vercel project | Deploys from | Live URL | Supabase project |
|---|---|---|---|
| `hacbc` | `main` | https://hacbc.no | prod Supabase (separate, **do not touch from dev work**) |
| `hacbc-dev` | `dev` | `*.vercel.app` preview | `hpuerbylnwtneqelotsa` (dev) |

Each Vercel project has its own scoped env vars. **Never copy prod credentials into the dev project, or vice versa.** The dev Supabase is safe to drop/reset; the prod one is live data.

To prevent the dev project from building feature branches as previews, its **Ignored Build Step** is:
```sh
if [ "$VERCEL_GIT_COMMIT_REF" != "dev" ]; then exit 0; fi
```

### Supabase

- **Prod** — owned by the user, used by `hacbc.no`. Credentials only live in the `hacbc` Vercel project env vars.
- **Dev** — project ID `hpuerbylnwtneqelotsa`, region `eu-north-1`. Used by `hacbc-dev` Vercel and local `npm run dev`. Storage bucket `uploads` must exist on this project (matches code paths).

### Migrations

`vercel-build` runs `prisma migrate deploy` before `next build`, so any new migration on `dev` is applied to the corresponding Supabase project on the first deploy that includes it. No manual `psql` or SQL Editor steps needed under normal circumstances.

**Historical gotcha (fixed):** The original `build` script only did `prisma generate`, so a migration committed to `dev` would deploy successfully but the prod DB still lacked the new schema — runtime queries against new columns/enum values crashed pages on hacbc.no. Recovery was: promote the previous Vercel deploy back to production OR paste the migration SQL into Supabase SQL Editor. Don't undo the `vercel-build` split — CI uses placeholder env vars and would fail `migrate deploy`, which is why the migration step is intentionally absent from the plain `build`.

### Resend domain (DNS)

`hacbc.no` is verified at Resend with custom return-path on the `send` subdomain (so it doesn't collide with the Microsoft 365 MX on the root domain). The DNS records (DKIM TXT on `resend._domainkey`, MX + SPF TXT on `send`) live at Domeneshop and should not be touched.
