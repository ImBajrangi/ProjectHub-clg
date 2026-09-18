-- ==============================================================================
-- CodeShastra ProjectHub - Evaluations Schema & Constraints Update
-- Run this in Supabase SQL Editor to support Phase 1 (20M), Phase 2 (40M), Phase 3 (40M)
-- ==============================================================================

-- 1. Remove old score <= 10 constraint on evaluations table
ALTER TABLE public.evaluations DROP CONSTRAINT IF EXISTS evaluations_score_check;

-- 2. Alter score column type to NUMERIC(5, 2) and allow scores up to 100
ALTER TABLE public.evaluations ALTER COLUMN score TYPE NUMERIC(5, 2);
ALTER TABLE public.evaluations ADD CONSTRAINT evaluations_score_check CHECK (score >= 0 AND score <= 100);

-- 3. Ensure criteria_scores column exists for JSON rubric categories
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS criteria_scores JSONB DEFAULT NULL;

-- 4. Ensure attendance_status column exists and supports early_joining
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS attendance_status TEXT DEFAULT 'present';
ALTER TABLE public.evaluations DROP CONSTRAINT IF EXISTS evaluations_attendance_status_check;
ALTER TABLE public.evaluations ADD CONSTRAINT evaluations_attendance_status_check 
  CHECK (attendance_status IN ('present', 'absent', 'early_joining', 'next_shift'));

-- 5. Ensure indexes exist for fast querying
CREATE INDEX IF NOT EXISTS idx_evaluations_team ON public.evaluations(team_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_student ON public.evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_phase ON public.evaluations(phase_number);
