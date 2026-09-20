import { getDb } from '@/lib/db';

export interface MedicineDTO {
  name: string;
  genericName?: string;
  manufacturer?: string;
  dosageForm: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Ointment' | 'Drops' | 'Other';
  unitType: string;
}

export interface BatchInwardDTO {
  medicineId: number;
  batchNumber: string;
  expiryDate: string; // ISO format 'YYYY-MM-DD'
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
}

export interface InventoryItemView {
  id: number;
  medicineId: number;
  medicineName: string;
  genericName: string | null;
  batchNumber: string;
  expiryDate: string;
  quantityAvailable: number;
  purchasePrice: number;
  sellingPrice: number;
  isExpired: boolean;
  daysToExpiry: number;
}

export interface InventoryService {
  createMedicine(data: MedicineDTO): Promise<{ id: number; success: boolean, error?: string }>;
  searchMedicines(query: string): Promise<(MedicineDTO & { id: number })[]>;
  inwardBatch(data: BatchInwardDTO): Promise<{ batchId: number; success: boolean, error?: string }>;
  listStockBatches(filter?: { hideZeroStock?: boolean; query?: string }): Promise<InventoryItemView[]>;
}

export class DefaultInventoryService implements InventoryService {
  async createMedicine(data: MedicineDTO): Promise<{ id: number; success: boolean; error?: string }> {
    const db = getDb();

    if (!data.name || data.name.trim() === '') {
      return { id: 0, success: false, error: 'Medicine Trade Name cannot be blank.' };
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO medicines (name, generic_name, manufacturer, dosage_form, unit_type)
        VALUES (@name, @genericName, @manufacturer, @dosageForm, @unitType)
      `);

      const info = stmt.run({
        name: data.name.trim(),
        genericName: data.genericName?.trim() || null,
        manufacturer: data.manufacturer?.trim() || null,
        dosageForm: data.dosageForm,
        unitType: data.unitType || 'Strip',
      });

      return { id: info.lastInsertRowid as number, success: true };
    } catch (error: any) {
      return { id: 0, success: false, error: error.message };
    }
  }

  async searchMedicines(query: string): Promise<(MedicineDTO & { id: number })[]> {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT * FROM medicines
      WHERE name LIKE @query OR generic_name LIKE @query
      ORDER BY name ASC
      LIMIT 20
    `);

    return stmt.all({ query: `%${query.trim()}%` }) as (MedicineDTO & { id: number })[];
  }

  async inwardBatch(data: BatchInwardDTO): Promise<{ batchId: number; success: boolean; error?: string }> {
    const db = getDb();

    // Validate expiry date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(data.expiryDate);

    if (isNaN(expiryDate.getTime())) {
       return { batchId: 0, success: false, error: 'Invalid expiry date format.' };
    }

    if (expiryDate <= today) {
      return { batchId: 0, success: false, error: 'Cannot inward expired goods.' };
    }

    if (data.sellingPrice < data.purchasePrice) {
      // Soft warning handled at UI, but could be enforced here if strict.
      // We'll allow it for now based on "Trigger a soft warning if violated"
    }

    if (data.quantity <= 0) {
      return { batchId: 0, success: false, error: 'Quantity must be a positive integer.' };
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO inventory_batches (medicine_id, batch_number, expiry_date, purchase_price, selling_price, quantity_available)
        VALUES (@medicineId, @batchNumber, @expiryDate, @purchasePrice, @sellingPrice, @quantity)
        ON CONFLICT(medicine_id, batch_number) DO UPDATE SET
          quantity_available = quantity_available + @quantity,
          purchase_price = @purchasePrice,
          selling_price = @sellingPrice,
          expiry_date = @expiryDate
      `);

      const info = stmt.run({
        medicineId: data.medicineId,
        batchNumber: data.batchNumber.trim(),
        expiryDate: data.expiryDate,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        quantity: data.quantity,
      });

      return { batchId: info.lastInsertRowid as number, success: true };
    } catch (error: any) {
      return { batchId: 0, success: false, error: error.message };
    }
  }

  async listStockBatches(filter?: { hideZeroStock?: boolean; query?: string }): Promise<InventoryItemView[]> {
    const db = getDb();
    let query = `
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
        CAST(julianday(b.expiry_date) - julianday('now') AS INTEGER) as daysToExpiry
      FROM inventory_batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE 1=1
    `;

    const params: any = {};

    if (filter?.hideZeroStock) {
      query += ' AND b.quantity_available > 0';
    }

    if (filter?.query && filter.query.trim() !== '') {
      query += ' AND (m.name LIKE @searchQuery OR b.batch_number LIKE @searchQuery)';
      params.searchQuery = `%${filter.query.trim()}%`;
    }

    query += ' ORDER BY b.expiry_date ASC';

    const stmt = db.prepare(query);
    const rows = stmt.all(params) as any[];

    return rows.map(row => ({
      ...row,
      isExpired: row.daysToExpiry <= 0,
    }));
  }
}

export const inventoryService = new DefaultInventoryService();
