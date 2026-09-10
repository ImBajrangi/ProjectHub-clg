import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'projecthub.db.json');
const rawData = fs.readFileSync(dbPath, 'utf8');
const db = JSON.parse(rawData);

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return isNaN(val) ? 'NULL' : String(val);
  if (Array.isArray(val)) {
    // text array format for postgres: ARRAY['item1', 'item2']::TEXT[]
    const items = val.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(', ');
    return `ARRAY[${items}]::TEXT[]`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

let sql = `-- ==============================================================================
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
`;

// Helper to generate batch insert
function generateInserts(table, columns, rows, onConflictClause = '') {
  if (!rows || rows.length === 0) return '';
  const colList = columns.join(', ');
  let out = `\n-- Table: ${table} (${rows.length} rows)\n`;
  
  const chunkRows = [];
  for (const r of rows) {
    const vals = columns.map(c => escapeSql(r[c]));
    chunkRows.push(`(${vals.join(', ')})`);
  }
  
  out += `INSERT INTO public.${table} (${colList})\nVALUES\n  ${chunkRows.join(',\n  ')}\n${onConflictClause};\n`;
  return out;
}

// 1. Users
sql += generateInserts(
  'users',
  ['id', 'email', 'password_hash', 'role', 'full_name', 'phone', 'is_leader', 'active_session_token', 'active_session_device', 'active_session_at', 'reset_token', 'reset_token_expires_at', 'created_at', 'updated_at'],
  db.users,
  'ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name, role = EXCLUDED.role, phone = EXCLUDED.phone'
);

// 2. Supervisors
sql += generateInserts(
  'supervisors',
  ['id', 'employee_id', 'designation', 'department', 'created_at'],
  db.supervisors,
  'ON CONFLICT (id) DO UPDATE SET employee_id = EXCLUDED.employee_id, designation = EXCLUDED.designation, department = EXCLUDED.department'
);

// 3. Teams
sql += generateInserts(
  'teams',
  ['id', 'team_code', 'team_number', 'program', 'supervisor_id', 'leader_id', 'phase1_approved', 'phase2_approved', 'phase3_approved', 'phase3_report_clearance', 'report_url', 'paper_url', 'report_uploaded_at', 'created_at', 'updated_at'],
  db.teams,
  'ON CONFLICT (id) DO UPDATE SET team_code = EXCLUDED.team_code, supervisor_id = EXCLUDED.supervisor_id, leader_id = EXCLUDED.leader_id, phase1_approved = EXCLUDED.phase1_approved, phase2_approved = EXCLUDED.phase2_approved, phase3_approved = EXCLUDED.phase3_approved'
);

// 4. Students
sql += generateInserts(
  'students',
  ['id', 'roll_no', 'full_name', 'email', 'mobile', 'cpi', 'course', 'section', 'team_id', 'user_id', 'is_leader', 'created_at'],
  db.students,
  'ON CONFLICT (id) DO UPDATE SET roll_no = EXCLUDED.roll_no, full_name = EXCLUDED.full_name, email = EXCLUDED.email, team_id = EXCLUDED.team_id, user_id = EXCLUDED.user_id, is_leader = EXCLUDED.is_leader'
);

// 5. Problem Statements
sql += generateInserts(
  'problem_statements',
  ['id', 'team_id', 'title', 'description', 'status', 'supervisor_remarks', 'locked', 'approved_at', 'created_at', 'updated_at'],
  db.problem_statements,
  'ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, status = EXCLUDED.status, supervisor_remarks = EXCLUDED.supervisor_remarks, locked = EXCLUDED.locked'
);

// 6. Meetings
sql += generateInserts(
  'meetings',
  ['id', 'team_id', 'supervisor_id', 'meeting_index', 'status', 'requested_at', 'scheduled_date', 'time_slot', 'venue', 'summary_notes', 'action_directives', 'completed_at', 'created_at'],
  db.meetings,
  'ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, scheduled_date = EXCLUDED.scheduled_date, time_slot = EXCLUDED.time_slot, venue = EXCLUDED.venue, summary_notes = EXCLUDED.summary_notes, action_directives = EXCLUDED.action_directives'
);

// 7. Meeting Attendance
sql += generateInserts(
  'meeting_attendance',
  ['id', 'meeting_id', 'student_id', 'is_present', 'created_at'],
  db.meeting_attendance,
  'ON CONFLICT (meeting_id, student_id) DO UPDATE SET is_present = EXCLUDED.is_present'
);

// 8. Evaluation Phases
sql += generateInserts(
  'evaluation_phases',
  ['id', 'phase_number', 'phase_name', 'description', 'is_live', 'updated_at'],
  db.evaluation_phases,
  'ON CONFLICT (phase_number) DO UPDATE SET phase_name = EXCLUDED.phase_name, description = EXCLUDED.description, is_live = EXCLUDED.is_live, updated_at = EXCLUDED.updated_at'
);

// 9. Panels
sql += generateInserts(
  'panels',
  ['id', 'panel_number', 'panel_name', 'phase_number', 'date', 'time_window', 'academic_block', 'room_number', 'team_range_start', 'team_range_end', 'team_codes', 'created_at'],
  db.panels,
  'ON CONFLICT (id) DO UPDATE SET panel_name = EXCLUDED.panel_name, phase_number = EXCLUDED.phase_number, date = EXCLUDED.date, time_window = EXCLUDED.time_window, team_codes = EXCLUDED.team_codes'
);

// 10. Panel Members
sql += generateInserts(
  'panel_members',
  ['id', 'panel_id', 'supervisor_id', 'created_at'],
  db.panel_members,
  'ON CONFLICT (panel_id, supervisor_id) DO NOTHING'
);

// 11. Evaluations
sql += generateInserts(
  'evaluations',
  ['id', 'phase_number', 'team_id', 'student_id', 'panel_member_id', 'score', 'is_absent', 'remarks', 'submitted_at'],
  db.evaluations,
  'ON CONFLICT (phase_number, student_id, panel_member_id) DO UPDATE SET score = EXCLUDED.score, is_absent = EXCLUDED.is_absent, remarks = EXCLUDED.remarks'
);

// 12. Notifications
sql += generateInserts(
  'notifications',
  ['id', 'user_id', 'category', 'subject', 'salutation', 'body', 'signoff', 'is_read', 'created_at'],
  db.notifications,
  'ON CONFLICT (id) DO UPDATE SET is_read = EXCLUDED.is_read'
);

// 13. Push Subscriptions
if (db.push_subscriptions && db.push_subscriptions.length > 0) {
  sql += generateInserts(
    'push_subscriptions',
    ['id', 'user_id', 'endpoint', 'p256dh', 'auth', 'created_at'],
    db.push_subscriptions,
    'ON CONFLICT (endpoint) DO NOTHING'
  );
}

const outPath = path.join(process.cwd(), 'scripts', 'supabase_seed.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.log('Successfully generated SQL seed file at:', outPath);
