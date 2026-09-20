'use server';

import { inventoryService, MedicineDTO, BatchInwardDTO } from '@/services/inventory';
import { revalidatePath } from 'next/cache';

export async function createMedicineAction(data: MedicineDTO) {
  const result = await inventoryService.createMedicine(data);
  if (result.success) {
    revalidatePath('/'); // Revalidate where medicines are shown
  }
  return result;
}

export async function searchMedicinesAction(query: string) {
  return await inventoryService.searchMedicines(query);
}

export async function inwardBatchAction(data: BatchInwardDTO) {
  const result = await inventoryService.inwardBatch(data);
  if (result.success) {
    revalidatePath('/'); // Revalidate inventory table
    revalidatePath('/billing'); // Make sure POS sees the new stock
  }
  return result;
}

export async function getInventoryAction(query?: string, hideZeroStock?: boolean) {
  return await inventoryService.listStockBatches({ query, hideZeroStock });
}
