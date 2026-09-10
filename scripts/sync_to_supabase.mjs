import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ezspbqjnvmxuglivdjzb.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: Please provide SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY in environment or .env.local');
  console.log('Usage: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/sync_to_supabase.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const dbPath = path.join(process.cwd(), 'data', 'projecthub.db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

async function upsertBatch(table, items, batchSize = 100) {
  if (!items || items.length === 0) return;
  console.log(`Pushing ${items.length} records to table "${table}"...`);
  
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const { data, error } = await supabase.from(table).upsert(chunk);
    if (error) {
      console.error(`Error inserting into ${table} (batch ${i} - ${i + chunk.length}):`, error.message);
      throw error;
    }
  }
  console.log(`✓ Table "${table}" successfully synced.`);
}

async function main() {
  console.log(`Connecting to Supabase at: ${SUPABASE_URL}`);
  
  // Follow strict foreign key hierarchy
  await upsertBatch('users', db.users);
  await upsertBatch('supervisors', db.supervisors);
  await upsertBatch('teams', db.teams);
  await upsertBatch('students', db.students);
  await upsertBatch('evaluation_phases', db.evaluation_phases);
  await upsertBatch('problem_statements', db.problem_statements);
  await upsertBatch('meetings', db.meetings);
  await upsertBatch('meeting_attendance', db.meeting_attendance);
  await upsertBatch('panels', db.panels);
  await upsertBatch('panel_members', db.panel_members);
  await upsertBatch('evaluations', db.evaluations);
  await upsertBatch('notifications', db.notifications);
  if (db.push_subscriptions && db.push_subscriptions.length > 0) {
    await upsertBatch('push_subscriptions', db.push_subscriptions);
  }
  
  console.log('\n🎉 ALL DATA HAS BEEN SUCCESSFULLY PUSHED TO SUPABASE!');
}

main().catch((err) => {
  console.error('Fatal Sync Error:', err);
  process.exit(1);
});
