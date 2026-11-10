// @vitest-environment jsdom
/**
 * اختبارات محرّك التخزين الدائم (R53) — `src/database/adapters/IndexedDBAdapter.ts`.
 *
 * هذا الملف هو الطبقة التي تُخزّن **كل** بيانات المستخدم فعلياً: ذاكرة مؤقتة + IndexedDB
 * + نسخة احتياطية في localStorage، مع ترحيل تلقائي. وكان **خارج مقام التغطية**: إدخاله أنزل
 * الإجمالي من 100% أسطر إلى **93.06%**.
 *
 * لا نكتفي بـ«الكتابة لا ترمي»: نكتب ثم نفتح **محرّكاً جديداً** على نفس قاعدة البيانات
 * ونتحقّق أن القيمة وصلت فعلاً — أي أننا نقيس **البقاء** لا استدعاء الدالة.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { IndexedDBAdapter } from '../../src/database/adapters/IndexedDBAdapter';

/** يقرأ مفتاحاً من IndexedDB مباشرةً — خارج الذاكرة المؤقتة، للحكم على الوصول الفعلي للقرص. */
const rawFromIDB = (dbName = 'PrimoERP_IndexedDB'): Promise<Record<string, unknown>> =>
  new Promise((resolve) => {
    const req = window.indexedDB.open(dbName);
    req.onerror = () => resolve({});
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('keyval')) {
        db.close();
        resolve({});
        return;
      }
      const tx = db.transaction('keyval', 'readonly');
      const all = tx.objectStore('keyval').getAllKeys();
      const values = tx.objectStore('keyval').getAll();
      tx.oncomplete = () => {
        const out: Record<string, unknown> = {};
        all.result.forEach((key: string, i: number) => {
          out[key] = values.result[i];
        });
        db.close();
        resolve(out);
      };
      tx.onerror = () => {
        db.close();
        resolve({});
      };
    };
  });

let warnSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  window.localStorage.clear();
  window.indexedDB = new IDBFactory() as unknown as IDBFactory;
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});

describe('الدورة الأساسية: كتابة ← بقاء ← قراءة من محرّك جديد', () => {
  it('setItemSync يصل إلى IndexedDB فعلاً ويُقرأ بعد إعادة الفتح', async () => {
    const first = new IndexedDBAdapter();
    await first.ready();
    first.setItemSync('suite_test_key', { hello: 'عالم', n: 7 });

    /* ننتظر المزامنة غير المتزامنة إلى IDB */
    await vi.waitFor(async () => {
      expect(await rawFromIDB()).toHaveProperty('suite_test_key');
    });

    window.localStorage.clear();
    const second = new IndexedDBAdapter();
    await second.ready();

    expect(second.getItemSync('suite_test_key')).toEqual({ hello: 'عالم', n: 7 });
    expect(second.isReady()).toBe(true);
  });

  it('getRawSync يقرأ النص كما هو، وgetItemSync يفكّ JSON ويعيد الافتراضي عند الغياب', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    adapter.setRawSync('raw_key', '{"a":1}');

    expect(adapter.getRawSync('raw_key')).toBe('{"a":1}');
    expect(adapter.getItemSync('raw_key')).toEqual({ a: 1 });
    expect(adapter.getItemSync('غائب')).toBeNull();
    expect(adapter.getItemSync('غائب', 'افتراضي')).toBe('افتراضي');
    expect(adapter.hasKey('raw_key')).toBe(true);
    expect(adapter.getAllKeys()).toContain('raw_key');
  });

  it('JSON تالف يُعاد كنص خام لا كقيمة مخترعة', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    adapter.setRawSync('تالف', '{ليس JSON');

    expect(adapter.getItemSync('تالف')).toBe('{ليس JSON');
  });

  it('removeItemSync وremoveItem يمسحان الذاكرة وlocalStorage وقاعدة البيانات', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    adapter.setItemSync('k1', { a: 1 });
    adapter.setItemSync('k2', { b: 2 });

    adapter.removeItemSync('k1');
    await adapter.removeItem('k2');

    expect(adapter.hasKey('k1')).toBe(false);
    expect(adapter.hasKey('k2')).toBe(false);
    expect(window.localStorage.getItem('k1')).toBeNull();
    await vi.waitFor(async () => {
      const raw = await rawFromIDB();
      expect(raw).not.toHaveProperty('k1');
      expect(raw).not.toHaveProperty('k2');
    });
  });

  it('clearSync يفرّغ الذاكرة وقاعدة البيانات وlocalStorage', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    adapter.setItemSync('k1', { a: 1 });
    await adapter.clear();

    expect(adapter.getAllKeys()).toEqual([]);
    expect(window.localStorage.length).toBe(0);
    await vi.waitFor(async () => {
      expect(Object.keys(await rawFromIDB())).toEqual([]);
    });
  });
});

describe('الترحيل من localStorage — الوعد المعلن', () => {
  it('قاعدة IndexedDB فارغة + بيانات في localStorage ⇒ تُرحَّل فعلاً', async () => {
    window.localStorage.setItem('legacy_a', '{"v":1}');
    window.localStorage.setItem('legacy_b', '{"v":2}');

    const adapter = new IndexedDBAdapter();
    await adapter.ready();

    const raw = await rawFromIDB();
    expect(raw).toHaveProperty('legacy_a');
    expect(raw).toHaveProperty('legacy_b');
    expect(adapter.getItemSync('legacy_a')).toEqual({ v: 1 });
  });

  it('قاعدة IndexedDB فيها بيانات مسبقاً ⇒ لا يُرحَّل شيء ولا تُستبدل القيم', async () => {
    /* نزرع قيمة في IDB أولاً */
    const seeder = new IndexedDBAdapter();
    await seeder.ready();
    seeder.setItemSync('existing', { from: 'idb' });
    await vi.waitFor(async () => {
      expect(await rawFromIDB()).toHaveProperty('existing');
    });
    window.localStorage.clear();
    window.localStorage.setItem('only_in_ls', '{"from":"ls"}');

    const adapter = new IndexedDBAdapter();
    await adapter.ready();

    const raw = await rawFromIDB();
    expect(raw).toHaveProperty('existing');
    expect(raw).not.toHaveProperty('only_in_ls');
    expect(adapter.getItemSync('existing')).toEqual({ from: 'idb' });
  });
});

describe('الكتابة قبل الجاهزية — نافذة فقدان البيانات', () => {
  it('كتابة قبل اكتمال الفتح لا تبقى في الذاكرة وحدها: تُدفع إلى IndexedDB بعد الجاهزية', async () => {
    const first = new IndexedDBAdapter();
    /* لم ننتظر ready(): هذه كتابة في أول أجزاء الثانية من الإقلاع */
    first.setItemSync('early_key', { early: true });

    await first.ready();
    await vi.waitFor(async () => {
      expect(await rawFromIDB()).toHaveProperty('early_key');
    });

    /* الدليل القاطع: محرّك جديد بلا localStorage يجب أن يجد القيمة في IDB */
    window.localStorage.clear();
    const second = new IndexedDBAdapter();
    await second.ready();

    expect(second.getItemSync('early_key')).toEqual({ early: true });
  });

  it('الكتابة المبكرة تُدفَع بصمت (لا تحذير مرعب) لأنها عولجت فعلاً', async () => {
    const adapter = new IndexedDBAdapter();
    adapter.setItemSync('early_quiet', 1);
    await adapter.ready();

    const messages = warnSpy.mock.calls.map((c) => String(c[0])).join(' ');
    expect(messages).not.toContain('writes before hydration');
  });

  it('إن فشل الدفع تُبلَّغ الكتابة بالاسم في السجل (لا تُكتَم)', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    /* نُعيد الحالة إلى «قبل الجاهزية» يدوياً ونُفشل الحفظ لنقيس مسار الفشل الموثَّق */
    const internals = adapter as unknown as {
      preHydrationWrites: Set<string>;
      memoryCache: Map<string, string>;
      db: unknown;
      flushPreHydrationWrites: () => Promise<void>;
    };
    internals.db = {
      transaction: () => {
        throw new Error('قرص غير متاح');
      },
    };
    internals.memoryCache.set('early_failed', '"x"');
    internals.preHydrationWrites.add('early_failed');
    warnSpy.mockClear();

    await internals.flushPreHydrationWrites();
    (adapter as unknown as { reportPreHydrationWrites: () => void }).reportPreHydrationWrites();

    const messages = warnSpy.mock.calls.map((c) => String(c[0])).join(' ');
    expect(messages).toContain('early_failed');
    expect(messages).toContain('could not flush');
  });
});

describe('السقوط الآمن حين يغيب IndexedDB أو يفشل', () => {
  it('بيئة بلا IndexedDB: يعمل بالذاكرة ويُعلن الجاهزية بلا رمي', async () => {
    window.indexedDB = undefined as unknown as IDBFactory;

    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    adapter.setItemSync('k', { v: 1 });

    expect(adapter.isReady()).toBe(true);
    expect(adapter.getItemSync('k')).toEqual({ v: 1 });
    expect(adapter.getStorageStats().isIndexedDBActive).toBe(false);
  });

  it('فتح قاعدة البيانات يرمي ⇒ لا انهيار، والمحرّك يعمل بالذاكرة', async () => {
    window.indexedDB = {
      open: () => {
        throw new Error('محجوب');
      },
    } as unknown as IDBFactory;

    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    adapter.setItemSync('k', { v: 2 });

    expect(adapter.getItemSync('k')).toEqual({ v: 2 });
    expect(errorSpy).toHaveBeenCalled();
  });

  it('فشل طلب الفتح (onerror) ⇒ جاهزية بالذاكرة بلا تعليق', async () => {
    const request: Record<string, unknown> = {};
    window.indexedDB = {
      open: () => {
        setTimeout(() => {
          (request.onerror as () => void)?.();
        }, 0);
        return request;
      },
    } as unknown as IDBFactory;

    const adapter = new IndexedDBAdapter();
    await adapter.ready();

    expect(adapter.isReady()).toBe(true);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('فشل قراءة الصفوف من IDB (transaction يرمي) ⇒ لا تعليق', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    (adapter as unknown as { db: unknown }).db = {
      transaction: () => {
        throw new Error('لا قراءة');
      },
      objectStoreNames: { contains: () => true },
    };

    await expect(
      (adapter as unknown as { loadAllFromIndexedDB: () => Promise<void> }).loadAllFromIndexedDB()
    ).resolves.toBeUndefined();
  });

  it('فشل الحفظ غير المتزامن يُسجَّل تحذيراً ولا يُسقط الكتابة', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    (adapter as unknown as { db: unknown }).db = {
      transaction: () => {
        throw new Error('قرص ممتلئ');
      },
    };

    adapter.setItemSync('k', { v: 3 });

    expect(adapter.getItemSync('k')).toEqual({ v: 3 });
    await vi.waitFor(() => {
      expect(warnSpy.mock.calls.map((c) => String(c[0])).join(' ')).toContain('async persist failed');
    });
  });

  it('امتلاء localStorage لا يمنع الكتابة (IndexedDB هو المخزن الدائم)', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    const setItem = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });

    expect(() => adapter.setItemSync('k', { v: 4 })).not.toThrow();
    expect(adapter.getItemSync('k')).toEqual({ v: 4 });

    setItem.mockRestore();
  });

  it('قراءة قيمة موجودة في localStorage فقط تُنسخ إلى الذاكرة', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    window.localStorage.setItem('ls_only', '{"from":"ls"}');
    (adapter as unknown as { memoryCache: Map<string, string> }).memoryCache.delete('ls_only');

    expect(adapter.getRawSync('ls_only')).toBe('{"from":"ls"}');
    expect(adapter.hasKey('ls_only')).toBe(true);
  });
});

describe('الإحصاءات والواجهة العامة', () => {
  it('getStorageStats يعدّ المفاتيح ويقدّر الحجم ويعلن المحرّك النشط', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    adapter.setItemSync('a', 'ابجد');
    adapter.setItemSync('b', { x: 1 });

    const stats = adapter.getStorageStats();

    expect(stats.totalKeys).toBe(2);
    expect(stats.estimatedBytes).toBeGreaterThan(0);
    expect(stats.isIndexedDBActive).toBe(true);
    expect(stats.engine).toContain('IndexedDB');
  });

  it('setItem غير المتزامن يكتب ويُقرأ عبر getItem', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    await adapter.setItem('async_key', { ok: true });

    expect(await adapter.getItem('async_key')).toEqual({ ok: true });
    expect(adapter.getItemSync('async_key')).toEqual({ ok: true });
  });

  it('setItemSync لقيمة غير قابلة للتسلسل يُسجَّل خطأ ولا يرمي', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.ready();
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(() => adapter.setItemSync('circ', circular)).not.toThrow();
    expect(errorSpy.mock.calls.map((c) => String(c[0])).join(' ')).toContain('Failed to set key');
  });
});
