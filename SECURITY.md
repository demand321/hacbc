# Security — Action Items for Operators

This document tracks security tasks that **must be done by a human** and cannot be fixed in code alone. Generated 2026-04-28.

## 🚨 Critical — do these BEFORE deploying to production

### 1. Rotate all secrets — treat the current `.env` as compromised

The current `.env` contains real production secrets. Even though the file is gitignored, treat them as already leaked (could be in backups, screenshots, AI tool uploads, or accidentally committed if `.gitignore` is weakened).

**Steps:**

1. **Supabase database password** — Supabase Dashboard → Project → Settings → Database → "Reset database password". Update `DATABASE_URL` and `DIRECT_URL` in Vercel env vars.
2. **Supabase API keys** — Supabase Dashboard → Project → Settings → API → "Generate new" for both `anon` and `service_role`. Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars.
3. **NextAuth secret** — generate a new strong secret:
   ```bash
   openssl rand -base64 32
   ```
   Set as `NEXTAUTH_SECRET` in Vercel env vars. (Code now requires ≥32 chars in production — boot will fail otherwise.)
4. After all rotations, delete the local `.env` and re-pull from Vercel: `vercel env pull .env`.

### 2. Change the default admin password

The seed creates `admin@hacbc.no` with a known password. Code now refuses to seed it in production, but the existing row may still have `admin123`.

**Steps:**

1. Log in as `admin@hacbc.no` with the current password.
2. Go to "Bytt passord" and set a new strong password.
3. Verify by logging out and back in.
4. Optionally rename the email to a personal one via admin UI.

### 3. Set production env vars in Vercel

Required:
- `DATABASE_URL`, `DIRECT_URL` — rotated DB connection strings
- `NEXTAUTH_SECRET` — rotated, ≥32 chars
- `NEXTAUTH_URL` — `https://hacbc.no` (NOT `http://localhost:3000`) — ensures secure cookies
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — rotated
- `SUPABASE_SERVICE_ROLE_KEY` — rotated, server-only

Recommended:
- `NODE_ENV=production` (Vercel sets this automatically)

## 🔥 High priority — do soon

### 4. Add rate limiting

The codebase has no rate limits. Brute-force login, signup spam, and Supabase quota exhaustion are all possible. Recommended: install `@upstash/ratelimit` + Upstash Redis (free tier), wrap `/api/auth/*`, `/api/auth/registrer`, `/api/upload/*`, and the comment/signup/chat endpoints.

### 5. Add Supabase RLS policies

The `uploads` bucket is currently public-read and the app uses the `service_role` key for all writes, bypassing RLS entirely. There is no defense-in-depth.

Suggested setup:
- Make `documents/*` private; serve via signed download URLs
- Add RLS policies on `uploads` bucket so only service-role can write to enforce the same rules the API does

### 6. Add email verification before approval

Currently a user can register with anyone's email. Admin approval doesn't verify control of the address. Add an `emailVerifiedAt` column and require a clicked confirmation link before the registration appears in the admin queue.

## 📝 Notes on what's already fixed in code

- ✅ Default admin gated behind `NODE_ENV !== "production"` (`prisma/seed.ts`); requires `SEED_ADMIN_PASSWORD` env var, sets `mustChangePassword: true`
- ✅ `NEXTAUTH_SECRET` ≥32 chars enforced at boot in production (`src/lib/auth.ts`)
- ✅ Session `maxAge` 7 days, role/status refreshed every 5 min from DB (`src/lib/auth.ts`)
- ✅ Signed-URL upload endpoint locked to allowed `kind`+`entityId` with auth check
- ✅ Register endpoints validate `storagePath` prefix and verify file exists
- ✅ `signupId` no longer leaked in public event/cruising responses
- ✅ All `/api/medlem/**` routes require `memberStatus === "APPROVED"`
- ✅ MIME allow-list (no SVG, no HTML); extension derived from validated MIME
- ✅ `callbackUrl` validated to same-origin paths
- ✅ Min password length 8 everywhere
- ✅ Last-admin protection on `remove-admin`
- ✅ Account enumeration removed from `/api/auth/registrer`
- ✅ Length caps on chat (5000), comments (2000), names (100), phones (30), captions (500)
- ✅ Photo comments require approved-member auth (no more guest spoofing)
- ✅ Bytt-passord requires current password (skipped only when `mustChangePassword=true`)
- ✅ Vehicle `specs` JSON and `imageUrls[]` capped to prevent DB bloat

## 🛠 Lower priority cleanup

- `npm audit fix` (high-severity transitive deps in `cookie`, `defu`, `effect`, `hono`, `lodash`). Avoid `--force` — that downgrades next-auth to v3.
- Add CI check (e.g. `gitleaks`) to block secrets from ever being committed.
- Add `next.config.ts` `images.remotePatterns` restricted to your Supabase host before migrating to `next/image`. Do not enable `dangerouslyAllowSVG`.
- Consider moving documents to a private bucket with signed download URLs (currently world-readable via direct URL).
- Storage cleanup on photo/document delete in admin/cruising/photos and admin/kjoretoy delete routes (currently leaves orphan files in Supabase).
