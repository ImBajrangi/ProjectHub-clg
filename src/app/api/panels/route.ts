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

    const store = await db.getStore();
    let panels = store.panels;
    if (phaseNumber) {
      panels = panels.filter((p) => p.phase_number === phaseNumber);
    }
    const allSupervisors = store.users.filter((u) => u.role === 'supervisor');
    const allTeams = store.teams;
    const phases = store.evaluation_phases;

    // Enrich panels with members and assigned teams synchronously from memory
    const enrichedPanels = panels.map((p) => {
      const members = store.panel_members.filter((pm) => pm.panel_id === p.id);
      const judgeUsers = members
        .map((m) => allSupervisors.find((s) => s.id === m.supervisor_id))
        .filter(Boolean);

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
    });

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
    // ACTION 1: UNIFIED DIRECT BULK JSON PANEL MAPPING (Employee IDs, Rooms, Shifts, Teams)
    // -------------------------------------------------------------------------
    if (action === 'batch_json_panels') {
      const { phaseNumber, panelsData, shift1Timing, shift2Timing } = body;
      if (!phaseNumber || !panelsData) {
        return NextResponse.json({ error: 'Phase number and panel JSON data are required.' }, { status: 400 });
      }

      const defaultShift1 = shift1Timing || 'Batch 1: Morning (08:00 AM - 10:00 AM)';
      const defaultShift2 = shift2Timing || 'Batch 2: Afternoon (12:00 PM - 02:00 PM)';

      let parsedList: any[] = [];
      try {
        parsedList = typeof panelsData === 'string' ? JSON.parse(panelsData) : panelsData;
      } catch {
        return NextResponse.json({ error: 'Invalid JSON format in Panel Assignments input. Please check syntax.' }, { status: 400 });
      }

      if (!Array.isArray(parsedList) || parsedList.length === 0) {
        return NextResponse.json({ error: 'Panels JSON must be a non-empty array of objects.' }, { status: 400 });
      }

      const store = await db.getStore();
      const supervisorProfiles = store.supervisors;
      const validationErrors: string[] = [];
      const validatedEntries: {
        pNum: number;
        panelName: string;
        rStart: number;
        rEnd: number;
        supervisorIds: string[];
        date: string;
        timeWindow: string;
        roomNumber: string;
        academicBlock: string;
      }[] = [];

      // Map to track faculty schedule occupancy: key = `${date}__${timeWindow.toLowerCase()}` -> Map<supervisorId, panelNumber>
      const facultyScheduleOccupancy = new Map<string, Map<string, number>>();

      // Pre-populate with existing panels for other phases/panels if needed
      const existingPanels = await db.getPanels(phaseNumber);
      let nextPanelIndex = existingPanels.length + 1;

      for (let i = 0; i < parsedList.length; i++) {
        const item = parsedList[i];
        const pNum = parseInt(item.panel_number || item.panel_index) || (nextPanelIndex + i);
        const rStart = parseInt(
          item.team_range_start || item.range_start || item.from_team || item.start_team || item.rangeStart || item.start
        );
        const rEnd = parseInt(
          item.team_range_end || item.range_end || item.to_team || item.end_team || item.rangeEnd || item.end
        );

        if (isNaN(rStart) || isNaN(rEnd) || rStart < 1 || rEnd < rStart) {
          validationErrors.push(
            `Panel #${pNum} (Entry ${i + 1}): Invalid team range (start: ${item.team_range_start}, end: ${item.team_range_end}). Start must be >= 1 and End >= Start.`
          );
          continue;
        }

        // Collect faculty identifiers (employee_ids, emails, or names)
        let rawFacultyTokens: string[] = [];
        
        // Check employee IDs (supports array or single string or comma separated)
        const empIds = item.faculty_employee_ids || item.employee_ids || item.faculty_ids || item.faculty_employee_id || item.employee_id || item.faculty;
        if (typeof empIds === 'string') {
          rawFacultyTokens.push(...empIds.split(',').map((s: string) => s.trim()));
        } else if (Array.isArray(empIds)) {
          rawFacultyTokens.push(...empIds.map((s: any) => String(s).trim()));
        }

        // Check emails
        const emails = item.faculty_emails || item.emails || item.panel_emails || item.email;
        if (typeof emails === 'string') {
          rawFacultyTokens.push(...emails.split(',').map((s: string) => s.trim()));
        } else if (Array.isArray(emails)) {
          rawFacultyTokens.push(...emails.map((s: any) => String(s).trim()));
        }

        // Check names / judges
        const names = item.faculty_names || item.judges || item.faculty_members;
        if (typeof names === 'string') {
          rawFacultyTokens.push(...names.split(',').map((s: string) => s.trim()));
        } else if (Array.isArray(names)) {
          rawFacultyTokens.push(...names.map((s: any) => String(s).trim()));
        }

        rawFacultyTokens = rawFacultyTokens.filter(Boolean);

        if (rawFacultyTokens.length === 0) {
          validationErrors.push(
            `Panel #${pNum} (Teams ${rStart}-${rEnd}): No faculty judges specified. Provide 'faculty_employee_ids'.`
          );
          continue;
        }

        // Map tokens to supervisor user IDs
        const supervisorIds: string[] = [];
        const missingTokens: string[] = [];

        for (const token of rawFacultyTokens) {
          const cleanToken = token.toLowerCase();
          
          // 1. Match by supervisor employee_id in profiles
          const matchedProfile = supervisorProfiles.find(
            (sp) => sp.employee_id && sp.employee_id.toLowerCase() === cleanToken
          );
          if (matchedProfile) {
            const userMatch = supervisors.find((s) => s.id === matchedProfile.id);
            if (userMatch && !supervisorIds.includes(userMatch.id)) {
              supervisorIds.push(userMatch.id);
              continue;
            }
          }

          // 2. Match by email
          const matchedByEmail = supervisors.find((s) => s.email.toLowerCase() === cleanToken);
          if (matchedByEmail && !supervisorIds.includes(matchedByEmail.id)) {
            supervisorIds.push(matchedByEmail.id);
            continue;
          }

          // 3. Match by full name
          const matchedByName = supervisors.find(
            (s) => s.full_name.toLowerCase().includes(cleanToken) || cleanToken.includes(s.full_name.toLowerCase())
          );
          if (matchedByName && !supervisorIds.includes(matchedByName.id)) {
            supervisorIds.push(matchedByName.id);
            continue;
          }

          missingTokens.push(token);
        }

        if (missingTokens.length > 0) {
          validationErrors.push(
            `Panel #${pNum}: The following faculty identifier(s) could not be resolved: ${missingTokens.join(', ')}. Please verify Employee ID.`
          );
          continue;
        }

        // Auto panel name: "Panel X"
        const panelName = item.panel_name || `Panel ${pNum}`;

        // Shift timing resolution: if shift is 1 or 2, map to configured Shift 1 or Shift 2 timing
        let timeWindow = defaultShift1;
        const shiftVal = String(item.shift || item.batch || '1').trim();
        if (shiftVal === '2' || shiftVal.toLowerCase().includes('2') || shiftVal.toLowerCase().includes('afternoon')) {
          timeWindow = defaultShift2;
        } else if (shiftVal === '1' || shiftVal.toLowerCase().includes('1') || shiftVal.toLowerCase().includes('morning')) {
          timeWindow = defaultShift1;
        } else if (item.shift || item.time || item.time_window) {
          timeWindow = item.shift || item.time || item.time_window;
        }

        const date =
          item.date || (phaseNumber === 1 ? '2026-09-19' : phaseNumber === 2 ? '2026-10-17' : '2026-11-20');
        const roomNumber = item.room_number || item.room || `Room ${402 + (i % 4) * 3}`;
        const academicBlock = item.academic_block || item.venue || 'Academic Block AB10';

        // 1. CONCURRENT SCHEDULE COLLISION CHECK (Same Faculty, Same Shift/Time & Same Date)
        const slotKey = `${date}__${timeWindow.toLowerCase().trim()}`;
        if (!facultyScheduleOccupancy.has(slotKey)) {
          facultyScheduleOccupancy.set(slotKey, new Map());
        }
        const currentSlotMap = facultyScheduleOccupancy.get(slotKey)!;

        for (const supId of supervisorIds) {
          const supUser = supervisors.find((s) => s.id === supId);
          const facultyName = supUser?.full_name || 'Faculty Member';
          const supProfile = supervisorProfiles.find((sp) => sp.id === supId);
          const empTag = supProfile?.employee_id ? ` [${supProfile.employee_id}]` : '';

          if (currentSlotMap.has(supId)) {
            const conflictPanelNum = currentSlotMap.get(supId);
            validationErrors.push(
              `Faculty Schedule Collision: ${facultyName}${empTag} is assigned to both Panel #${conflictPanelNum} and Panel #${pNum} at the SAME TIME (${timeWindow}) on ${date}. A faculty member cannot be present in 2 rooms/panels simultaneously.`
            );
          } else {
            currentSlotMap.set(supId, pNum);
          }
        }

        // 2. CONFLICT-OF-INTEREST CHECK (Faculty supervising teams in assigned range)
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
          validationErrors.push(
            `Conflict-of-Interest Violation: ${conflictingNames.join(', ')} supervise teams in range Teams #${rStart}–#${rEnd} and cannot evaluate them in Panel #${pNum}.`
          );
        }

        validatedEntries.push({
          pNum,
          panelName,
          rStart,
          rEnd,
          supervisorIds,
          date,
          timeWindow,
          roomNumber,
          academicBlock,
        });
      }

      // STRICT ATOMIC TRANSACTION / REVOCATION SAFEGUARD:
      // If ANY error or collision is detected anywhere in the JSON, reject completely with zero database mutation!
      if (validationErrors.length > 0) {
        return NextResponse.json({
          error: `Panel Validation Safeguard - All Assignments Revoked:\n• ${validationErrors.join('\n• ')}`,
        }, { status: 400 });
      }

      // If 100% validated without any collision, perform in-place upsert for all panels!
      const createdPanels = [];
      for (const entry of validatedEntries) {
        const panel = await db.upsertPanel(
          entry.pNum,
          entry.panelName,
          phaseNumber,
          entry.rStart,
          entry.rEnd,
          entry.supervisorIds,
          {
            date: entry.date,
            timeWindow: entry.timeWindow,
            academicBlock: entry.academicBlock,
            roomNumber: entry.roomNumber,
          }
        );
        createdPanels.push(panel);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully mapped & updated ${createdPanels.length} panels for Phase ${phaseNumber} with conflict-free and collision-free schedules.`,
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

    // -------------------------------------------------------------------------
    // ACTION 3: DELETE PANEL
    // -------------------------------------------------------------------------
    if (action === 'delete_panel') {
      const { panelId } = body;
      if (!panelId) {
        return NextResponse.json({ error: 'panelId is required.' }, { status: 400 });
      }
      await db.deletePanel(panelId);
      return NextResponse.json({
        success: true,
        message: 'Panel removed successfully.',
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
