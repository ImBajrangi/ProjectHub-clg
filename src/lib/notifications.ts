import { NotificationItem } from './types';

export interface NotificationPayload {
  userId: string;
  category: string;
  subject: string;
  salutation: string;
  body: string;
  signoff?: string;
}

const DEFAULT_SIGNOFF = `Sincerely,\nProject Evaluation Committee\nCodeShastra ProjectHub`;

export const NotificationTemplates = {
  // Category A: Problem Statement Lifecycle
  problemStatementApproved: (params: {
    userId: string;
    leaderName: string;
    teamName: string;
    title: string;
    supervisorName: string;
    supervisorPhone: string;
    timestamp: string;
  }): NotificationPayload => ({
    userId: params.userId,
    category: 'Category A: Problem Statement Lifecycle',
    subject: `Problem Statement Approved: ${params.teamName} - CodeShastra ProjectHub`,
    salutation: `Dear ${params.leaderName} (${params.teamName}),`,
    body: `This is to inform you that your proposed Project Problem Statement has been officially reviewed and approved by your project supervisor.

Approval Details:
- Project Title: ${params.title}
- Supervisor: ${params.supervisorName}
- Supervisor Phone: ${params.supervisorPhone}
- Approval Timestamp: ${params.timestamp}
- Status: Finalized & Locked

Please note that your problem statement has now been permanently locked in the portal and cannot be edited. You may now proceed with phase-wise development under your supervisor's guidance.`,
    signoff: DEFAULT_SIGNOFF,
  }),

  problemStatementRevisionRequested: (params: {
    userId: string;
    leaderName: string;
    teamName: string;
    title: string;
    supervisorName: string;
    supervisorPhone: string;
    remarks: string;
  }): NotificationPayload => ({
    userId: params.userId,
    category: 'Category A: Problem Statement Lifecycle',
    subject: `Action Required: Revision Requested for Problem Statement - ${params.teamName}`,
    salutation: `Dear ${params.leaderName} (${params.teamName}),`,
    body: `Your project supervisor has reviewed your submitted Problem Statement and requested modifications before it can be finalized.

Review Details:
- Current Title: ${params.title}
- Supervisor: ${params.supervisorName}
- Supervisor Phone: ${params.supervisorPhone}
- Feedback / Remarks: ${params.remarks}

Please log in to your Team Leader dashboard, revise the problem statement according to the feedback, and resubmit it for final approval.`,
    signoff: DEFAULT_SIGNOFF,
  }),

  // Category B: Meeting Logistics & Records
  meetingScheduled: (params: {
    userId: string;
    leaderName: string;
    teamName: string;
    supervisorName: string;
    supervisorEmail: string;
    supervisorPhone: string;
    date: string;
    timeSlot: string;
    venue: string;
  }): NotificationPayload => ({
    userId: params.userId,
    category: 'Category B: Meeting Logistics & Records',
    subject: `Meeting Scheduled: Project Discussion with Supervisor - ${params.teamName}`,
    salutation: `Dear ${params.leaderName} (${params.teamName}),`,
    body: `This is to inform you that your meeting with your project supervisor has been scheduled. Please find the details below:

Meeting Logistics:
- Supervisor: ${params.supervisorName}
- Email: ${params.supervisorEmail}
- Phone: ${params.supervisorPhone}
- Date: ${params.date}
- Time Slot: ${params.timeSlot}
- Venue / Room Number / Link: ${params.venue}
- Agenda: Project Discussion & Review

Kindly ensure that all team members are present on time for the meeting. Arrive prepared with your current progress, documentation, and technical queries.`,
    signoff: DEFAULT_SIGNOFF,
  }),

  meetingRecordLogged: (params: {
    userId: string;
    leaderName: string;
    teamName: string;
    meetingLabel: string;
    date: string;
    supervisorName: string;
    supervisorPhone: string;
    membersPresent: string;
    membersAbsent: string;
    summary: string;
  }): NotificationPayload => ({
    userId: params.userId,
    category: 'Category B: Meeting Logistics & Records',
    subject: `Meeting Record Logged: ${params.meetingLabel} - ${params.teamName}`,
    salutation: `Dear ${params.leaderName} (${params.teamName}),`,
    body: `Your supervisor has officially recorded the attendance and summary notes for your recent review session in the system.

Session Summary:
- Meeting Label: ${params.meetingLabel}
- Date Conducted: ${params.date}
- Supervisor: ${params.supervisorName}
- Supervisor Phone: ${params.supervisorPhone}
- Members Present: ${params.membersPresent}
- Members Absent: ${params.membersAbsent}
- Summary & Directives: ${params.summary}

This record has been permanently archived in your project tracking log on your dashboard.`,
    signoff: DEFAULT_SIGNOFF,
  }),

  newMeetingRequest: (params: {
    supervisorUserId: string;
    supervisorName: string;
    teamName: string;
    leaderName: string;
    leaderPhone: string;
    leaderEmail: string;
    timestamp: string;
  }): NotificationPayload => ({
    userId: params.supervisorUserId,
    category: 'Category B: Meeting Logistics & Records',
    subject: `New Meeting Request from ${params.teamName} - CodeShastra ProjectHub`,
    salutation: `Dear Prof. ${params.supervisorName},`,
    body: `This is to inform you that ${params.teamName} has initiated a meeting request via their student portal to discuss their project progress.

Request Summary:
- Team: ${params.teamName}
- Team Leader: ${params.leaderName}
- Leader Contact: ${params.leaderPhone} | ${params.leaderEmail}
- Request Timestamp: ${params.timestamp}

Please access your Supervisor Portal to confirm your availability, assign a date, time slot, and venue (or Google Meet URL) to schedule the session.`,
    signoff: DEFAULT_SIGNOFF,
  }),

  // Category C: Milestone Presentations & Panel Logistics
  clearanceGranted: (params: {
    userId: string;
    leaderName: string;
    teamName: string;
    phaseName: string; // e.g., "Phase 1 (PPT)"
    phaseNumber: number;
    supervisorName: string;
    supervisorPhone: string;
  }): NotificationPayload => ({
    userId: params.userId,
    category: 'Category C: Milestone Presentations & Panel Logistics',
    subject: `Clearance Granted: Eligibility Confirmed for Phase ${params.phaseNumber} Presentation`,
    salutation: `Dear ${params.leaderName} (${params.teamName}),`,
    body: `Your project supervisor has granted formal permission for your team to present in the upcoming Phase ${params.phaseNumber} evaluation round.

Clearance Details:
- Milestone: ${params.phaseName}
- Supervisor: ${params.supervisorName}
- Supervisor Phone: ${params.supervisorPhone}
- Eligibility Status: Approved to Present

Your team will be scheduled to appear before the assigned evaluation panel during the live evaluation window set by the Project Incharge.`,
    signoff: DEFAULT_SIGNOFF,
  }),

  evaluationSchedulePublished: (params: {
    userId: string;
    recipientName: string;
    phaseNumber: number;
    targetGroup: string;
    date: string;
    timeWindow: string;
    academicBlock: string;
    roomNumber: string;
    assignedJudges: string;
  }): NotificationPayload => ({
    userId: params.userId,
    category: 'Category C: Milestone Presentations & Panel Logistics',
    subject: `Evaluation Schedule Published: Phase ${params.phaseNumber} Presentation Round`,
    salutation: `Dear ${params.recipientName},`,
    body: `The Project Incharge has released the official presentation schedule and panel allocations for the upcoming Phase ${params.phaseNumber} milestone.

Schedule & Venue Details:
- Target Group: ${params.targetGroup}
- Phase Milestone: Phase ${params.phaseNumber}
- Date: ${params.date}
- Time Window: ${params.timeWindow}
- Venue: ${params.academicBlock}, Room No: ${params.roomNumber}
- Assigned Panel Judges: ${params.assignedJudges}

Team Leaders must ensure that all team members report to the assigned room 15 minutes prior to their slot with their demonstration materials and slide decks.`,
    signoff: `Sincerely,\nProject Incharge\nCodeShastra ProjectHub`,
  }),

  documentSubmission: (params: {
    facultyUserId: string;
    teamName: string;
    leaderName: string;
    timestamp: string;
  }): NotificationPayload => ({
    userId: params.facultyUserId,
    category: 'Category C: Milestone Presentations & Panel Logistics',
    subject: `Document Submission: Final Project Report & Research Paper - ${params.teamName}`,
    salutation: `Dear Faculty Member,`,
    body: `This is to notify you that ${params.teamName} has uploaded their final project documentation for Phase 3 review.

Submission Details:
- Team: ${params.teamName}
- Team Leader: ${params.leaderName}
- Files Submitted: Project Report PDF / Research Paper PDF
- Submission Timestamp: ${params.timestamp}

You may review the uploaded documents directly inside the Panel Evaluation console under the Phase 3 tab.`,
    signoff: DEFAULT_SIGNOFF,
  }),

  // Category D: Supervisor Dashboard Alert
  teamLeaderRegistered: (params: {
    supervisorUserId: string;
    supervisorName: string;
    teamName: string;
    leaderName: string;
    leaderEmail: string;
    leaderPhone: string;
  }): NotificationPayload => ({
    userId: params.supervisorUserId,
    category: 'Category D: Supervisor Dashboard Alert',
    subject: `Team Leader Registered: ${params.teamName}`,
    salutation: `Dear Prof. ${params.supervisorName},`,
    body: `A student has officially claimed the Team Leader position for one of your guided teams on CodeShastra ProjectHub.

Registration Details:
- Team: ${params.teamName}
- Leader Name: ${params.leaderName}
- Leader Email: ${params.leaderEmail}
- Leader Phone: ${params.leaderPhone}

The student has been highlighted as Team Leader in your roster dashboard.`,
    signoff: DEFAULT_SIGNOFF,
  }),

  // Category E: Security Alert
  passwordUpdatedSecurityNotice: (params: {
    userId: string;
    userName: string;
    email: string;
    timestamp: string;
  }): NotificationPayload => ({
    userId: params.userId,
    category: 'Category E: Security Alert',
    subject: `Security Alert: Account Password Successfully Updated`,
    salutation: `Dear ${params.userName},`,
    body: `The password for your CodeShastra ProjectHub account (${params.email}) was successfully changed on ${params.timestamp}.

Security Notice:
As per system security protocol, all active sessions on any connected devices have been terminated. You must log in again using your new password.`,
    signoff: `Sincerely,\nSystem Administrator\nCodeShastra ProjectHub`,
  }),
};
