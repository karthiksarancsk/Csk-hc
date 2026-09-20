'use client';

import { useState } from 'react';
import QuickSearch from '@/components/billing/QuickSearch';
import CartTable, { CartItem } from '@/components/billing/CartTable';
import CheckoutPanel from '@/components/billing/CheckoutPanel';
import PrintableReceipt from '@/components/billing/PrintableReceipt';
import { createInvoiceAction } from '@/actions/billingActions';
import { BatchBillingCandidate, InvoiceDetailView } from '@/services/billing';

export default function BillingPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<InvoiceDetailView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddBatch = (batch: BatchBillingCandidate) => {
    setCart(prev => {
      const existing = prev.find(item => item.batchId === batch.batchId);
      if (existing) {
        // Increment quantity if not exceeding available
        return prev.map(item =>
          item.batchId === batch.batchId
            ? { ...item, cartQuantity: Math.min(item.cartQuantity + 1, item.quantityAvailable) }
            : item
        );
      }
      return [...prev, { ...batch, cartQuantity: 1 }];
    });
  };

  const handleUpdateQuantity = (batchId: number, qty: number) => {
    setCart(prev => prev.map(item =>
      item.batchId === batchId ? { ...item, cartQuantity: qty } : item
    ));
  };

  const handleRemoveItem = (batchId: number) => {
    setCart(prev => prev.filter(item => item.batchId !== batchId));
  };

  const handleCheckout = async (checkoutData: any) => {
    setIsSubmitting(true);
    setError(null);

    const payload = {
      ...checkoutData,
      items: cart.map(item => ({
        batchId: item.batchId,
        quantity: item.cartQuantity
      }))
    };

    try {
      const result = await createInvoiceAction(payload);
      if (result.success) {
        // Optimistically reconstruct the invoice view for the receipt
        // to avoid another server roundtrip immediately if possible,
        // but we can also just fetch it. Let's construct a local view for speed.

        const localInvoice: InvoiceDetailView = {
          id: result.invoiceId,
          invoiceNumber: result.invoiceNumber,
          customerName: checkoutData.customerName || null,
          customerPhone: checkoutData.customerPhone || null,
          paymentMode: checkoutData.paymentMode,
          subtotal: cart.reduce((acc, item) => acc + (item.cartQuantity * item.sellingPrice), 0),
          discountAmount: checkoutData.discountAmount,
          totalAmount: cart.reduce((acc, item) => acc + (item.cartQuantity * item.sellingPrice), 0) - checkoutData.discountAmount,
          status: 'PAID',
          createdAt: new Date().toISOString(),
          items: cart.map(item => ({
            batchId: item.batchId,
            medicineName: item.medicineName,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            quantity: item.cartQuantity,
            unitPrice: item.sellingPrice,
            totalPrice: item.cartQuantity * item.sellingPrice
          }))
        };

        setCompletedInvoice(localInvoice);
        setCart([]); // Clear cart
      } else {
        setError(result.error || 'Failed to complete transaction.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <header className="mb-4 flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Point of Sale (POS)</h1>
          <p className="text-gray-500 mt-1">Scan or search items to begin billing.</p>
        </div>
      </header>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg font-medium">
          {error}
        </div>
      )}

      {/* Main Billing Interface (Hidden when printing receipt) */}
      <div className="print:hidden">
        <QuickSearch onSelect={handleAddBatch} />

        <CartTable
          items={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemove={handleRemoveItem}
        />

        <CheckoutPanel
          items={cart}
          onComplete={handleCheckout}
          isSubmitting={isSubmitting}
        />
      </div>

      {/* Receipt Modal (Visible only when invoice is complete, handles its own print styles) */}
      {completedInvoice && (
        <PrintableReceipt
          invoice={completedInvoice}
          onClose={() => {
            setCompletedInvoice(null);
            setTimeout(() => {
              document.getElementById('pos-quick-search')?.focus();
            }, 50);
          }}
        />
      )}

    </div>
  );
}
