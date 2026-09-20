'use client';

import { exportDistributorReturnCSV } from '@/actions/expiryActions';
import { Download } from 'lucide-react';
import { useState } from 'react';

export default function ExportReturnButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const csvData = await exportDistributorReturnCSV();

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `distributor_return_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export CSV', error);
      alert('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
    >
      <Download className="-ml-0.5 mr-1.5 h-4 w-4 text-gray-400" />
      {isExporting ? 'Exporting...' : 'Export Return CSV'}
    </button>
  );
}