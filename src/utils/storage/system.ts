/**
 * مخزن وحدة «system» — مُستخرج من storage.ts (R26).
 */
import {
  dbStorage,
} from '../../database/dbStorage';
import {
  AuditLog,
} from '../../types';
import {
  STORAGE_KEYS,
} from './keys';

export function loadSystemAuditLogs(): AuditLog[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.SYSTEM_AUDIT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading system logs:', e);
  }
  return [
    {
      id: 'LOG-001',
      timestamp: new Date().toLocaleString('ar-YE'),
      module: 'نظام',
      action: 'تهيئة',
      details: 'تشغيل المنظومة المتكاملة (السجل المالي، دفتر المخزون، ودفتر المهام)',
    },
  ];
}

export function saveSystemAuditLogs(logs: AuditLog[]): void {
  try {
    const trimmed = logs.slice(0, 1000);
    dbStorage.setItem(STORAGE_KEYS.SYSTEM_AUDIT, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving system logs:', e);
  }
}

export function logSystemAudit(
  module: AuditLog['module'],
  action: string,
  details: string,
  recordId?: string
): void {
  const current = loadSystemAuditLogs();
  const newLog: AuditLog = {
    id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    timestamp: new Date().toLocaleString('ar-YE'),
    module,
    action,
    recordId,
    details,
  };
  saveSystemAuditLogs([newLog, ...current]);
}

export function logAudit(action: any, details: string, recordId?: string): void {
  logSystemAudit('مخزون', action, details, recordId);
}

export function loadAuditLogs(): AuditLog[] {
  return loadSystemAuditLogs();
}

export function saveAuditLogs(logs: AuditLog[]): void {
  saveSystemAuditLogs(logs);
}
