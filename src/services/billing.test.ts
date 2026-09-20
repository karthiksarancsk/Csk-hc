import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { billingService } from '@/services/billing';
import { inventoryService } from '@/services/inventory';
import { resetTestDb, getDb } from '@/lib/db';

describe('BillingService', () => {
  beforeEach(() => {
    resetTestDb();
  });

  afterAll(() => {
    resetTestDb();
  });

  async function seedTestBatches() {
    const med1 = await inventoryService.createMedicine({ name: 'Paracetamol', dosageForm: 'Tablet', unitType: 'Strip' });
    const med2 = await inventoryService.createMedicine({ name: 'Amoxicillin', dosageForm: 'Capsule', unitType: 'Strip' });

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const validExpiry = futureDate.toISOString().split('T')[0];

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const expiredExpiry = pastDate.toISOString().split('T')[0];

    const batch1 = await inventoryService.inwardBatch({
      medicineId: med1.id,
      batchNumber: 'B1-VALID',
      expiryDate: validExpiry,
      purchasePrice: 1000,
      sellingPrice: 1500, // 15.00
      quantity: 10
    });

    const batch2 = await inventoryService.inwardBatch({
      medicineId: med2.id,
      batchNumber: 'B2-VALID',
      expiryDate: validExpiry,
      purchasePrice: 2000,
      sellingPrice: 3000, // 30.00
      quantity: 5
    });

    // For expired items, we cannot normally inward them because of inwarding validation
    // So we manually insert it into the database for this specific test case.
    const db = getDb();
    const insertExpired = db.prepare(`
      INSERT INTO inventory_batches (medicine_id, batch_number, expiry_date, purchase_price, selling_price, quantity_available)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const expiredInfo = insertExpired.run(med1.id, 'B3-EXPIRED', expiredExpiry, 1000, 1500, 50);

    return {
       med1, med2,
       batch1Id: batch1.batchId,
       batch2Id: batch2.batchId,
       batchExpiredId: expiredInfo.lastInsertRowid as number
    };
  }

  describe('getAvailableBatchesForBilling', () => {
    it('should only return non-expired batches with positive stock', async () => {
      await seedTestBatches();

      const batches = await billingService.getAvailableBatchesForBilling();
      expect(batches.length).toBe(2);
      expect(batches.find(b => b.batchNumber === 'B3-EXPIRED')).toBeUndefined();

      // Test search
      const filtered = await billingService.getAvailableBatchesForBilling('Paracetamol');
      expect(filtered.length).toBe(1);
      expect(filtered[0].batchNumber).toBe('B1-VALID');
    });
  });

  describe('createInvoice (Transactions)', () => {
    it('should successfully create an invoice and deduct stock', async () => {
      const seeds = await seedTestBatches();

      const result = await billingService.createInvoice({
        paymentMode: 'CASH',
        items: [
          { batchId: seeds.batch1Id, quantity: 2 },
          { batchId: seeds.batch2Id, quantity: 1 }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.invoiceNumber).toMatch(/^INV-\d{8}-\d{4}$/);

      // Verify stock was deducted
      const inventory = await billingService.getAvailableBatchesForBilling();
      const b1 = inventory.find(b => b.batchId === seeds.batch1Id);
      const b2 = inventory.find(b => b.batchId === seeds.batch2Id);

      expect(b1?.quantityAvailable).toBe(8); // 10 - 2
      expect(b2?.quantityAvailable).toBe(4); // 5 - 1

      // Verify invoice details
      const invoice = await billingService.getInvoiceById(result.invoiceId);
      expect(invoice).toBeDefined();
      expect(invoice?.subtotal).toBe(6000); // (2 * 1500) + (1 * 3000)
      expect(invoice?.totalAmount).toBe(6000);
      expect(invoice?.items.length).toBe(2);
    });

    it('should rollback transaction if overselling attempted', async () => {
      const seeds = await seedTestBatches();

      const result = await billingService.createInvoice({
        paymentMode: 'CASH',
        items: [
          { batchId: seeds.batch1Id, quantity: 2 },
          { batchId: seeds.batch2Id, quantity: 10 } // Overselling! Only 5 available.
        ]
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient stock for batch');

      // Verify stock was NOT deducted for any item (atomicity)
      const inventory = await billingService.getAvailableBatchesForBilling();
      const b1 = inventory.find(b => b.batchId === seeds.batch1Id);
      const b2 = inventory.find(b => b.batchId === seeds.batch2Id);

      expect(b1?.quantityAvailable).toBe(10); // Remains untouched
      expect(b2?.quantityAvailable).toBe(5);  // Remains untouched
    });

    it('should block selling expired items', async () => {
       const seeds = await seedTestBatches();

       // To test this we have to bypass getAvailableBatchesForBilling which already hides it.
       const result = await billingService.createInvoice({
          paymentMode: 'CASH',
          items: [{ batchId: seeds.batchExpiredId, quantity: 1 }]
       });

       expect(result.success).toBe(false);
       expect(result.error).toContain('expired and cannot be sold');
    });

    it('should correctly calculate discounts', async () => {
      const seeds = await seedTestBatches();

      const result = await billingService.createInvoice({
        paymentMode: 'CARD',
        discountAmount: 1000, // 10.00 discount
        items: [
          { batchId: seeds.batch1Id, quantity: 2 }, // 3000
        ]
      });

      expect(result.success).toBe(true);

      const invoice = await billingService.getInvoiceById(result.invoiceId);
      expect(invoice?.subtotal).toBe(3000);
      expect(invoice?.discountAmount).toBe(1000);
      expect(invoice?.totalAmount).toBe(2000);
    });

    it('should reject discount greater than subtotal', async () => {
      const seeds = await seedTestBatches();

      const result = await billingService.createInvoice({
        paymentMode: 'UPI',
        discountAmount: 5000, // Discount > Subtotal (3000)
        items: [
          { batchId: seeds.batch1Id, quantity: 2 },
        ]
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Discount cannot be greater than subtotal');
    });
  });
});
