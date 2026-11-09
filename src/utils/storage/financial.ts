/**
 * مخزن السجل المالي اليومي (Financial) — مُستخرج من storage.ts (R24).
 * R37: كل قراءة/كتابة عبر مستودع المجموعات. السلوك محفوظ: **كل** القوائم
 * التسع تُرجع البذرة عند المصفوفة الفارغة (`fallbackOnEmpty`) — لا عدّادات
 * تسلسل في هذه الوحدة، وعدّاد المخزون مكانه `stock.ts`.
 */
import { createCollectionRepository } from '../../database/repositories/CollectionRepository';
import type { FinancialTransaction } from '../../types';
import {
  DEFAULT_ACCOUNT_NAMES,
  DEFAULT_CATEGORY_ACCOUNTS,
  DEFAULT_FINANCIAL_TRANSACTIONS,
  DEFAULT_IMPORTANCE_LIST,
  DEFAULT_MOVEMENTS,
  DEFAULT_MOVEMENT_TYPES,
  DEFAULT_RESTRICTION_ACCOUNTS,
  DEFAULT_RESTRICTIONS,
} from '../../data/defaultFinancial';
import { STORAGE_KEYS } from './keys';

const transactionsRepo = createCollectionRepository<FinancialTransaction>({
  key: STORAGE_KEYS.FIN_TRANSACTIONS,
  fallback: DEFAULT_FINANCIAL_TRANSACTIONS,
  fallbackOnEmpty: true,
});

const movementsRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.FIN_MOVEMENTS,
  fallback: DEFAULT_MOVEMENTS,
  fallbackOnEmpty: true,
});

const restrictionsRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.FIN_RESTRICTIONS,
  fallback: DEFAULT_RESTRICTIONS,
  fallbackOnEmpty: true,
});

const movementTypesRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.FIN_MOVEMENT_TYPES,
  fallback: DEFAULT_MOVEMENT_TYPES,
  fallbackOnEmpty: true,
});

const importanceRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.FIN_IMPORTANCE,
  fallback: DEFAULT_IMPORTANCE_LIST,
  fallbackOnEmpty: true,
});

const categoryAccountsRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.FIN_CATEGORY_ACCOUNTS,
  fallback: DEFAULT_CATEGORY_ACCOUNTS,
  fallbackOnEmpty: true,
});

const restrictionAccountsRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.FIN_RESTRICTION_ACCOUNTS,
  fallback: DEFAULT_RESTRICTION_ACCOUNTS,
  fallbackOnEmpty: true,
});

const accountNamesRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.FIN_ACCOUNT_NAMES,
  fallback: DEFAULT_ACCOUNT_NAMES,
  fallbackOnEmpty: true,
});

export function loadFinancialTransactions(): FinancialTransaction[] {
  return transactionsRepo.read();
}

export function saveFinancialTransactions(txns: FinancialTransaction[]): void {
  transactionsRepo.write(txns);
}

export function loadFinancialMovements(): string[] {
  return movementsRepo.read();
}

export function saveFinancialMovements(list: string[]): void {
  movementsRepo.write(list);
}

export function loadFinancialRestrictions(): string[] {
  return restrictionsRepo.read();
}

export function saveFinancialRestrictions(list: string[]): void {
  restrictionsRepo.write(list);
}

export function loadFinancialMovementTypes(): string[] {
  return movementTypesRepo.read();
}

export function saveFinancialMovementTypes(list: string[]): void {
  movementTypesRepo.write(list);
}

export function loadFinancialImportanceList(): string[] {
  return importanceRepo.read();
}

export function saveFinancialImportanceList(list: string[]): void {
  importanceRepo.write(list);
}

export function loadFinancialCategoryAccounts(): string[] {
  return categoryAccountsRepo.read();
}

export function saveFinancialCategoryAccounts(list: string[]): void {
  categoryAccountsRepo.write(list);
}

export function loadFinancialRestrictionAccounts(): string[] {
  return restrictionAccountsRepo.read();
}

export function saveFinancialRestrictionAccounts(list: string[]): void {
  restrictionAccountsRepo.write(list);
}

export function loadFinancialAccountNames(): string[] {
  return accountNamesRepo.read();
}

export function saveFinancialAccountNames(list: string[]): void {
  accountNamesRepo.write(list);
}
