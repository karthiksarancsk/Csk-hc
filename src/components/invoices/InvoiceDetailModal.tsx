'use client';

import { InvoiceDetailView } from '@/services/billing';
import PrintableReceipt from '@/components/billing/PrintableReceipt';
import { useState } from 'react';
import { voidInvoiceAction } from '@/actions/invoiceActions';

interface Props {
  invoice: InvoiceDetailView;
  onClose: () => void;
  onVoided: () => void;
}

export default function InvoiceDetailModal({ invoice, onClose, onVoided }: Props) {
  const [showPrint, setShowPrint] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (showPrint) {
    return <PrintableReceipt invoice={invoice} onClose={() => setShowPrint(false)} />;
  }

  const handleVoid = async () => {
    if (!confirm('Are you sure you want to void this invoice? This will restore stock quantities.')) {
      return;
    }
    setIsVoiding(true);
    setError(null);
    try {
      const res = await voidInvoiceAction(invoice.id);
      if (res.success) {
        onVoided();
      } else {
        setError(res.error || 'Failed to void invoice');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsVoiding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Invoice {invoice.invoiceNumber}</h2>
            <div className="text-sm text-gray-500">{new Date(invoice.createdAt).toLocaleString()}</div>
            {invoice.status === 'VOID' && (
              <span className="inline-flex mt-2 items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                VOIDED
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && <div className="mb-4 rounded bg-red-50 p-2 text-sm text-red-600">{error}</div>}

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <div className="text-gray-500">Customer</div>
            <div className="font-medium">{invoice.customerName || 'Walk-in Customer'}</div>
            {invoice.customerPhone && <div className="text-gray-500">{invoice.customerPhone}</div>}
          </div>
          <div>
            <div className="text-gray-500">Payment Mode</div>
            <div className="font-medium">{invoice.paymentMode}</div>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 text-left uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.medicineName}</td>
                  <td className="px-4 py-3 text-gray-500">{item.batchNumber}</td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">{(item.unitPrice / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{(item.totalPrice / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-medium">
              <tr>
                <td colSpan={4} className="px-4 py-2 text-right text-gray-500">Subtotal</td>
                <td className="px-4 py-2 text-right text-gray-900">{(invoice.subtotal / 100).toFixed(2)}</td>
              </tr>
              {invoice.discountAmount > 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-right text-gray-500">Discount</td>
                  <td className="px-4 py-2 text-right text-red-600">-{(invoice.discountAmount / 100).toFixed(2)}</td>
                </tr>
              )}
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-900">Total</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">{(invoice.totalAmount / 100).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowPrint(true)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reprint Receipt
          </button>
          {invoice.status === 'PAID' && (
            <button
              onClick={handleVoid}
              disabled={isVoiding}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isVoiding ? 'Voiding...' : 'Void Invoice'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}