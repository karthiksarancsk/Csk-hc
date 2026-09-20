import { getRecentInvoicesAction } from '@/actions/billingActions';
import InvoiceList from '@/components/invoices/InvoiceList';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const invoices = await getRecentInvoicesAction();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Sales Ledger & Invoice Audit</h1>
          <p className="mt-2 text-sm text-gray-700">
            View recent transactions, track sales totals, reprint receipts, and void invoices.
          </p>
        </div>
      </div>

      <InvoiceList initialInvoices={invoices} />
    </div>
  );
}