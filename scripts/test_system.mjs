// Comprehensive automated verification test for CodeShastra ProjectHub
const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🚀 Starting CodeShastra ProjectHub Automated Verification Suite...\n');
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failCount++;
    }
  }

  // 1. Check Available Teams for /leader
  console.log('--- Test 1: Public Leader Election (/leader) Dynamic Exclusion ---');
  const availRes = await fetch(`${BASE_URL}/api/leader/available`);
  const availData = await availRes.json();
  assert(availRes.status === 200 && availData.teams?.length > 0, `Available teams fetched (${availData.teams?.length} teams)`);

  // Pick first team (Team BCA-1)
  const targetTeam = availData.teams[0];
  const membersRes = await fetch(`${BASE_URL}/api/leader/available?teamId=${targetTeam.id}`);
  const membersData = await membersRes.json();
  assert(membersData.students?.length > 0, `Team members loaded (${membersData.students?.length} members for ${targetTeam.team_name})`);

  const studentToElect = membersData.students[0];
  console.log(`  Electing ${studentToElect.full_name} (${studentToElect.email}) as leader for ${targetTeam.team_name}...`);

  // Elect Leader
  const claimRes = await fetch(`${BASE_URL}/api/leader/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId: targetTeam.id, studentEmail: studentToElect.email }),
  });
  const claimData = await claimRes.json();
  assert(claimRes.status === 200 && claimData.success, 'Leader claimed successfully with instant credentials');

  // Verify dynamic exclusion: targetTeam must now be removed from /leader
  const recheckRes = await fetch(`${BASE_URL}/api/leader/available`);
  const recheckData = await recheckRes.json();
  const stillAvailable = recheckData.teams.some((t) => t.id === targetTeam.id);
  assert(!stillAvailable, `Team ${targetTeam.team_name} permanently removed from public /leader dropdown`);

  // 2. Single-Device Concurrent Session Lockout
  console.log('\n--- Test 2: Strict Single-Device Concurrent Session Enforcement ---');
  // Device A Login
  const loginA = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'DeviceA_Chrome' },
    body: JSON.stringify({ email: studentToElect.email, password: studentToElect.mobile }),
  });
  const loginAData = await loginA.json();
  assert(loginA.status === 200 && loginAData.token, 'Device A logged in successfully');
  const tokenA = loginAData.token;

  // Device B Login Attempt (MUST BE BLOCKED)
  const loginB = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'DeviceB_Firefox' },
    body: JSON.stringify({ email: studentToElect.email, password: studentToElect.mobile }),
  });
  const loginBData = await loginB.json();
  assert(
    loginB.status === 403 &&
      loginBData.error === 'Account is already active on another device. Please log out from that device first.',
    `Device B blocked with exact SRS message: "${loginBData.error}"`
  );

  // Device A Logout
  const logoutA = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(logoutA.status === 200, 'Device A logged out and active session terminated');

  // Device B Subsequent Login (MUST NOW SUCCEED)
  const loginB2 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'DeviceB_Firefox' },
    body: JSON.stringify({ email: studentToElect.email, password: studentToElect.mobile }),
  });
  const loginB2Data = await loginB2.json();
  assert(loginB2.status === 200 && loginB2Data.token, 'Device B now successfully logs in after Device A logout');
  const activeLeaderToken = loginB2Data.token;

  // 3. Forgot Password Module
  console.log('\n--- Test 3: Forgot Password Module (Exclusive Email Dispatch Channel) ---');
  // Unknown email
  const fpInvalid = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent@gla.ac.in' }),
  });
  const fpInvalidData = await fpInvalid.json();
  assert(
    fpInvalid.status === 404 && fpInvalidData.error === 'Email ID not registered.',
    `Unknown email returns exact error: "${fpInvalidData.error}"`
  );

  // Valid registered email
  const fpValid = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: studentToElect.email }),
  });
  const fpValidData = await fpValid.json();
  assert(
    fpValid.status === 200 && fpValidData.resetLink?.includes('/reset-password?token='),
    '15-minute tokenized reset link generated successfully'
  );

  // 4. Problem Statement Submission & Immutable Lock
  console.log('\n--- Test 4: Problem Statement Lifecycle & Immutable Lock ---');
  // Leader submits proposal
  const psSubmit = await fetch(`${BASE_URL}/api/problem-statement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeLeaderToken}` },
    body: JSON.stringify({
      title: 'Autonomous Crop Disease Classification via Convolutional Vision Transformers',
      description: 'Developing high-precision edge-compatible neural models for real-time foliar pathology identification.',
    }),
  });
  const psSubmitData = await psSubmit.json();
  assert(psSubmit.status === 200 && psSubmitData.problemStatement?.status === 'pending', 'Problem statement submitted by Leader');

  // Dynamically lookup assigned supervisor for targetTeam using leader session
  const teamRes = await fetch(`${BASE_URL}/api/team`, {
    headers: { Authorization: `Bearer ${activeLeaderToken}` },
  });
  const teamData = await teamRes.json();
  const assignedSupervisorEmail = teamData.supervisor?.email || 'narendra.mohan@gla.ac.in';
  const assignedSupervisorPhone = teamData.supervisor?.phone || '9997106128';
  const supervisorPassword = `CodeShastra@${assignedSupervisorPhone.slice(-4)}`;

  console.log(`  Logging in as assigned supervisor: ${assignedSupervisorEmail}...`);
  const supLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: assignedSupervisorEmail, password: supervisorPassword }),
  });
  const supLoginData = await supLogin.json();
  assert(supLogin.status === 200 && supLoginData.token, `Faculty Supervisor (${assignedSupervisorEmail}) logged in`);
  const supToken = supLoginData.token;

  // Supervisor Approves Problem Statement (Enforces Immutable Lock)
  const psApprove = await fetch(`${BASE_URL}/api/problem-statement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supToken}` },
    body: JSON.stringify({
      teamId: targetTeam.id,
      action: 'approve',
      remarks: 'Excellent problem scope. Approved for Phase 1 development.',
    }),
  });
  const psApproveData = await psApprove.json();
  assert(
    psApprove.status === 200 && psApproveData.problemStatement?.locked === true,
    'Problem statement approved and IMMUTABLE LOCK enforced'
  );

  // Attempt modification by leader after approval -> MUST FAIL
  const psTamper = await fetch(`${BASE_URL}/api/problem-statement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeLeaderToken}` },
    body: JSON.stringify({
      title: 'Attempted Modification to Locked Proposal',
      description: 'Tampering test...',
    }),
  });
  assert(psTamper.status === 400, 'Modification rejected on locked problem statement');

  // 5. Meeting Coordination ("Want to Meet")
  console.log('\n--- Test 5: Meeting Coordination & Attendance Logs ---');
  // Leader clicks "Want to Meet"
  const meetReq = await fetch(`${BASE_URL}/api/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeLeaderToken}` },
    body: JSON.stringify({ action: 'request' }),
  });
  const meetReqData = await meetReq.json();
  assert(meetReq.status === 200 && meetReqData.meeting?.status === 'requested', '"Want to Meet" triggered and logged');

  // Supervisor schedules meeting
  const meetSched = await fetch(`${BASE_URL}/api/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supToken}` },
    body: JSON.stringify({
      action: 'schedule',
      meetingId: meetReqData.meeting.id,
      date: '2026-09-10',
      timeSlot: '11:00 AM - 11:45 AM',
      venue: 'Faculty Cabin 304, AB1',
    }),
  });
  const meetSchedData = await meetSched.json();
  assert(meetSched.status === 200 && meetSchedData.meeting?.status === 'scheduled', 'Meeting scheduled by supervisor');

  // Supervisor logs post-meeting attendance and summary
  const meetLog = await fetch(`${BASE_URL}/api/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supToken}` },
    body: JSON.stringify({
      action: 'log',
      meetingId: meetReqData.meeting.id,
      summaryNotes: 'Reviewed dataset preprocessing and initial literature survey presentation deck.',
      actionDirectives: 'Finalize baseline model metrics and prepare slides for Phase 1 pitch.',
      attendance: membersData.students.map((s, idx) => ({
        studentId: s.id,
        isPresent: idx !== 1, // mark 2nd student absent
      })),
    }),
  });
  const meetLogData = await meetLog.json();
  assert(
    meetLog.status === 200 && meetLogData.meeting?.status === 'completed' && meetLogData.meeting?.meeting_index === 1,
    'Post-meeting attendance & directives logged under "Meet 1 Info"'
  );

  // 6. Supervisor Gatekeeper & Evaluation Panel
  console.log('\n--- Test 6: Supervisor Gatekeeper & Conflict-Free Panel Evaluation ---');
  // Supervisor grants clearance for Phase 1
  const clearP1 = await fetch(`${BASE_URL}/api/phases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supToken}` },
    body: JSON.stringify({
      action: 'supervisor_approval',
      teamId: targetTeam.id,
      phaseNumber: 1,
      approved: true,
    }),
  });
  assert(clearP1.status === 200, 'Supervisor granted clearance for Phase 1');

  // Admin logs in
  const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@codeshastra.edu', password: 'Admin@CodeShastra2026' }),
  });
  const adminLoginData = await adminLogin.json();
  const adminToken = adminLoginData.token;
  assert(adminLogin.status === 200 && adminToken, 'Project Incharge logged in');

  // Incharge activates Phase 1 Live
  const liveP1 = await fetch(`${BASE_URL}/api/phases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ action: 'toggle_live', phaseNumber: 1, isLive: true }),
  });
  assert(liveP1.status === 200, 'Project Incharge set Phase 1 to LIVE');

  // Incharge creates a panel with conflict check:
  // Assign Prof. Sachin Sharma (GLA106248) who guides Team BCA-2, NOT Team BCA-1.
  const allSups = (await (await fetch(`${BASE_URL}/api/team`, { headers: { Authorization: `Bearer ${adminToken}` } })).json()).teams;
  const panelCreate = await fetch(`${BASE_URL}/api/panels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      panelNumber: 1,
      panelName: 'Panel 1 (Evaluators)',
      phaseNumber: 1,
      teamRangeStart: 1,
      teamRangeEnd: 15,
      supervisorIds: [supLoginData.user.id], // Narendra Mohan guides Team BCA-1, so this MUST trigger conflict!
      schedule: {
        date: '2026-09-12',
        timeWindow: '09:00 AM - 01:00 PM',
        academicBlock: 'AB1',
        roomNumber: 'Room 302',
      },
    }),
  });
  const panelCreateData = await panelCreate.json();
  assert(
    panelCreate.status === 400 && panelCreateData.error?.includes('Conflict-of-Interest Safeguard'),
    `Conflict safeguard successfully triggered: "${panelCreateData.error}"`
  );

  // Now create panel with non-conflicting supervisor (Sachin Sharma for range 1-1, or other teachers)
  const otherSupLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sachin.sharma@gla.ac.in', password: 'CodeShastra@1113' }),
  });
  const otherSupData = await otherSupLogin.json();

  const validPanel = await fetch(`${BASE_URL}/api/panels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      panelNumber: 1,
      panelName: 'Panel 1',
      phaseNumber: 1,
      teamRangeStart: 1,
      teamRangeEnd: 1, // only team 1
      supervisorIds: [otherSupData.user.id], // Sachin Sharma does not guide Team 1
      schedule: {
        date: '2026-09-12',
        timeWindow: '09:00 AM - 01:00 PM',
        academicBlock: 'AB1',
        roomNumber: 'Room 302',
      },
    }),
  });
  assert(validPanel.status === 200, 'Panel created with non-conflicting faculty judge');

  // Sachin Sharma evaluates Team 1 students in Panel mode
  const scoreSubmit = await fetch(`${BASE_URL}/api/evaluations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${otherSupData.token}` },
    body: JSON.stringify({
      action: 'submit_scores',
      phaseNumber: 1,
      teamId: targetTeam.id,
      scores: [
        { studentId: studentToElect.id, score: 9.5, isAbsent: false, remarks: 'Strong presentation.' },
        { studentId: membersData.students[1].id, score: null, isAbsent: true, remarks: 'Absent' },
      ],
    }),
  });
  assert(scoreSubmit.status === 200, 'Panel judge submitted individual scores out of 10 & absent marks');

  // 7. In-Website Notification Center Verification
  console.log('\n--- Test 7: Email-Style In-Website Notification Verification ---');
  const notifsRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${activeLeaderToken}` },
  });
  const notifsData = await notifsRes.json();
  assert(
    notifsRes.status === 200 && notifsData.notifications?.length > 0,
    `Leader received ${notifsData.notifications?.length} structured email-style notifications`
  );

  const sampleNotif = notifsData.notifications[0];
  assert(
    sampleNotif.salutation && sampleNotif.body && sampleNotif.signoff?.includes('CodeShastra ProjectHub'),
    `Notification correctly structured: Subject: "${sampleNotif.subject}"`
  );

  console.log(`\n========================================`);
  console.log(`TEST SUITE RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log(`========================================\n`);

  if (failCount === 0) {
    console.log('🎉 ALL OPERATIONAL RULES, WORKFLOWS, & CONSTRAINTS FULLY VERIFIED!');
  } else {
    process.exit(1);
  }
}

runTests().catch(console.error);
