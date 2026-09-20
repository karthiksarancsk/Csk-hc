import { getDb } from '@/lib/db';

export interface ExpiringBatchView {
  id: number;
  medicineId: number;
  medicineName: string;
  genericName: string | null;
  batchNumber: string;
  expiryDate: string;
  quantityAvailable: number;
  purchasePrice: number;
  sellingPrice: number;
  daysToExpiry: number;
  statusColor: 'RED' | 'ORANGE' | 'YELLOW';
}

export interface ExpiryService {
  getExpiringBatches(thresholdDays: number): Promise<ExpiringBatchView[]>;
  getFEFOBatch(medicineId: number): Promise<number | null>;
  getExpiredBatchesCount(): Promise<number>;
}

export class DefaultExpiryService implements ExpiryService {
  async getExpiringBatches(thresholdDays: number): Promise<ExpiringBatchView[]> {
    const db = getDb();

    // We use date('now', 'localtime') to match the user's timezone request
    const stmt = db.prepare(`
      SELECT
        b.id,
        b.medicine_id as medicineId,
        m.name as medicineName,
        m.generic_name as genericName,
        b.batch_number as batchNumber,
        b.expiry_date as expiryDate,
        b.quantity_available as quantityAvailable,
        b.purchase_price as purchasePrice,
        b.selling_price as sellingPrice,
        CAST(julianday(b.expiry_date) - julianday(date('now', 'localtime')) AS INTEGER) as daysToExpiry
      FROM inventory_batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE b.quantity_available > 0
        AND date(b.expiry_date) <= date('now', 'localtime', '+' || @thresholdDays || ' days')
      ORDER BY b.expiry_date ASC
    `);

    const rows = stmt.all({ thresholdDays }) as any[];

    return rows.map(row => {
      let statusColor: 'RED' | 'ORANGE' | 'YELLOW' = 'YELLOW';
      if (row.daysToExpiry <= 0) {
        statusColor = 'RED';
      } else if (row.daysToExpiry <= 30) {
        statusColor = 'ORANGE';
      }

      return {
        ...row,
        statusColor
      };
    });
  }

  async getFEFOBatch(medicineId: number): Promise<number | null> {
    const db = getDb();

    const stmt = db.prepare(`
      SELECT id
      FROM inventory_batches
      WHERE medicine_id = @medicineId
        AND quantity_available > 0
        AND date(expiry_date) > date('now', 'localtime')
      ORDER BY expiry_date ASC
      LIMIT 1
    `);

    const row = stmt.get({ medicineId }) as { id: number } | undefined;
    return row ? row.id : null;
  }

  async getExpiredBatchesCount(): Promise<number> {
    const db = getDb();

    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM inventory_batches
      WHERE quantity_available > 0
        AND date(expiry_date) <= date('now', 'localtime')
    `);

    const row = stmt.get() as { count: number };
    return row.count;
  }
}

export const expiryService = new DefaultExpiryService();
