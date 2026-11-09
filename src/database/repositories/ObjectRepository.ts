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
}

export interface ObjectRepository<T extends object> {
  readonly key: string;
  /** يقرأ الكائن (مدموجاً بالافتراضي ما لم يُعطَّل الدمج). */
  read(): T;
  /** يستبدل الكائن كاملاً. */
  write(value: T): void;
  /** يعدّل حقولاً محدَّدة فوق المحفوظ (دمج ضحل). */
  patch(partial: Partial<T>): T;
  /** يمسح المفتاح ويعود للافتراضي عند القراءة التالية. */
  clear(): void;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function createObjectRepository<T extends object>(
  options: ObjectOptions<T>,
  storage: SchemaStorage = dbStorage
): ObjectRepository<T> {
  const { key, defaults, noMerge } = options;

  const read = (): T => {
    let parsed: unknown;
    try {
      const raw = storage.getItem(key);
      if (!raw) return { ...defaults };
      parsed = JSON.parse(raw);
    } catch {
      return { ...defaults };
    }

    if (!isPlainObject(parsed)) return { ...defaults };
    if (noMerge) return parsed as T;
    return { ...defaults, ...(parsed as Partial<T>) };
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
        write({ ...defaults });
      }
    },
  };
}
