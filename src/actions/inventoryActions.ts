'use server';

import { inventoryService, MedicineDTO, BatchInwardDTO } from '@/services/inventory';
import { revalidatePath } from 'next/cache';

export async function createMedicineAction(data: MedicineDTO) {
  const result = await inventoryService.createMedicine(data);
  if (result.success) {
    revalidatePath('/'); // Revalidate where medicines are shown
  }
  return JSON.parse(JSON.stringify(result));
}

export async function searchMedicinesAction(query: string) {
  const res = await inventoryService.searchMedicines(query);
  return JSON.parse(JSON.stringify(res));
}

export async function inwardBatchAction(data: BatchInwardDTO) {
  const result = await inventoryService.inwardBatch(data);
  if (result.success) {
    revalidatePath('/'); // Revalidate inventory table
    revalidatePath('/billing'); // Make sure POS sees the new stock
  }
  return JSON.parse(JSON.stringify(result));
}

export async function getInventoryAction(query?: string, hideZeroStock?: boolean) {
  try {
    const result = await inventoryService.listStockBatches({ query, hideZeroStock });
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    console.error("GET INVENTORY ERROR:", e);
    throw e;
  }
}
