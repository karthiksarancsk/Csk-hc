-- Enable foreign key integrity
PRAGMA foreign_keys = ON;

-- 1. Medicines master catalog
CREATE TABLE IF NOT EXISTS medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL COLLATE NOCASE,
    generic_name TEXT,
    manufacturer TEXT,
    dosage_form TEXT CHECK(dosage_form IN ('Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Other')),
    unit_type TEXT NOT NULL DEFAULT 'Strip', -- e.g., Strip, Bottle, Vial, Tube
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Inventory batches with expiration tracking
CREATE TABLE IF NOT EXISTS inventory_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_id INTEGER NOT NULL,
    batch_number TEXT NOT NULL COLLATE NOCASE,
    expiry_date TEXT NOT NULL, -- Format: YYYY-MM-DD
    purchase_price INTEGER NOT NULL DEFAULT 0, -- Unit purchase rate in cents/paisa
    selling_price INTEGER NOT NULL,            -- MRP per unit in cents/paisa
    quantity_available INTEGER NOT NULL DEFAULT 0 CHECK(quantity_available >= 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT,
    UNIQUE (medicine_id, batch_number)
);

-- Indexes for lightning-fast lookups
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_medicine ON inventory_batches(medicine_id);

-- 3. Invoices ledger
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL UNIQUE, -- e.g., INV-20260920-0001
    customer_name TEXT,
    customer_phone TEXT,
    subtotal INTEGER NOT NULL,           -- In cents/paisa
    discount_amount INTEGER NOT NULL DEFAULT 0, -- In cents/paisa
    total_amount INTEGER NOT NULL,       -- subtotal - discount_amount
    payment_mode TEXT NOT NULL CHECK(payment_mode IN ('CASH', 'UPI', 'CARD', 'SPLIT')),
    status TEXT CHECK(status IN ('PAID', 'VOID')) DEFAULT 'PAID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Invoice line items (batch-traceable)
CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    batch_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unit_price INTEGER NOT NULL,         -- Selling price at moment of sale (cents/paisa)
    total_price INTEGER NOT NULL,        -- quantity * unit_price
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
    FOREIGN KEY (batch_id) REFERENCES inventory_batches(id) ON DELETE RESTRICT
);

-- 5. Stock Adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    quantity_deducted INTEGER NOT NULL CHECK(quantity_deducted > 0),
    reason TEXT NOT NULL CHECK(reason IN ('EXPIRED', 'DAMAGED', 'RETURNED_TO_VENDOR', 'OTHER')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES inventory_batches(id) ON DELETE RESTRICT
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_batch ON invoice_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_batch ON stock_adjustments(batch_id);
