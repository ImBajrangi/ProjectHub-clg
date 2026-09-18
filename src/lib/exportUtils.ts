import * as XLSX from 'xlsx';

// Helper to trigger browser download
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 1. Export Panels Report
export function exportPanelsData(panels: any[], format: 'xlsx' | 'csv' = 'xlsx') {
  const rows = (panels || []).map((p, index) => {
    const judgesList = (p.judges || []).map((j: any) => `${j.full_name || j.name} (${j.email || ''})`).join('; ');
    return {
      'S.No': index + 1,
      'Panel Name': p.panel_name || `Panel #${index + 1}`,
      'Phase': `Phase ${p.phase_number || 1}`,
      'Team Range Start': `#${p.team_range_start || 1}`,
      'Team Range End': `#${p.team_range_end || 1}`,
      'Total Teams Allocated': p.teamsCount || (p.evaluableTeams ? p.evaluableTeams.length : 0),
      'Venue': `Academic Block AB10 (${p.room_number || 'Room TBA'})`,
      'Presentation Shift': p.time_window || 'Batch 1: Morning (08:00 AM - 10:00 AM)',
      'Presentation Date': p.date || 'TBA',
      'Assigned Faculty Judges': judgesList || 'None Assigned',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Status': 'No Panels Found' }]);
  
  // Set clean column widths
  ws['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 25 }, // Panel Name
    { wch: 10 }, // Phase
    { wch: 16 }, // Range Start
    { wch: 16 }, // Range End
    { wch: 22 }, // Total Teams
    { wch: 30 }, // Venue
    { wch: 42 }, // Shift
    { wch: 18 }, // Date
    { wch: 60 }, // Judges
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Evaluation Panels');

  const timestamp = new Date().toISOString().split('T')[0];
  if (format === 'csv') {
    const csvData = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `CodeShastra_Panels_Report_${timestamp}.csv`);
  } else {
    XLSX.writeFile(wb, `CodeShastra_Panels_Report_${timestamp}.xlsx`);
  }
}

// 2. Export Teams & Students Directory
export function exportTeamsAndStudents(teams: any[], format: 'xlsx' | 'csv' = 'xlsx') {
  const rows: any[] = [];
  let studentCounter = 1;

  (teams || []).forEach((t) => {
    const students = t.students && t.students.length > 0 ? t.students : [null];
    students.forEach((s: any) => {
      const p1Score = s?.phase1?.score ?? (s?.phase1?.isAbsent ? 'Absent' : '-');
      const p1Pres = s?.phase1?.criteria_scores?.presentation ?? '-';
      const p1Code = s?.phase1?.criteria_scores?.code ?? '-';
      const p1Query = s?.phase1?.criteria_scores?.query_handling ?? '-';

      const p2Score = s?.phase2?.score ?? (s?.phase2?.isAbsent ? 'Absent' : '-');
      const p2Pres = s?.phase2?.criteria_scores?.presentation ?? '-';
      const p2Code = s?.phase2?.criteria_scores?.code ?? '-';
      const p2Query = s?.phase2?.criteria_scores?.query_handling ?? '-';

      const p3Score = s?.phase3?.score ?? (s?.phase3?.isAbsent ? 'Absent' : '-');
      const p3Pres = s?.phase3?.criteria_scores?.presentation ?? '-';
      const p3Code = s?.phase3?.criteria_scores?.code ?? '-';
      const p3Query = s?.phase3?.criteria_scores?.query_handling ?? '-';
      const p3Report = s?.phase3?.criteria_scores?.report ?? '-';

      rows.push({
        'Student S.No': s ? studentCounter++ : '-',
        'Team Code': t.team_code || `Team #${t.team_number}`,
        'Team Name': t.team_name || 'Untitled Project',
        'Program': t.program || 'BCA',
        'Team Guide / Supervisor': t.supervisor?.full_name || t.supervisor?.name || 'Unassigned',
        'Supervisor Email': t.supervisor?.email || '-',
        'Team Leader': t.leader?.full_name || t.leader?.name || 'Unassigned',
        'Leader Mobile': t.leader?.phone || t.leader?.mobile || '-',
        'Student Name': s ? s.full_name : 'No Student Allocated',
        'Student Roll No': s ? s.roll_no : '-',
        'Student Mobile': s ? (s.mobile || s.phone || '-') : '-',
        'Student Email': s ? (s.email || '-') : '-',
        'Problem Statement Title': t.problemStatement?.title || (t.phase1_approved ? 'Approved' : 'Pending Submission'),
        'Phase 1 Clearance (Approved to Go Forward)': t.phase1_approved ? 'Approved' : 'Pending',
        'Phase 2 Clearance (Synopsis Submitted)': t.phase2_approved ? 'Submitted' : 'Pending',
        'Phase 3 Report Clearance (Report / Certificate Submitted)': (t.phase3_report_clearance || t.phase3_approved) ? 'Submitted' : 'Pending',
        'Phase 1 Total': p1Score,
        'P1 Presentation': p1Pres,
        'P1 Code': p1Code,
        'P1 Query Handling': p1Query,
        'Phase 2 Total': p2Score,
        'P2 Presentation': p2Pres,
        'P2 Code': p2Code,
        'P2 Query Handling': p2Query,
        'Phase 3 Total': p3Score,
        'P3 Presentation': p3Pres,
        'P3 Code': p3Code,
        'P3 Query Handling': p3Query,
        'P3 Report': p3Report,
      });
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 12 }, // S.No
    { wch: 14 }, // Team Code
    { wch: 30 }, // Team Name
    { wch: 14 }, // Program
    { wch: 26 }, // Guide
    { wch: 28 }, // Guide Email
    { wch: 24 }, // Leader
    { wch: 16 }, // Leader Mobile
    { wch: 26 }, // Student Name
    { wch: 18 }, // Roll No
    { wch: 16 }, // Student Mobile
    { wch: 28 }, // Student Email
    { wch: 40 }, // Problem Statement
    { wch: 28 }, // P1 Clearance
    { wch: 28 }, // P2 Synopsis
    { wch: 34 }, // P3 Report
    { wch: 14 }, // P1 Total
    { wch: 15 }, // P1 Pres
    { wch: 15 }, // P1 Code
    { wch: 18 }, // P1 Query
    { wch: 14 }, // P2 Total
    { wch: 15 }, // P2 Pres
    { wch: 15 }, // P2 Code
    { wch: 18 }, // P2 Query
    { wch: 14 }, // P3 Total
    { wch: 15 }, // P3 Pres
    { wch: 15 }, // P3 Code
    { wch: 18 }, // P3 Query
    { wch: 15 }, // P3 Report
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Teams & Students');

  const timestamp = new Date().toISOString().split('T')[0];
  if (format === 'csv') {
    const csvData = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `CodeShastra_Teams_Students_${timestamp}.csv`);
  } else {
    XLSX.writeFile(wb, `CodeShastra_Teams_Students_${timestamp}.xlsx`);
  }
}

// 3. Export Faculty Mentors Directory
export function exportFacultyDirectory(supervisors: any[], panels: any[], format: 'xlsx' | 'csv' = 'xlsx') {
  const rows = (supervisors || []).map((s, index) => {
    const assignedPanels = (panels || []).filter((p: any) =>
      (p.judges || []).some((j: any) => j.id === s.id)
    );
    const panelNames = assignedPanels.map((p: any) => `${p.panel_name || 'Panel'} (P${p.phase_number})`).join('; ');

    return {
      'S.No': index + 1,
      'Faculty Name': s.full_name || s.name || 'Faculty Member',
      'Email': s.email || '-',
      'Phone / Mobile': s.phone || '-',
      'Employee ID': s.employee_id || '-',
      'Designation': s.designation || 'Faculty Mentor',
      'Department': s.department || 'Dept. of Computer Applications',
      'Cabin / Location': s.cabin || s.cabin_number || 'Academic Block AB10',
      'Role': s.isAdmin ? 'System Administrator' : 'Faculty Supervisor',
      'Total Teams Guided': s.assignedTeamsCount || (s.assignedTeams ? s.assignedTeams.length : 0),
      'Assigned Evaluation Panels': panelNames || 'None',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 28 }, // Name
    { wch: 28 }, // Email
    { wch: 16 }, // Phone
    { wch: 16 }, // Emp ID
    { wch: 20 }, // Designation
    { wch: 32 }, // Dept
    { wch: 24 }, // Cabin
    { wch: 22 }, // Role
    { wch: 18 }, // Teams
    { wch: 40 }, // Panels
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Faculty Mentors');

  const timestamp = new Date().toISOString().split('T')[0];
  if (format === 'csv') {
    const csvData = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `CodeShastra_Faculty_Directory_${timestamp}.csv`);
  } else {
    XLSX.writeFile(wb, `CodeShastra_Faculty_Directory_${timestamp}.xlsx`);
  }
}

// 4. Export Absent & Early Joining Segregation Roster
export function exportAbsentAndShiftData(
  entries: any[],
  format: 'xlsx' | 'csv' = 'xlsx',
  filterType: 'all' | 'absent' | 'early_joining' = 'all'
) {
  let targetEntries = entries || [];
  if (filterType === 'absent') {
    targetEntries = targetEntries.filter((e) => e.attendanceStatus === 'absent' || e.status === 'absent');
  } else if (filterType === 'early_joining') {
    targetEntries = targetEntries.filter((e) => e.attendanceStatus === 'early_joining' || e.status === 'early_joining' || e.status === 'next_shift');
  }

  const rows = targetEntries.map((e, index) => {
    const isEarly = e.attendanceStatus === 'early_joining' || e.status === 'early_joining' || e.status === 'next_shift';
    return {
      'S.No': index + 1,
      'Phase': `Phase ${e.phaseNumber || 1}`,
      'Attendance Status': isEarly ? 'Early Joining (Shifted)' : 'Absent (Defaulter)',
      'Team Code': e.teamCode || (e.teamNumber ? `Team #${e.teamNumber}` : '-'),
      'Team Name': e.teamName || '-',
      'Program': e.program || 'BCA',
      'Student Name': e.studentName || 'Student',
      'Roll Number': e.rollNo || '-',
      'Student Email': e.email || '-',
      'Faculty Guide': e.supervisor || 'Unassigned',
      'Examination Panel': e.panelName || 'Unassigned Panel',
      'Venue & Room': e.roomNumber ? `${e.roomNumber} (${e.academicBlock || 'AB10'})` : (e.venue || 'Academic Block AB10'),
      'Shift / Time Window': e.timeWindow || e.shiftTime || 'Shift 1',
      'Panel Evaluators': e.evaluators || 'Pending',
      'Reason / Remarks': e.remarks || e.remark || (isEarly ? 'Moved to Early Joining' : 'Marked Absent'),
      'Date Logged': e.submittedAt || e.timestamp ? new Date(e.submittedAt || e.timestamp).toLocaleDateString() : 'Today',
    };
  });

  const emptyText = filterType === 'absent'
    ? 'No Absent Students Logged'
    : filterType === 'early_joining'
    ? 'No Early Joining Students Logged'
    : 'No Absent or Early Joining Students Logged';

  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Status': emptyText }]);
  ws['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 10 }, // Phase
    { wch: 24 }, // Status
    { wch: 14 }, // Team Code
    { wch: 22 }, // Team Name
    { wch: 10 }, // Program
    { wch: 26 }, // Student Name
    { wch: 16 }, // Roll Number
    { wch: 26 }, // Email
    { wch: 24 }, // Faculty Guide
    { wch: 24 }, // Panel
    { wch: 22 }, // Venue
    { wch: 22 }, // Shift
    { wch: 28 }, // Evaluators
    { wch: 36 }, // Remarks
    { wch: 14 }, // Date
  ];

  const sheetTitle = filterType === 'absent'
    ? 'Absent Students'
    : filterType === 'early_joining'
    ? 'Early Joining Students'
    : 'Absent & Early Joining';

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

  const timestamp = new Date().toISOString().split('T')[0];
  const filenamePrefix = filterType === 'absent'
    ? 'CodeShastra_Absentees_Roster'
    : filterType === 'early_joining'
    ? 'CodeShastra_EarlyJoining_Roster'
    : 'CodeShastra_Absent_EarlyJoining_Roster';

  if (format === 'csv') {
    const csvData = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${filenamePrefix}_${timestamp}.csv`);
  } else {
    XLSX.writeFile(wb, `${filenamePrefix}_${timestamp}.xlsx`);
  }
}

// 4B. Export All Candidates Master Gradebook & Attendance Roster
export function exportAllCandidatesMaster(teams: any[], format: 'xlsx' | 'csv' = 'xlsx') {
  const rows: any[] = [];
  let sNo = 1;

  (teams || []).forEach((t: any) => {
    (t.students || []).forEach((st: any) => {
      const p1 = st.phase1;
      const p2 = st.phase2;
      const p3 = st.phase3;

      const p1Status = !p1 ? 'Pending' : (p1.attendanceStatus === 'early_joining' || p1.attendanceStatus === 'next_shift') ? 'Early Joining' : p1.isAbsent ? 'Absent' : p1.score !== null ? `${p1.score}/20` : 'Evaluated (Score Pending)';
      const p2Status = !p2 ? 'Pending' : (p2.attendanceStatus === 'early_joining' || p2.attendanceStatus === 'next_shift') ? 'Early Joining' : p2.isAbsent ? 'Absent' : p2.score !== null ? `${p2.score}/40` : 'Evaluated (Score Pending)';
      const p3Status = !p3 ? 'Pending' : (p3.attendanceStatus === 'early_joining' || p3.attendanceStatus === 'next_shift') ? 'Early Joining' : p3.isAbsent ? 'Absent' : p3.score !== null ? `${p3.score}/40` : 'Evaluated (Score Pending)';

      const totalScoreNum = (p1?.score || 0) + (p2?.score || 0) + (p3?.score || 0);
      const totalScoreStr = (p1?.score !== null && p1?.score !== undefined) || (p2?.score !== null && p2?.score !== undefined) || (p3?.score !== null && p3?.score !== undefined)
        ? `${totalScoreNum}/100`
        : '-';

      rows.push({
        'S.No': sNo++,
        'Team Code': t.team_code || `Team #${t.team_number}`,
        'Team Name': t.team_name || '-',
        'Program': t.program || 'BCA',
        'Student Name': st.full_name || 'Student',
        'Roll Number': st.roll_no || '-',
        'Email': st.email || '-',
        'Role': st.isLeader ? 'Team Leader' : 'Member',
        'Faculty Guide': t.supervisor?.name || 'Unassigned',
        'Guide Email': t.supervisor?.email || '-',
        'Phase 1 (20M)': p1Status,
        'P1 Criteria (Pres / Code / Viva)': p1?.criteria_scores ? `${p1.criteria_scores.presentation ?? '-'}/${p1.criteria_scores.code ?? '-'}/${p1.criteria_scores.query_handling ?? '-'}` : '-',
        'Phase 2 (40M)': p2Status,
        'Phase 3 (40M)': p3Status,
        'Total Score (100M)': totalScoreStr,
        'P1 Permitted': t.phase1_approved ? 'Permitted' : 'Pending',
        'P2 Synopsis': t.phase2_approved ? 'Approved' : 'Due',
        'P3 Report': (t.phase3_report_clearance || t.phase3_approved) ? 'Cleared' : 'Due',
      });
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Status': 'No Candidates Found' }]);
  ws['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 14 }, // Team Code
    { wch: 24 }, // Team Name
    { wch: 10 }, // Program
    { wch: 26 }, // Student Name
    { wch: 16 }, // Roll Number
    { wch: 26 }, // Email
    { wch: 14 }, // Role
    { wch: 24 }, // Guide
    { wch: 26 }, // Guide Email
    { wch: 18 }, // P1
    { wch: 30 }, // P1 Criteria
    { wch: 18 }, // P2
    { wch: 18 }, // P3
    { wch: 20 }, // Total Score
    { wch: 14 }, // P1 Permitted
    { wch: 14 }, // P2 Synopsis
    { wch: 14 }, // P3 Report
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'All Candidates Master');

  const timestamp = new Date().toISOString().split('T')[0];
  if (format === 'csv') {
    const csvData = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `CodeShastra_All_Candidates_Master_Roster_${timestamp}.csv`);
  } else {
    XLSX.writeFile(wb, `CodeShastra_All_Candidates_Master_Roster_${timestamp}.xlsx`);
  }
}

// 5. Export Defaulting Teams Audit
export function exportDefaultingTeams(defaultingTeams: any[], format: 'xlsx' | 'csv' = 'xlsx') {
  const rows = (defaultingTeams || []).map((t, index) => {
    const reasons: string[] = [];
    if (!t.leader) reasons.push('Leader Not Claimed');
    if (!t.problemStatement || t.problemStatement.status !== 'approved') reasons.push('Problem Statement Not Approved');
    if (!t.supervisor) reasons.push('No Supervisor Assigned');

    return {
      'S.No': index + 1,
      'Team Code': t.team_code || `Team #${t.team_number}`,
      'Team Name': t.team_name || 'Untitled Project',
      'Program': t.program || 'BCA',
      'Faculty Guide': t.supervisor?.full_name || t.supervisor?.name || 'Unassigned',
      'Team Leader': t.leader?.full_name || t.leader?.name || 'Unassigned',
      'Total Students': t.students ? t.students.length : 0,
      'Defaulting Reasons': reasons.join('; ') || 'Action Required',
      'Phase 1 Status': t.phase1_approved ? 'Approved' : 'Pending',
      'Phase 2 Status': t.phase2_approved ? 'Approved' : 'Pending',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Status': 'Zero Defaulting Teams' }]);
  ws['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 14 }, // Team Code
    { wch: 30 }, // Team Name
    { wch: 14 }, // Program
    { wch: 26 }, // Guide
    { wch: 24 }, // Leader
    { wch: 14 }, // Students
    { wch: 45 }, // Reasons
    { wch: 16 }, // P1
    { wch: 16 }, // P2
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Defaulting Teams');

  const timestamp = new Date().toISOString().split('T')[0];
  if (format === 'csv') {
    const csvData = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `CodeShastra_Defaulting_Teams_${timestamp}.csv`);
  } else {
    XLSX.writeFile(wb, `CodeShastra_Defaulting_Teams_${timestamp}.xlsx`);
  }
}

// 6. Master Multi-Sheet Workbook Export (All Sections in 1 Complete Excel File)
export function exportMasterWorkbook(data: {
  panels: any[];
  teams: any[];
  supervisors: any[];
  absentEntries: any[];
  defaultingTeams: any[];
}) {
  const wb = XLSX.utils.book_new();

  // 1. Panels Sheet
  const panelRows = (data.panels || []).map((p, idx) => ({
    'S.No': idx + 1,
    'Panel Name': p.panel_name || `Panel #${idx + 1}`,
    'Phase': `Phase ${p.phase_number || 1}`,
    'Team Range': `#${p.team_range_start || 1} – #${p.team_range_end || 1}`,
    'Total Teams': p.teamsCount || 0,
    'Venue': `Academic Block AB10 (${p.room_number || 'Room TBA'})`,
    'Shift': p.time_window || 'Batch 1: Morning',
    'Date': p.date || 'TBA',
    'Faculty Judges': (p.judges || []).map((j: any) => j.full_name || j.name).join('; ') || 'None',
  }));
  const wsPanels = XLSX.utils.json_to_sheet(panelRows.length > 0 ? panelRows : [{ Status: 'No Panels' }]);
  XLSX.utils.book_append_sheet(wb, wsPanels, 'Panels Schedule');

  // 2. Teams & Students Sheet
  const studentRows: any[] = [];
  let sCounter = 1;
  (data.teams || []).forEach((t) => {
    const stds = t.students && t.students.length > 0 ? t.students : [null];
    stds.forEach((s: any) => {
      studentRows.push({
        'S.No': s ? sCounter++ : '-',
        'Team Code': t.team_code,
        'Team Name': t.team_name,
        'Program': t.program,
        'Guide': t.supervisor?.full_name || t.supervisor?.name || 'Unassigned',
        'Leader': t.leader?.full_name || t.leader?.name || 'Unassigned',
        'Student Name': s ? s.full_name : '-',
        'Roll No': s ? s.roll_no : '-',
        'Mobile': s ? (s.mobile || s.phone || '-') : '-',
        'Email': s ? s.email : '-',
        'Phase 1 Clearance (Approved to Go Forward)': t.phase1_approved ? 'Approved' : 'Pending',
        'Phase 2 Clearance (Synopsis Submitted)': t.phase2_approved ? 'Submitted' : 'Pending',
        'Phase 3 Report Clearance (Report / Certificate Submitted)': (t.phase3_report_clearance || t.phase3_approved) ? 'Submitted' : 'Pending',
        'P1 Total': s?.phase1?.score ?? (s?.phase1?.isAbsent ? 'Absent' : '-'),
        'P2 Total': s?.phase2?.score ?? (s?.phase2?.isAbsent ? 'Absent' : '-'),
        'P3 Total': s?.phase3?.score ?? (s?.phase3?.isAbsent ? 'Absent' : '-'),
      });
    });
  });
  const wsStudents = XLSX.utils.json_to_sheet(studentRows);
  XLSX.utils.book_append_sheet(wb, wsStudents, 'Teams & Students');

  // 3. Faculty Mentors Sheet
  const facultyRows = (data.supervisors || []).map((s, idx) => ({
    'S.No': idx + 1,
    'Faculty Name': s.full_name || s.name,
    'Email': s.email,
    'Phone': s.phone || '-',
    'Designation': s.designation || 'Faculty Mentor',
    'Department': s.department || 'Dept. of Computer Applications',
    'Role': s.isAdmin ? 'Admin' : 'Faculty Supervisor',
    'Assigned Teams': s.assignedTeamsCount || 0,
  }));
  const wsFaculty = XLSX.utils.json_to_sheet(facultyRows);
  XLSX.utils.book_append_sheet(wb, wsFaculty, 'Faculty Mentors');

  // 4. Absent & Early Joining Sheet
  const absentRows = (data.absentEntries || []).map((e, idx) => ({
    'S.No': idx + 1,
    'Phase': `Phase ${e.phaseNumber || 1}`,
    'Status': (e.status === 'early_joining' || e.status === 'next_shift') ? 'Early Joining' : 'Absent',
    'Team Code': e.teamCode,
    'Student Name': e.studentName,
    'Roll No': e.rollNo,
    'Phone': e.studentPhone || '-',
    'Shift': e.shiftTime,
    'Remark': e.remark,
  }));
  const wsAbsent = XLSX.utils.json_to_sheet(absentRows.length > 0 ? absentRows : [{ Status: 'No Absent or Early Joining Students' }]);
  XLSX.utils.book_append_sheet(wb, wsAbsent, 'Absent & Early Joining');

  // 5. Defaulting Teams Sheet
  const defRows = (data.defaultingTeams || []).map((t, idx) => ({
    'S.No': idx + 1,
    'Team Code': t.team_code,
    'Team Name': t.team_name,
    'Program': t.program,
    'Guide': t.supervisor?.full_name || 'Unassigned',
    'Leader': t.leader?.full_name || 'Unassigned',
    'Students': t.students?.length || 0,
  }));
  const wsDef = XLSX.utils.json_to_sheet(defRows.length > 0 ? defRows : [{ Status: 'Zero Defaulting Teams' }]);
  XLSX.utils.book_append_sheet(wb, wsDef, 'Defaulting Teams');

  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `CodeShastra_Master_Report_${timestamp}.xlsx`);
}
