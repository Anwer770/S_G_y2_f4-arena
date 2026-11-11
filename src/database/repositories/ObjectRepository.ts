/**
 * مستودع كائن مفرد (R36) — للمفاتيح التي تخزّن **كائناً واحداً** لا مجموعة
 * (مثل `ROUTINES_SETTINGS`: إعدادات وحدة الروتين).
 *
 * لماذا نوع منفصل؟ لأن `CollectionRepository` يقرأ مصفوفات ويقصّها ويضيف في المقدمة —
 * كلها عمليات لا معنى لها لكائن إعدادات، ومحاولة فرضها كانت ستُنتج إعدادات «مصفوفة».
 *
 * السلوك: يدمج المحفوظ فوق الافتراضي (`{...defaults, ...stored}`) كما كان في
 * `loadRoutineSettings` حرفياً، حتى لا تفقد الإعدادات الجديدة قيمة عند ترقية النسخة.
 */
import { dbStorage } from '../dbStorage';
import type { SchemaStorage } from '../schema/types';

export interface ObjectOptions<T extends object> {
  /** مفتاح التخزين. */
  key: string;
  /** القيمة الافتراضية الكاملة (تُستخدم أيضاً كطبقة أساس عند الدمج). */
  defaults: T;
  /** تعطيل الدمج والاكتفاء بالمحفوظ كما هو. */
  noMerge?: boolean;
  /**
   * تحقّق اختياري: إن فشل نُعيد الافتراضي كاملاً (لا دمج جزئي).
   * يلزم لأن مفاتيح مثل عدّاد التسلسل تحتاج **كلا** الحقلين، ودمج كائن ناقص
   * كان سيُنتج «نصف عدّاد» يُسقط ترقيم الحركات.
   */
  isValid?: (value: Record<string, unknown>) => boolean;
  /** مفاتيح قديمة تُقرأ إن كان المفتاح الحالي غائباً (هجرة تدريجية). */
  legacyKeys?: string[];
}

export interface ObjectRepository<T extends object> {
  readonly key: string;
  /** يقرأ الكائن (مدموجاً بالافتراضي ما لم يُعطَّل الدمج). */
  read(): T;
  /** هل للمفتاح الحالي قيمة خام؟ يُستخدم لترحيل legacy بلا قراءة تخزين مباشرة. */
  hasCurrent(): boolean;
  /** يستبدل الكائن كاملاً. */
  write(value: T): void;
  /** يعدّل حقولاً محدَّدة فوق المحفوظ (دمج ضحل). */
  patch(partial: Partial<T>): T;
  /** يمسح المفتاح ويعود للافتراضي عند القراءة التالية. */
  clear(): void;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** ينسخ افتراضيات JSON المتداخلة كي لا يلوّث تعديل القارئ مصفوفة/كائناً مشتركاً. */
const cloneValue = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map(cloneValue) as T;
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, cloneValue(nested)])) as T;
  }
  return value;
};

export function createObjectRepository<T extends object>(
  options: ObjectOptions<T>,
  storage: SchemaStorage = dbStorage
): ObjectRepository<T> {
  const { key, defaults, noMerge, isValid, legacyKeys = [] } = options;

  const readRaw = (): string | null => {
    const current = storage.getItem(key);
    if (current) return current;
    for (const legacy of legacyKeys) {
      const value = storage.getItem(legacy);
      if (value) return value;
    }
    return null;
  };

  const read = (): T => {
    let parsed: unknown;
    try {
      const raw = readRaw();
      if (!raw) return cloneValue(defaults);
      parsed = JSON.parse(raw);
    } catch {
      return cloneValue(defaults);
    }

    if (!isPlainObject(parsed)) return cloneValue(defaults);
    if (isValid && !isValid(parsed)) return cloneValue(defaults);
    if (noMerge) return parsed as T;
    return { ...cloneValue(defaults), ...(parsed as Partial<T>) };
  };

  const write = (value: T): void => {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`ObjectRepository(${key}): فشل الحفظ`, err);
    }
  };

  return {
    key,
    read,
    hasCurrent: () => {
      try {
        return storage.getItem(key) !== null;
      } catch {
        return false;
      }
    },
    write,
    patch: (partial: Partial<T>) => {
      const next = { ...read(), ...partial };
      write(next);
      return next;
    },
    clear: () => {
      try {
        storage.removeItem?.(key);
      } catch {
        write(cloneValue(defaults));
      }
    },
  };
}
