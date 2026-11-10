import { dbStorage } from '../database/dbStorage';

// ── إعادة التصدير من الوحدات المفكّكة (R24): كل المستوردين الحاليين يعملون بلا تغيير

import {
  loadFinancialCategoryAccounts,
  saveFinancialCategoryAccounts,
  loadFinancialAccountNames,
  saveFinancialAccountNames,
} from './storage/financial';

export { STORAGE_KEYS, STORAGE_KEY_MANIFEST } from './storage/keys';
export * from './storage/stock';
export * from './storage/financial';
export * from './storage/debts';

export * from './storage/settings';
export * from './storage/tasks';
export * from './storage/customers';
export * from './storage/doctors';
export * from './storage/knowledge';
export * from './storage/routines';
export * from './storage/custody';
export * from './storage/links';
export * from './storage/system';

// Backward-compatibility aliases
export function loadFinancialCategories(): string[] {
  return loadFinancialCategoryAccounts();
}
export function saveFinancialCategories(cats: string[]): void {
  saveFinancialCategoryAccounts(cats);
}
export function loadFinancialAccounts(): string[] {
  return loadFinancialAccountNames();
}
export function saveFinancialAccounts(accs: string[]): void {
  saveFinancialAccountNames(accs);
}

// Backward compatibility helper

export * from './storage/backup';

export { dbStorage } from '../database/dbStorage';
export function getStorageEngineStats() {
  return dbStorage.getStats();
}
