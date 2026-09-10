import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'projecthub.db.json');
if (fs.existsSync(DB_FILE)) {
  fs.unlinkSync(DB_FILE);
  console.log('Database store reset. Next request will re-seed pristine 102 teams, 601 students, 23 supervisors.');
}
