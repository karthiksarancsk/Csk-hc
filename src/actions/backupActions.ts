'use server';

import { getDb } from '@/lib/db';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import Database from 'better-sqlite3';

export async function backupDatabaseAction() {
  const db = getDb();

  const backupDir = path.join(process.cwd(), 'backups');
  if (!existsSync(backupDir)) {
    await fs.mkdir(backupDir, { recursive: true });
  }

  const timestamp = Date.now();
  const backupPath = path.join(backupDir, `pharmacy_backup_${timestamp}.db`);

  try {
    // using better-sqlite3 backup API
    await db.backup(backupPath);

    // Read the file and convert to base64 for download
    const fileBuffer = await fs.readFile(backupPath);
    const base64Data = fileBuffer.toString('base64');

    const res = {
      success: true,
      filename: `pharmacy_backup_${timestamp}.db`,
      data: base64Data
    };
    return JSON.parse(JSON.stringify(res));
  } catch (error: any) {
    return JSON.parse(JSON.stringify({ success: false, error: error.message }));
  }
}

export async function restoreDatabaseAction(formData: FormData) {
  const file = formData.get('databaseFile') as File | null;
  if (!file) {
    return JSON.parse(JSON.stringify({ success: false, error: 'No database file uploaded.' }));
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a temporary file to validate the uploaded db
    const tempPath = path.join(process.cwd(), `temp_restore_${Date.now()}.db`);
    await fs.writeFile(tempPath, buffer);

    // Validate signatures (tables)
    let tempDb;
    try {
      tempDb = new Database(tempPath);
      const tables = tempDb.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all() as { name: string }[];
      const tableNames = tables.map(t => t.name);

      const requiredTables = ['medicines', 'inventory_batches', 'invoices', 'invoice_items'];
      const missingTables = requiredTables.filter(t => !tableNames.includes(t));

      if (missingTables.length > 0) {
         tempDb.close();
         await fs.unlink(tempPath);
         return JSON.parse(JSON.stringify({ success: false, error: `Invalid database file. Missing tables: ${missingTables.join(', ')}` }));
      }
      tempDb.close();
    } catch (e: any) {
      if (tempDb) tempDb.close();
      await fs.unlink(tempPath);
      return JSON.parse(JSON.stringify({ success: false, error: 'Failed to open the uploaded file as a valid SQLite database.' }));
    }

    // Since we validated it, replace the core db.
    // In a real robust system we'd manage connections better to avoid locks,
    // but the spec allows requiring restart if needed. We'll overwrite the file.
    const dbPath = path.join(process.cwd(), 'pharmacy_core.db');

    // Attempt to close existing connection (we might not be able to fully un-singleton it here, but we try)
    const currentDb = getDb();
    try { currentDb.close(); } catch(e) {}

    await fs.copyFile(tempPath, dbPath);
    await fs.unlink(tempPath);

    return JSON.parse(JSON.stringify({ success: true, message: 'Database restored successfully. Please restart the application to reconnect.' }));
  } catch (error: any) {
    return JSON.parse(JSON.stringify({ success: false, error: error.message }));
  }
}