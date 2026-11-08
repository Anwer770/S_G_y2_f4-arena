/**
 * مخزن وحدة «system» — مُستخرج من storage.ts (R26).
 */
import { dbStorage } from '../../database/dbStorage';
import { AuditLog } from '../../types';
import { STORAGE_KEYS } from './keys';

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

export function logSystemAudit(module: AuditLog['module'], action: string, details: string, recordId?: string): void {
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

export function logAudit(action: string, details: string, recordId?: string): void {
  logSystemAudit('مخزون', action, details, recordId);
}

export function loadAuditLogs(): AuditLog[] {
  return loadSystemAuditLogs();
}

export function saveAuditLogs(logs: AuditLog[]): void {
  saveSystemAuditLogs(logs);
}

/* ------------------------------------------------------------------ المصادقة (P2) */

/** سجل محاولات الدخول الفاشلة لحساب واحد */
export interface AuthAttemptRecord {
  failures: number;
  /** طابع زمني (ms) لنهاية الإقفال — 0 يعني غير مقفل */
  lockedUntil: number;
  lastFailureAt: number;
}

export type AuthGuardState = Record<string, AuthAttemptRecord>;

/** جلسة الدخول المحفوظة — لها انتهاء صريح ولا تُستعاد بعده */
export interface StoredAuthSession {
  userId: string;
  loginTime: string;
  /** طابع زمني (ms) لانتهاء الجلسة */
  expiresAt: number;
  /** هل طلب المستخدم «تذكّر الدخول»؟ غير المطلوب لا يُحفظ أصلاً */
  remember: boolean;
}

export function loadAuthGuardState(): AuthGuardState {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.AUTH_GUARD);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as AuthGuardState;
    }
  } catch (e) {
    console.warn('Error loading auth guard state:', e);
  }
  return {};
}

export function saveAuthGuardState(state: AuthGuardState): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.AUTH_GUARD, JSON.stringify(state));
  } catch (e) {
    console.warn('Error saving auth guard state:', e);
  }
}

export function loadAuthSession(): StoredAuthSession | null {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.userId) return null;
    return parsed as StoredAuthSession;
  } catch (e) {
    console.warn('Error loading auth session:', e);
    return null;
  }
}

export function saveAuthSession(session: StoredAuthSession): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
  } catch (e) {
    console.warn('Error saving auth session:', e);
  }
}

export function clearAuthSession(): void {
  try {
    dbStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  } catch (e) {
    console.warn('Error clearing auth session:', e);
  }
}
