import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NotificationTemplates } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  try {
    const phases = await db.getPhases();
    return NextResponse.json({ phases });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch phases' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionUser = await auth.validateSession(token);
    if (!sessionUser) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // 1. Incharge sets Phase to "Live"
    if (action === 'toggle_live' && sessionUser.role === 'admin') {
      const { phaseNumber, isLive } = body;
      const updatedPhase = await db.setPhaseLive(phaseNumber, isLive);

      // If set to Live, notify team leaders about live evaluation schedule
      if (isLive) {
        const teams = await db.getTeams();
        const panels = await db.getPanels(phaseNumber);

        for (const t of teams) {
          if (t.leader_id) {
            const leader = await db.getUserById(t.leader_id);
            const panel = panels.find(
              (p) =>
                t.team_number >= (p.team_range_start || 0) &&
                t.team_number <= (p.team_range_end || 999)
            );

            if (leader) {
              const notif = NotificationTemplates.evaluationSchedulePublished({
                userId: leader.id,
                recipientName: `${leader.full_name} (${t.team_name})`,
                phaseNumber,
                targetGroup: t.team_name,
                date: panel?.date || 'To Be Announced',
                timeWindow: panel?.time_window || '09:00 AM - 01:00 PM',
                academicBlock: panel?.academic_block || 'Academic Block AB1',
                roomNumber: panel?.room_number || 'TBA',
                assignedJudges: panel?.panel_name || 'Assigned Faculty Panel',
              });
              await db.createNotification(notif);
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Phase ${phaseNumber} is now ${isLive ? 'LIVE' : 'INACTIVE'}`,
        phase: updatedPhase,
      });
    }

    // 2. Supervisor Phase Gatekeeper Permission Toggle
    if (action === 'supervisor_approval' && sessionUser.role === 'supervisor') {
      const { teamId, phaseNumber, approved } = body;
      const team = await db.getTeamById(teamId);

      if (!team || team.supervisor_id !== sessionUser.id) {
        return NextResponse.json({ error: 'Unauthorized to approve clearance for this team' }, { status: 403 });
      }

      const updatedTeam = await db.setTeamPhaseApproval(teamId, phaseNumber, approved);

      // Send Category C notification to Team Leader if approved
      if (approved && team.leader_id) {
        const leader = await db.getUserById(team.leader_id);
        if (leader) {
          const milestoneNames: Record<number, string> = {
            1: 'Phase 1 (PPT Presentation & Ideation)',
            2: 'Phase 2 (Working Prototype & Live Demo)',
            3: 'Phase 3 (Final Report & Paper Defense)',
          };

          const notif = NotificationTemplates.clearanceGranted({
            userId: leader.id,
            leaderName: leader.full_name,
            teamName: team.team_name,
            phaseNumber,
            phaseName: milestoneNames[phaseNumber] || `Phase ${phaseNumber}`,
            supervisorName: sessionUser.full_name,
            supervisorPhone: sessionUser.phone || 'N/A',
          });
          await db.createNotification(notif);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Clearance for Phase ${phaseNumber} ${approved ? 'GRANTED' : 'REVOKED'}`,
        team: updatedTeam,
      });
    }

    return NextResponse.json({ error: 'Invalid action or insufficient permissions' }, { status: 400 });
  } catch (error) {
    console.error('Phase API error:', error);
    return NextResponse.json({ error: 'Failed to update phase settings' }, { status: 500 });
  }
}
