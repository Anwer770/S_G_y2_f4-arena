// @vitest-environment jsdom
/**
 * جسر التخزين `src/database/dbStorage.ts` (R53).
 *
 * كل مستودعات التطبيق تكتب عبر هذا الجسر، وكان 34 سطراً خارج المقام. اختبرناه ضد
 * المحرّك الحقيقي (fake-indexeddb) لا ضد بديل مُصطنع، لأنه مجرّد تمرير: الخطأ الوحيد
 * الممكن فيه هو أن يمرّر إلى المكان الخطأ.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { dbStorage } from '../../src/database/dbStorage';
import { indexedDBStorage } from '../../src/database/adapters/IndexedDBAdapter';

const realLocalStorage = window.localStorage;
let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  window.localStorage.clear();
  window.indexedDB = new IDBFactory() as unknown as IDBFactory;
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  warnSpy.mockRestore();
  Object.defineProperty(window, 'localStorage', { value: realLocalStorage, configurable: true });
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('dbStorage: قراءة وكتابة', () => {
  it('setItem يكتب نصاً كما هو، وgetItem يعيده بلا تفسير', async () => {
    await indexedDBStorage.ready();
    dbStorage.setItem('bridge_key', '{"a":1}');

    expect(dbStorage.getItem('bridge_key')).toBe('{"a":1}');
    expect(indexedDBStorage.getRawSync('bridge_key')).toBe('{"a":1}');
  });

  it('getItem يسقط إلى localStorage حين لا تعرف الذاكرة المفتاح', async () => {
    await indexedDBStorage.ready();
    window.localStorage.setItem('ls_bridge', '{"from":"ls"}');

    expect(dbStorage.getItem('ls_bridge')).toBe('{"from":"ls"}');
  });

  it('getItem يعيد null لا undefined حين يغيب كل شيء', async () => {
    await indexedDBStorage.ready();
    window.localStorage.clear();

    expect(dbStorage.getItem('غائب تماماً')).toBeNull();
  });

  it('getItem بلا localStorage يعيد null', async () => {
    await indexedDBStorage.ready();
    Object.defineProperty(window, 'localStorage', { value: undefined, configurable: true });

    expect(dbStorage.getItem('بلا مخزن')).toBeNull();
  });

  it('فشل الكتابة في المحرّك يُسجَّل تحذيراً ولا يرمي على المستدعي', async () => {
    vi.spyOn(indexedDBStorage, 'setRawSync').mockImplementation(() => {
      throw new Error('محرّك معطوب');
    });

    expect(() => dbStorage.setItem('k', 'v')).not.toThrow();
    expect(warnSpy.mock.calls.map((c) => String(c[0])).join(' ')).toContain('dbStorage: failed to set key');
  });
});

describe('dbStorage: تمرير الحذف والمسح والإحصاء', () => {
  it('removeItem وclear يمرّان إلى المحرّك فعلاً', async () => {
    await indexedDBStorage.ready();
    dbStorage.setItem('a', '1');
    dbStorage.setItem('b', '2');

    dbStorage.removeItem('a');
    expect(indexedDBStorage.hasKey('a')).toBe(false);
    expect(indexedDBStorage.hasKey('b')).toBe(true);

    dbStorage.clear();
    expect(indexedDBStorage.getAllKeys()).toEqual([]);
  });

  it('getStats يعيد إحصاء المحرّك نفسه', async () => {
    await indexedDBStorage.ready();
    dbStorage.setItem('stat_key', 'نص');

    const stats = dbStorage.getStats();
    /* المُفرد `indexedDBStorage` يُنشأ عند الاستيراد — قبل أن يزرع الاختبار مصنع
       fake-indexeddb — فيعمل بذاكرة احتياطية هنا. المهم أن الجسر يُمرّر إحصاء المحرّك
       ذاته بلا تعديل، لا أن يصنع أرقامه. */
    const engineStats = indexedDBStorage.getStorageStats();
    expect(stats.totalKeys).toBe(1);
    expect(stats).toEqual(engineStats);
  });
});
