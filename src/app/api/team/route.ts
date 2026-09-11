import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const store = await db.getStore();

    // If Leader: return their assigned team
    if (sessionUser.role === 'leader') {
      const team = (store.teams || []).find((t) => t && String(t.leader_id) === String(sessionUser.id));
      if (!team) {
        return NextResponse.json({ error: 'Team not found for this leader' }, { status: 404 });
      }

      const supervisor = team.supervisor_id ? (store.users || []).find((u) => u && String(u.id) === String(team.supervisor_id)) : null;
      const students = (store.students || []).filter((s) => s && String(s.team_id) === String(team.id));
      const problemStatement = (store.problem_statements || []).find((p) => p && String(p.team_id) === String(team.id)) || null;
      const meetings = (store.meetings || [])
        .filter((m) => m && String(m.team_id) === String(team.id))
        .sort((a, b) => (a.meeting_index || 0) - (b.meeting_index || 0))
        .map((m) => ({
          ...m,
          attendance: (store.meeting_attendance || []).filter((a) => a && String(a.meeting_id) === String(m.id)),
        }));
      const phases = (store.evaluation_phases || []).sort((a, b) => (a.phase_number || 0) - (b.phase_number || 0));

      // Panels for this team
      const relevantPanels = (store.panels || [])
        .filter(
          (p) =>
            team.team_number >= (p.team_range_start || 0) &&
            team.team_number <= (p.team_range_end || 999)
        )
        .map((p) => {
          const members = (store.panel_members || []).filter((pm) => pm && String(pm.panel_id) === String(p.id));
          const judgeUsers = members
            .map((m) => (store.users || []).find((u) => u && String(u.id) === String(m.supervisor_id)))
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
        });

      return NextResponse.json(
        {
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
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    // If Supervisor: return all their guided teams or a specific team
    if (sessionUser.role === 'supervisor') {
      if (teamIdParam) {
        const team = (store.teams || []).find((t) => t && String(t.id) === String(teamIdParam));
        if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

        const students = (store.students || []).filter((s) => s && String(s.team_id) === String(team.id));
        const leader = team.leader_id ? (store.users || []).find((u) => u && String(u.id) === String(team.leader_id)) : null;
        const problemStatement = (store.problem_statements || []).find((p) => p && String(p.team_id) === String(team.id)) || null;
        const meetings = (store.meetings || [])
          .filter((m) => m && String(m.team_id) === String(team.id))
          .sort((a, b) => (a.meeting_index || 0) - (b.meeting_index || 0))
          .map((m) => ({
            ...m,
            attendance: (store.meeting_attendance || []).filter((a) => a && String(a.meeting_id) === String(m.id)),
          }));

        return NextResponse.json(
          {
            team,
            leader: leader ? { id: leader.id, fullName: leader.full_name, email: leader.email, phone: leader.phone } : null,
            members: students,
            problemStatement,
            meetings,
          },
          {
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
          }
        );
      }

      // Return all guided teams
      const guidedTeams = (store.teams || []).filter((t) => t && String(t.supervisor_id) === String(sessionUser.id));
      const enrichedTeams = guidedTeams.map((t) => {
        const members = (store.students || []).filter((s) => s && String(s.team_id) === String(t.id));
        const leader = t.leader_id ? (store.users || []).find((u) => u && String(u.id) === String(t.leader_id)) : null;
        const ps = (store.problem_statements || []).find((p) => p && String(p.team_id) === String(t.id)) || null;
        const meetings = (store.meetings || [])
          .filter((m) => m && String(m.team_id) === String(t.id))
          .sort((a, b) => (a.meeting_index || 0) - (b.meeting_index || 0))
          .map((m) => ({
            ...m,
            attendance: (store.meeting_attendance || []).filter((a) => a && String(a.meeting_id) === String(m.id)),
          }));

        return {
          ...t,
          members,
          leader: leader
            ? { id: leader.id, fullName: leader.full_name, email: leader.email, phone: leader.phone }
            : null,
          problemStatement: ps,
          meetings,
          pendingMeetings: meetings.filter((m) => m.status === 'requested').length,
          totalMeetings: meetings.length,
        };
      });

      return NextResponse.json(
        { teams: enrichedTeams },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    // Admin or Panel
    if (teamIdParam) {
      const team = (store.teams || []).find((t) => t && String(t.id) === String(teamIdParam));
      if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      const members = (store.students || []).filter((s) => s && String(s.team_id) === String(team.id));
      const leader = team.leader_id ? (store.users || []).find((u) => u && String(u.id) === String(team.leader_id)) : null;
      const supervisor = team.supervisor_id ? (store.users || []).find((u) => u && String(u.id) === String(team.supervisor_id)) : null;
      const ps = (store.problem_statements || []).find((p) => p && String(p.team_id) === String(team.id)) || null;

      return NextResponse.json(
        {
          team,
          members,
          leader: leader ? { id: leader.id, fullName: leader.full_name, email: leader.email, phone: leader.phone } : null,
          supervisor: supervisor ? { id: supervisor.id, fullName: supervisor.full_name, email: supervisor.email, phone: supervisor.phone } : null,
          problemStatement: ps,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    return NextResponse.json(
      { teams: store.teams || [] },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Team API error:', error);
    return NextResponse.json({ error: 'Failed to fetch team data' }, { status: 500 });
  }
}
