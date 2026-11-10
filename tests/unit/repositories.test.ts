/**
 * اختبارات وحدة لطبقة المستودعات كاملة (R48).
 *
 * لماذا؟ لأن هذه الطبقة كانت **خارج مقام التغطية** كلها (عدا `CollectionRepository`):
 * 10 ملفات · 958 سطراً · يحملها كل حفظ وقراءة في التطبيق. إدخالها في المقام بلا اختبارات
 * أنزل النسبة من 98.54% إلى **79.6%** — أي أن الطبقة الأكثر استخداماً كانت الأقل قياساً.
 *
 * هنا تُقاس ثلاث طبقات:
 *   1) `BaseRepository` — التجريد الذي يورثه 14 مستودعاً (CRUD · بذر عند القراءة · subId).
 *   2) `ObjectRepository` / `ValueRepository` — عقد الكائن المفرد والنص الخام (الدمج · التحقّق · المفاتيح القديمة).
 *   3) مستودعات النطاق — سلوكها الحقيقي: التزامات · زيارات · قوائم · أصناف · مهام (والأثر التدقيقي).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IStorageEngine } from '../../src/database/types/StorageEngine';
import { BaseRepository, type Identifiable } from '../../src/database/repositories/BaseRepository';
import { createObjectRepository } from '../../src/database/repositories/ObjectRepository';
import { createCollectionRepository } from '../../src/database/repositories/CollectionRepository';
import { createValueRepository } from '../../src/database/repositories/ValueRepository';
import { debtRepository } from '../../src/database/repositories/DebtRepository';
import { customerRepository, doctorRepository } from '../../src/database/repositories/CustomerRepository';
import { financialRepository } from '../../src/database/repositories/FinancialRepository';
import { productRepository, stockMovementRepository } from '../../src/database/repositories/ProductRepository';
import {
  suiteTaskRepository,
  commitmentRepository,
  workTaskRepository,
  workProjectRepository,
} from '../../src/database/repositories/WorkTaskRepository';
import {
  custodyRepository,
  linksRepository,
  notesRepository,
  routinesRepository,
} from '../../src/database/repositories/OtherRepositories';
import { auditService } from '../../src/core/audit/AuditService';
import { dbStorage } from '../../src/database/dbStorage';
import type { SchemaStorage } from '../../src/database/schema/types';

/** محرّك تخزين في الذاكرة — لا IndexedDB ولا localStorage. */
function memoryEngine(initial: Record<string, string> = {}) {
  const data: Record<string, string> = { ...initial };
  const engine: IStorageEngine = {
    getItem: async <T = unknown>(key: string): Promise<T | null> => (key in data ? (JSON.parse(data[key]) as T) : null),
    getItemSync: (key) => (key in data ? (JSON.parse(data[key]) as never) : null),
    setItem: async (key, value) => {
      data[key] = JSON.stringify(value);
    },
    setItemSync: (key, value) => {
      data[key] = JSON.stringify(value);
    },
    removeItem: async (key) => {
      delete data[key];
    },
    removeItemSync: (key) => {
      delete data[key];
    },
    clear: async () => {},
    clearSync: () => {},
    hasKey: (key) => key in data,
    getAllKeys: () => Object.keys(data),
  };
  return { engine, data };
}

/** تخزين `SchemaStorage` في الذاكرة (للمستودعات العامة). */
function memorySchemaStorage(initial: Record<string, string> = {}) {
  const data: Record<string, string> = { ...initial };
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

type Row = Identifiable & { name?: string; status?: string };

describe('BaseRepository — التجريد الموروث', () => {
  beforeEach(() => {
    /* محرّك مستقلّ لكل اختبار */
  });

  it('القراءة الأولى من مفتاح غائب تزرع الافتراضي وتُعيد نسخة منه', () => {
    const defaults: Row[] = [{ id: 'a', name: 'أ' }];
    const { engine, data } = memoryEngine();
    const repo = new BaseRepository<Row>('k', defaults, engine);

    const items = repo.getAll();
    expect(items).toEqual(defaults);
    expect(items).not.toBe(defaults);
    items.push({ id: 'x' });
    expect(defaults).toHaveLength(1);
    expect(data.k).toBe(JSON.stringify(defaults));
  });

  it('قيمة مخزَّنة غير مصفوفية تُعامَل كغياب (إعادة زرع)', () => {
    const { engine, data } = memoryEngine({ k: '"نص"' });
    const repo = new BaseRepository<Row>('k', [{ id: 'a' }], engine);
    expect(repo.getAll()).toEqual([{ id: 'a' }]);
    expect(data.k).toBe(JSON.stringify([{ id: 'a' }]));
  });

  it('getById يطابق id أو subId، والغائب null', () => {
    const { engine } = memoryEngine({
      k: JSON.stringify([{ id: 'a' }, { subId: 's-1' }]),
    });
    const repo = new BaseRepository<Row>('k', [], engine);
    expect(repo.getById('a')).toEqual({ id: 'a' });
    expect(repo.getById('s-1')).toEqual({ subId: 's-1' });
    expect(repo.getById('ghost')).toBeNull();
  });

  it('find و findOne يرشّحان على البيانات الحقيقية', () => {
    const { engine } = memoryEngine({
      k: JSON.stringify([
        { id: 'a', status: 'open' },
        { id: 'b', status: 'done' },
      ]),
    });
    const repo = new BaseRepository<Row>('k', [], engine);
    expect(repo.find((r) => r.status === 'open').map((r) => r.id)).toEqual(['a']);
    expect(repo.findOne((r) => r.status === 'done')?.id).toBe('b');
    expect(repo.findOne(() => false)).toBeNull();
  });

  it('add يضيف في المقدمة ويُرجع العنصر', () => {
    const { engine } = memoryEngine({ k: JSON.stringify([{ id: 'a' }]) });
    const repo = new BaseRepository<Row>('k', [], engine);
    expect(repo.add({ id: 'b' })).toEqual({ id: 'b' });
    expect(repo.getAll().map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('update يدمج جزئياً ويحفظ، والمعرّف المجهول لا يكتب شيئاً', () => {
    const { engine, data } = memoryEngine({ k: JSON.stringify([{ id: 'a', name: 'قديم', status: 'x' }]) });
    const repo = new BaseRepository<Row>('k', [], engine);

    expect(repo.update('a', { name: 'جديد' })).toEqual({ id: 'a', name: 'جديد', status: 'x' });
    expect(JSON.parse(data.k)[0].name).toBe('جديد');

    const before = data.k;
    expect(repo.update('ghost', { name: 'لا' })).toBeNull();
    expect(data.k).toBe(before);
  });

  it('upsert: موجود ⇒ دمج · جديد ⇒ إضافة · بلا معرّف ⇒ إضافة', () => {
    const { engine } = memoryEngine({ k: JSON.stringify([{ id: 'a', name: 'أ' }]) });
    const repo = new BaseRepository<Row>('k', [], engine);

    expect(repo.upsert({ id: 'a', name: 'محدَّث' })).toEqual({ id: 'a', name: 'محدَّث' });
    expect(repo.getAll()).toHaveLength(1);

    expect(repo.upsert({ id: 'b', name: 'ب' })).toEqual({ id: 'b', name: 'ب' });
    expect(repo.getAll()).toHaveLength(2);

    expect(repo.upsert({ name: 'بلا معرّف' })).toEqual({ name: 'بلا معرّف' });
    expect(repo.getAll()).toHaveLength(3);
  });

  it('upsert يعرف السجلّ بـsubId وحده فلا يُكرّره', () => {
    const { engine } = memoryEngine({ k: JSON.stringify([{ subId: 's-1', name: 'قديم' }]) });
    const repo = new BaseRepository<Row>('k', [], engine);

    expect(repo.upsert({ subId: 's-1', name: 'جديد' })).toEqual({ subId: 's-1', name: 'جديد' });
    expect(repo.getAll()).toHaveLength(1);
    expect(repo.getAll()[0].name).toBe('جديد');
  });

  it('upsert يطابق subId أيضاً', () => {
    const { engine } = memoryEngine({ k: JSON.stringify([{ id: 'a', subId: 's' }]) });
    const repo = new BaseRepository<Row>('k', [], engine);
    expect(repo.upsert({ id: 'a', subId: 's', name: 'م' })).toEqual({ id: 'a', subId: 's', name: 'م' });
    expect(repo.getAll()).toHaveLength(1);
  });

  it('delete يزيل ويرجع true، والمجهول false بلا كتابة', () => {
    const { engine, data } = memoryEngine({ k: JSON.stringify([{ id: 'a' }, { id: 'b' }]) });
    const repo = new BaseRepository<Row>('k', [], engine);

    expect(repo.delete('a')).toBe(true);
    expect(repo.getAll().map((r) => r.id)).toEqual(['b']);

    const before = data.k;
    expect(repo.delete('ghost')).toBe(false);
    expect(data.k).toBe(before);
  });

  it('delete يطابق subId', () => {
    const { engine } = memoryEngine({ k: JSON.stringify([{ subId: 's-1' }, { id: 'b' }]) });
    const repo = new BaseRepository<Row>('k', [], engine);
    expect(repo.delete('s-1')).toBe(true);
    expect(repo.getAll()).toHaveLength(1);
  });

  it('bulkDelete يعدّ المحذوف فعلاً ولا يكتب عند صفر', () => {
    const { engine, data } = memoryEngine({
      k: JSON.stringify([{ id: 'a' }, { id: 'b' }, { subId: 's-1' }]),
    });
    const repo = new BaseRepository<Row>('k', [], engine);

    expect(repo.bulkDelete(['a', 's-1', 'ghost'])).toBe(2);
    expect(repo.getAll()).toHaveLength(1);

    const before = data.k;
    expect(repo.bulkDelete(['ghost'])).toBe(0);
    expect(data.k).toBe(before);
  });

  it('count و clear و resetToDefault', () => {
    const { engine } = memoryEngine({ k: JSON.stringify([{ id: 'a' }, { id: 'b' }]) });
    const repo = new BaseRepository<Row>('k', [{ id: 'seed' }], engine);

    expect(repo.count()).toBe(2);
    repo.clear();
    expect(repo.getAll()).toEqual([]);
    repo.resetToDefault();
    expect(repo.getAll()).toEqual([{ id: 'seed' }]);
  });

  it('الأسماء غير المتزامنة تُغلِّف المتزامنة', async () => {
    const { engine } = memoryEngine({ k: JSON.stringify([{ id: 'a' }]) });
    const repo = new BaseRepository<Row>('k', [], engine);

    await expect(repo.getAllAsync()).resolves.toEqual([{ id: 'a' }]);
    await expect(repo.saveAllAsync([{ id: 'z' }])).resolves.toBeUndefined();
    expect(repo.getAll().map((r) => r.id)).toEqual(['z']);
  });

  it('saveAll يستبدل المجموعة كاملة', () => {
    const { engine } = memoryEngine();
    const repo = new BaseRepository<Row>('k', [], engine);
    repo.saveAll([{ id: 'a' }, { id: 'b' }]);
    expect(repo.getAll()).toHaveLength(2);
  });
});

describe('ObjectRepository — الكائن المفرد', () => {
  it('الغياب ⇒ الافتراضي (نسخة لا مرجع)', () => {
    const defaults = { a: 1, b: { c: 2 } };
    const { storage } = memorySchemaStorage();
    const repo = createObjectRepository({ key: 'k', defaults }, storage);

    const value = repo.read();
    expect(value).toEqual(defaults);
    expect(value).not.toBe(defaults);
  });

  it('الدمج: المحفوظ فوق الافتراضي (حقول جديدة لا تُفقد)', () => {
    const { storage } = memorySchemaStorage({ k: '{"a":9}' });
    const repo = createObjectRepository({ key: 'k', defaults: { a: 1, b: 2 } }, storage);
    expect(repo.read()).toEqual({ a: 9, b: 2 });
  });

  it('noMerge يعطي المحفوظ كما هو', () => {
    const { storage } = memorySchemaStorage({ k: '{"a":9}' });
    const repo = createObjectRepository({ key: 'k', defaults: { a: 1, b: 2 }, noMerge: true }, storage);
    expect(repo.read()).toEqual({ a: 9 });
  });

  it('isValid الفاشل ⇒ الافتراضي كاملاً (لا دمج جزئي)', () => {
    const { storage } = memorySchemaStorage({ k: '{"a":9}' });
    const repo = createObjectRepository(
      { key: 'k', defaults: { a: 1, b: 2 }, isValid: (v) => typeof v.b === 'number' },
      storage
    );
    expect(repo.read()).toEqual({ a: 1, b: 2 });
  });

  it('التالف أو غير الكائن ⇒ الافتراضي', () => {
    const { storage } = memorySchemaStorage({ k: '{تالف' });
    expect(createObjectRepository({ key: 'k', defaults: { a: 1 } }, storage).read()).toEqual({ a: 1 });

    const { storage: s2 } = memorySchemaStorage({ k: '[1,2]' });
    expect(createObjectRepository({ key: 'k', defaults: { a: 1 } }, s2).read()).toEqual({ a: 1 });

    const { storage: s3 } = memorySchemaStorage({ k: 'null' });
    expect(createObjectRepository({ key: 'k', defaults: { a: 1 } }, s3).read()).toEqual({ a: 1 });
  });

  it('المفاتيح القديمة تُقرأ عند غياب الحالي، والحالي الفارغ يُعتبر غياباً', () => {
    const { storage } = memorySchemaStorage({ old: '{"a":5}' });
    const repo = createObjectRepository({ key: 'k', defaults: { a: 1 }, legacyKeys: ['old'] }, storage);
    expect(repo.read()).toEqual({ a: 5 });

    const { storage: s2 } = memorySchemaStorage({ k: '', old: '{"a":7}' });
    const repo2 = createObjectRepository({ key: 'k', defaults: { a: 1 }, legacyKeys: ['old'] }, s2);
    expect(repo2.read()).toEqual({ a: 7 });
  });

  it('write و patch و clear', () => {
    const { storage, data } = memorySchemaStorage();
    const repo = createObjectRepository({ key: 'k', defaults: { a: 1, b: 2 } }, storage);

    expect(repo.key).toBe('k');
    repo.write({ a: 5, b: 6 });
    expect(JSON.parse(data.k)).toEqual({ a: 5, b: 6 });

    expect(repo.patch({ b: 9 })).toEqual({ a: 5, b: 9 });
    expect(JSON.parse(data.k)).toEqual({ a: 5, b: 9 });

    repo.clear();
    expect(data.k).toBeUndefined();
    expect(repo.read()).toEqual({ a: 1, b: 2 });
  });

  it('فشل الحفظ لا يرمي، وفشل المسح يكتب الافتراضي', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const failingSet: SchemaStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => undefined,
    };
    const repo = createObjectRepository({ key: 'k', defaults: { a: 1 } }, failingSet);
    expect(() => repo.write({ a: 2 })).not.toThrow();
    expect(warn).toHaveBeenCalled();

    const data: Record<string, string> = {};
    const failingRemove: SchemaStorage = {
      getItem: (k) => data[k] ?? null,
      setItem: (k, v) => {
        data[k] = v;
      },
      removeItem: () => {
        throw new Error('locked');
      },
    };
    const repo2 = createObjectRepository({ key: 'k', defaults: { a: 1 } }, failingRemove);
    expect(() => repo2.clear()).not.toThrow();
    expect(JSON.parse(data.k)).toEqual({ a: 1 });
    warn.mockRestore();
  });
});

describe('ValueRepository — النص الخام', () => {
  it('يكتب النص كما هو (بلا JSON) ويقرأه', () => {
    const { storage, data } = memorySchemaStorage();
    const repo = createValueRepository({ key: 'k' }, storage);

    repo.write('2026-11-07');
    expect(data.k).toBe('2026-11-07');
    expect(repo.readRaw()).toBe('2026-11-07');
    expect(repo.read()).toBe('2026-11-07');
  });

  it('الغياب ⇒ readRaw=null و read=fallback', () => {
    const { storage } = memorySchemaStorage();
    const repo = createValueRepository({ key: 'k', fallback: 'غير معروف' }, storage);
    expect(repo.readRaw()).toBeNull();
    expect(repo.read()).toBe('غير معروف');
  });

  it('fallback الافتراضي نص فارغ', () => {
    expect(createValueRepository({ key: 'k' }, memorySchemaStorage().storage).read()).toBe('');
  });

  it('isValid يرفض ⇒ يُعتبر غائباً', () => {
    const { storage } = memorySchemaStorage({ k: 'قديم' });
    const repo = createValueRepository({ key: 'k', fallback: 'بديل', isValid: (r) => r === 'granted' }, storage);
    expect(repo.readRaw()).toBeNull();
    expect(repo.read()).toBe('بديل');
  });

  it('المفتاح القديم يُقرأ عند غياب الحالي فقط', () => {
    const { storage } = memorySchemaStorage({ old: 'قديم-قيمة' });
    const repo = createValueRepository({ key: 'k', legacyKeys: ['old', 'older'] }, storage);
    expect(repo.read()).toBe('قديم-قيمة');

    const { storage: s2 } = memorySchemaStorage({ k: 'حالي', old: 'قديم' });
    expect(createValueRepository({ key: 'k', legacyKeys: ['old'] }, s2).read()).toBe('حالي');
  });

  it('فشل القراءة يعطي null، وفشل الحفظ/المسح لا يرمي', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const broken: SchemaStorage = {
      getItem: () => {
        throw new Error('read');
      },
      setItem: () => {
        throw new Error('write');
      },
      removeItem: () => {
        throw new Error('remove');
      },
    };
    const repo = createValueRepository({ key: 'k', fallback: 'ب' }, broken);
    expect(repo.readRaw()).toBeNull();
    expect(repo.read()).toBe('ب');
    expect(() => repo.write('x')).not.toThrow();
    expect(() => repo.clear()).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('clear يمسح المفتاح', () => {
    const { storage, data } = memorySchemaStorage({ k: 'x' });
    createValueRepository({ key: 'k' }, storage).clear();
    expect(data.k).toBeUndefined();
  });
});

/* ───────────────────────── مستودعات النطاق ───────────────────────── */

const CLEARED_KEYS = [
  'suite_debts_records_v1',
  'suite_debts_commitments_v1',
  'suite_customers_items_v2',
  'suite_customers_visits_v2',
  'suite_doctors_items_v1',
  'suite_doctors_visits_v1',
  'suite_fin_transactions_v2',
  'suite_fin_paymentMethods_v2',
  'suite_stock_products_v2',
  'suite_stock_records_v2',
  'suite_tasks_tasks_v2',
  'suite_tasks_commitments_v2',
  'workos_v1_tasks',
  'workos_v1_projects',
  'suite_custody_records_v1',
  'suite_links_records_v1',
  'suite_knowledge_notes_v1',
  'suite_routines_items_v1',
];

beforeEach(() => {
  for (const key of CLEARED_KEYS) dbStorage.removeItem(key);
  auditService.clearLogs();
});

describe('مستودع الديون — الالتزامات والسداد', () => {
  it('الالتزامات: الافتراضي عند الغياب ثم الكتابة والقراءة', () => {
    expect(debtRepository.getCommitments().length).toBeGreaterThan(0);
    debtRepository.saveCommitments([{ id: 'cm-1', name: 'اختبار' } as never]);
    expect(debtRepository.getCommitments()).toEqual([{ id: 'cm-1', name: 'اختبار' }]);
  });

  it('addCommitment يضيف في المقدمة ويكتب تدقيقاً', () => {
    debtRepository.saveCommitments([]);
    debtRepository.addCommitment({ id: 'cm-9', name: 'التزام', amount: 100, currency: 'YER' } as never);

    expect(debtRepository.getCommitments()[0].id).toBe('cm-9');
    const logs = auditService.getLogsByEntity('DebtCommitment');
    expect(logs).toHaveLength(1);
    expect(logs[0].recordId).toBe('cm-9');
    expect(logs[0].details).toContain('100');
  });

  it('recordPayment يراكم السداد ويُعلّم الاكتمال عند بلوغ أصل الدين', () => {
    debtRepository.saveAll([{ id: 'd-1', name: 'أحمد', debit: 100, credit: 0, note: '' } as never]);

    const partial = debtRepository.recordPayment('d-1', 40, '2026-11-07');
    expect(partial?.credit).toBe(40);
    expect(partial?.isCompleted).toBe(false);
    expect(partial?.note).toContain('تم سداد 40');

    const full = debtRepository.recordPayment('d-1', 60, '2026-11-08');
    expect(full?.credit).toBe(100);
    expect(full?.isCompleted).toBe(true);
    expect(full?.note).toContain('| تم سداد 60');

    expect(auditService.getLogsByEntity('DebtRecord').filter((l) => l.action === 'Debt Settlement')).toHaveLength(2);
  });

  it('recordPayment لدين غير موجود ⇒ null بلا كتابة', () => {
    expect(debtRepository.recordPayment('ghost', 10, '2026-11-07')).toBeNull();
  });
});

describe('مستودع العملاء والأطباء — الزيارات', () => {
  it('زيارات العملاء: افتراضي عند الغياب ثم إضافة في المقدمة', () => {
    expect(customerRepository.getVisits().length).toBeGreaterThan(0);
    customerRepository.saveVisits([]);
    customerRepository.addVisit({
      id: 'v-1',
      customerId: 'c-1',
      customerName: 'عميل',
      date: '2026-11-07',
    } as never);

    expect(customerRepository.getVisits()[0].id).toBe('v-1');
    expect(auditService.getLogsByEntity('CustomerVisit')[0].recordId).toBe('v-1');
  });

  it('addVisit يحدّث lastVisitDate للعميل المطابق', () => {
    customerRepository.saveAll([{ id: 'c-1', name: 'عميل' } as never]);
    customerRepository.addVisit({ id: 'v-2', customerId: 'c-1', customerName: 'عميل', date: '2026-11-05' } as never);
    expect(customerRepository.getById('c-1')?.lastVisitDate).toBe('2026-11-05');
  });

  it('زيارات الأطباء: نفس العقد', () => {
    doctorRepository.saveVisits([]);
    doctorRepository.addVisit({ id: 'dv-1', doctorId: 'd-1', doctorName: 'د.', date: '2026-11-06' } as never);
    expect(doctorRepository.getVisits()[0].id).toBe('dv-1');
    expect(auditService.getLogsByEntity('DoctorVisit')).toHaveLength(1);
  });
});

describe('المستودع المالي — القيود والعكس والقوائم', () => {
  it('add يسجّل قبضاً أو صرفاً بحسب القيد', () => {
    financialRepository.saveAll([]);
    financialRepository.add({
      id: 'f-1',
      restriction: 'قبض',
      movement: 'بيع',
      accountName: 'صندوق',
      amountYER: 500,
      number: '100',
      description: '',
      date: '2026-11-07',
    } as never);
    expect(auditService.getLogsByEntity('FinancialTransaction')[0].action).toBe('Receipt');

    financialRepository.add({
      id: 'f-2',
      restriction: 'صرف',
      movement: 'شراء',
      accountName: 'مورد',
      amountSAR: 20,
      description: '',
      date: '2026-11-07',
    } as never);
    expect(auditService.getLogsByEntity('FinancialTransaction')[0].action).toBe('Payment');
  });

  it('reverseTransaction يُنشئ قيداً عكسياً بمبالغ سالبة ورقم REV', () => {
    financialRepository.saveAll([
      {
        id: 'f-1',
        number: '100',
        amountYER: 500,
        amountSAR: 0,
        amountUSD: 0,
        description: 'أصل',
        restriction: 'قبض',
      } as never,
    ]);

    const result = financialRepository.reverseTransaction('f-1', 'خطأ إدخال');
    expect(result).not.toBeNull();
    expect(result?.reversal.amountYER).toBe(-500);
    expect(result?.reversal.number).toBe('REV-100');
    expect(result?.reversal.description).toContain('خطأ إدخال');

    const logs = auditService
      .getLogsByEntity('FinancialTransaction')
      .filter((l) => l.action === 'Financial Correction');
    expect(logs).toHaveLength(1);
  });

  it('reverseTransaction لقيد غير موجود ⇒ null', () => {
    expect(financialRepository.reverseTransaction('ghost', 'سبب')).toBeNull();
  });

  it('القوائم المنسدلة: الزرع عند الغياب والكتابة والاستقلال', () => {
    expect(financialRepository.getDropdown('paymentMethods', ['نقد'])).toEqual(['نقد']);
    expect(dbStorage.getItem('suite_fin_paymentMethods_v2')).toBe(JSON.stringify(['نقد']));

    financialRepository.saveDropdown('paymentMethods', ['نقد', 'شبكة']);
    expect(financialRepository.getDropdown('paymentMethods', [])).toEqual(['نقد', 'شبكة']);

    financialRepository.saveDropdown('banks', ['بنك']);
    expect(financialRepository.getDropdown('banks', [])).toEqual(['بنك']);
    expect(financialRepository.getDropdown('paymentMethods', [])).toHaveLength(2);
  });
});

describe('مستودع المخزون — الأصناف والحركات', () => {
  it('findByName بلا حساسية لحالة الأحرف أو المسافات', () => {
    productRepository.saveAll([{ id: 'p-1', name: ' كريم مرطب ', isActive: true } as never]);
    expect(productRepository.findByName('كريم مرطب')?.id).toBe('p-1');
    expect(productRepository.findByName('كريم')?.id).toBeUndefined();
  });

  it('getActiveProducts يُرجع النشط فقط', () => {
    productRepository.saveAll([
      { id: 'p-1', name: 'أ', isActive: true },
      { id: 'p-2', name: 'ب', isActive: false },
    ] as never);
    expect(productRepository.getActiveProducts().map((p) => p.id)).toEqual(['p-1']);
  });

  it('add/update/delete يكتب ثلاثة أسطر تدقيق بالكيان Product', () => {
    productRepository.saveAll([]);
    productRepository.add({ id: 'p-9', name: 'صنف جديد', isActive: true } as never);
    productRepository.update('p-9', { name: 'صنف محدَّث' });
    productRepository.delete('p-9');

    const logs = auditService.getLogsByEntity('Product');
    expect(logs.map((l) => l.action)).toEqual(['Delete', 'Update', 'Create']);
    expect(logs[0].details).toContain('صنف محدَّث');
  });

  it('تحديث/حذف صنف غير موجود لا يكتب تدقيقاً', () => {
    productRepository.saveAll([]);
    productRepository.update('ghost', { name: 'لا' });
    productRepository.delete('ghost');
    expect(auditService.getLogsByEntity('Product')).toHaveLength(0);
  });

  it('إضافة حركة تُسجَّل كتسوية مخزون بالـsubId', () => {
    stockMovementRepository.add({ id: 'm-1', subId: 'MV-1', beneficiary: 'عميل', movementType: 'توريد' } as never);
    const logs = auditService.getLogsByEntity('StockMovement');
    expect(logs[0]).toMatchObject({ action: 'Inventory Adjustment', recordId: 'MV-1' });
  });

  it('البحث بالـsubId والتحديث به والحذف به', () => {
    stockMovementRepository.saveAll([{ id: 'm-1', subId: 'MV-1', beneficiary: 'عميل' } as never]);
    expect(stockMovementRepository.findBySubId('MV-1')?.id).toBe('m-1');

    stockMovementRepository.update('MV-1', { beneficiary: 'عميل آخر' });
    expect(stockMovementRepository.getById('m-1')?.beneficiary).toBe('عميل آخر');

    stockMovementRepository.delete('MV-1');
    expect(stockMovementRepository.getAll()).toHaveLength(0);
    expect(auditService.getLogsByEntity('StockMovement').map((l) => l.action)).toEqual(['Delete', 'Update']);
  });
});

describe('مستودعات المهام (Work OS والكلاسيكية)', () => {
  it('مهمة كلاسيكية: add يكتب تدقيق Task', () => {
    suiteTaskRepository.saveAll([]);
    suiteTaskRepository.add({ id: 'T-1', title: 'مهمة' } as never);
    expect(auditService.getLogsByEntity('Task')[0].recordId).toBe('T-1');
  });

  it('التزام: add يكتب تدقيق Commitment', () => {
    commitmentRepository.saveAll([]);
    commitmentRepository.add({ id: 'C-1', name: 'التزام' } as never);
    expect(auditService.getLogsByEntity('Commitment')[0].details).toContain('التزام');
  });

  it('مهمة Work OS: add/update/delete بثلاثة أسطر، والمشروع بسطر إنشاء', () => {
    workTaskRepository.saveAll([]);
    workTaskRepository.add({ id: 'W-1', title: 'مهمة', taskNumber: 'TSK-1' } as never);
    workTaskRepository.update('W-1', { title: 'مهمة محدَّثة' });
    workTaskRepository.delete('W-1');

    expect(auditService.getLogsByEntity('WorkTask').map((l) => l.action)).toEqual(['Delete', 'Update', 'Create']);

    workProjectRepository.saveAll([]);
    workProjectRepository.add({ id: 'P-1', name: 'مشروع', code: 'PRJ' } as never);
    expect(auditService.getLogsByEntity('WorkProject')).toHaveLength(1);
  });

  it('تحديث/حذف مهمة غير موجودة لا يكتب تدقيقاً', () => {
    workTaskRepository.saveAll([]);
    workTaskRepository.update('ghost', { title: 'لا' });
    workTaskRepository.delete('ghost');
    expect(auditService.getLogsByEntity('WorkTask')).toHaveLength(0);
  });
});

describe('المستودعات المتبقية — مفاتيحها مستقلة', () => {
  it.each([
    ['custody', custodyRepository, 'suite_custody_records_v1'],
    ['links', linksRepository, 'suite_links_records_v1'],
    ['notes', notesRepository, 'suite_knowledge_notes_v1'],
    ['routines', routinesRepository, 'suite_routines_items_v1'],
  ])('%s يقرأ بذرته ويكتب على مفتاحه وحده', (_name, repo, key) => {
    const repoRef = repo as unknown as BaseRepository<Row>;
    expect(Array.isArray(repoRef.getAll())).toBe(true);
    repoRef.saveAll([{ id: `${_name}-1` }]);
    expect(JSON.parse(dbStorage.getItem(key) as string)).toEqual([{ id: `${_name}-1` }]);
    expect(repoRef.count()).toBe(1);
  });
});

/**
 * R49 — الفروع الدفاعية في المستودعات.
 * كل حالة هنا تُغلق ذراعاً محدّدة قِيست على أنها غير مغطّاة (فتح الفروع 91.85%):
 * مفتاح قديم فارغ · مبلغ غائب · سجلّ بلا رقم · حركة بلا معرّف · قيد بلا وصف.
 */
describe('R49 — الفروع الدفاعية للمستودعات', () => {
  it('ObjectRepository: مفتاح قديم موجود لكنه نصّ فارغ ⇒ يُتجاهل ويُكمَل البحث', () => {
    const storage: SchemaStorage = {
      getItem: (k: string) => (k === 'old-empty' ? '' : k === 'old-real' ? '{"b":"من القديم"}' : null),
      setItem: () => undefined,
    };
    const value = createObjectRepository<Record<string, unknown>>(
      { key: 'k', defaults: { a: 1 }, legacyKeys: ['old-empty', 'old-real'] },
      storage
    ).read();
    expect(value).toEqual({ a: 1, b: 'من القديم' });
  });

  it('ValueRepository: مفتاح قديم فارغ لا يُعاد كقيمة صالحة', () => {
    const storage: SchemaStorage = {
      getItem: (k: string) => (k === 'old-empty' ? '' : null),
      setItem: () => undefined,
    };
    const repo = createValueRepository({ key: 'gate', fallback: 'الافتراضي', legacyKeys: ['old-empty'] }, storage);
    expect(repo.readRaw()).toBeNull();
    expect(repo.read()).toBe('الافتراضي');
  });

  it('CollectionRepository: مفتاح قديم فارغ يُتخطّى، و isValidItem يُرشّح العناصر غير الصالحة', () => {
    const storage: SchemaStorage = {
      getItem: (k: string) => {
        if (k === 'old-empty') return '';
        if (k === 'old-real')
          return JSON.stringify([
            { id: 'a', ok: true },
            { id: 'b', ok: false },
          ]);
        return null;
      },
      setItem: () => undefined,
    };
    const repo = createCollectionRepository<{ id: string; ok: boolean }>(
      {
        key: 'k',
        fallback: [],
        legacyKeys: ['old-empty', 'old-real'],
        isValidItem: (item) => (item as { ok?: boolean }).ok === true,
      },
      storage
    );
    expect(repo.read()).toEqual([{ id: 'a', ok: true }]);
  });

  it('DebtRepository: التزام بلا حقل debit يُعتبر صفراً فيُكمَل السداد', () => {
    debtRepository.saveAll([{ id: 'd-zero', credit: 0 } as never]);
    const paid = debtRepository.recordPayment('d-zero', 50, '2026-11-07');
    expect(paid?.isCompleted).toBe(true);
    expect(paid?.credit).toBe(50);
  });

  it('FinancialRepository: قيد بلا أي مبلغ يُسجَّل بمبلغ صفر في التدقيق', () => {
    financialRepository.saveAll([]);
    financialRepository.add({
      id: 'f-zero',
      restriction: 'صرف',
      movement: 'صرف',
      accountName: 'صندوق',
    } as never);
    const log = auditService.getLogsByEntity('FinancialTransaction')[0];
    expect(log.action).toBe('Payment');
    expect(log.details).toContain('بمبلغ 0');
  });

  it('FinancialRepository: عكس قيد بلا رقم وبلا مبالغ وبلا وصف لا يُنتج NaN أو undefined', () => {
    financialRepository.saveAll([{ id: 'f-bare', restriction: 'قبض', movement: 'قبض', accountName: 'عميل' } as never]);
    const result = financialRepository.reverseTransaction('f-bare', 'تصحيح');

    expect(result?.reversal.number).toBe('REV-f-bare');
    expect(result?.reversal.amountYER).toBe(-0);
    expect(result?.reversal.amountSAR).toBe(-0);
    expect(result?.reversal.amountUSD).toBe(-0);
    expect(result?.reversal.description).toContain('للقيد رقم (f-bare)');
    expect(result?.reversal.description).toContain('السبب: تصحيح. الوصف السابق: ');
    expect(result?.reversal.description).not.toContain('undefined');
  });

  it('حركة مخزون: تحديث معرّف مجهول لا يكتب تدقيقاً ولا يرمي، والحذف كذلك', () => {
    stockMovementRepository.saveAll([]);
    expect(stockMovementRepository.update('ghost', { beneficiary: 'لا' })).toBeNull();
    expect(stockMovementRepository.delete('ghost')).toBe(false);
    expect(auditService.getLogsByEntity('StockMovement')).toHaveLength(0);
  });

  it('حركة مخزون: التحديث والحذف بالـsubId وحده يُسجّلان السجلّ القديم للتدقيق', () => {
    stockMovementRepository.saveAll([{ id: 'm-7', subId: 'MV-7', beneficiary: 'قديم' } as never]);

    expect(stockMovementRepository.update('MV-7', { beneficiary: 'جديد' })?.beneficiary).toBe('جديد');
    const [updateLog] = auditService.getLogsByEntity('StockMovement');
    expect(updateLog.action).toBe('Update');
    expect((updateLog.oldValue as { beneficiary?: string } | undefined)?.beneficiary).toBe('قديم');

    expect(stockMovementRepository.delete('MV-7')).toBe(true);
    const [deleteLog] = auditService.getLogsByEntity('StockMovement');
    expect(deleteLog.action).toBe('Delete');
    expect(deleteLog.recordId).toBe('MV-7');
  });

  it('مهمة Work OS بلا taskNumber: سطر الإنشاء ينتهي بقوسين فارغين لا بـundefined', () => {
    workTaskRepository.saveAll([]);
    workTaskRepository.add({ id: 'W-bare', title: 'بلا رقم' } as never);
    expect(auditService.getLogsByEntity('WorkTask')[0].details).toBe('إنشاء مهمة جديدة: بلا رقم ()');
  });
});
