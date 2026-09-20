'use client';

import { useState, useEffect } from 'react';
import { searchBillingBatchesAction } from '@/actions/billingActions';
import { BatchBillingCandidate } from '@/services/billing';

export default function QuickSearch({ onSelect }: { onSelect: (batch: BatchBillingCandidate) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BatchBillingCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('pos-quick-search')?.focus();
      } else if (e.key === 'Escape') {
        setQuery('');
        setResults([]);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (query.trim().length > 0) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        const batches = await searchBillingBatchesAction(query);
        setResults(batches);
        setIsSearching(false);
        setFocusedIndex(-1);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSelect = (batch: BatchBillingCandidate) => {
    onSelect(batch);
    setQuery('');
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < results.length) {
        handleSelect(results[focusedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    }
  };

  return (
    <div className="relative mb-6">
      <input
        id="pos-quick-search"
        type="text"
        className="w-full border-2 border-blue-400 rounded-lg p-3 text-lg focus:ring-4 focus:ring-blue-100 outline-none"
        placeholder="Quick Search: Medicine Name, Generic Name, or Batch Number (Press Enter | F2 to focus)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />

      {query.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border rounded shadow-xl max-h-80 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-gray-500">Searching inventory...</div>
          ) : results.length > 0 ? (
            <table className="w-full text-left text-sm">
               <thead>
                 <tr className="bg-gray-50">
                    <th className="p-2 border-b">Medicine</th>
                    <th className="p-2 border-b">Batch</th>
                    <th className="p-2 border-b">Expiry</th>
                    <th className="p-2 border-b text-right">Stock</th>
                    <th className="p-2 border-b text-right">MRP</th>
                 </tr>
               </thead>
               <tbody>
                {results.map((batch, idx) => (
                  <tr
                    key={batch.batchId}
                    className={`cursor-pointer hover:bg-blue-50 ${focusedIndex === idx ? 'bg-blue-100' : ''}`}
                    onClick={() => handleSelect(batch)}
                  >
                    <td className="p-2 border-b font-medium">{batch.medicineName} <span className="text-gray-500 font-normal">({batch.dosageForm})</span></td>
                    <td className="p-2 border-b font-mono">{batch.batchNumber}</td>
                    <td className="p-2 border-b">{batch.expiryDate}</td>
                    <td className="p-2 border-b text-right text-green-600 font-bold">{batch.quantityAvailable}</td>
                    <td className="p-2 border-b text-right">{(batch.sellingPrice / 100).toFixed(2)}</td>
                  </tr>
                ))}
               </tbody>
            </table>
          ) : (
            <div className="p-4 text-gray-500">No active stock found.</div>
          )}
        </div>
      )}
    </div>
  );
}
