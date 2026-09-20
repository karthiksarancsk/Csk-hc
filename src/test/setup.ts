import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// Set up a test database path
const testDbPath = path.join(__dirname, 'test.db');

export function setupTestDb() {
  // Use in-memory DB for tests to prevent parallel I/O lock issues
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  const schemaPath = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  return db;
}

export function teardownTestDb() {
  // Nothing to do for in-memory DB
}

import { vi } from 'vitest';

// Override the getDb function to use test db during tests
vi.mock('@/lib/db', () => {
  let testDb: any = null;
  return {
    getDb: () => {
      if (!testDb) {
         testDb = setupTestDb();
      }
      return testDb;
    },
    // Allows resetting between tests
    resetTestDb: () => {
       if (testDb) {
           testDb.close();
           testDb = null;
           teardownTestDb();
       }
    }
  };
});
