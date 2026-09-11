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

    const store = await db.getStore();
    const teams = store.teams || [];
    const students = store.students || [];
    // Include all faculty members and administrators in supervisors directory
    const supervisors = (store.users || []).filter((u) => u.role === 'supervisor' || u.role === 'admin');
    const problemStatements = store.problem_statements || [];
    const meetings = store.meetings || [];
    const evaluations = store.evaluations || [];
    const phases = store.evaluation_phases || [];
    const panels = store.panels || [];
    const supervisorProfiles = store.supervisors || [];
    const panelMembers = store.panel_members || [];

    // Enriched teams with full monitoring stats and per-student evaluations
    const auditTeams = teams.map((t) => {
      const sup = supervisors.find((s) => s.id === t.supervisor_id);
      const leader = t.leader_id ? (store.users || []).find((u) => u.id === t.leader_id) : null;
      const teamStudents = students.filter((s) => s.team_id === t.id);
      const ps = problemStatements.find((p) => p.team_id === t.id);
      const teamMeetings = meetings.filter((m) => m.team_id === t.id);
      const teamEvals = evaluations.filter((e) => e.team_id === t.id);

      // Attach evaluations to each student
      const studentsWithEvals = teamStudents.map((st) => {
        const studentEvals = teamEvals.filter((ev) => ev.student_id === st.id);
        const p1Eval = studentEvals.find((ev) => ev.phase_number === 1);
        const p2Eval = studentEvals.find((ev) => ev.phase_number === 2);
        const p3Eval = studentEvals.find((ev) => ev.phase_number === 3);

        return {
          ...st,
          isLeader: t.leader_id === st.id,
          evaluations: studentEvals,
          phase1: p1Eval ? { score: p1Eval.score, isAbsent: p1Eval.is_absent, remarks: p1Eval.remarks, submittedAt: p1Eval.submitted_at } : null,
          phase2: p2Eval ? { score: p2Eval.score, isAbsent: p2Eval.is_absent, remarks: p2Eval.remarks, submittedAt: p2Eval.submitted_at } : null,
          phase3: p3Eval ? { score: p3Eval.score, isAbsent: p3Eval.is_absent, remarks: p3Eval.remarks, submittedAt: p3Eval.submitted_at } : null,
        };
      });

      const hasLeader = Boolean(t.leader_id);
      const isPsApproved = ps?.status === 'approved';
      const isP1Cleared = t.phase1_approved;
      const isP2Cleared = t.phase2_approved;
      const isP3Cleared = t.phase3_approved;
      const isReportUploaded = Boolean(t.report_url);

      const isDefaulting = !hasLeader || !isPsApproved || (!isP1Cleared && phases[0]?.is_live);

      return {
        id: t.id,
        team_code: t.team_code,
        team_name: t.team_name,
        team_number: t.team_number,
        program: t.program,
        supervisor: sup ? { id: sup.id, name: sup.full_name, email: sup.email, phone: sup.phone } : null,
        leader: leader ? { id: leader.id, name: leader.full_name, email: leader.email, phone: leader.phone } : null,
        studentCount: teamStudents.length,
        students: studentsWithEvals,
        problemStatement: ps,
        meetingCount: teamMeetings.length,
        phase1_approved: t.phase1_approved,
        phase2_approved: t.phase2_approved,
        phase3_approved: t.phase3_approved,
        phase3_report_clearance: t.phase3_report_clearance,
        report_url: t.report_url,
        paper_url: t.paper_url,
        evaluations: teamEvals,
        evaluationsCount: teamEvals.length,
        isDefaulting,
      };
    });

    // Enriched supervisors directory
    const enrichedSupervisors = supervisors.map((s) => {
      const profile = supervisorProfiles.find((sp) => sp.id === s.id);
      const assigned = auditTeams.filter((t) => t.supervisor?.id === s.id);
      const panelAssigned = panelMembers
        .filter((pm) => pm.supervisor_id === s.id)
        .map((pm) => panels.find((p) => p.id === pm.panel_id))
        .filter(Boolean);

      return {
        id: s.id,
        name: s.full_name,
        email: s.email,
        phone: s.phone || 'N/A',
        role: s.role,
        isAdmin: s.role === 'admin',
        employee_id: profile?.employee_id || (s.role === 'admin' ? 'ADM-001' : 'FAC-000'),
        department: profile?.department || 'Dept. of Computer Applications',
        designation: profile?.designation || (s.role === 'admin' ? 'Project Incharge (Administrator)' : 'Faculty Mentor'),
        cabin: profile?.cabin_number || 'Academic Block AB10',
        assignedTeamsCount: assigned.length,
        assignedTeams: assigned.map((t) => ({
          id: t.id,
          team_code: t.team_code,
          team_name: t.team_name,
          team_number: t.team_number,
          program: t.program,
          phase1_approved: t.phase1_approved,
          phase2_approved: t.phase2_approved,
          phase3_approved: t.phase3_approved,
          studentCount: t.studentCount,
          leaderName: t.leader?.name || 'Not Designated',
        })),
        assignedPanels: panelAssigned.map((p: any) => ({
          id: p.id,
          panel_name: p.panel_name,
          phase_number: p.phase_number,
          time_window: p.time_window,
          room_number: p.room_number,
          date: p.date,
          range: `Teams #${p.team_range_start} - #${p.team_range_end}`,
        })),
      };
    });

    // Enriched panels
    const enrichedPanels = panels.map((p) => {
      const members = panelMembers.filter((pm) => pm.panel_id === p.id);
      const judgeUsers = members
        .map((m) => supervisors.find((s) => s.id === m.supervisor_id))
        .filter(Boolean)
        .map((u: any) => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          phone: u.phone,
        }));

      const matchingTeams = auditTeams.filter(
        (t) =>
          t.team_number >= (p.team_range_start || 0) &&
          t.team_number <= (p.team_range_end || 999)
      );

      return {
        ...p,
        judges: judgeUsers,
        teamsCount: matchingTeams.length,
        teams: matchingTeams.map((t) => ({
          id: t.id,
          team_code: t.team_code,
          team_name: t.team_name,
          team_number: t.team_number,
          phase1_approved: t.phase1_approved,
          phase2_approved: t.phase2_approved,
          phase3_approved: t.phase3_approved,
        })),
      };
    });

    return NextResponse.json({
      currentUser: {
        id: sessionUser.id,
        email: sessionUser.email,
        fullName: sessionUser.full_name,
        role: sessionUser.role,
      },
      summary: {
        totalTeams: teams.length,
        totalStudents: students.length,
        totalSupervisors: supervisors.length,
        totalAdmins: (store.users || []).filter((u) => u.role === 'admin').length,
        claimedLeaders: teams.filter((t) => t.leader_id).length,
        unclaimedLeaders: teams.filter((t) => !t.leader_id).length,
        approvedProblemStatements: problemStatements.filter((p) => p.status === 'approved').length,
        totalMeetings: meetings.length,
        totalEvaluations: evaluations.length,
        defaultingCount: auditTeams.filter((t) => t.isDefaulting).length,
      },
      teams: auditTeams,
      supervisors: enrichedSupervisors,
      phases,
      panels: enrichedPanels,
    });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionUser = await auth.validateSession(token);
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Master Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    // Action 1: Transfer Admin Authority or Grant Co-Admin Rights
    if (action === 'transfer_authority') {
      const { targetUserId, demoteCurrentAdmin } = body;
      if (!targetUserId) {
        return NextResponse.json({ error: 'Target faculty member is required.' }, { status: 400 });
      }

      const isDemote = demoteCurrentAdmin !== false;
      const result = await db.transferAdminAuthority({
        targetUserId,
        currentAdminId: sessionUser.id,
        demoteCurrentAdmin: isDemote,
        assignedByName: sessionUser.full_name,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Failed to transfer admin authority' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: isDemote
          ? `Administrative Authority has been successfully transferred to ${result.targetUser?.full_name}. Your account has transitioned to Faculty Supervisor.`
          : `Administrative Co-Authority has been successfully granted to ${result.targetUser?.full_name}.`,
        targetUser: result.targetUser,
        currentAdminUser: result.currentAdminUser,
        currentUserDemoted: isDemote && targetUserId !== sessionUser.id,
      });
    }

    // Action 2: Set Role Directly (Grant or Revoke Admin)
    if (action === 'set_role') {
      const { targetUserId, role } = body;
      if (!targetUserId || (role !== 'admin' && role !== 'supervisor')) {
        return NextResponse.json({ error: 'Invalid user or role specified.' }, { status: 400 });
      }

      const result = await db.setFacultyAdminRole(targetUserId, role);
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Failed to update user role' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: `User role successfully updated to ${role === 'admin' ? 'Administrator' : 'Faculty Supervisor'}.`,
        user: result.user,
      });
    }

    // Action 3: Create New Faculty Member / Admin directly
    if (action === 'create_teacher_admin') {
      const {
        fullName,
        email,
        phone,
        employeeId,
        designation,
        department,
        cabinNumber,
        role = 'supervisor',
        password,
        transferCurrentAdmin = false,
      } = body;

      if (!fullName || !fullName.trim()) {
        return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
      }
      if (!email || !email.trim() || !email.includes('@')) {
        return NextResponse.json({ error: 'Valid official email address is required.' }, { status: 400 });
      }

      const createResult = await db.createSupervisorOrAdmin({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone ? phone.trim() : undefined,
        employeeId: employeeId ? employeeId.trim() : `FAC-${Math.floor(100 + Math.random() * 900)}`,
        designation: designation ? designation.trim() : undefined,
        department: department ? department.trim() : undefined,
        cabinNumber: cabinNumber ? cabinNumber.trim() : undefined,
        role: role === 'admin' ? 'admin' : 'supervisor',
        password: password ? password.trim() : undefined,
      });

      if (!createResult.success || !createResult.user) {
        return NextResponse.json({ error: createResult.error || 'Failed to create faculty account' }, { status: 400 });
      }

      let currentUserDemoted = false;

      // If user was created as Admin and transferCurrentAdmin is requested
      if (role === 'admin' && transferCurrentAdmin) {
        await db.transferAdminAuthority({
          targetUserId: createResult.user.id,
          currentAdminId: sessionUser.id,
          demoteCurrentAdmin: true,
          assignedByName: sessionUser.full_name,
        });
        currentUserDemoted = true;
      }

      return NextResponse.json({
        success: true,
        message: role === 'admin'
          ? `New Administrator (${createResult.user.full_name}) successfully provisioned and appointed.`
          : `New Faculty Mentor (${createResult.user.full_name}) successfully added to the portal.`,
        user: createResult.user,
        supervisor: createResult.supervisor,
        currentUserDemoted,
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin POST API error:', error);
    return NextResponse.json({ error: error.message || 'Server error processing admin request' }, { status: 500 });
  }
}

