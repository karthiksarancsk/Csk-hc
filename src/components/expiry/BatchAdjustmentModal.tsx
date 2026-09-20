'use client';

import { useState } from 'react';
import { writeOffBatchAction } from '@/actions/expiryActions';
import { ExpiringBatchView } from '@/services/expiry';

interface Props {
  batch: ExpiringBatchView;
  onClose: () => void;
}

export default function BatchAdjustmentModal({ batch, onClose }: Props) {
  const [quantity, setQuantity] = useState(batch.quantityAvailable);
  const [reason, setReason] = useState('EXPIRED');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await writeOffBatchAction(batch.id, quantity, reason, notes);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Failed to adjust stock');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Adjust Stock / Write Off</h2>

        <div className="mb-4 rounded bg-gray-50 p-3 text-sm text-gray-700">
          <div><strong>Medicine:</strong> {batch.medicineName}</div>
          <div><strong>Batch:</strong> {batch.batchNumber}</div>
          <div><strong>Current Qty:</strong> {batch.quantityAvailable}</div>
          <div><strong>Expiry:</strong> {batch.expiryDate}</div>
        </div>

        {error && <div className="mb-4 rounded bg-red-50 p-2 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity to Deduct</label>
            <input
              type="number"
              min="1"
              max={batch.quantityAvailable}
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reason</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="EXPIRED">Expired</option>
              <option value="DAMAGED">Damaged</option>
              <option value="RETURNED_TO_VENDOR">Returned to Vendor</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || quantity <= 0 || quantity > batch.quantityAvailable}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}