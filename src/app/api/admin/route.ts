import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionUser = await auth.validateSession(token);
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const store = db.getStore();
    const teams = store.teams;
    const students = store.students;
    const supervisors = store.users.filter((u) => u.role === 'supervisor');
    const problemStatements = store.problem_statements;
    const meetings = store.meetings;
    const evaluations = store.evaluations;
    const phases = store.evaluation_phases;
    const panels = store.panels;

    // Enriched teams with full monitoring stats
    const auditTeams = teams.map((t) => {
      const sup = supervisors.find((s) => s.id === t.supervisor_id);
      const leader = t.leader_id ? store.users.find((u) => u.id === t.leader_id) : null;
      const teamStudents = students.filter((s) => s.team_id === t.id);
      const ps = problemStatements.find((p) => p.team_id === t.id);
      const teamMeetings = meetings.filter((m) => m.team_id === t.id);
      const teamEvals = evaluations.filter((e) => e.team_id === t.id);

      const hasLeader = Boolean(t.leader_id);
      const isPsApproved = ps?.status === 'approved';
      const isP1Cleared = t.phase1_approved;
      const isP2Cleared = t.phase2_approved;
      const isP3Cleared = t.phase3_approved;
      const isReportUploaded = Boolean(t.report_url);

      const isDefaulting = !hasLeader || !isPsApproved || (!isP1Cleared && phases[0].is_live);

      return {
        id: t.id,
        team_code: t.team_code,
        team_name: t.team_name,
        team_number: t.team_number,
        program: t.program,
        supervisor: sup ? { id: sup.id, name: sup.full_name, email: sup.email, phone: sup.phone } : null,
        leader: leader ? { id: leader.id, name: leader.full_name, email: leader.email, phone: leader.phone } : null,
        studentCount: teamStudents.length,
        students: teamStudents,
        problemStatement: ps,
        meetingCount: teamMeetings.length,
        phase1_approved: t.phase1_approved,
        phase2_approved: t.phase2_approved,
        phase3_approved: t.phase3_approved,
        phase3_report_clearance: t.phase3_report_clearance,
        report_url: t.report_url,
        paper_url: t.paper_url,
        evaluationsCount: teamEvals.length,
        isDefaulting,
      };
    });

    return NextResponse.json({
      summary: {
        totalTeams: teams.length,
        totalStudents: students.length,
        totalSupervisors: supervisors.length,
        claimedLeaders: teams.filter((t) => t.leader_id).length,
        unclaimedLeaders: teams.filter((t) => !t.leader_id).length,
        approvedProblemStatements: problemStatements.filter((p) => p.status === 'approved').length,
        totalMeetings: meetings.length,
        defaultingCount: auditTeams.filter((t) => t.isDefaulting).length,
      },
      teams: auditTeams,
      supervisors: supervisors.map((s) => ({
        id: s.id,
        name: s.full_name,
        email: s.email,
        phone: s.phone,
        assignedTeamsCount: teams.filter((t) => t.supervisor_id === s.id).length,
      })),
      phases,
      panels,
    });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 });
  }
}
