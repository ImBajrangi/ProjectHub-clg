-- ==============================================================================
-- CodeShastra ProjectHub - Supabase Master Schema & Complete Data Seed
-- Target: https://ezspbqjnvmxuglivdjzb.supabase.co
-- Generated automatically from data/projecthub.db.json
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PRIVILEGES & ROLES SETUP FOR SUPABASE
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 1. USERS TABLE
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

-- 2. SUPERVISORS TABLE
CREATE TABLE IF NOT EXISTS public.supervisors (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE NOT NULL,
    designation TEXT,
    department TEXT DEFAULT 'Computer Applications',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_code TEXT UNIQUE NOT NULL,
    team_number INT,
    program TEXT NOT NULL DEFAULT 'BCA',
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

-- 4. STUDENTS TABLE
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

-- 5. PROBLEM STATEMENTS TABLE
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

-- 6. MEETINGS TABLE
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meeting_index INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'scheduled', 'completed', 'cancelled')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_date TEXT,
    time_slot TEXT,
    venue TEXT,
    summary_notes TEXT,
    action_directives TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MEETING ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.meeting_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    is_present BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (meeting_id, student_id)
);

-- 8. EVALUATION PHASES TABLE
CREATE TABLE IF NOT EXISTS public.evaluation_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_number INT UNIQUE NOT NULL CHECK (phase_number IN (1, 2, 3)),
    phase_name TEXT NOT NULL,
    description TEXT,
    is_live BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PANELS TABLE
CREATE TABLE IF NOT EXISTS public.panels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    panel_number INT NOT NULL,
    panel_name TEXT NOT NULL,
    phase_number INT NOT NULL CHECK (phase_number IN (1, 2, 3)),
    date TEXT,
    time_window TEXT,
    academic_block TEXT,
    room_number TEXT,
    team_range_start INT,
    team_range_end INT,
    team_codes TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PANEL MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.panel_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    panel_id UUID NOT NULL REFERENCES public.panels(id) ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (panel_id, supervisor_id)
);

-- 11. EVALUATIONS TABLE
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

-- 12. NOTIFICATIONS TABLE
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

-- 13. PUSH SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_students_team ON public.students(team_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_teams_supervisor ON public.teams(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_meetings_team ON public.meetings(team_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_evaluations_team ON public.evaluations(team_id);

-- GRANT PRIVILEGES ACROSS CREATED TABLES
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ==============================================================================
-- DATA INGESTION
-- ==============================================================================

-- Table: users (26 rows)
INSERT INTO public.users (id, email, password_hash, role, full_name, phone, is_leader, active_session_token, active_session_device, active_session_at, reset_token, reset_token_expires_at, created_at, updated_at)
VALUES
  ('f34d6beb-3b0f-43a8-877c-23a896eeb8e1', 'admin@codeshastra.edu', '$2a$10$Gl7I6vrD0ilL6t8kn2ZvuOQTTDKFPDPPMoi1eRqJLQE1uaaJ4OUHi', 'admin', 'Dr. Project Incharge (Head Administrator)', '9999988888', NULL, 'd54351fd5170c2959b49253e05afa6db4b32380fa737162996e960b74523308c', 'node', '2026-09-03T21:18:32.868Z', NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:32.870Z'),
  ('d66bec06-0fe8-4dd6-9253-9dd4149e9a55', 'narendra.mohan@gla.ac.in', '$2a$10$CFn2mEokwV.MCPiEsAkswOfNVYHZsYH3BXr8f1GMz7gRAD1zqhC0y', 'supervisor', 'Mr. Narendra Mohan', '9837356128', NULL, '52f9081bc2cdd16f1e5a1d4d6b2152f6e6cf2d2e075f00f6e51a24c880b9464a', 'node', '2026-09-03T21:18:29.462Z', NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:29.464Z'),
  ('56c8fa37-00e4-40e9-ba31-3ef2c813af9c', 'sachin.sharma@gla.ac.in', '$2a$10$Sfy0XRLvFf1c38uUc0h5s.KSj8hlY.RSX0KkYF0mwfKdP9HqLtAnK', 'supervisor', 'Mr. Sachin Sharma', '8077621113', NULL, '80c2f6ca51b9182ca580a3e699dbabc3e30f151aa228e0500aaa2d25efa4bd2c', 'node', '2026-09-03T21:18:29.784Z', NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:29.787Z'),
  ('f8273edc-2649-41db-a4fc-390712bfc447', 'anuj.mangal@gla.ac.in', '$2a$10$dgdRC9yqC69x/i3pkwFd8.dziRrmLTRwxLI/LDzKgqwC/2CgrNyci', 'supervisor', 'Dr. Anuj Mangal', '9897534383', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('408008d5-b020-49f2-967f-dec35320fe1a', 'dhirendra.yadav@gla.ac.in', '$2a$10$5gf.Lq0hLlU67iX2JzQmre1O.Lp3Qkkx0Fq/LaVz7tr/cM1Fp8sEu', 'supervisor', 'Dr. Dhirendra Prasad Yadav', '9568207247', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('19a7d8e6-f18b-4ff5-b5b7-f0988222d213', 'mayank.agrawal@gla.ac.in', '$2a$10$J4clUGUqLHJ.B0iB0xZwquTcV6kBw2ESunradyMABLZOFANCbnffi', 'supervisor', 'Dr. Mayank Agrawal', '9897626693', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('febff0cf-f5b4-425b-a33f-83e997bb7a8b', 'anuj.kumar@gla.ac.in', '$2a$10$CKdLaP2X/XkbyIF/E9ZMi.O39Z.L9ynPqcSswGFeVverQdgvtoY4.', 'supervisor', 'Dr. Anuj Kumar', '9997189728', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('009eb03b-782b-4afc-bcc0-6c1272974e78', 'vinod.jain@gla.ac.in', '$2a$10$TxpusiazMCF8vIUmsL/rWemYY5UED9cNi42aX4c71lg.WcCliunyy', 'supervisor', 'Dr. Vinod Jain', '9813078438', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('356a2964-1d24-4784-8786-ce4510ed9714', 'navin.agrawal@gla.ac.in', '$2a$10$L98aTKFMoomxC/nO6WeIeeowAGslI0/dA2CtA.3IKkiaL2V0Nlkra', 'supervisor', 'Mr. Navin Kumar Agrawal', '9411253442', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('b20622a5-3e95-43bb-85b4-727331667460', 'sanjiv.agrawal@gla.ac.in', '$2a$10$eCq.5O.WCADyz8wb9LCu6.Nww8vXT4/MraNctlAdh9LPtfyABTg3O', 'supervisor', 'Mr. Sanjeev Agrawal', '8923015116', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('d5967b07-368b-4461-aef2-b019d827819a', 'kriti.bansal@gla.ac.in', '$2a$10$vDlUJTqfKG/3qBnwfDV5fe0OqpLnNGjyWL2WW9LTv..EB7eQXL3OO', 'supervisor', 'Mr. Kriti Bansal', '8273996456', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('586da517-930c-4354-bc8b-7a409bc603bd', 'santosh.swarnkar@gla.ac.in', '$2a$10$isxcJASDmq.HSEMyWHAafunGbM5hvDcMmmxQZj21kjeOswZxNyMpe', 'supervisor', 'Mr. Santosh Kumar Swarnkar', '7310663121', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('267c8360-de0e-499c-be72-081bd96de8a7', 'cheshtaa.bhardwaj@gla.ac.in', '$2a$10$N/JoYYqaZEdYe69XlALOM.uXiPFZ7lYY..C1sWDmc11T2sdhepO5K', 'supervisor', 'Ms. Cheshta Bharadwaj', '8126796015', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('80ca1b4e-2f35-47de-9990-ca1bb5d4ca01', 'anil.chanchal@gla.ac.in', '$2a$10$RlbuyfqQoWaB3jVz1QzJ9Ou6HA7ysTkYGkNbclWQtsle.2JmdIKyO', 'supervisor', 'Dr. Anil Kumar', '9897667712', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('91a210b6-ce1f-439a-94ce-c7ddb4bea3a1', 'jayati.goswami@gla.ac.in', '$2a$10$HqKiESCIvCSTFDiaXh/41uf7QI6yZzE5Zz89q1GmmGC/JJL2tIPGS', 'supervisor', 'Mr. Jayati Krishna Goswami', '8171806228', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('be01fc66-78f2-40af-91b8-017c936692a1', 'satish.maurya@gla.ac.in', '$2a$10$/IR6VyOS16e0s6dewIHyu.BxGyunI2kYEfIGwFx.mYjSAclpirh/q', 'supervisor', 'Mr. Satish Kumar Maurya', '9196116503', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('77ed07b0-39c5-4c59-8f93-d9a3d51d95df', 'aman.deep@gla.ac.in', '$2a$10$7HSUhAxGoFfxNTu/LGYWluLFRlWlhpT2dU4MorP.KtTa1fgYj./kS', 'supervisor', 'Mr. Aman Deep Singh', '7500712613', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('00bd5d40-72e1-4b61-83a1-e47982262f69', 'koushik.choudhury@gla.ac.in', '$2a$10$h24O3KzuVd53Ud3QvHiiKuaijJu.lztJXzDeTRtmXD0/QMUHUkCxG', 'supervisor', 'Mr. Koushik Choudhury', '8910496595', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('deccd472-b1a1-456e-bdda-a7b82eb3531f', 'puneet.sharma@gla.ac.in', '$2a$10$0Xlt11i0pwpg4/hs93h9e.nCNC2uhSwn.3dZK.yVmzUfKGWQ9zPAK', 'supervisor', 'Dr. Puneet Sharma', '9897265401', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('1a8942f1-904a-4d5c-a76c-dba05c1dce97', 'shivamk.maurya@gla.ac.in', '$2a$10$oGKwTTUtYTQZpBuJw2G/3.Hk0RiqcL4DB4ckf/vydxFHFtE0X7VE.', 'supervisor', 'Mr Shivam kumar maurya', '9336393284', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('3ae426de-852f-47f7-9618-ce9be646ba31', 'kumar.ashish@gla.ac.in', '$2a$10$HZbMhyIhtnU5ESgFvkmhvOfi2vWLjxXkhDJt.tcKWudvxyDcdBQVi', 'supervisor', 'Mr Ashish kumar', '9599939837', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('3855a741-1500-4814-b563-2902866c7a47', 'roshni.patoa@gla.ac.in', '$2a$10$SZEE9HiXequJYsF16Ecf9O4EORln78ApGcaOTQojgHNi8Hw8vCxy2', 'supervisor', 'Ms ROSHNI PATOA', '8077610485', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('90ba4838-0d1d-497f-b9d5-f5bff4329924', 'arunsingh.yadav@gla.ac.in', '$2a$10$9OSbY2M3VfZyC5fKHLzu1uVd7oes9yxxiORZSDa3OOasNkjcY.h02', 'supervisor', 'Dr Arun Singh yadav', '9305591293', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('5f4901c9-0ecd-4748-a906-0a9375d91f00', 'shivank.chauhan@gla.ac.in', '$2a$10$gGVI28dpeVPmFJaWJA3lZuhZUTFSJINvk6PToARnr1.6rDM6sBhSi', 'supervisor', 'Mr.Shivank chauhan', '9694159338', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('b10516e3-432b-4b42-a97f-2930c602c8cf', 'adeesh.agrawal_bca24@gla.ac.in', '$2a$10$tHUNrOxfFC0pj4vsBUcAluwnP4MU9HuiovsvLWAMympwlUfcjk7M6', 'leader', 'ADEESH AGRAWAL', '8171136968', TRUE, '9607b063c753421d7d66a3b13ae9b2f9c1b8cc80182506456799d1b8b18ac49a', 'DeviceB_Firefox', '2026-09-03T21:18:29.326Z', '56379b2b1d07ad0414dba1829840a8637170ae9aaf4caf5c', '2026-09-03T21:33:29.347Z', '2026-09-03T21:18:29.003Z', '2026-09-03T21:18:29.349Z'),
  ('ccdbd5b2-9245-4460-b674-37bcb5251b2a', 'ansh.bhadoria_bca24@gla.ac.in', '$2a$10$KbPlxGON0wywcyAIsCpFeeOP4DSpWFpD/fMH7AM4/.5lx306/iqFi', 'leader', 'ANSH BHADORIA', '9149046428', TRUE, NULL, NULL, NULL, NULL, NULL, '2026-09-03T21:20:01.788Z', '2026-09-03T21:23:34.313Z')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name, role = EXCLUDED.role, phone = EXCLUDED.phone;

-- Table: supervisors (23 rows)
INSERT INTO public.supervisors (id, employee_id, designation, department, created_at)
VALUES
  ('d66bec06-0fe8-4dd6-9253-9dd4149e9a55', 'GLA107250', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('56c8fa37-00e4-40e9-ba31-3ef2c813af9c', 'GLA106248', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('f8273edc-2649-41db-a4fc-390712bfc447', 'GLA108254', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('408008d5-b020-49f2-967f-dec35320fe1a', 'GLA115127', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('19a7d8e6-f18b-4ff5-b5b7-f0988222d213', 'GLA114099', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('febff0cf-f5b4-425b-a33f-83e997bb7a8b', 'GLA119314', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('009eb03b-782b-4afc-bcc0-6c1272974e78', 'GLA119315', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('356a2964-1d24-4784-8786-ce4510ed9714', 'GLA119316', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('b20622a5-3e95-43bb-85b4-727331667460', 'GLA123254', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('d5967b07-368b-4461-aef2-b019d827819a', 'GLA125203', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('586da517-930c-4354-bc8b-7a409bc603bd', 'GLA123263', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('267c8360-de0e-499c-be72-081bd96de8a7', 'GLA123288', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('80ca1b4e-2f35-47de-9990-ca1bb5d4ca01', 'GLA123290', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('91a210b6-ce1f-439a-94ce-c7ddb4bea3a1', 'GLA123053', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('be01fc66-78f2-40af-91b8-017c936692a1', 'GLA124174', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('77ed07b0-39c5-4c59-8f93-d9a3d51d95df', 'GLA124175', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('00bd5d40-72e1-4b61-83a1-e47982262f69', 'GLA124196', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('deccd472-b1a1-456e-bdda-a7b82eb3531f', 'GLA123063', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('1a8942f1-904a-4d5c-a76c-dba05c1dce97', 'GLA125219', 'Teaching Associate', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('3ae426de-852f-47f7-9618-ce9be646ba31', 'GLA124204', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('3855a741-1500-4814-b563-2902866c7a47', 'GLA124207', 'Teaching Associate', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('90ba4838-0d1d-497f-b9d5-f5bff4329924', 'GLA125222', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z'),
  ('5f4901c9-0ecd-4748-a906-0a9375d91f00', 'GLA121233', 'Assistant Professor', 'Computer Applications', '2026-09-03T21:18:27.375Z')
ON CONFLICT (id) DO UPDATE SET employee_id = EXCLUDED.employee_id, designation = EXCLUDED.designation, department = EXCLUDED.department;

-- Table: teams (102 rows)
INSERT INTO public.teams (id, team_code, team_number, program, supervisor_id, leader_id, phase1_approved, phase2_approved, phase3_approved, phase3_report_clearance, report_url, paper_url, report_uploaded_at, created_at, updated_at)
VALUES
  ('044a959b-283a-4bec-87ec-b243c854df6b', 'BCA-1', 1, 'BCA', 'd66bec06-0fe8-4dd6-9253-9dd4149e9a55', 'b10516e3-432b-4b42-a97f-2930c602c8cf', TRUE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:29.577Z'),
  ('79cf1f8c-377a-42aa-8ed8-13e23731ba88', 'BCA-2', 2, 'BCA', '56c8fa37-00e4-40e9-ba31-3ef2c813af9c', 'ccdbd5b2-9245-4460-b674-37bcb5251b2a', FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:20:01.788Z'),
  ('3204c595-600e-4b78-9899-ae0a4c70a26d', 'BCA-3', 3, 'BCA', 'f8273edc-2649-41db-a4fc-390712bfc447', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('3fb2058a-82f7-4432-a7d1-7924118fe428', 'BCA-4', 4, 'BCA', '408008d5-b020-49f2-967f-dec35320fe1a', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('348e1083-8250-469a-9968-74c92994aae3', 'BCA-5', 5, 'BCA', '5f4901c9-0ecd-4748-a906-0a9375d91f00', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('f9021ef1-917d-418e-b7b5-1921c3e8d665', 'BCA-6', 6, 'BCA', 'febff0cf-f5b4-425b-a33f-83e997bb7a8b', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('3da43c50-94ef-4978-9001-3bbc34444ad8', 'BCA-7', 7, 'BCA', '009eb03b-782b-4afc-bcc0-6c1272974e78', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('863ab336-7174-4be7-b10e-9cae099ecbae', 'BCA-8', 8, 'BCA', '356a2964-1d24-4784-8786-ce4510ed9714', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('821eab69-c2d1-4cf3-b549-667c43b4d123', 'BCA-9', 9, 'BCA', 'b20622a5-3e95-43bb-85b4-727331667460', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('26987960-d82e-4e8f-a051-a4606fcc36e4', 'BCA-10', 10, 'BCA', 'd5967b07-368b-4461-aef2-b019d827819a', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('31791714-9efa-43a5-90df-0abe89ad7c79', 'BCA-11', 11, 'BCA', '586da517-930c-4354-bc8b-7a409bc603bd', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('86f948eb-9d85-4e26-89d1-bb61fea663ee', 'BCA-12', 12, 'BCA', '267c8360-de0e-499c-be72-081bd96de8a7', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('fa27217b-d62d-4c4e-aadd-9ac3d521cc63', 'BCA-13', 13, 'BCA', '80ca1b4e-2f35-47de-9990-ca1bb5d4ca01', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('b12ab1cb-f8cc-4f10-bcb3-a484fc05d5f7', 'BCA-14', 14, 'BCA', '91a210b6-ce1f-439a-94ce-c7ddb4bea3a1', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('b67c7bd2-1edb-435c-b55a-d8f7cb93dfcc', 'BCA-15', 15, 'BCA', 'be01fc66-78f2-40af-91b8-017c936692a1', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('dcf8c03e-3440-411d-9427-82b56db4790d', 'BCA-16', 16, 'BCA', '77ed07b0-39c5-4c59-8f93-d9a3d51d95df', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('aa138a6b-ea21-471a-950a-8313f4ea9e0b', 'BCA-17', 17, 'BCA', '00bd5d40-72e1-4b61-83a1-e47982262f69', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('7bcf03bf-de82-4659-9f0e-52beb854197c', 'BCA-18', 18, 'BCA', 'deccd472-b1a1-456e-bdda-a7b82eb3531f', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('1a2edc65-2809-4a16-9d59-841e5b43a5dd', 'BCA-19', 19, 'BCA', '1a8942f1-904a-4d5c-a76c-dba05c1dce97', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('b446bb6c-4d4d-4379-a381-4d7288df335e', 'BCA-20', 20, 'BCA', '3ae426de-852f-47f7-9618-ce9be646ba31', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('f81c1d80-1ed5-40ff-8c7b-1be6a266a4c5', 'BCA-21', 21, 'BCA', '3855a741-1500-4814-b563-2902866c7a47', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('bdfc8006-cb44-466d-8145-0e9da3a8905e', 'BCA-22', 22, 'BCA', '90ba4838-0d1d-497f-b9d5-f5bff4329924', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('f4c46c7e-6fa6-4f16-ad61-7091ba226ddb', 'BCA-23', 23, 'BCA', '19a7d8e6-f18b-4ff5-b5b7-f0988222d213', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('1a187572-f9ef-4bc4-a42b-29c1ee084082', 'BCA-24', 24, 'BCA', 'd66bec06-0fe8-4dd6-9253-9dd4149e9a55', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('fc58e754-554e-4549-b02b-4e4d22cdc3f2', 'BCA-25', 25, 'BCA', '56c8fa37-00e4-40e9-ba31-3ef2c813af9c', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('24bba04e-0700-487e-982a-beaed259302d', 'BCA-26', 26, 'BCA', 'f8273edc-2649-41db-a4fc-390712bfc447', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('d530d0ab-c460-44b6-9e70-875972bd5c0f', 'BCA-27', 27, 'BCA', '80ca1b4e-2f35-47de-9990-ca1bb5d4ca01', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('235f4ae6-5739-45fb-b7c9-8729247b5869', 'BCA-28', 28, 'BCA', '19a7d8e6-f18b-4ff5-b5b7-f0988222d213', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('09729bd4-a988-4b55-9ab5-15776693c169', 'BCA-29', 29, 'BCA', 'febff0cf-f5b4-425b-a33f-83e997bb7a8b', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('4a69c5a5-dc9a-4624-9267-2101be534209', 'BCA-30', 30, 'BCA', '009eb03b-782b-4afc-bcc0-6c1272974e78', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('a93c7ea1-91ba-4f64-b1d8-164685831033', 'BCA-31', 31, 'BCA', '356a2964-1d24-4784-8786-ce4510ed9714', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('ee2841fe-72d3-4ae4-a1da-1ec66dcf94fc', 'BCA-32', 32, 'BCA', 'b20622a5-3e95-43bb-85b4-727331667460', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('a9143db8-afb4-4cb6-8010-60ce0443281b', 'BCA-33', 33, 'BCA', 'd5967b07-368b-4461-aef2-b019d827819a', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('00e84ed8-bd8d-4d83-9326-0a4383cfe0b6', 'BCA-34', 34, 'BCA', '586da517-930c-4354-bc8b-7a409bc603bd', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('8be37a13-1dd8-4cb0-a7ab-e0164780cd34', 'BCA-35', 35, 'BCA', '267c8360-de0e-499c-be72-081bd96de8a7', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('42f49d76-f96a-4434-a52f-5033b884f062', 'BCA-36', 36, 'BCA', '80ca1b4e-2f35-47de-9990-ca1bb5d4ca01', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('b6b712c3-5297-4236-ac58-3bb56bd6d72f', 'BCA-37', 37, 'BCA', '91a210b6-ce1f-439a-94ce-c7ddb4bea3a1', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('ac5dca6d-c939-45dc-9858-1a3c0ca0415d', 'BCA-38', 38, 'BCA', 'be01fc66-78f2-40af-91b8-017c936692a1', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('ce2f470d-707b-423c-91fa-d3bf57c62f31', 'BCA-39', 39, 'BCA', '77ed07b0-39c5-4c59-8f93-d9a3d51d95df', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('767d6bb5-1138-4194-8776-6c64e417ce12', 'BCA-40', 40, 'BCA', '00bd5d40-72e1-4b61-83a1-e47982262f69', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('3c91d4a2-ea38-4523-a728-99490c5682c4', 'BCA-41', 41, 'BCA', 'deccd472-b1a1-456e-bdda-a7b82eb3531f', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('07e12b67-f280-4f68-b7a8-11c2a7027eed', 'BCA-42', 42, 'BCA', '1a8942f1-904a-4d5c-a76c-dba05c1dce97', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('881c5ee0-e87b-405c-b5da-605e6fedaab4', 'BCA-43', 43, 'BCA', '3ae426de-852f-47f7-9618-ce9be646ba31', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('2583fceb-eb2d-4f85-802f-db18b920e6c3', 'BCA-44', 44, 'BCA', '3855a741-1500-4814-b563-2902866c7a47', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('775e2e10-6dbf-403f-bed9-1160b51dfb02', 'BCA-45', 45, 'BCA', '90ba4838-0d1d-497f-b9d5-f5bff4329924', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('54ebd90a-d112-4dd7-a98c-66a21088eddf', 'BCA-46', 46, 'BCA', '5f4901c9-0ecd-4748-a906-0a9375d91f00', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('7f077615-8090-48b2-894d-ff6b9db026d7', 'BCA-47', 47, 'BCA', '586da517-930c-4354-bc8b-7a409bc603bd', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('f39c0ab5-4934-4ee8-b005-0c5a9d4e1cc8', 'BCA-48', 48, 'BCA', 'd66bec06-0fe8-4dd6-9253-9dd4149e9a55', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('50cccdd8-da7f-41d5-8061-d7be5b51a835', 'BCA-49', 49, 'BCA', '56c8fa37-00e4-40e9-ba31-3ef2c813af9c', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('45be1937-8668-4b7d-87c6-52f6d3ae12ec', 'BCA-50', 50, 'BCA', 'f8273edc-2649-41db-a4fc-390712bfc447', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('5f46262f-a870-4d83-af15-0435d1b4e754', 'BCA-51', 51, 'BCA', '91a210b6-ce1f-439a-94ce-c7ddb4bea3a1', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('6371d895-ea3d-4972-a2fa-3a9413de64c0', 'BCA-52', 52, 'BCA', '19a7d8e6-f18b-4ff5-b5b7-f0988222d213', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('39797b08-ee6f-4710-8f23-8f503e690ed8', 'BCA-53', 53, 'BCA', 'febff0cf-f5b4-425b-a33f-83e997bb7a8b', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('46a1b6b0-14bc-441f-87aa-911effeebf12', 'BCA-54', 54, 'BCA', '009eb03b-782b-4afc-bcc0-6c1272974e78', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('2461762f-e6e8-459f-803a-bff35838784e', 'BCA-55', 55, 'BCA', '356a2964-1d24-4784-8786-ce4510ed9714', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('ae7008cb-5c56-47c0-a632-bbe732e2351c', 'BCA-56', 56, 'BCA', 'b20622a5-3e95-43bb-85b4-727331667460', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('c00e6a7b-a82d-420f-a739-8603972b0277', 'BCA-57', 57, 'BCA', 'd5967b07-368b-4461-aef2-b019d827819a', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('8a6d8bb0-67bd-4e26-9690-78d10c0cb2d3', 'BCA-58', 58, 'BCA', '586da517-930c-4354-bc8b-7a409bc603bd', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('3818f0a6-2440-44ad-9b86-297fd579bc70', 'BCA-59', 59, 'BCA', '267c8360-de0e-499c-be72-081bd96de8a7', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('ea8fbc36-cd8f-4841-9bd1-443997bfc5fc', 'BCA-60', 60, 'BCA', '91a210b6-ce1f-439a-94ce-c7ddb4bea3a1', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('086c8c77-019c-4852-b2b5-26a3217ba6a9', 'BCA-61', 61, 'BCA', 'be01fc66-78f2-40af-91b8-017c936692a1', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('92b987e4-3c93-467d-b948-8f4e3b9b1d74', 'BCA-62', 62, 'BCA', '77ed07b0-39c5-4c59-8f93-d9a3d51d95df', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('dce2d59c-7042-4d79-ba8f-ad0236b74d19', 'BCA-63', 63, 'BCA', '00bd5d40-72e1-4b61-83a1-e47982262f69', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('bcf839c4-7fc1-48a6-8704-e974c170f26a', 'BCA-64', 64, 'BCA', 'deccd472-b1a1-456e-bdda-a7b82eb3531f', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('adc874de-622a-4a45-a264-682eea85ca8a', 'BCA-65', 65, 'BCA', '90ba4838-0d1d-497f-b9d5-f5bff4329924', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('15d11301-4663-4657-8754-c677dd5e90ad', 'BCA-66', 66, 'BCA', '3ae426de-852f-47f7-9618-ce9be646ba31', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('fc37ff5e-97c9-4c66-abde-780a1bc346eb', 'BCA-67', 67, 'BCA', '3855a741-1500-4814-b563-2902866c7a47', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('5789eef2-a6c1-4068-ba06-c335193164ed', 'BCA-68', 68, 'BCA', '1a8942f1-904a-4d5c-a76c-dba05c1dce97', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('8dc5a604-7d0f-4891-87f9-649f8ad8fbfd', 'BCA-69', 69, 'BCA', '90ba4838-0d1d-497f-b9d5-f5bff4329924', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('10047672-9353-48f2-888a-fe80f7441424', 'BCA-70', 70, 'BCA', 'd66bec06-0fe8-4dd6-9253-9dd4149e9a55', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('c1761ebb-f23d-49bb-8c3a-74d159800656', 'BCA-71', 71, 'BCA', '56c8fa37-00e4-40e9-ba31-3ef2c813af9c', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('e51ece16-a96c-43ec-8031-822064ea3fa2', 'BCA-72', 72, 'BCA', 'f8273edc-2649-41db-a4fc-390712bfc447', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('81248233-340d-45b6-ae88-b390669fb399', 'BCA-73', 73, 'BCA', '408008d5-b020-49f2-967f-dec35320fe1a', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('0a4a7a0f-97aa-4e9a-ac1e-8187f43b1619', 'BCA-74', 74, 'BCA', '5f4901c9-0ecd-4748-a906-0a9375d91f00', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('86da68a1-4a2c-4812-aa1b-53aabf32d2bd', 'BCA-75', 75, 'BCA', 'febff0cf-f5b4-425b-a33f-83e997bb7a8b', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('be6729a6-d5b3-4006-b04d-f2c676d52234', 'BCA-76', 76, 'BCA', '009eb03b-782b-4afc-bcc0-6c1272974e78', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('25456790-d9ae-462e-946f-8470087e2786', 'BCA-77', 77, 'BCA', '356a2964-1d24-4784-8786-ce4510ed9714', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('b382134a-a7b6-437a-b3c9-0e6976b1c38f', 'BCA-78', 78, 'BCA', 'b20622a5-3e95-43bb-85b4-727331667460', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('87f135a2-7d08-4038-93e7-b9e02e7c7fdf', 'BCA-79', 79, 'BCA', 'd5967b07-368b-4461-aef2-b019d827819a', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('cf3a8249-2b68-49ab-8237-8644f8358d58', 'BCA-80', 80, 'BCA', '586da517-930c-4354-bc8b-7a409bc603bd', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('2be2913c-3f72-45d8-9e02-2adde06355c0', 'BCA-81', 81, 'BCA', '267c8360-de0e-499c-be72-081bd96de8a7', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('0fb2a185-9d85-48f9-8509-5ace1fd67e96', 'BCA-82', 82, 'BCA', '91a210b6-ce1f-439a-94ce-c7ddb4bea3a1', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('f5c2810f-1414-44c2-ab1a-7033bd0ffb2d', 'BCA-83', 83, 'BCA', 'be01fc66-78f2-40af-91b8-017c936692a1', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('a428e5ed-2f7f-4b0f-9db1-3d55e54b96ac', 'BCA-84', 84, 'BCA', '77ed07b0-39c5-4c59-8f93-d9a3d51d95df', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('8d6473c2-d6c0-4285-98a7-74f7cede7606', 'BCA-85', 85, 'BCA', '00bd5d40-72e1-4b61-83a1-e47982262f69', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('f2a4c2fd-5816-46e8-b670-fadfb78c3766', 'BCA-86', 86, 'BCA', 'deccd472-b1a1-456e-bdda-a7b82eb3531f', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('984fbc3d-d706-4bf1-9753-4ed51cc167c1', 'BCA-87', 87, 'BCA', '1a8942f1-904a-4d5c-a76c-dba05c1dce97', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('4d6f70be-6e1a-4881-ad51-66121e355476', 'BCA-88', 88, 'BCA', '3ae426de-852f-47f7-9618-ce9be646ba31', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('793c71e1-ca68-4893-9f38-01d8e9a7cfce', 'BCA-89', 89, 'BCA', '3855a741-1500-4814-b563-2902866c7a47', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('14e14ae3-0792-46be-b339-c30880ec4c98', 'BCA-90', 90, 'BCA', '90ba4838-0d1d-497f-b9d5-f5bff4329924', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('dadf6379-cbe9-4da4-8253-b90bcd7e412d', 'BCA-91', 91, 'BCA', '19a7d8e6-f18b-4ff5-b5b7-f0988222d213', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('a9c624dd-d24d-4af5-950e-bb4fe521c94e', 'BCA-92', 92, 'BCA', 'd66bec06-0fe8-4dd6-9253-9dd4149e9a55', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('3f20668f-2e47-4ff8-85d9-199ea7703563', 'BCA-93', 93, 'BCA', '56c8fa37-00e4-40e9-ba31-3ef2c813af9c', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('c5398d11-6f8f-4a63-b621-eea371c0091a', 'DS-1', 1, 'BCA - DS', 'f8273edc-2649-41db-a4fc-390712bfc447', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('8ae54e62-8213-4fef-9627-d0f2dde659b3', 'DS-2', 2, 'BCA - DS', '408008d5-b020-49f2-967f-dec35320fe1a', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('b80632c8-31cb-4d67-85ff-4f35a201f029', 'DS-3', 3, 'BCA - DS', '19a7d8e6-f18b-4ff5-b5b7-f0988222d213', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('d6da1096-06b3-4a46-a6ae-f357cf64faea', 'DS-4', 4, 'BCA - DS', 'febff0cf-f5b4-425b-a33f-83e997bb7a8b', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('29c324a5-4868-416e-91fc-4b874820842c', 'DS-5', 5, 'BCA - DS', '009eb03b-782b-4afc-bcc0-6c1272974e78', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('5e7006bd-c818-4d5b-ab10-f68d59407432', 'DS-6', 6, 'BCA - DS', '356a2964-1d24-4784-8786-ce4510ed9714', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('8feb9795-78b9-48eb-a947-fa5cb2501674', 'DS-7', 7, 'BCA - DS', 'b20622a5-3e95-43bb-85b4-727331667460', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('bb573bf2-816f-43bf-894e-bb9d02bf91b5', 'DS-8', 8, 'BCA - DS', '80ca1b4e-2f35-47de-9990-ca1bb5d4ca01', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z'),
  ('8b3732dc-6dd3-4167-80cd-33a40fc751b2', 'DS-9', 9, 'BCA - DS', 'deccd472-b1a1-456e-bdda-a7b82eb3531f', NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL, '2026-09-03T21:18:27.375Z', '2026-09-03T21:18:27.375Z')
ON CONFLICT (id) DO UPDATE SET team_code = EXCLUDED.team_code, supervisor_id = EXCLUDED.supervisor_id, leader_id = EXCLUDED.leader_id, phase1_approved = EXCLUDED.phase1_approved, phase2_approved = EXCLUDED.phase2_approved, phase3_approved = EXCLUDED.phase3_approved;

-- Table: students (601 rows)
INSERT INTO public.students (id, roll_no, full_name, email, mobile, cpi, course, section, team_id, user_id, is_leader, created_at)
VALUES
  ('fd1e436e-becf-4939-8109-486c7a23381f', '2442010018', 'ADEESH AGRAWAL', 'adeesh.agrawal_bca24@gla.ac.in', '8171136968', 8.34, 'BCA', 'A', '044a959b-283a-4bec-87ec-b243c854df6b', 'b10516e3-432b-4b42-a97f-2930c602c8cf', TRUE, '2026-09-03T21:18:27.375Z'),
  ('29fde8ed-e425-4e91-a06b-2c6026932f38', '2442010019', 'ADISHRI AWASTHI', 'adishri.awasthi_bca24@gla.ac.in', '9044790720', 7.96, 'BCA', 'A', '044a959b-283a-4bec-87ec-b243c854df6b', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f35a2af1-f6ed-411d-afd5-684efd26cd8c', '2442010020', 'ADITI BHADAURIA', 'aditi.bhadauria_bca24@gla.ac.in', '9520928565', 8.7, 'BCA', 'A', '044a959b-283a-4bec-87ec-b243c854df6b', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c5800462-46cd-4e42-8cdc-7aace3c93c0c', '2442010040', 'AKHIL PRATAP SINGH', 'akhil.singh_bca24@gla.ac.in', '6396775752', 8.18, 'BCA', 'A', '044a959b-283a-4bec-87ec-b243c854df6b', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a8e05c3a-7652-4144-8321-f6535b5e8eee', '2442010044', 'AMAN JAIN', 'aman.jain_bca24@gla.ac.in', '9058627761', 8.2, 'BCA', 'A', '044a959b-283a-4bec-87ec-b243c854df6b', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('dbf7571a-4f96-4cf2-ae1a-899060cbee48', '2442010058', 'ANJALI SINGH', 'anjali.singh_bca24@gla.ac.in', '6396237735', 8.88, 'BCA', 'A', '044a959b-283a-4bec-87ec-b243c854df6b', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('1e458f76-590b-46b8-afb6-92625e772bf7', '2442010069', 'ANSH BHADORIA', 'ansh.bhadoria_bca24@gla.ac.in', '9149046428', 8.41, 'BCA', 'A', '79cf1f8c-377a-42aa-8ed8-13e23731ba88', 'ccdbd5b2-9245-4460-b674-37bcb5251b2a', TRUE, '2026-09-03T21:18:27.375Z'),
  ('a2e2f841-48ba-49f8-a857-9d43689ea55f', '2442010073', 'ANSHIKA VERMA', 'anshika.verma_bca24@gla.ac.in', '9058716700', 8.48, 'BCA', 'A', '79cf1f8c-377a-42aa-8ed8-13e23731ba88', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e0333d4d-1360-469a-b042-72e9465fbfc3', '2442010081', 'ANTRA SHRIVASTAVA', 'antra.shrivastava_bca24@gla.ac.in', '9557774594', 8.22, 'BCA', 'A', '79cf1f8c-377a-42aa-8ed8-13e23731ba88', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('8a2a1b91-9d97-4893-9cad-5210d1177bc6', '2442010082', 'ANUBHAV GUPTA', 'anubhav.gupta_bca24@gla.ac.in', '7668399365', 8.23, 'BCA', 'A', '79cf1f8c-377a-42aa-8ed8-13e23731ba88', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f33bd836-4daf-42a2-9896-6b3be6d84827', '2442010085', 'ANUJ SINGH', 'anuj.singh2_bca24@gla.ac.in', '7906879607', 7.98, 'BCA', 'A', '79cf1f8c-377a-42aa-8ed8-13e23731ba88', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('558ad936-57d3-4265-8f4a-c13f8fc7d444', '2442010095', 'ANUSHK KUMAR SINGH', 'anushk.singh_bca24@gla.ac.in', '8173072684', 8.01, 'BCA', 'A', '79cf1f8c-377a-42aa-8ed8-13e23731ba88', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a4a3a7bd-bc8b-42c2-9fda-81fa70db72f4', '2442010109', 'ARYAN RATHORE', 'aryan.rathore_bca24@gla.ac.in', '7668265344', 8.13, 'BCA', 'A', '3204c595-600e-4b78-9899-ae0a4c70a26d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('24c33067-74e2-4a7f-ad55-a0a5e7a75eff', '2442010114', 'ASHMIT DIXIT', 'ashmit.dixit_bca24@gla.ac.in', '7017048074', 8.71, 'BCA', 'A', '3204c595-600e-4b78-9899-ae0a4c70a26d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('585a0141-55c8-4962-8abb-38b260fd1e1c', '2442010124', 'AYUSH SINGH', 'ayush.singh2_bca24@gla.ac.in', '9897600313', 8.11, 'BCA', 'A', '3204c595-600e-4b78-9899-ae0a4c70a26d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3f3c56a6-a465-4b7e-bad1-8ab9653a3ad2', '2442010128', 'BABLI SINGH', 'babli.singh_bca24@gla.ac.in', '9548295872', 7.92, 'BCA', 'A', '3204c595-600e-4b78-9899-ae0a4c70a26d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ae1754f6-2e73-4171-bbba-c39c249e0f4c', '2442010145', 'BHUPENDRA KUMAR UPADHYAY', 'bhupendra.upadhyay_bca24@gla.ac.in', '6395732366', 8.36, 'BCA', 'A', '3204c595-600e-4b78-9899-ae0a4c70a26d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('0bdb1970-9820-463e-8e5b-c7ef75499b24', '2442010152', 'CHANCHAL KAMEWAL', 'chanchal.kamewal_bca24@gla.ac.in', '9389710635', 8.54, 'BCA', 'A', '3204c595-600e-4b78-9899-ae0a4c70a26d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('b472eff2-3313-4aa2-9098-974a6f3c817b', '2442010161', 'CHIRAG GOYAL', 'chirag.goyal_bca24@gla.ac.in', '9119756246', 8.11, 'BCA', 'A', '3fb2058a-82f7-4432-a7d1-7924118fe428', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('557b94e2-a221-49d3-aae9-e7e3d90679c8', '2442010164', 'DAKSH VERMA', 'daksh.verma_bca24@gla.ac.in', '8433401492', 8.09, 'BCA', 'A', '3fb2058a-82f7-4432-a7d1-7924118fe428', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('cf796d81-2625-41be-9118-0786799ea748', '2442010167', 'DEEKSHA BAGHEL', 'deeksha.baghel_bca24@gla.ac.in', '9084265907', 8.49, 'BCA', 'A', '3fb2058a-82f7-4432-a7d1-7924118fe428', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('38f23cfe-d3a5-46f6-a388-e242950fc9a1', '2442010178', 'DEV CHAUDHARY', 'dev.chaudhary_bca24@gla.ac.in', '9690881336', 8, 'BCA', 'A', '3fb2058a-82f7-4432-a7d1-7924118fe428', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('81742625-ef65-4b41-8aae-60dc74a42c79', '2442010188', 'DEVESH KUMAR RAGHUVANSHI', 'devesh.raghuvanshi_bca24@gla.ac.in', '9758178172', 8.2, 'BCA', 'A', '3fb2058a-82f7-4432-a7d1-7924118fe428', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ef707cae-8bbe-4834-9f8f-9c17eefc558b', '2442010192', 'DHRUVI', 'dhruvi.gla_bca24@gla.ac.in', '8979918105', 8.31, 'BCA', 'A', '3fb2058a-82f7-4432-a7d1-7924118fe428', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('dc60c61f-f243-41bd-b3f6-6f95b7aa3e7e', '2442010194', 'DIKSHA SHARMA', 'diksha.sharma_bca24@gla.ac.in', '8949226185', 8.09, 'BCA', 'A', '348e1083-8250-469a-9968-74c92994aae3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ebf51788-f22a-464f-aab6-6cc99b78a100', '2442010206', 'GARGI JAIN', 'gargi.jain_bca24@gla.ac.in', '7310507795', 8.62, 'BCA', 'A', '348e1083-8250-469a-9968-74c92994aae3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('6b12b322-7693-44eb-b5aa-8478a651142d', '2442010207', 'GARIMA MISHRA', 'garima.mishra_bca24@gla.ac.in', '8595245166', 8.65, 'BCA', 'A', '348e1083-8250-469a-9968-74c92994aae3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('1738aca1-107d-4cc8-8b6e-0b5f6dc7ab55', '2442010209', 'GAURANSHI MAHESHWARI', 'gauranshi.maheshwari_bca24@gla.ac.in', '7310724121', 7.88, 'BCA', 'A', '348e1083-8250-469a-9968-74c92994aae3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('8c92bb45-6937-4f89-8134-1749ec4f2dea', '2442010218', 'GAURI SINGH', 'gauri.singh_bca24@gla.ac.in', '6396811344', 8.8, 'BCA', 'A', '348e1083-8250-469a-9968-74c92994aae3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('67702dbb-96e4-4c48-963c-b58ac7522d98', '2442010224', 'GUNGUN PATHAK', 'gungun.pathak_bca24@gla.ac.in', '9066772001', 7.96, 'BCA', 'A', '348e1083-8250-469a-9968-74c92994aae3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3374cb4c-3135-4f0b-a528-01f70b89b047', '2442010226', 'GURSAHIB SINGH WALIA', 'gursahib.walia_bca24@gla.ac.in', '8791006099', 8.17, 'BCA', 'A', 'f9021ef1-917d-418e-b7b5-1921c3e8d665', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('98afafa8-c2c3-44f6-83fb-f808b894dafb', '2442010234', 'HARSH BHARDWAJ', 'harsh.bhardwaj_bca24@gla.ac.in', '6395601843', 8.1, 'BCA', 'A', 'f9021ef1-917d-418e-b7b5-1921c3e8d665', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c6cade64-9613-4063-8209-42f45225cfad', '2442010240', 'HIMANSHI', 'himanshi.gla_bca.ds24@gla.ac.in', '9897563486', 8.01, 'BCA', 'A', 'f9021ef1-917d-418e-b7b5-1921c3e8d665', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2ea9adfc-4cd3-4dc7-a75b-1a4644a8294d', '2442010242', 'HIMANSHU MOULEKHI', 'himanshu.moulekhi_bca24@gla.ac.in', '9557595427', 8.2, 'BCA', 'A', 'f9021ef1-917d-418e-b7b5-1921c3e8d665', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a94f81da-da3b-44fe-8820-0f5425b806dd', '2442010252', 'KANAK SINGHAL', 'kanak.singhal_bca24@gla.ac.in', '7877171402', 8.47, 'BCA', 'A', 'f9021ef1-917d-418e-b7b5-1921c3e8d665', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('809003c4-a939-4d81-9bc9-38e80fabf997', '2442010264', 'KARTIKAY DUBEY', 'kartikay.dubey_bca24@gla.ac.in', '7465051114', 8.16, 'BCA', 'A', 'f9021ef1-917d-418e-b7b5-1921c3e8d665', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3be3cd22-3081-4886-a596-1f158ac082c5', '2442010267', 'KAUSHIKI PATHAK', 'kaushiki.pathak_bca24@gla.ac.in', '9084552127', 9.09, 'BCA', 'A', '3da43c50-94ef-4978-9001-3bbc34444ad8', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f68b99b6-b430-416d-bf6d-4d5b639a6634', '2442010268', 'KAVYANSH GUPTA', 'kavyansh.gupta_bca24@gla.ac.in', '7983857407', 7.92, 'BCA', 'A', '3da43c50-94ef-4978-9001-3bbc34444ad8', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('b757ac55-f34b-4dd1-9a36-2a9faf95c326', '2442010285', 'KRISHNA PATEL', 'krishna.patel_bca24@gla.ac.in', '7017810174', 8.59, 'BCA', 'A', '3da43c50-94ef-4978-9001-3bbc34444ad8', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('241ee822-c518-4afb-903f-941f7df2934c', '2442010295', 'KUMARI ANJALI', 'kumari.anjali_bca24@gla.ac.in', '8439940433', 8.06, 'BCA', 'A', '3da43c50-94ef-4978-9001-3bbc34444ad8', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c10afc82-2256-4512-b24c-860b320fdc1a', '2442010317', 'MANJEET SINGH SODHI', 'manjeet.sodhi_bca24@gla.ac.in', '9917625101', 8.31, 'BCA', 'A', '3da43c50-94ef-4978-9001-3bbc34444ad8', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('6539b605-0c9c-4d77-8945-14c531aa52ad', '2442010329', 'MAYANK SINGH RAUTELA', 'mayank.rautela_bca24@gla.ac.in', '7060227216', 7.88, 'BCA', 'A', '3da43c50-94ef-4978-9001-3bbc34444ad8', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5b92886e-aed3-4552-b22d-60ed8e256643', '2442010332', 'MITANSH KATIYAR', 'mitansh.katiyar_bca24@gla.ac.in', '8218654468', 9.11, 'BCA', 'A', '863ab336-7174-4be7-b10e-9cae099ecbae', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9b1d8179-9819-4e65-8aa6-d1b4e098b573', '2442010337', 'MOHD MEEZAN ALAM', 'mohd.alam_bca24@gla.ac.in', '9506302245', 8.04, 'BCA', 'A', '863ab336-7174-4be7-b10e-9cae099ecbae', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('1b1f5a6f-fbe9-4eb4-a0b7-00c02403626c', '2442010344', 'MUKUND BANSAL', 'mukund.bansal_bca24@gla.ac.in', '9001706928', 8.1, 'BCA', 'A', '863ab336-7174-4be7-b10e-9cae099ecbae', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('57029b1c-f62d-4c61-82e5-dd8848438578', '2442010350', 'NAMAN MAHESHWARI', 'naman.maheshwari_bca24@gla.ac.in', '7452925077', 8.5, 'BCA', 'A', '863ab336-7174-4be7-b10e-9cae099ecbae', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3dd6e55a-20a3-43f3-b710-624c7afd8f99', '2442010357', 'NENCY CHANDIRAMANI', 'nency.chandiramani_bca24@gla.ac.in', '8433436549', 8.26, 'BCA', 'A', '863ab336-7174-4be7-b10e-9cae099ecbae', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('91ad6c87-9ab8-4736-b3f1-afa45487cddf', '2442010391', 'PIYUSH SHARMA', 'piyush.sharma2_bca24@gla.ac.in', '8570926932', 7.88, 'BCA', 'A', '863ab336-7174-4be7-b10e-9cae099ecbae', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e0866eea-081b-4c49-8438-a9a556f81a92', '2442010427', 'PRIYANSHI KULSHRESTHA', 'priyanshi.kulshrestha_bca24@gla.ac.in', '7500688888', 8.17, 'BCA', 'A', '821eab69-c2d1-4cf3-b549-667c43b4d123', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('29e28cb4-b11c-46fc-b611-31e94b4a3a58', '2442010449', 'RAKHI', 'rakhi.gla_bca24@gla.ac.in', '7217400450', 7.95, 'BCA', 'A', '821eab69-c2d1-4cf3-b549-667c43b4d123', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f385eeed-6b94-4786-a7a5-3622abd96c7c', '2442010454', 'RASHI GUPTA', 'rashi.gupta_bca24@gla.ac.in', '9084597372', 8.11, 'BCA', 'A', '821eab69-c2d1-4cf3-b549-667c43b4d123', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('356d97f8-0661-4161-a0fc-61e9a5bda895', '2442010483', 'SAHIL YADAV', 'sahil.yadav_bca24@gla.ac.in', '7409421481', 8.09, 'BCA', 'A', '821eab69-c2d1-4cf3-b549-667c43b4d123', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('26ed8333-6bc9-4dd0-baae-829170010e2e', '2442010488', 'SANDEEP', 'sandeep.gla_bca24@gla.ac.in', '7027615253', 7.95, 'BCA', 'A', '821eab69-c2d1-4cf3-b549-667c43b4d123', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('76796520-2488-4315-b45b-fc22904a61ac', '2442010494', 'SARANSH NIROULA', 'saransh.niroula_bca24@gla.ac.in', '9027603754', 7.95, 'BCA', 'A', '821eab69-c2d1-4cf3-b549-667c43b4d123', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('12a552d6-1e14-4dd8-9a1f-dc63e5daf7f7', '2442010519', 'SHRESHTHA', 'shreshtha.gla_bca24@gla.ac.in', '8979986636', 8.08, 'BCA', 'A', '26987960-d82e-4e8f-a051-a4606fcc36e4', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('abbc1a4f-d567-43e7-827b-62493e393f48', '2442010521', 'SHREYA SETH', 'shreya.seth_bca24@gla.ac.in', '9557630741', 8.71, 'BCA', 'A', '26987960-d82e-4e8f-a051-a4606fcc36e4', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('188cc671-88b3-47fd-9449-85e31183f3de', '2442010525', 'SHRUTI PORWAL', 'shruti.porwal_bca24@gla.ac.in', '6395616856', 8.17, 'BCA', 'A', '26987960-d82e-4e8f-a051-a4606fcc36e4', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f2e5b8f1-96f1-4965-ab85-6610ce890104', '2442010538', 'STUTI AGARWAL', 'stuti.agarwal_bca24@gla.ac.in', '9258670824', 8.7, 'BCA', 'A', '26987960-d82e-4e8f-a051-a4606fcc36e4', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('15c00df5-883b-4efc-9c80-5c634b286551', '2442010540', 'SUHANI GARG', 'suhani.garg_bca24@gla.ac.in', '9837603206', 8.19, 'BCA', 'A', '26987960-d82e-4e8f-a051-a4606fcc36e4', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ade4684c-65b4-40df-a6a6-1c2851c55d3e', '2442010550', 'SUPRIYA', 'supriya.gla_bca24@gla.ac.in', '8534903091', 7.89, 'BCA', 'A', '26987960-d82e-4e8f-a051-a4606fcc36e4', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a4734151-b2e1-4f1d-baa1-815f1934e0bf', '2442010557', 'TANISHA SHARMA', 'tanisha.sharma_bca24@gla.ac.in', '7302140429', 8.14, 'BCA', 'A', '31791714-9efa-43a5-90df-0abe89ad7c79', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('981465cc-5647-43a8-bc4d-2edfd7429ca4', '2442010560', 'TANYA VARSHNEY', 'tanya.varshney_bca24@gla.ac.in', '9761899157', 8.3, 'BCA', 'A', '31791714-9efa-43a5-90df-0abe89ad7c79', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('0df2972d-b8e2-43cb-8948-6b18bfd3826f', '2442010583', 'VAISHNAVI SINGH', 'vaishnavi.singh_bca24@gla.ac.in', '9368748775', 8.03, 'BCA', 'A', '31791714-9efa-43a5-90df-0abe89ad7c79', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9c19f164-4b21-41b7-a4b6-0338dc914388', '2442010586', 'VANSH RAJVANSHI', 'vansh.raji_bca24@gla.ac.in', '7850008886', 7.89, 'BCA', 'A', '31791714-9efa-43a5-90df-0abe89ad7c79', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('6b5f5963-3260-47ef-9d94-323919600f63', '2442010591', 'VANSHIKA VERMA', 'vanshika.verma_bca24@gla.ac.in', '8118838645', 8.92, 'BCA', 'A', '31791714-9efa-43a5-90df-0abe89ad7c79', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9779c8cf-dfc8-46cf-906f-cdd70ea24cdc', '2442010592', 'VARSHA', 'varsha.gla_bca24@gla.ac.in', '7983248965', 8.07, 'BCA', 'A', '86f948eb-9d85-4e26-89d1-bb61fea663ee', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f64786fe-84cf-4cbb-a59c-4dbaf7562625', '2442010594', 'VARUN TIWARI', 'varun.tiwari_bca24@gla.ac.in', '6398810969', 8.16, 'BCA', 'A', '86f948eb-9d85-4e26-89d1-bb61fea663ee', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e7fd9b00-c226-4bcb-be8b-47637417e6ad', '2442010599', 'VIGNESH GUPTA', 'vignesh.gupta_bca24@gla.ac.in', '7023917172', 8.18, 'BCA', 'A', '86f948eb-9d85-4e26-89d1-bb61fea663ee', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ec53c38d-7b6c-4a45-8dc0-04abc7f45e16', '2442010603', 'VIKAS SINGH', 'vikas.singh_bca24@gla.ac.in', '7535800854', 7.93, 'BCA', 'A', '86f948eb-9d85-4e26-89d1-bb61fea663ee', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('56040624-cf6b-4749-8ae7-6a530cd748db', '2442010619', 'VIVEK SHARMA', 'vivek.sharma_bca24@gla.ac.in', '7060664761', 8.11, 'BCA', 'A', '86f948eb-9d85-4e26-89d1-bb61fea663ee', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f1e8a5f4-561c-4ecb-9f38-7b3607e3bd5a', '2442010004', 'ABHIMANYU PRATAP SINGH', 'abhimanyu.singh_bca24@gla.ac.in', '7392913324', 7.61, 'BCA', 'B', 'fa27217b-d62d-4c4e-aadd-9ac3d521cc63', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a65198f9-67b2-4779-9d09-813b9195683f', '2442010005', 'ABHINANDAN SINGH', 'abhinandan.singh_bca24@gla.ac.in', '7667634797', 7.57, 'BCA', 'B', 'fa27217b-d62d-4c4e-aadd-9ac3d521cc63', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c9c4ea2b-f25e-4625-b604-5f8f3dfc5e09', '2442010045', 'AMAN KUSHWAHA', 'aman.kushwaha_bca24@gla.ac.in', '9528209267', 7.53, 'BCA', 'B', 'fa27217b-d62d-4c4e-aadd-9ac3d521cc63', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('b5051211-fdaf-4ca1-b441-c665b1e89c0e', '2442010050', 'AMIT CHAUDHARY', 'amit.chaudhary2_bca24@gla.ac.in', '8171209093', 7.48, 'BCA', 'B', 'fa27217b-d62d-4c4e-aadd-9ac3d521cc63', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('1b180f89-5bd6-4f31-bcde-5d4443ac1ad6', '2442010051', 'AMIT CHAUDHARY', 'amit.chaudhary_bca24@gla.ac.in', '8859421040', 7.51, 'BCA', 'B', 'fa27217b-d62d-4c4e-aadd-9ac3d521cc63', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('61fca7ab-45fd-4597-ae7b-1667d9ef8d88', '2442010053', 'AMIT KUSHWAH', 'amit.kushwah_bca24@gla.ac.in', '8273292177', 7.76, 'BCA', 'B', 'fa27217b-d62d-4c4e-aadd-9ac3d521cc63', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5972d545-f5aa-4e70-8f77-cfce4436fa5e', '2442010055', 'AMRITA SHARMA', 'amrita.sharma_bca24@gla.ac.in', '6396934416', 7.78, 'BCA', 'B', 'b12ab1cb-f8cc-4f10-bcb3-a484fc05d5f7', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('0fa46e5b-52b1-499b-91e7-bcf02345988e', '2442010071', 'ANSHIKA SINGH', 'anshika.singh_bca24@gla.ac.in', '9335369872', 7.56, 'BCA', 'B', 'b12ab1cb-f8cc-4f10-bcb3-a484fc05d5f7', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('4167e566-5cf5-4d40-9a3a-7fae77526329', '2442010074', 'ANSHIKA YADAV', 'anshika.yadav_bca24@gla.ac.in', '9528079710', 7.63, 'BCA', 'B', 'b12ab1cb-f8cc-4f10-bcb3-a484fc05d5f7', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('09aac991-c454-46cd-92f1-d5d355dc0ac7', '2442010077', 'ANSHU SONI', 'anshu.soni_bca24@gla.ac.in', '7505572714', 7.64, 'BCA', 'B', 'b12ab1cb-f8cc-4f10-bcb3-a484fc05d5f7', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d2d82f09-9986-4711-949a-2d0896c0f0c4', '2442010087', 'ANUJ SISODIYA', 'anuj.sisodiya_bca24@gla.ac.in', '8445042736', 7.49, 'BCA', 'B', 'b12ab1cb-f8cc-4f10-bcb3-a484fc05d5f7', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d72f3206-202d-4089-a597-26061baa0323', '2442010090', 'ANUPAM KUMAR UPADHYAY', 'anupam.upadhyay_bca24@gla.ac.in', '8279820574', 7.76, 'BCA', 'B', 'b12ab1cb-f8cc-4f10-bcb3-a484fc05d5f7', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9f2424ba-7d9e-43d4-98da-4d2b01cf6e84', '2442010098', 'APALA', 'apala.gla_bca24@gla.ac.in', '7310520995', 7.63, 'BCA', 'B', 'b67c7bd2-1edb-435c-b55a-d8f7cb93dfcc', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('15e94e5f-6aae-4405-ade4-c20697c8dd8b', '2442010113', 'ASHISH PRATAP SINGH', 'ashish.singh_bca24@gla.ac.in', '9068440394', 7.71, 'BCA', 'B', 'b67c7bd2-1edb-435c-b55a-d8f7cb93dfcc', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9e16b175-76ea-4383-a40a-5aabd890d1a2', '2442010123', 'AVINASH CHAUDHARY', 'avinash.chaudhary_bca24@gla.ac.in', '9389705277', 7.5, 'BCA', 'B', 'b67c7bd2-1edb-435c-b55a-d8f7cb93dfcc', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('7d57ad2a-fe6b-4618-9e54-48443844f0ab', '2442010137', 'BHARAT KUNTAL', 'bharat.kuntal_bca24@gla.ac.in', '9068172663', 7.55, 'BCA', 'B', 'b67c7bd2-1edb-435c-b55a-d8f7cb93dfcc', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a72ca36e-63b4-4b95-ae50-86e1a1f61983', '2442010149', 'BULBUL BANSAL', 'bulbul.bansal_bca24@gla.ac.in', '9557098719', 7.81, 'BCA', 'B', 'b67c7bd2-1edb-435c-b55a-d8f7cb93dfcc', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3cb29e8b-ed5a-443b-8a55-ee6d47a9b4c7', '2442010153', 'CHANDAN DUBEY', 'chandan.dubey_bca24@gla.ac.in', '8126862960', 7.84, 'BCA', 'B', 'b67c7bd2-1edb-435c-b55a-d8f7cb93dfcc', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('94b531f2-53b0-41f1-98e2-a917be535ae5', '2442010154', 'CHANDRA PRAKASH RAI', 'chandra.rai_bca24@gla.ac.in', '9305806729', 7.56, 'BCA', 'B', 'dcf8c03e-3440-411d-9427-82b56db4790d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('596d86f0-a19a-4d4a-9ff5-198d77bf13eb', '2442010158', 'CHHAYANK BAGHEL', 'chhayank.baghel_bca24@gla.ac.in', '9950249856', 7.55, 'BCA', 'B', 'dcf8c03e-3440-411d-9427-82b56db4790d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('69e5878e-c390-43a1-83f4-c41d737796e3', '2442010160', 'CHIRAG', 'chirag.gla_bca24@gla.ac.in', '7017795887', 7.78, 'BCA', 'B', 'dcf8c03e-3440-411d-9427-82b56db4790d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('77268af4-c9ff-4aa1-b952-47c8c2718778', '2442010165', 'DARSHIKA SHARMA', 'darshika.sharma_bca24@gla.ac.in', '8445169235', 7.81, 'BCA', 'B', 'dcf8c03e-3440-411d-9427-82b56db4790d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5058b941-306e-4ea3-8839-74d38f49f67d', '2442010166', 'DAYAL HARI', 'dayal.hari_bca24@gla.ac.in', '9720154865', 7.85, 'BCA', 'B', 'dcf8c03e-3440-411d-9427-82b56db4790d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a31301e7-c86e-4287-87ce-92f757830bf1', '2442010173', 'DEEPANSHU SINGH', 'deepanshu.singh_bca24@gla.ac.in', '6393027668', 7.56, 'BCA', 'B', 'dcf8c03e-3440-411d-9427-82b56db4790d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f4b52487-12c0-4792-9aae-aa43b776240b', '2442010180', 'DEVANG BANSAL', 'devang.bansal_bca24@gla.ac.in', '9259463870', 7.53, 'BCA', 'B', 'aa138a6b-ea21-471a-950a-8313f4ea9e0b', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('8e174dc8-548c-496b-84d4-f4b53daa77a6', '2442010198', 'DIVYANSHI', 'divyanshi.gla_bca24@gla.ac.in', '7300609598', 7.73, 'BCA', 'B', 'aa138a6b-ea21-471a-950a-8313f4ea9e0b', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('fd80d4ab-3168-44ac-ae67-68ac4e4cfda3', '2442010214', 'GAURAV KUMAR', 'gaurav.kumar_bca24@gla.ac.in', '9006954299', 7.64, 'BCA', 'B', 'aa138a6b-ea21-471a-950a-8313f4ea9e0b', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2a38d1fa-31d0-4705-b15c-b3e375a31eb7', '2442010227', 'GYAN PRAKASH SINGH', 'gyan.singh_bca24@gla.ac.in', '8081308015', 7.66, 'BCA', 'B', 'aa138a6b-ea21-471a-950a-8313f4ea9e0b', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('72d94afe-0857-44e8-a898-49b1700a1015', '2442010238', 'HARSHITA GUPTA', 'harshita.gupta_bca24@gla.ac.in', '8077913202', 7.76, 'BCA', 'B', 'aa138a6b-ea21-471a-950a-8313f4ea9e0b', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('862ccf32-d589-4f9f-aa70-602bfaafc1f3', '2442010239', 'HIMANSHI', 'himanshi.gla_bca24@gla.ac.in', '8708306294', 7.81, 'BCA', 'B', 'aa138a6b-ea21-471a-950a-8313f4ea9e0b', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('b1460ffc-9a22-4ad8-bd8a-2b6734856b19', '2442010241', 'HIMANSHU GUPTA', 'himanshu.gupta_bca24@gla.ac.in', '7037432646', 7.59, 'BCA', 'B', '7bcf03bf-de82-4659-9f0e-52beb854197c', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('cb1462bc-215f-44ed-a078-67538b6930e0', '2442010243', 'HIMANSHU SHARMA', 'himanshu.sharma_bca24@gla.ac.in', '9027504465', 7.85, 'BCA', 'B', '7bcf03bf-de82-4659-9f0e-52beb854197c', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('0d184c1f-2d30-4371-8568-fb8cf536bcf7', '2442010261', 'KARTIK PARASAR', 'kartik.parasar_bca24@gla.ac.in', '7505376134', 7.51, 'BCA', 'B', '7bcf03bf-de82-4659-9f0e-52beb854197c', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('49299271-8a5a-4852-9299-a61721fddc1a', '2442010262', 'KARTIK SHARMA', 'kartik.sharma_bca24@gla.ac.in', '8534023292', 7.59, 'BCA', 'B', '7bcf03bf-de82-4659-9f0e-52beb854197c', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d5d54fdc-7396-403b-a353-687e60e0dda3', '2442010272', 'KHUSHBOO', 'khushboo.gla_bca24@gla.ac.in', '8859103108', 7.49, 'BCA', 'B', '7bcf03bf-de82-4659-9f0e-52beb854197c', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('469615bb-35f7-481e-aaf3-752424119dc8', '2442010278', 'KRISHAN KUMAR', 'krishan.kumar_bca24@gla.ac.in', '8865837105', 7.61, 'BCA', 'B', '7bcf03bf-de82-4659-9f0e-52beb854197c', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c3f741a6-b202-4c76-ae02-1ded219e13d3', '2442010284', 'KRISHNA KUMAR', 'krishna.kumar_bca24@gla.ac.in', '8707379682', 7.82, 'BCA', 'B', '1a2edc65-2809-4a16-9d59-841e5b43a5dd', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('14895c94-1fb3-44ab-bac4-90ba929004a4', '2442010286', 'KRISHNA SHARMA', 'krishna.sharma_bca24@gla.ac.in', '8909038801', 7.74, 'BCA', 'B', '1a2edc65-2809-4a16-9d59-841e5b43a5dd', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('75eada85-927d-49a8-b1e8-e8396db98415', '2442010290', 'KRISHNA UPADHYAY', 'krishna.upadhyay_bca24@gla.ac.in', '9997245300', 7.48, 'BCA', 'B', '1a2edc65-2809-4a16-9d59-841e5b43a5dd', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e2fd1941-b2a7-41a5-a9b4-c554ff4a9ab6', '2442010300', 'LAVESH GUPTA', 'lavesh.gupta_bca24@gla.ac.in', '9351248990', 7.87, 'BCA', 'B', '1a2edc65-2809-4a16-9d59-841e5b43a5dd', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d41a7395-07fa-47f6-ae03-1a047fb15e53', '2442010308', 'LUCKY CHAUDHARY', 'lucky.chaudhary_bca24@gla.ac.in', '8395846454', 7.81, 'BCA', 'B', '1a2edc65-2809-4a16-9d59-841e5b43a5dd', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9084c6ec-db0a-4e42-82dc-4f4317d4f5f5', '2442010323', 'MANSI GUPTA', 'mansi.gupta_bca24@gla.ac.in', '9368879788', 7.82, 'BCA', 'B', '1a2edc65-2809-4a16-9d59-841e5b43a5dd', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('51393d1f-99c7-4835-8856-20265bdf6b09', '2442010347', 'NAITIK GARG', 'naitik.garg_bca24@gla.ac.in', '7599966668', 7.69, 'BCA', 'B', 'b446bb6c-4d4d-4379-a381-4d7288df335e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('119e20a3-dcca-4de5-b986-652e1de06f14', '2442010364', 'NIKHIL KUSHWAHA', 'nikhil.kushwaha_bca24@gla.ac.in', '9335606776', 7.5, 'BCA', 'B', 'b446bb6c-4d4d-4379-a381-4d7288df335e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e27f7fc0-7657-4a4a-a239-778332c13f98', '2442010374', 'NITIN SINGH', 'nitin.singh_bca24@gla.ac.in', '9520794219', 7.76, 'BCA', 'B', 'b446bb6c-4d4d-4379-a381-4d7288df335e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f7a691bc-1266-4a7f-8ea5-627c28e92f7a', '2442010381', 'PANKAJ CHAUHAN', 'pankaj.chauhan_bca24@gla.ac.in', '8279820270', 7.48, 'BCA', 'B', 'b446bb6c-4d4d-4379-a381-4d7288df335e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('b8cbc9a0-4aca-4fb2-8214-20b066518562', '2442010415', 'PRATISTHA MISHRA', 'pratistha.mishra_bca24@gla.ac.in', '8439503892', 7.61, 'BCA', 'B', 'b446bb6c-4d4d-4379-a381-4d7288df335e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('1772b416-5a49-4bec-9e6e-7436ab935d44', '2442010425', 'PRIYANKA', 'priyanka.gla_bca24@gla.ac.in', '7817940634', 7.88, 'BCA', 'B', 'b446bb6c-4d4d-4379-a381-4d7288df335e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('8f08e1a5-cf77-4fc3-98a3-8ff96b28464b', '2442010433', 'PURUSOTTAM KAUSHIK', 'purusottam.kaushik_bca24@gla.ac.in', '6397421569', 7.52, 'BCA', 'B', 'f81c1d80-1ed5-40ff-8c7b-1be6a266a4c5', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('bcf43654-f578-4dd0-baa9-a7db5da8d60f', '2442010439', 'RAHUL', 'rahul.gla_bca24@gla.ac.in', '9528597615', 7.69, 'BCA', 'B', 'f81c1d80-1ed5-40ff-8c7b-1be6a266a4c5', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('addff65e-ff82-4c21-a003-e5a26b69c0c5', '2442010458', 'RINI CHAUDHARY', 'rini.chaudhary_bca24@gla.ac.in', '7088671128', 7.51, 'BCA', 'B', 'f81c1d80-1ed5-40ff-8c7b-1be6a266a4c5', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f6229862-27ad-4239-83cc-3cd96851e944', '2442010462', 'RITIK KUMAR', 'ritik.kumar_bca24@gla.ac.in', '8533094816', 7.69, 'BCA', 'B', 'f81c1d80-1ed5-40ff-8c7b-1be6a266a4c5', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('633caa09-bced-4d79-9891-966d279bc784', '2442010465', 'RITU SHARMA', 'ritu.sharma_bca24@gla.ac.in', '7017673078', 7.13, 'BCA', 'B', 'f81c1d80-1ed5-40ff-8c7b-1be6a266a4c5', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('82aaa7dd-0975-48a0-bd04-82bc41197c60', '2442010634', 'ROHIT KUMAR', 'rohit.kumar2_bca24@gla.ac.in', '7817928825', 7.66, 'BCA', 'B', 'f81c1d80-1ed5-40ff-8c7b-1be6a266a4c5', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('aedd5915-687c-4d54-92d2-84ef7dd800c6', '2442010471', 'ROHITASH', 'rohitash.gla_bca24@gla.ac.in', '8445604949', 7.86, 'BCA', 'B', 'bdfc8006-cb44-466d-8145-0e9da3a8905e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('b5541e3a-70a8-45d7-af1d-07bf678a84cd', '2442010492', 'SANJEET', 'sanjeet.gla_bca24@gla.ac.in', '7837568235', 7.7, 'BCA', 'B', 'bdfc8006-cb44-466d-8145-0e9da3a8905e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('fc06ddcf-c6cf-4c02-ba7b-ef5f0b558c91', '2442010497', 'SATYA PRAKASH SINGH', 'satya.singh_bca24@gla.ac.in', '9155391444', 7.69, 'BCA', 'B', 'bdfc8006-cb44-466d-8145-0e9da3a8905e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('57ba4ee8-cb63-40f1-9245-e5977ecd61c2', '2442010502', 'SAURAV', 'saurav.gla2_bca24@gla.ac.in', '9873115591', 7.62, 'BCA', 'B', 'bdfc8006-cb44-466d-8145-0e9da3a8905e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('09f5dad9-3b9c-41ab-8f4e-4111e3b24cfc', '2442010541', 'SUJAL SOLANKI', 'sujal.solanki_bca24@gla.ac.in', '7983524608', 7.88, 'BCA', 'B', 'bdfc8006-cb44-466d-8145-0e9da3a8905e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f9bbdf2e-9dbe-40e9-88e0-aaac26949cac', '2442010544', 'SUMIT CHAUHAN', 'sumit.chauhan_bca24@gla.ac.in', '6397905408', 7.63, 'BCA', 'B', 'bdfc8006-cb44-466d-8145-0e9da3a8905e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d0d6b2b9-2f10-4ad6-9701-2874cb1a4ff8', '2442010548', 'SUNNY GUPTA', 'sunny.gupta_bca24@gla.ac.in', '9548674609', 7.81, 'BCA', 'B', 'f4c46c7e-6fa6-4f16-ad61-7091ba226ddb', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('659376db-ecf2-4c58-8b9a-87717487c3c2', '2442010554', 'SWARNIM PRAYISHI', 'swarnim.prayishi_bca24@gla.ac.in', '9142998705', 7.81, 'BCA', 'B', 'f4c46c7e-6fa6-4f16-ad61-7091ba226ddb', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('6c7d82ef-3ce6-485d-9804-4155c58fc6dc', '2442010556', 'TAMISH CHAUDHARY', 'tamish.chaudhary_bca24@gla.ac.in', '8791585524', 7.63, 'BCA', 'B', 'f4c46c7e-6fa6-4f16-ad61-7091ba226ddb', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('b2aebbb0-07bf-4241-80b8-92094c9d568e', '2442010558', 'TANMAY GULATI', 'tanmay.gulati_bca24@gla.ac.in', '7060374484', 7.71, 'BCA', 'B', 'f4c46c7e-6fa6-4f16-ad61-7091ba226ddb', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f04e35ff-24d3-41d3-bcf4-aa7b5a48d971', '2442010577', 'UTKARSH KUMAR', 'utkarsh.kumar_bca24@gla.ac.in', '9557067330', 7.62, 'BCA', 'B', 'f4c46c7e-6fa6-4f16-ad61-7091ba226ddb', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('587a9b18-8cfe-4853-9b64-ae36d80cad5b', '2442010606', 'VINAYAK KAUSHIK', 'vinayak.kaushik_bca24@gla.ac.in', '8439272209', 7.53, 'BCA', 'B', '1a187572-f9ef-4bc4-a42b-29c1ee084082', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ddbfaad2-a391-43d3-9828-09edbf3dd77e', '2442010608', 'VINITA CHAUDHARY', 'vinita.chaudhary_bca24@gla.ac.in', '8279984335', 7.65, 'BCA', 'B', '1a187572-f9ef-4bc4-a42b-29c1ee084082', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('7acc43f5-75d2-4f41-b2b1-69f8a7e4026a', '2442010621', 'VYOM VARSHNEY', 'vyom.varshney_bca24@gla.ac.in', '9058260454', 7.84, 'BCA', 'B', '1a187572-f9ef-4bc4-a42b-29c1ee084082', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('03c7374a-9bb8-4010-8e8a-cb972cb1da87', '2442010627', 'YASHASVI SAXENA', 'yashasvi.saxena_bca24@gla.ac.in', '9557362998', 7.52, 'BCA', 'B', '1a187572-f9ef-4bc4-a42b-29c1ee084082', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('238ad06d-d346-4a3c-8d1f-0c3ecf6018c1', '2442010630', 'YUG SHARMA', 'yug.sharma_bca24@gla.ac.in', '8445495201', 7.76, 'BCA', 'B', '1a187572-f9ef-4bc4-a42b-29c1ee084082', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d0d1ccbf-35e2-4b69-9bd4-bc1a10651768', '2442010002', 'ABHAY RAJPUT', 'abhay.rajput_bca24@gla.ac.in', '7983750591', 7.26, 'BCA', 'C', 'fc58e754-554e-4549-b02b-4e4d22cdc3f2', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('86523f3e-b43d-430b-a52d-c8eb45e8b76d', '2442010024', 'ADITYA KATROLIYA', 'aditya.katroliya_bca24@gla.ac.in', '9084891602', 7.41, 'BCA', 'C', 'fc58e754-554e-4549-b02b-4e4d22cdc3f2', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('70b0af06-6a1a-47e6-ada1-7f38720b8f68', '2442010029', 'ADITYA VERMA', 'aditya.verma_bca24@gla.ac.in', '8791558764', 7.41, 'BCA', 'C', 'fc58e754-554e-4549-b02b-4e4d22cdc3f2', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('292e6240-8a23-46e5-b4db-488bfaeb6db6', '2442010042', 'ALOK MISHRA', 'alok.mishra_bca24@gla.ac.in', '9457284606', 7.29, 'BCA', 'C', 'fc58e754-554e-4549-b02b-4e4d22cdc3f2', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5d2f1814-cb6a-4410-99c7-95f0f0b8ea18', '2442010067', 'ANMOL SHARMA', 'anmol.sharma_bca24@gla.ac.in', '8445706887', 7.36, 'BCA', 'C', 'fc58e754-554e-4549-b02b-4e4d22cdc3f2', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2a4aa68e-0ece-433e-832e-abe752740775', '2442010076', 'ANSHU LODHI', 'anshu.lodhi_bca24@gla.ac.in', '7217465961', 7.43, 'BCA', 'C', 'fc58e754-554e-4549-b02b-4e4d22cdc3f2', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d3ec7140-c7b5-4b82-a52f-4962a674ffc0', '2442010080', 'ANTRA SAXENA', 'antra.saxena_bca24@gla.ac.in', '7078520610', 7.2, 'BCA', 'C', '24bba04e-0700-487e-982a-beaed259302d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e9e89009-0eaa-40e3-be50-8a1fe8c5d606', '2442010084', 'ANUJ RAJPUT', 'anuj.rajput_bca24@gla.ac.in', '8532994488', 7.4, 'BCA', 'C', '24bba04e-0700-487e-982a-beaed259302d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('8e462896-216d-4f28-abe7-e476bec155b3', '2442010093', 'ANURAG YADAV', 'anurag.yadav_bca24@gla.ac.in', '7455916232', 7.47, 'BCA', 'C', '24bba04e-0700-487e-982a-beaed259302d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c55a8f95-926c-441c-9a03-42ac1104f0fe', '2442010100', 'ARPIT BENDIL', 'arpit.bendil_bca24@gla.ac.in', '9457597239', 7.31, 'BCA', 'C', '24bba04e-0700-487e-982a-beaed259302d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2a36e881-72ea-4e9d-b3ed-e3f3fdcba971', '2442010117', 'ASHUTOSH SHARMA', 'ashutosh.sharma_bca24@gla.ac.in', '9368611262', 7.19, 'BCA', 'C', '24bba04e-0700-487e-982a-beaed259302d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('1e02b69c-954d-419f-be8d-ca1e433a8d4b', '2442010118', 'ASTHA PARUA', 'astha.parua_bca24@gla.ac.in', '9259419760', 7.38, 'BCA', 'C', '24bba04e-0700-487e-982a-beaed259302d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('83dd3f67-2847-4470-bfe8-ef5c24a7b2f3', '2442010129', 'BADAL', 'badal.gla_bca24@gla.ac.in', '9639119583', 7.43, 'BCA', 'C', 'd530d0ab-c460-44b6-9e70-875972bd5c0f', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('8706bf1a-162b-4813-925d-f3af1bbaa7de', '2442010130', 'BALRAM NOHWAR', 'balram.nohwar_bca24@gla.ac.in', '9411907798', 7.29, 'BCA', 'C', 'd530d0ab-c460-44b6-9e70-875972bd5c0f', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a0e4e221-1754-4bba-872d-cd6b35f3a744', '2442010139', 'BHAWANA SINGH', 'bhawana.singh_bca24@gla.ac.in', '9675169329', 7.47, 'BCA', 'C', 'd530d0ab-c460-44b6-9e70-875972bd5c0f', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('1fcf602b-b803-48a7-80dc-a101f3743645', '2442010142', 'BHUMI SHARMA', 'bhumi.sharma_bca24@gla.ac.in', '7465051889', 7.19, 'BCA', 'C', 'd530d0ab-c460-44b6-9e70-875972bd5c0f', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('125b82b1-5f2a-4d99-a559-61387b1645a2', '2442010163', 'CHIRANJEEV BHATIA', 'chiranjeev.bhatia_bca24@gla.ac.in', '8864816027', 7.34, 'BCA', 'C', 'd530d0ab-c460-44b6-9e70-875972bd5c0f', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('650c22db-ee34-4146-b5e8-469451ba1338', '2442010170', 'DEEPAK KASHYAP', 'deepak.kashyap_bca24@gla.ac.in', '7599502606', 7.43, 'BCA', 'C', 'd530d0ab-c460-44b6-9e70-875972bd5c0f', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c8f7f6eb-25a3-4423-a483-5461badfcbe8', '2442010175', 'DEEPIKA RAJ KOHLI', 'deepika.kohli_bca24@gla.ac.in', '9286421362', 7.24, 'BCA', 'C', '235f4ae6-5739-45fb-b7c9-8729247b5869', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e1b9bd36-5313-4c3a-9aad-45928ee94f0c', '2442010183', 'DEVANSH KUSHWAH', 'devansh.kushwah_bca24@gla.ac.in', '8077860953', 7.17, 'BCA', 'C', '235f4ae6-5739-45fb-b7c9-8729247b5869', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('8d16a97c-abda-434f-a5dd-c83498d19fce', '2442010187', 'DEVESH CHAUHAN', 'devesh.chauhan_bca24@gla.ac.in', '9119097535', 7.33, 'BCA', 'C', '235f4ae6-5739-45fb-b7c9-8729247b5869', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('31555425-5acb-4a46-a8d8-9a9503222c05', '2442010193', 'DIKSHA RAJPUT', 'diksha.rajput_bca24@gla.ac.in', '7906963189', 7.14, 'BCA', 'C', '235f4ae6-5739-45fb-b7c9-8729247b5869', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('22fea7a3-c40e-4582-ae4d-2dc1c950394b', '2442010199', 'DIVYANSHU BHARDWAJ', 'divyanshu.bhardwaj_bca24@gla.ac.in', '8445550925', 7.4, 'BCA', 'C', '235f4ae6-5739-45fb-b7c9-8729247b5869', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('57a05b4d-820a-415b-87e7-a609ce90feb1', '2442010204', 'FIROJ KHAN', 'firoj.khan_bca24@gla.ac.in', '7060621852', 7.37, 'BCA', 'C', '235f4ae6-5739-45fb-b7c9-8729247b5869', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('721ba227-0107-4e21-bab6-760430a2de2a', '2442010205', 'GAGAN', 'gagan.gla_bca24@gla.ac.in', '6398456553', 7.22, 'BCA', 'C', '09729bd4-a988-4b55-9ab5-15776693c169', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('68f3ebbd-6acb-4212-a9fc-7d945305e0f3', '2442010210', 'GAURAV', 'gaurav.gla4_bca24@gla.ac.in', '9084841737', 7.35, 'BCA', 'C', '09729bd4-a988-4b55-9ab5-15776693c169', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5af6035b-d9d2-4b08-85d2-80fb1a882389', '2442010217', 'GAURI AGRAWAL', 'gauri.agrawal_bca24@gla.ac.in', '8171053505', 7.3, 'BCA', 'C', '09729bd4-a988-4b55-9ab5-15776693c169', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5706dfa8-0f7f-4c3c-bff4-881d2e6e1a70', '2442010225', 'GUNJAN', 'gunjan.gla_bca24@gla.ac.in', '8868955618', 7.18, 'BCA', 'C', '09729bd4-a988-4b55-9ab5-15776693c169', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('6779331d-3113-4755-8683-8f08662422c8', '2442010249', 'JAYA RAI', 'jaya.rai_bca24@gla.ac.in', '7355443065', 7.45, 'BCA', 'C', '09729bd4-a988-4b55-9ab5-15776693c169', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('6ed40f31-4bf2-4e30-a3f1-23b1408f80ab', '2442010251', 'KAJAL', 'kajal.gla_bca24@gla.ac.in', '9084028585', 7.22, 'BCA', 'C', '09729bd4-a988-4b55-9ab5-15776693c169', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c848ed65-3c79-489f-984c-aa4cd9855429', '2442010273', 'KHUSHBOO RAJPUT', 'khushboo.rajput_bca24@gla.ac.in', '9870688195', 7.39, 'BCA', 'C', '4a69c5a5-dc9a-4624-9267-2101be534209', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2e7d83f1-1ec5-45b3-bc11-130d4c9e581b', '2442010274', 'KOMAL SINGH', 'komal.singh_bca24@gla.ac.in', '9520140512', 7.46, 'BCA', 'C', '4a69c5a5-dc9a-4624-9267-2101be534209', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('29ecb70e-a3ae-4e85-aed8-9a6b22fb1b5f', '2442010275', 'KRISH BHATI', 'krish.bhati_bca24@gla.ac.in', '8800711648', 7.3, 'BCA', 'C', '4a69c5a5-dc9a-4624-9267-2101be534209', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c8dca1d9-28a1-4c70-992e-515398365852', '2442010276', 'KRISH TIWARI', 'krish.tiwari_bca24@gla.ac.in', '8595339192', 7.48, 'BCA', 'C', '4a69c5a5-dc9a-4624-9267-2101be534209', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('14c845f0-5942-4cd7-bc24-c30db07b4afc', '2442010282', 'KRISHNA CHAUDHARY', 'krishna.chaudhary2_bca24@gla.ac.in', '8077188251', 7.19, 'BCA', 'C', '4a69c5a5-dc9a-4624-9267-2101be534209', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('fa5bdbca-8798-4f21-b854-4dc253327333', '2442010296', 'KUMARI SHIVANI', 'kumari.shivani_bca24@gla.ac.in', '7302937052', 7.31, 'BCA', 'C', '4a69c5a5-dc9a-4624-9267-2101be534209', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5d1b24ad-bf39-4e81-845e-288b19c6fa1a', '2442010302', 'LAXMI KANT', 'laxmi.kant_bca24@gla.ac.in', '6395113791', 7.41, 'BCA', 'C', 'a93c7ea1-91ba-4f64-b1d8-164685831033', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('81dc7f6d-4ab7-45d1-9a81-c01c431b9dd0', '2442010310', 'MADHUSUDAN DAS', 'madhusudan.das_bca24@gla.ac.in', '6395503702', 7.42, 'BCA', 'C', 'a93c7ea1-91ba-4f64-b1d8-164685831033', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('4fc1a301-d9ec-4134-bf5b-77abc13e9039', '2442010315', 'MANJEET BHARDWAJ', 'manjeet.bhardwaj_bca24@gla.ac.in', '8191021038', 7.29, 'BCA', 'C', 'a93c7ea1-91ba-4f64-b1d8-164685831033', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('0d2c6574-e15a-411e-8862-c77af6249d30', '2442010330', 'MAYANK YADAV', 'mayank.yadav_bca24@gla.ac.in', '8265868190', 7.24, 'BCA', 'C', 'a93c7ea1-91ba-4f64-b1d8-164685831033', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('fb82168e-b321-4c69-ab95-5c9e6c5a0425', '2442010342', 'MONEY', 'money.solanki_bca24@gla.ac.in', '8171704629', 7.47, 'BCA', 'C', 'a93c7ea1-91ba-4f64-b1d8-164685831033', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a54f43da-7f48-43ee-985b-fd06f43c9021', '2442010343', 'MRIDUL PATHAK', 'mridul.pathak_bca24@gla.ac.in', '7817917001', 7.35, 'BCA', 'C', 'a93c7ea1-91ba-4f64-b1d8-164685831033', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('afbe598a-6a6a-4cc6-bee4-600e97a3b007', '2442010377', 'OM SHUKLA', 'om.shukla_bca24@gla.ac.in', '9761129216', 7.2, 'BCA', 'C', 'ee2841fe-72d3-4ae4-a1da-1ec66dcf94fc', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5486f898-993e-43c4-88b0-efb771c55af9', '2442010386', 'PAWANI MITTAL', 'pawani.mittal_bca24@gla.ac.in', '7054483062', 7.18, 'BCA', 'C', 'ee2841fe-72d3-4ae4-a1da-1ec66dcf94fc', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('92890d3b-e7f2-42ed-ba11-699c1b536af6', '2442010387', 'PEARL PRIYA', 'pearl.priya_bca24@gla.ac.in', '6205607144', 7.33, 'BCA', 'C', 'ee2841fe-72d3-4ae4-a1da-1ec66dcf94fc', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e836a607-67d5-419f-8647-6be3655da6cf', '2442010392', 'POONAM', 'poonam.gla_bca24@gla.ac.in', '9259199852', 7.38, 'BCA', 'C', 'ee2841fe-72d3-4ae4-a1da-1ec66dcf94fc', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('19a1d077-7a76-458b-84ec-3940115dcd23', '2442010395', 'PRACHI GARG', 'prachi.garg_bca24@gla.ac.in', '9389794960', 7.2, 'BCA', 'C', 'ee2841fe-72d3-4ae4-a1da-1ec66dcf94fc', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e31f7341-b504-49ea-8680-fd44208166bf', '2442010421', 'PRINCE RAJ VARDHAN', 'prince.vardhan_bca24@gla.ac.in', '7217308451', 7.35, 'BCA', 'C', 'ee2841fe-72d3-4ae4-a1da-1ec66dcf94fc', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('b9117c5c-0cf0-4e7d-8bd0-2987d5454525', '2442010426', 'PRIYANSHI GUPTA', 'priyanshi.gupta_bca24@gla.ac.in', '9410458274', 7.31, 'BCA', 'C', 'a9143db8-afb4-4cb6-8010-60ce0443281b', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('15714f01-3fc3-4c22-86bd-fe6f3e4ca9b5', '2442010428', 'PRIYANSHI NAGAR', 'priyanshi.nagar_bca24@gla.ac.in', '7060537332', 7.28, 'BCA', 'C', 'a9143db8-afb4-4cb6-8010-60ce0443281b', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('49c04356-35e5-4c40-b054-8eaeee897a3f', '2442010438', 'RAHUL', 'rahul.gla2_bca24@gla.ac.in', '9259093584', 7.19, 'BCA', 'C', 'a9143db8-afb4-4cb6-8010-60ce0443281b', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('72a2167e-bc5e-49c8-ac6c-55727aaa7021', '2442010441', 'RAHUL SHARMA', 'rahul.sharma_bca24@gla.ac.in', '7617450950', 7.39, 'BCA', 'C', 'a9143db8-afb4-4cb6-8010-60ce0443281b', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f38250dd-2b57-4ac9-9ac1-35584bccd67f', '2442010447', 'RAJA RAJPUT', 'raja.rajput_bca24@gla.ac.in', '6395915887', 7.33, 'BCA', 'C', 'a9143db8-afb4-4cb6-8010-60ce0443281b', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c9e83cfa-bcb3-41d8-be48-800c69c97e16', '2442010448', 'RAJESH', 'rajesh.gla_bca24@gla.ac.in', '8307562085', 7.29, 'BCA', 'C', 'a9143db8-afb4-4cb6-8010-60ce0443281b', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('603e62fe-8353-4a92-afd8-18b2889997da', '2442010450', 'RAKSHITA SHARMA', 'rakshita.sharma_bca24@gla.ac.in', '8899764700', 7.2, 'BCA', 'C', '00e84ed8-bd8d-4d83-9326-0a4383cfe0b6', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a70b4c35-c7d8-43b2-a0ed-c16133cdc5ed', '2442010461', 'RISHI SHARMA', 'rishi.sharma_bca24@gla.ac.in', '9548374968', 7.35, 'BCA', 'C', '00e84ed8-bd8d-4d83-9326-0a4383cfe0b6', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('8f9a80ea-22ab-443d-9e7b-3042591ee042', '2442010480', 'SAGAR PRATAP SINGH', 'sagar.singh_bca24@gla.ac.in', '8700289471', 7.23, 'BCA', 'C', '00e84ed8-bd8d-4d83-9326-0a4383cfe0b6', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('061dce94-56f5-4639-a4ce-3dabeb9dfba4', '2442010486', 'SAMRAT YADUVANSHI', 'samrat.yaduvanshi_bca24@gla.ac.in', '8630684874', 7.4, 'BCA', 'C', '00e84ed8-bd8d-4d83-9326-0a4383cfe0b6', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('edc79741-6e3a-4608-b830-6c22de87510b', '2442010490', 'SANDESH PANDEY', 'sandesh.pandey_bca24@gla.ac.in', '8957634762', 7.43, 'BCA', 'C', '00e84ed8-bd8d-4d83-9326-0a4383cfe0b6', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a12900be-1804-4c0d-bd09-9690affeadeb', '2442010496', 'SARTHAK TIWARI', 'sarthak.tiwari_bca24@gla.ac.in', '9193616320', 7.15, 'BCA', 'C', '00e84ed8-bd8d-4d83-9326-0a4383cfe0b6', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ddfab8aa-320f-464e-932a-41d5b5c54e58', '2442010505', 'SEJAL MAHESHWARI', 'sejal.maheshwari_bca24@gla.ac.in', '7302834824', 7.41, 'BCA', 'C', '8be37a13-1dd8-4cb0-a7ab-e0164780cd34', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('dd8f672f-b627-41d6-85c5-bbc4c5b7ef45', '2442010509', 'SHEKHAR SISODIYA', 'shekhar.sisodiya_bca24@gla.ac.in', '7351824713', 7.47, 'BCA', 'C', '8be37a13-1dd8-4cb0-a7ab-e0164780cd34', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f9b8c693-50c4-4fed-8d96-bebd049ea7cc', '2442010514', 'SHIVAM YADAV', 'shivam.yadav_bca24@gla.ac.in', '8449424347', 7.42, 'BCA', 'C', '8be37a13-1dd8-4cb0-a7ab-e0164780cd34', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f0918c10-95ae-4b13-8bf7-971d9788700e', '2442010555', 'SWATI', 'swati.gla_bca24@gla.ac.in', '8168597731', 7.43, 'BCA', 'C', '8be37a13-1dd8-4cb0-a7ab-e0164780cd34', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a1f9fee6-6f94-473e-beed-e59ac2a100ee', '2442010562', 'TARUN SHARMA', 'tarun.sharma1_bca24@gla.ac.in', '7417007421', 7.46, 'BCA', 'C', '8be37a13-1dd8-4cb0-a7ab-e0164780cd34', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('98600d40-c4bc-439c-8341-e35cf3a2cf7e', '2442010564', 'TEJVEER SINGH', 'tejveer.singh_bca24@gla.ac.in', '6396880484', 7.37, 'BCA', 'C', '42f49d76-f96a-4434-a52f-5033b884f062', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c76eebf3-e245-4de0-a190-7c66b53fbd94', '2442010568', 'TUSHAR CHAUDHARY', 'tushar.chaudhary_bca24@gla.ac.in', '9389449928', 7.33, 'BCA', 'C', '42f49d76-f96a-4434-a52f-5033b884f062', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('8a4705fa-a91a-4af2-aded-97f02c80499c', '2442010595', 'VED PRAKASH', 'ved.prakash_bca24@gla.ac.in', '7465042055', 7.41, 'BCA', 'C', '42f49d76-f96a-4434-a52f-5033b884f062', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('bcc45bcd-c906-4527-aec6-5f1585455389', '2442010597', 'VEDIKA SHARMA', 'vedika.sharma_bca24@gla.ac.in', '9084251681', 7.55, 'BCA', 'C', '42f49d76-f96a-4434-a52f-5033b884f062', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('4f27912d-5acc-4fab-aeaf-299833548906', '2442010626', 'YASHASVI PATHAK', 'yashasvi.pathak_bca24@gla.ac.in', '8619055611', 7.29, 'BCA', 'C', '42f49d76-f96a-4434-a52f-5033b884f062', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ad38cddd-9232-45e6-8352-346795d26241', '2442010003', 'ABHI CHOUDHARY', 'abhi.choudhary_bca24@gla.ac.in', '8218522386', 7.02, 'BCA', 'D', 'b6b712c3-5297-4236-ac58-3bb56bd6d72f', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('1affe778-c411-4823-9a6d-4ab4e668f7c5', '2442010010', 'ABHISHEK MISHRA', 'abhishek.mishra_bca24@gla.ac.in', '9336319894', 7.06, 'BCA', 'D', 'b6b712c3-5297-4236-ac58-3bb56bd6d72f', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('89546f4b-1a2a-4993-b021-166645ed53a9', '2442010027', 'ADITYA KUMAR SHUKLA', 'aditya.shukla_bca24@gla.ac.in', '7307419905', 6.92, 'BCA', 'D', 'b6b712c3-5297-4236-ac58-3bb56bd6d72f', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5bdcf360-aa99-4ad2-a23c-433086ac8110', '2442010028', 'ADITYA SINGH CHAUDHARY', 'aditya.chaudhary_bca24@gla.ac.in', '7906115366', 7.05, 'BCA', 'D', 'b6b712c3-5297-4236-ac58-3bb56bd6d72f', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3323485b-bd04-4f7a-b215-e6761a72518d', '2442010038', 'AKASH RAGHAV', 'akash.raghav_bca24@gla.ac.in', '7453854090', 7.08, 'BCA', 'D', 'b6b712c3-5297-4236-ac58-3bb56bd6d72f', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9d89f1cd-b108-4c1a-98e5-399dd3fddff1', '2442010056', 'ANAMIKA KUMARI', 'anamika.kumari_bca24@gla.ac.in', '9508609413', 6.94, 'BCA', 'D', 'b6b712c3-5297-4236-ac58-3bb56bd6d72f', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('40e58bee-8422-4dff-a6f3-072f1bbf135f', '2442010059', 'ANJLI', 'anjli.gla_bca24@gla.ac.in', '9817603852', 7.09, 'BCA', 'D', 'ac5dca6d-c939-45dc-9858-1a3c0ca0415d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('14c5d58a-c5c3-4538-a0f5-b9272f25acd3', '2442010065', 'ANKUSH CHAUHAN', 'ankush.chauhan_bca24@gla.ac.in', '9467982627', 7.15, 'BCA', 'D', 'ac5dca6d-c939-45dc-9858-1a3c0ca0415d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d132aba3-5505-4bb8-99d6-d67e260ee36a', '2442010079', 'ANSHUMESH SAINI', 'anshumesh.saini_bca24@gla.ac.in', '8173913693', 7.14, 'BCA', 'D', 'ac5dca6d-c939-45dc-9858-1a3c0ca0415d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('882ff132-184b-4ba3-9433-baf2e32db105', '2442010086', 'ANUJ SINGH', 'anuj.singh_bca24@gla.ac.in', '8439609140', 6.99, 'BCA', 'D', 'ac5dca6d-c939-45dc-9858-1a3c0ca0415d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5122ffd5-cd96-4799-b114-303185805bba', '2442010089', 'ANUPAM PAUL', 'anupam.paul_bca24@gla.ac.in', '7080029766', 7.05, 'BCA', 'D', 'ac5dca6d-c939-45dc-9858-1a3c0ca0415d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('39d1bda4-7a1b-45ac-8593-fb4bb8212549', '2442010097', 'ANUSHREE DUBEY', 'anushree.dubey_bca24@gla.ac.in', '7505053351', 7.14, 'BCA', 'D', 'ac5dca6d-c939-45dc-9858-1a3c0ca0415d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a71525ee-41e2-49f7-96f4-2b9f5c959ac3', '2442010122', 'AVIKA SHARMA', 'avika.sharma_bca24@gla.ac.in', '7088622200', 7, 'BCA', 'D', 'ce2f470d-707b-423c-91fa-d3bf57c62f31', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c5881c41-02ba-4a08-b37d-a8cb17317e86', '2442010125', 'AYUSH UPADHYAY', 'ayush.upadhyay_bca24@gla.ac.in', '7300708946', 7.03, 'BCA', 'D', 'ce2f470d-707b-423c-91fa-d3bf57c62f31', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e527ce7d-5dc6-4db9-a653-7bcbdcb6120f', '2442010131', 'BANKE BIHARI', 'banke.bihari_bca24@gla.ac.in', '9389962464', 7.07, 'BCA', 'D', 'ce2f470d-707b-423c-91fa-d3bf57c62f31', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('569333f5-4163-4970-a419-9f1c2a239681', '2442010136', 'BHARAT AGRAWAL', 'bharat.agrawal_bca24@gla.ac.in', '8273029543', 7.07, 'BCA', 'D', 'ce2f470d-707b-423c-91fa-d3bf57c62f31', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('72c84fdb-af5e-440a-97ad-09ec29772e89', '2442010138', 'BHAVESH UPADHYAY', 'bhavesh.upadhyay_bca24@gla.ac.in', '6395067521', 6.97, 'BCA', 'D', 'ce2f470d-707b-423c-91fa-d3bf57c62f31', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3415a9c8-b856-44df-8c6a-74b03f1b6e15', '2442010493', 'SANSKRITI BANSAL', 'sanskriti.bansal_bca24@gla.ac.in', '8938053345', 6.96, 'BCA', 'D', 'ce2f470d-707b-423c-91fa-d3bf57c62f31', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('0cbc1aee-eae8-4baf-97a3-366e4bb2f77b', '2442010151', 'CHAITANYA SONIYA', 'chaitanya.soniya_bca24@gla.ac.in', '8445089459', 7.02, 'BCA', 'D', '767d6bb5-1138-4194-8776-6c64e417ce12', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e445317d-4eff-4fa1-9677-1c54ac45c7f1', '2442010157', 'CHHAVI GAUTAM', 'chhavi.gautam_bca24@gla.ac.in', '8869892543', 7.09, 'BCA', 'D', '767d6bb5-1138-4194-8776-6c64e417ce12', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f3ef9808-38da-40c1-a592-8ae97a6afa3f', '2442010162', 'CHIRAG GUPTA', 'chirag.gupta_bca24@gla.ac.in', '9084641782', 6.92, 'BCA', 'D', '767d6bb5-1138-4194-8776-6c64e417ce12', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('acce3b85-8a29-4c51-9f95-534c970000b0', '2442010174', 'DEEPESH SINGH', 'deepesh.singh_bca24@gla.ac.in', '9557062228', 7.09, 'BCA', 'D', '767d6bb5-1138-4194-8776-6c64e417ce12', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('826e150b-b984-4db8-8651-b1918de455de', '2442010176', 'DEEPIKA RAWAT', 'deepika.rawat_bca24@gla.ac.in', '7078859186', 6.96, 'BCA', 'D', '767d6bb5-1138-4194-8776-6c64e417ce12', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('041e77e4-5900-4e3c-8ce7-fa256de8cc6a', '2442010219', 'GAYATRI', 'gayatri.gla_bca24@gla.ac.in', '8791633951', 7.14, 'BCA', 'D', '767d6bb5-1138-4194-8776-6c64e417ce12', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('cd7127c2-be33-4765-bd4e-a23b45440768', '2442010244', 'HINA RAJPUT', 'hina.rajput_bca24@gla.ac.in', '7302198628', 7.1, 'BCA', 'D', '3c91d4a2-ea38-4523-a728-99490c5682c4', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('6934fd60-62ed-4649-836b-f422ebd57740', '2442010247', 'JATIN VERMA', 'jatin.verma_bca24@gla.ac.in', '9808472640', 6.83, 'BCA', 'D', '3c91d4a2-ea38-4523-a728-99490c5682c4', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('45a38475-f2c9-450a-9009-5c4d3238d834', '2442010306', 'LOVE SHARMA', 'love.sharma_bca24@gla.ac.in', '9119728730', 7.02, 'BCA', 'D', '3c91d4a2-ea38-4523-a728-99490c5682c4', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('fde2c7b8-ff3d-4a6b-a655-f3ab11a52c84', '2342010366', 'MANAN SHARMA', 'manan.sharma_bca23@gla.ac.in', '7830471989', 6.78, 'BCA', 'D', '3c91d4a2-ea38-4523-a728-99490c5682c4', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('642c7a0c-84a9-42ca-b597-8934044e513b', '2442010312', 'MANAV YADAV', 'manav.yadav_bca24@gla.ac.in', '7818868285', 7.14, 'BCA', 'D', '3c91d4a2-ea38-4523-a728-99490c5682c4', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('00cec3a9-9803-4471-91af-b3c828f53ac3', '2442010324', 'MANVENDRA KUMAR', 'manvendra.kumar_bca24@gla.ac.in', '8171866396', 7.08, 'BCA', 'D', '3c91d4a2-ea38-4523-a728-99490c5682c4', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('67d8203a-c5c0-41fd-9486-ff718a8dee5a', '2442010327', 'MAYANK PRATAP SINGH', 'mayank.singh_bca24@gla.ac.in', '9068756180', 6.97, 'BCA', 'D', '07e12b67-f280-4f68-b7a8-11c2a7027eed', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('eb16a5e6-be7a-4af3-b183-a5544795d79b', '2442010331', 'MEGHA SHARMA', 'megha.sharma_bca24@gla.ac.in', '9410042879', 7.12, 'BCA', 'D', '07e12b67-f280-4f68-b7a8-11c2a7027eed', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a77e0275-9e3a-4b0d-937d-e2b4d82f871a', '2442010333', 'MITANSHI JAIN', 'mitanshi.jain_bca24@gla.ac.in', '8218705832', 7, 'BCA', 'D', '07e12b67-f280-4f68-b7a8-11c2a7027eed', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('b2b43b0d-6f27-420d-9cac-0879559cd9f4', '2442010345', 'MUSKAN CHAUDHARY', 'muskan.chaudhary_bca24@gla.ac.in', '7505535287', 6.98, 'BCA', 'D', '07e12b67-f280-4f68-b7a8-11c2a7027eed', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('276f027a-7b13-44bd-8f02-4e19f3bc5606', '2442010355', 'NEERAJ YADAV', 'neeraj.yadav_bca24@gla.ac.in', '8070178080', 7.07, 'BCA', 'D', '07e12b67-f280-4f68-b7a8-11c2a7027eed', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2d9caa93-d947-4fc4-a928-59d28bb96392', '2442010359', 'NIHARIKA', 'niharika.gla_bca24@gla.ac.in', '6398508305', 7.02, 'BCA', 'D', '07e12b67-f280-4f68-b7a8-11c2a7027eed', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('6b153f2c-a521-4df0-967f-99ebb13f64e3', '2442010361', 'NIKHIL', 'nikhil.gla_bca24@gla.ac.in', '8708549247', 7.17, 'BCA', 'D', '881c5ee0-e87b-405c-b5da-605e6fedaab4', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f09bbc60-12aa-423a-b5a6-8908ee870172', '2442010366', 'NIKHIL SHARMA', 'nikhil.sharma_bca24@gla.ac.in', '9760136688', 6.94, 'BCA', 'D', '881c5ee0-e87b-405c-b5da-605e6fedaab4', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5045f730-2792-4c4a-ba51-d0e0304bb15b', '2442010370', 'NISHANT TYAGI', 'nishant.tyagi_bca24@gla.ac.in', '9259404881', 6.92, 'BCA', 'D', '881c5ee0-e87b-405c-b5da-605e6fedaab4', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('61bd2c2c-fb91-4f2a-afb3-81e470e03f1b', '2442010371', 'NITESH PAYLA', 'nitesh.payla_bca24@gla.ac.in', '9368192824', 7, 'BCA', 'D', '881c5ee0-e87b-405c-b5da-605e6fedaab4', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d10c533c-3623-4539-882f-56cebf656ac2', '2442010380', 'PANKAJ CHAUDHARY', 'pankaj.chaudhary_bca24@gla.ac.in', '7078772366', 6.98, 'BCA', 'D', '881c5ee0-e87b-405c-b5da-605e6fedaab4', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('94190bbb-80fd-4284-bf10-5a86f5e4186d', '2442010400', 'PRAKHYAT MAURYA', 'prakhyat.maurya_bca24@gla.ac.in', '9935164239', 7.09, 'BCA', 'D', '881c5ee0-e87b-405c-b5da-605e6fedaab4', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('836d61e5-b2e6-4e07-88b4-c768cb6535ed', '2442010414', 'PRATIBHA CHAUDHARY', 'pratibha.gla_bca24@gla.ac.in', '8630606300', 6.86, 'BCA', 'D', '2583fceb-eb2d-4f85-802f-db18b920e6c3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f6ae541e-6140-423e-8a4f-c896047d7418', '2442010420', 'PRINCE KUMAR', 'prince.kumar_bca24@gla.ac.in', '7459081892', 7.07, 'BCA', 'D', '2583fceb-eb2d-4f85-802f-db18b920e6c3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('4b4e4f88-3b74-41d6-9730-2e91df5f6110', '2442010422', 'PRINCE THAINUAN', 'prince.thainuan_bca24@gla.ac.in', '7830855141', 7.17, 'BCA', 'D', '2583fceb-eb2d-4f85-802f-db18b920e6c3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9747f3c2-88d1-48dd-80fb-8e4ce1ec86af', '2342010472', 'PRIYANSHI BANSAL', 'priyanshi.bansal_bca23@gla.ac.in', '9548196949', 7.33, 'BCA', 'D', '2583fceb-eb2d-4f85-802f-db18b920e6c3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c02a54ca-dec5-4360-b304-a9b08a1bd5ed', '2442010430', 'PRIYANSHU DWIVEDI', 'priyanshu.dwivedi_bca24@gla.ac.in', '9569406186', 7.08, 'BCA', 'D', '2583fceb-eb2d-4f85-802f-db18b920e6c3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('88f57e73-1e2d-4ae8-96a0-30c3502cc207', '2442010431', 'PRIYANSHU PATHAK', 'priyanshu.pathak_bca24@gla.ac.in', '7371942471', 7.11, 'BCA', 'D', '2583fceb-eb2d-4f85-802f-db18b920e6c3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a77b8271-e906-4686-a30e-34294fff215e', '2442010446', 'RAJ SHRI', 'raj.shri_bca24@gla.ac.in', '9771137700', 7.05, 'BCA', 'D', '775e2e10-6dbf-403f-bed9-1160b51dfb02', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('7519a95d-386b-4957-b53b-44b3d14e93b6', '2442010452', 'RAMJEET', 'ramjeet.gla_bca24@gla.ac.in', '6399309487', 7.08, 'BCA', 'D', '775e2e10-6dbf-403f-bed9-1160b51dfb02', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('1901fdf0-4454-4ef0-ac04-d0e9d0be87a9', '2442010464', 'RITIK PRAJAPATI', 'ritik.prajapati_bca24@gla.ac.in', '6396362248', 6.94, 'BCA', 'D', '775e2e10-6dbf-403f-bed9-1160b51dfb02', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('339e1794-5048-4656-8b71-9a17972957f0', '2442010485', 'SAMEER CHAUDHARY', 'sameer.chaudhary_bca24@gla.ac.in', '8532018566', 7.1, 'BCA', 'D', '775e2e10-6dbf-403f-bed9-1160b51dfb02', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('b15ef426-9466-4e05-937b-8b01752e901d', '2442010487', 'SAMRIDDHI SHARMA', 'samriddhi.sharma_bca24@gla.ac.in', '9389493001', 6.9, 'BCA', 'D', '775e2e10-6dbf-403f-bed9-1160b51dfb02', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('114e4ead-46f6-463a-b545-5d4d7718e093', '2442010491', 'SANGAM CHAUDHARY', 'sangam.gla_bca24@gla.ac.in', '7409596959', 7.08, 'BCA', 'D', '775e2e10-6dbf-403f-bed9-1160b51dfb02', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('785f0165-2259-43a9-b38b-69dca04d22e1', '2442010150', 'BULBUL SONI', 'bulbul.soni_bca24@gla.ac.in', '9258408075', 7.17, 'BCA', 'D', '54ebd90a-d112-4dd7-a98c-66a21088eddf', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3dd353b0-14b3-4dbb-8c89-529be3924c68', '2442010520', 'SHREYA', 'shreya.gla_bca24@gla.ac.in', '7500376042', 7.1, 'BCA', 'D', '54ebd90a-d112-4dd7-a98c-66a21088eddf', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ae729ab1-ad65-41af-b757-0b3906a68e6b', '2442010533', 'SIDDHIKA RATHORE', 'siddhika.rathore_bca24@gla.ac.in', '9389111690', 7.16, 'BCA', 'D', '54ebd90a-d112-4dd7-a98c-66a21088eddf', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('44c00e0a-18b1-4b19-bf1c-10616e281964', '2442010535', 'SONAM', 'sonam.gla_bca24@gla.ac.in', '9350146527', 7.03, 'BCA', 'D', '54ebd90a-d112-4dd7-a98c-66a21088eddf', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('077e14f0-f442-4221-bd70-b5313a7208fe', '2442010545', 'SUMIT SHIVHARE', 'sumit.shivhare_bca24@gla.ac.in', '9219431128', 6.98, 'BCA', 'D', '54ebd90a-d112-4dd7-a98c-66a21088eddf', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d5bc05d7-0dbc-4ba4-93b7-15c9c86685d4', '2442010549', 'SUNNY TEVATIA', 'sunny.tevatia_bca24@gla.ac.in', '7900804016', 7.11, 'BCA', 'D', '54ebd90a-d112-4dd7-a98c-66a21088eddf', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('dac725f4-4490-49be-92a9-dd29321e4ad9', '2442010563', 'TARUN SHARMA', 'tarun.sharma_bca24@gla.ac.in', '9258506218', 6.99, 'BCA', 'D', '7f077615-8090-48b2-894d-ff6b9db026d7', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('beb51981-445e-4382-8e7e-9608ac263129', '2442010566', 'TRAPTI SIKARWAR', 'trapti.sikarwar_bca24@gla.ac.in', '7983696927', 6.99, 'BCA', 'D', '7f077615-8090-48b2-894d-ff6b9db026d7', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f67c3ec9-5c82-490f-8420-ef67a14618cb', '2442010573', 'UMANG KUMAR SHARMA', 'umang.sharma_bca24@gla.ac.in', '9536798169', 7.01, 'BCA', 'D', '7f077615-8090-48b2-894d-ff6b9db026d7', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('7d6a113c-a166-46c8-a233-6006c6be10f5', '2442010580', 'VAIBHAV SINGH', 'vaibhav.singh_bca24@gla.ac.in', '9005967820', 6.98, 'BCA', 'D', '7f077615-8090-48b2-894d-ff6b9db026d7', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('4c537198-bf6a-4bde-a4a9-99a84d722941', '2442010585', 'VANSH RAJ YADAV', 'vansh.yadav2_bca24@gla.ac.in', '8126470424', 7.1, 'BCA', 'D', '7f077615-8090-48b2-894d-ff6b9db026d7', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2eca5631-ec3f-48a2-b7b0-7366382015ec', '2442010587', 'VANSH RAWAT', 'vansh.rawat_bca24@gla.ac.in', '9368792371', 6.99, 'BCA', 'D', 'f39c0ab5-4934-4ee8-b005-0c5a9d4e1cc8', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('7452a383-d06b-45c7-813b-c80baf2ee9c8', '2442010593', 'VARUN KUMAR', 'varun.kumar_bca24@gla.ac.in', '9119035870', 7.1, 'BCA', 'D', 'f39c0ab5-4934-4ee8-b005-0c5a9d4e1cc8', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3b7ab239-dc40-4c79-90fa-7f0bcf2eb4ad', '2442010601', 'VIJAY', 'vijay.gla2_bca24@gla.ac.in', '9084619156', 7, 'BCA', 'D', 'f39c0ab5-4934-4ee8-b005-0c5a9d4e1cc8', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5cdfeeef-a2a0-4835-b166-ebe7900c8031', '2442010602', 'VIKAS', 'vikas.gla_bca24@gla.ac.in', '7017602993', 7.17, 'BCA', 'D', 'f39c0ab5-4934-4ee8-b005-0c5a9d4e1cc8', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f6c1afbb-8b0b-436a-928c-102bd7e7aac8', '2442010604', 'VIKASH CHAUDHARY', 'vikash.chaudhary_bca24@gla.ac.in', '7248725140', 7.08, 'BCA', 'D', 'f39c0ab5-4934-4ee8-b005-0c5a9d4e1cc8', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('7a83ef4f-3473-42ca-b5d7-2dc06fa820f7', '2442010632', 'YUVRAJ UPADHYAY', 'yuvraj.upadhyay_bca24@gla.ac.in', '8923256151', 7.02, 'BCA', 'D', 'f39c0ab5-4934-4ee8-b005-0c5a9d4e1cc8', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('47526cba-c777-4076-a5b1-7231349cfdfc', '2442010006', 'ABHINAV PUNDHIR', 'abhinav.pundhir_bca24@gla.ac.in', '8882884409', 6.79, 'BCA', 'E', '50cccdd8-da7f-41d5-8061-d7be5b51a835', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a031e6de-ce04-4672-a31b-567654e4925b', '2442010012', 'ABHISHEK PRATAP', 'abhishek.pratap_bca24@gla.ac.in', '6398880272', 7.44, 'BCA', 'E', '50cccdd8-da7f-41d5-8061-d7be5b51a835', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('cc3b2547-f472-497e-bdb6-b1a21de2c103', '2442010022', 'ADITYA', 'aditya.gla_bca24@gla.ac.in', '7906998848', 6.86, 'BCA', 'E', '50cccdd8-da7f-41d5-8061-d7be5b51a835', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c3cccb00-af64-41c6-a21a-76f656406334', '2442010026', 'ADITYA KUMAR', 'aditya.kumar_bca24@gla.ac.in', '9528392072', 6.71, 'BCA', 'E', '50cccdd8-da7f-41d5-8061-d7be5b51a835', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ea36a1d9-eaed-4eb2-bff7-8ab0d0823527', '2442010034', 'AJAY SINGH', 'ajay.singh3_bca24@gla.ac.in', '8445895102', 6.87, 'BCA', 'E', '50cccdd8-da7f-41d5-8061-d7be5b51a835', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2af9f39d-1812-4ca2-a25f-17974a4062f5', '2442010039', 'AKHIL CHAUHAN', 'akhil.chauhan_bca24@gla.ac.in', '8630633563', 6.7, 'BCA', 'E', '50cccdd8-da7f-41d5-8061-d7be5b51a835', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('fa5229fe-6e8b-4a3f-a415-5c0cc0f134b9', '2442010047', 'AMAN VASHISTHA', 'aman.vashistha_bca24@gla.ac.in', '7505720811', 6.77, 'BCA', 'E', '45be1937-8668-4b7d-87c6-52f6d3ae12ec', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('524b3123-638e-4534-b385-f719412d06df', '2442010052', 'AMIT KUMAR', 'amit.kumar_bca24@gla.ac.in', '9690635991', 6.72, 'BCA', 'E', '45be1937-8668-4b7d-87c6-52f6d3ae12ec', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('15711b63-53e9-48e6-8a19-8ef32146d101', '2442010062', 'ANKIT CHAUDHARY', 'ankit.chaudhary_bca24@gla.ac.in', '7310633538', 6.73, 'BCA', 'E', '45be1937-8668-4b7d-87c6-52f6d3ae12ec', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a6de0ed0-42e2-46ed-a127-6672e15ecb9e', '2442010068', 'ANMOL SINGH', 'anmol.singh_bca24@gla.ac.in', '7668471096', 6.82, 'BCA', 'E', '45be1937-8668-4b7d-87c6-52f6d3ae12ec', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('388a654a-b54c-43a0-a598-ba6849af1144', '2442010070', 'ANSHIKA SHARMA', 'anshika.sharma_bca24@gla.ac.in', '8279432280', 6.76, 'BCA', 'E', '45be1937-8668-4b7d-87c6-52f6d3ae12ec', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('fa89d078-23b0-4e58-926d-bec742bdd487', '2442010072', 'ANSHIKA TIWARI', 'anshika.tiwari_bca24@gla.ac.in', '6398060424', 6.7, 'BCA', 'E', '45be1937-8668-4b7d-87c6-52f6d3ae12ec', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a186f432-f16a-429d-85d2-eb0b88ce4cfb', '2442010092', 'ANURAG RAJ PANDEY', 'anurag.pandey_bca24@gla.ac.in', '7079447517', 6.87, 'BCA', 'E', '5f46262f-a870-4d83-af15-0435d1b4e754', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('872572bd-9dff-46ed-b883-1b94f413a61a', '2442010103', 'ARSHAD', 'arshad.gla_bca24@gla.ac.in', '9027433438', 6.79, 'BCA', 'E', '5f46262f-a870-4d83-af15-0435d1b4e754', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e3b43478-7bd1-492c-b339-ce87cc83a3c0', '2442010126', 'AYUSHI AGRAWAL', 'ayushi.agrawal_bca24@gla.ac.in', '9219152618', 6.72, 'BCA', 'E', '5f46262f-a870-4d83-af15-0435d1b4e754', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('29ccd22e-b9b0-4e76-8c5b-0bc5a03cb7e7', '2442010127', 'AYUSHI SHARMA', 'ayushi.sharma_bca24@gla.ac.in', '9511172655', 6.91, 'BCA', 'E', '5f46262f-a870-4d83-af15-0435d1b4e754', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9f79c408-5345-48e6-a396-8a92350a2ee8', '2442010134', 'BHANASH KUMAR NAGRAJ', 'bhanash.nagraj_bca24@gla.ac.in', '9982716696', 6.71, 'BCA', 'E', '5f46262f-a870-4d83-af15-0435d1b4e754', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('02a28e1f-3192-4333-add0-7c961125cd0d', '2442010171', 'DEEPAK PANDEY', 'deepak.pandey_bca24@gla.ac.in', '6398709220', 6.79, 'BCA', 'E', '5f46262f-a870-4d83-af15-0435d1b4e754', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('7bb2d7bc-01c5-40de-a08b-f346710984c6', '2442010184', 'DEVANSH SINGH', 'devansh.singh_bca24@gla.ac.in', '8081224723', 6.91, 'BCA', 'E', '6371d895-ea3d-4972-a2fa-3a9413de64c0', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('45ba7488-ef2c-4362-8d12-e1e6dc4898bb', '2442010186', 'DEVENDRA', 'devendra.gla_bca24@gla.ac.in', '8445047538', 6.88, 'BCA', 'E', '6371d895-ea3d-4972-a2fa-3a9413de64c0', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5f8478ef-feff-4677-842a-f15ae63956c6', '2442010208', 'GARIMA PORWAL', 'garima.porwal_bca24@gla.ac.in', '8630766091', 6.84, 'BCA', 'E', '6371d895-ea3d-4972-a2fa-3a9413de64c0', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('0d524679-5b4f-40b5-a6fc-dba113b4de4b', '2442010223', 'GULSHAN KUMAR', 'gulshan.kumar_bca24@gla.ac.in', '6397633060', 6.76, 'BCA', 'E', '6371d895-ea3d-4972-a2fa-3a9413de64c0', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a2627e9a-6986-4ca0-99b6-bb022b1047bf', '2442010228', 'HARDIK CHAUDHARY', 'hardik.chaudhary_bca24@gla.ac.in', '7017271237', 6.71, 'BCA', 'E', '6371d895-ea3d-4972-a2fa-3a9413de64c0', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2e864e43-4f92-4a88-836b-19e3f7ee2c8f', '2442010237', 'HARSH SONI', 'harsh.soni_bca24@gla.ac.in', '7830090097', 6.68, 'BCA', 'E', '6371d895-ea3d-4972-a2fa-3a9413de64c0', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('066945a2-d9fd-487d-99c7-69214b913edb', '2442010259', 'KARAN CHAUHAN', 'karan.chauhan_bca24@gla.ac.in', '8394096272', 6.73, 'BCA', 'E', '39797b08-ee6f-4710-8f23-8f503e690ed8', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2a431bad-f2b9-4ce0-972f-9ce3fe54f258', '2442010301', 'LAVI AGRAWAL', 'lavi.agrawal_bca24@gla.ac.in', '8534067129', 6.88, 'BCA', 'E', '39797b08-ee6f-4710-8f23-8f503e690ed8', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('8ddf4d68-1b31-46d3-9a08-c40d9dff2eb9', '2442010311', 'MAHESH PANDEY', 'mahesh.pandey_bca24@gla.ac.in', '9193164245', 6.67, 'BCA', 'E', '39797b08-ee6f-4710-8f23-8f503e690ed8', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('1a23d771-d115-4338-9672-3b2e0b2bd714', '2442010319', 'MANOJ BAGHEL', 'manoj.baghel_bca24@gla.ac.in', '7417130494', 6.86, 'BCA', 'E', '39797b08-ee6f-4710-8f23-8f503e690ed8', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('cc0f9e4c-8dcc-4454-a596-3e57cf7a9a89', '2442010325', 'MAYANK AGRAWAL', 'mayank.agrawal_bca24@gla.ac.in', '9045109433', 6.78, 'BCA', 'E', '39797b08-ee6f-4710-8f23-8f503e690ed8', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3a67f524-fd9d-410b-bf02-dd74362f6e3f', '2442010348', 'NAKUL JADAUN', 'nakul.jadaun_bca24@gla.ac.in', '7055007808', 6.79, 'BCA', 'E', '39797b08-ee6f-4710-8f23-8f503e690ed8', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ea6be057-b35e-4edf-a31e-d2bb9a19e8ce', '2442010349', 'NAMAN GUPTA', 'naman.gupta_bca24@gla.ac.in', '7668467537', 6.77, 'BCA', 'E', '46a1b6b0-14bc-441f-87aa-911effeebf12', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('1fa7aee6-5a16-4f92-99d5-8a3501ff0445', '2442010352', 'NATASHA YADAV', 'natasha.yadav_bca24@gla.ac.in', '7409191342', 6.7, 'BCA', 'E', '46a1b6b0-14bc-441f-87aa-911effeebf12', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('edb26a97-7803-4ef3-855d-91450643b57a', '2442010353', 'NAVEEN KUMAR', 'naveen.kumar_bca24@gla.ac.in', '7505906776', 6.72, 'BCA', 'E', '46a1b6b0-14bc-441f-87aa-911effeebf12', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2d063186-fc48-4bed-92ad-44d774031a4b', '2442010360', 'NIKET SINGH', 'niket.singh_bca24@gla.ac.in', '7818841817', 6.76, 'BCA', 'E', '46a1b6b0-14bc-441f-87aa-911effeebf12', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('4023350e-5ed6-4b84-8064-26f499bd8fc7', '2442010369', 'NISHANT SHARMA', 'nishant.sharma_bca24@gla.ac.in', '7657979389', 6.77, 'BCA', 'E', '46a1b6b0-14bc-441f-87aa-911effeebf12', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('55f8b741-0b69-4fa8-8e5e-8f17ea63934e', '2442010379', 'PALAK AGRAWAL', 'palak.agrawal_bca24@gla.ac.in', '9837308373', 6.58, 'BCA', 'E', '46a1b6b0-14bc-441f-87aa-911effeebf12', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9d39ec6f-7875-4302-ab56-f668d490a667', '2442010382', 'PANKHUDI AGRAWAL', 'pankhudi.agrawal_bca24@gla.ac.in', '8532952300', 6.85, 'BCA', 'E', '2461762f-e6e8-459f-803a-bff35838784e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('382c8b61-e6c7-4a03-a6c5-00c57fc824d2', '2442010394', 'PRABHAT UPADHYAY', 'prabhat.upadhyay_bca24@gla.ac.in', '8445035376', 6.69, 'BCA', 'E', '2461762f-e6e8-459f-803a-bff35838784e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ff5fd89b-37eb-4502-a664-cc5714aa1e8e', '2442010397', 'PRAGATI DIXIT', 'pragati.dixit_bca24@gla.ac.in', '9258903708', 6.86, 'BCA', 'E', '2461762f-e6e8-459f-803a-bff35838784e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('45f7affb-1aad-4293-b44e-b35e7bd5f6ee', '2442010402', 'PRANKUR KUMAR', 'prankur.kumar_bca24@gla.ac.in', '7983594990', 6.71, 'BCA', 'E', '2461762f-e6e8-459f-803a-bff35838784e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('790ae3d0-6f83-49ef-b9bd-504523ae1424', '2442010404', 'PRASANT', 'prasant.gla_bca24@gla.ac.in', '7060770820', 6.76, 'BCA', 'E', '2461762f-e6e8-459f-803a-bff35838784e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('fa1ca374-fc1a-421d-ba6c-4c73abcaaea9', '2442010409', 'PRASHANT SHARMA', 'prashant.sharma1_bca24@gla.ac.in', '8433419451', 6.72, 'BCA', 'E', '2461762f-e6e8-459f-803a-bff35838784e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('205f0b5c-1099-4b67-aaa1-231845180c6f', '2442010416', 'PRAVEEN KUMAR DHANGAR', 'praveen.dhangar_bca24@gla.ac.in', '8077189161', 6.9, 'BCA', 'E', 'ae7008cb-5c56-47c0-a632-bbe732e2351c', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('da74d9cc-5337-4101-a6d9-b34d1fde94b3', '2442010418', 'PRINCE', 'prince.gla_bca24@gla.ac.in', '8923886662', 6.89, 'BCA', 'E', 'ae7008cb-5c56-47c0-a632-bbe732e2351c', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('4999c123-28d6-4c7d-9ae3-d70ecff8d6fc', '2442010423', 'PRITHVI', 'prithvi.gla_bca24@gla.ac.in', '7015262679', 6.86, 'BCA', 'E', 'ae7008cb-5c56-47c0-a632-bbe732e2351c', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('1a9da069-9010-496b-9c18-6cc4be69e0af', '2442010432', 'PUNEET TYAGI', 'puneet.tyagi_bca24@gla.ac.in', '8273961618', 6.74, 'BCA', 'E', 'ae7008cb-5c56-47c0-a632-bbe732e2351c', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('00225b0f-8acc-416a-8c04-860d2008f841', '2442010437', 'RAGHAV CHAUDHARY', 'raghav.chaudhary_bca24@gla.ac.in', '8273585726', 6.69, 'BCA', 'E', 'ae7008cb-5c56-47c0-a632-bbe732e2351c', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('8212dcf9-4157-440d-8bf7-10b15cbe423c', '2442010442', 'RAHUL SHARMA', 'rahul.sharma2_bca24@gla.ac.in', '9193230539', 6.54, 'BCA', 'E', 'ae7008cb-5c56-47c0-a632-bbe732e2351c', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3b931e16-895e-45eb-93f1-f677356098d4', '2442010444', 'RAJ KUMAR', 'raj.kumar_bca24@gla.ac.in', '8755411057', 6.87, 'BCA', 'E', 'c00e6a7b-a82d-420f-a739-8603972b0277', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('45314348-cf81-40d9-b8df-89501f34cdc8', '2442010453', 'RANVEER SINGH CHAUHAN', 'ranveer.chauhan_bca24@gla.ac.in', '8532862589', 6.91, 'BCA', 'E', 'c00e6a7b-a82d-420f-a739-8603972b0277', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('0188e61e-62c0-4f06-a62e-70992f14fd46', '2442010460', 'RISHABH SINGH', 'rishabh.singh_bca24@gla.ac.in', '8534048239', 6.86, 'BCA', 'E', 'c00e6a7b-a82d-420f-a739-8603972b0277', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5f60be2c-af04-4c21-a173-7efffedb7028', '2442010466', 'ROHIT FAUJDAR', 'rohit.faujdar_bca24@gla.ac.in', '8854981183', 6.74, 'BCA', 'E', 'c00e6a7b-a82d-420f-a739-8603972b0277', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5d22a694-ec80-4aea-abd4-c958718d1e40', '2442010469', 'ROHIT QURESHI', 'rohit.qureshi_bca24@gla.ac.in', '6398228833', 6.75, 'BCA', 'E', 'c00e6a7b-a82d-420f-a739-8603972b0277', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('120d91c9-ad9f-423b-8c07-67f3a7664c9d', '2442010472', 'RUDRANSH ATYENDRA', 'rudransh.atyendra_bca24@gla.ac.in', '9193515175', 6.51, 'BCA', 'E', 'c00e6a7b-a82d-420f-a739-8603972b0277', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9588696f-f9da-4fa4-b628-e800e50ebfce', '2442010473', 'RUDRANSH SINGH', 'rudransh.singh_bca24@gla.ac.in', '9027986050', 6.68, 'BCA', 'E', '8a6d8bb0-67bd-4e26-9690-78d10c0cb2d3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9dbceeb0-8e68-45bc-8bf7-25c0589cd890', '2442010475', 'SACHIN KUMAR', 'sachin.kumar_bca24@gla.ac.in', '9006389527', 6.65, 'BCA', 'E', '8a6d8bb0-67bd-4e26-9690-78d10c0cb2d3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('b6449cca-fd41-4aff-8d31-00bbd57bb153', '2442010478', 'SAGAR CHAUDHARY', 'sagar.chaudhary_bca24@gla.ac.in', '8630945003', 6.72, 'BCA', 'E', '8a6d8bb0-67bd-4e26-9690-78d10c0cb2d3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5d382a43-9724-4139-9f92-da5ae098fb73', '2442010495', 'SARTHAK BANSAL', 'sarthak.bansal_bca24@gla.ac.in', '8218810772', 6.78, 'BCA', 'E', '8a6d8bb0-67bd-4e26-9690-78d10c0cb2d3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9230ba94-0ab2-4504-a18c-459a8939cfb0', '2442010501', 'SAURABH SHARMA', 'saurabh.sharma_bca24@gla.ac.in', '9084385638', 6.76, 'BCA', 'E', '8a6d8bb0-67bd-4e26-9690-78d10c0cb2d3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5f192e38-eb03-4817-b559-9a85655b0004', '2442010503', 'SAURAV CHAUDHARY', 'saurav.gla_bca24@gla.ac.in', '9258276327', 6.92, 'BCA', 'E', '8a6d8bb0-67bd-4e26-9690-78d10c0cb2d3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('fde8a917-c591-44cf-8cc0-916251549a0c', '2442010517', 'SHLOK VERMA', 'shlok.verma_bca24@gla.ac.in', '7417470472', 6.74, 'BCA', 'E', '3818f0a6-2440-44ad-9b86-297fd579bc70', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('101a0717-38e2-403a-b76b-bbb0b25a474b', '2442010553', 'SURYANSH NIRANJAN', 'suryansh.niranjan_bca24@gla.ac.in', '8171630731', 6.72, 'BCA', 'E', '3818f0a6-2440-44ad-9b86-297fd579bc70', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a5d90d7a-7db9-4e44-8558-5a9845c1824b', '2442010578', 'UTKARSH SINGH', 'utkarsh.singh_bca24@gla.ac.in', '8869818788', 6.72, 'BCA', 'E', '3818f0a6-2440-44ad-9b86-297fd579bc70', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('488aa8e4-2974-4ac3-9d51-1813320c2dbe', '2442010579', 'UTKARSH TOMAR', 'utkarsh.tomar_bca24@gla.ac.in', '8954363571', 6.72, 'BCA', 'E', '3818f0a6-2440-44ad-9b86-297fd579bc70', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('42bd13e0-4fa6-43a6-8db3-c76ca7b83639', '2442010582', 'VAISHNAVI SHUKLA', 'vaishnavi.shukla_bca24@gla.ac.in', '9235867297', 6.86, 'BCA', 'E', '3818f0a6-2440-44ad-9b86-297fd579bc70', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2d2119a8-65e0-42ae-8874-81683046366b', '2442010596', 'VEDANT PAREEK', 'vedant.pareek_bca24@gla.ac.in', '9456258606', 6.74, 'BCA', 'E', 'ea8fbc36-cd8f-4841-9bd1-443997bfc5fc', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('565b9a99-561b-4314-b2e1-1a7564b7516f', '2442010600', 'VIJAY', 'vijay.gla_bca24@gla.ac.in', '7668175919', 6.74, 'BCA', 'E', 'ea8fbc36-cd8f-4841-9bd1-443997bfc5fc', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2fb7a090-2109-4f47-9b28-56fa75a6f10c', '2442010605', 'VINAY TIWARI', 'vinay.tiwari_bca24@gla.ac.in', '9675456424', 6.74, 'BCA', 'E', 'ea8fbc36-cd8f-4841-9bd1-443997bfc5fc', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('faf98b8b-a853-4ee5-bc73-5cbf4f81d002', '2442010607', 'VINEET PATHAK', 'vineet.pathak_bca24@gla.ac.in', '8954565012', 6.7, 'BCA', 'E', 'ea8fbc36-cd8f-4841-9bd1-443997bfc5fc', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('dee10fc8-d41c-46bc-976f-d2ce00cb6885', '2442010629', 'YETENDRA KUMAR SHARMA', 'yetendra.sharma_bca24@gla.ac.in', '9411979131', 6.76, 'BCA', 'E', 'ea8fbc36-cd8f-4841-9bd1-443997bfc5fc', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5ae39974-fd42-4165-9a63-2f635e8b2d7d', '2442010631', 'YUVRAJ SINGH', 'yuvraj.singh_bca24@gla.ac.in', '8923539473', 6.72, 'BCA', 'E', 'ea8fbc36-cd8f-4841-9bd1-443997bfc5fc', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5a993369-22da-4c67-a2a1-a6d4c613eb86', '2442010011', 'ABHISHEK PANDEY', 'abhishek.pandey_bca24@gla.ac.in', '7037709036', 6.46, 'BCA', 'F', '086c8c77-019c-4852-b2b5-26a3217ba6a9', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9cb2db58-17cf-42fc-9677-fb7cb34857e1', '2442010013', 'ABHISHEK SHAHI', 'abhishek.shahi_bca24@gla.ac.in', '8127670426', 6.59, 'BCA', 'F', '086c8c77-019c-4852-b2b5-26a3217ba6a9', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('579cc598-3223-4f48-9cff-816f788b0b4a', '2442010032', 'AJAY KUMAR SINGH', 'ajay.singh_bca24@gla.ac.in', '8958794054', 6.56, 'BCA', 'F', '086c8c77-019c-4852-b2b5-26a3217ba6a9', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9ec0a0ef-7553-43bc-ac03-005f622d4402', '2442010036', 'AKASH GOYAL', 'akash.goyal_bca24@gla.ac.in', '8392885758', 6.61, 'BCA', 'F', '086c8c77-019c-4852-b2b5-26a3217ba6a9', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a085f3a8-bb51-4cee-98a7-94d782d5b8e8', '2442010043', 'AMAN CHAHAR', 'aman.chahar_bca24@gla.ac.in', '8279547311', 6.46, 'BCA', 'F', '086c8c77-019c-4852-b2b5-26a3217ba6a9', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('23fc2fdd-2315-4b3d-b32d-167d414cd508', '2442010048', 'AMAN YADAV', 'aman.yadav_bca24@gla.ac.in', '7417775111', 6.53, 'BCA', 'F', '086c8c77-019c-4852-b2b5-26a3217ba6a9', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('68c28d2c-d34a-420c-bce2-8d33fc1dfc55', '2442010063', 'ANKIT CHAUHAN', 'ankit.chauhan_bca24@gla.ac.in', '9259353926', 6.51, 'BCA', 'F', '92b987e4-3c93-467d-b948-8f4e3b9b1d74', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a2f2da50-4fe3-47bb-9317-f937dfc20f5b', '2442010075', 'ANSHU DUBEY', 'anshu.dubey_bca24@gla.ac.in', '9760292978', 6.48, 'BCA', 'F', '92b987e4-3c93-467d-b948-8f4e3b9b1d74', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('8ded2535-46c9-4b35-b140-ba791a0eb97d', '2442010102', 'ARPIT PATHAK', 'arpit.pathak_bca24@gla.ac.in', '8218303474', 6.51, 'BCA', 'F', '92b987e4-3c93-467d-b948-8f4e3b9b1d74', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2b612f4a-82ca-405d-87b7-b58f77442959', '2442010111', 'ASHI PARUA', 'ashi.parua_bca24@gla.ac.in', '9259411569', 6.6, 'BCA', 'F', '92b987e4-3c93-467d-b948-8f4e3b9b1d74', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ce583849-133a-412d-bd49-379f38ff15d7', '2442010115', 'ASHUTOSH KUMAR SINGH', 'ashutosh.singh_bca24@gla.ac.in', '7739799170', 6.56, 'BCA', 'F', '92b987e4-3c93-467d-b948-8f4e3b9b1d74', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('28f5e565-bf0f-454e-a9e2-5adc5a644490', '2442010120', 'ATHARV VERMA', 'atharv.verma_bca24@gla.ac.in', '8439451238', 6.52, 'BCA', 'F', '92b987e4-3c93-467d-b948-8f4e3b9b1d74', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('6669cc7d-1c2a-4e92-9f5e-e0da5978c637', '2442010140', 'BHEESHM DEV GAUTAM', 'bheeshm.gautam_bca24@gla.ac.in', '8534002326', 6.6, 'BCA', 'F', 'dce2d59c-7042-4d79-ba8f-ad0236b74d19', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('df8f3697-243f-45fb-8010-5ffa2e7fb36a', '2442010143', 'BHUMIKA CHAUDHARY', 'bhumika.chaudhary_bca24@gla.ac.in', '8923776692', 6.52, 'BCA', 'F', 'dce2d59c-7042-4d79-ba8f-ad0236b74d19', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('10a239e5-2df4-4e90-9092-e8b8b13d0805', '2442010144', 'BHUMIKA PAL', 'bhumika.pal_bca24@gla.ac.in', '7753051975', 6.55, 'BCA', 'F', 'dce2d59c-7042-4d79-ba8f-ad0236b74d19', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('77acc217-955d-455e-af60-9e290b31b851', '2442010156', 'CHETANYA KUMAR', 'chetanya.kumar_bca24@gla.ac.in', '8273636942', 6.68, 'BCA', 'F', 'dce2d59c-7042-4d79-ba8f-ad0236b74d19', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('74689508-8a57-41fe-8544-198336e54ddd', '2442010159', 'CHINTU', 'chintu.gla_bca24@gla.ac.in', '9466159768', 6.58, 'BCA', 'F', 'dce2d59c-7042-4d79-ba8f-ad0236b74d19', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('63090946-0574-4afa-9f77-e3f3d0280296', '2442010177', 'DEEPU SINGH', 'deepu.singh_bca24@gla.ac.in', '8859257350', 6.35, 'BCA', 'F', 'dce2d59c-7042-4d79-ba8f-ad0236b74d19', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('6747f4b9-d455-45c2-997c-22aca47c1a04', '2442010182', 'DEVANSH DIXIT', 'devansh.dixit_bca24@gla.ac.in', '9719308645', 6.48, 'BCA', 'F', 'bcf839c4-7fc1-48a6-8704-e974c170f26a', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5b6dc4e8-1358-4693-b44b-c99ca4f54a98', '2442010197', 'DIVYANSH', 'divyansh.gla_bca24@gla.ac.in', '9518161110', 6.59, 'BCA', 'F', 'bcf839c4-7fc1-48a6-8704-e974c170f26a', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a560792f-6846-43f5-82d8-eaaad3ae5a11', '2442010201', 'DIVYANSHU YADAV', 'divyanshu.yadav2_bba24@gla.ac.in', '7310966915', 6.63, 'BCA', 'F', 'bcf839c4-7fc1-48a6-8704-e974c170f26a', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ae9db048-505b-4afc-8fc7-79f52437a8f3', '2442010215', 'GAURAV SHARMA', 'gaurav.sharma_bca24@gla.ac.in', '6396940098', 6.44, 'BCA', 'F', 'bcf839c4-7fc1-48a6-8704-e974c170f26a', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('b29a5a89-5c35-486d-9445-155d5a4113d7', '2442010633', 'HARISH KUMAR', 'harish.kumar_bca24@gla.ac.in', '8302969313', 6.65, 'BCA', 'F', 'bcf839c4-7fc1-48a6-8704-e974c170f26a', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('aa688224-a108-44b2-871d-f25369b7e22a', '2442010250', 'JITENDRA KUMAR', 'jitendra.kumar_bca24@gla.ac.in', '8533001841', 6.57, 'BCA', 'F', 'bcf839c4-7fc1-48a6-8704-e974c170f26a', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('7efcd5c2-3c98-41ca-82c1-91d2bca98994', '2442010253', 'KANHA', 'kanha.gla_bca24@gla.ac.in', '8449748784', 6.55, 'BCA', 'F', 'adc874de-622a-4a45-a264-682eea85ca8a', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('caf2c676-6b4c-4f84-bea1-ab7f890d50be', '2442010256', 'KANHA SINGH', 'kanha.singh2_bca24@gla.ac.in', '8979266819', 6.5, 'BCA', 'F', 'adc874de-622a-4a45-a264-682eea85ca8a', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('539c4a1b-be76-4276-ad9c-bb5ff1a7be90', '2442010257', 'KAPIL PACHAURI', 'kapil.pachauri_bca24@gla.ac.in', '8218611269', 6.51, 'BCA', 'F', 'adc874de-622a-4a45-a264-682eea85ca8a', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f3bd9be5-65a9-4e84-a0bd-cd5c6b05d657', '2442010271', 'KESHAV SHARMA', 'keshav.sharma_bca24@gla.ac.in', '7983253240', 6.45, 'BCA', 'F', 'adc874de-622a-4a45-a264-682eea85ca8a', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c1468c24-6c34-4419-95c2-850d3eebbae6', '2442010283', 'KRISHNA CHAUDHARY', 'krishna.chaudhary3_bca24@gla.ac.in', '8979713440', 6.58, 'BCA', 'F', 'adc874de-622a-4a45-a264-682eea85ca8a', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('59fe90fa-1cc9-4bbe-b3dc-1156558b0eb9', '2442010289', 'KRISHNA TIWARI', 'krishna.tiwari_bca24@gla.ac.in', '7088525719', 6.44, 'BCA', 'F', 'adc874de-622a-4a45-a264-682eea85ca8a', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c95dd49f-b7b0-4a96-873e-56991c1192f9', '2442010292', 'KRITIKA CHAUDHARY', 'kritika.chaudhary_bca24@gla.ac.in', '8210273257', 6.47, 'BCA', 'F', '15d11301-4663-4657-8754-c677dd5e90ad', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('303404b1-10ee-40cf-af4c-c7e5300a6013', '2442010299', 'LALIT CHAUDHARY', 'lalit.chaudhary_bca24@gla.ac.in', '8979703142', 6.53, 'BCA', 'F', '15d11301-4663-4657-8754-c677dd5e90ad', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('1867acc2-ae12-4277-a151-f4b58503f767', '2442010303', 'LAXMI KUMARI', 'laxmi.kumari_bca24@gla.ac.in', '8266978328', 6.64, 'BCA', 'F', '15d11301-4663-4657-8754-c677dd5e90ad', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d1776738-3207-43de-b9ab-7a48d1c07114', '2442010304', 'LOKESH KUMAR PANDEY', 'lokesh.pandey_bca24@gla.ac.in', '9568668937', 6.48, 'BCA', 'F', '15d11301-4663-4657-8754-c677dd5e90ad', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5192fa16-0d0a-4efc-a5ff-85b37f11aa04', '2442010314', 'MANISH KUMAR', 'manish.kumar2_bca24@gla.ac.in', '9536323305', 6.6, 'BCA', 'F', '15d11301-4663-4657-8754-c677dd5e90ad', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c8c306a9-3d80-40cb-8aac-cbf69d2a87e3', '2442010318', 'MANMOHAN', 'manmohan.gla_bca24@gla.ac.in', '9810834072', 6.61, 'BCA', 'F', '15d11301-4663-4657-8754-c677dd5e90ad', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5479d530-faa0-429f-9ba4-372b88db27d4', '2442010346', 'MUSKAN SHARMA', 'muskan.sharma_bca24@gla.ac.in', '9414902702', 6.52, 'BCA', 'F', 'fc37ff5e-97c9-4c66-abde-780a1bc346eb', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('40b56ae3-44cd-4d39-a466-6be016d4bf1f', '2442010367', 'NIKHIL', 'nikhil.shukla_bca24@gla.ac.in', '9568701943', 6.5, 'BCA', 'F', 'fc37ff5e-97c9-4c66-abde-780a1bc346eb', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c0b118f7-3d10-4dff-9097-2d3dceeb9889', '2442010368', 'NIKKEE KUMARI', 'nikkee.kumari_bca24@gla.ac.in', '9759923493', 6.54, 'BCA', 'F', 'fc37ff5e-97c9-4c66-abde-780a1bc346eb', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('82077752-fc60-4200-8e4e-c4b9e9b56a1f', '2442010375', 'OM GARG', 'om.garg_bca24@gla.ac.in', '7060473497', 6.42, 'BCA', 'F', 'fc37ff5e-97c9-4c66-abde-780a1bc346eb', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a2abf0e4-5adf-47c8-a762-7ea11fbffd5b', '2442010396', 'PRACHI MADAAN', 'prachi.madaan_bca24@gla.ac.in', '9358439962', 6.43, 'BCA', 'F', 'fc37ff5e-97c9-4c66-abde-780a1bc346eb', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('1acfcd85-1798-4cbe-bb68-b6b7cbcf811f', '2442010412', 'PRATEEK YADAV', 'prateek.yadav_bca24@gla.ac.in', '8273733560', 6.52, 'BCA', 'F', 'fc37ff5e-97c9-4c66-abde-780a1bc346eb', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d242dccd-5bef-417d-8728-5d4a93b194c8', '2442010413', 'PRATHAM DUBEY', 'pratham.dubey_bca24@gla.ac.in', '8979928667', 6.67, 'BCA', 'F', '5789eef2-a6c1-4068-ba06-c335193164ed', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('fc615bb3-288a-46f8-8106-e7f12f282b71', '2442010424', 'PRIYAM SHARMA', 'priyam.sharma_bca24@gla.ac.in', '7618123982', 6.45, 'BCA', 'F', '5789eef2-a6c1-4068-ba06-c335193164ed', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('75ae8bec-1689-47f5-8e56-3b264e8a519e', '2442010436', 'RADHIKA DIXIT', 'radhika.dixit_bca24@gla.ac.in', '8218863960', 6.67, 'BCA', 'F', '5789eef2-a6c1-4068-ba06-c335193164ed', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f74f2507-b68f-4e3a-9a9e-8dce2e3f3989', '2442010445', 'RAJ SHARMA', 'raj.sharma_bca24@gla.ac.in', '8859671125', 6.67, 'BCA', 'F', '5789eef2-a6c1-4068-ba06-c335193164ed', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('eaa4496e-4075-4b07-b8a7-48fd4d52b6f2', '2442010451', 'RAM CHANDRA SAINI', 'ram.saini_bca24@gla.ac.in', '9548887183', 6.64, 'BCA', 'F', '5789eef2-a6c1-4068-ba06-c335193164ed', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2f066e91-9aa6-45c6-abe0-41635a6d1540', '2442010463', 'RITIK KUMAR GUPTA', 'ritik.gupta_bca24@gla.ac.in', '9026180310', 6.34, 'BCA', 'F', '5789eef2-a6c1-4068-ba06-c335193164ed', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('09b3fc58-f584-4cf1-bb3e-1fce907ea651', '2442010467', 'ROHIT KUMAR', 'rohit.kumar_bca24@gla.ac.in', '9536852370', 6.64, 'BCA', 'F', '8dc5a604-7d0f-4891-87f9-649f8ad8fbfd', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d67b474b-b5f4-4742-8f4d-d206e0096cdf', '2442010470', 'ROHIT SAINI', 'rohit.saini_bca24@gla.ac.in', '8923086934', 6.6, 'BCA', 'F', '8dc5a604-7d0f-4891-87f9-649f8ad8fbfd', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('22eef82f-0a02-4932-ac7f-f24948dbe2c5', '2442010479', 'SAGAR LOHKNA', 'sagar.lohkna_bca24@gla.ac.in', '8979581360', 6.58, 'BCA', 'F', '8dc5a604-7d0f-4891-87f9-649f8ad8fbfd', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a5dce1be-98cb-4b23-acc2-68cb77e50462', '2442010484', 'SAILENDER KUMAR', 'sailender.kumar_bca24@gla.ac.in', '9548722997', 6.63, 'BCA', 'F', '8dc5a604-7d0f-4891-87f9-649f8ad8fbfd', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ea8f8724-d22b-459b-84c8-2c2b34a7990c', '2442010498', 'SATYAM CHOUDHARY', 'satyam.chaudhary_bca24@gla.ac.in', '9068509621', 6.49, 'BCA', 'F', '8dc5a604-7d0f-4891-87f9-649f8ad8fbfd', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('112cc1ed-5389-465e-a729-35290d9cdb4c', '2442010516', 'SHIVKUMAR', 'shivkumar.gla_bca24@gla.ac.in', '7500870450', 6.59, 'BCA', 'F', '8dc5a604-7d0f-4891-87f9-649f8ad8fbfd', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e48acf6d-387b-4b4d-a8f3-2813d3ec4f4f', '2442010522', 'SHREYA SHARMA', 'shreya.sharma_bca24@gla.ac.in', '9758215848', 6.46, 'BCA', 'F', '10047672-9353-48f2-888a-fe80f7441424', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('36fc3c1a-4d44-4086-8c42-c1e9f70af1db', '2442010523', 'SHREYA SHUKLA', 'shreya.shukla_bca24@gla.ac.in', '9837427632', 6.59, 'BCA', 'F', '10047672-9353-48f2-888a-fe80f7441424', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d011104c-9f42-4993-a18a-6d8a8262a825', '2442010528', 'SHUBHAM SAINI', 'shubham.saini_bca24@gla.ac.in', '9027843577', 6.49, 'BCA', 'F', '10047672-9353-48f2-888a-fe80f7441424', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('67eeab91-bd71-4695-8c38-1567c945cecd', '2442010529', 'SHUBHAM SARASWAT', 'shubham.saraswat_bca24@gla.ac.in', '8650257344', 6.6, 'BCA', 'F', '10047672-9353-48f2-888a-fe80f7441424', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('225da697-5a24-4348-8458-4b47bcbd9bf1', '2442010530', 'SHUBHAM TYAGI', 'shubham.tyagi_bca24@gla.ac.in', '6396350342', 6.54, 'BCA', 'F', '10047672-9353-48f2-888a-fe80f7441424', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('26b842d7-4e28-4948-ba64-a0e36ef2a204', '2442010532', 'SHYAM SUNDAR', 'shyam.sunder2_bca24@gla.ac.in', '8979771913', 6.48, 'BCA', 'F', '10047672-9353-48f2-888a-fe80f7441424', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2b6d7b4f-54c7-488e-bbd7-08166d25bd07', '2442010536', 'SONU SINGH', 'sonu.singh_bca24@gla.ac.in', '7819828645', 6.51, 'BCA', 'F', 'c1761ebb-f23d-49bb-8c3a-74d159800656', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('520efb6a-4f14-4ddf-afc1-b5b753cc8994', '2442010539', 'SUDHANSHU MADHUR', 'sudhanshu.madhur_bca24@gla.ac.in', '9027336337', 6.63, 'BCA', 'F', 'c1761ebb-f23d-49bb-8c3a-74d159800656', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('49679ac9-18bf-44b5-b98f-1a30ba745a33', '2442010542', 'SUMIT', 'sumit.gla_bca24@gla.ac.in', '8923021781', 6.45, 'BCA', 'F', 'c1761ebb-f23d-49bb-8c3a-74d159800656', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('368230e9-c3d5-4a7c-a6b7-7a9822a2d409', '2442010565', 'TIYA MAHESHWARI', 'tiya.maheshwari_bca24@gla.ac.in', '9311404660', 6.3, 'BCA', 'F', 'c1761ebb-f23d-49bb-8c3a-74d159800656', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ec690d4a-d0fd-4296-9b4d-0df8bcd398fa', '2442010572', 'UDAY SONI', 'uday.soni_bca24@gla.ac.in', '8868098394', 6.56, 'BCA', 'F', 'c1761ebb-f23d-49bb-8c3a-74d159800656', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ea976d26-2dd7-4585-87cc-47b706408c9d', '2442010590', 'VANSH YADAV', 'vansh.yadav_bca24@gla.ac.in', '9258775884', 6.48, 'BCA', 'F', 'e51ece16-a96c-43ec-8031-822064ea3fa2', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a05f24e8-ca6c-455a-a2aa-96fb00b4a8a3', '2442010598', 'VIDHI KUMARI', 'vidhi.kumari_bca24@gla.ac.in', '8439867269', 6.66, 'BCA', 'F', 'e51ece16-a96c-43ec-8031-822064ea3fa2', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f076cf66-e383-4095-bedf-47c7ddf1bc62', '2442010610', 'VIRAT SISODIA', 'virat.sisodia_bca24@gla.ac.in', '8126021878', 6.46, 'BCA', 'F', 'e51ece16-a96c-43ec-8031-822064ea3fa2', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a484ba98-6b2b-4aa7-af6b-757ef65832a8', '2442010611', 'VISHAL AGRAWAL', 'vishal.agrawal_bca24@gla.ac.in', '7078288921', 6.6, 'BCA', 'F', 'e51ece16-a96c-43ec-8031-822064ea3fa2', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ace7bdb6-66b1-4ad3-b22f-8eaba8ba6324', '2442010618', 'VIVEK KUMAR', 'vivek.kumar_bca24@gla.ac.in', '6397703542', 6.6, 'BCA', 'F', 'e51ece16-a96c-43ec-8031-822064ea3fa2', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('132195e0-0d67-4c74-ab46-6c2f986e6485', '2442010620', 'VIVEK TYAGI', 'vivek.tyagi_bca24@gla.ac.in', '8529636242', 6.42, 'BCA', 'F', 'e51ece16-a96c-43ec-8031-822064ea3fa2', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3ec7d666-bc07-418a-9eca-adac48b50317', '2442010023', 'ADITYA GAUTAM', 'aditya.gautam_bca24@gla.ac.in', '9012611415', 6.16, 'BCA', 'G', '81248233-340d-45b6-ae88-b390669fb399', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('23c898ad-ca1b-423b-853a-9ade51d63320', '2442010037', 'AKASH KUMAR SINGH', 'akash.singh_bca24@gla.ac.in', '8445858572', 6.43, 'BCA', 'G', '81248233-340d-45b6-ae88-b390669fb399', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('32316c52-33f9-4b18-9795-007b2a698fa3', '2442010057', 'ANANDKUMAR', 'anandkumar.gla_bca24@gla.ac.in', '7480093401', 6.18, 'BCA', 'G', '81248233-340d-45b6-ae88-b390669fb399', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2e4c7b5f-75ae-4edd-ab3d-bb15f977ff5d', '2442010060', 'ANKIT', 'ankit.gla_bca24@gla.ac.in', '9350670308', 6.25, 'BCA', 'G', '81248233-340d-45b6-ae88-b390669fb399', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('b4478f17-0030-4743-8f98-30e0ce0d01f9', '2442010061', 'ANKIT CHAUDHARY', 'ankit.chaudhary1_bca24@gla.ac.in', '8979301274', 6.28, 'BCA', 'G', '81248233-340d-45b6-ae88-b390669fb399', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d4024850-36d3-44b0-954a-7dc3965ebc6b', '2442010078', 'ANSHUL TIWARI', 'anshul.tiwari_bca24@gla.ac.in', '7078370135', 6.41, 'BCA', 'G', '81248233-340d-45b6-ae88-b390669fb399', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('07fd6b6e-4fb7-4417-af37-822c22a32b22', '2442010398', 'PRAGYA GUPTA', 'pragya.gupta_bca24@gla.ac.in', '9580397525', 6.19, 'BCA', 'G', '0a4a7a0f-97aa-4e9a-ac1e-8187f43b1619', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('b3e8f731-b13e-4fae-816a-48dc7ac402bb', '2442010107', 'ARYA GUPTA', 'arya.gupta_bca24@gla.ac.in', '7818904938', 6.32, 'BCA', 'G', '0a4a7a0f-97aa-4e9a-ac1e-8187f43b1619', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ad92c86a-6aef-4a41-b594-dc5038db9cfe', '2442010506', 'SHAMBHAVI GUPTA', 'shambhavi.gupta_bca24@gla.ac.in', '8273698307', 6.39, 'BCA', 'G', '0a4a7a0f-97aa-4e9a-ac1e-8187f43b1619', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('362e5341-a2d4-48d2-ac79-fbcff9c04fe0', '2442010269', 'KESHAV GOSWAMI', 'keshav.goswami_bca24@gla.ac.in', '6398280238', 6.16, 'BCA', 'G', '0a4a7a0f-97aa-4e9a-ac1e-8187f43b1619', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e75ec7ba-44e9-4dae-a729-3516185b63ff', '2442010196', 'DIVYAM KULSHRESHTHA', 'divyam.kulshreshtha_bca24@gla.ac.in', '9411443245', 6.38, 'BCA', 'G', '0a4a7a0f-97aa-4e9a-ac1e-8187f43b1619', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3c3832e9-a31e-4546-bffb-60932130673c', '2442010132', 'BARSHA', 'barsha.gla_bca24@gla.ac.in', '9457807475', 6.35, 'BCA', 'G', '0a4a7a0f-97aa-4e9a-ac1e-8187f43b1619', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('adea5a6a-8f00-4dbe-8109-de37f623e378', '2442010179', 'DEV PRAKHAR', 'dev.prakhar_bca24@gla.ac.in', '9793476189', 6.07, 'BCA', 'G', '86da68a1-4a2c-4812-aa1b-53aabf32d2bd', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d1f7ad08-cea9-4f06-a06f-da089c64a703', '2442010105', 'ARUN KUMAR', 'arun.kumar_bca24@gla.ac.in', '8445814440', 6.22, 'BCA', 'G', '86da68a1-4a2c-4812-aa1b-53aabf32d2bd', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('bd671013-13b7-4583-98b4-cfa9035dd70d', '2442010200', 'DIVYANSHU KUMAR', 'divyanshu.kumar_bca24@gla.ac.in', '8755309604', 6.29, 'BCA', 'G', '86da68a1-4a2c-4812-aa1b-53aabf32d2bd', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d3db5beb-8b82-45b4-aeb8-c3ca1c7dde10', '2442010202', 'DULESHWAR SAHU', 'duleshwar.sahu_bca24@gla.ac.in', '7535024113', 6.29, 'BCA', 'G', '86da68a1-4a2c-4812-aa1b-53aabf32d2bd', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('df18a0c3-91f8-41e1-a909-1de487a75825', '2442010211', 'GAURAV', 'gaurav.gla_bca24@gla.ac.in', '9216140021', 6.33, 'BCA', 'G', '86da68a1-4a2c-4812-aa1b-53aabf32d2bd', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('fd85cd62-02c2-4bdd-a1c9-55434c4e495d', '2442010221', 'GOPAL BHARDWAJ', 'gopal.bhardwaj_bca24@gla.ac.in', '8273953524', 6.32, 'BCA', 'G', '86da68a1-4a2c-4812-aa1b-53aabf32d2bd', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('8622fa66-048a-4953-8287-bcd6df77295f', '2442010229', 'HARENDRA SINGH', 'harendra.singh_bca24@gla.ac.in', '8218263652', 6.33, 'BCA', 'G', 'be6729a6-d5b3-4006-b04d-f2c676d52234', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('cf96cc7c-16fa-4fda-8f81-93ca6d2c3aaf', '2442010230', 'HARSH', 'harsh.gla2_bca24@gla.ac.in', '7895831125', 6.33, 'BCA', 'G', 'be6729a6-d5b3-4006-b04d-f2c676d52234', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('98685eec-c513-4bc5-ab09-4c1dedebb523', '2442010232', 'HARSH', 'harsh.gla_bca24@gla.ac.in', '9817078787', 6.14, 'BCA', 'G', 'be6729a6-d5b3-4006-b04d-f2c676d52234', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('dfd3218a-1424-45b9-a625-5d7eb366a557', '2442010245', 'HRITIK RANJAN', 'hritik.ranjan_bca24@gla.ac.in', '7858979758', 6.37, 'BCA', 'G', 'be6729a6-d5b3-4006-b04d-f2c676d52234', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('87023c12-6e0e-4613-993f-ee3dceb00251', '2442010260', 'KARAN KUSHWAH', 'karan.kushwah_bca24@gla.ac.in', '8057585000', 6.2, 'BCA', 'G', 'be6729a6-d5b3-4006-b04d-f2c676d52234', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('0ffe023b-0266-4f9a-9639-95e82085ee0b', '2442010265', 'KAUSHAL KUMAR', 'kaushal.kumar_bca24@gla.ac.in', '7906808345', 6.29, 'BCA', 'G', 'be6729a6-d5b3-4006-b04d-f2c676d52234', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('8b1d3607-6240-459f-8a34-42c69329e7c5', '2442010108', 'ARYAN KUMAR', 'aryan.kumar_bca24@gla.ac.in', '9142969698', 6.31, 'BCA', 'G', '25456790-d9ae-462e-946f-8470087e2786', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5d420832-a2c0-4d16-a78a-46d2ea565d4a', '2442010280', 'KRISHNA', 'krishna.gla1_bca24@gla.ac.in', '9258094460', 6.43, 'BCA', 'G', '25456790-d9ae-462e-946f-8470087e2786', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e73db955-13d8-4334-be18-31945bb53d84', '2442010293', 'KULDEEP', 'kuldeep.gla_bca24@gla.ac.in', '9389356568', 6.38, 'BCA', 'G', '25456790-d9ae-462e-946f-8470087e2786', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e4647619-5cfa-4b18-9e23-08d7106026fd', '2442010297', 'KUSH GAUTAM', 'kush.gautam_bca24@gla.ac.in', '6395748673', 6.38, 'BCA', 'G', '25456790-d9ae-462e-946f-8470087e2786', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('00c5bf37-e715-48b6-980f-d0bc56562f4d', '2442010298', 'KUSHAGRA TIWARI', 'kushagra.tiwari_bca24@gla.ac.in', '9557920062', 6.21, 'BCA', 'G', '25456790-d9ae-462e-946f-8470087e2786', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('cead54a0-26e9-4564-b7fe-f70d300d4432', '2442010305', 'LOVE GAUTAM', 'love.gautam_bca24@gla.ac.in', '7310662832', 6.33, 'BCA', 'G', '25456790-d9ae-462e-946f-8470087e2786', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f8bd733c-334f-4dde-86e7-29fa5c03e6c6', '2442010309', 'MADHAV GOSWAMI', 'madhav.goswami_bca24@gla.ac.in', '8791758671', 6.28, 'BCA', 'G', 'b382134a-a7b6-437a-b3c9-0e6976b1c38f', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('df1cce06-e341-4907-a8e6-5bb90c97ad83', '2442010326', 'MAYANK PACHAURI', 'mayank.pachauri_bca24@gla.ac.in', '8755080852', 6.33, 'BCA', 'G', 'b382134a-a7b6-437a-b3c9-0e6976b1c38f', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f529cf4b-341a-4995-af67-ce71a17e8de1', '2442010335', 'MOHAN SHYAM', 'mohan.shyam_bca24@gla.ac.in', '8057956774', 6.29, 'BCA', 'G', 'b382134a-a7b6-437a-b3c9-0e6976b1c38f', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('dc68717e-85bc-47ab-b0c0-14f8d2bbfc3c', '2442010336', 'MOHAN SHYAM SISODIA', 'mohan.sisodia_bca24@gla.ac.in', '8057307456', 6.47, 'BCA', 'G', 'b382134a-a7b6-437a-b3c9-0e6976b1c38f', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3ce5fe2f-5b78-4882-a84a-4326b6565a86', '2442010341', 'MOHIT KUMAR', 'mohit.kumar_bca24@gla.ac.in', '7310575708', 6.4, 'BCA', 'G', 'b382134a-a7b6-437a-b3c9-0e6976b1c38f', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c0a2e6c2-cf15-4105-9ecc-0848eb62e4df', '2442010363', 'NIKHIL GOSWAMI', 'nikhil.goswami_bca24@gla.ac.in', '6398446939', 6.36, 'BCA', 'G', 'b382134a-a7b6-437a-b3c9-0e6976b1c38f', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3645baaf-d615-4d54-8e9b-b3126380b5cf', '2442010365', 'NIKHIL RAWAT', 'nikhil.rawat_bca24@gla.ac.in', '7451066685', 6.47, 'BCA', 'G', '87f135a2-7d08-4038-93e7-b9e02e7c7fdf', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e2f1a4f9-a1b7-4238-a12d-c0907259ff69', '2442010376', 'OM PRAKASH DIXIT', 'om.dixit_bca24@gla.ac.in', '9548678822', 6.42, 'BCA', 'G', '87f135a2-7d08-4038-93e7-b9e02e7c7fdf', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e2d1430b-6d86-4802-824a-e544749e60a1', '2442010378', 'PAARTH BHARDWAJ', 'paarth.bhardwaj_bca24@gla.ac.in', '8791500870', 6.31, 'BCA', 'G', '87f135a2-7d08-4038-93e7-b9e02e7c7fdf', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('1798fe64-fa04-4950-82cf-fe3ddbce5c97', '2442010384', 'PAWAN JOSHI', 'pawan.joshi_bca24@gla.ac.in', '7302692840', 6.09, 'BCA', 'G', '87f135a2-7d08-4038-93e7-b9e02e7c7fdf', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('249c5cf6-e863-4c0f-bac8-6f59a0cdaa24', '2442010388', 'PIYUSH', 'piyush.gla_bca24@gla.ac.in', '9992178457', 6.26, 'BCA', 'G', '87f135a2-7d08-4038-93e7-b9e02e7c7fdf', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3c2b97eb-f026-45ce-824c-41ea921a836f', '2442010390', 'PIYUSH SHARMA', 'piyush.sharma_bca24@gla.ac.in', '7217231252', 6.37, 'BCA', 'G', '87f135a2-7d08-4038-93e7-b9e02e7c7fdf', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('7c12a9f2-b2a4-4ace-ade7-911e6a495eb1', '2442010146', 'BISHU SINGH', 'bishu.singh_bca24@gla.ac.in', '8935909260', 6.4, 'BCA', 'G', 'cf3a8249-2b68-49ab-8237-8644f8358d58', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('8f367180-8c3e-4202-9f7f-309d579a3f0b', '2442010399', 'PRAKHAR SHARMA', 'prakhar.sharma_bca24@gla.ac.in', '9555245828', 6.21, 'BCA', 'G', 'cf3a8249-2b68-49ab-8237-8644f8358d58', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('cffff316-875b-466f-8307-de93fd8ed93f', '2442010406', 'PRASHANT', 'prashant.gla_bca24@gla.ac.in', '9149265813', 6.29, 'BCA', 'G', 'cf3a8249-2b68-49ab-8237-8644f8358d58', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f8551a00-9ce8-46a1-859d-227679bf442a', '2442010410', 'PRASHANT SHARMA', 'prashant.sharma_bca24@gla.ac.in', '6398669945', 6.32, 'BCA', 'G', 'cf3a8249-2b68-49ab-8237-8644f8358d58', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('80dd2e09-40ef-44b0-863b-fb5d30df2302', '2442010411', 'PRASHANT UPADHYAY', 'prashant.upadhyay_bca24@gla.ac.in', '7457805125', 6.29, 'BCA', 'G', 'cf3a8249-2b68-49ab-8237-8644f8358d58', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('50de0eb3-70fd-4e3c-82d9-e83416ff42b8', '2442010417', 'PRAVESH', 'pravesh.gla_bca24@gla.ac.in', '7818828743', 6.19, 'BCA', 'G', 'cf3a8249-2b68-49ab-8237-8644f8358d58', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('bca3263a-86c6-472d-8b81-a4ab9b5cf75b', '2442010419', 'PRINCE BENIWAL', 'prince.beniwal_bca24@gla.ac.in', '7017445787', 6.16, 'BCA', 'G', '2be2913c-3f72-45d8-9e02-2adde06355c0', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ff1c9e8d-21de-4010-88d5-645476ca17f4', '2442010429', 'PRIYANSHU', 'priyanshu.dubey_bca24@gla.ac.in', '9058820827', 6.45, 'BCA', 'G', '2be2913c-3f72-45d8-9e02-2adde06355c0', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('151a1eab-f21d-4db6-a784-1dda53cb5c4a', '2442010443', 'RAHUL SINGH', 'rahul.singh_bca24@gla.ac.in', '8193944187', 6.36, 'BCA', 'G', '2be2913c-3f72-45d8-9e02-2adde06355c0', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e9490082-5a22-4f88-bb36-62e57e55a7e0', '2442010456', 'RAVIKANT', 'ravikant.gla_bca24@gla.ac.in', '8534818557', 6.14, 'BCA', 'G', '2be2913c-3f72-45d8-9e02-2adde06355c0', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('1c1232a7-e808-43b5-b238-95f829d687c7', '2442010457', 'RAVIRANJAN KUMAR SINGH', 'raviranjan.singh_bca24@gla.ac.in', '8271986996', 6.4, 'BCA', 'G', '2be2913c-3f72-45d8-9e02-2adde06355c0', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('345830b1-c2f7-4ee2-92a3-0f16db5d1319', '2442010468', 'ROHIT MALAN', 'rohit.malan_bca24@gla.ac.in', '8191047739', 6.35, 'BCA', 'G', '2be2913c-3f72-45d8-9e02-2adde06355c0', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('766650ae-115c-47b9-979f-af8728977959', '2442010474', 'SACHIN', 'sachin.gla_bca24@gla.ac.in', '9808377637', 6.22, 'BCA', 'G', '0fb2a185-9d85-48f9-8509-5ace1fd67e96', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5990e6dd-5eda-4001-8d84-ec002acde9b4', '2442010476', 'SAGAR', 'sagar.gla_bca24@gla.ac.in', '8630404825', 6.25, 'BCA', 'G', '0fb2a185-9d85-48f9-8509-5ace1fd67e96', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('15cecf7a-6020-4ca0-b4d7-0e0502402923', '2442010482', 'SAHIL', 'sahil.gla2_bca24@gla.ac.in', '7424984922', 6.39, 'BCA', 'G', '0fb2a185-9d85-48f9-8509-5ace1fd67e96', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('778111ad-343b-4fed-97a6-a88beac70b28', '2442010489', 'SANDEEP DIXIT', 'sandeep.dixit_bca24@gla.ac.in', '7505891659', 6.17, 'BCA', 'G', '0fb2a185-9d85-48f9-8509-5ace1fd67e96', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('38b4b37a-2a9d-4419-9dde-73c864cbc54b', '2442010147', 'BRAJESH KUMAR', 'brajesh.kumar_bca24@gla.ac.in', '8273477983', 6.34, 'BCA', 'G', '0fb2a185-9d85-48f9-8509-5ace1fd67e96', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f2437427-1da2-4b33-8fe4-c789ea2f0f32', '2442010508', 'SHASHANK KUMAR JHA', 'shashank.jha_bca24@gla.ac.in', '9334614215', 6.32, 'BCA', 'G', '0fb2a185-9d85-48f9-8509-5ace1fd67e96', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('7f1131d4-3faa-4236-80ab-a5160f6d8395', '2442010510', 'SHIVAM KUMAR', 'shivam.kumar1_bca24@gla.ac.in', '8445341131', 6.38, 'BCA', 'G', 'f5c2810f-1414-44c2-ab1a-7033bd0ffb2d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('0ec5d088-6292-4cd8-b768-6172ee97963e', '2442010534', 'SIKANDAR RATHORE', 'sikandar.rathore_bca24@gla.ac.in', '8923015843', 6.27, 'BCA', 'G', 'f5c2810f-1414-44c2-ab1a-7033bd0ffb2d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('cf01c1dd-e781-42da-86fe-7de32e29b35f', '2442010569', 'TUSHAR GAUTAM', 'tushar.gautam_bca24@gla.ac.in', '7505860335', 6.35, 'BCA', 'G', 'f5c2810f-1414-44c2-ab1a-7033bd0ffb2d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('42f9dd1c-c1cb-450a-8ced-504b28a4cf35', '2442010570', 'TUSHAR GUPTA', 'tushar.gupta_bca24@gla.ac.in', '7452036956', 6.34, 'BCA', 'G', 'f5c2810f-1414-44c2-ab1a-7033bd0ffb2d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a8d9b500-add7-4daf-8f0a-5d1aed4429ee', '2442010571', 'UDAY SHARMA', 'uday.sharma_bca24@gla.ac.in', '7906458486', 6.24, 'BCA', 'G', 'f5c2810f-1414-44c2-ab1a-7033bd0ffb2d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c535e454-725a-49c1-8daa-0f453eed9ca8', '2442010609', 'VIPIN SINGH', 'vipin.singh_bca24@gla.ac.in', '7453023454', 6.32, 'BCA', 'G', 'a428e5ed-2f7f-4b0f-9db1-3d55e54b96ac', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e1fd7d24-5fd0-465a-ac3a-3ba35aa8c9a7', '2442010616', 'VISHAL THAKUR', 'vishal.thakur_bca24@gla.ac.in', '7302914156', 6.19, 'BCA', 'G', 'a428e5ed-2f7f-4b0f-9db1-3d55e54b96ac', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a13f3f8d-ef7b-4f06-9f6f-5e8404abead0', '2442010622', 'YASH CHAUDHARY', 'yash.chaudhary_bca24@gla.ac.in', '7302488829', 6.34, 'BCA', 'G', 'a428e5ed-2f7f-4b0f-9db1-3d55e54b96ac', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('cac5b1bb-26e8-4777-94ff-fdc1fd9629d7', '2442010625', 'YASH VERMA', 'yash.verma_bca24@gla.ac.in', '8126138903', 6.19, 'BCA', 'G', 'a428e5ed-2f7f-4b0f-9db1-3d55e54b96ac', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('57b01e28-83cb-4b21-8d0e-fe9f7eb1071b', '2442010001', 'ABHAY PRATAP SINGH', 'abhay.singh_bca24@gla.ac.in', '7317067009', 6.17, 'BCA', 'H', '8d6473c2-d6c0-4285-98a7-74f7cede7606', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('165baa15-6f90-4922-ab41-90bd60955b2c', '2442010008', 'ABHISHEK', 'abhishek.singh1_bca24@gla.ac.in', '6396376795', 6.05, 'BCA', 'H', '8d6473c2-d6c0-4285-98a7-74f7cede7606', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('496ff489-db4f-41f1-8f46-abaff504c8c9', '2442010015', 'ABHISHEK TYAGI', 'abhishek.tyagi_bca24@gla.ac.in', '6396844576', 5.95, 'BCA', 'H', '8d6473c2-d6c0-4285-98a7-74f7cede7606', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('809e112b-4442-4c48-ad25-0bd51112656f', '2442010030', 'AGRANSH PANDEY', 'agransh.pandey_bca24@gla.ac.in', '7017046562', 6.05, 'BCA', 'H', '8d6473c2-d6c0-4285-98a7-74f7cede7606', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('60b7df64-6586-47d9-a0dd-095ec41e956a', '2442010031', 'AJAY KUMAR', 'ajay.kumar_bca24@gla.ac.in', '9027153771', 5.95, 'BCA', 'H', '8d6473c2-d6c0-4285-98a7-74f7cede7606', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5078775e-a43b-4ed0-8f61-ebfd17ce6475', '2442010035', 'AKASH', 'akash.gla_bca24@gla.ac.in', '9068502599', 6.09, 'BCA', 'H', '8d6473c2-d6c0-4285-98a7-74f7cede7606', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('cc6947be-84ef-4ade-be98-fbcc580f3021', '2442010046', 'AMAN SINGH', 'aman.singh_bca24@gla.ac.in', '7895805759', 6.22, 'BCA', 'H', 'f2a4c2fd-5816-46e8-b670-fadfb78c3766', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('124cd6b0-84c4-43c1-b0e9-80a8867997c9', '2442010049', 'AMANDEEP', 'amandeep.gla_bca24@gla.ac.in', '6397236030', 6.27, 'BCA', 'H', 'f2a4c2fd-5816-46e8-b670-fadfb78c3766', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('cb093492-e9a8-475a-ba64-c9f1ff793931', '2442010054', 'AMITESH ANAND', 'amitesh.anand_bca24@gla.ac.in', '9709636300', 6.2, 'BCA', 'H', 'f2a4c2fd-5816-46e8-b670-fadfb78c3766', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d5af5b5a-baa7-4bff-91a7-a5b80a729cd4', '2442010064', 'ANKIT PANDEY', 'ankit.pandey_bca24@gla.ac.in', '8586972287', 6, 'BCA', 'H', 'f2a4c2fd-5816-46e8-b670-fadfb78c3766', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f9d85685-6765-41e8-b3a9-47b2441f6182', '2442010096', 'ANUSHKA DIXIT', 'anushka.dixit_bca24@gla.ac.in', '6395029789', 6.48, 'BCA', 'H', 'f2a4c2fd-5816-46e8-b670-fadfb78c3766', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e346499a-5b8a-48c4-bc1f-e19d6855419a', '2442010112', 'ASHISH KUMAR', 'ashish.kumar_bca24@gla.ac.in', '7985515852', 6.08, 'BCA', 'H', 'f2a4c2fd-5816-46e8-b670-fadfb78c3766', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c16ce2e4-61cc-479d-b0cc-a7bcacc0b589', '2442010119', 'ATHARV KHANNA', 'atharv.khanna_bca24@gla.ac.in', '8299229630', 6.11, 'BCA', 'H', '984fbc3d-d706-4bf1-9753-4ed51cc167c1', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e6a7071a-b46c-407a-a5cc-338b434595b8', '2442010135', 'BHARAT', 'bharat.gla_bca24@gla.ac.in', '8445839339', 6.26, 'BCA', 'H', '984fbc3d-d706-4bf1-9753-4ed51cc167c1', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('44525228-d8ad-443a-993e-f840dc87bcca', '2442010141', 'BHUDEV', 'bhudev.gla_bca24@gla.ac.in', '9149018965', 6.31, 'BCA', 'H', '984fbc3d-d706-4bf1-9753-4ed51cc167c1', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('7b1ee8db-fab8-488d-8d26-94c2fd3e287d', '2342010157', 'CHANDRA MOHAN NARAYAN', 'chandra.narayan_bca23@gla.ac.in', '6395220978', 6.58, 'BCA', 'H', '984fbc3d-d706-4bf1-9753-4ed51cc167c1', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('dc4cebdb-f574-42f1-ba52-fb938c328c01', '2442010155', 'CHETAN', 'chetan.gla_bca24@gla.ac.in', '7417990859', 6.12, 'BCA', 'H', '984fbc3d-d706-4bf1-9753-4ed51cc167c1', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('63fb30dd-bf85-4132-a7bb-cb7512c3de10', '2342010169', 'DEEPAK KUMAR YADAV', 'deepak.yadav_bca23@gla.ac.in', '8982135405', 5.86, 'BCA', 'H', '984fbc3d-d706-4bf1-9753-4ed51cc167c1', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('711d4294-c86d-42c8-b4d9-8b7ae5c8e969', '2442010185', 'DEVANSHU PAL', 'devanshu.pal_bca24@gla.ac.in', '9654868779', 5.99, 'BCA', 'H', '4d6f70be-6e1a-4881-ad51-66121e355476', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('04868a8f-f10e-4d99-ad57-f7395558deb6', '2342010754', 'DHANUSH JAISWAL', 'dhanush.jaiswal_bca23@gla.ac.in', '8433176781', 6.56, 'BCA', 'H', '4d6f70be-6e1a-4881-ad51-66121e355476', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c534c7d4-92eb-4ae8-9d66-6065285dd67a', '2442010195', 'DINESH KUMAR', 'dinesh.kumar_bca24@gla.ac.in', '9897740051', 5.84, 'BCA', 'H', '4d6f70be-6e1a-4881-ad51-66121e355476', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('0178f47d-a70f-4092-be4f-6e69935c9bd6', '2442010233', 'HARSH ATTRI', 'harsh.attri_bca24@gla.ac.in', '8938902791', 6.09, 'BCA', 'H', '4d6f70be-6e1a-4881-ad51-66121e355476', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('abbe9f5c-450a-4867-b586-9d75679ccf85', '2442010266', 'KAUSHAL LAVANIA', 'kaushal.lavania_bca24@gla.ac.in', '9528973109', 6.09, 'BCA', 'H', '4d6f70be-6e1a-4881-ad51-66121e355476', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('da683619-5f9f-40c4-9f55-35ee8bd011ec', '2442010279', 'KRISHDHA MUDGAL', 'krishdha.mudgal_bca24@gla.ac.in', '8755553325', 5.94, 'BCA', 'H', '4d6f70be-6e1a-4881-ad51-66121e355476', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('09267d58-fddb-4fe2-a664-6e37f63d1922', '2442010287', 'KRISHNA SINGH', 'krishna.singh_bca24@gla.ac.in', '9520331166', 6.24, 'BCA', 'H', '793c71e1-ca68-4893-9f38-01d8e9a7cfce', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('8f23c0b5-5165-4231-a6ee-c699ec2320c1', '2442010291', 'KRISHNAKANT YADAV', 'krishnakant.yadav_bca24@gla.ac.in', '9368523474', 5.92, 'BCA', 'H', '793c71e1-ca68-4893-9f38-01d8e9a7cfce', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('bf4004b6-65d6-4bfd-b3f2-6d6d645f2131', '2442010294', 'KULDEEP PANDEY', 'kuldeep.pandey_bca24@gla.ac.in', '8266937387', 5.96, 'BCA', 'H', '793c71e1-ca68-4893-9f38-01d8e9a7cfce', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('82bebcc2-0afd-4a88-b79b-f36e4b7e568a', '2442010307', 'LOVEIS KUMAR', 'loveis.kumar_bca24@gla.ac.in', '9528521897', 6.1, 'BCA', 'H', '793c71e1-ca68-4893-9f38-01d8e9a7cfce', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('b15b55c3-6b84-4c10-bd6c-121cfa601640', '2442010316', 'MANJEET SINGH', 'manjeet.singh_bca24@gla.ac.in', '7467035673', 6.12, 'BCA', 'H', '793c71e1-ca68-4893-9f38-01d8e9a7cfce', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('53a143ad-8a6d-4f8e-a10a-6dfe51c36413', '2442010321', 'MANOJ RAJPUT', 'manoj.rajput_bca24@gla.ac.in', '7906049701', 6.1, 'BCA', 'H', '793c71e1-ca68-4893-9f38-01d8e9a7cfce', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c8ba4c2a-9bb1-460f-8834-bed59fc2064f', '2442010322', 'MANPAL SINGH', 'manpal.singh_bca24@gla.ac.in', '7248733284', 5.94, 'BCA', 'H', '14e14ae3-0792-46be-b339-c30880ec4c98', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('80d3dfe8-3992-4ec8-b8b4-37013569c873', '2342010393', 'MILAN GAUTAM', 'milan.gautam_bca23@gla.ac.in', '7906023345', 6.15, 'BCA', 'H', '14e14ae3-0792-46be-b339-c30880ec4c98', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('0d5c0049-c4e3-4270-8b1a-ec2a34bfeb6d', '2442010338', 'MOHIT', 'mohit.gla2_bca24@gla.ac.in', '7668862553', 6.02, 'BCA', 'H', '14e14ae3-0792-46be-b339-c30880ec4c98', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c5f5f7a9-4be5-42fe-a2be-93f67f9a203c', '2442010340', 'MOHIT DAGAR', 'mohit.dagar_bca24@gla.ac.in', '8126832651', 5.88, 'BCA', 'H', '14e14ae3-0792-46be-b339-c30880ec4c98', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e28015c4-c5ec-47e8-a486-65f6f20ca9e1', '2342010401', 'MOHMMAD AMIR', 'mohmmad.amir_bca23@gla.ac.in', '8273314114', 5.99, 'BCA', 'H', '14e14ae3-0792-46be-b339-c30880ec4c98', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('1d2d6548-1797-4997-a95d-0b18db10f076', '2342010402', 'MOHMMAD JUNAID', 'mohmmad.junaid_bca23@gla.ac.in', '7037986412', 6.15, 'BCA', 'H', '14e14ae3-0792-46be-b339-c30880ec4c98', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('08756a57-0721-417a-9f1e-fea540050034', '2342010403', 'MRADUL UPADHYAY', 'mradul.upadhyay_bca23@gla.ac.in', '9557632682', 6.65, 'BCA', 'H', 'dadf6379-cbe9-4da4-8253-b90bcd7e412d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('390b55f3-8db6-4b43-af3c-760dc0e8f1d0', '2442010356', 'NEHA GAUR', 'neha.gaur_bca24@gla.ac.in', '9258729164', 6.03, 'BCA', 'H', 'dadf6379-cbe9-4da4-8253-b90bcd7e412d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('0bcf193b-20a8-4f84-94fd-332d7b4d0fba', '2442010358', 'NIDHI', 'nidhi.gla_bca24@gla.ac.in', '8477968727', 6.02, 'BCA', 'H', 'dadf6379-cbe9-4da4-8253-b90bcd7e412d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('0352750e-7ec4-4187-85b8-b27ccf0f4cb8', '2442010401', 'PRANJAL SINGH', 'pranjal.singh_bca24@gla.ac.in', '7388415149', 6.1, 'BCA', 'H', 'dadf6379-cbe9-4da4-8253-b90bcd7e412d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('afc0fbb3-d578-4783-bc38-8a2e42efeec7', '2442010403', 'PRANSHI SHUKLA', 'pranshi.shukla_bca24@gla.ac.in', '7668418031', 5.96, 'BCA', 'H', 'dadf6379-cbe9-4da4-8253-b90bcd7e412d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('8fcf9827-4288-4eb0-83cc-f450fad11bbe', '2442010434', 'PUSHKAR SINGHAL', 'pushkar.singhal_bca24@gla.ac.in', '9457233614', 6.35, 'BCA', 'H', 'dadf6379-cbe9-4da4-8253-b90bcd7e412d', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('7d5c8326-bbce-4093-be64-6cf3a107e978', '2342010493', 'RAJ SINGH', 'raj.singh_bca23@gla.ac.in', '9634291705', 6.09, 'BCA', 'H', 'a9c624dd-d24d-4af5-950e-bb4fe521c94e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('220c4cfa-09a3-40ca-9d7d-6a6f8b95d29b', '2442010459', 'RISHABH', 'rishabh.gla_bca24@gla.ac.in', '9627200624', 6.02, 'BCA', 'H', 'a9c624dd-d24d-4af5-950e-bb4fe521c94e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d3e559bf-8f41-49e0-80bf-b153917fc313', '2342010525', 'RITIK KUMAR', 'ritik.kumar2_bca23@gla.ac.in', '9058984854', 5.93, 'BCA', 'H', 'a9c624dd-d24d-4af5-950e-bb4fe521c94e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('438f8e29-a69b-404e-a000-bf713e769df9', '2342010526', 'RITIK PRATAP SINGH', 'ritik.singh_bca23@gla.ac.in', '8433458652', 6.18, 'BCA', 'H', 'a9c624dd-d24d-4af5-950e-bb4fe521c94e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2e57a6ed-051b-4993-8784-99f2be6e76ae', '2442010504', 'SAURAV', 'saurav.gla3_bca24@gla.ac.in', '8077276714', 5.95, 'BCA', 'H', 'a9c624dd-d24d-4af5-950e-bb4fe521c94e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('bd38ed4a-a961-4e31-aa25-855eb3764059', '2442010524', 'SHRI KANT', 'shrikant.gla_bca24@gla.ac.in', '9058709608', 6.15, 'BCA', 'H', 'a9c624dd-d24d-4af5-950e-bb4fe521c94e', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('06e7b409-936f-462e-aec9-20f92739d220', '2342010621', 'SNEHA SHARMA', 'sneha.sharma_bca23@gla.ac.in', '6352756983', 6.09, 'BCA', 'H', '3f20668f-2e47-4ff8-85d9-199ea7703563', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('0b9a927d-f4f1-447c-bc2b-ecd57b50d2b9', '2442010543', 'SUMIT CHAUDHARY', 'sumit.chaudhary_bca24@gla.ac.in', '9389888262', 6.1, 'BCA', 'H', '3f20668f-2e47-4ff8-85d9-199ea7703563', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('63b8ef6f-3c96-48da-a673-1ba8c24ca943', '2442010559', 'TANUJ RAGHAV', 'tanuj.raghav_bca24@gla.ac.in', '6396708201', 6.07, 'BCA', 'H', '3f20668f-2e47-4ff8-85d9-199ea7703563', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9c15c60f-2ef0-4d01-84ff-30c314774246', '2442010561', 'TARUN BHARDWAJ', 'tarun.bhardwaj_bca24@gla.ac.in', '8126770082', 6.06, 'BCA', 'H', '3f20668f-2e47-4ff8-85d9-199ea7703563', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('879913b7-a894-4235-aebc-b29618151697', '2442010581', 'VAISHNAVI SHARMA', 'vaishnavi.sharma_bca24@gla.ac.in', '9520943528', 6.19, 'BCA', 'H', '3f20668f-2e47-4ff8-85d9-199ea7703563', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5a49606f-5f49-44a2-9155-fc0fa0ea367d', '2442010628', 'YATENDRA KUMAR', 'yatendra.kumar_bca24@gla.ac.in', '9634228684', 6.09, 'BCA', 'H', '3f20668f-2e47-4ff8-85d9-199ea7703563', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('bd61ee36-95bd-451d-9025-f29e659cc7b8', '2442110001', 'ABHAY PRATAP SINGH', 'abhay.pratap_bca.ds24@gla.ac.in', '9694110090', 7.31, 'BCA - DS', 'A', 'c5398d11-6f8f-4a63-b621-eea371c0091a', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('303e1338-9750-4e98-a1a7-bd0930aaae5a', '2442110002', 'ADARSH PRATAP SINGH', 'adarsh.singh_bca.ds24@gla.ac.in', '9555362706', 7.86, 'BCA - DS', 'A', 'c5398d11-6f8f-4a63-b621-eea371c0091a', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('4f7292ff-666d-4ea0-9812-afb8d6a53c3e', '2442110003', 'AKASH BABU', 'akash.babu_bca.ds24@gla.ac.in', '7088570911', 6.91, 'BCA - DS', 'A', 'c5398d11-6f8f-4a63-b621-eea371c0091a', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('911fe227-32f2-4c5e-b582-f69f8cc02277', '2442110004', 'AKSHAT SHARMA', 'akshat.gla_bca.ds24@gla.ac.in', '7017476016', 8.17, 'BCA - DS', 'A', 'c5398d11-6f8f-4a63-b621-eea371c0091a', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('b309094f-593b-4979-a3e1-766dc7da5cd0', '2442110005', 'AMISHA', 'amisha.gla_bca.ds24@gla.ac.in', '9456536967', 7.74, 'BCA - DS', 'A', 'c5398d11-6f8f-4a63-b621-eea371c0091a', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('7efc3659-a97b-47d0-9121-80c3f49deff6', '2442110006', 'ANKIT LOHKANA', 'ankit.lohkana_bca.ds24@gla.ac.in', '9012511316', 6.38, 'BCA - DS', 'A', 'c5398d11-6f8f-4a63-b621-eea371c0091a', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('88d07791-744e-4522-a321-098fccf8a199', '2442110021', 'HARSH SHARMA', 'harsh.sharma_bca.ds24@gla.ac.in', '7060312122', 7.37, 'BCA - DS', 'A', '8ae54e62-8213-4fef-9627-d0f2dde659b3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('11ed5c0e-96a1-4a37-a518-4d2563a89f6a', '2442110035', 'NANDINI GUPTA', 'nandini.gupta_bca.ds24@gla.ac.in', '6398644481', 9.15, 'BCA - DS', 'A', '8ae54e62-8213-4fef-9627-d0f2dde659b3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f5c35293-249b-4f89-abfe-e6db465973ea', '2442110009', 'ARPIT PANDEY', 'arpit.pandey_bca.ds24@gla.ac.in', '8395036720', 9.04, 'BCA - DS', 'A', '8ae54e62-8213-4fef-9627-d0f2dde659b3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ba3ef1fb-6a42-4e15-a225-7022b9ca35da', '2442110010', 'ASHUTOSH SINGH', 'ashutosh.singh_bca.ds24@gla.ac.in', '9118730763', 7.35, 'BCA - DS', 'A', '8ae54e62-8213-4fef-9627-d0f2dde659b3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ef9a0d89-108b-42b8-acd8-8a08a3cb2807', '2442110044', 'RISHABH MISHRA', 'rishabh.mishra_bca.ds24@gla.ac.in', '9105280131', 8.17, 'BCA - DS', 'A', '8ae54e62-8213-4fef-9627-d0f2dde659b3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ff36b0ed-9bcb-4672-8aaf-53dc2f7645ed', '2442110012', 'AYUSH VISHWAKARMA', 'ayush.vishwakarma_bca.ds24@gla.ac.in', '9335711176', 8.05, 'BCA - DS', 'A', '8ae54e62-8213-4fef-9627-d0f2dde659b3', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('b26adf4c-d8ff-47b7-9270-4a31905b040b', '2442110013', 'BHANU PRATAP SINGH', 'bhanu.singh_bca.ds24@gla.ac.in', '7302230131', 6.15, 'BCA - DS', 'A', 'b80632c8-31cb-4d67-85ff-4f35a201f029', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3aefee43-9985-4a3b-ba6d-fb191dd6b70f', '2442110014', 'CHANDER PAL', 'chander.pal_bca.ds24@gla.ac.in', '8278225584', 6.42, 'BCA - DS', 'A', 'b80632c8-31cb-4d67-85ff-4f35a201f029', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c099392d-6646-49c4-8816-30b121a5660f', '2442110015', 'DAKSHITA ARORA', 'dakshita.arora_bca.ds24@gla.ac.in', '7599618350', 7.55, 'BCA - DS', 'A', 'b80632c8-31cb-4d67-85ff-4f35a201f029', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('1b5e9f10-6a14-4b28-b73d-46666289dcb1', '2442110016', 'DEEPAK VASHISTH', 'deepak.vashisth_bca.ds24@gla.ac.in', '8699960308', 7.37, 'BCA - DS', 'A', 'b80632c8-31cb-4d67-85ff-4f35a201f029', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('994a9f16-8f1e-423a-9406-182fe2ab0b08', '2442110017', 'DEVESH KUMAR', 'devesh.kumar_bca.ds24@gla.ac.in', '7037382409', 6.51, 'BCA - DS', 'A', 'b80632c8-31cb-4d67-85ff-4f35a201f029', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('657238e4-d071-462b-b625-3cc0962ed8d4', '2442110018', 'HARDIKA AGRAWAL', 'hardika.agrawal_bca.ds24@gla.ac.in', '7505786369', 7.84, 'BCA - DS', 'A', 'b80632c8-31cb-4d67-85ff-4f35a201f029', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5d63fb01-beef-4e50-80eb-40c75d003b98', '2442110019', 'HARIOM', 'hariom.gla_bca.ds24@gla.ac.in', '8474903633', 6.42, 'BCA - DS', 'A', 'd6da1096-06b3-4a46-a6ae-f357cf64faea', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('ca31b11f-a8be-41a6-8ff9-a1f00a30e528', '2442110020', 'HARSH AGRAWAL', 'harsh.agrawal_bca.ds24@gla.ac.in', '7668418353', 8.61, 'BCA - DS', 'A', 'd6da1096-06b3-4a46-a6ae-f357cf64faea', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('20e191d0-3d15-40b2-a4ea-9e7a86e43cd1', '2442110008', 'ANSH SINGH', 'ansh.singh_bca.ds24@gla.ac.in', '9451678401', 7.53, 'BCA - DS', 'A', 'd6da1096-06b3-4a46-a6ae-f357cf64faea', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a96c309b-16cb-445d-8e71-363b040b72e9', '2442110022', 'HARSHIT VERMA', 'harshit.verma_bca.ds24@gla.ac.in', '7310572897', 6.74, 'BCA - DS', 'A', 'd6da1096-06b3-4a46-a6ae-f357cf64faea', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e92481c9-a426-449d-a7c2-fbaad3fdac61', '2442110023', 'HEMANT KUMAR', 'hemant.kumar_bca.ds24@gla.ac.in', '9026020469', 7.9, 'BCA - DS', 'A', 'd6da1096-06b3-4a46-a6ae-f357cf64faea', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('21eccce1-b5a2-4634-8bc5-8df87ed74b72', '2442110024', 'HEMRAJ', 'hemraj.gla_bca.ds24@gla.ac.in', '7819958100', 6.55, 'BCA - DS', 'A', 'd6da1096-06b3-4a46-a6ae-f357cf64faea', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a469d04e-cd9b-4d0f-bf8b-a47107ddfb7e', '2442110025', 'KAJAL', 'kajal.gla_bca.ds24@gla.ac.in', '9105320394', 7.21, 'BCA - DS', 'A', '29c324a5-4868-416e-91fc-4b874820842c', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e1a707e9-ee8d-4dd8-82ee-cdfb408f97b1', '2442110027', 'KHUSHBOO AGRAWAL', 'khushboo.agrawal_bca.ds24@gla.ac.in', '8279826279', 8.22, 'BCA - DS', 'A', '29c324a5-4868-416e-91fc-4b874820842c', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9f087fce-ed1f-4018-9c1a-1c037311f1f5', '2442110028', 'KRISHAN CHAUHAN', 'krishan.chauhan_bca.ds24@gla.ac.in', '9812883125', 7.25, 'BCA - DS', 'A', '29c324a5-4868-416e-91fc-4b874820842c', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3bfe77af-06d9-41d6-b0fa-9bf39b6776eb', '2442110030', 'LUCKY VARSHNEY', 'lucky.varshney_bca.ds24@gla.ac.in', '7017304700', 7.26, 'BCA - DS', 'A', '29c324a5-4868-416e-91fc-4b874820842c', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3f4511f9-72b3-48f6-a089-af9b471c4d4f', '2442110032', 'MAHAK RAJPUT', 'mahak.rajput_bca.ds24@gla.ac.in', '9259490265', 7.59, 'BCA - DS', 'A', '29c324a5-4868-416e-91fc-4b874820842c', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5f40eced-716b-4a3c-a13a-75254f80dcf6', '2442110033', 'MANISH KUMAR', 'manish.kumar_bca.ds24@gla.ac.in', '7505964800', 7.41, 'BCA - DS', 'A', '29c324a5-4868-416e-91fc-4b874820842c', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2d6268e7-2e9a-4760-9b3e-9673b3fdd4ef', '2442110034', 'MOHINI', 'mohini.gla_bca.ds24@gla.ac.in', '7818020349', 8.77, 'BCA - DS', 'A', '5e7006bd-c818-4d5b-ab10-f68d59407432', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('d0b42949-02ca-4b6c-b579-9d03888c7e23', '2442110007', 'ANSH DWIVEDI', 'ansh.dwivedi_bca.ds24@gla.ac.in', '7376089975', 7.42, 'BCA - DS', 'A', '5e7006bd-c818-4d5b-ab10-f68d59407432', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('633ad86d-16a7-4124-80f6-1692d29b5eb6', '2442110036', 'NISHA', 'nisha.gla_bca.ds24@gla.ac.in', '6006069816', 8.52, 'BCA - DS', 'A', '5e7006bd-c818-4d5b-ab10-f68d59407432', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('4d7b1217-0a48-42dc-9594-4db65e3ad82c', '2442110037', 'NITIN SHUKLA', 'nitin.shukla_bca.ds24@gla.ac.in', '8081030871', 6.24, 'BCA - DS', 'A', '5e7006bd-c818-4d5b-ab10-f68d59407432', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2ef0b2ec-e35c-4463-a319-9e6b4a490298', '2442110038', 'PARAS DIXIT', 'paras.dixit_bca.ds24@gla.ac.in', '6395313035', 6.92, 'BCA - DS', 'A', '5e7006bd-c818-4d5b-ab10-f68d59407432', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('cf3f5000-7d93-46d3-9894-57fdfbc1adad', '2442110039', 'PIYUSH', 'piyush.gla_bca.ds24@gla.ac.in', '7088659675', 7.08, 'BCA - DS', 'A', '5e7006bd-c818-4d5b-ab10-f68d59407432', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2bab8706-a42a-4023-8126-7a115daecef3', '2442110040', 'PIYUSH SOLANKI', 'piyush.solanki_bca.ds24@gla.ac.in', '8433219208', 6.78, 'BCA - DS', 'A', '8feb9795-78b9-48eb-a947-fa5cb2501674', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('7f986efe-e071-441c-911b-a5ab6145b09e', '2342110041', 'PRAKHAR MISHRA', 'prakhar.mishra_bca.ds23@gla.ac.in', '7992279011', 6.57, 'BCA - DS', 'A', '8feb9795-78b9-48eb-a947-fa5cb2501674', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9b4550d2-c08c-4a22-8a81-970d68c7bcb6', '2442110041', 'PRATYAKSH SHARMA', 'pratyaksh.sharma_bca.ds24@gla.ac.in', '6397631801', 7, 'BCA - DS', 'A', '8feb9795-78b9-48eb-a947-fa5cb2501674', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('2dbc155b-a710-4d8e-9887-9c3518c53904', '2442110042', 'PUNIT KHANDELWAL', 'punit.khandelwal_bca.ds24@gla.ac.in', '7976364625', 6.75, 'BCA - DS', 'A', '8feb9795-78b9-48eb-a947-fa5cb2501674', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('be1e5148-7497-46ea-87b1-7e269df26dba', '2442110043', 'RASHI SHARMA', 'rashi.sharma_bca.ds24@gla.ac.in', '9871909849', 7.82, 'BCA - DS', 'A', '8feb9795-78b9-48eb-a947-fa5cb2501674', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('86c7f8f0-d97e-4cd7-bf21-d34c3723b69a', '2442110011', 'ATUL UPADHYAY', 'atul.upadhyay_bca.ds24@gla.ac.in', '9258800308', 6.59, 'BCA - DS', 'A', '8feb9795-78b9-48eb-a947-fa5cb2501674', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('af4b513e-6e6a-49a5-9441-7f3263e52c04', '2442110045', 'ROHAN GUPTA', 'rohan.gupta_bca.ds24@gla.ac.in', '9536281416', 7.92, 'BCA - DS', 'A', 'bb573bf2-816f-43bf-894e-bb9d02bf91b5', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('a7eadc73-e505-4381-902b-3b8318a781c5', '2442110046', 'RUDRAKSH GOYAL', 'rudraksh.goyal_bca.ds24@gla.ac.in', '7302869987', 7.3, 'BCA - DS', 'A', 'bb573bf2-816f-43bf-894e-bb9d02bf91b5', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('bb0cfdb5-fe8c-4965-91c1-e519747f7be9', '2442110047', 'SAHDEV', 'sahdev.gla_bca.ds24@gla.ac.in', '9027649760', 7.18, 'BCA - DS', 'A', 'bb573bf2-816f-43bf-894e-bb9d02bf91b5', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('c876623a-ec1c-4fb9-b404-70e9d17039ed', '2442110049', 'SANCHIT SINGH', 'sanchit.singh_bca.ds24@gla.ac.in', '7607309986', 6.64, 'BCA - DS', 'A', 'bb573bf2-816f-43bf-894e-bb9d02bf91b5', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('3d205c3f-a7cd-41e9-a421-77c2e450785b', '2442110050', 'SHIVAM SHARMA', 'shivam.sharma_bca.ds24@gla.ac.in', '8755827406', 7.11, 'BCA - DS', 'A', 'bb573bf2-816f-43bf-894e-bb9d02bf91b5', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('e861d7c7-a4fc-4d69-9eb6-ceca5f0ce70d', '2442110051', 'SHIVEN RAJ', 'shiven.raj_bca.ds24@gla.ac.in', '7465830383', 7.8, 'BCA - DS', 'A', 'bb573bf2-816f-43bf-894e-bb9d02bf91b5', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('19050d40-28f6-482c-bdd4-2c44f5c52579', '2442110052', 'SHUBHAM SHARMA', 'shubham.sharma_bca.ds24@gla.ac.in', '7055491021', 7.17, 'BCA - DS', 'A', '8b3732dc-6dd3-4167-80cd-33a40fc751b2', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('5a8968b2-8a6e-496c-b4de-4102f033c3e5', '2442110053', 'SONU THAKUR', 'sonu.thakur_bca.ds24@gla.ac.in', '7302629814', 7.22, 'BCA - DS', 'A', '8b3732dc-6dd3-4167-80cd-33a40fc751b2', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('f305f8f0-321c-4561-8cf6-877913ca5141', '2442110054', 'SUBHAM SHARMA', 'subham.sharma_bca.ds24@gla.ac.in', '9520939400', 6.92, 'BCA - DS', 'A', '8b3732dc-6dd3-4167-80cd-33a40fc751b2', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('40686e5d-d0de-4740-ac54-3c848a083fd5', '2442110056', 'UJJAWAL UPADHYAY', 'ujjawal.upadhyay_bca.ds24@gla.ac.in', '9368756252', 7.31, 'BCA - DS', 'A', '8b3732dc-6dd3-4167-80cd-33a40fc751b2', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('57532b62-9e94-47b0-887a-7a200f1ea211', '2442110057', 'UTKARSH TRIPATHI', 'utkarsh.tripathi_bca.ds24@gla.ac.in', '7599530385', 7.46, 'BCA - DS', 'A', '8b3732dc-6dd3-4167-80cd-33a40fc751b2', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('9375ff3b-749b-4b5f-843c-0413b6b5cb69', '2442110058', 'YASH', 'yash.gla_bca.ds24@gla.ac.in', '9013961250', 6.4, 'BCA - DS', 'A', '8b3732dc-6dd3-4167-80cd-33a40fc751b2', NULL, FALSE, '2026-09-03T21:18:27.375Z'),
  ('b199f9ca-4ebf-44eb-98be-4f655f9ea071', '2442110059', 'YASH AGRAWAL', 'yash.agrawal_bca.ds24@gla.ac.in', '6398925569', 7.42, 'BCA - DS', 'A', '8b3732dc-6dd3-4167-80cd-33a40fc751b2', NULL, FALSE, '2026-09-03T21:18:27.375Z')
ON CONFLICT (id) DO UPDATE SET roll_no = EXCLUDED.roll_no, full_name = EXCLUDED.full_name, email = EXCLUDED.email, team_id = EXCLUDED.team_id, user_id = EXCLUDED.user_id, is_leader = EXCLUDED.is_leader;

-- Table: problem_statements (1 rows)
INSERT INTO public.problem_statements (id, team_id, title, description, status, supervisor_remarks, locked, approved_at, created_at, updated_at)
VALUES
  ('8fca652e-677f-42c3-b5cb-e4646a1def19', '044a959b-283a-4bec-87ec-b243c854df6b', 'Autonomous Crop Disease Classification via Convolutional Vision Transformers', 'Developing high-precision edge-compatible neural models for real-time foliar pathology identification.', 'approved', 'Excellent problem scope. Approved for Phase 1 development.', TRUE, '2026-09-03T21:18:29.479Z', '2026-09-03T21:18:29.363Z', '2026-09-03T21:18:29.479Z')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, status = EXCLUDED.status, supervisor_remarks = EXCLUDED.supervisor_remarks, locked = EXCLUDED.locked;

-- Table: meetings (1 rows)
INSERT INTO public.meetings (id, team_id, supervisor_id, meeting_index, status, requested_at, scheduled_date, time_slot, venue, summary_notes, action_directives, completed_at, created_at)
VALUES
  ('8900f5f2-74a0-4626-9294-cd3d98a87521', '044a959b-283a-4bec-87ec-b243c854df6b', 'd66bec06-0fe8-4dd6-9253-9dd4149e9a55', 1, 'completed', '2026-09-03T21:18:29.516Z', '2026-09-10', '11:00 AM - 11:45 AM', 'Faculty Cabin 304, AB1', 'Reviewed dataset preprocessing and initial literature survey presentation deck.', 'Finalize baseline model metrics and prepare slides for Phase 1 pitch.', '2026-09-03T21:18:29.552Z', '2026-09-03T21:18:29.516Z')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, scheduled_date = EXCLUDED.scheduled_date, time_slot = EXCLUDED.time_slot, venue = EXCLUDED.venue, summary_notes = EXCLUDED.summary_notes, action_directives = EXCLUDED.action_directives;

-- Table: meeting_attendance (6 rows)
INSERT INTO public.meeting_attendance (id, meeting_id, student_id, is_present, created_at)
VALUES
  ('195181ef-3a11-4b56-9c60-c94efd78f738', '8900f5f2-74a0-4626-9294-cd3d98a87521', 'fd1e436e-becf-4939-8109-486c7a23381f', TRUE, '2026-09-03T21:18:29.552Z'),
  ('645a49bc-fbfa-4f84-9db9-9eb25bdcd1f9', '8900f5f2-74a0-4626-9294-cd3d98a87521', '29fde8ed-e425-4e91-a06b-2c6026932f38', FALSE, '2026-09-03T21:18:29.552Z'),
  ('49f0f83d-25d9-4817-a402-163ea360c818', '8900f5f2-74a0-4626-9294-cd3d98a87521', 'f35a2af1-f6ed-411d-afd5-684efd26cd8c', TRUE, '2026-09-03T21:18:29.552Z'),
  ('a35d2bc3-39f2-4993-8d31-c3456043cfb0', '8900f5f2-74a0-4626-9294-cd3d98a87521', 'c5800462-46cd-4e42-8cdc-7aace3c93c0c', TRUE, '2026-09-03T21:18:29.552Z'),
  ('1cca3117-4c37-4085-a8d9-78da3c6977c0', '8900f5f2-74a0-4626-9294-cd3d98a87521', 'a8e05c3a-7652-4144-8321-f6535b5e8eee', TRUE, '2026-09-03T21:18:29.552Z'),
  ('cca458f8-e166-4400-a2cf-472ad07061fb', '8900f5f2-74a0-4626-9294-cd3d98a87521', 'dbf7571a-4f96-4cf2-ae1a-899060cbee48', TRUE, '2026-09-03T21:18:29.552Z')
ON CONFLICT (meeting_id, student_id) DO UPDATE SET is_present = EXCLUDED.is_present;

-- Table: evaluation_phases (3 rows)
INSERT INTO public.evaluation_phases (id, phase_number, phase_name, description, is_live, updated_at)
VALUES
  ('f08925e6-92e2-4d1a-b061-8a8ece70abfa', 1, 'Phase 1 Presentation: Concept Pitch & Ideation', 'PPT Presentation & Literature Review', TRUE, '2026-09-03T21:18:29.675Z'),
  ('58a6bf3f-001d-4b62-9226-64c6b121c1bd', 2, 'Phase 2 Presentation: Working Prototype', 'Live Website & Code Demonstration', FALSE, '2026-09-03T21:18:27.375Z'),
  ('2de7a3e1-3779-422a-816b-17391c4bbb07', 3, 'Phase 3 Presentation: Final Defense', 'Final Project Report & Research Paper Defense', FALSE, '2026-09-03T21:18:27.375Z')
ON CONFLICT (phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, description = EXCLUDED.description, is_live = EXCLUDED.is_live, updated_at = EXCLUDED.updated_at;

-- Table: panels (3 rows)
INSERT INTO public.panels (id, panel_number, panel_name, phase_number, date, time_window, academic_block, room_number, team_range_start, team_range_end, team_codes, created_at)
VALUES
  ('12e99331-7c8e-4db2-ac36-a29e2d741aeb', 1, 'Panel 1', 1, '2026-09-18', 'Shift 2: Evening (02:00 PM - 06:00 PM)', 'Academic Block AB10', 'Room 402', 1, 1, NULL, '2026-09-03T21:18:29.804Z'),
  ('70b45363-99ef-438c-88c6-254b86dc0e3c', 2, 'Panel 2', 1, '2026-09-18', 'Shift 1: Morning (09:00 AM - 01:00 PM)', 'Academic Block AB10', 'Room 406', 10, 20, NULL, '2026-09-03T21:18:32.909Z'),
  ('a911c91f-73ff-444c-81b7-6277f8d19ca4', 3, 'Panel 3', 1, 'To Be Announced', 'Shift 1: Morning (09:00 AM - 01:00 PM)', 'Academic Block AB10', 'Room TBA', 25, 35, NULL, '2026-09-03T21:18:32.914Z')
ON CONFLICT (id) DO UPDATE SET panel_name = EXCLUDED.panel_name, phase_number = EXCLUDED.phase_number, date = EXCLUDED.date, time_window = EXCLUDED.time_window, team_codes = EXCLUDED.team_codes;

-- Table: panel_members (3 rows)
INSERT INTO public.panel_members (id, panel_id, supervisor_id, created_at)
VALUES
  ('61e1a01a-ee4f-4cb9-b2d9-3d4d85eb042e', '12e99331-7c8e-4db2-ac36-a29e2d741aeb', '56c8fa37-00e4-40e9-ba31-3ef2c813af9c', '2026-09-03T21:18:29.804Z'),
  ('4f9f8e5f-a487-4f75-814a-968a43dfb2ae', '70b45363-99ef-438c-88c6-254b86dc0e3c', '56c8fa37-00e4-40e9-ba31-3ef2c813af9c', '2026-09-03T21:18:32.909Z'),
  ('d3ba028e-4417-41ad-990b-d894252d8414', 'a911c91f-73ff-444c-81b7-6277f8d19ca4', 'd66bec06-0fe8-4dd6-9253-9dd4149e9a55', '2026-09-03T21:18:32.914Z')
ON CONFLICT (panel_id, supervisor_id) DO NOTHING;

-- Table: evaluations (2 rows)
INSERT INTO public.evaluations (id, phase_number, team_id, student_id, panel_member_id, score, is_absent, remarks, submitted_at)
VALUES
  ('0bb61ba7-9985-44aa-be23-02545930e83c', 1, '044a959b-283a-4bec-87ec-b243c854df6b', 'fd1e436e-becf-4939-8109-486c7a23381f', '56c8fa37-00e4-40e9-ba31-3ef2c813af9c', 9.5, FALSE, 'Strong presentation.', '2026-09-03T21:18:29.818Z'),
  ('676a78c2-8a59-43bf-9045-3bb67a3b84e8', 1, '044a959b-283a-4bec-87ec-b243c854df6b', '29fde8ed-e425-4e91-a06b-2c6026932f38', '56c8fa37-00e4-40e9-ba31-3ef2c813af9c', NULL, TRUE, 'Absent', '2026-09-03T21:18:29.822Z')
ON CONFLICT (phase_number, student_id, panel_member_id) DO UPDATE SET score = EXCLUDED.score, is_absent = EXCLUDED.is_absent, remarks = EXCLUDED.remarks;

-- Table: notifications (8 rows)
INSERT INTO public.notifications (id, user_id, category, subject, salutation, body, signoff, is_read, created_at)
VALUES
  ('4eecc201-5259-408e-a9fa-ea3e25d8ebc1', '56c8fa37-00e4-40e9-ba31-3ef2c813af9c', 'Category D: Supervisor Dashboard Alert', 'Team Leader Registered: Team BCA-2', 'Dear Prof. Mr. Sachin Sharma,', 'A student has officially claimed the Team Leader position for one of your guided teams on CodeShastra ProjectHub.

Registration Details:
- Team: Team BCA-2
- Leader Name: ANSH BHADORIA
- Leader Email: ansh.bhadoria_bca24@gla.ac.in
- Leader Phone: 9149046428

The student has been highlighted as Team Leader in your roster dashboard.', 'Sincerely,
Project Evaluation Committee
CodeShastra ProjectHub', FALSE, '2026-09-03T21:20:01.886Z'),
  ('4326dd68-0fb0-49d6-a350-331170e6d66c', 'b10516e3-432b-4b42-a97f-2930c602c8cf', 'Category C: Milestone Presentations & Panel Logistics', 'Evaluation Schedule Published: Phase 1 Presentation Round', 'Dear ADEESH AGRAWAL (Team BCA-1),', 'The Project Incharge has released the official presentation schedule and panel allocations for the upcoming Phase 1 milestone.

Schedule & Venue Details:
- Target Group: Team BCA-1
- Phase Milestone: Phase 1
- Date: To Be Announced
- Time Window: 09:00 AM - 01:00 PM
- Venue: Academic Block AB1, Room No: TBA
- Assigned Panel Judges: Assigned Faculty Panel

Team Leaders must ensure that all team members report to the assigned room 15 minutes prior to their slot with their demonstration materials and slide decks.', 'Sincerely,
Project Incharge
CodeShastra ProjectHub', FALSE, '2026-09-03T21:18:29.688Z'),
  ('cc5265b0-5aaf-4e27-8d8f-c0601b6bb01c', 'b10516e3-432b-4b42-a97f-2930c602c8cf', 'Category C: Milestone Presentations & Panel Logistics', 'Clearance Granted: Eligibility Confirmed for Phase 1 Presentation', 'Dear ADEESH AGRAWAL (Team BCA-1),', 'Your project supervisor has granted formal permission for your team to present in the upcoming Phase 1 evaluation round.

Clearance Details:
- Milestone: Phase 1 (PPT Presentation & Ideation)
- Supervisor: Mr. Narendra Mohan
- Supervisor Phone: 9837356128
- Eligibility Status: Approved to Present

Your team will be scheduled to appear before the assigned evaluation panel during the live evaluation window set by the Project Incharge.', 'Sincerely,
Project Evaluation Committee
CodeShastra ProjectHub', FALSE, '2026-09-03T21:18:29.583Z'),
  ('80bc666b-edf9-4317-8de5-148403298ba8', 'b10516e3-432b-4b42-a97f-2930c602c8cf', 'Category B: Meeting Logistics & Records', 'Meeting Record Logged: Meet 1 - Team BCA-1', 'Dear ADEESH AGRAWAL (Team BCA-1),', 'Your supervisor has officially recorded the attendance and summary notes for your recent review session in the system.

Session Summary:
- Meeting Label: Meet 1
- Date Conducted: 4/9/2026
- Supervisor: Mr. Narendra Mohan
- Supervisor Phone: 9837356128
- Members Present: ADEESH AGRAWAL, ADITI BHADAURIA, AKHIL PRATAP SINGH, AMAN JAIN, ANJALI SINGH
- Members Absent: ADISHRI AWASTHI
- Summary & Directives: Reviewed dataset preprocessing and initial literature survey presentation deck.

This record has been permanently archived in your project tracking log on your dashboard.', 'Sincerely,
Project Evaluation Committee
CodeShastra ProjectHub', FALSE, '2026-09-03T21:18:29.563Z'),
  ('8a29a106-c76e-41d9-8ad7-5d2186562455', 'b10516e3-432b-4b42-a97f-2930c602c8cf', 'Category B: Meeting Logistics & Records', 'Meeting Scheduled: Project Discussion with Supervisor - Team BCA-1', 'Dear ADEESH AGRAWAL (Team BCA-1),', 'This is to inform you that your meeting with your project supervisor has been scheduled. Please find the details below:

Meeting Logistics:
- Supervisor: Mr. Narendra Mohan
- Email: narendra.mohan@gla.ac.in
- Phone: 9837356128
- Date: 2026-09-10
- Time Slot: 11:00 AM - 11:45 AM
- Venue / Room Number / Link: Faculty Cabin 304, AB1
- Agenda: Project Discussion & Review

Kindly ensure that all team members are present on time for the meeting. Arrive prepared with your current progress, documentation, and technical queries.', 'Sincerely,
Project Evaluation Committee
CodeShastra ProjectHub', FALSE, '2026-09-03T21:18:29.541Z'),
  ('f3a7234d-1408-4601-9fab-63ae8af3b4c8', 'd66bec06-0fe8-4dd6-9253-9dd4149e9a55', 'Category B: Meeting Logistics & Records', 'New Meeting Request from Team BCA-1 - CodeShastra ProjectHub', 'Dear Prof. Mr. Narendra Mohan,', 'This is to inform you that Team BCA-1 has initiated a meeting request via their student portal to discuss their project progress.

Request Summary:
- Team: Team BCA-1
- Team Leader: ADEESH AGRAWAL
- Leader Contact: 8171136968 | adeesh.agrawal_bca24@gla.ac.in
- Request Timestamp: 4/9/2026, 2:48:29 am

Please access your Supervisor Portal to confirm your availability, assign a date, time slot, and venue (or Google Meet URL) to schedule the session.', 'Sincerely,
Project Evaluation Committee
CodeShastra ProjectHub', FALSE, '2026-09-03T21:18:29.520Z'),
  ('5d25edc1-c297-4630-a380-bd4ab2c8d77c', 'b10516e3-432b-4b42-a97f-2930c602c8cf', 'Category A: Problem Statement Lifecycle', 'Problem Statement Approved: Team BCA-1 - CodeShastra ProjectHub', 'Dear ADEESH AGRAWAL (Team BCA-1),', 'This is to inform you that your proposed Project Problem Statement has been officially reviewed and approved by your project supervisor.

Approval Details:
- Project Title: Autonomous Crop Disease Classification via Convolutional Vision Transformers
- Supervisor: Mr. Narendra Mohan
- Supervisor Phone: 9837356128
- Approval Timestamp: 4/9/2026, 2:48:29 am
- Status: Finalized & Locked

Please note that your problem statement has now been permanently locked in the portal and cannot be edited. You may now proceed with phase-wise development under your supervisor''s guidance.', 'Sincerely,
Project Evaluation Committee
CodeShastra ProjectHub', FALSE, '2026-09-03T21:18:29.486Z'),
  ('8cff75bf-b4c5-415c-b211-81e0965614c8', 'd66bec06-0fe8-4dd6-9253-9dd4149e9a55', 'Category D: Supervisor Dashboard Alert', 'Team Leader Registered: Team BCA-1', 'Dear Prof. Mr. Narendra Mohan,', 'A student has officially claimed the Team Leader position for one of your guided teams on CodeShastra ProjectHub.

Registration Details:
- Team: Team BCA-1
- Leader Name: ADEESH AGRAWAL
- Leader Email: adeesh.agrawal_bca24@gla.ac.in
- Leader Phone: 8171136968

The student has been highlighted as Team Leader in your roster dashboard.', 'Sincerely,
Project Evaluation Committee
CodeShastra ProjectHub', FALSE, '2026-09-03T21:18:29.076Z')
ON CONFLICT (id) DO UPDATE SET is_read = EXCLUDED.is_read;
