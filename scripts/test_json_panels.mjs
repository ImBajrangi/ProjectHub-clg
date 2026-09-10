const BASE_URL = 'http://localhost:3000';

async function testJsonPanels() {
  console.log('Testing Batch JSON Panel & Shift Scheduling APIs...\n');

  // Admin Login
  const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@codeshastra.edu', password: 'Admin@CodeShastra2026' }),
  });
  const adminData = await adminRes.json();
  const token = adminData.token;

  // 1. Test Conflict Safeguard with Narendra Mohan on Range 1-5 (Narendra Mohan guides Team 1)
  console.log('1. Testing conflict detection in batch JSON...');
  const conflictPayload = [
    {
      range_start: 1,
      range_end: 5,
      panel_emails: 'narendra.mohan@gla.ac.in, sachin.sharma@gla.ac.in',
    },
  ];

  const conflictRes = await fetch(`${BASE_URL}/api/panels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      action: 'batch_json_panels',
      phaseNumber: 1,
      panelsData: conflictPayload,
    }),
  });
  const conflictData = await conflictRes.json();
  console.log('   Conflict response status:', conflictRes.status);
  console.log('   Conflict message:', conflictData.error?.replace(/\n/g, ' '));
  if (conflictRes.status === 400 && conflictData.error?.includes('Conflict-of-Interest Safeguard')) {
    console.log('   ✓ PASS: Conflict caught cleanly!');
  } else {
    console.error('   ✗ FAIL: Conflict was not caught!');
  }

  // 2. Test Valid Batch JSON Panels:
  // Non-conflicting: Sachin Sharma guides Team 2, so assign Sachin Sharma to range 10-20!
  // Narendra Mohan guides Team 1, so assign Narendra Mohan to range 25-35!
  console.log('\n2. Testing valid batch JSON panel allocation...');
  const validPayload = [
    {
      range_start: 10,
      range_end: 20,
      panel_emails: 'sachin.sharma@gla.ac.in',
    },
    {
      range_start: 25,
      range_end: 35,
      panel_emails: 'narendra.mohan@gla.ac.in',
    },
  ];

  const validRes = await fetch(`${BASE_URL}/api/panels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      action: 'batch_json_panels',
      phaseNumber: 1,
      panelsData: validPayload,
    }),
  });
  const validData = await validRes.json();
  console.log('   Valid response status:', validRes.status);
  console.log('   Message:', validData.message);
  if (validRes.status === 200 && validData.success) {
    console.log('   ✓ PASS: Batch panels created without conflict!');
  } else {
    console.error('   ✗ FAIL:', validData.error);
  }

  // 3. Test Batch JSON Logistics / Shift Scheduling (AB10 Fixed):
  console.log('\n3. Testing batch shift logistics (AB10 fixed)...');
  const schedulesPayload = [
    {
      panel_index: 1,
      date: '2026-09-18',
      shift: 'Shift 1: Morning (09:00 AM - 01:00 PM)',
      room: 'Room 402',
    },
    {
      panel_index: 1,
      date: '2026-09-18',
      shift: 'Shift 2: Evening (02:00 PM - 06:00 PM)',
      room: 'Room 402',
    },
    {
      panel_index: 2,
      date: '2026-09-18',
      shift: 'Shift 1: Morning (09:00 AM - 01:00 PM)',
      room: 'Room 406',
    },
  ];

  const schedRes = await fetch(`${BASE_URL}/api/panels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      action: 'batch_json_schedules',
      phaseNumber: 1,
      schedulesData: schedulesPayload,
    }),
  });
  const schedData = await schedRes.json();
  console.log('   Schedule response status:', schedRes.status);
  console.log('   Message:', schedData.message);
  if (schedRes.status === 200 && schedData.success) {
    console.log('   ✓ PASS: Shift logistics assigned to AB10 with multiple shifts!');
  } else {
    console.error('   ✗ FAIL:', schedData.error);
  }
}

testJsonPanels().catch(console.error);
