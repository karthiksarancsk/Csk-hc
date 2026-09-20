import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { expiryService } from '@/services/expiry';
import { inventoryService } from '@/services/inventory';
import { resetTestDb, getDb } from '@/lib/db';

describe('ExpiryService', () => {
  beforeEach(() => {
    resetTestDb();
  });

  afterAll(() => {
    resetTestDb();
  });

  it('should categorize batches into RED, ORANGE, and YELLOW', async () => {
    const med = await inventoryService.createMedicine({
      name: 'Test Med',
      dosageForm: 'Tablet',
      unitType: 'Strip'
    });

    const db = getDb();

    // Create RED batch (Expired Yesterday)
    db.prepare(`
      INSERT INTO inventory_batches (medicine_id, batch_number, expiry_date, purchase_price, selling_price, quantity_available)
      VALUES (?, ?, date('now', 'localtime', '-1 days'), 100, 200, 10)
    `).run(med.id, 'BATCH-RED');

    // Create ORANGE batch (Expiring in 29 days)
    db.prepare(`
      INSERT INTO inventory_batches (medicine_id, batch_number, expiry_date, purchase_price, selling_price, quantity_available)
      VALUES (?, ?, date('now', 'localtime', '+29 days'), 100, 200, 10)
    `).run(med.id, 'BATCH-ORANGE');

    // Create YELLOW batch (Expiring in 90 days)
    db.prepare(`
      INSERT INTO inventory_batches (medicine_id, batch_number, expiry_date, purchase_price, selling_price, quantity_available)
      VALUES (?, ?, date('now', 'localtime', '+90 days'), 100, 200, 10)
    `).run(med.id, 'BATCH-YELLOW');

    // Create SAFE batch (Expiring in 91 days)
    db.prepare(`
      INSERT INTO inventory_batches (medicine_id, batch_number, expiry_date, purchase_price, selling_price, quantity_available)
      VALUES (?, ?, date('now', 'localtime', '+91 days'), 100, 200, 10)
    `).run(med.id, 'BATCH-SAFE');

    const batches = await expiryService.getExpiringBatches(90);

    expect(batches.length).toBe(3);

    const red = batches.find(b => b.batchNumber === 'BATCH-RED');
    expect(red).toBeDefined();
    expect(red?.statusColor).toBe('RED');
    expect(red?.daysToExpiry).toBeLessThanOrEqual(0);

    const orange = batches.find(b => b.batchNumber === 'BATCH-ORANGE');
    expect(orange).toBeDefined();
    expect(orange?.statusColor).toBe('ORANGE');
    expect(orange?.daysToExpiry).toBeGreaterThan(0);
    expect(orange?.daysToExpiry).toBeLessThanOrEqual(30);

    const yellow = batches.find(b => b.batchNumber === 'BATCH-YELLOW');
    expect(yellow).toBeDefined();
    expect(yellow?.statusColor).toBe('YELLOW');
    expect(yellow?.daysToExpiry).toBeGreaterThan(30);
    expect(yellow?.daysToExpiry).toBeLessThanOrEqual(90);

    const safe = batches.find(b => b.batchNumber === 'BATCH-SAFE');
    expect(safe).toBeUndefined();
  });

  it('should return the oldest non-expired FEFO batch', async () => {
    const med = await inventoryService.createMedicine({
      name: 'Test FEFO Med',
      dosageForm: 'Tablet',
      unitType: 'Strip'
    });

    const db = getDb();

    // Expired
    db.prepare(`
      INSERT INTO inventory_batches (medicine_id, batch_number, expiry_date, purchase_price, selling_price, quantity_available)
      VALUES (?, ?, date('now', 'localtime', '-10 days'), 100, 200, 10)
    `).run(med.id, 'FEFO-EXPIRED');

    // Safe (Oldest non-expired)
    const resSafe1 = db.prepare(`
      INSERT INTO inventory_batches (medicine_id, batch_number, expiry_date, purchase_price, selling_price, quantity_available)
      VALUES (?, ?, date('now', 'localtime', '+10 days'), 100, 200, 10)
    `).run(med.id, 'FEFO-SAFE1');

    // Safer (Further away)
    db.prepare(`
      INSERT INTO inventory_batches (medicine_id, batch_number, expiry_date, purchase_price, selling_price, quantity_available)
      VALUES (?, ?, date('now', 'localtime', '+20 days'), 100, 200, 10)
    `).run(med.id, 'FEFO-SAFE2');

    const fefoId = await expiryService.getFEFOBatch(med.id);
    expect(fefoId).toBe(resSafe1.lastInsertRowid);
  });
});
