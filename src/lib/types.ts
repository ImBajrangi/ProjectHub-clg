export type UserRole = 'leader' | 'supervisor' | 'panel' | 'admin';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  is_leader?: boolean;
  active_session_token?: string | null;
  active_session_device?: string | null;
  active_session_at?: string | null;
  reset_token?: string | null;
  reset_token_expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupervisorProfile {
  id: string;
  employee_id: string;
  designation?: string;
  department?: string;
  created_at: string;
}

export interface Student {
  id: string;
  roll_no: string;
  full_name: string;
  email: string;
  mobile: string;
  cpi?: number | null;
  course: string;
  section: string;
  team_id: string;
  user_id?: string | null;
  is_leader: boolean;
  created_at: string;
}

export interface Team {
  id: string;
  team_code: string; // e.g. "BCA-1", "DS-1"
  team_name: string; // e.g. "Team BCA-1"
  team_number: number;
  program: string; // "BCA" | "BCA - DS"
  supervisor_id: string;
  leader_id?: string | null;
  phase1_approved: boolean;
  phase2_approved: boolean;
  phase3_approved: boolean;
  phase3_report_clearance: boolean;
  report_url?: string | null;
  paper_url?: string | null;
  report_uploaded_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type ProblemStatementStatus = 'pending' | 'revision_requested' | 'approved';

export interface ProblemStatement {
  id: string;
  team_id: string;
  title: string;
  description: string;
  status: ProblemStatementStatus;
  supervisor_remarks?: string | null;
  locked: boolean;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type MeetingStatus = 'requested' | 'scheduled' | 'completed' | 'cancelled';

export interface Meeting {
  id: string;
  team_id: string;
  supervisor_id: string;
  meeting_index: number;
  status: MeetingStatus;
  requested_at: string;
  scheduled_date?: string | null;
  time_slot?: string | null;
  venue?: string | null; // Physical Room / Cabin OR Google Meet URL
  summary_notes?: string | null;
  action_directives?: string | null;
  completed_at?: string | null;
  created_at: string;
  attendance?: MeetingAttendance[];
}

export interface MeetingAttendance {
  id: string;
  meeting_id: string;
  student_id: string;
  is_present: boolean;
  created_at: string;
}

export interface EvaluationPhase {
  id: string;
  phase_number: 1 | 2 | 3;
  phase_name: string;
  description?: string;
  is_live: boolean;
  updated_at: string;
}

export interface Panel {
  id: string;
  panel_number: number;
  panel_name: string;
  phase_number: 1 | 2 | 3;
  date?: string | null;
  time_window?: string | null; // e.g. "09:00 AM - 01:00 PM"
  academic_block?: string | null; // e.g. "AB1", "AB2"
  room_number?: string | null; // e.g. "Room 402"
  team_range_start?: number | null;
  team_range_end?: number | null;
  team_codes?: string[];
  created_at: string;
}

export interface PanelMember {
  id: string;
  panel_id: string;
  supervisor_id: string;
  created_at: string;
}

export interface Evaluation {
  id: string;
  phase_number: 1 | 2 | 3;
  team_id: string;
  student_id: string;
  panel_member_id: string;
  score?: number | null; // 0 to 10
  is_absent: boolean;
  remarks?: string | null;
  submitted_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  salutation: string;
  body: string;
  signoff: string;
  is_read: boolean;
  created_at: string;
}

export interface PushSubscriptionItem {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}
