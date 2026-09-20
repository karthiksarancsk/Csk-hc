'use client';

import { useState } from 'react';

import MedicineMasterForm from '@/components/MedicineMasterForm';
import BatchInwardForm from '@/components/BatchInwardForm';
import InventoryLedger from '@/components/InventoryLedger';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Medical Inventory & Expiry-Aware System</h1>
          <p className="text-gray-500 mt-2">Week 1: Core Data Engine, Medicine Catalog & Batch Inwarding</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Data Entry */}
          <div className="space-y-8">
            <MedicineMasterForm onSuccess={triggerRefresh} />
            <BatchInwardForm onSuccess={triggerRefresh} />
          </div>

          {/* Right Column: Ledger View */}
          <div className="lg:col-span-1">
            <InventoryLedger refreshKey={refreshKey} />
          </div>
        </div>

      </div>
    </main>
  );
}
