import fs from 'fs';
import path from 'path';
import { getDb } from './index';

export function setupDatabase() {
  const db = getDb();
  const schemaPath = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Execute the schema to set up tables and indexes
  db.exec(schema);
  console.log('Database schema successfully applied.');
}

// Allow running setup from command line
if (require.main === module) {
  setupDatabase();
}
