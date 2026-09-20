import Link from 'next/link';
import './globals.css';
import { expiryService } from '@/services/expiry';
import { AlertCircle } from 'lucide-react';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // We can fetch the expired count safely directly in layout since it's an RSC
  const expiredCount = await expiryService.getExpiredBatchesCount();

  return (
    <html lang="en">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 antialiased">
        <nav className="bg-white shadow-sm border-b print:hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex justify-between h-16">
              <div className="flex space-x-8">
                <Link href="/" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium text-gray-700 hover:text-gray-900">
                  Inventory Master
                </Link>
                <Link href="/billing" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium text-gray-700 hover:text-gray-900">
                  POS Billing
                </Link>
                <Link href="/expiry" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium text-gray-700 hover:text-gray-900">
                  Expiry Watch
                </Link>
                <Link href="/invoices" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium text-gray-700 hover:text-gray-900">
                  Sales Ledger
                </Link>
                <Link href="/settings" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium text-gray-700 hover:text-gray-900">
                  Settings
                </Link>
              </div>
              <div className="flex items-center">
                {expiredCount > 0 && (
                  <Link href="/expiry?tab=expired">
                    <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-800 ring-1 ring-inset ring-rose-300 gap-1.5 hover:bg-rose-200 transition-colors cursor-pointer">
                      <AlertCircle className="h-4 w-4" />
                      {expiredCount} Expired {expiredCount === 1 ? 'Item' : 'Items'}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}