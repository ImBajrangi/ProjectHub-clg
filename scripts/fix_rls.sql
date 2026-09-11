-- ==============================================================================
-- CodeShastra ProjectHub - Proper RLS Security Configuration
-- 
-- STRATEGY: Re-enable RLS on all tables for security. The service_role key
-- (used by the Next.js server) AUTOMATICALLY bypasses RLS in Supabase.
-- No explicit policies needed for server-side access.
--
-- We add explicit policies for the anon/authenticated roles as a defense
-- layer, blocking any direct client-side Supabase access.
--
-- HOW TO RUN:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire file and click "Run"
-- ==============================================================================

-- Step 1: Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies (clean slate)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Step 3: Create policies that ALLOW the service_role full access
-- NOTE: service_role bypasses RLS by default in Supabase, but these
-- policies ensure anon/authenticated roles are BLOCKED from direct access.
-- All data access goes through Next.js API routes using the service_role key.

-- Block direct anon/authenticated access to all tables
-- (Only service_role can access, which bypasses RLS automatically)

-- Users table: No direct client access
CREATE POLICY "Deny direct access to users" ON public.users
  FOR ALL USING (false);

-- Supervisors table: No direct client access
CREATE POLICY "Deny direct access to supervisors" ON public.supervisors
  FOR ALL USING (false);

-- Teams table: No direct client access
CREATE POLICY "Deny direct access to teams" ON public.teams
  FOR ALL USING (false);

-- Students table: No direct client access
CREATE POLICY "Deny direct access to students" ON public.students
  FOR ALL USING (false);

-- Problem statements: No direct client access
CREATE POLICY "Deny direct access to problem_statements" ON public.problem_statements
  FOR ALL USING (false);

-- Meetings: No direct client access
CREATE POLICY "Deny direct access to meetings" ON public.meetings
  FOR ALL USING (false);

-- Meeting attendance: No direct client access
CREATE POLICY "Deny direct access to meeting_attendance" ON public.meeting_attendance
  FOR ALL USING (false);

-- Evaluation phases: No direct client access
CREATE POLICY "Deny direct access to evaluation_phases" ON public.evaluation_phases
  FOR ALL USING (false);

-- Panels: No direct client access
CREATE POLICY "Deny direct access to panels" ON public.panels
  FOR ALL USING (false);

-- Panel members: No direct client access
CREATE POLICY "Deny direct access to panel_members" ON public.panel_members
  FOR ALL USING (false);

-- Evaluations: No direct client access
CREATE POLICY "Deny direct access to evaluations" ON public.evaluations
  FOR ALL USING (false);

-- Notifications: No direct client access
CREATE POLICY "Deny direct access to notifications" ON public.notifications
  FOR ALL USING (false);

-- Push subscriptions: No direct client access
CREATE POLICY "Deny direct access to push_subscriptions" ON public.push_subscriptions
  FOR ALL USING (false);

-- Step 4: Verify RLS status
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Step 5: Verify policies exist
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
