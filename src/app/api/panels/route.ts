import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionUser = await auth.validateSession(token);
    if (!sessionUser) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const phaseNumber = searchParams.get('phaseNumber') ? parseInt(searchParams.get('phaseNumber')!) as 1 | 2 | 3 : undefined;

    const panels = await db.getPanels(phaseNumber);
    const allSupervisors = (await db.getStore()).users.filter((u) => u.role === 'supervisor');
    const allTeams = await db.getTeams();
    const phases = await db.getPhases();

    // Enrich panels with members and assigned teams
    const enrichedPanels = await Promise.all(
      panels.map(async (p) => {
        const members = await db.getPanelMembers(p.id);
        const judgeUsers = members.map((m) => allSupervisors.find((s) => s.id === m.supervisor_id)).filter(Boolean);

        // Teams within this panel's range
        const matchingTeams = allTeams.filter(
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
            supervisor_id: t.supervisor_id,
            phase1_approved: t.phase1_approved,
            phase2_approved: t.phase2_approved,
            phase3_approved: t.phase3_approved,
            report_url: t.report_url,
            paper_url: t.paper_url,
          })),
        };
      })
    );

    // If faculty in Panel Mode: filter to panels where this user is assigned as judge
    if (sessionUser.role === 'supervisor') {
      const myPanels = enrichedPanels.filter((p) =>
        p.judges.some((j: any) => j.id === sessionUser.id)
      );

      // In each panel, filter teams:
      // STRICT CONFLICT-OF-INTEREST SAFEGUARD: Never evaluate teams they supervise!
      // Must have supervisor clearance for that active phase!
      // Must have phase set to Live by Incharge!
      const panelEvaluations = myPanels.map((p) => {
        const phaseInfo = phases.find((ph) => ph.phase_number === p.phase_number);
        const isPhaseLive = phaseInfo ? phaseInfo.is_live : false;

        const evaluableTeams = p.teams.filter((t) => {
          // 1. Conflict Check:
          if (t.supervisor_id === sessionUser.id) return false;

          // 2. Phase Clearance Check:
          if (p.phase_number === 1 && !t.phase1_approved) return false;
          if (p.phase_number === 2 && !t.phase2_approved) return false;
          if (p.phase_number === 3 && !t.phase3_approved) return false;

          return true;
        });

        return {
          ...p,
          isPhaseLive,
          evaluableTeams,
          coPanelists: p.judges.filter((j: any) => j.id !== sessionUser.id),
        };
      });

      return NextResponse.json({ panels: panelEvaluations });
    }

    return NextResponse.json({ panels: enrichedPanels });
  } catch (error) {
    console.error('Panels API error:', error);
    return NextResponse.json({ error: 'Failed to fetch panels' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionUser = await auth.validateSession(token);
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only Project Incharge can configure panels' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    const allTeams = await db.getTeams();
    const allUsers = (await db.getStore()).users;
    const supervisors = allUsers.filter((u) => u.role === 'supervisor');

    // -------------------------------------------------------------------------
    // ACTION 1: BATCH JSON PANEL ASSIGNMENT (No panel name, comma-separated emails)
    // -------------------------------------------------------------------------
    if (action === 'batch_json_panels') {
      const { phaseNumber, panelsData } = body;
      if (!phaseNumber || !panelsData) {
        return NextResponse.json({ error: 'Phase number and panel JSON data are required.' }, { status: 400 });
      }

      let parsedList: any[] = [];
      try {
        parsedList = typeof panelsData === 'string' ? JSON.parse(panelsData) : panelsData;
      } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON format in Panel Assignments input.' }, { status: 400 });
      }

      if (!Array.isArray(parsedList) || parsedList.length === 0) {
        return NextResponse.json({ error: 'Panels JSON must be a non-empty array of objects.' }, { status: 400 });
      }

      const createdPanels = [];
      const conflictErrors: string[] = [];

      for (let i = 0; i < parsedList.length; i++) {
        const item = parsedList[i];
        const rStart = parseInt(item.range_start || item.team_range_start || item.rangeStart);
        const rEnd = parseInt(item.range_end || item.team_range_end || item.rangeEnd);

        if (isNaN(rStart) || isNaN(rEnd)) {
          return NextResponse.json({ error: `Entry #${i + 1} has invalid range_start or range_end.` }, { status: 400 });
        }

        // Parse comma-separated emails
        let emailList: string[] = [];
        if (typeof item.panel_emails === 'string') {
          emailList = item.panel_emails.split(',').map((e: string) => e.trim().toLowerCase());
        } else if (Array.isArray(item.panel_emails)) {
          emailList = item.panel_emails.map((e: any) => String(e).trim().toLowerCase());
        } else if (typeof item.emails === 'string') {
          emailList = item.emails.split(',').map((e: string) => e.trim().toLowerCase());
        }

        if (emailList.length === 0) {
          return NextResponse.json({ error: `Entry #${i + 1} (Teams ${rStart}-${rEnd}) has no panel emails specified.` }, { status: 400 });
        }

        // Map emails to supervisor IDs
        const supervisorIds: string[] = [];
        const missingEmails: string[] = [];

        for (const email of emailList) {
          const sup = supervisors.find((s) => s.email.toLowerCase() === email);
          if (sup) {
            supervisorIds.push(sup.id);
          } else {
            missingEmails.push(email);
          }
        }

        if (missingEmails.length > 0) {
          return NextResponse.json({
            error: `Entry #${i + 1}: The following faculty email(s) were not found in supervisor roster: ${missingEmails.join(', ')}`,
          }, { status: 400 });
        }

        // CONFLICT-OF-INTEREST VALIDATION FOR THIS RANGE
        const targetTeams = allTeams.filter((t) => t.team_number >= rStart && t.team_number <= rEnd);
        const conflictingNames: string[] = [];

        for (const supId of supervisorIds) {
          const hasConflict = targetTeams.some((t) => t.supervisor_id === supId);
          if (hasConflict) {
            const supUser = supervisors.find((s) => s.id === supId);
            if (supUser) conflictingNames.push(supUser.full_name);
          }
        }

        if (conflictingNames.length > 0) {
          conflictErrors.push(
            `Panel #${i + 1} (Teams ${rStart}-${rEnd}): ${conflictingNames.join(', ')} supervise teams in this range and cannot be assigned.`
          );
        }
      }

      if (conflictErrors.length > 0) {
        return NextResponse.json({
          error: `Conflict-of-Interest Safeguard Triggered:\n${conflictErrors.join('\n')}`,
        }, { status: 400 });
      }

      // If all validated cleanly, create all panels!
      const existingPanels = await db.getPanels(phaseNumber);
      let nextPanelIndex = existingPanels.length + 1;

      for (let i = 0; i < parsedList.length; i++) {
        const item = parsedList[i];
        const rStart = parseInt(item.range_start || item.team_range_start || item.rangeStart);
        const rEnd = parseInt(item.range_end || item.team_range_end || item.rangeEnd);

        let emailList: string[] = [];
        if (typeof item.panel_emails === 'string') {
          emailList = item.panel_emails.split(',').map((e: string) => e.trim().toLowerCase());
        } else if (Array.isArray(item.panel_emails)) {
          emailList = item.panel_emails.map((e: any) => String(e).trim().toLowerCase());
        } else if (typeof item.emails === 'string') {
          emailList = item.emails.split(',').map((e: string) => e.trim().toLowerCase());
        }

        const supervisorIds = emailList
          .map((em) => supervisors.find((s) => s.email.toLowerCase() === em)?.id)
          .filter(Boolean) as string[];

        const autoPanelName = `Panel ${nextPanelIndex}`;

        const created = await db.createPanel(
          nextPanelIndex,
          autoPanelName,
          phaseNumber,
          rStart,
          rEnd,
          supervisorIds,
          {
            date: 'To Be Announced',
            timeWindow: 'Shift 1: Morning (09:00 AM - 01:00 PM)',
            academicBlock: 'Academic Block AB10', // FIXED TO AB10 per user requirements
            roomNumber: 'Room TBA',
          }
        );

        createdPanels.push(created);
        nextPanelIndex++;
      }

      return NextResponse.json({
        success: true,
        message: `Successfully allocated ${createdPanels.length} panels for Phase ${phaseNumber} with zero conflicts.`,
        panels: createdPanels,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION 2: BATCH JSON LOGISTICS & SHIFT SCHEDULING (AB10 fixed, 2 shifts)
    // -------------------------------------------------------------------------
    if (action === 'batch_json_schedules') {
      const { phaseNumber, schedulesData } = body;
      if (!phaseNumber || !schedulesData) {
        return NextResponse.json({ error: 'Phase number and schedule JSON data are required.' }, { status: 400 });
      }

      let parsedSchedules: any[] = [];
      try {
        parsedSchedules = typeof schedulesData === 'string' ? JSON.parse(schedulesData) : schedulesData;
      } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON format in Schedules input.' }, { status: 400 });
      }

      if (!Array.isArray(parsedSchedules) || parsedSchedules.length === 0) {
        return NextResponse.json({ error: 'Schedules JSON must be a non-empty array of objects.' }, { status: 400 });
      }

      let updatedCount = 0;
      for (const item of parsedSchedules) {
        const pIndex = parseInt(item.panel_index || item.panelIndex || item.panelNumber);
        const targetDate = item.date || item.scheduled_date || 'To Be Announced';
        const targetShift = item.shift || item.time || item.timeWindow || 'Morning (09:00 AM - 01:00 PM)';
        const targetRoom = item.room || item.room_number || item.roomNumber || 'Room 402';

        const updated = await db.updatePanelSchedule(pIndex, phaseNumber, {
          date: targetDate,
          timeWindow: targetShift,
          academicBlock: 'Academic Block AB10', // FIXED VENUE PER USER REQUIREMENT
          roomNumber: targetRoom.startsWith('Room') ? targetRoom : `Room ${targetRoom}`,
        });

        if (updated) updatedCount++;
      }

      return NextResponse.json({
        success: true,
        message: `Successfully configured presentation logistics across ${updatedCount} panels (Fixed Venue: Academic Block AB10).`,
      });
    }

    // Default: Single panel creation fallback
    const {
      panelNumber,
      panelName,
      phaseNumber,
      teamRangeStart,
      teamRangeEnd,
      supervisorIds,
      schedule,
    } = body;

    if (!panelName || !phaseNumber || !teamRangeStart || !teamRangeEnd || !supervisorIds) {
      return NextResponse.json({ error: 'Missing required panel configuration fields' }, { status: 400 });
    }

    // Conflict Check
    const targetTeams = allTeams.filter(
      (t) => t.team_number >= teamRangeStart && t.team_number <= teamRangeEnd
    );

    const conflictingSupervisors: string[] = [];
    for (const supId of supervisorIds) {
      const hasConflict = targetTeams.some((t) => t.supervisor_id === supId);
      if (hasConflict) {
        const supUser = supervisors.find((s) => s.id === supId);
        if (supUser) conflictingSupervisors.push(supUser.full_name);
      }
    }

    if (conflictingSupervisors.length > 0) {
      return NextResponse.json(
        {
          error: `Conflict-of-Interest Safeguard: ${conflictingSupervisors.join(', ')} supervise teams within range ${teamRangeStart}-${teamRangeEnd} and cannot be assigned to this panel.`,
        },
        { status: 400 }
      );
    }

    const panel = await db.createPanel(
      panelNumber || 1,
      panelName,
      phaseNumber,
      teamRangeStart,
      teamRangeEnd,
      supervisorIds,
      schedule || {
        date: 'To Be Announced',
        timeWindow: 'Shift 1: Morning (09:00 AM - 01:00 PM)',
        academicBlock: 'Academic Block AB10',
        roomNumber: 'Room 402',
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Panel created and judges assigned with zero conflicts.',
      panel,
    });
  } catch (error) {
    console.error('Create panel error:', error);
    return NextResponse.json({ error: 'Failed to configure panel' }, { status: 500 });
  }
}
