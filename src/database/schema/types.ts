/**
 * أنواع محرّك ترحيل المخططات (R33 — البند 7 من تقرير التقييم).
 *
 * المشكلة التي يعالجها: مفاتيح التخزين تحمل بيانات بأشكال مختلفة عبر الإصدارات
 * (سجلات قديمة بلا حقول، ملفات مستوردة بأنواع خاطئة، بيانات بذرية بأشكال سابقة).
 * بلا ترحيل مُرقَّم، كل قارئ يضطر للدفاع عن نفسه — ومن ينسى ينهار على بيانات مستخدم حقيقية.
 */
export type SchemaValue = unknown;

/** سياق الترحيل: وقت التنفيذ ودالة تشخيص اختيارية. */
export interface MigrationContext {
  /** الوقت الحالي ISO — يُمرَّر ولا يُقرأ داخلياً حتى تكون الترحيلات قابلة للاختبار. */
  now: string;
  /** عدّاد السجل للرسائل. */
  logger?: (message: string) => void;
}

/** الترحيل: من إصدار `from` إلى `from + 1`، يجب أن يكون نقياً ودوداً (idempotent). */
export type Migration = (value: SchemaValue, ctx: MigrationContext) => SchemaValue;

export interface SchemaEntry {
  /** مفتاح التخزين. */
  key: string;
  /** الإصدار الحالي للمخطط (عدد صحيح ≥ 1). */
  version: number;
  /** ترحيلات مرتّبة: `migrations[n]` ينقل من الإصدار n إلى n+1. */
  migrations: Record<number, Migration>;
}

/** مخزن البيانات الذي يعمل عليه المحرّك (قابل للحقن ⇒ بلا IndexedDB في الاختبارات). */
export interface SchemaStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  /** اختياري: الحذف غير متاح في بعض المحوّلات (يُستبدل بكتابة مصفوفة فارغة). */
  removeItem?: (key: string) => void;
}

/** خريطة الإصدارات المخزَّنة: `{ [key]: version }`. */
export type SchemaVersions = Record<string, number>;

export interface MigrationOutcome {
  key: string;
  from: number;
  to: number;
  applied: number;
  /** نسخة احتياطية للقيمة الأصلية قبل الترحيل (تُكتب تحت مفتاح مستقل). */
  backupKey?: string;
  status: 'upgraded' | 'current' | 'skipped-future' | 'skipped-empty' | 'failed';
  error?: string;
}

export interface MigrationReport {
  /** عدد المفاتيح التي رُحِّلت فعلاً. */
  upgraded: number;
  /** عدد المفاتيح التي كانت محدَّثة أصلاً. */
  current: number;
  failed: number;
  outcomes: MigrationOutcome[];
}

/** لاحقة مفتاح النسخة الاحتياطية قبل الترحيل. */
export const BACKUP_SUFFIX = '::pre-migration';

/** مفتاح خريطة الإصدارات. */
export const SCHEMA_META_KEY = 'suite_schema_meta_v1';
