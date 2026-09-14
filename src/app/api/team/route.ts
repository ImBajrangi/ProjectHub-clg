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
      let team = (store.teams || []).find((t) => t && String(t.leader_id) === String(sessionUser.id));

      // Fallback 1: Lookup via student record (by user_id or email)
      if (!team) {
        const student = (store.students || []).find(
          (s) =>
            s &&
            (String(s.user_id) === String(sessionUser.id) ||
              s.email?.toLowerCase().trim() === sessionUser.email?.toLowerCase().trim())
        );
        if (student?.team_id) {
          team = (store.teams || []).find((t) => t && String(t.id) === String(student.team_id));
        }
      }

      // Fallback 2: Force fresh DB reload if cached memory store was stale
      if (!team) {
        const freshStore = await db.getStore(true);
        team = (freshStore.teams || []).find((t) => t && String(t.leader_id) === String(sessionUser.id));
        if (!team) {
          const freshStudent = (freshStore.students || []).find(
            (s) =>
              s &&
              (String(s.user_id) === String(sessionUser.id) ||
                s.email?.toLowerCase().trim() === sessionUser.email?.toLowerCase().trim())
          );
          if (freshStudent?.team_id) {
            team = (freshStore.teams || []).find((t) => t && String(t.id) === String(freshStudent.team_id));
          }
        }
      }

      // Fallback 3: Direct Supabase query if in-memory lookups had cold-start delay
      if (!team) {
        try {
          const { data: dbTeam } = await db.supabase
            .from('teams')
            .select('id, team_code, team_number, program, supervisor_id, leader_id, phase1_approved, phase2_approved, phase3_approved, phase3_report_clearance, report_url, paper_url, report_uploaded_at, created_at, updated_at')
            .eq('leader_id', sessionUser.id)
            .maybeSingle();

          if (dbTeam) {
            team = { ...dbTeam, team_name: `Team ${dbTeam.team_code}` };
          } else {
            const { data: dbStudent } = await db.supabase
              .from('students')
              .select('team_id')
              .or(`user_id.eq.${sessionUser.id},email.ilike.${sessionUser.email}`)
              .maybeSingle();

            if (dbStudent?.team_id) {
              const { data: dbTeamByStudent } = await db.supabase
                .from('teams')
                .select('id, team_code, team_number, program, supervisor_id, leader_id, phase1_approved, phase2_approved, phase3_approved, phase3_report_clearance, report_url, paper_url, report_uploaded_at, created_at, updated_at')
                .eq('id', dbStudent.team_id)
                .maybeSingle();

              if (dbTeamByStudent) {
                team = { ...dbTeamByStudent, team_name: `Team ${dbTeamByStudent.team_code}` };
                // Self-heal: ensure leader_id is set
                if (!team.leader_id || team.leader_id !== sessionUser.id) {
                  team.leader_id = sessionUser.id;
                  await db.supabase.from('teams').update({ leader_id: sessionUser.id }).eq('id', team.id);
                }
              }
            }
          }
        } catch (dbErr) {
          console.error('Supabase direct team fallback error:', dbErr);
        }
      }

      if (!team) {
        return NextResponse.json({ error: 'Team not found for this leader' }, { status: 404 });
      }

      const supervisor = team.supervisor_id ? (store.users || []).find((u) => u && String(u.id) === String(team.supervisor_id)) : null;
      const students = (store.students || []).filter((s) => s && String(s.team_id) === String(team.id));
      const problemStatement = (store.problem_statements || []).find((p) => p && String(p.team_id) === String(team.id)) || null;
      const meetings = (store.meetings || [])
        .filter((m) => m && String(m.team_id) === String(team.id))
        .sort((a, b) => new Date(a.created_at || a.requested_at || 0).getTime() - new Date(b.created_at || b.requested_at || 0).getTime())
        .map((m, idx) => ({
          ...m,
          meeting_index: idx + 1,
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
            id: p.id,
            panel_number: p.panel_number,
            name: (p as any).panel_name || (p as any).name || 'Evaluation Panel',
            panel_name: p.panel_name,
            venue: p.venue,
            judges: judgeUsers,
          };
        });

      return NextResponse.json(
        {
          team,
          supervisor: supervisor
            ? {
                id: supervisor.id,
                full_name: supervisor.full_name,
                fullName: supervisor.full_name,
                email: supervisor.email,
                phone: supervisor.phone,
                designation: (supervisor as any).designation || 'Faculty Guide',
                department: (supervisor as any).department || 'Computer Science & Engineering',
                cabin_location: (supervisor as any).cabin_location || 'Faculty Block',
              }
            : null,
          students,
          members: students,
          problemStatement,
          meetings,
          phases,
          panels: relevantPanels,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    if (sessionUser.role === 'supervisor') {
      const { searchParams } = new URL(req.url);
      const teamId = searchParams.get('teamId');

      if (teamId) {
        const team = (store.teams || []).find((t) => t && String(t.id) === String(teamId));
        if (!team) {
          return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        const students = (store.students || []).filter((s) => s && String(s.team_id) === String(team.id));
        const leader = team.leader_id ? (store.users || []).find((u) => u && String(u.id) === String(team.leader_id)) : null;
        const problemStatement = (store.problem_statements || []).find((p) => p && String(p.team_id) === String(team.id)) || null;
        const meetings = (store.meetings || [])
          .filter((m) => m && String(m.team_id) === String(team.id))
          .sort((a, b) => new Date(a.created_at || a.requested_at || 0).getTime() - new Date(b.created_at || b.requested_at || 0).getTime())
          .map((m, idx) => ({
            ...m,
            meeting_index: idx + 1,
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
          .sort((a, b) => new Date(a.created_at || a.requested_at || 0).getTime() - new Date(b.created_at || b.requested_at || 0).getTime())
          .map((m, idx) => ({
            ...m,
            meeting_index: idx + 1,
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
