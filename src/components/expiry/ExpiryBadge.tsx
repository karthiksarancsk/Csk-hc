import { ExpiringBatchView } from '@/services/expiry';

export default function ExpiryBadge({ statusColor }: { statusColor: ExpiringBatchView['statusColor'] }) {
  const styles = {
    RED: 'bg-rose-100 text-rose-800 border-rose-300',
    ORANGE: 'bg-amber-100 text-amber-800 border-amber-300',
    YELLOW: 'bg-yellow-50 text-yellow-800 border-yellow-200'
  };

  const labels = {
    RED: 'Expired',
    ORANGE: 'Critical (≤30 Days)',
    YELLOW: 'Warning (≤90 Days)'
  };

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${styles[statusColor]}`}>
      {labels[statusColor]}
    </span>
  );
}