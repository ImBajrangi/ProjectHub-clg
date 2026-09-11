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
    category: 'Problem Statement Approved',
    subject: `Problem Statement Approved: ${params.teamName}`,
    salutation: `Dear ${params.leaderName} (${params.teamName}),`,
    body: `Your proposed Project Problem Statement has been officially reviewed and approved by your project supervisor.

Approval Details:
- Project Title: ${params.title}
- Supervisor: ${params.supervisorName}
- Supervisor Phone: ${params.supervisorPhone}
- Approval Timestamp: ${params.timestamp}
- Status: Finalized & Locked

Your problem statement is now locked in the portal. You may proceed with phase-wise development under your supervisor's guidance.`,
    signoff: DEFAULT_SIGNOFF,
  }),

  problemStatementSubmittedForSupervisor: (params: {
    supervisorUserId: string;
    supervisorName: string;
    teamName: string;
    leaderName: string;
    title: string;
    timestamp: string;
    isUpdate?: boolean;
  }): NotificationPayload => ({
    userId: params.supervisorUserId,
    category: 'Problem Statement Submitted',
    subject: `Problem Statement ${params.isUpdate ? 'Updated' : 'Submitted'}: ${params.teamName}`,
    salutation: `Dear Prof. ${params.supervisorName},`,
    body: `${params.teamName} (Leader: ${params.leaderName}) has ${params.isUpdate ? 'updated and re-submitted' : 'submitted'} their Project Problem Statement for your review.

Submission Summary:
- Team: ${params.teamName}
- Project Title: ${params.title}
- Submission Timestamp: ${params.timestamp}

Please review the scope in your Supervisor Portal to approve or request revision.`,
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
    category: 'Revision Required',
    subject: `Action Required: Revision for Problem Statement • ${params.teamName}`,
    salutation: `Dear ${params.leaderName} (${params.teamName}),`,
    body: `Your project supervisor has reviewed your submitted Problem Statement and requested modifications before approval.

Review Details:
- Current Title: ${params.title}
- Supervisor: ${params.supervisorName}
- Supervisor Phone: ${params.supervisorPhone}
- Feedback / Remarks: ${params.remarks}

Please log in to your Team Leader dashboard, revise the problem statement according to feedback, and resubmit.`,
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
    category: 'Meeting Scheduled',
    subject: `Meeting Scheduled: Review Session • ${params.teamName}`,
    salutation: `Dear ${params.leaderName} (${params.teamName}),`,
    body: `Your review meeting with your project supervisor has been scheduled.

Meeting Logistics:
- Supervisor: ${params.supervisorName}
- Email: ${params.supervisorEmail}
- Phone: ${params.supervisorPhone}
- Date: ${params.date}
- Time Slot: ${params.timeSlot}
- Venue / Room Number / Link: ${params.venue}
- Agenda: Project Discussion & Review

Please ensure all team members attend on time with documentation and current technical progress.`,
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
    category: 'Meeting Logged',
    subject: `Meeting Record Logged: ${params.meetingLabel} • ${params.teamName}`,
    salutation: `Dear ${params.leaderName} (${params.teamName}),`,
    body: `Your supervisor has officially recorded the attendance and directives for your recent review session.

Session Summary:
- Meeting Label: ${params.meetingLabel}
- Date Conducted: ${params.date}
- Supervisor: ${params.supervisorName}
- Supervisor Phone: ${params.supervisorPhone}
- Members Present: ${params.membersPresent}
- Members Absent: ${params.membersAbsent}
- Summary & Directives: ${params.summary}

This record has been permanently archived in your project tracking log.`,
    signoff: DEFAULT_SIGNOFF,
  }),

  meetingRequestDispatched: (params: {
    userId: string;
    leaderName: string;
    teamName: string;
    meetingLabel: string;
    supervisorName: string;
    timestamp: string;
  }): NotificationPayload => ({
    userId: params.userId,
    category: 'Meeting Request',
    subject: `Meeting Request Submitted: ${params.meetingLabel} • ${params.teamName}`,
    salutation: `Dear ${params.leaderName} (${params.teamName}),`,
    body: `Your milestone / progress review meeting request for ${params.meetingLabel} has been submitted to your supervisor.

Request Summary:
- Milestone: ${params.meetingLabel}
- Supervisor: Prof. ${params.supervisorName}
- Status: Awaiting Faculty Schedule
- Submitted Timestamp: ${params.timestamp}

You will receive an alert as soon as your supervisor confirms the date, time slot, and venue.`,
    signoff: DEFAULT_SIGNOFF,
  }),

  meetingRequestWithdrawn: (params: {
    userId: string;
    leaderName: string;
    teamName: string;
    meetingLabel: string;
    supervisorName: string;
  }): NotificationPayload => ({
    userId: params.userId,
    category: 'Request Withdrawn',
    subject: `Meeting Request Withdrawn: ${params.meetingLabel} • ${params.teamName}`,
    salutation: `Dear ${params.leaderName} (${params.teamName}),`,
    body: `Your pending meeting request for ${params.meetingLabel} with Prof. ${params.supervisorName} has been cancelled and withdrawn.

Details:
- Milestone: ${params.meetingLabel}
- Status: Request Cancelled & Withdrawn
- Team: ${params.teamName}`,
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
    category: 'Meeting Request',
    subject: `New Meeting Request from ${params.teamName}`,
    salutation: `Dear Prof. ${params.supervisorName},`,
    body: `${params.teamName} has submitted a meeting request via their student portal to discuss project progress.

Request Summary:
- Team: ${params.teamName}
- Team Leader: ${params.leaderName}
- Leader Contact: ${params.leaderPhone} | ${params.leaderEmail}
- Request Timestamp: ${params.timestamp}

Please open your Supervisor Portal to confirm your availability and assign a date, time slot, and venue.`,
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

  teamLeaderLoggedInNotice: (params: {
    supervisorUserId: string;
    supervisorName: string;
    teamName: string;
    leaderName: string;
    timestamp: string;
  }): NotificationPayload => ({
    userId: params.supervisorUserId,
    category: 'Leader Activity',
    subject: `Team Leader Logged In: ${params.teamName}`,
    salutation: `Dear Prof. ${params.supervisorName},`,
    body: `${params.leaderName}, elected leader of ${params.teamName}, has signed in to the CodeShastra ProjectHub at ${params.timestamp}.`,
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
