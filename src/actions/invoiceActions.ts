'use server';

import { billingService } from '@/services/billing';
import { revalidatePath } from 'next/cache';

export async function voidInvoiceAction(invoiceId: number) {
  const result = await billingService.voidInvoice(invoiceId);
  if (result.success) {
    revalidatePath('/invoices');
    revalidatePath('/'); // Refresh stock view
  }
  return JSON.parse(JSON.stringify(result));
}