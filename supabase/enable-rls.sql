-- Enable Row Level Security on all Prisma-managed tables.
--
-- WHY: Supabase exposes the `public` schema via PostgREST. The anon JWT
-- (NEXT_PUBLIC_SUPABASE_ANON_KEY) is visible to every site visitor, so
-- without RLS anyone can run e.g.
--   curl '<project>.supabase.co/rest/v1/User?select=*' -H "apikey: <anon-jwt>"
-- and dump the full table including passwordHash.
--
-- WHAT: We enable RLS on every public table and create NO policies. PostgREST
-- queries via anon/authenticated roles will return zero rows. The Prisma
-- connection uses the `postgres` role (BYPASSRLS), so the app keeps working.
--
-- Run this in Supabase Dashboard → SQL Editor, or via psql against DIRECT_URL.
-- Idempotent — safe to re-run.

ALTER TABLE public."User"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Vehicle"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Event"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Album"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Photo"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Product"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Order"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OrderItem"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CruisingRoute"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CruisingEvent"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CruisingSignup"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CruisingMessage"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CruisingPhoto"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Waypoint"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Message"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SiteContent"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EventSignup"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EventMessage"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PhotoComment"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."documents"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PhotoLike"        ENABLE ROW LEVEL SECURITY;

-- Prisma's own migration tracking table — same treatment.
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

-- Sanity check — list any remaining public tables WITHOUT RLS.
-- After running the ALTER statements above this should return zero rows.
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = pg_tables.schemaname
      AND c.relname = pg_tables.tablename
      AND c.relrowsecurity = true
  );
