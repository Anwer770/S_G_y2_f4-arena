/**
 * مستودع القيمة النصية (R42) — للمفاتيح التي تخزّن **نصاً خاماً** لا JSON.
 *
 * الكائن والمجموعة لهما مستودعان؛ لكن مفاتيحاً مثل `suite_storage_persist_v1`
 * و`workos_v1_automation_boot_date` تخزّن نصاً صريحاً (`granted` · `2026-11-07`).
 * تمريرها عبر مستودع الكائن كان سيُخزّن `"2026-11-07"` بعلامات تنصيص فتُفسد
 * البيانات القائمة عند أول قراءة. هذا المستودع يكتب النص **كما هو**.
 */
import { dbStorage } from '../dbStorage';
import type { SchemaStorage } from '../schema/types';

export interface ValueOptions {
  key: string;
  /** القيمة المعادة عند الغياب أو فشل التحقّق. */
  fallback?: string;
  /** تحقّق اختياري من النص المخزَّن؛ إن فشل تُعامَل القيمة كغائبة. */
  isValid?: (raw: string) => boolean;
  /** مفاتيح قديمة تُقرأ إن كان المفتاح الحالي غائباً. */
  legacyKeys?: string[];
}

export interface ValueRepository {
  readonly key: string;
  /** النص كما هو، أو `null` عند الغياب/فشل التحقّق. */
  readRaw(): string | null;
  /** النص أو القيمة البديلة (لا يعيد `null` أبداً). */
  read(): string;
  /** يكتب النص كما هو (بلا JSON). */
  write(value: string): void;
  /** يمسح المفتاح. */
  clear(): void;
}

export function createValueRepository(options: ValueOptions, storage: SchemaStorage = dbStorage): ValueRepository {
  const { key, fallback = '', isValid, legacyKeys = [] } = options;

  const readRaw = (): string | null => {
    let raw: string | null;
    try {
      raw = storage.getItem(key);
      if (!raw) {
        for (const legacy of legacyKeys) {
          const value = storage.getItem(legacy);
          if (value) {
            raw = value;
            break;
          }
        }
      }
    } catch {
      return null;
    }
    if (!raw) return null;
    if (isValid && !isValid(raw)) return null;
    return raw;
  };

  return {
    key,
    readRaw,
    read: () => readRaw() ?? fallback,
    write: (value: string) => {
      try {
        storage.setItem(key, value);
      } catch (err) {
        console.warn(`ValueRepository(${key}): فشل الحفظ`, err);
      }
    },
    clear: () => {
      try {
        storage.removeItem?.(key);
      } catch {
        /* لا شيء — الفشل في المسح لا يُسقط التطبيق */
      }
    },
  };
}
