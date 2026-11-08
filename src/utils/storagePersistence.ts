import { dbStorage } from '../database/dbStorage';

/**
 * استمرارية التخزين ومراقبة الحصة (إصلاح R13)
 *
 * المشكلة الموثّقة: التطبيق يعتمد كلياً على تخزين المتصفح (IndexedDB) بلا:
 *   1) طلب تخزين دائم (`navigator.storage.persist`) — فيمكن للمتصفح (خصوصاً iOS)
 *      إخلاء البيانات عند الضغط على مساحة القرص.
 *   2) مراقبة الحصة (`navigator.storage.estimate`) — فلا يعرف المستخدم أنه على وشك الحد.
 *   3) تذكير تصدير دوري — والنسخة التلقائية داخل نفس المتصفح ليست نسخة احتياطية.
 *
 * هذه الوحدة لا تكسر أي شيء عند غياب الواجهات (Safari قديم / jsdom): كل الدوال
 * تعيد قيماً آمنة وتُسجّل تحذيراً واحداً فقط.
 */

const LAST_EXPORT_KEY = 'suite_last_export_v1';
const PERSIST_STATE_KEY = 'suite_storage_persist_v1';

/** عدد الأيام بعدها يُعتبر التصدير متأخراً */
export const EXPORT_REMINDER_DAYS = 7;

export type PersistState = 'granted' | 'denied' | 'unsupported' | 'unknown';

export interface StorageHealth {
  /** هل الواجهة مدعومة في هذا المتصفح */
  supported: boolean;
  /** هل التخزين دائم (لن يُخلي تلقائياً) */
  persisted: boolean;
  /** حالة الطلب الأخير */
  state: PersistState;
  /** الاستخدام بالبايت */
  usage: number;
  /** الحصة المتاحة بالبايت */
  quota: number;
  /** نسبة الاستخدام 0..1 */
  usageRatio: number;
  /** آخر تصدير ناجح (ISO) */
  lastExportAt: string | null;
  /** عدد الأيام منذ آخر تصدير */
  daysSinceExport: number | null;
  /** هل يجب تذكير المستخدم بالتصدير */
  exportReminderDue: boolean;
}

function hasStorageManager(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.storage !== 'undefined' &&
    navigator.storage !== null
  );
}

/** طلب تخزين دائم — يُستدعى مرة عند الإقلاع ومرة بعد أول حفظ ناجح */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!hasStorageManager()) {
    dbStorage.setItem(PERSIST_STATE_KEY, 'unsupported');
    return false;
  }

  try {
    if (typeof navigator.storage.persisted === 'function') {
      const already = await navigator.storage.persisted();
      if (already) {
        dbStorage.setItem(PERSIST_STATE_KEY, 'granted');
        return true;
      }
    }

    if (typeof navigator.storage.persist === 'function') {
      const granted = await navigator.storage.persist();
      dbStorage.setItem(PERSIST_STATE_KEY, granted ? 'granted' : 'denied');
      return granted;
    }

    dbStorage.setItem(PERSIST_STATE_KEY, 'unsupported');
    return false;
  } catch (err) {
    dbStorage.setItem(PERSIST_STATE_KEY, 'unknown');
    console.warn('storagePersistence: تعذّر طلب التخزين الدائم', err);
    return false;
  }
}

/** الحالة المخزَّنة لطلب الديمومة (قراءة متزامنة بلا وعد) */
export function getPersistState(): PersistState {
  const raw = dbStorage.getItem(PERSIST_STATE_KEY);
  if (raw === 'granted' || raw === 'denied' || raw === 'unsupported' || raw === 'unknown') {
    return raw;
  }
  return 'unknown';
}

/** تسجيل أن المستخدم صدّر نسخة احتياطية ناجحة */
export function markDataExported(at: Date = new Date()): void {
  try {
    dbStorage.setItem(LAST_EXPORT_KEY, at.toISOString());
  } catch (err) {
    console.warn('storagePersistence: تعذّر تسجيل تاريخ التصدير', err);
  }
}

/** آخر تصدير كـ ISO أو null */
export function getLastExportAt(): string | null {
  const raw = dbStorage.getItem(LAST_EXPORT_KEY);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : raw;
}

/** حالة تذكير التصدير (متزامنة — تُستخدم في الترويسة) */
export function getExportReminderState(): {
  due: boolean;
  daysSinceExport: number | null;
  lastExportAt: string | null;
} {
  const lastExportAt = getLastExportAt();
  if (!lastExportAt) {
    return { due: true, daysSinceExport: null, lastExportAt: null };
  }
  const diffMs = Date.now() - new Date(lastExportAt).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return { due: days >= EXPORT_REMINDER_DAYS, daysSinceExport: days, lastExportAt };
}

/** صحة التخزين الكاملة (غير متزامنة — للإعدادات) */
export async function getStorageHealth(): Promise<StorageHealth> {
  const persistState = getPersistState();
  const reminder = getExportReminderState();

  let usage = 0;
  let quota = 0;
  let persisted = persistState === 'granted';

  if (hasStorageManager()) {
    try {
      if (typeof navigator.storage.estimate === 'function') {
        const est = await navigator.storage.estimate();
        usage = Number(est.usage) || 0;
        quota = Number(est.quota) || 0;
      }
      if (typeof navigator.storage.persisted === 'function') {
        persisted = await navigator.storage.persisted();
      }
    } catch (err) {
      console.warn('storagePersistence: تعذّر قراءة إحصاءات التخزين', err);
    }
  }

  return {
    supported: hasStorageManager(),
    persisted,
    state: persistState,
    usage,
    quota,
    usageRatio: quota > 0 ? Math.min(usage / quota, 1) : 0,
    lastExportAt: reminder.lastExportAt,
    daysSinceExport: reminder.daysSinceExport,
    exportReminderDue: reminder.due,
  };
}

/** تنسيق بايت إلى صيغة مقروءة عربية */
export function formatBytes(bytes: number): string {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '0 بايت';
  const units = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت', 'تيرابايت'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  const value = n / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
