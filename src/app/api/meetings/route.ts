import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NotificationTemplates } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionUser = await auth.validateSession(token);
    if (!sessionUser) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get('meetingId');

    if (meetingId) {
      const attendance = await db.getMeetingAttendance(meetingId);
      return NextResponse.json({ attendance });
    }

    if (sessionUser.role === 'leader') {
      const team = await db.getTeamByLeaderId(sessionUser.id);
      if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      const meetings = await db.getMeetingsByTeam(team.id);
      return NextResponse.json({ meetings });
    }

    if (sessionUser.role === 'supervisor') {
      const meetings = await db.getMeetingsBySupervisor(sessionUser.id);
      return NextResponse.json({ meetings });
    }

    return NextResponse.json({ meetings: [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
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

    // 1. Leader clicks "Want to Meet"
    if (action === 'request' && sessionUser.role === 'leader') {
      const team = await db.getTeamByLeaderId(sessionUser.id);
      if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      if (!team.supervisor_id) return NextResponse.json({ error: 'No supervisor assigned yet' }, { status: 400 });

      const supervisor = await db.getUserById(team.supervisor_id);
      if (!supervisor) return NextResponse.json({ error: 'Supervisor user not found' }, { status: 404 });

      const meeting = await db.createMeetingRequest(team.id, supervisor.id);

      // Notification to Supervisor (Category B)
      const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      const notif = NotificationTemplates.newMeetingRequest({
        supervisorUserId: supervisor.id,
        supervisorName: supervisor.full_name,
        teamName: team.team_name,
        leaderName: sessionUser.full_name,
        leaderPhone: sessionUser.phone || 'N/A',
        leaderEmail: sessionUser.email,
        timestamp: nowStr,
      });
      await db.createNotification(notif);

      return NextResponse.json({
        success: true,
        message: 'Meeting request successfully sent to your supervisor.',
        meeting,
      });
    }

    // 2. Supervisor Schedules Meeting
    if (action === 'schedule' && sessionUser.role === 'supervisor') {
      const { meetingId, date, timeSlot, venue } = body;
      if (!meetingId || !date || !timeSlot || !venue) {
        return NextResponse.json({ error: 'All schedule details are required' }, { status: 400 });
      }

      const scheduleResult = await db.scheduleMeeting(meetingId, date, timeSlot, venue);
      if (!scheduleResult.success || !scheduleResult.meeting) {
        return NextResponse.json({ error: 'Failed to schedule meeting' }, { status: 400 });
      }

      const meeting = scheduleResult.meeting;
      const team = await db.getTeamById(meeting.team_id);
      if (team && team.leader_id) {
        const leader = await db.getUserById(team.leader_id);
        if (leader) {
          const notif = NotificationTemplates.meetingScheduled({
            userId: leader.id,
            leaderName: leader.full_name,
            teamName: team.team_name,
            supervisorName: sessionUser.full_name,
            supervisorEmail: sessionUser.email,
            supervisorPhone: sessionUser.phone || 'N/A',
            date,
            timeSlot,
            venue,
          });
          await db.createNotification(notif);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Meeting successfully scheduled and pushed to student leader.',
        meeting,
      });
    }

    // 3. Supervisor Logs Post-Meeting Record & Attendance
    if (action === 'log' && sessionUser.role === 'supervisor') {
      const { meetingId, summaryNotes, actionDirectives, attendance } = body;
      if (!meetingId || !summaryNotes) {
        return NextResponse.json({ error: 'Meeting ID and summary are required' }, { status: 400 });
      }

      const logResult = await db.logMeetingRecord(meetingId, summaryNotes, actionDirectives || '', attendance || []);
      if (!logResult.success || !logResult.meeting) {
        return NextResponse.json({ error: 'Failed to log meeting' }, { status: 400 });
      }

      const meeting = logResult.meeting;
      const team = await db.getTeamById(meeting.team_id);
      if (team && team.leader_id) {
        const leader = await db.getUserById(team.leader_id);
        const teamStudents = await db.getStudentsByTeam(team.id);

        const presentNames = (attendance || [])
          .filter((a: any) => a.isPresent)
          .map((a: any) => teamStudents.find((s) => s.id === a.studentId)?.full_name || 'Student')
          .join(', ') || 'None';

        const absentNames = (attendance || [])
          .filter((a: any) => !a.isPresent)
          .map((a: any) => teamStudents.find((s) => s.id === a.studentId)?.full_name || 'Student')
          .join(', ') || 'None';

        if (leader) {
          const notif = NotificationTemplates.meetingRecordLogged({
            userId: leader.id,
            leaderName: leader.full_name,
            teamName: team.team_name,
            meetingLabel: `Meet ${meeting.meeting_index}`,
            date: new Date().toLocaleDateString('en-IN'),
            supervisorName: sessionUser.full_name,
            supervisorPhone: sessionUser.phone || 'N/A',
            membersPresent: presentNames,
            membersAbsent: absentNames,
            summary: summaryNotes,
          });
          await db.createNotification(notif);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Meeting record and member attendance saved.',
        meeting,
      });
    }

    return NextResponse.json({ error: 'Invalid action or permission' }, { status: 400 });
  } catch (error) {
    console.error('Meeting API error:', error);
    return NextResponse.json({ error: 'Internal meeting API error' }, { status: 500 });
  }
}
