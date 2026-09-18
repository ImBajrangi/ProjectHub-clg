-- ==============================================================================
-- CodeShastra ProjectHub - Cleanup Testing Evaluation Data & Reset Phase 1
-- Run this in your Supabase SQL Editor to clear test evaluation marks & reset phase
-- ==============================================================================

-- 1. Delete all test evaluation records (marks, criteria breakdowns, remarks, attendance statuses)
DELETE FROM public.evaluations;

-- (OR if you only want to delete Phase 1 test evaluations:
-- DELETE FROM public.evaluations WHERE phase_number = 1;
-- )

-- 2. Reset team approval statuses (if any teams were marked approved during testing)
UPDATE public.teams
SET 
    phase1_approved = FALSE,
    phase2_approved = FALSE,
    phase3_approved = FALSE,
    phase3_report_clearance = FALSE;

-- 3. Turn OFF Phase 1 Live status (stops ongoing live evaluation)
UPDATE public.evaluation_phases
SET is_live = FALSE
WHERE phase_number = 1;

-- 4. (Optional) Remove test notifications created during testing if needed
-- DELETE FROM public.notifications WHERE category IN ('phase_evaluation', 'evaluation_result');
