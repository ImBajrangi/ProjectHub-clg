-- ==============================================================================
-- CodeShastra ProjectHub - Complete Supabase & PostgreSQL Master Database Schema
-- Product Name: CodeShastra ProjectHub
-- Document Version: 3.0
-- Target Stakeholders: Project Incharge, Faculty Supervisors, Evaluation Panels, Student Team Leaders
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE
-- Tracks all authenticated accounts: Student Team Leaders, Supervisors, and Project Incharge.
-- Note: General student members DO NOT have login accounts (strict 200 concurrent user limit).
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('leader', 'supervisor', 'admin')),
    full_name TEXT NOT NULL,
    phone TEXT,
    is_leader BOOLEAN DEFAULT FALSE,
    active_session_token TEXT,
    active_session_device TEXT,
    active_session_at TIMESTAMPTZ,
    reset_token TEXT,
    reset_token_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUPERVISORS TABLE
-- Master faculty supervisor profile and metadata
CREATE TABLE IF NOT EXISTS public.supervisors (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE NOT NULL,
    designation TEXT,
    department TEXT DEFAULT 'Computer Applications',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TEAMS TABLE
-- Master academic project teams (e.g. Team 1, Team 2 ... Team DS1 ...)
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_code TEXT UNIQUE NOT NULL, -- e.g. "BCA-1", "BCA-DS-1", "Team 1"
    team_number INT,
    program TEXT NOT NULL DEFAULT 'BCA', -- 'BCA' or 'BCA - DS'
    supervisor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    leader_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    phase1_approved BOOLEAN DEFAULT FALSE,
    phase2_approved BOOLEAN DEFAULT FALSE,
    phase3_approved BOOLEAN DEFAULT FALSE,
    phase3_report_clearance BOOLEAN DEFAULT FALSE,
    report_url TEXT,
    paper_url TEXT,
    report_uploaded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. STUDENTS TABLE
-- All student records preloaded from Master Excel file
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roll_no TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT NOT NULL,
    cpi NUMERIC(4, 2),
    course TEXT NOT NULL,
    section TEXT,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_leader BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PROBLEM STATEMENTS TABLE
-- Problem statement title, description, approval status, and immutable lock
CREATE TABLE IF NOT EXISTS public.problem_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID UNIQUE NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'revision_requested', 'approved')),
    supervisor_remarks TEXT,
    locked BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MEETINGS TABLE
-- "Want to Meet" requests, confirmed schedules, and logs
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meeting_index INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'scheduled', 'completed', 'cancelled')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_date TEXT,
    time_slot TEXT,
    venue TEXT, -- Physical Room/Cabin OR Google Meet URL
    summary_notes TEXT,
    action_directives TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. MEETING ATTENDANCE TABLE
-- Attendance records for each member in a logged meeting
CREATE TABLE IF NOT EXISTS public.meeting_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    is_present BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (meeting_id, student_id)
);

-- 9. EVALUATION PHASES TABLE
-- Global phases managed by Project Incharge
CREATE TABLE IF NOT EXISTS public.evaluation_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_number INT UNIQUE NOT NULL CHECK (phase_number IN (1, 2, 3)),
    phase_name TEXT NOT NULL,
    description TEXT,
    is_live BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Phases
INSERT INTO public.evaluation_phases (phase_number, phase_name, description, is_live)
VALUES
    (1, 'Phase 1 Presentation: Concept Pitch & Ideation', 'PPT Presentation & Literature Review', FALSE),
    (2, 'Phase 2 Presentation: Working Prototype', 'Live Website & Code Demonstration', FALSE),
    (3, 'Phase 3 Presentation: Final Defense', 'Final Project Report & Research Paper Defense', FALSE)
ON CONFLICT (phase_number) DO NOTHING;

-- 10. PANELS TABLE
-- Formed faculty evaluation panels
CREATE TABLE IF NOT EXISTS public.panels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    panel_number INT NOT NULL,
    panel_name TEXT NOT NULL,
    phase_number INT NOT NULL CHECK (phase_number IN (1, 2, 3)),
    date TEXT,
    time_window TEXT, -- e.g. "09:00 AM - 01:00 PM"
    academic_block TEXT, -- e.g. "AB1", "AB2"
    room_number TEXT, -- e.g. "Room 402"
    team_range_start INT,
    team_range_end INT,
    team_codes TEXT[], -- Array of specific assigned team codes
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PANEL MEMBERS TABLE
-- Links faculty supervisors to panels as judges
CREATE TABLE IF NOT EXISTS public.panel_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    panel_id UUID NOT NULL REFERENCES public.panels(id) ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (panel_id, supervisor_id)
);

-- 12. EVALUATIONS TABLE
-- Individual member scores out of 10 or absent status
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_number INT NOT NULL CHECK (phase_number IN (1, 2, 3)),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    panel_member_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    score NUMERIC(4, 2) CHECK (score >= 0 AND score <= 10),
    is_absent BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (phase_number, student_id, panel_member_id)
);

-- 13. NOTIFICATIONS TABLE
-- Stores in-website email-style notification letters
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    salutation TEXT NOT NULL,
    body TEXT NOT NULL,
    signoff TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. PUSH SUBSCRIPTIONS TABLE
-- Web Push service worker endpoints for device notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. INDEXES FOR PERFORMANCE & CONCURRENCY (up to 200 concurrent users)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_active_session ON public.users(active_session_token);
CREATE INDEX IF NOT EXISTS idx_students_team ON public.students(team_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_teams_supervisor ON public.teams(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_teams_leader ON public.teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_meetings_team ON public.meetings(team_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_evaluations_team ON public.evaluations(team_id);
