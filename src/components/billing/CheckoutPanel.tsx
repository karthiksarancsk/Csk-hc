'use client';

import { useState, useEffect } from 'react';
import { CartItem } from './CartTable';

interface CheckoutPanelProps {
  items: CartItem[];
  onComplete: (data: any) => void;
  isSubmitting: boolean;
}

export default function CheckoutPanel({ items, onComplete, isSubmitting }: CheckoutPanelProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('CASH');
  const [discountInput, setDiscountInput] = useState<string>('');

  const subtotalCents = items.reduce((acc, item) => acc + (item.cartQuantity * item.sellingPrice), 0);
  const discountCents = discountInput ? Math.round(parseFloat(discountInput) * 100) : 0;

  // Safe bounded total
  const finalTotalCents = Math.max(0, subtotalCents - discountCents);

  const hasOverselling = items.some(i => i.cartQuantity > i.quantityAvailable);
  const hasInvalidQty = items.some(i => i.cartQuantity <= 0 || isNaN(i.cartQuantity));
  const isValid = items.length > 0 && !hasOverselling && !hasInvalidQty && discountCents <= subtotalCents;

  const handleSubmit = () => {
    if (!isValid || isSubmitting) return;

    onComplete({
      customerName,
      customerPhone,
      paymentMode,
      discountAmount: discountCents
    });
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        document.getElementById('pos-payment-mode')?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-6">
      <h3 className="text-lg font-bold mb-4 border-b pb-2">Checkout Summary</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Customer Name (Optional)</label>
            <input
              type="text"
              className="w-full border rounded p-2 focus:ring focus:ring-blue-200"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Customer Phone (Optional)</label>
            <input
              type="text"
              className="w-full border rounded p-2 focus:ring focus:ring-blue-200"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Mode * (F4 to focus)</label>
            <select
              id="pos-payment-mode"
              className="w-full border rounded p-2 focus:ring focus:ring-blue-200 font-medium"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as any)}
              onKeyDown={handleInputKeyDown}
            >
              <option value="CASH">CASH</option>
              <option value="UPI">UPI / Scan</option>
              <option value="CARD">CARD / POS</option>
              <option value="SPLIT">SPLIT / Multiple</option>
            </select>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded border space-y-3">
           <div className="flex justify-between text-gray-600">
             <span>Subtotal</span>
             <span>{(subtotalCents / 100).toFixed(2)}</span>
           </div>
           <div className="flex justify-between items-center text-gray-600">
             <span>Discount Amount</span>
             <input
               type="number"
               min="0"
               step="0.01"
               className="w-24 border rounded p-1 text-right focus:ring focus:ring-blue-200"
               placeholder="0.00"
               value={discountInput}
               onChange={(e) => setDiscountInput(e.target.value)}
             />
           </div>
           {discountCents > subtotalCents && (
             <div className="text-red-500 text-xs text-right">Discount cannot exceed subtotal.</div>
           )}
           <div className="border-t pt-3 mt-3 flex justify-between items-center">
             <span className="text-lg font-bold">Grand Total</span>
             <span className="text-2xl font-bold text-green-700">{(finalTotalCents / 100).toFixed(2)}</span>
           </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className={`px-8 py-3 rounded text-lg font-bold transition-colors ${
            isValid && !isSubmitting
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Processing...' : 'Complete & Print Bill'}
        </button>
      </div>
    </div>
  );
}
