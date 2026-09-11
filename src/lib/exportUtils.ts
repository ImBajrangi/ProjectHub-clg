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
        'Phase 1 Clearance': t.phase1_approved ? 'Approved' : 'Pending',
        'Phase 2 Clearance': t.phase2_approved ? 'Approved' : 'Pending',
        'Phase 3 Clearance': t.phase3_approved ? 'Approved' : 'Pending',
        'Phase 3 Report Clearance': t.phase3_report_clearance ? 'Cleared' : 'Pending',
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
    { wch: 16 }, // P1
    { wch: 16 }, // P2
    { wch: 16 }, // P3
    { wch: 24 }, // Report
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

// 4. Export Absent & Next Shift Segregation Roster
export function exportAbsentAndShiftData(entries: any[], format: 'xlsx' | 'csv' = 'xlsx') {
  const rows = (entries || []).map((e, index) => {
    return {
      'S.No': index + 1,
      'Phase': `Phase ${e.phaseNumber || 1}`,
      'Status': e.status === 'next_shift' ? 'Next Shift (Shifted)' : 'Absent (Defaulter)',
      'Team Code': e.teamCode || `Team #${e.teamNumber}`,
      'Student Name': e.studentName || 'Student',
      'Roll Number': e.rollNo || '-',
      'Student Mobile': e.studentPhone || e.studentMobile || '-',
      'Assigned Shift Timing': e.shiftTime || 'Batch 1: Morning',
      'Venue': e.venue || 'Academic Block AB10',
      'Reason / Admin Remark': e.remark || 'Attendance flagged during evaluation',
      'Date Logged': e.timestamp ? new Date(e.timestamp).toLocaleDateString() : 'Today',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Status': 'No Absent or Shifted Students Logged' }]);
  ws['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 10 }, // Phase
    { wch: 22 }, // Status
    { wch: 14 }, // Team Code
    { wch: 26 }, // Student Name
    { wch: 18 }, // Roll Number
    { wch: 16 }, // Mobile
    { wch: 32 }, // Shift
    { wch: 26 }, // Venue
    { wch: 40 }, // Remark
    { wch: 14 }, // Date
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Absent & Next Shift');

  const timestamp = new Date().toISOString().split('T')[0];
  if (format === 'csv') {
    const csvData = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `CodeShastra_Absent_NextShift_Roster_${timestamp}.csv`);
  } else {
    XLSX.writeFile(wb, `CodeShastra_Absent_NextShift_Roster_${timestamp}.xlsx`);
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
        'P1 Approved': t.phase1_approved ? 'Yes' : 'No',
        'P2 Approved': t.phase2_approved ? 'Yes' : 'No',
        'P3 Approved': t.phase3_approved ? 'Yes' : 'No',
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

  // 4. Absent & Next Shift Sheet
  const absentRows = (data.absentEntries || []).map((e, idx) => ({
    'S.No': idx + 1,
    'Phase': `Phase ${e.phaseNumber || 1}`,
    'Status': e.status === 'next_shift' ? 'Next Shift' : 'Absent',
    'Team Code': e.teamCode,
    'Student Name': e.studentName,
    'Roll No': e.rollNo,
    'Phone': e.studentPhone || '-',
    'Shift': e.shiftTime,
    'Remark': e.remark,
  }));
  const wsAbsent = XLSX.utils.json_to_sheet(absentRows.length > 0 ? absentRows : [{ Status: 'No Absent or Shifted Students' }]);
  XLSX.utils.book_append_sheet(wb, wsAbsent, 'Absent & Next Shift');

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
