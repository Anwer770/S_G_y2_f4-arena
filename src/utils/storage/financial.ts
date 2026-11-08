/**
 * مخزن السجل المالي اليومي (Financial) — مُستخرج من storage.ts (R24).
 */
import { dbStorage } from '../../database/dbStorage';
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

export function loadFinancialTransactions(): FinancialTransaction[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.FIN_TRANSACTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading financial transactions:', e);
  }
  return DEFAULT_FINANCIAL_TRANSACTIONS;
}

export function saveFinancialTransactions(txns: FinancialTransaction[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.FIN_TRANSACTIONS, JSON.stringify(txns));
  } catch (e) {
    console.error('Error saving financial transactions:', e);
  }
}

export function loadFinancialMovements(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.FIN_MOVEMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading financial movements:', e);
  }
  return DEFAULT_MOVEMENTS;
}

export function saveFinancialMovements(list: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.FIN_MOVEMENTS, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving financial movements:', e);
  }
}

export function loadFinancialRestrictions(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.FIN_RESTRICTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading financial restrictions:', e);
  }
  return DEFAULT_RESTRICTIONS;
}

export function saveFinancialRestrictions(list: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.FIN_RESTRICTIONS, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving financial restrictions:', e);
  }
}

export function loadFinancialMovementTypes(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.FIN_MOVEMENT_TYPES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading financial movement types:', e);
  }
  return DEFAULT_MOVEMENT_TYPES;
}

export function saveFinancialMovementTypes(list: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.FIN_MOVEMENT_TYPES, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving financial movement types:', e);
  }
}

export function loadFinancialImportanceList(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.FIN_IMPORTANCE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading financial importance list:', e);
  }
  return DEFAULT_IMPORTANCE_LIST;
}

export function saveFinancialImportanceList(list: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.FIN_IMPORTANCE, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving financial importance list:', e);
  }
}

export function loadFinancialCategoryAccounts(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.FIN_CATEGORY_ACCOUNTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading financial category accounts:', e);
  }
  return DEFAULT_CATEGORY_ACCOUNTS;
}

export function saveFinancialCategoryAccounts(list: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.FIN_CATEGORY_ACCOUNTS, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving financial category accounts:', e);
  }
}

export function loadFinancialRestrictionAccounts(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.FIN_RESTRICTION_ACCOUNTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading financial restriction accounts:', e);
  }
  return DEFAULT_RESTRICTION_ACCOUNTS;
}

export function saveFinancialRestrictionAccounts(list: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.FIN_RESTRICTION_ACCOUNTS, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving financial restriction accounts:', e);
  }
}

export function loadFinancialAccountNames(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.FIN_ACCOUNT_NAMES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading financial account names:', e);
  }
  return DEFAULT_ACCOUNT_NAMES;
}

export function saveFinancialAccountNames(list: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.FIN_ACCOUNT_NAMES, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving financial account names:', e);
  }
}
