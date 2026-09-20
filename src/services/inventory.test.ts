import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { inventoryService } from '@/services/inventory';

// Import the mock controls from our setup
// We mock it using vitest, and getDb is exported. But wait, resetTestDb is defined in setup.ts vi.mock.
// Since vitest alias might not apply to require() we'll import it.
import { resetTestDb } from '@/lib/db';

describe('InventoryService', () => {
  beforeEach(() => {
    resetTestDb();
  });

  afterAll(() => {
    resetTestDb();
  });

  describe('createMedicine', () => {
    it('should create a medicine successfully', async () => {
      const result = await inventoryService.createMedicine({
        name: 'Paracetamol',
        dosageForm: 'Tablet',
        unitType: 'Strip'
      });
      expect(result.success).toBe(true);
      expect(result.id).toBeGreaterThan(0);
    });

    it('should fail if trade name is blank', async () => {
      const result = await inventoryService.createMedicine({
        name: '   ',
        dosageForm: 'Tablet',
        unitType: 'Strip'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Trade Name cannot be blank');
    });
  });

  describe('inwardBatch', () => {
    it('should inward a batch successfully', async () => {
      // Create medicine first
      const med = await inventoryService.createMedicine({
        name: 'Ibuprofen',
        dosageForm: 'Tablet',
        unitType: 'Strip'
      });

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = await inventoryService.inwardBatch({
        medicineId: med.id,
        batchNumber: 'BATCH-001',
        expiryDate: futureDate.toISOString().split('T')[0],
        purchasePrice: 1000,
        sellingPrice: 1500,
        quantity: 50
      });

      expect(result.success).toBe(true);
      expect(result.batchId).toBeGreaterThan(0);
    });

    it('should reject past expiry dates', async () => {
      const med = await inventoryService.createMedicine({
        name: 'Aspirin',
        dosageForm: 'Tablet',
        unitType: 'Strip'
      });

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const result = await inventoryService.inwardBatch({
        medicineId: med.id,
        batchNumber: 'BATCH-002',
        expiryDate: pastDate.toISOString().split('T')[0],
        purchasePrice: 1000,
        sellingPrice: 1500,
        quantity: 50
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot inward expired goods');
    });

    it('should handle duplicate batch collisions by incrementing quantity', async () => {
      const med = await inventoryService.createMedicine({
        name: 'Amoxicillin',
        dosageForm: 'Capsule',
        unitType: 'Strip'
      });

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const expDate = futureDate.toISOString().split('T')[0];

      // First inward
      await inventoryService.inwardBatch({
        medicineId: med.id,
        batchNumber: 'DUP-BATCH',
        expiryDate: expDate,
        purchasePrice: 1000,
        sellingPrice: 1500,
        quantity: 50
      });

      // Second inward with same batch
      const result2 = await inventoryService.inwardBatch({
        medicineId: med.id,
        batchNumber: 'DUP-BATCH',
        expiryDate: expDate,
        purchasePrice: 1200, // Update price
        sellingPrice: 1600,
        quantity: 25
      });

      expect(result2.success).toBe(true);

      // Verify total quantity is 75 and prices updated
      const batches = await inventoryService.listStockBatches();
      const updatedBatch = batches.find(b => b.batchNumber === 'DUP-BATCH');

      expect(updatedBatch).toBeDefined();
      expect(updatedBatch?.quantityAvailable).toBe(75);
      expect(updatedBatch?.purchasePrice).toBe(1200);
      expect(updatedBatch?.sellingPrice).toBe(1600);
    });

    it('should fail with negative or zero quantity', async () => {
       const med = await inventoryService.createMedicine({
        name: 'Vitamin C',
        dosageForm: 'Tablet',
        unitType: 'Bottle'
      });

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = await inventoryService.inwardBatch({
        medicineId: med.id,
        batchNumber: 'BATCH-ZERO',
        expiryDate: futureDate.toISOString().split('T')[0],
        purchasePrice: 100,
        sellingPrice: 150,
        quantity: 0
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quantity must be a positive integer');
    });
  });
});
