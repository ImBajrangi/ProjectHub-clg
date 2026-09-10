import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionUser = await auth.validateSession(token);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamIdParam = searchParams.get('teamId');

    // If Leader: return their assigned team
    if (sessionUser.role === 'leader') {
      const team = await db.getTeamByLeaderId(sessionUser.id);
      if (!team) {
        return NextResponse.json({ error: 'Team not found for this leader' }, { status: 404 });
      }

      const supervisor = team.supervisor_id ? await db.getUserById(team.supervisor_id) : null;
      const students = await db.getStudentsByTeam(team.id);
      const problemStatement = await db.getProblemStatementByTeam(team.id);
      const meetings = await db.getMeetingsByTeam(team.id);
      const phases = await db.getPhases();

      // Find panel and schedule for this team with full judge details
      const panels = await db.getPanels();
      const allSupervisors = (await db.getStore()).users.filter((u) => u.role === 'supervisor');
      const relevantPanels = await Promise.all(
        panels
          .filter(
            (p) =>
              team.team_number >= (p.team_range_start || 0) &&
              team.team_number <= (p.team_range_end || 999)
          )
          .map(async (p) => {
            const members = await db.getPanelMembers(p.id);
            const judgeUsers = members
              .map((m) => allSupervisors.find((s) => s.id === m.supervisor_id))
              .filter(Boolean)
              .map((j) => ({
                id: j!.id,
                name: j!.full_name,
                email: j!.email,
                phone: j!.phone,
              }));

            return {
              ...p,
              judges: judgeUsers,
            };
          })
      );

      return NextResponse.json({
        team,
        supervisor: supervisor
          ? {
              id: supervisor.id,
              fullName: supervisor.full_name,
              email: supervisor.email,
              phone: supervisor.phone,
            }
          : null,
        members: students,
        problemStatement,
        meetings,
        phases,
        schedules: relevantPanels,
      });
    }

    // If Supervisor: return all their guided teams or a specific team
    if (sessionUser.role === 'supervisor') {
      if (teamIdParam) {
        const team = await db.getTeamById(teamIdParam);
        if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

        const students = await db.getStudentsByTeam(team.id);
        const leader = team.leader_id ? await db.getUserById(team.leader_id) : null;
        const problemStatement = await db.getProblemStatementByTeam(team.id);
        const meetings = await db.getMeetingsByTeam(team.id);

        return NextResponse.json({
          team,
          leader: leader ? { id: leader.id, fullName: leader.full_name, email: leader.email, phone: leader.phone } : null,
          members: students,
          problemStatement,
          meetings,
        });
      }

      // Return all guided teams
      const guidedTeams = await db.getTeamsBySupervisor(sessionUser.id);
      const enrichedTeams = await Promise.all(
        guidedTeams.map(async (t) => {
          const members = await db.getStudentsByTeam(t.id);
          const leader = t.leader_id ? await db.getUserById(t.leader_id) : null;
          const ps = await db.getProblemStatementByTeam(t.id);
          const meetings = await db.getMeetingsByTeam(t.id);
          return {
            ...t,
            members,
            leader: leader
              ? { id: leader.id, fullName: leader.full_name, email: leader.email, phone: leader.phone }
              : null,
            problemStatement: ps,
            pendingMeetings: meetings.filter((m) => m.status === 'requested').length,
            totalMeetings: meetings.length,
          };
        })
      );

      return NextResponse.json({ teams: enrichedTeams });
    }

    // Admin or Panel
    if (teamIdParam) {
      const team = await db.getTeamById(teamIdParam);
      if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      const members = await db.getStudentsByTeam(team.id);
      const leader = team.leader_id ? await db.getUserById(team.leader_id) : null;
      const supervisor = team.supervisor_id ? await db.getUserById(team.supervisor_id) : null;
      const ps = await db.getProblemStatementByTeam(team.id);

      return NextResponse.json({
        team,
        members,
        leader: leader ? { id: leader.id, fullName: leader.full_name, email: leader.email, phone: leader.phone } : null,
        supervisor: supervisor ? { id: supervisor.id, fullName: supervisor.full_name, email: supervisor.email, phone: supervisor.phone } : null,
        problemStatement: ps,
      });
    }

    const allTeams = await db.getTeams();
    return NextResponse.json({ teams: allTeams });
  } catch (error) {
    console.error('Team API error:', error);
    return NextResponse.json({ error: 'Failed to fetch team data' }, { status: 500 });
  }
}
