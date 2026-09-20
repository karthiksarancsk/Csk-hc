import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { inventoryService } from '@/services/inventory';
import { billingService } from '@/services/billing';
import { expiryService } from '@/services/expiry';
import { resetTestDb, getDb } from '@/lib/db';

describe('End-to-End Pharmacy Workflow', () => {
  beforeEach(() => {
    resetTestDb();
  });

  afterAll(() => {
    resetTestDb();
  });

  it('should simulate a full transaction cycle with expiry guardrails and voiding', async () => {
    // 1. Create new medicine ("Paracetamol 500mg")
    const medRes = await inventoryService.createMedicine({
      name: 'Paracetamol 500mg',
      dosageForm: 'Tablet',
      unitType: 'Strip'
    });
    expect(medRes.success).toBe(true);
    const medId = medRes.id;

    // 2. Inward two batches:
    // Batch A (expires tomorrow, 10 units)
    // Batch B (expires in 6 months, 50 units)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sixMonths = new Date();
    sixMonths.setMonth(sixMonths.getMonth() + 6);

    const batchARes = await inventoryService.inwardBatch({
      medicineId: medId,
      batchNumber: 'BATCH-A',
      expiryDate: tomorrow.toISOString().split('T')[0],
      purchasePrice: 1000,
      sellingPrice: 1500,
      quantity: 10
    });
    expect(batchARes.success).toBe(true);

    const batchBRes = await inventoryService.inwardBatch({
      medicineId: medId,
      batchNumber: 'BATCH-B',
      expiryDate: sixMonths.toISOString().split('T')[0],
      purchasePrice: 1000,
      sellingPrice: 1500,
      quantity: 50
    });
    expect(batchBRes.success).toBe(true);

    // 3. Verify that FEFO automatically selects Batch A
    const fefoId = await expiryService.getFEFOBatch(medId);
    expect(fefoId).toBe(batchARes.batchId);

    // 4. Bill 10 units of Batch A
    const billRes = await billingService.createInvoice({
      paymentMode: 'CASH',
      items: [{ batchId: batchARes.batchId, quantity: 10 }]
    });
    expect(billRes.success).toBe(true);

    // Verify remaining quantity of Batch A is 0
    const stockView = await inventoryService.listStockBatches();
    const batchAAfterSale = stockView.find(b => b.id === batchARes.batchId);
    expect(batchAAfterSale?.quantityAvailable).toBe(0);

    // 5. Attempt billing another unit; verify system falls back to Batch B for FEFO
    const nextFefoId = await expiryService.getFEFOBatch(medId);
    expect(nextFefoId).toBe(batchBRes.batchId);

    // 6. Artificially set Batch B expiry to yesterday
    const db = getDb();
    db.prepare(`UPDATE inventory_batches SET expiry_date = date('now', 'localtime', '-1 days') WHERE id = ?`).run(batchBRes.batchId);

    // verify billing engine rejects sale of expired Batch B
    const expiredBillRes = await billingService.createInvoice({
      paymentMode: 'CASH',
      items: [{ batchId: batchBRes.batchId, quantity: 1 }]
    });
    expect(expiredBillRes.success).toBe(false);
    expect(expiredBillRes.error).toContain('is expired and cannot be sold');

    // 7. Verify voiding the first invoice correctly restores the batch count of Batch A
    const voidRes = await billingService.voidInvoice(billRes.invoiceId);
    expect(voidRes.success).toBe(true);

    const stockViewAfterVoid = await inventoryService.listStockBatches();
    const batchAAfterVoid = stockViewAfterVoid.find(b => b.id === batchARes.batchId);
    expect(batchAAfterVoid?.quantityAvailable).toBe(10);
  });
});