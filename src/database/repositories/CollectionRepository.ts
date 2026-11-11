/**
 * مستودع مجموعة عام (R33) — طبقة واحدة لكل قراءة/كتابة مجموعة في التخزين.
 *
 * لماذا؟ لأن كل وحدة تخزين كانت تُكرّر النمط نفسه: `try / JSON.parse / Array.isArray /
 * خطة بديلة / catch` — أربعة أسطر × عشرات الدوال، وكل نسخة تختلف عن الأخرى في سلوك
 * القيمة الفارغة والتقصير. هنا السلوك **واحد ومُعلَن** في خيارات صريحة.
 *
 * المستودع لا يعرف الواجهة ولا IndexedDB: يستقبل `SchemaStorage` (افتراضياً `dbStorage`)،
 * لذلك يُختبر بلا متصفح.
 */
import { dbStorage } from '../dbStorage';
import type { SchemaStorage } from '../schema/types';

export interface CollectionOptions<T> {
  /** مفتاح التخزين. */
  key: string;
  /** القيمة الافتراضية عند غياب المفتاح أو تلفه. */
  fallback: T[];
  /** تعامل مع المصفوفة الفارغة كأنها غائبة (سلوك بعض الدفاتر القديمة). */
  fallbackOnEmpty?: boolean;
  /**
   * زرع القيمة الافتراضية عند **غياب** المفتاح أو تلفه (R45).
   * سلوك القوائم المنسدلة المالية القديمة: `if (!data || !Array.isArray(data))
   * { setItem(key, defaults); return [...defaults] }` — أي أنها كانت تكتب
   * الافتراضي عند أول قراءة. الافتراضي `false` لأن قاعدة الطبقة الجديدة:
   * **القراءة لا تكتب**؛ لا تُشغِّله إلا حيث كان السلوك القديم يزرع فعلاً.
   */
  seed?: boolean;
  /** سقف العناصر المحفوظة (يقصّ الأقدم). */
  limit?: number;
  /** تحقّق اختياري من كل عنصر قبل الاستخدام. */
  isValidItem?: (item: unknown) => boolean;
  /**
   * مفاتيح قديمة تُقرأ إن كان المفتاح الحالي غائباً (R37).
   * تُقرأ **بعد** المفتاح الحالي وقبل الخطة البديلة، تماماً كسلوك
   * `getItem(new) || getItem(legacy)` السابق. الكتابة تذهب للمفتاح الحالي وحده.
   */
  legacyKeys?: string[];
}

export interface CollectionRepository<T> {
  /** المفتاح المُدار (للرسائل والتشخيص). */
  readonly key: string;
  /** يقرأ المجموعة كاملة (أو الخطة البديلة). */
  read(): T[];
  /** يستبدل المجموعة كاملة (مع التقصير عند وجود سقف). */
  write(items: T[]): void;
  /** يضيف عنصراً في البداية. */
  prepend(item: T): T[];
  /** يحدّث بالمعرّف بتعديل جزئي (يُعيد المجموعة الجديدة، أو الحالية إن لم يوجد). */
  update(id: string, patch: Partial<T>): T[];
  /** يحذف بالمعرّف. */
  remove(id: string): T[];
  /** بحث بالمعرّف. */
  findById(id: string): T | null;
  /** يمسح المفتاح (يعود للخطة البديلة عند القراءة التالية). */
  clear(): void;
}

/** معرّف العنصر إن كان كائناً يحمل `id` (المجموعات النصية لا تُفهرس). */
const idOf = (item: unknown): string | null => {
  if (typeof item === 'object' && item !== null && typeof (item as { id?: unknown }).id === 'string') {
    return (item as { id: string }).id;
  }
  return null;
};

/**
 * البذور كائنات JSON متداخلة (خطوات/وسوم/إعدادات). النسخ السطحي يجعل تعديل مستهلك
 * لقيمة مقروءة يلوّث البذرة المشتركة ويظهر في قراءة لاحقة بلا أي عملية حفظ.
 */
const cloneValue = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map(cloneValue) as T;
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, cloneValue(nested)])) as T;
  }
  return value;
};

const cloneArray = <T>(items: T[]): T[] => cloneValue(items);

/**
 * ينشئ مستودعاً لمجموعة معيّنة.
 * القراءة **لا تكتب** أبداً في التخزين (خلافاً لبعض المستودعات القديمة التي كانت
 * تزرع الافتراضي عند أول قراءة فتمحو تمييز «لا بيانات» من «بيانات فارغة»).
 */
export function createCollectionRepository<T>(
  options: CollectionOptions<T>,
  storage: SchemaStorage = dbStorage
): CollectionRepository<T> {
  const { key, fallback, fallbackOnEmpty = false, limit, isValidItem, legacyKeys = [], seed = false } = options;

  /** أول قيمة غير فارغة: المفتاح الحالي ثم المفاتيح القديمة بالترتيب. */
  const readRaw = (): string | null => {
    const current = storage.getItem(key);
    if (current) return current;
    for (const legacy of legacyKeys) {
      const value = storage.getItem(legacy);
      if (value) return value;
    }
    return null;
  };

  /** القيمة الافتراضية مع الزرع الاختياري — الوجهة الوحيدة لكل «لا بيانات صالحة». */
  const fallbackValue = (): T[] => {
    const value = cloneArray(fallback);
    if (seed) writeToStorage(value);
    return value;
  };

  const read = (): T[] => {
    let parsed: unknown;
    try {
      const raw = readRaw();
      if (!raw) return fallbackValue();
      parsed = JSON.parse(raw);
    } catch {
      return fallbackValue();
    }

    if (!Array.isArray(parsed)) return fallbackValue();
    const items = (isValidItem ? parsed.filter(isValidItem) : parsed) as T[];
    if (fallbackOnEmpty && items.length === 0) return fallbackValue();
    return items;
  };

  /** الكتابة الخام (تُستدعى من `write` ومن الزرع). */
  function writeToStorage(items: T[]): void {
    const value = limit && items.length > limit ? items.slice(0, limit) : items;
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`CollectionRepository(${key}): فشل الحفظ`, err);
    }
  }

  const write = (items: T[]): void => writeToStorage(items);

  return {
    key,
    read,
    write,
    prepend: (item: T) => {
      const next = [item, ...read()];
      write(next);
      return next;
    },
    update: (id: string, patch: Partial<T>) => {
      const items = read();
      if (!items.some((item) => idOf(item) === id)) return items;
      const next = items.map((item) => (idOf(item) === id ? { ...item, ...patch } : item));
      write(next);
      return next;
    },
    remove: (id: string) => {
      const next = read().filter((item) => idOf(item) !== id);
      write(next);
      return next;
    },
    findById: (id: string) => read().find((item) => idOf(item) === id) ?? null,
    clear: () => {
      try {
        storage.removeItem?.(key);
      } catch {
        write([]);
      }
    },
  };
}
