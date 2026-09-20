'use server';

import { billingService, CheckoutDTO } from '@/services/billing';
import { revalidatePath } from 'next/cache';

export async function searchBillingBatchesAction(query: string) {
  const result = await billingService.getAvailableBatchesForBilling(query);
  return JSON.parse(JSON.stringify(result));
}

export async function createInvoiceAction(data: CheckoutDTO) {
  const result = await billingService.createInvoice(data);
  if (result.success) {
    revalidatePath('/'); // Refresh inventory ledger stock
    revalidatePath('/billing');
  }
  return JSON.parse(JSON.stringify(result));
}

export async function getInvoiceDetailsAction(invoiceId: number) {
  const result = await billingService.getInvoiceById(invoiceId);
  return JSON.parse(JSON.stringify(result));
}

export async function getRecentInvoicesAction() {
  const result = await billingService.listRecentInvoices();
  return JSON.parse(JSON.stringify(result));
}
