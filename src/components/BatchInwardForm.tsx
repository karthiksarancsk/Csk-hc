'use client';

import { useState, useEffect } from 'react';
import { inwardBatchAction, searchMedicinesAction } from '@/actions/inventoryActions';
import { MedicineDTO } from '@/services/inventory';

export default function BatchInwardForm({ onSuccess }: { onSuccess?: () => void }) {
  const [medicines, setMedicines] = useState<(MedicineDTO & { id: number })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedicineId, setSelectedMedicineId] = useState<number | ''>('');
  const [isSearching, setIsSearching] = useState(false);

  const [formData, setFormData] = useState({
    batchNumber: '',
    expiryDate: '',
    purchasePrice: '', // Will convert to integer
    sellingPrice: '',  // Will convert to integer
    quantity: '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        const results = await searchMedicinesAction(searchQuery);
        setMedicines(results);
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setMedicines([]);
    }
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (selectedMedicineId === '') {
      setMessage({ type: 'error', text: 'Please select a medicine.' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(formData.expiryDate);

    if (expiry <= today) {
      setMessage({ type: 'error', text: 'Cannot inward expired goods. Expiry date must be in the future.' });
      return;
    }

    const pPrice = Math.round(parseFloat(formData.purchasePrice) * 100);
    const sPrice = Math.round(parseFloat(formData.sellingPrice) * 100);

    if (sPrice < pPrice) {
      // Soft warning implementation: prompt user if they want to proceed (mocked here as simple accept)
      if (!window.confirm("Warning: Selling price is lower than purchase price. Do you want to proceed?")) {
        return;
      }
    }

    const payload = {
      medicineId: Number(selectedMedicineId),
      batchNumber: formData.batchNumber,
      expiryDate: formData.expiryDate,
      purchasePrice: pPrice,
      sellingPrice: sPrice,
      quantity: parseInt(formData.quantity, 10),
    };

    const res = await inwardBatchAction(payload);

    if (res.success) {
      setMessage({ type: 'success', text: 'Batch inwarded successfully!' });
      setFormData({
        batchNumber: '',
        expiryDate: '',
        purchasePrice: '',
        sellingPrice: '',
        quantity: '',
      });
      setSearchQuery('');
      setSelectedMedicineId('');
      if (onSuccess) onSuccess();
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to inward batch' });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-bold mb-4">Manual Batch Entry (Inward Stock)</h2>

      {message && (
        <div className={`p-3 mb-4 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-700' :
          message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Medicine Search/Select */}
        <div className="relative">
          <label className="block text-sm font-medium mb-1">Search Medicine *</label>
          <input
            type="text"
            className="w-full border rounded p-2 focus:ring focus:ring-blue-200"
            placeholder="Type to search medicine..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedMedicineId(''); // Reset selection if they type again
            }}
          />
          {searchQuery.length > 0 && selectedMedicineId === '' && (
             <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
               {isSearching ? (
                 <div className="p-2 text-gray-500">Searching...</div>
               ) : medicines.length > 0 ? (
                 medicines.map(med => (
                   <div
                     key={med.id}
                     className="p-2 hover:bg-gray-100 cursor-pointer"
                     onClick={() => {
                       setSelectedMedicineId(med.id);
                       setSearchQuery(med.name);
                     }}
                   >
                     {med.name} <span className="text-sm text-gray-500">({med.dosageForm})</span>
                   </div>
                 ))
               ) : (
                 <div className="p-2 text-gray-500">No medicines found.</div>
               )}
             </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Batch Number *</label>
            <input
              type="text"
              required
              className="w-full border rounded p-2 focus:ring focus:ring-blue-200"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expiry Date (YYYY-MM-DD) *</label>
            <input
              type="date"
              required
              className="w-full border rounded p-2 focus:ring focus:ring-blue-200"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity Added *</label>
            <input
              type="number"
              required
              min="1"
              step="1"
              onKeyDown={(e) => {
                if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                  e.preventDefault();
                }
              }}
              className="w-full border rounded p-2 focus:ring focus:ring-blue-200"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Purchase Price</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full border rounded p-2 focus:ring focus:ring-blue-200"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">MRP (Selling Price)</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full border rounded p-2 focus:ring focus:ring-blue-200"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Inward Stock
        </button>
      </form>
    </div>
  );
}
