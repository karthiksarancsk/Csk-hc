import { getDb } from '@/lib/db';

export interface CartItemDTO {
  batchId: number;
  quantity: number;
}

export interface CheckoutDTO {
  customerName?: string;
  customerPhone?: string;
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'SPLIT';
  discountAmount?: number; // Integer in cents/paisa
  items: CartItemDTO[];
}

export interface BatchBillingCandidate {
  batchId: number;
  batchNumber: string;
  medicineId: number;
  medicineName: string;
  genericName: string | null;
  dosageForm: string;
  expiryDate: string;
  quantityAvailable: number;
  sellingPrice: number; // In cents/paisa
  isExpired: boolean;
  daysToExpiry: number;
}

export interface InvoiceDetailView {
  id: number;
  invoiceNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentMode: string;
  status: string;
  createdAt: string;
  items: {
    batchId: number;
    medicineName: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export class DefaultBillingService {
  async getAvailableBatchesForBilling(query?: string): Promise<BatchBillingCandidate[]> {
    const db = getDb();

    let sql = `
      SELECT
        b.id as batchId,
        b.batch_number as batchNumber,
        m.id as medicineId,
        m.name as medicineName,
        m.generic_name as genericName,
        m.dosage_form as dosageForm,
        b.expiry_date as expiryDate,
        b.quantity_available as quantityAvailable,
        b.selling_price as sellingPrice,
        CAST(julianday(b.expiry_date) - julianday('now') AS INTEGER) as daysToExpiry
      FROM inventory_batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE b.quantity_available > 0
        AND date(b.expiry_date) > date('now')
    `;

    const params: any = {};

    if (query && query.trim() !== '') {
      sql += ' AND (m.name LIKE @searchQuery OR m.generic_name LIKE @searchQuery OR b.batch_number LIKE @searchQuery)';
      params.searchQuery = `%${query.trim()}%`;
    }

    sql += ' ORDER BY b.expiry_date ASC';

    const stmt = db.prepare(sql);
    const rows = stmt.all(params) as any[];

    return rows.map(row => ({
      ...row,
      isExpired: false, // Since we filter > date('now'), none of these are expired
    }));
  }

  async createInvoice(payload: CheckoutDTO): Promise<{ invoiceId: number; invoiceNumber: string; success: boolean; error?: string }> {
    const db = getDb();

    if (!payload.items || payload.items.length === 0) {
      return { invoiceId: 0, invoiceNumber: '', success: false, error: 'Cart is empty.' };
    }

    try {
      const result = db.transaction(() => {
        let subtotal = 0;

        // 1. Verify items and calculate subtotal
        for (const item of payload.items) {
          if (item.quantity <= 0) {
            throw new Error(`Invalid quantity ${item.quantity} for batch ${item.batchId}`);
          }

          const batchRow = db.prepare(`
            SELECT quantity_available, selling_price, expiry_date,
                   CAST(julianday(expiry_date) - julianday(date('now', 'localtime')) AS INTEGER) as days_to_expiry
            FROM inventory_batches
            WHERE id = ?
          `).get(item.batchId) as any;

          if (!batchRow) {
            throw new Error(`Batch ${item.batchId} not found.`);
          }

          // Hard block billing of expired batches using localtime
          if (batchRow.days_to_expiry <= 0) {
            throw new Error(`Batch ${item.batchId} is expired and cannot be sold.`);
          }

          if (batchRow.quantity_available < item.quantity) {
            throw new Error(`Insufficient stock for batch ${item.batchId}.`);
          }

          subtotal += batchRow.selling_price * item.quantity;
        }

        const discountAmount = payload.discountAmount || 0;

        if (discountAmount < 0) {
           throw new Error('Discount amount cannot be negative.');
        }

        const totalAmount = subtotal - discountAmount;

        if (totalAmount < 0) {
           throw new Error('Discount cannot be greater than subtotal.');
        }

        // 2. Generate invoice number
        // Simple generation: INV-YYYYMMDD-XXXX
        const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const countRow = db.prepare(`
          SELECT COUNT(*) as count
          FROM invoices
          WHERE date(created_at) = date('now')
        `).get() as { count: number };

        const nextId = (countRow.count + 1).toString().padStart(4, '0');
        const invoiceNumber = `INV-${todayStr}-${nextId}`;

        // 3. Insert into invoices
        const insertInvoiceStmt = db.prepare(`
          INSERT INTO invoices (invoice_number, customer_name, customer_phone, subtotal, discount_amount, total_amount, payment_mode)
          VALUES (@invoiceNumber, @customerName, @customerPhone, @subtotal, @discountAmount, @totalAmount, @paymentMode)
        `);

        const invoiceInfo = insertInvoiceStmt.run({
          invoiceNumber,
          customerName: payload.customerName || null,
          customerPhone: payload.customerPhone || null,
          subtotal,
          discountAmount,
          totalAmount,
          paymentMode: payload.paymentMode,
        });

        const invoiceId = invoiceInfo.lastInsertRowid as number;

        // 4. Insert line items & deduct stock
        const insertItemStmt = db.prepare(`
          INSERT INTO invoice_items (invoice_id, batch_id, quantity, unit_price, total_price)
          VALUES (@invoiceId, @batchId, @quantity, @unitPrice, @totalPrice)
        `);

        const updateStockStmt = db.prepare(`
          UPDATE inventory_batches
          SET quantity_available = quantity_available - @quantity
          WHERE id = @batchId
        `);

        for (const item of payload.items) {
           const batchRow = db.prepare(`
            SELECT selling_price
            FROM inventory_batches
            WHERE id = ?
          `).get(item.batchId) as any;

          const unitPrice = batchRow.selling_price;
          const totalPrice = unitPrice * item.quantity;

          insertItemStmt.run({
            invoiceId,
            batchId: item.batchId,
            quantity: item.quantity,
            unitPrice,
            totalPrice
          });

          updateStockStmt.run({
            quantity: item.quantity,
            batchId: item.batchId
          });
        }

        return { invoiceId, invoiceNumber };
      })();

      return { ...result, success: true };
    } catch (error: any) {
      return { invoiceId: 0, invoiceNumber: '', success: false, error: error.message };
    }
  }

  async getInvoiceById(id: number): Promise<InvoiceDetailView | null> {
    const db = getDb();

    const invoice = db.prepare(`
      SELECT * FROM invoices WHERE id = ?
    `).get(id) as any;

    if (!invoice) return null;

    const items = db.prepare(`
      SELECT
        ii.batch_id as batchId,
        m.name as medicineName,
        b.batch_number as batchNumber,
        b.expiry_date as expiryDate,
        ii.quantity,
        ii.unit_price as unitPrice,
        ii.total_price as totalPrice
      FROM invoice_items ii
      JOIN inventory_batches b ON ii.batch_id = b.id
      JOIN medicines m ON b.medicine_id = m.id
      WHERE ii.invoice_id = ?
    `).all(id) as any[];

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      customerName: invoice.customer_name,
      customerPhone: invoice.customer_phone,
      subtotal: invoice.subtotal,
      discountAmount: invoice.discount_amount,
      totalAmount: invoice.total_amount,
      paymentMode: invoice.payment_mode,
      status: invoice.status,
      createdAt: invoice.created_at,
      items
    };
  }

  async listRecentInvoices(limit = 20): Promise<InvoiceDetailView[]> {
    const db = getDb();

    const invoices = db.prepare(`
      SELECT * FROM invoices ORDER BY created_at DESC LIMIT ?
    `).all(limit) as any[];

    const invoiceViews: InvoiceDetailView[] = [];

    const getItemsStmt = db.prepare(`
      SELECT
        ii.batch_id as batchId,
        m.name as medicineName,
        b.batch_number as batchNumber,
        b.expiry_date as expiryDate,
        ii.quantity,
        ii.unit_price as unitPrice,
        ii.total_price as totalPrice
      FROM invoice_items ii
      JOIN inventory_batches b ON ii.batch_id = b.id
      JOIN medicines m ON b.medicine_id = m.id
      WHERE ii.invoice_id = ?
    `);

    for (const inv of invoices) {
      const items = getItemsStmt.all(inv.id) as any[];
      invoiceViews.push({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        customerName: inv.customer_name,
        customerPhone: inv.customer_phone,
        subtotal: inv.subtotal,
        discountAmount: inv.discount_amount,
        totalAmount: inv.total_amount,
        paymentMode: inv.payment_mode,
        status: inv.status,
        createdAt: inv.created_at,
        items
      });
    }

    return invoiceViews;
  }

  async voidInvoice(invoiceId: number): Promise<{ success: boolean; error?: string }> {
    const db = getDb();

    try {
      const result = db.transaction(() => {
        const invoice = db.prepare('SELECT status FROM invoices WHERE id = ?').get(invoiceId) as any;
        if (!invoice) throw new Error('Invoice not found');
        if (invoice.status === 'VOID') throw new Error('Invoice is already voided');

        // Mark invoice as void
        db.prepare("UPDATE invoices SET status = 'VOID' WHERE id = ?").run(invoiceId);

        // Fetch line items to re-increment inventory
        const items = db.prepare('SELECT batch_id, quantity FROM invoice_items WHERE invoice_id = ?').all(invoiceId) as any[];

        const updateStockStmt = db.prepare(`
          UPDATE inventory_batches
          SET quantity_available = quantity_available + @quantity
          WHERE id = @batchId
        `);

        for (const item of items) {
          updateStockStmt.run({
            quantity: item.quantity,
            batchId: item.batch_id
          });
        }

        return true;
      })();

      return { success: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const billingService = new DefaultBillingService();
