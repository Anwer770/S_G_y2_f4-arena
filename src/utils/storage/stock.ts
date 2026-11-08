/**
 * مخزن وحدة المخزون (Stock) — مُستخرج من storage.ts (R24).
 * المفاتيح تأتي من keys.ts كي تبقى ثابتة ولا يتغيّر أي مفتاح تخزين.
 */
import { dbStorage } from '../../database/dbStorage';
import type { MovementRecord, Product } from '../../types';
import {
  DEFAULT_CATEGORIES as DEFAULT_STOCK_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_STATUSES as DEFAULT_STOCK_STATUSES,
} from '../../data/defaultProducts';
import { INITIAL_RECORDS } from '../../data/defaultRecords';
import { STORAGE_KEYS } from './keys';

export const DEFAULT_STOCK_SEQ = {
  IN: 4,
  OUT: 299,
};

export function loadProducts(): Product[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.STOCK_PRODUCTS) || dbStorage.getItem('stock_ledger_products_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading products:', e);
  }
  return DEFAULT_PRODUCTS;
}

export function saveProducts(products: Product[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.STOCK_PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products:', e);
  }
}

export function loadStockRecords(): MovementRecord[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.STOCK_RECORDS) || dbStorage.getItem('stock_ledger_records_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading stock records:', e);
  }
  return INITIAL_RECORDS;
}

export function saveStockRecords(records: MovementRecord[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.STOCK_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving stock records:', e);
  }
}

export function loadStockCategories(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.STOCK_CATEGORIES) || dbStorage.getItem('stock_ledger_categories_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading stock categories:', e);
  }
  return DEFAULT_STOCK_CATEGORIES;
}

export function saveStockCategories(cats: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.STOCK_CATEGORIES, JSON.stringify(cats));
  } catch (e) {
    console.error('Error saving stock categories:', e);
  }
}

export function loadStockStatuses(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.STOCK_STATUSES) || dbStorage.getItem('stock_ledger_statuses_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading stock statuses:', e);
  }
  return DEFAULT_STOCK_STATUSES;
}

export function saveStockStatuses(stats: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.STOCK_STATUSES, JSON.stringify(stats));
  } catch (e) {
    console.error('Error saving stock statuses:', e);
  }
}

export function loadStockSeq(): { IN: number; OUT: number } {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.STOCK_SEQ) || dbStorage.getItem('stock_ledger_seq_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.IN === 'number' && typeof parsed.OUT === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading stock seq:', e);
  }
  return DEFAULT_STOCK_SEQ;
}

export function saveStockSeq(seq: { IN: number; OUT: number }): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.STOCK_SEQ, JSON.stringify(seq));
  } catch (e) {
    console.error('Error saving stock seq:', e);
  }
}

export function loadRecords(): MovementRecord[] {
  return loadStockRecords();
}

export function saveRecords(records: MovementRecord[]): void {
  saveStockRecords(records);
}

export function loadCategories(): string[] {
  return loadStockCategories();
}

export function saveCategories(cats: string[]): void {
  saveStockCategories(cats);
}

export function loadStatuses(): string[] {
  return loadStockStatuses();
}

export function saveStatuses(stats: string[]): void {
  saveStockStatuses(stats);
}

export function loadSeq(): { IN: number; OUT: number } {
  return loadStockSeq();
}

export function saveSeq(seq: { IN: number; OUT: number }): void {
  saveStockSeq(seq);
}
