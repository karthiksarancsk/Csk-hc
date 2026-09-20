'use client';

import { useEffect, useState } from 'react';
import { InvoiceDetailView } from '@/services/billing';

interface PrintableReceiptProps {
  invoice: InvoiceDetailView;
  onClose: () => void;
}

export default function PrintableReceipt({ invoice, onClose }: PrintableReceiptProps) {
  const [printerSize, setPrinterSize] = useState<'80mm' | '58mm'>('80mm');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('pos_printer_size');
    if (saved === '80mm' || saved === '58mm') {
      setPrinterSize(saved);
    }

    // Attempt auto-print when modal opens
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const printWidth = printerSize === '80mm' ? '72mm' : '48mm';

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 print:bg-transparent print:static print:inset-auto print:block print:w-full">
      {/* Modal Container for Screen, acts as wrapper for print */}
      <div className="bg-white p-4 max-w-sm w-full mx-auto rounded shadow-2xl relative print:hidden">
        {/* Screen Version - Standard sizing */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
        >
          ✕ Close
        </button>
        <div className="font-mono text-xs text-black w-full mb-4">
          <h2 className="text-lg font-bold text-center">CSK PHARMACY</h2>
          <p className="text-center">Receipt preview loaded.</p>
          <p className="text-center">Total: {(invoice.totalAmount / 100).toFixed(2)}</p>
        </div>
        <div className="mt-6 flex flex-col gap-2">
           <button
             onClick={() => window.print()}
             className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 w-full"
           >
             Print Receipt
           </button>
           <button
             onClick={onClose}
             className="bg-gray-200 text-black px-6 py-2 rounded font-bold hover:bg-gray-300 w-full"
           >
             Close & New Sale
           </button>
        </div>
      </div>

      {/* Actual Print Content - Rendered differently using print css */}
      <div id="printable-receipt" style={{ width: printWidth }}>
        <div className="font-mono text-black break-words">
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">CSK PHARMACY</h2>
            <p>123 Health Street, City</p>
            <p>Phone: (555) 012-3456</p>
            <div className="border-b border-dashed border-gray-400 my-2"></div>
            <h3 className="font-bold">TAX INVOICE</h3>
          </div>

          {/* Meta Info */}
          <div className="mb-2">
            <div className="flex justify-between">
              <span>Inv: {invoice.invoiceNumber}</span>
              <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
            </div>
            {invoice.customerName && (
              <div>Cust: {invoice.customerName}</div>
            )}
            {invoice.customerPhone && (
              <div>Ph: {invoice.customerPhone}</div>
            )}
          </div>

          <div className="border-b border-dashed border-gray-400 my-2"></div>

          {/* Line Items Table */}
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-dashed border-gray-400">
                <th className="pb-1 w-7/12">Item/Batch</th>
                <th className="pb-1 w-2/12 text-right">Qty</th>
                <th className="pb-1 w-3/12 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="align-top">
                  <td className="py-1 break-words max-w-0">
                    <div className="font-bold leading-tight">{item.medicineName}</div>
                    <div className="text-[10px] text-gray-800">{item.batchNumber} (Exp:{item.expiryDate.substring(0,7)})</div>
                  </td>
                  <td className="py-1 text-right whitespace-nowrap">{item.quantity}</td>
                  <td className="py-1 text-right whitespace-nowrap">{(item.totalPrice / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-b border-dashed border-gray-400 my-2"></div>

          {/* Summary block */}
          <div className="space-y-1 mb-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{(invoice.subtotal / 100).toFixed(2)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-{(invoice.discountAmount / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[12px] pt-1 border-t border-dashed border-gray-400">
              <span>TOTAL (Paid):</span>
              <span>{(invoice.totalAmount / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Mode:</span>
              <span>{invoice.paymentMode}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-gray-400 my-2"></div>

          {/* Footer */}
          <div className="text-center text-[10px] mt-4 mb-2">
            <p>Prescription medicines dispensed.</p>
            <p>Check batch & expiry before use.</p>
            <p className="mt-2 font-bold">Thank you for your visit!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
