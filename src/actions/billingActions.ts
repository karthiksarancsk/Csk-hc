'use server';

import { billingService, CheckoutDTO } from '@/services/billing';
import { revalidatePath } from 'next/cache';

export async function searchBillingBatchesAction(query: string) {
  return await billingService.getAvailableBatchesForBilling(query);
}

export async function createInvoiceAction(data: CheckoutDTO) {
  const result = await billingService.createInvoice(data);
  if (result.success) {
    revalidatePath('/'); // Refresh inventory ledger stock
    revalidatePath('/billing');
  }
  return result;
}

export async function getInvoiceDetailsAction(invoiceId: number) {
  return await billingService.getInvoiceById(invoiceId);
}

export async function getRecentInvoicesAction() {
  return await billingService.listRecentInvoices();
}
