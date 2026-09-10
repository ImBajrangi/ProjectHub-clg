import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { NotificationTemplates } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const { teamId, studentEmail } = await req.json();

    if (!teamId || !studentEmail) {
      return NextResponse.json({ error: 'Team and Student Email are required' }, { status: 400 });
    }

    const team = await db.getTeamById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.leader_id) {
      return NextResponse.json({ error: 'This team already has an elected leader.' }, { status: 400 });
    }

    const claimResult = await db.claimTeamLeader(teamId, studentEmail);
    if (!claimResult.success || !claimResult.user) {
      return NextResponse.json({ error: claimResult.error || 'Failed to claim leader role' }, { status: 400 });
    }

    // Dispatch Category D Notification to assigned Supervisor
    if (team.supervisor_id) {
      const supervisor = await db.getUserById(team.supervisor_id);
      if (supervisor) {
        const notifPayload = NotificationTemplates.teamLeaderRegistered({
          supervisorUserId: supervisor.id,
          supervisorName: supervisor.full_name,
          teamName: team.team_name,
          leaderName: claimResult.user.full_name,
          leaderEmail: claimResult.user.email,
          leaderPhone: claimResult.user.phone || 'N/A',
        });
        await db.createNotification(notifPayload);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account activated successfully! Logging you into your project dashboard...',
      email: claimResult.user.email,
      phone: claimResult.user.phone,
    });
  } catch (error) {
    console.error('Leader claim error:', error);
    return NextResponse.json({ error: 'Failed to complete leader designation' }, { status: 500 });
  }
}
