import { createClient } from '@supabase/supabase-js';
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
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

export interface DatabaseStore {
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

// --------------------------------------------------------------------------
// Ultra-Fast In-Memory Layer with Zero-Latency Response & In-Place Updates
// --------------------------------------------------------------------------
let memoryStore: DatabaseStore | null = null;
let lastStoreFetch = 0;
let isFetchingStore = false;
const STORE_TTL_MS = 60000; // 60 seconds warm TTL with background refresh

async function fetchFreshStore(): Promise<DatabaseStore> {
  const [
    usersRes,
    supervisorsRes,
    teamsRes,
    studentsRes,
    psRes,
    meetingsRes,
    meetingAttRes,
    phasesRes,
    panelsRes,
    panelMembersRes,
    evalsRes,
    notifsRes,
    pushSubsRes,
  ] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('supervisors').select('*'),
    supabase.from('teams').select('*').order('team_number', { ascending: true }),
    supabase.from('students').select('*').order('roll_no', { ascending: true }),
    supabase.from('problem_statements').select('*'),
    supabase.from('meetings').select('*'),
    supabase.from('meeting_attendance').select('*'),
    supabase.from('evaluation_phases').select('*').order('phase_number', { ascending: true }),
    supabase.from('panels').select('*'),
    supabase.from('panel_members').select('*'),
    supabase.from('evaluations').select('*'),
    supabase.from('notifications').select('*').order('created_at', { ascending: false }),
    supabase.from('push_subscriptions').select('*'),
  ]);

  const fresh: DatabaseStore = {
    users: usersRes.data || [],
    supervisors: supervisorsRes.data || [],
    teams: (teamsRes.data || []).map((t: any) => ({
      ...t,
      team_name: `Team ${t.team_code}`,
    })),
    students: studentsRes.data || [],
    problem_statements: psRes.data || [],
    meetings: meetingsRes.data || [],
    meeting_attendance: meetingAttRes.data || [],
    evaluation_phases: (phasesRes.data && phasesRes.data.length > 0
      ? phasesRes.data.map((p: any) => ({
          ...p,
          target_date:
            p.phase_number === 1
              ? '19-Sep'
              : p.phase_number === 2
              ? '17-Oct'
              : 'Final Defense',
          marks_weightage:
            p.phase_number === 1 ? 20 : p.phase_number === 2 ? 40 : 40,
          deliverables:
            p.phase_number === 1
              ? '30% Coding / Approval & Pitch Deck'
              : p.phase_number === 2
              ? '70% Coding / Technical Demo'
              : 'Report + Certificate / Synopsis',
          phase_name:
            p.phase_name ||
            (p.phase_number === 1
              ? '1st Presentation (30% Coding)'
              : p.phase_number === 2
              ? '2nd Presentation (70% Coding)'
              : 'Final Presentation (Defense & Report)'),
        }))
      : [
          {
            id: 'phase-1',
            phase_number: 1 as const,
            phase_name: '1st Presentation (30% Coding)',
            description: '19-Sep • 20 Marks • 30% coding implementation & supervisor topic approval',
            target_date: '19-Sep',
            marks_weightage: 20,
            deliverables: '30% Coding / Approval & Pitch Deck',
            is_live: true,
            updated_at: new Date().toISOString(),
          },
          {
            id: 'phase-2',
            phase_number: 2 as const,
            phase_name: '2nd Presentation (70% Coding)',
            description: '17-Oct • 40 Marks • 70% coding progress & technical implementation demo',
            target_date: '17-Oct',
            marks_weightage: 40,
            deliverables: '70% Coding / Technical Demo',
            is_live: false,
            updated_at: new Date().toISOString(),
          },
          {
            id: 'phase-3',
            phase_number: 3 as const,
            phase_name: 'Final Presentation (Defense & Report)',
            description: 'Final Defense • 40 Marks • Complete project defense, formal report, certificate & synopsis',
            target_date: 'Final Defense',
            marks_weightage: 40,
            deliverables: 'Report + Certificate / Synopsis',
            is_live: false,
            updated_at: new Date().toISOString(),
          },
        ]),
    panels: panelsRes.data || [],
    panel_members: panelMembersRes.data || [],
    evaluations: evalsRes.data || [],
    notifications: notifsRes.data || [],
    push_subscriptions: pushSubsRes.data || [],
  };

  memoryStore = fresh;
  lastStoreFetch = Date.now();
  return fresh;
}

// Background non-blocking refresh
function triggerBackgroundRefresh() {
  if (isFetchingStore) return;
  isFetchingStore = true;
  fetchFreshStore()
    .catch((err) => console.error('Background store refresh error:', err))
    .finally(() => {
      isFetchingStore = false;
    });
}

// --------------------------------------------------------------------------
// Unified Supabase Database Access Methods (Instant < 1ms Memory Fallback)
// --------------------------------------------------------------------------

export const db = {
  // Store management
  async getStore(): Promise<DatabaseStore> {
    const now = Date.now();
    if (memoryStore && now - lastStoreFetch < STORE_TTL_MS) {
      return memoryStore;
    }
    if (memoryStore) {
      // Stale-while-revalidate: return instantly and refresh in background
      triggerBackgroundRefresh();
      return memoryStore;
    }
    return await fetchFreshStore();
  },

  // Users & Auth
  async getUserByEmail(email: string): Promise<User | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (memoryStore) {
      const found = memoryStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (found) return found;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (error || !data) return null;
    if (memoryStore && !memoryStore.users.some((u) => u.id === data.id)) {
      memoryStore.users.push(data as User);
    }
    return data as User;
  },

  async getUserById(id: string): Promise<User | null> {
    if (memoryStore) {
      const found = memoryStore.users.find((u) => u.id === id);
      if (found) return found;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    if (memoryStore && !memoryStore.users.some((u) => u.id === data.id)) {
      memoryStore.users.push(data as User);
    }
    return data as User;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Update memory immediately (0ms)
    if (memoryStore) {
      const idx = memoryStore.users.findIndex((u) => u.id === id);
      if (idx !== -1) {
        memoryStore.users[idx] = { ...memoryStore.users[idx], ...payload };
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return data as User;
  },

  // Teams
  async getTeams(): Promise<Team[]> {
    if (memoryStore) {
      return memoryStore.teams;
    }
    const store = await this.getStore();
    return store.teams;
  },

  async getTeamById(id: string): Promise<Team | null> {
    if (memoryStore) {
      const found = memoryStore.teams.find((t) => t.id === id);
      if (found) return found;
    }
    const store = await this.getStore();
    return store.teams.find((t) => t.id === id) || null;
  },

  async getTeamsBySupervisor(supervisorId: string): Promise<Team[]> {
    if (memoryStore) {
      return memoryStore.teams.filter((t) => t.supervisor_id === supervisorId);
    }
    const store = await this.getStore();
    return store.teams.filter((t) => t.supervisor_id === supervisorId);
  },

  async getTeamByLeaderId(leaderId: string): Promise<Team | null> {
    if (memoryStore) {
      const found = memoryStore.teams.find((t) => t.leader_id === leaderId);
      if (found) return found;
    }
    const store = await this.getStore();
    return store.teams.find((t) => t.leader_id === leaderId) || null;
  },

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | null> {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    delete (payload as any).team_name;

    // Update memory immediately (0ms)
    if (memoryStore) {
      const idx = memoryStore.teams.findIndex((t) => t.id === id);
      if (idx !== -1) {
        memoryStore.teams[idx] = {
          ...memoryStore.teams[idx],
          ...payload,
          team_name: `Team ${memoryStore.teams[idx].team_code}`,
        };
      }
    }

    const { data, error } = await supabase
      .from('teams')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      team_name: `Team ${data.team_code}`,
    } as Team;
  },

  // Students & Public Leader Activation (/leader)
  async getStudentsByTeam(teamId: string): Promise<Student[]> {
    if (memoryStore) {
      return memoryStore.students.filter((s) => s.team_id === teamId);
    }
    const store = await this.getStore();
    return store.students.filter((s) => s.team_id === teamId);
  },

  async getAvailableTeamsForLeader(): Promise<{ id: string; team_code: string; team_name: string; program: string }[]> {
    const store = await this.getStore();
    return store.teams
      .filter((t) => !t.leader_id)
      .map((t) => ({
        id: t.id,
        team_code: t.team_code,
        team_name: `Team ${t.team_code}`,
        program: t.program,
      }));
  },

  async claimTeamLeader(teamId: string, studentEmail: string): Promise<{ success: boolean; error?: string; user?: User }> {
    const store = await this.getStore();
    const team = store.teams.find((t) => t.id === teamId);

    if (!team) {
      return { success: false, error: 'Team not found' };
    }
    if (team.leader_id) {
      return { success: false, error: 'A leader has already been registered for this team' };
    }

    const cleanEmail = studentEmail.toLowerCase().trim();
    const student = store.students.find((s) => s.team_id === teamId && s.email.toLowerCase() === cleanEmail);

    if (!student) {
      return { success: false, error: 'Student does not belong to this team' };
    }

    const now = new Date().toISOString();
    const passwordHash = bcrypt.hashSync(student.mobile.trim(), 10);
    const userId = crypto.randomUUID();

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      password_hash: passwordHash,
      role: 'leader',
      full_name: student.full_name,
      phone: student.mobile,
      is_leader: true,
      created_at: now,
      updated_at: now,
    };

    // Update memory store immediately (0ms)
    store.users.push(newUser);
    student.is_leader = true;
    student.user_id = userId;
    team.leader_id = userId;
    team.updated_at = now;

    // Persist to Supabase
    await supabase.from('users').insert(newUser);
    await supabase.from('students').update({ is_leader: true, user_id: userId }).eq('id', student.id);
    await supabase.from('teams').update({ leader_id: userId, updated_at: now }).eq('id', teamId);

    return { success: true, user: newUser };
  },

  // Problem Statements
  async getProblemStatementByTeam(teamId: string): Promise<ProblemStatement | null> {
    if (memoryStore) {
      const found = memoryStore.problem_statements.find((p) => p.team_id === teamId);
      if (found) return found;
    }
    const store = await this.getStore();
    return store.problem_statements.find((p) => p.team_id === teamId) || null;
  },

  async saveProblemStatement(
    teamId: string,
    title: string,
    description: string
  ): Promise<{ success: boolean; error?: string; problemStatement?: ProblemStatement }> {
    const store = await this.getStore();
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

      // Update Supabase in parallel
      supabase
        .from('problem_statements')
        .update({
          title,
          description,
          status: 'pending',
          updated_at: now,
        })
        .eq('id', existing.id)
        .then();

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
      supabase.from('problem_statements').insert(ps).then();

      return { success: true, problemStatement: ps };
    }
  },

  async reviewProblemStatement(
    teamId: string,
    action: 'approve' | 'revise',
    remarks?: string
  ): Promise<{ success: boolean; error?: string; problemStatement?: ProblemStatement }> {
    const store = await this.getStore();
    const existing = store.problem_statements.find((p) => p.team_id === teamId);

    if (!existing) {
      return { success: false, error: 'Problem statement not found' };
    }

    const now = new Date().toISOString();
    if (action === 'approve') {
      existing.status = 'approved';
      existing.locked = true;
      existing.approved_at = now;
      existing.supervisor_remarks = remarks || 'Approved without modifications.';
      existing.updated_at = now;
    } else {
      existing.status = 'revision_requested';
      existing.supervisor_remarks = remarks || 'Revisions required.';
      existing.updated_at = now;
    }

    supabase
      .from('problem_statements')
      .update({
        status: existing.status,
        locked: existing.locked,
        approved_at: existing.approved_at,
        supervisor_remarks: existing.supervisor_remarks,
        updated_at: now,
      })
      .eq('team_id', teamId)
      .then();

    return { success: true, problemStatement: existing };
  },

  // Meetings
  async getMeetingsByTeam(teamId: string): Promise<Meeting[]> {
    const store = await this.getStore();
    return store.meetings
      .filter((m) => m.team_id === teamId)
      .sort((a, b) => a.meeting_index - b.meeting_index)
      .map((m) => ({
        ...m,
        attendance: store.meeting_attendance.filter((a) => a.meeting_id === m.id),
      }));
  },

  async getMeetingsBySupervisor(supervisorId: string): Promise<Meeting[]> {
    const store = await this.getStore();
    return store.meetings
      .filter((m) => m.supervisor_id === supervisorId)
      .sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime())
      .map((m) => ({
        ...m,
        attendance: store.meeting_attendance.filter((a) => a.meeting_id === m.id),
      }));
  },

  async getMeetingAttendance(meetingId: string): Promise<MeetingAttendance[]> {
    const store = await this.getStore();
    return store.meeting_attendance.filter((a) => a.meeting_id === meetingId);
  },

  async getMeetingById(meetingId: string): Promise<Meeting | null> {
    const store = await this.getStore();
    return store.meetings.find((m) => m.id === meetingId) || null;
  },

  async createMeetingRequest(teamId: string, supervisorId: string): Promise<Meeting> {
    const store = await this.getStore();
    const existing = store.meetings.filter((m) => m.team_id === teamId);
    const nextIndex = existing.length + 1;
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
    supabase.from('meetings').insert(m).then();
    return m;
  },

  async createAndScheduleMeeting(
    teamId: string,
    supervisorId: string,
    scheduledDate: string,
    timeSlot: string,
    venue: string
  ): Promise<Meeting> {
    const store = await this.getStore();
    const existing = store.meetings.filter((m) => m.team_id === teamId);
    const nextIndex = existing.length + 1;
    const now = new Date().toISOString();

    const m: Meeting = {
      id: crypto.randomUUID(),
      team_id: teamId,
      supervisor_id: supervisorId,
      meeting_index: nextIndex,
      status: 'scheduled',
      requested_at: now,
      scheduled_date: scheduledDate,
      time_slot: timeSlot,
      venue,
      created_at: now,
    };

    store.meetings.push(m);
    supabase.from('meetings').insert(m).then();
    return m;
  },

  async scheduleMeeting(
    meetingId: string,
    scheduledDate: string,
    timeSlot: string,
    venue: string
  ): Promise<{ success: boolean; meeting?: Meeting }> {
    const store = await this.getStore();
    const meeting = store.meetings.find((m) => m.id === meetingId);

    if (!meeting) {
      return { success: false };
    }

    meeting.status = 'scheduled';
    meeting.scheduled_date = scheduledDate;
    meeting.time_slot = timeSlot;
    meeting.venue = venue;

    supabase
      .from('meetings')
      .update({
        status: 'scheduled',
        scheduled_date: scheduledDate,
        time_slot: timeSlot,
        venue,
      })
      .eq('id', meetingId)
      .then();

    return { success: true, meeting };
  },

  async cancelMeetingRequest(
    meetingId: string,
    teamId: string
  ): Promise<{ success: boolean; error?: string }> {
    const store = await this.getStore();
    const meetingIndex = store.meetings.findIndex((m) => m.id === meetingId && m.team_id === teamId);

    if (meetingIndex === -1) {
      return { success: false, error: 'Meeting request not found.' };
    }

    const meeting = store.meetings[meetingIndex];
    if (meeting.status !== 'requested') {
      return { success: false, error: 'Cannot cancel a meeting that is already scheduled or completed.' };
    }

    // Remove from in-memory store
    store.meetings.splice(meetingIndex, 1);

    // Delete from Supabase
    supabase.from('meetings').delete().eq('id', meetingId).then();

    return { success: true };
  },

  async logMeetingRecord(
    meetingId: string,
    summaryNotes: string,
    actionDirectives: string,
    attendanceRecords: { studentId: string; isPresent: boolean }[]
  ): Promise<{ success: boolean; meeting?: Meeting }> {
    const store = await this.getStore();
    const meeting = store.meetings.find((m) => m.id === meetingId);

    if (!meeting) return { success: false };

    const now = new Date().toISOString();
    meeting.status = 'completed';
    meeting.summary_notes = summaryNotes;
    meeting.action_directives = actionDirectives;
    meeting.completed_at = now;

    // Update in-memory attendance
    for (const att of attendanceRecords) {
      const existingAtt = store.meeting_attendance.find(
        (a) => a.meeting_id === meetingId && a.student_id === att.studentId
      );
      if (existingAtt) {
        existingAtt.is_present = att.isPresent;
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

    // Persist to Supabase
    supabase
      .from('meetings')
      .update({
        status: 'completed',
        summary_notes: summaryNotes,
        action_directives: actionDirectives,
        completed_at: now,
      })
      .eq('id', meetingId)
      .then();

    for (const att of attendanceRecords) {
      supabase.from('meeting_attendance').upsert(
        {
          meeting_id: meetingId,
          student_id: att.studentId,
          is_present: att.isPresent,
          created_at: now,
        },
        { onConflict: 'meeting_id,student_id' }
      ).then();
    }

    return { success: true, meeting };
  },

  // Phases & Gatekeeping
  async getPhases(): Promise<EvaluationPhase[]> {
    const store = await this.getStore();
    return store.evaluation_phases.sort((a, b) => a.phase_number - b.phase_number);
  },

  async setPhaseLive(phaseNumber: 1 | 2 | 3, isLive: boolean): Promise<EvaluationPhase | null> {
    const store = await this.getStore();
    const phase = store.evaluation_phases.find((p) => p.phase_number === phaseNumber);
    const now = new Date().toISOString();

    if (phase) {
      phase.is_live = isLive;
      phase.updated_at = now;
    }

    supabase
      .from('evaluation_phases')
      .update({ is_live: isLive, updated_at: now })
      .eq('phase_number', phaseNumber)
      .then();

    return phase || null;
  },

  async setTeamPhaseApproval(
    teamId: string,
    phaseNumber: 1 | 2 | 3,
    approved: boolean
  ): Promise<Team | null> {
    const store = await this.getStore();
    const team = store.teams.find((t) => t.id === teamId);
    const now = new Date().toISOString();

    if (team) {
      if (phaseNumber === 1) team.phase1_approved = approved;
      if (phaseNumber === 2) team.phase2_approved = approved;
      if (phaseNumber === 3) team.phase3_approved = approved;
      team.updated_at = now;
    }

    const updates: any = { updated_at: now };
    if (phaseNumber === 1) updates.phase1_approved = approved;
    if (phaseNumber === 2) updates.phase2_approved = approved;
    if (phaseNumber === 3) updates.phase3_approved = approved;

    supabase.from('teams').update(updates).eq('id', teamId).then();

    return team || null;
  },

  // Panels & Evaluation
  async getPanels(phaseNumber?: 1 | 2 | 3): Promise<Panel[]> {
    const store = await this.getStore();
    let panels = store.panels;
    if (phaseNumber) {
      panels = panels.filter((p) => p.phase_number === phaseNumber);
    }
    return panels.sort((a, b) => a.panel_number - b.panel_number);
  },

  async getPanelById(id: string): Promise<Panel | null> {
    const store = await this.getStore();
    return store.panels.find((p) => p.id === id) || null;
  },

  async getPanelMembers(panelId: string): Promise<PanelMember[]> {
    const store = await this.getStore();
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
    const store = await this.getStore();
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
    supabase.from('panels').insert(panel).then();

    for (const supId of supervisorIds) {
      const pm: PanelMember = {
        id: crypto.randomUUID(),
        panel_id: panelId,
        supervisor_id: supId,
        created_at: now,
      };
      store.panel_members.push(pm);
      supabase.from('panel_members').insert(pm).then();
    }

    return panel;
  },

  async upsertPanel(
    panelNumber: number,
    panelName: string,
    phaseNumber: 1 | 2 | 3,
    teamRangeStart: number,
    teamRangeEnd: number,
    supervisorIds: string[],
    schedule: { date: string; timeWindow: string; academicBlock: string; roomNumber: string }
  ): Promise<Panel> {
    const store = await this.getStore();
    const existing = store.panels.find(
      (p) => p.panel_number === panelNumber && p.phase_number === phaseNumber
    );
    const now = new Date().toISOString();

    if (existing) {
      existing.panel_name = panelName;
      existing.date = schedule.date;
      existing.time_window = schedule.timeWindow;
      existing.academic_block = schedule.academicBlock;
      existing.room_number = schedule.roomNumber;
      existing.team_range_start = teamRangeStart;
      existing.team_range_end = teamRangeEnd;

      // Update panel members: remove old, insert new
      store.panel_members = store.panel_members.filter((pm) => pm.panel_id !== existing.id);
      for (const supId of supervisorIds) {
        const pm: PanelMember = {
          id: crypto.randomUUID(),
          panel_id: existing.id,
          supervisor_id: supId,
          created_at: now,
        };
        store.panel_members.push(pm);
      }

      supabase
        .from('panels')
        .update({
          panel_name: panelName,
          date: schedule.date,
          time_window: schedule.timeWindow,
          academic_block: schedule.academicBlock,
          room_number: schedule.roomNumber,
          team_range_start: teamRangeStart,
          team_range_end: teamRangeEnd,
        })
        .eq('id', existing.id)
        .then();

      supabase
        .from('panel_members')
        .delete()
        .eq('panel_id', existing.id)
        .then(() => {
          const newMembers = supervisorIds.map((supId) => ({
            id: crypto.randomUUID(),
            panel_id: existing.id,
            supervisor_id: supId,
            created_at: now,
          }));
          if (newMembers.length > 0) {
            supabase.from('panel_members').insert(newMembers).then();
          }
        });

      return existing;
    } else {
      return this.createPanel(
        panelNumber,
        panelName,
        phaseNumber,
        teamRangeStart,
        teamRangeEnd,
        supervisorIds,
        schedule
      );
    }
  },

  async updatePanelSchedule(
    panelNumber: number,
    phaseNumber: 1 | 2 | 3,
    schedule: { date: string; timeWindow: string; academicBlock: string; roomNumber: string }
  ): Promise<Panel | null> {
    const store = await this.getStore();
    const panel = store.panels.find(
      (p) => p.panel_number === panelNumber && p.phase_number === phaseNumber
    );

    if (panel) {
      panel.date = schedule.date;
      panel.time_window = schedule.timeWindow;
      panel.academic_block = schedule.academicBlock;
      panel.room_number = schedule.roomNumber;
    }

    supabase
      .from('panels')
      .update({
        date: schedule.date,
        time_window: schedule.timeWindow,
        academic_block: schedule.academicBlock,
        room_number: schedule.roomNumber,
      })
      .eq('panel_number', panelNumber)
      .eq('phase_number', phaseNumber)
      .then();

    return panel || null;
  },

  async deletePanel(panelId: string): Promise<boolean> {
    const store = await this.getStore();
    store.panels = store.panels.filter((p) => p.id !== panelId);
    store.panel_members = store.panel_members.filter((pm) => pm.panel_id !== panelId);

    supabase.from('panels').delete().eq('id', panelId).then();
    supabase.from('panel_members').delete().eq('panel_id', panelId).then();
    return true;
  },

  async getEvaluations(phaseNumber: 1 | 2 | 3, teamId?: string): Promise<Evaluation[]> {
    const store = await this.getStore();
    let evals = store.evaluations.filter((e) => e.phase_number === phaseNumber);
    if (teamId) {
      evals = evals.filter((e) => e.team_id === teamId);
    }
    return evals;
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
    const store = await this.getStore();
    const now = new Date().toISOString();

    const existingIdx = store.evaluations.findIndex(
      (e) =>
        e.phase_number === phaseNumber &&
        e.student_id === studentId &&
        e.panel_member_id === panelMemberId
    );

    const payload: Evaluation = {
      id: existingIdx !== -1 ? store.evaluations[existingIdx].id : crypto.randomUUID(),
      phase_number: phaseNumber,
      team_id: teamId,
      student_id: studentId,
      panel_member_id: panelMemberId,
      score: isAbsent ? null : score,
      is_absent: isAbsent,
      remarks: remarks || null,
      submitted_at: now,
    };

    if (existingIdx !== -1) {
      store.evaluations[existingIdx] = payload;
    } else {
      store.evaluations.push(payload);
    }

    supabase
      .from('evaluations')
      .upsert(payload, { onConflict: 'phase_number,student_id,panel_member_id' })
      .then();

    return payload;
  },

  // Notifications
  async createNotification(payload: NotificationPayload): Promise<NotificationItem> {
    const store = await this.getStore();
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
    supabase.from('notifications').insert(item).then();
    return item;
  },

  async getNotificationsByUser(userId: string): Promise<NotificationItem[]> {
    const store = await this.getStore();
    return store.notifications
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async markNotificationAsRead(id: string): Promise<boolean> {
    const store = await this.getStore();
    const notif = store.notifications.find((n) => String(n.id) === String(id));
    if (notif) {
      notif.is_read = true;
    }

    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } catch (err) {
      console.error('Error updating notification read state in supabase:', err);
    }
    return true;
  },

  async markAllNotificationsRead(userId: string): Promise<boolean> {
    const store = await this.getStore();
    store.notifications
      .filter((n) => String(n.user_id) === String(userId))
      .forEach((n) => (n.is_read = true));

    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
    } catch (err) {
      console.error('Error updating markAllNotificationsRead in supabase:', err);
    }
    return true;
  },
};
