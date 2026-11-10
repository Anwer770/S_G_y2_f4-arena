/**
 * اختبارات وحدة لمحرّك ترحيل المخططات والمستودع العام (R33).
 *
 * يغطّي الضمانات الخمسة: لا فقدان بيانات · idempotent · لا رجوع للخلف · لا انهيار ·
 * لا كتابة بلا داعٍ — إضافة إلى سلوك المستودع (الخطة البديلة، التقصير، التحديث، الحذف).
 */
import { describe, it, expect, vi } from 'vitest';
import {
  runMigrations,
  migrateValue,
  readVersions,
  emptyReport,
  BACKUP_SUFFIX,
  SCHEMA_META_KEY,
  type SchemaEntry,
  type SchemaStorage,
} from '../../src/database/schema';
import { SCHEMA_ENTRIES } from '../../src/database/schema/entries';
import { createCollectionRepository } from '../../src/database/repositories/CollectionRepository';
import { createObjectRepository } from '../../src/database/repositories/ObjectRepository';
import { createValueRepository } from '../../src/database/repositories/ValueRepository';

/** تخزين وهمي في الذاكرة (لا IndexedDB ولا localStorage). */
function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  const storage: SchemaStorage = {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
  return { storage, data };
}

const ctx = { now: '2026-11-08T00:00:00.000Z' };

const entry: SchemaEntry = {
  key: 'k1',
  version: 2,
  migrations: {
    0: (value) => ({ ...(value as object), addedAtV1: true }),
    1: (value) => ({ ...(value as object), addedAtV2: true }),
  },
};

describe('محرّك الترحيل', () => {
  it('يرحّل من 0 إلى الإصدار الحالي بتطبيق كل الخطوات بالترتيب', () => {
    const { storage, data } = memoryStorage({ k1: JSON.stringify({ name: 'x' }) });
    const report = runMigrations({ storage, entries: [entry], ctx });

    expect(report.upgraded).toBe(1);
    const stored = JSON.parse(data.k1);
    expect(stored.addedAtV1).toBe(true);
    expect(stored.addedAtV2).toBe(true);
    expect(stored.name).toBe('x');
    expect(readVersions(storage).k1).toBe(2);
  });

  it('يحفظ نسخة احتياطية للقيمة الأصلية قبل الترحيل', () => {
    const original = JSON.stringify({ name: 'x' });
    const { storage, data } = memoryStorage({ k1: original });
    const report = runMigrations({ storage, entries: [entry], ctx });

    expect(report.outcomes[0].backupKey).toBe(`k1${BACKUP_SUFFIX}`);
    expect(data[`k1${BACKUP_SUFFIX}`]).toBe(original);
  });

  it('idempotent: التشغيل الثاني لا يُغيّر شيئاً', () => {
    const { storage, data } = memoryStorage({ k1: JSON.stringify({ name: 'x' }) });
    runMigrations({ storage, entries: [entry], ctx });
    const afterFirst = data.k1;
    const second = runMigrations({ storage, entries: [entry], ctx });

    expect(second.upgraded).toBe(0);
    expect(second.current).toBe(1);
    expect(second.outcomes[0].status).toBe('current');
    expect(data.k1).toBe(afterFirst);
  });

  it('لا يهبط ببيانات بإصدار أحدث من الكود', () => {
    const { storage, data } = memoryStorage({
      [SCHEMA_META_KEY]: JSON.stringify({ k1: 5 }),
      k1: JSON.stringify({ name: 'من إصدار أحدث' }),
    });
    const report = runMigrations({ storage, entries: [entry], ctx });

    expect(report.outcomes[0].status).toBe('skipped-future');
    expect(JSON.parse(data.k1).name).toBe('من إصدار أحدث');
  });

  it('يتعافى من JSON تالف بلا مسح ولا انهيار', () => {
    const { storage, data } = memoryStorage({ k1: '{ليس JSON' });
    const report = runMigrations({ storage, entries: [entry], ctx });

    expect(report.failed).toBe(1);
    expect(data.k1).toBe('{ليس JSON'); // لم يُمسّ
    expect(readVersions(storage).k1).toBeUndefined();
  });

  it('فشل ترحيل واحد لا يمنع البقية', () => {
    const broken: SchemaEntry = {
      key: 'bad',
      version: 2,
      migrations: {
        0: () => {
          throw new Error('عطل');
        },
      },
    };
    const { storage } = memoryStorage({ bad: '{}', k1: JSON.stringify({ name: 'x' }) });
    const report = runMigrations({ storage, entries: [broken, entry], ctx });

    expect(report.failed).toBe(1);
    expect(report.upgraded).toBe(1);
    expect(report.outcomes.find((o) => o.key === 'bad')?.error).toContain('عطل');
  });

  it('لا يُنشئ مفتاحاً غير موجود', () => {
    const { storage, data } = memoryStorage();
    const report = runMigrations({ storage, entries: [entry], ctx });

    expect(report.outcomes[0].status).toBe('skipped-empty');
    expect('k1' in data).toBe(false);
    expect(data[SCHEMA_META_KEY]).toBeUndefined();
  });

  it('يبلغ عن ترحيل ناقص (إصدار بلا دالة) بدل تطبيق خاطئ', () => {
    const gap: SchemaEntry = { key: 'g', version: 3, migrations: { 0: (v) => v } };
    expect(() => migrateValue({}, gap, 0, ctx)).toThrow(/لا يوجد ترحيل من الإصدار 1/);
  });

  it('التقرير الفارغ بالشكل المتفق عليه', () => {
    expect(emptyReport()).toEqual({ upgraded: 0, current: 0, failed: 0, outcomes: [] });
  });
});

describe('سجل المخططات الفعلي', () => {
  it('كل مفتاح مسجَّل له إصدار ≥ 1 وترحيل 0 موجود', () => {
    expect(SCHEMA_ENTRIES.length).toBeGreaterThan(0);
    for (const item of SCHEMA_ENTRIES) {
      expect(item.version).toBeGreaterThanOrEqual(1);
      expect(typeof item.migrations[0]).toBe('function');
    }
  });

  it('ترحيل المهام يضمن المصفوفات الفرعية ويمنع الانهيار على سجل مستورد ناقص', () => {
    const tasksEntry = SCHEMA_ENTRIES.find((e) => e.key === 'workos_v1_tasks')!;
    const migrated = tasksEntry.migrations[0]([{ id: 't1', title: 'مهمة' }, null, 'سلسلة'], ctx) as Record<
      string,
      unknown
    >[];

    expect(migrated).toHaveLength(1);
    expect(migrated[0].subtasks).toEqual([]);
    expect(migrated[0].tags).toEqual([]);
    expect(migrated[0].progress).toBe(0);
    expect(migrated[0].id).toBe('t1');
  });

  it('ترحيل المهام يعطي معرّفات بديلة للسجلات بلا معرّف ويمنع التكرار', () => {
    const tasksEntry = SCHEMA_ENTRIES.find((e) => e.key === 'workos_v1_tasks')!;
    const migrated = tasksEntry.migrations[0](
      [{ title: 'أ' }, { title: 'ب' }, { id: 'dup' }, { id: 'dup' }],
      ctx
    ) as Record<string, unknown>[];

    const ids = migrated.map((t) => t.id);
    expect(new Set(ids).size).toBe(4);
  });

  it('ترحيل المشاريع يحصر التقدم في [0,100]', () => {
    const projectsEntry = SCHEMA_ENTRIES.find((e) => e.key === 'workos_v1_projects')!;
    const migrated = projectsEntry.migrations[0](
      [
        { id: 'p1', name: 'أ', progress: 250 },
        { id: 'p2', name: 'ب', progress: -5 },
      ],
      ctx
    ) as Record<string, unknown>[];

    expect(migrated[0].progress).toBe(100);
    expect(migrated[1].progress).toBe(0);
  });

  it('ترحيل الملاحظات يضمن مرفقات صالحة', () => {
    const notesEntry = SCHEMA_ENTRIES.find((e) => e.key === 'suite_knowledge_notes_v1')!;
    const migrated = notesEntry.migrations[0](
      [{ id: 'n1', title: 'ملاحظة', attachments: [{ name: 'ملف' }, null] }],
      ctx
    ) as Record<string, unknown>[];

    const attachments = migrated[0].attachments as Record<string, unknown>[];
    expect(attachments).toHaveLength(2);
    expect(attachments[0].id).toBeTruthy();
    expect(attachments[0].type).toBe('application/octet-stream');
  });

  it('ترحيل غير المصفوفات يُعيد مصفوفة فارغة بدل الانهيار', () => {
    for (const item of SCHEMA_ENTRIES) {
      expect(Array.isArray(item.migrations[0]({ not: 'array' }, ctx))).toBe(true);
      expect(Array.isArray(item.migrations[0](null, ctx))).toBe(true);
    }
  });
});

describe('مستودع المجموعة', () => {
  it('يقرأ القيمة المخزَّنة ويُعيد نسخة لا مرجعاً', () => {
    const { storage, data } = memoryStorage({ c: JSON.stringify([{ id: 'a' }]) });
    const repo = createCollectionRepository<{ id?: string }>({ key: 'c', fallback: [] }, storage);

    const items = repo.read();
    items.push({ id: 'b' });
    expect(data.c).toBe(JSON.stringify([{ id: 'a' }]));
  });

  it('يعود للخطة البديلة عند التلف أو النوع الخاطئ', () => {
    const fallback = [{ id: 'seed' }];
    const { storage } = memoryStorage({ c: 'تالف', d: '{"a":1}' });
    expect(createCollectionRepository({ key: 'c', fallback }, storage).read()).toEqual(fallback);
    expect(createCollectionRepository({ key: 'd', fallback }, storage).read()).toEqual(fallback);
    expect(createCollectionRepository({ key: 'missing', fallback }, storage).read()).toEqual(fallback);
  });

  it('seed (R45): يزرع الافتراضي عند الغياب أو التلف فقط — والقاعدة: بلا seed لا كتابة', () => {
    const fallback = ['نقد', 'شبكة'];

    // غياب المفتاح
    const missing = memoryStorage();
    expect(createCollectionRepository<string>({ key: 'k', fallback, seed: true }, missing.storage).read()).toEqual(
      fallback
    );
    expect(missing.data.k).toBe(JSON.stringify(fallback));

    // تلف القيمة
    const corrupt = memoryStorage({ k: '{تالف' });
    expect(createCollectionRepository<string>({ key: 'k', fallback, seed: true }, corrupt.storage).read()).toEqual(
      fallback
    );
    expect(corrupt.data.k).toBe(JSON.stringify(fallback));

    // المصفوفة الفارغة **صالحة** ⇒ لا زرع فوقها
    const empty = memoryStorage({ k: '[]' });
    expect(createCollectionRepository<string>({ key: 'k', fallback, seed: true }, empty.storage).read()).toEqual([]);
    expect(empty.data.k).toBe('[]');

    // بلا seed: القراءة لا تكتب أبداً (قاعدة الطبقة الجديدة)
    const plain = memoryStorage();
    expect(createCollectionRepository<string>({ key: 'k', fallback }, plain.storage).read()).toEqual(fallback);
    expect(plain.data.k).toBeUndefined();
  });

  it('fallbackOnEmpty يفرّق بين «لا بيانات» و«بيانات فارغة»', () => {
    const fallback = [{ id: 'seed' }];
    const { storage } = memoryStorage({ c: '[]' });
    expect(createCollectionRepository({ key: 'c', fallback, fallbackOnEmpty: true }, storage).read()).toEqual(fallback);
    expect(createCollectionRepository({ key: 'c', fallback }, storage).read()).toEqual([]);
  });

  it('الكتابة تحترم السقف', () => {
    const { storage, data } = memoryStorage();
    const repo = createCollectionRepository<{ id: string }>({ key: 'c', fallback: [], limit: 3 }, storage);
    repo.write([1, 2, 3, 4, 5].map((n) => ({ id: String(n) })));
    expect(JSON.parse(data.c)).toHaveLength(3);
  });

  it('التحديث والحذف والإضافة في المقدمة', () => {
    const { storage } = memoryStorage({ c: JSON.stringify([{ id: 'a', v: 1 }]) });
    const repo = createCollectionRepository<{ id?: string; v?: number }>({ key: 'c', fallback: [] }, storage);

    expect(repo.prepend({ id: 'b', v: 2 }).map((i) => i.id)).toEqual(['b', 'a']);
    expect(repo.update('a', { v: 9 }).find((i) => i.id === 'a')?.v).toBe(9);
    expect(repo.findById('a')?.v).toBe(9);
    expect(repo.remove('a').map((i) => i.id)).toEqual(['b']);
    expect(repo.findById('ghost')).toBeNull();
  });

  it('update لمعرّف غير موجود لا يكتب شيئاً', () => {
    const { storage, data } = memoryStorage({ c: JSON.stringify([{ id: 'a', v: 1 }]) });
    const repo = createCollectionRepository<{ id?: string; v?: number }>({ key: 'c', fallback: [] }, storage);
    const before = data.c;
    repo.update('ghost', { v: 5 });
    expect(data.c).toBe(before);
  });

  it('فشل التخزين عند الكتابة لا يرمي', () => {
    const storage: SchemaStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('ممتلئ');
      },
    };
    const repo = createCollectionRepository<{ id: string }>({ key: 'c', fallback: [] }, storage);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => repo.write([{ id: 'a' }])).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('مستودع الكائن المفرد', () => {
  const defaults = { a: 1, b: 'افتراضي', c: true };

  it('غياب المفتاح يعيد الافتراضي كاملاً', () => {
    const { storage } = memoryStorage();
    expect(createObjectRepository({ key: 'k', defaults }, storage).read()).toEqual(defaults);
  });

  it('الكائن المحفوظ يُدمج فوق الافتراضي (لا فقدان حقول جديدة بعد الترقية)', () => {
    const { storage } = memoryStorage({ k: JSON.stringify({ b: 'محفوظ', قديم: 7 }) });
    const value = createObjectRepository<Record<string, unknown>>({ key: 'k', defaults }, storage).read();
    expect(value).toEqual({ a: 1, b: 'محفوظ', c: true, قديم: 7 });
  });

  it('الملف التالف أو غير الكائن يعيد الافتراضي بلا انهيار', () => {
    const { storage } = memoryStorage({ x: 'تالف', y: '[1,2]', z: 'null' });
    for (const key of ['x', 'y', 'z']) {
      expect(createObjectRepository({ key, defaults }, storage).read()).toEqual(defaults);
    }
  });

  it('noMerge يستبدل الافتراضي بدل دمجه', () => {
    const { storage } = memoryStorage({ k: JSON.stringify({ b: 'محفوظ' }) });
    const value = createObjectRepository<Record<string, unknown>>(
      { key: 'k', defaults, noMerge: true },
      storage
    ).read();
    expect(value).toEqual({ b: 'محفوظ' });
  });

  it('patch يعدّل حقلاً فوق المحفوظ ويحفظ الناتج', () => {
    const { storage, data } = memoryStorage({ k: JSON.stringify({ b: 'محفوظ' }) });
    const repo = createObjectRepository<Record<string, unknown>>({ key: 'k', defaults }, storage);
    const next = repo.patch({ c: false });
    expect(next).toEqual({ a: 1, b: 'محفوظ', c: false });
    expect(JSON.parse(data.k)).toEqual({ a: 1, b: 'محفوظ', c: false });
  });

  it('clear يعيد الافتراضي في القراءة التالية', () => {
    const { storage } = memoryStorage({ k: JSON.stringify({ b: 'محفوظ' }) });
    const repo = createObjectRepository({ key: 'k', defaults }, storage);
    repo.clear();
    expect(repo.read()).toEqual(defaults);
  });

  it('فشل التخزين لا يرمي استثناءً', () => {
    const storage: SchemaStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => undefined,
    };
    const repo = createObjectRepository({ key: 'k', defaults }, storage);
    expect(() => repo.write(defaults)).not.toThrow();
  });
});

describe('المفاتيح القديمة والتحقّق (R37)', () => {
  it('مجموعة: المفتاح القديم يُقرأ عند غياب الحالي', () => {
    const { storage } = memoryStorage({ 'old-k': JSON.stringify([{ id: 'a' }]) });
    const repo = createCollectionRepository({ key: 'new-k', fallback: [], legacyKeys: ['old-k'] }, storage);
    expect(repo.read()).toEqual([{ id: 'a' }]);
  });

  it('مجموعة: المفتاح الحالي يتقدّم على القديم، والكتابة لا تلمس القديم', () => {
    const { storage, data } = memoryStorage({
      'new-k': JSON.stringify([{ id: 'new' }]),
      'old-k': JSON.stringify([{ id: 'old' }]),
    });
    const repo = createCollectionRepository({ key: 'new-k', fallback: [], legacyKeys: ['old-k'] }, storage);
    expect(repo.read()[0].id).toBe('new');
    repo.write([{ id: 'x' }]);
    expect(JSON.parse(data['old-k'])[0].id).toBe('old');
  });

  it('مجموعة: fallbackOnEmpty لا يتخطى المفتاح الحالي لصالح القديم', () => {
    const { storage } = memoryStorage({
      'new-k': '[]',
      'old-k': JSON.stringify([{ id: 'old' }]),
    });
    const repo = createCollectionRepository(
      { key: 'new-k', fallback: [{ id: 'seed' }], fallbackOnEmpty: true, legacyKeys: ['old-k'] },
      storage
    );
    expect(repo.read()).toEqual([{ id: 'seed' }]);
  });

  it('كائن: legacyKeys و isValid معاً (عدّاد تسلسل ناقص ⇒ الافتراضي)', () => {
    const defaults = { IN: 4, OUT: 299 };
    const isValid = (v: Record<string, unknown>) => typeof v.IN === 'number' && typeof v.OUT === 'number';
    const { storage } = memoryStorage({ 'legacy-seq': JSON.stringify({ IN: 7, OUT: 8 }) });
    const legacy = createObjectRepository(
      { key: 'seq', defaults, noMerge: true, isValid, legacyKeys: ['legacy-seq'] },
      storage
    );
    expect(legacy.read()).toEqual({ IN: 7, OUT: 8 });

    const { storage: partial } = memoryStorage({ seq: JSON.stringify({ IN: 50 }) });
    const repo = createObjectRepository({ key: 'seq', defaults, noMerge: true, isValid }, partial);
    expect(repo.read()).toEqual(defaults);
  });
});

describe('مستودع القيمة النصية', () => {
  it('يكتب النص خاماً بلا JSON (لا علامات تنصيص)', () => {
    const { storage, data } = memoryStorage();
    createValueRepository({ key: 'k' }, storage).write('2026-11-07');
    expect(data.k).toBe('2026-11-07');
  });

  it('يقرأ النص المخزَّن ويعيد البديل عند الغياب', () => {
    const { storage } = memoryStorage({ k: 'granted' });
    expect(createValueRepository({ key: 'k', fallback: 'unknown' }, storage).read()).toBe('granted');
    expect(createValueRepository({ key: 'missing', fallback: 'unknown' }, storage).read()).toBe('unknown');
    expect(createValueRepository({ key: 'missing' }, storage).readRaw()).toBeNull();
  });

  it('isValid يرفض القيمة غير المقبولة فتُعامَل كغائبة', () => {
    const { storage } = memoryStorage({ k: 'مريب' });
    const repo = createValueRepository({ key: 'k', fallback: 'unknown', isValid: (raw) => raw === 'granted' }, storage);
    expect(repo.read()).toBe('unknown');
    expect(repo.readRaw()).toBeNull();
  });

  it('يقرأ المفتاح القديم عند غياب الحالي ولا يتقدّم عليه', () => {
    const { storage } = memoryStorage({ old: 'قيمة-قديمة' });
    expect(createValueRepository({ key: 'new', legacyKeys: ['old'] }, storage).read()).toBe('قيمة-قديمة');
    const { storage: both } = memoryStorage({ new: 'حديثة', old: 'قيمة-قديمة' });
    expect(createValueRepository({ key: 'new', legacyKeys: ['old'] }, both).read()).toBe('حديثة');
  });

  it('clear يمسح المفتاح، وفشل التخزين لا يرمي', () => {
    const { storage, data } = memoryStorage({ k: 'x' });
    const repo = createValueRepository({ key: 'k' }, storage);
    repo.clear();
    expect('k' in data).toBe(false);
    expect(repo.read()).toBe('');

    const failing: SchemaStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('quota');
      },
    };
    const broken = createValueRepository({ key: 'k' }, failing);
    expect(() => broken.write('y')).not.toThrow();
    expect(() => broken.clear()).not.toThrow();
  });
});
