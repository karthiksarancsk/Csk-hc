import { expiryService } from '@/services/expiry';
import ExpiryTable from '@/components/expiry/ExpiryTable';
import ExportReturnButton from '@/components/expiry/ExportReturnButton';

export const dynamic = 'force-dynamic';

export default async function ExpiryPage() {
  const expiringBatches = await expiryService.getExpiringBatches(90);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Expiry Watch Center</h1>
          <p className="mt-2 text-sm text-gray-700">
            Monitor at-risk inventory, handle distributor returns, and write-off expired stock.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <ExportReturnButton />
        </div>
      </div>

      <ExpiryTable initialBatches={expiringBatches} />
    </div>
  );
}