import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionUser = await auth.validateSession(token);
    if (!sessionUser) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    if (sessionUser.role !== 'supervisor' && sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied: Evaluation marks are confidential and not accessible to students.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const phaseNumber = parseInt(searchParams.get('phaseNumber') || '1') as 1 | 2 | 3;
    const teamId = searchParams.get('teamId') || undefined;

    const evaluations = await db.getEvaluations(phaseNumber, teamId);
    return NextResponse.json({ evaluations }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch evaluations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionUser = await auth.validateSession(token);
    if (!sessionUser) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    if (sessionUser.role !== 'supervisor' && sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only panel evaluators and admin can submit scores' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    // 1. Submit Individual Member Scores
    if (action === 'submit_scores') {
      const { phaseNumber, teamId, scores, phase1Approved, phase2Approved, phase3ReportClearance, phase3Approved } = body;
      if (!phaseNumber || !teamId || !Array.isArray(scores)) {
        return NextResponse.json({ error: 'Invalid scores payload' }, { status: 400 });
      }

      // Check if Phase is Live - if stopped, prevent faculty/panel members from modifying marks
      const phases = await db.getPhases();
      const targetPhaseConfig = phases.find((p: any) => p.phase_number === Number(phaseNumber));
      if (targetPhaseConfig && !targetPhaseConfig.is_live && sessionUser.role !== 'admin') {
        return NextResponse.json(
          { error: `Phase ${phaseNumber} evaluation has been stopped and locked by the Project Incharge Administrator. Panel members cannot add or modify marks while the phase is stopped.` },
          { status: 403 }
        );
      }

      // Conflict Check: judge cannot evaluate their own supervised team
      const team = await db.getTeamById(teamId);
      if (team && team.supervisor_id === sessionUser.id && sessionUser.role !== 'admin') {
        return NextResponse.json(
          { error: 'Strict Conflict Safeguard: You cannot evaluate a team you supervise.' },
          { status: 403 }
        );
      }

      const savedEvaluations = [];
      for (const item of scores) {
        const rawAttendance = item.attendanceStatus as ('present' | 'absent' | 'early_joining' | 'next_shift' | undefined);
        const attendanceStatus = rawAttendance === 'next_shift' ? 'early_joining' : rawAttendance;
        const isAbsent = Boolean(item.isAbsent) || attendanceStatus === 'absent' || attendanceStatus === 'early_joining';
        const parsedScore = !isAbsent && item.score !== undefined && item.score !== null && item.score !== '' && !isNaN(Number(item.score))
          ? Number(item.score)
          : null;

        const criteriaScores = item.criteriaScores || item.criteria_scores || null;

        const ev = await db.saveEvaluation(
          phaseNumber,
          teamId,
          item.studentId,
          sessionUser.id,
          parsedScore,
          isAbsent,
          item.remarks,
          attendanceStatus,
          criteriaScores
        );
        savedEvaluations.push(ev);
      }

      // Automatically sync milestone approval if passed along with submission
      if (phase1Approved !== undefined) {
        await db.setTeamPhaseApproval(teamId, 1, Boolean(phase1Approved));
      }
      if (phase2Approved !== undefined) {
        await db.setTeamPhaseApproval(teamId, 2, Boolean(phase2Approved));
      }
      if (phase3ReportClearance !== undefined) {
        await db.setTeamPhaseApproval(teamId, 3, Boolean(phase3ReportClearance), true);
      }
      if (phase3Approved !== undefined) {
        await db.setTeamPhaseApproval(teamId, 3, Boolean(phase3Approved));
      }

      return NextResponse.json({
        success: true,
        message: 'Evaluation marks & phase milestone status recorded successfully.',
        evaluations: savedEvaluations,
      });
    }

    // 2. Panel Phase Milestone Action (Phase 1 Approved, Phase 2 Synopsis, Phase 3 Report/Certificate)
    if (action === 'panel_milestone_action' || action === 'report_clearance') {
      const { teamId, phaseNumber, approved, cleared, type } = body;
      const phaseNum = Number(phaseNumber || 3) as 1 | 2 | 3;

      const phases = await db.getPhases();
      const targetPhaseConfig = phases.find((p: any) => p.phase_number === phaseNum);
      if (targetPhaseConfig && !targetPhaseConfig.is_live && sessionUser.role !== 'admin') {
        return NextResponse.json(
          { error: `Phase ${phaseNum} evaluation has been stopped and locked. Milestone status cannot be modified.` },
          { status: 403 }
        );
      }

      const team = await db.getTeamById(teamId);
      if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

      const isApproved = approved !== undefined ? Boolean(approved) : cleared !== undefined ? Boolean(cleared) : true;
      const isReport = type === 'report_clearance' || action === 'report_clearance' || phaseNum === 3;

      const updatedTeam = await db.setTeamPhaseApproval(teamId, phaseNum, isApproved, isReport);

      return NextResponse.json({
        success: true,
        message: `Phase ${phaseNum} milestone status successfully updated.`,
        team: updatedTeam,
      });
    }

    // 3. Admin Direct Attendance Segregation (Shift to Early Joining / Mark Absent)
    if (action === 'segregate_attendance') {
      if (sessionUser.role !== 'admin') {
        return NextResponse.json({ error: 'Institutional Admin privilege required.' }, { status: 403 });
      }

      const { phaseNumber, teamId, studentId, attendanceStatus: rawStatus, remarks } = body;
      if (!phaseNumber || !teamId || !studentId || !rawStatus) {
        return NextResponse.json({ error: 'Missing phaseNumber, teamId, studentId, or attendanceStatus.' }, { status: 400 });
      }

      const attendanceStatus = rawStatus === 'next_shift' ? 'early_joining' : rawStatus;

      if (attendanceStatus !== 'early_joining' && attendanceStatus !== 'absent' && attendanceStatus !== 'present') {
        return NextResponse.json({ error: 'Invalid attendance status.' }, { status: 400 });
      }

      const ev = await db.saveEvaluation(
        phaseNumber,
        teamId,
        studentId,
        sessionUser.id,
        null,
        attendanceStatus !== 'present',
        remarks || (attendanceStatus === 'early_joining' ? 'Moved to Early Joining' : 'Marked Absent'),
        attendanceStatus
      );

      return NextResponse.json({
        success: true,
        message: `Student attendance segregated to ${attendanceStatus === 'early_joining' ? 'Early Joining' : 'Absent'} successfully.`,
        evaluation: ev,
      });
    }

    // 4. Admin Direct Score Override / Edit (Legacy fallback)
    if (action === 'admin_edit_score') {
      if (sessionUser.role !== 'admin') {
        return NextResponse.json({ error: 'Institutional Admin privilege required.' }, { status: 403 });
      }

      const { phaseNumber, teamId, studentId, score, isAbsent, attendanceStatus, remarks } = body;
      if (!phaseNumber || !teamId || !studentId) {
        return NextResponse.json({ error: 'Missing phaseNumber, teamId, or studentId.' }, { status: 400 });
      }

      const isAbsentBool = Boolean(isAbsent);
      const parsedScore = !isAbsentBool && score !== undefined && score !== null && score !== '' && !isNaN(Number(score))
        ? Number(score)
        : null;

      const ev = await db.saveEvaluation(
        phaseNumber,
        teamId,
        studentId,
        sessionUser.id,
        parsedScore,
        isAbsentBool,
        remarks || 'Admin Updated',
        attendanceStatus
      );

      return NextResponse.json({
        success: true,
        message: 'Student score successfully updated by Admin.',
        evaluation: ev,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Evaluations error:', error);
    return NextResponse.json({ error: 'Failed to record evaluations' }, { status: 500 });
  }
}
