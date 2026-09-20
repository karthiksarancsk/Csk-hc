'use client';

import { InvoiceDetailView } from '@/services/billing';
import { useState } from 'react';
import InvoiceDetailModal from './InvoiceDetailModal';

export default function InvoiceList({ initialInvoices }: { initialInvoices: InvoiceDetailView[] }) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetailView | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customerPhone && inv.customerPhone.includes(searchTerm)) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesDate = true;
    const invDateStr = inv.createdAt.split('T')[0];

    if (startDate) {
      matchesDate = matchesDate && (invDateStr >= startDate);
    }
    if (endDate) {
      matchesDate = matchesDate && (invDateStr <= endDate);
    }

    return matchesSearch && matchesDate;
  });

  const totalSales = filteredInvoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const handleVoided = (id: number) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: 'VOID' } : inv));
    setSelectedInvoice(null);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
          <input
            type="text"
            className="w-full sm:max-w-xs rounded-md border-gray-300 border px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            placeholder="Search by Invoice ID, Name, Phone"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              className="rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border shadow-sm shrink-0">
          <span className="text-sm text-gray-500 mr-2">Total Paid Sales:</span>
          <span className="text-xl font-bold text-green-600">{(totalSales / 100).toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white shadow ring-1 ring-black ring-opacity-5 md:rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Invoice Number</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date/Time</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Customer</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Payment</th>
              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Total Amount</th>
              <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Status</th>
              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredInvoices.map((inv) => (
              <tr key={inv.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{inv.invoiceNumber}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(inv.createdAt).toLocaleString()}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <div>{inv.customerName || '-'}</div>
                  <div className="text-xs">{inv.customerPhone}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{inv.paymentMode}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-gray-900">{(inv.totalAmount / 100).toFixed(2)}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                  {inv.status === 'PAID' ? (
                     <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">PAID</span>
                  ) : (
                     <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">VOID</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500 text-sm">No invoices found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onVoided={() => handleVoided(selectedInvoice.id)}
        />
      )}
    </div>
  );
}