// @vitest-environment jsdom
/**
 * أفرع محرّك التخزين الدائم الدقيقة (R53) — الجزء الثاني.
 *
 * الملف الأول يقيس الدورة الكاملة والبقاء. هذا الملف يقيس **مسارات الفشل** التي لا تظهر
 * في الاستخدام العادي: localStorage محجوب أو ممتلئ، كتابة تفشل في القاعدة، قراءة تُرمى،
 * وبيئة بلا `window`. كلها مسارات تُقرِّر: هل تُفقد بيانات المستخدم بهدوء أم تُسجَّل؟
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { IndexedDBAdapter } from '../../src/database/adapters/IndexedDBAdapter';

type Internals = {
  db: unknown;
  initPromise: Promise<void> | null;
  memoryCache: Map<string, string>;
  preHydrationWrites: Set<string>;
  flushPreHydrationWrites: () => Promise<void>;
  persistToIDB: (k: string, v: string) => Promise<void>;
  deleteFromIDB: (k: string) => Promise<void>;
};

const inside = (adapter: IndexedDBAdapter): Internals => adapter as unknown as Internals;

let warnSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;
const realLocalStorage = window.localStorage;

beforeEach(() => {
  window.localStorage.clear();
  window.indexedDB = new IDBFactory() as unknown as IDBFactory;
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  warnSpy.mockRestore();
  errorSpy.mockRestore();
  vi.unstubAllGlobals();
  Object.defineProperty(window, 'localStorage', { value: realLocalStorage, configurable: true });
});

const setLocalStorage = (value: unknown): void => {
  Object.defineProperty(window, 'localStorage', { value, configurable: true });
};

describe('localStorage معطوب أو محجوب', () => {
  it('قراءة الكاش الأولي تفشل ⇒ تحذير ومتابعة بلا انهيار', async () => {
    const throwing = {
      get length() {
        throw new Error('محجوب');
      },
      key: () => null,
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
    };
    setLocalStorage(throwing);

    const adapter = new IndexedDBAdapter();
    /* العيب الذي كشفه هذا الاختبار: قراءة `localStorage.length` كانت داخل مسار الفتح
       بلا حماية، فاستثناءها يُبقي وعد التهيئة معلّقاً ⇒ إقلاع لا ينتهي. */
    await adapter.ready();
    expect(adapter.isReady()).toBe(true);
    adapter.setItemSync('k', { v: 1 });

    expect(adapter.getItemSync('k')).toEqual({ v: 1 });
    expect(warnSpy.mock.calls.map((c) => String(c[0])).join(' ')).toContain(
      'could not read initial localStorage cache'
    );
  });

  it('الترحيل يفشل في منتصفه ⇒ تحذير «partial failure» والمحرّك يعمل', async () => {
    const halfBroken = {
      length: 2,
      key: () => 'legacy',
      getItem: () => {
        throw new Error('قراءة ممنوعة');
      },
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
    };
    setLocalStorage(halfBroken);

    const adapter = new IndexedDBAdapter();
    await adapter.ready();

    expect(adapter.isReady()).toBe(true);
    expect(warnSpy.mock.calls.map((c) => String(c[0])).join(' ')).toContain('Migration partial failure');
  });

  it('غياب localStorage كلياً: الكتابة والمسح والقراءة تعمل من القاعدة وحدها', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();

    setLocalStorage(undefined);
    expect(() => adapter.setItemSync('big', { ok: true })).not.toThrow();
    expect(adapter.getItemSync('big')).toEqual({ ok: true });

    adapter.removeItemSync('big');
    expect(adapter.hasKey('big')).toBe(false);

    adapter.setItemSync('another', 1);
    adapter.clearSync();
    expect(adapter.getAllKeys()).toEqual([]);
  });
});

describe('فشل عمليات القاعدة نفسها', () => {
  it('persistToIDB بلا قاعدة مفتوحة ينتهي بلا كتابة ولا رمي', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    inside(adapter).db = null;

    await expect(inside(adapter).persistToIDB('k', '"v"')).resolves.toBeUndefined();
  });

  it('فشل put يُرفض بخطأه (لا يُبتلع) فيصل إلى تحذير الحفظ', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    inside(adapter).db = {
      transaction: () => ({
        objectStore: () => ({
          put: () => {
            const req: Record<string, unknown> = { error: new Error('فشل put') };
            setTimeout(() => (req.onerror as () => void)?.(), 0);
            return req;
          },
        }),
      }),
    };

    await expect(inside(adapter).persistToIDB('k', '"v"')).rejects.toThrow('فشل put');
  });

  it('فشل delete يُبتلع بهدوء (المسح لا يفشل أبداً)', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    inside(adapter).db = {
      transaction: () => ({
        objectStore: () => ({
          delete: () => {
            const req: Record<string, unknown> = {};
            setTimeout(() => (req.onerror as () => void)?.(), 0);
            return req;
          },
        }),
      }),
    };

    await expect(inside(adapter).deleteFromIDB('k')).resolves.toBeUndefined();
  });

  it('delete حين يرمي transaction نفسه ⇒ يُبتلع', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    inside(adapter).db = {
      transaction: () => {
        throw new Error('لا معاملة');
      },
    };

    await expect(inside(adapter).deleteFromIDB('k')).resolves.toBeUndefined();
  });

  it('clearSync بلا قاعدة يمسح الذاكرة فقط', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    adapter.setItemSync('k', 1);
    inside(adapter).db = null;

    expect(() => adapter.clearSync()).not.toThrow();
    expect(adapter.getAllKeys()).toEqual([]);
  });
});

describe('ready() وgetItem غير المتزامن', () => {
  it('ready بلا وعد تهيئة يُحلّ فوراً', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    inside(adapter).initPromise = null;

    await expect(adapter.ready()).resolves.toBeUndefined();
  });

  it('getItem وsetItem وremoveItem بلا وعد تهيئة تعمل مباشرة', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    inside(adapter).initPromise = null;

    await adapter.setItem('k', { v: 9 });
    expect(await adapter.getItem('k')).toEqual({ v: 9 });
    await adapter.removeItem('k');
    expect(adapter.hasKey('k')).toBe(false);
  });
});

describe('الدفع عند الجاهزية: الحالات الحدّية', () => {
  it('مفتاح في قائمة الانتظار بلا قيمة في الذاكرة يُحذف ولا يُدفع', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    inside(adapter).preHydrationWrites.add('بلا قيمة');

    await inside(adapter).flushPreHydrationWrites();

    expect(inside(adapter).preHydrationWrites.size).toBe(0);
  });

  it('setRawSync قبل الجاهزية يُسجَّل ثم يُدفع، وفشل الدفع يُحذَّر', async () => {
    const adapter = new IndexedDBAdapter();
    adapter.setRawSync('early_raw', '"v"');
    expect(inside(adapter).preHydrationWrites.has('early_raw')).toBe(true);

    await adapter.ready();
    expect(inside(adapter).preHydrationWrites.has('early_raw')).toBe(false);

    inside(adapter).db = {
      transaction: () => {
        throw new Error('مغلق');
      },
    };
    adapter.setRawSync('later_raw', '"w"');
    await vi.waitFor(() => {
      expect(warnSpy.mock.calls.map((c) => String(c[0])).join(' ')).toContain('async persist failed');
    });
  });
});

describe('قراءة/كتابة القيمة عبر localStorage وحده', () => {
  it('مفتاح غائب تماماً يعيد null ولا يلوّث الذاكرة', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();

    expect(adapter.getRawSync('غير موجود')).toBeNull();
    expect(adapter.hasKey('غير موجود')).toBe(false);
  });

  it('getItemSync يقرأ من localStorage عند غياب الذاكرة: JSON صالح وتالف', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    window.localStorage.setItem('ls_json', '{"a":5}');
    window.localStorage.setItem('ls_text', 'نص خام');
    inside(adapter).memoryCache.delete('ls_json');
    inside(adapter).memoryCache.delete('ls_text');

    expect(adapter.getItemSync('ls_json')).toEqual({ a: 5 });
    expect(adapter.getItemSync('ls_text')).toBe('نص خام');
  });

  it('انفجار الذاكرة المؤقتة نفسها يُعيد الافتراضي بدل الرمي', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    inside(adapter).memoryCache = {
      get: () => {
        throw new Error('ذاكرة معطوبة');
      },
      has: () => false,
    } as unknown as Map<string, string>;

    expect(adapter.getItemSync('k')).toBeNull();
    expect(adapter.getItemSync('k', 'احتياطي')).toBe('احتياطي');
  });

  it('قيمة أكبر من 500KB لا تُنسخ إلى localStorage (حدّ الحصة)', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    const huge = 'x'.repeat(600_000);

    adapter.setItemSync('huge', huge);

    expect(adapter.getItemSync('huge')).toBe(huge);
    expect(window.localStorage.getItem('huge')).toBeNull();
  });
});

describe('قراءة الصفوف: قاعدة غائبة أو مؤشّر يفشل', () => {
  const internalsOf = (a: IndexedDBAdapter) =>
    a as unknown as {
      loadAllFromIndexedDB: () => Promise<void>;
      db: unknown;
      memoryCache: Map<string, string>;
    };

  it('بلا قاعدة مفتوحة: loadAll تنتهي فوراً بلا رمي', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    internalsOf(adapter).db = null;

    await expect(internalsOf(adapter).loadAllFromIndexedDB()).resolves.toBeUndefined();
  });

  it('فشل المؤشّر (openCursor.onerror) ⇒ تُحلّ بلا صفوف ولا تعليق', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    internalsOf(adapter).db = {
      transaction: () => ({
        objectStore: () => ({
          openCursor: () => {
            const req: Record<string, unknown> = {};
            setTimeout(() => (req.onerror as () => void)?.(), 0);
            return req;
          },
        }),
      }),
    };

    await expect(internalsOf(adapter).loadAllFromIndexedDB()).resolves.toBeUndefined();
  });
});

describe('مفاتيح localStorage غير صالحة', () => {
  it('key() يعيد null أثناء الكاش الأولي والترحيل: لا انهيار ولا ترحيل وهمي', async () => {
    setLocalStorage({
      length: 1,
      key: () => null,
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
    });

    const adapter = new IndexedDBAdapter();
    await adapter.ready();

    expect(adapter.isReady()).toBe(true);
    expect(adapter.getAllKeys()).toEqual([]);
  });
});

describe('غياب localStorage في المسارات غير المتزامنة', () => {
  it('setItem وremoveItem تعملان بلا localStorage', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    setLocalStorage(undefined);

    await adapter.setItem('async_no_ls', { ok: 1 });
    expect(adapter.getItemSync('async_no_ls')).toEqual({ ok: 1 });

    await adapter.removeItem('async_no_ls');
    expect(adapter.hasKey('async_no_ls')).toBe(false);

    adapter.setItemSync('sync_no_ls', { ok: 2 });
    adapter.clearSync();
    expect(adapter.getAllKeys()).toEqual([]);
  });
});
