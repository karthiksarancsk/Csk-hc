'use client';

import { ExpiringBatchView } from '@/services/expiry';
import ExpiryBadge from './ExpiryBadge';
import { useState } from 'react';
import BatchAdjustmentModal from './BatchAdjustmentModal';

type TabType = 'ALL' | 'EXPIRED' | '30DAYS' | '90DAYS';

export default function ExpiryTable({ initialBatches }: { initialBatches: ExpiringBatchView[] }) {
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [selectedBatch, setSelectedBatch] = useState<ExpiringBatchView | null>(null);

  const filteredBatches = initialBatches.filter(batch => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'EXPIRED') return batch.daysToExpiry <= 0;
    if (activeTab === '30DAYS') return batch.daysToExpiry > 0 && batch.daysToExpiry <= 30;
    if (activeTab === '90DAYS') return batch.daysToExpiry > 30 && batch.daysToExpiry <= 90;
    return true;
  });

  const tabs: { id: TabType; label: string }[] = [
    { id: 'ALL', label: 'All At-Risk' },
    { id: 'EXPIRED', label: 'Expired' },
    { id: '30DAYS', label: '≤ 30 Days' },
    { id: '90DAYS', label: '≤ 90 Days' },
  ];

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {tab.id === 'ALL' ? initialBatches.length : initialBatches.filter(b => {
                  if (tab.id === 'EXPIRED') return b.daysToExpiry <= 0;
                  if (tab.id === '30DAYS') return b.daysToExpiry > 0 && b.daysToExpiry <= 30;
                  if (tab.id === '90DAYS') return b.daysToExpiry > 30 && b.daysToExpiry <= 90;
                  return false;
                }).length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white shadow ring-1 ring-black ring-opacity-5 md:rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Medicine</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Batch Number</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Expiry Date</th>
              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Qty</th>
              <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Status</th>
              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredBatches.length > 0 ? (
              filteredBatches.map((batch) => (
                <tr key={batch.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {batch.medicineName}
                    {batch.genericName && <div className="text-xs text-gray-500 font-normal">{batch.genericName}</div>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{batch.batchNumber}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{batch.expiryDate}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-gray-900">{batch.quantityAvailable}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                    <ExpiryBadge statusColor={batch.statusColor} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                    <button
                      onClick={() => setSelectedBatch(batch)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-gray-500">
                  No batches found for this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedBatch && (
        <BatchAdjustmentModal
          batch={selectedBatch}
          onClose={() => setSelectedBatch(null)}
        />
      )}
    </div>
  );
}