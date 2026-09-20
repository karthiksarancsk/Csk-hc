'use server';

import { expiryService } from '@/services/expiry';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function exportDistributorReturnCSV() {
  const batches = await expiryService.getExpiringBatches(30);

  // CSV Headers: Medicine Name, Generic Name, Batch No, Expiry Date, Units Remaining, Purchase Rate, Supplier Credit Value
  const headers = [
    'Medicine Name',
    'Generic Name',
    'Batch No',
    'Expiry Date',
    'Units Remaining',
    'Purchase Rate',
    'Supplier Credit Value'
  ];

  const rows = batches.map(batch => {
    const purchaseRateFormatted = (batch.purchasePrice / 100).toFixed(2);
    const creditValueFormatted = ((batch.purchasePrice * batch.quantityAvailable) / 100).toFixed(2);

    return [
      `"${batch.medicineName.replace(/"/g, '""')}"`,
      `"${(batch.genericName || '').replace(/"/g, '""')}"`,
      `"${batch.batchNumber.replace(/"/g, '""')}"`,
      batch.expiryDate,
      batch.quantityAvailable,
      purchaseRateFormatted,
      creditValueFormatted
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  return csvContent;
}

export async function writeOffBatchAction(batchId: number, quantity: number, reason: string, notes: string) {
  const db = getDb();

  try {
    const result = db.transaction(() => {
      const batchRow = db.prepare(`SELECT quantity_available FROM inventory_batches WHERE id = ?`).get(batchId) as any;
      if (!batchRow) throw new Error('Batch not found');
      if (batchRow.quantity_available < quantity) throw new Error('Insufficient quantity available for write-off');
      if (quantity <= 0) throw new Error('Quantity must be greater than zero');

      db.prepare(`
        INSERT INTO stock_adjustments (batch_id, quantity_deducted, reason, notes)
        VALUES (?, ?, ?, ?)
      `).run(batchId, quantity, reason, notes);

      db.prepare(`
        UPDATE inventory_batches
        SET quantity_available = quantity_available - ?
        WHERE id = ?
      `).run(quantity, batchId);

      return true;
    })();

    revalidatePath('/expiry');
    revalidatePath('/');
    return { success: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
