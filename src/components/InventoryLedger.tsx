'use client';

import { useState, useEffect } from 'react';
import { getInventoryAction } from '@/actions/inventoryActions';
import { InventoryItemView } from '@/services/inventory';

export default function InventoryLedger({ refreshKey = 0 }: { refreshKey?: number }) {
  const [inventory, setInventory] = useState<InventoryItemView[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [hideZeroStock, setHideZeroStock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initial load and debounced filter
  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoading(true);
      const data = await getInventoryAction(filterQuery, hideZeroStock);
      setInventory(data);
      setIsLoading(false);
    };

    const timer = setTimeout(() => {
      fetchInventory();
    }, 300);

    return () => clearTimeout(timer);
  }, [filterQuery, hideZeroStock, refreshKey]);

  const getStatusBadge = (item: InventoryItemView) => {
    if (item.isExpired) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">Expired</span>;
    }
    if (item.daysToExpiry <= 90) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">Near Expiry ({item.daysToExpiry}d)</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Active</span>;
  };

  const getRowClass = (item: InventoryItemView) => {
    if (item.isExpired) return 'bg-red-50';
    if (item.daysToExpiry <= 90) return 'bg-yellow-50';
    return '';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h2 className="text-xl font-bold">Inventory Ledger</h2>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search medicine or batch..."
            className="border rounded p-2 focus:ring focus:ring-blue-200"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={hideZeroStock}
              onChange={(e) => setHideZeroStock(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Hide Zero Stock</span>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 border-b font-semibold">Medicine Name</th>
              <th className="p-3 border-b font-semibold">Generic Name</th>
              <th className="p-3 border-b font-semibold">Batch No.</th>
              <th className="p-3 border-b font-semibold">Expiry Date</th>
              <th className="p-3 border-b font-semibold text-right">Stock</th>
              <th className="p-3 border-b font-semibold text-right">MRP</th>
              <th className="p-3 border-b font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">Loading inventory...</td>
              </tr>
            ) : inventory.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">No inventory items found.</td>
              </tr>
            ) : (
              inventory.map((item) => (
                <tr key={item.id} className={`border-b hover:bg-gray-50 ${getRowClass(item)}`}>
                  <td className="p-3">{item.medicineName}</td>
                  <td className="p-3 text-gray-600 text-sm">{item.genericName || '-'}</td>
                  <td className="p-3 font-mono text-sm">{item.batchNumber}</td>
                  <td className="p-3">{item.expiryDate}</td>
                  <td className="p-3 text-right font-medium">{item.quantityAvailable}</td>
                  <td className="p-3 text-right">{(item.sellingPrice / 100).toFixed(2)}</td>
                  <td className="p-3 text-center">{getStatusBadge(item)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
