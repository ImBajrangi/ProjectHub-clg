import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NotificationTemplates } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionUser = await auth.validateSession(token);
    if (!sessionUser) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const body = await req.json();

    // 1. Leader Submitting Problem Statement
    if (sessionUser.role === 'leader') {
      const { title, description } = body;
      if (!title || !description) {
        return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
      }

      const team = await db.getTeamByLeaderId(sessionUser.id);
      if (!team) return NextResponse.json({ error: 'No team associated with leader' }, { status: 404 });

      const result = await db.saveProblemStatement(team.id, title, description);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Problem statement submitted for supervisor review.',
        problemStatement: result.problemStatement,
      });
    }

    // 2. Supervisor Reviewing (Approve or Request Revision)
    if (sessionUser.role === 'supervisor') {
      const { teamId, action, remarks } = body;
      if (!teamId || !action || (action !== 'approve' && action !== 'revise')) {
        return NextResponse.json({ error: 'Invalid review payload' }, { status: 400 });
      }

      const team = await db.getTeamById(teamId);
      if (!team || team.supervisor_id !== sessionUser.id) {
        return NextResponse.json({ error: 'Unauthorized to review this team' }, { status: 403 });
      }

      const result = await db.reviewProblemStatement(teamId, action, remarks);
      if (!result.success || !result.problemStatement) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      // Notify Team Leader
      if (team.leader_id) {
        const leader = await db.getUserById(team.leader_id);
        if (leader) {
          const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
          if (action === 'approve') {
            const notif = NotificationTemplates.problemStatementApproved({
              userId: leader.id,
              leaderName: leader.full_name,
              teamName: team.team_name,
              title: result.problemStatement.title,
              supervisorName: sessionUser.full_name,
              supervisorPhone: sessionUser.phone || 'N/A',
              timestamp: nowStr,
            });
            await db.createNotification(notif);
          } else {
            const notif = NotificationTemplates.problemStatementRevisionRequested({
              userId: leader.id,
              leaderName: leader.full_name,
              teamName: team.team_name,
              title: result.problemStatement.title,
              supervisorName: sessionUser.full_name,
              supervisorPhone: sessionUser.phone || 'N/A',
              remarks: remarks || 'Please refine problem scope.',
            });
            await db.createNotification(notif);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: action === 'approve' ? 'Problem statement approved and permanently locked.' : 'Revision requested.',
        problemStatement: result.problemStatement,
      });
    }

    return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
  } catch (error) {
    console.error('Problem statement API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
