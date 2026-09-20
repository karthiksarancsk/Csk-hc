# Medical Billing System (POS & Expiry Guard)

A streamlined, local-first retail pharmacy management system built with Next.js (App Router), TypeScript, Tailwind CSS, and SQLite (`better-sqlite3`).

## System Prerequisites
- **Node.js LTS** (version 18 or higher)
- **npm** (comes with Node.js)

## Initial Database Setup
Before running the application for the first time, you must initialize the local SQLite database schema. Run the following command in your terminal:
```bash
npm install
npm run db:setup
```

## Running the Application
For pharmacy desktop usage on Windows, simply double-click the `run_app.bat` file.
Alternatively, from the terminal, run:
```bash
npm run build && npm run start
```

## Store Configuration (Receipt Printing)
The thermal print receipt includes a hardcoded header (`CSK PHARMACY`). You can update the store name, address, and contact number in `src/components/billing/PrintableReceipt.tsx` to match your pharmacy's specific details, including Drug License or Tax Number.
You can select the Thermal Printer Paper Size (80mm vs 58mm) dynamically in the `/settings` UI page.

## Database Backup
The system includes an automated one-click hot-backup utility.
Navigate to the `/settings` page in the application and click **"Download Database Backup"**. Save this snapshot to a safe location, like an external USB drive.
