/**
 * مخزن الديون والالتزامات (Debts) — مُستخرج من storage.ts (R24).
 */
import { dbStorage } from '../../database/dbStorage';
import type { DebtAuditLog, DebtCommitment, DebtRecord } from '../../types';
import { DEBT_CATEGORIES, DEBT_OWNERS, DEFAULT_DEBT_COMMITMENTS, DEFAULT_DEBT_RECORDS } from '../debts';
import { STORAGE_KEYS } from './keys';

export function loadDebts(): DebtRecord[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DEBTS_RECORDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading debt records:', e);
  }
  return DEFAULT_DEBT_RECORDS;
}

export function saveDebts(records: DebtRecord[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DEBTS_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving debt records:', e);
  }
}

export function loadDebtCommitments(): DebtCommitment[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DEBTS_COMMITMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading debt commitments:', e);
  }
  return DEFAULT_DEBT_COMMITMENTS;
}

export function saveDebtCommitments(commitments: DebtCommitment[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DEBTS_COMMITMENTS, JSON.stringify(commitments));
  } catch (e) {
    console.error('Error saving debt commitments:', e);
  }
}

export function loadDebtCategories(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DEBTS_CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading debt categories:', e);
  }
  return DEBT_CATEGORIES;
}

export function saveDebtCategories(categories: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DEBTS_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving debt categories:', e);
  }
}

export function loadDebtOwners(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DEBTS_OWNERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading debt owners:', e);
  }
  return DEBT_OWNERS;
}

export function saveDebtOwners(owners: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DEBTS_OWNERS, JSON.stringify(owners));
  } catch (e) {
    console.error('Error saving debt owners:', e);
  }
}

export function loadDebtAuditLogs(): DebtAuditLog[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DEBTS_AUDIT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading debt audit logs:', e);
  }
  return [
    {
      id: 'LOG-DEBT-1',
      time: new Date().toLocaleString('ar-YE'),
      action: 'استيراد',
      entity: 'دفتر',
      title: 'دفتر الدين والالتزامات',
      details: 'تمت تهيئة دفاتر الدين الأربعة وسجل الالتزامات بنجاح وفق وثيقة PRD',
    },
  ];
}

export function saveDebtAuditLogs(logs: DebtAuditLog[]): void {
  try {
    const trimmed = logs.slice(0, 500);
    dbStorage.setItem(STORAGE_KEYS.DEBTS_AUDIT, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving debt audit logs:', e);
  }
}

export function logDebtAudit(
  action: DebtAuditLog['action'],
  entity: DebtAuditLog['entity'],
  title: string,
  details: string
): void {
  const current = loadDebtAuditLogs();
  const newLog: DebtAuditLog = {
    id: `LOG-DBT-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    time: new Date().toLocaleString('ar-YE'),
    action,
    entity,
    title,
    details,
  };
  saveDebtAuditLogs([newLog, ...current]);
}
