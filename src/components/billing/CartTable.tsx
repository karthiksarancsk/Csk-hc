'use client';

import { BatchBillingCandidate } from '@/services/billing';

export interface CartItem extends BatchBillingCandidate {
  cartQuantity: number;
}

interface CartTableProps {
  items: CartItem[];
  onUpdateQuantity: (batchId: number, newQty: number) => void;
  onRemove: (batchId: number) => void;
}

export default function CartTable({ items, onUpdateQuantity, onRemove }: CartTableProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow border-2 border-dashed border-gray-300 text-center text-gray-500">
        Cart is empty. Use the Quick Search above to add items.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="p-3 border-b font-semibold">Medicine</th>
            <th className="p-3 border-b font-semibold">Batch</th>
            <th className="p-3 border-b font-semibold">Expiry</th>
            <th className="p-3 border-b font-semibold text-center">Available</th>
            <th className="p-3 border-b font-semibold text-right">MRP</th>
            <th className="p-3 border-b font-semibold text-center w-32">Qty</th>
            <th className="p-3 border-b font-semibold text-right">Total</th>
            <th className="p-3 border-b font-semibold text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isOverselling = item.cartQuantity > item.quantityAvailable;
            const lineTotal = (item.cartQuantity * item.sellingPrice) / 100;

            return (
              <tr key={item.batchId} className={`border-b ${isOverselling ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                <td className="p-3">
                  <div className="font-medium">{item.medicineName}</div>
                  <div className="text-xs text-gray-500">{item.genericName || '-'}</div>
                </td>
                <td className="p-3 font-mono text-sm">{item.batchNumber}</td>
                <td className="p-3">{item.expiryDate}</td>
                <td className="p-3 text-center text-sm font-medium">{item.quantityAvailable}</td>
                <td className="p-3 text-right">{(item.sellingPrice / 100).toFixed(2)}</td>
                <td className="p-3 text-center">
                  <input
                    type="number"
                    min="1"
                    max={item.quantityAvailable}
                    value={item.cartQuantity}
                    onKeyDown={(e) => {
                      if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onUpdateQuantity(item.batchId, isNaN(val) ? 1 : val);
                    }}
                    className={`w-20 text-center border rounded p-1 ${isOverselling ? 'border-red-500 focus:ring-red-200' : 'focus:ring-blue-200'}`}
                  />
                </td>
                <td className="p-3 text-right font-semibold">
                  {lineTotal.toFixed(2)}
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => onRemove(item.batchId)}
                    className="text-red-500 hover:text-red-700 font-medium px-2 py-1"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
