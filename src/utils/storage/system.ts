/**
 * مخزن وحدة «system» — مُستخرج من storage.ts (R26).
 * R38: القراءة/الكتابة عبر المستودعات مع الحفاظ على السلوك حرفياً:
 *  · سجل النظام: بذرة سطر واحد عند الغياب، والفراغ **مقبول**، وسقف **1000 سطر**.
 *  · حالة قفل المحاولات: كائن كما هو (بلا دمج)، والتالف ⇒ `{}` (لا قفل زائف).
 *  · جلسة الدخول: غيابها أو تلفها أو غياب `userId` ⇒ `null` (جلسة مرفوضة)،
 *    والمسح يحذف المفتاح فعلياً لا يكتب `{}` — كي لا تُقرأ جلسة فارغة كجلسة.
 */
import { createCollectionRepository } from '../../database/repositories/CollectionRepository';
import { createObjectRepository } from '../../database/repositories/ObjectRepository';
import { AuditLog } from '../../types';
import { STORAGE_KEYS } from './keys';

const DEFAULT_SYSTEM_AUDIT: AuditLog[] = [
  {
    id: 'LOG-001',
    timestamp: new Date().toLocaleString('ar-YE'),
    module: 'نظام',
    action: 'تهيئة',
    details: 'تشغيل المنظومة المتكاملة (السجل المالي، دفتر المخزون، ودفتر المهام)',
  },
];

const auditRepo = createCollectionRepository<AuditLog>({
  key: STORAGE_KEYS.SYSTEM_AUDIT,
  fallback: DEFAULT_SYSTEM_AUDIT,
  limit: 1000,
});

export function loadSystemAuditLogs(): AuditLog[] {
  return auditRepo.read();
}

export function saveSystemAuditLogs(logs: AuditLog[]): void {
  auditRepo.write(logs);
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

/** الحالة الافتراضية: بلا أقفال. لا تُستنسخ للقراءة فقط — الكائن هنا بديل ثابت. */
const EMPTY_GUARD: AuthGuardState = {};

const guardRepo = createObjectRepository<AuthGuardState>({
  key: STORAGE_KEYS.AUTH_GUARD,
  defaults: EMPTY_GUARD,
  noMerge: true,
});

/** مفتاح الجلسة يُقرأ ككائن جزئي كي نستطيع رفضه (لا لدمجه). */
const sessionRepo = createObjectRepository<Partial<StoredAuthSession>>({
  key: STORAGE_KEYS.AUTH_SESSION,
  defaults: {},
  noMerge: true,
});

export function loadAuthGuardState(): AuthGuardState {
  return guardRepo.read();
}

export function saveAuthGuardState(state: AuthGuardState): void {
  guardRepo.write(state);
}

export function loadAuthSession(): StoredAuthSession | null {
  const value = sessionRepo.read();
  if (!value || typeof value.userId !== 'string' || value.userId.length === 0) return null;
  return value as StoredAuthSession;
}

export function saveAuthSession(session: StoredAuthSession): void {
  sessionRepo.write(session);
}

export function clearAuthSession(): void {
  sessionRepo.clear();
}
