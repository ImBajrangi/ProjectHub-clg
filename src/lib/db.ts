import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  User,
  Student,
  Team,
  SupervisorProfile,
  ProblemStatement,
  Meeting,
  MeetingAttendance,
  EvaluationPhase,
  Panel,
  PanelMember,
  Evaluation,
  NotificationItem,
  PushSubscriptionItem,
} from './types';
import { NotificationPayload } from './notifications';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ezspbqjnvmxuglivdjzb.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

interface DatabaseStore {
  users: User[];
  supervisors: SupervisorProfile[];
  teams: Team[];
  students: Student[];
  problem_statements: ProblemStatement[];
  meetings: Meeting[];
  meeting_attendance: MeetingAttendance[];
  evaluation_phases: EvaluationPhase[];
  panels: Panel[];
  panel_members: PanelMember[];
  evaluations: Evaluation[];
  notifications: NotificationItem[];
  push_subscriptions: PushSubscriptionItem[];
}

const DB_FILE = path.join(process.cwd(), 'data', 'projecthub.db.json');

function loadStore(): DatabaseStore {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed reading DB file, reinitializing', e);
    }
  }
  return initStoreFromSeed();
}

function saveStore(store: DatabaseStore) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed writing DB file', e);
  }
}

function initStoreFromSeed(): DatabaseStore {
  const seedFile = path.join(process.cwd(), 'data', 'initial_seed.json');
  let seedData: any = { supervisors: [], teams: [], students: [], admin: {} };
  if (fs.existsSync(seedFile)) {
    seedData = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));
  }

  const now = new Date().toISOString();
  const users: User[] = [];
  const supervisors: SupervisorProfile[] = [];
  const teams: Team[] = [];
  const students: Student[] = [];

  // 1. Create Admin User
  const adminPasswordHash = bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@CodeShastra2026', 10);
  const adminUser: User = {
    id: crypto.randomUUID(),
    email: 'admin@codeshastra.edu',
    password_hash: adminPasswordHash,
    role: 'admin',
    full_name: 'Dr. Project Incharge (Head Administrator)',
    phone: '9999988888',
    created_at: now,
    updated_at: now,
  };
  users.push(adminUser);

  // 2. Create Supervisors
  // Default password per SRS: CodeShastra@<Last4DigitsOfPhone> or Employee ID
  const supervisorUserMap = new Map<string, string>(); // email -> userId

  for (const s of seedData.supervisors || []) {
    const last4 = (s.phone || '0000').slice(-4);
    const defaultPassword = `CodeShastra@${last4}`;
    const passwordHash = bcrypt.hashSync(defaultPassword, 10);
    const userId = crypto.randomUUID();

    const u: User = {
      id: userId,
      email: s.email.toLowerCase().trim(),
      password_hash: passwordHash,
      role: 'supervisor',
      full_name: s.name,
      phone: s.phone,
      created_at: now,
      updated_at: now,
    };
    users.push(u);
    supervisorUserMap.set(s.email.toLowerCase().trim(), userId);

    supervisors.push({
      id: userId,
      employee_id: s.emp_id,
      designation: s.designation,
      department: 'Computer Applications',
      created_at: now,
    });
  }

  // 3. Create Teams
  const teamCodeMap = new Map<string, string>(); // team_code -> teamId

  for (const t of seedData.teams || []) {
    const supId = t.supervisor_email ? supervisorUserMap.get(t.supervisor_email.toLowerCase().trim()) || adminUser.id : adminUser.id;
    const teamId = crypto.randomUUID();

    teams.push({
      id: teamId,
      team_code: t.team_code,
      team_name: t.team_name,
      team_number: t.team_number,
      program: t.program,
      supervisor_id: supId,
      leader_id: null,
      phase1_approved: false,
      phase2_approved: false,
      phase3_approved: false,
      phase3_report_clearance: false,
      created_at: now,
      updated_at: now,
    });
    teamCodeMap.set(t.team_code, teamId);
  }

  // 4. Create Students
  for (const stu of seedData.students || []) {
    const teamId = teamCodeMap.get(stu.team_code) || '';
    students.push({
      id: crypto.randomUUID(),
      roll_no: stu.roll_no,
      full_name: stu.full_name,
      email: stu.email.toLowerCase().trim(),
      mobile: stu.mobile,
      cpi: stu.cpi,
      course: stu.course,
      section: stu.section,
      team_id: teamId,
      user_id: null,
      is_leader: false,
      created_at: now,
    });
  }

  // 5. Evaluation Phases (Default)
  const phases: EvaluationPhase[] = [
    {
      id: crypto.randomUUID(),
      phase_number: 1,
      phase_name: 'Phase 1 Presentation: Concept Pitch & Ideation',
      description: 'PPT Presentation & Literature Review',
      is_live: true, // Default active for demonstration
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      phase_number: 2,
      phase_name: 'Phase 2 Presentation: Working Prototype',
      description: 'Live Website & Code Demonstration',
      is_live: false,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      phase_number: 3,
      phase_name: 'Phase 3 Presentation: Final Defense',
      description: 'Final Project Report & Research Paper Defense',
      is_live: false,
      updated_at: now,
    },
  ];

  const store: DatabaseStore = {
    users,
    supervisors,
    teams,
    students,
    problem_statements: [],
    meetings: [],
    meeting_attendance: [],
    evaluation_phases: phases,
    panels: [],
    panel_members: [],
    evaluations: [],
    notifications: [],
    push_subscriptions: [],
  };

  saveStore(store);
  return store;
}

// --------------------------------------------------------------------------
// Unified Database Access Methods
// --------------------------------------------------------------------------

export const db = {
  // Store management
  getStore(): DatabaseStore {
    return loadStore();
  },

  // Users & Auth
  async getUserByEmail(email: string): Promise<User | null> {
    const store = loadStore();
    const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    return user || null;
  },

  async getUserById(id: string): Promise<User | null> {
    const store = loadStore();
    const user = store.users.find((u) => u.id === id);
    return user || null;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const store = loadStore();
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    store.users[idx] = { ...store.users[idx], ...updates, updated_at: new Date().toISOString() };
    saveStore(store);
    return store.users[idx];
  },

  // Teams
  async getTeams(): Promise<Team[]> {
    const store = loadStore();
    return store.teams;
  },

  async getTeamById(id: string): Promise<Team | null> {
    const store = loadStore();
    return store.teams.find((t) => t.id === id) || null;
  },

  async getTeamsBySupervisor(supervisorId: string): Promise<Team[]> {
    const store = loadStore();
    return store.teams.filter((t) => t.supervisor_id === supervisorId);
  },

  async getTeamByLeaderId(leaderId: string): Promise<Team | null> {
    const store = loadStore();
    return store.teams.find((t) => t.leader_id === leaderId) || null;
  },

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | null> {
    const store = loadStore();
    const idx = store.teams.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    store.teams[idx] = { ...store.teams[idx], ...updates, updated_at: new Date().toISOString() };
    saveStore(store);
    return store.teams[idx];
  },

  // Students & Public Leader Activation (/leader)
  async getStudentsByTeam(teamId: string): Promise<Student[]> {
    const store = loadStore();
    return store.students.filter((s) => s.team_id === teamId);
  },

  async getAvailableTeamsForLeader(): Promise<{ id: string; team_code: string; team_name: string; program: string }[]> {
    const store = loadStore();
    // Dynamic Exclusion: Only teams that do NOT yet have an assigned leader
    return store.teams
      .filter((t) => !t.leader_id)
      .map((t) => ({
        id: t.id,
        team_code: t.team_code,
        team_name: t.team_name,
        program: t.program,
      }));
  },

  async claimTeamLeader(teamId: string, studentEmail: string): Promise<{ success: boolean; error?: string; user?: User }> {
    const store = loadStore();
    const team = store.teams.find((t) => t.id === teamId);
    if (!team) {
      return { success: false, error: 'Team not found' };
    }
    if (team.leader_id) {
      return { success: false, error: 'A leader has already been registered for this team' };
    }

    const student = store.students.find(
      (s) => s.team_id === teamId && s.email.toLowerCase() === studentEmail.toLowerCase().trim()
    );
    if (!student) {
      return { success: false, error: 'Student does not belong to this team' };
    }

    const now = new Date().toISOString();
    // Create login account instantly: Username = Selected Email ID, Initial Password = Mobile Number
    const passwordHash = bcrypt.hashSync(student.mobile.trim(), 10);
    const userId = crypto.randomUUID();

    const newUser: User = {
      id: userId,
      email: student.email.toLowerCase().trim(),
      password_hash: passwordHash,
      role: 'leader',
      full_name: student.full_name,
      phone: student.mobile,
      is_leader: true,
      created_at: now,
      updated_at: now,
    };

    store.users.push(newUser);

    // Update student record
    student.is_leader = true;
    student.user_id = userId;

    // Update team record
    team.leader_id = userId;
    team.updated_at = now;

    saveStore(store);

    return { success: true, user: newUser };
  },

  // Problem Statements
  async getProblemStatementByTeam(teamId: string): Promise<ProblemStatement | null> {
    const store = loadStore();
    return store.problem_statements.find((p) => p.team_id === teamId) || null;
  },

  async saveProblemStatement(
    teamId: string,
    title: string,
    description: string
  ): Promise<{ success: boolean; error?: string; problemStatement?: ProblemStatement }> {
    const store = loadStore();
    const existing = store.problem_statements.find((p) => p.team_id === teamId);
    if (existing && existing.locked) {
      return { success: false, error: 'Problem statement is approved and permanently locked.' };
    }

    const now = new Date().toISOString();
    if (existing) {
      existing.title = title;
      existing.description = description;
      existing.status = 'pending';
      existing.updated_at = now;
      saveStore(store);
      return { success: true, problemStatement: existing };
    } else {
      const ps: ProblemStatement = {
        id: crypto.randomUUID(),
        team_id: teamId,
        title,
        description,
        status: 'pending',
        locked: false,
        created_at: now,
        updated_at: now,
      };
      store.problem_statements.push(ps);
      saveStore(store);
      return { success: true, problemStatement: ps };
    }
  },

  async reviewProblemStatement(
    teamId: string,
    action: 'approve' | 'revise',
    remarks?: string
  ): Promise<{ success: boolean; error?: string; problemStatement?: ProblemStatement }> {
    const store = loadStore();
    const ps = store.problem_statements.find((p) => p.team_id === teamId);
    if (!ps) {
      return { success: false, error: 'Problem statement not found' };
    }

    const now = new Date().toISOString();
    if (action === 'approve') {
      ps.status = 'approved';
      ps.locked = true; // Immutable Lock State
      ps.approved_at = now;
      ps.supervisor_remarks = remarks || 'Approved without modifications.';
    } else {
      ps.status = 'revision_requested';
      ps.supervisor_remarks = remarks || 'Revisions required.';
    }
    ps.updated_at = now;
    saveStore(store);
    return { success: true, problemStatement: ps };
  },

  // Meetings ("Want to Meet")
  async getMeetingsByTeam(teamId: string): Promise<Meeting[]> {
    const store = loadStore();
    return store.meetings
      .filter((m) => m.team_id === teamId)
      .sort((a, b) => a.meeting_index - b.meeting_index);
  },

  async getMeetingsBySupervisor(supervisorId: string): Promise<Meeting[]> {
    const store = loadStore();
    return store.meetings
      .filter((m) => m.supervisor_id === supervisorId)
      .sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());
  },

  async getMeetingAttendance(meetingId: string): Promise<MeetingAttendance[]> {
    const store = loadStore();
    return store.meeting_attendance.filter((a) => a.meeting_id === meetingId);
  },

  async createMeetingRequest(teamId: string, supervisorId: string): Promise<Meeting> {
    const store = loadStore();
    const existingTeamMeetings = store.meetings.filter((m) => m.team_id === teamId);
    const nextIndex = existingTeamMeetings.length + 1;
    const now = new Date().toISOString();

    const m: Meeting = {
      id: crypto.randomUUID(),
      team_id: teamId,
      supervisor_id: supervisorId,
      meeting_index: nextIndex,
      status: 'requested',
      requested_at: now,
      created_at: now,
    };
    store.meetings.push(m);
    saveStore(store);
    return m;
  },

  async scheduleMeeting(
    meetingId: string,
    scheduledDate: string,
    timeSlot: string,
    venue: string
  ): Promise<{ success: boolean; meeting?: Meeting }> {
    const store = loadStore();
    const m = store.meetings.find((item) => item.id === meetingId);
    if (!m) return { success: false };

    m.status = 'scheduled';
    m.scheduled_date = scheduledDate;
    m.time_slot = timeSlot;
    m.venue = venue;
    saveStore(store);
    return { success: true, meeting: m };
  },

  async logMeetingRecord(
    meetingId: string,
    summaryNotes: string,
    actionDirectives: string,
    attendanceRecords: { studentId: string; isPresent: boolean }[]
  ): Promise<{ success: boolean; meeting?: Meeting }> {
    const store = loadStore();
    const m = store.meetings.find((item) => item.id === meetingId);
    if (!m) return { success: false };

    const now = new Date().toISOString();
    m.status = 'completed';
    m.summary_notes = summaryNotes;
    m.action_directives = actionDirectives;
    m.completed_at = now;

    // Record attendance
    for (const att of attendanceRecords) {
      const existingAttIdx = store.meeting_attendance.findIndex(
        (a) => a.meeting_id === meetingId && a.student_id === att.studentId
      );
      if (existingAttIdx !== -1) {
        store.meeting_attendance[existingAttIdx].is_present = att.isPresent;
      } else {
        store.meeting_attendance.push({
          id: crypto.randomUUID(),
          meeting_id: meetingId,
          student_id: att.studentId,
          is_present: att.isPresent,
          created_at: now,
        });
      }
    }

    saveStore(store);
    return { success: true, meeting: m };
  },

  // Phases & Gatekeeping
  async getPhases(): Promise<EvaluationPhase[]> {
    const store = loadStore();
    return store.evaluation_phases.sort((a, b) => a.phase_number - b.phase_number);
  },

  async setPhaseLive(phaseNumber: 1 | 2 | 3, isLive: boolean): Promise<EvaluationPhase | null> {
    const store = loadStore();
    const phase = store.evaluation_phases.find((p) => p.phase_number === phaseNumber);
    if (!phase) return null;
    phase.is_live = isLive;
    phase.updated_at = new Date().toISOString();
    saveStore(store);
    return phase;
  },

  async setTeamPhaseApproval(
    teamId: string,
    phaseNumber: 1 | 2 | 3,
    approved: boolean
  ): Promise<Team | null> {
    const store = loadStore();
    const team = store.teams.find((t) => t.id === teamId);
    if (!team) return null;

    if (phaseNumber === 1) team.phase1_approved = approved;
    if (phaseNumber === 2) team.phase2_approved = approved;
    if (phaseNumber === 3) team.phase3_approved = approved;

    team.updated_at = new Date().toISOString();
    saveStore(store);
    return team;
  },

  // Panels & Evaluation
  async getPanels(phaseNumber?: 1 | 2 | 3): Promise<Panel[]> {
    const store = loadStore();
    if (phaseNumber) {
      return store.panels.filter((p) => p.phase_number === phaseNumber);
    }
    return store.panels;
  },

  async getPanelById(id: string): Promise<Panel | null> {
    const store = loadStore();
    return store.panels.find((p) => p.id === id) || null;
  },

  async getPanelMembers(panelId: string): Promise<PanelMember[]> {
    const store = loadStore();
    return store.panel_members.filter((pm) => pm.panel_id === panelId);
  },

  async createPanel(
    panelNumber: number,
    panelName: string,
    phaseNumber: 1 | 2 | 3,
    teamRangeStart: number,
    teamRangeEnd: number,
    supervisorIds: string[],
    schedule: { date: string; timeWindow: string; academicBlock: string; roomNumber: string }
  ): Promise<Panel> {
    const store = loadStore();
    const panelId = crypto.randomUUID();
    const now = new Date().toISOString();

    const panel: Panel = {
      id: panelId,
      panel_number: panelNumber,
      panel_name: panelName,
      phase_number: phaseNumber,
      date: schedule.date,
      time_window: schedule.timeWindow,
      academic_block: schedule.academicBlock,
      room_number: schedule.roomNumber,
      team_range_start: teamRangeStart,
      team_range_end: teamRangeEnd,
      created_at: now,
    };
    store.panels.push(panel);

    for (const supId of supervisorIds) {
      store.panel_members.push({
        id: crypto.randomUUID(),
        panel_id: panelId,
        supervisor_id: supId,
        created_at: now,
      });
    }

    saveStore(store);
    return panel;
  },

  async updatePanelSchedule(
    panelNumber: number,
    phaseNumber: 1 | 2 | 3,
    schedule: { date: string; timeWindow: string; academicBlock: string; roomNumber: string }
  ): Promise<Panel | null> {
    const store = loadStore();
    const panel = store.panels.find((p) => p.panel_number === panelNumber && p.phase_number === phaseNumber);
    if (!panel) return null;

    panel.date = schedule.date;
    panel.time_window = schedule.timeWindow;
    panel.academic_block = schedule.academicBlock;
    panel.room_number = schedule.roomNumber;
    saveStore(store);
    return panel;
  },

  async getEvaluations(phaseNumber: 1 | 2 | 3, teamId?: string): Promise<Evaluation[]> {
    const store = loadStore();
    return store.evaluations.filter(
      (e) => e.phase_number === phaseNumber && (!teamId || e.team_id === teamId)
    );
  },

  async saveEvaluation(
    phaseNumber: 1 | 2 | 3,
    teamId: string,
    studentId: string,
    panelMemberId: string,
    score: number | null,
    isAbsent: boolean,
    remarks?: string
  ): Promise<Evaluation> {
    const store = loadStore();
    const now = new Date().toISOString();
    const idx = store.evaluations.findIndex(
      (e) =>
        e.phase_number === phaseNumber &&
        e.student_id === studentId &&
        e.panel_member_id === panelMemberId
    );

    if (idx !== -1) {
      store.evaluations[idx] = {
        ...store.evaluations[idx],
        score: isAbsent ? null : score,
        is_absent: isAbsent,
        remarks: remarks || null,
        submitted_at: now,
      };
      saveStore(store);
      return store.evaluations[idx];
    } else {
      const evaluation: Evaluation = {
        id: crypto.randomUUID(),
        phase_number: phaseNumber,
        team_id: teamId,
        student_id: studentId,
        panel_member_id: panelMemberId,
        score: isAbsent ? null : score,
        is_absent: isAbsent,
        remarks: remarks || null,
        submitted_at: now,
      };
      store.evaluations.push(evaluation);
      saveStore(store);
      return evaluation;
    }
  },

  // Notifications
  async createNotification(payload: NotificationPayload): Promise<NotificationItem> {
    const store = loadStore();
    const item: NotificationItem = {
      id: crypto.randomUUID(),
      user_id: payload.userId,
      category: payload.category,
      subject: payload.subject,
      salutation: payload.salutation,
      body: payload.body,
      signoff: payload.signoff || 'Sincerely,\nProject Evaluation Committee\nCodeShastra ProjectHub',
      is_read: false,
      created_at: new Date().toISOString(),
    };
    store.notifications.unshift(item);
    saveStore(store);
    return item;
  },

  async getNotificationsByUser(userId: string): Promise<NotificationItem[]> {
    const store = loadStore();
    return store.notifications.filter((n) => n.user_id === userId);
  },

  async markNotificationAsRead(id: string): Promise<boolean> {
    const store = loadStore();
    const notif = store.notifications.find((n) => n.id === id);
    if (notif) {
      notif.is_read = true;
      saveStore(store);
      return true;
    }
    return false;
  },

  async markAllNotificationsRead(userId: string): Promise<boolean> {
    const store = loadStore();
    let changed = false;
    for (const n of store.notifications) {
      if (n.user_id === userId && !n.is_read) {
        n.is_read = true;
        changed = true;
      }
    }
    if (changed) saveStore(store);
    return true;
  },
};
