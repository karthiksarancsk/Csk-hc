import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Define the database path. Using process.cwd() ensures it's relative to project root.
const dbPath = path.join(process.cwd(), 'pharmacy_core.db');

let db: ReturnType<typeof Database> | null = null;

export function getDb() {
  if (!db) {
    db = new Database(dbPath);
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
    db.exec(fs.readFileSync(schemaPath, 'utf8'));
    // Enable WAL mode for concurrent read performance
    db.pragma('journal_mode = WAL');
    // Enable foreign key constraints strictly
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function resetTestDb() {
  // Mocked out by vitest setup, empty here to make TS happy
}
