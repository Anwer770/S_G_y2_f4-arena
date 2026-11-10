/**
 * اختبارات وحدة لترحيلات البيانات (R47) — منطق صامت يعمل عند الإقلاع.
 *
 * لماذا؟ لأن كل ترحيل هنا يُعيد كتابة **بيانات المستخدم** بعد أن تمرّ من محرّك الترحيل.
 * خطأ في `ensureIds` أو في قصّ `progress` أو في بذر `title` لا يظهر كخطأ JS، بل كسجل
 * ناقص في الواجهة بعد أسابيع. الاختبارات أدناه تقيس ما يضمنه كل ترحيل لكل مفتاح:
 * مصفوفة كائنات · معرّفات فريدة · حقول نصية غير فارغة · مصفوفات فرعية موجودة · أرقام صالحة.
 */
import { describe, it, expect } from 'vitest';
import { SCHEMA_ENTRIES, SCHEMA_VERSIONS } from '../../src/database/schema/entries';
import type { Migration } from '../../src/database/schema/types';

const ctx = { now: '2026-11-08T00:00:00.000Z' };
const STAMP = Date.parse(ctx.now);

const migrationFor = (key: string): Migration => {
  const found = SCHEMA_ENTRIES.find((e) => e.key === key);
  if (!found) throw new Error(`مفتاح غير مسجَّل: ${key}`);
  return found.migrations[0];
};

const run = (key: string, value: unknown): Record<string, unknown>[] =>
  migrationFor(key)(value, ctx) as Record<string, unknown>[];

describe('سجل المخططات — الشكل العام', () => {
  it('كل مفتاح له إصدار موجب وترحيل 0⇒1', () => {
    expect(SCHEMA_ENTRIES.length).toBeGreaterThan(0);
    for (const item of SCHEMA_ENTRIES) {
      expect(item.version).toBe(1);
      expect(typeof item.migrations[0]).toBe('function');
      expect(SCHEMA_VERSIONS[item.key]).toBe(1);
    }
    expect(Object.keys(SCHEMA_VERSIONS)).toHaveLength(SCHEMA_ENTRIES.length);
  });

  it('المفاتيح فريدة (لا ازدواج يُسقط ترحيلاً بصمت)', () => {
    const keys = SCHEMA_ENTRIES.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('كل ترحيل يرفض غير المصفوفة ويعيد مصفوفة', () => {
    for (const item of SCHEMA_ENTRIES) {
      expect(item.migrations[0](null, ctx)).toEqual([]);
      expect(item.migrations[0]({ a: 1 }, ctx)).toEqual([]);
      expect(item.migrations[0]('نص', ctx)).toEqual([]);
      expect(item.migrations[0](42, ctx)).toEqual([]);
    }
  });

  it('العناصر غير الكائنية تُسقَط والكائنات تبقى (لا null ولا مصفوفات داخلية)', () => {
    for (const item of SCHEMA_ENTRIES) {
      const out = item.migrations[0]([null, 'سلسلة', 7, [], { id: 'x' }], ctx) as unknown[];
      expect(out).toHaveLength(1);
    }
  });
});

describe('المعرّفات — فريدة دائماً', () => {
  it('المعرّف الناقص أو الفارغ يُولَّد بصيغة <prefix>-<n>-<طابع زمني>', () => {
    const out = run('suite_custody_records_v1', [{}, { id: '' }, { id: '   ' }]);
    expect(out.map((i) => i.id)).toEqual([`cus-1-${STAMP}`, `cus-2-${STAMP}`, `cus-3-${STAMP}`]);
  });

  it('المعرّف الصالح يُحفظ، والمكرَّر يُستبدل بمعرّف جديد', () => {
    const out = run('workos_v1_projects', [{ id: 'prj-a' }, { id: 'prj-a' }, { id: ' prj-b ' }]);
    expect(out[0].id).toBe('prj-a');
    expect(out[1].id).toBe(`prj-2-${STAMP}`);
    expect(out[2].id).toBe('prj-b');
    expect(new Set(out.map((i) => i.id)).size).toBe(3);
  });

  it('معرّف غير نصّي (رقم) يُستبدل', () => {
    const out = run('suite_debts_records_v1', [{ id: 123 }]);
    expect(out[0].id).toBe(`rec-1-${STAMP}`);
  });

  it('طابع زمني غير صالح في السياق ⇒ اللاحقة 0 (لا NaN في المعرّف)', () => {
    const found = SCHEMA_ENTRIES.find((e) => e.key === 'suite_debts_records_v1')!;
    const out = found.migrations[0]([{}], { now: 'غير تاريخ' }) as Record<string, unknown>[];
    expect(out[0].id).toBe('rec-1-0');
  });

  it('البادئات مختلفة بحسب النوع', () => {
    expect(run('workos_v1_tasks', [{}])[0].id).toBe(`tsk-1-${STAMP}`);
    expect(run('workos_v1_orders', [{}])[0].id).toBe(`ord-1-${STAMP}`);
    expect(run('workos_v1_commitments', [{}])[0].id).toBe(`cmt-1-${STAMP}`);
    expect(run('workos_v1_notes', [{}])[0].id).toBe(`note-1-${STAMP}`);
    expect(run('suite_links_records_v1', [{}])[0].id).toBe(`lnk-1-${STAMP}`);
    expect(run('suite_tasks_items_v2', [{}])[0].id).toBe(`T-1-${STAMP}`);
    expect(run('workos_v1_projects', [{}])[0].id).toBe(`prj-1-${STAMP}`);
  });
});

describe('المهام (Work OS) — المصفوفات الفرعية والأرقام', () => {
  it('الحقول النصية الفارغة تُبذر، والأرقام غير الصالحة تصير 0', () => {
    const [task] = run('workos_v1_tasks', [{ id: 't1', title: '   ', progress: Number.NaN }]);
    expect(task.title).toBe('مهمة بلا عنوان');
    expect(task.progress).toBe(0);
  });

  it('كل المصفوفات الفرعية موجودة حتى لو غابت', () => {
    const [task] = run('workos_v1_tasks', [{ id: 't1', title: 'مهمة' }]);
    for (const field of ['subtasks', 'checklist', 'comments', 'tags', 'dependencies', 'attachments']) {
      expect(Array.isArray(task[field])).toBe(true);
    }
  });

  it('المصفوفة الفرعية الموجودة لا تُمسح، وغير المصفوفة تُستبدل بـ[ ]', () => {
    const [task] = run('workos_v1_tasks', [{ id: 't1', title: 'م', subtasks: [{ id: 's1' }], tags: 'نص' }]);
    expect(task.subtasks).toEqual([{ id: 's1' }]);
    expect(task.tags).toEqual([]);
  });

  it('التقدّم الرقمي الصالح يُحفظ كما هو', () => {
    expect(run('workos_v1_tasks', [{ id: 't1', title: 'م', progress: 45 }])[0].progress).toBe(45);
  });
});

describe('المشاريع — قصّ التقدّم داخل [0,100]', () => {
  it.each([
    [150, 100],
    [-20, 0],
    [55, 55],
    [0, 0],
    [100, 100],
  ])('التقدّم %s يصبح %s', (input, expected) => {
    expect(run('workos_v1_projects', [{ id: 'p1', name: 'مشروع', progress: input }])[0].progress).toBe(expected);
  });

  it('التقدّم غير الرقمي يصبح 0 والاسم الفارغ يُبذر', () => {
    const [project] = run('workos_v1_projects', [{ id: 'p1', name: '', progress: 'كثير' }]);
    expect(project.progress).toBe(0);
    expect(project.name).toBe('مشروع بلا اسم');
  });
});

describe('الطلبيات — رقم الطلبية والمبلغ', () => {
  it('رقم الطلبية يُبذر بحسب الموضع، والمبلغ غير الصالح يصبح 0', () => {
    const out = run('workos_v1_orders', [
      { id: 'o1', title: 'أ' },
      { id: 'o2', title: 'ب', orderNumber: 'ORD-X', totalAmount: 500 },
      { id: 'o3', title: 'ج', totalAmount: Number.NaN },
    ]);
    expect(out[0].orderNumber).toBe('ORD-1');
    expect(out[1].orderNumber).toBe('ORD-X');
    expect(out[1].totalAmount).toBe(500);
    expect(out[2].totalAmount).toBe(0);
    expect(out[2].orderNumber).toBe('ORD-3');
  });

  it('العنوان الفارغ يُبذر', () => {
    expect(run('workos_v1_orders', [{ id: 'o1', title: ' ' }])[0].title).toBe('طلبية بلا عنوان');
  });
});

describe('الالتزامات — المبلغ والتسمية', () => {
  it('المبلغ غير الرقمي يصبح 0 والصالح يُحفظ', () => {
    const out = run('workos_v1_commitments', [
      { id: 'c1', title: 'أ', amount: 'كثير' },
      { id: 'c2', title: 'ب', amount: 2500 },
    ]);
    expect(out[0].amount).toBe(0);
    expect(out[0].title).toBe('أ');
    expect(out[1].amount).toBe(2500);
  });

  it('العنوان الغائب يُبذر', () => {
    expect(run('workos_v1_commitments', [{ id: 'c1' }])[0].title).toBe('التزام بلا عنوان');
  });
});

describe('الملاحظات — المرفقات والوسوم', () => {
  it('المرفقات والوسوم والمهام الفرعية مصفوفات دائماً', () => {
    const [note] = run('workos_v1_notes', [{ id: 'n1' }]);
    expect(note.title).toBe('ملاحظة بلا عنوان');
    expect(note.attachments).toEqual([]);
    expect(note.tags).toEqual([]);
    expect(note.checklist).toEqual([]);
  });

  it('كل مرفق يُكمل معرّفه واسمه ونوعه، والعنصر غير الكائني يُتجاهَل', () => {
    const [note] = run('workos_v1_notes', [
      { id: 'n1', title: 'ملاحظة', attachments: [{}, null, 'نص', { id: 'a-9', name: 'ملف', type: 'image/png' }] },
    ]);
    const attachments = note.attachments as Record<string, unknown>[];
    expect(attachments).toHaveLength(4);
    expect(attachments[0]).toMatchObject({
      id: 'att-1',
      name: 'مرفق-1',
      type: 'application/octet-stream',
    });
    expect(attachments[1]).toBeNull();
    expect(attachments[2]).toBe('نص');
    expect(attachments[3]).toMatchObject({ id: 'a-9', name: 'ملف', type: 'image/png' });
  });
});

describe('الروابط — العنوان والرابط والوسوم', () => {
  it('البذور تُطبَّق والوسوم مصفوفة', () => {
    const [link] = run('suite_links_records_v1', [{ id: 'l1' }]);
    expect(link.title).toBe('رابط بلا عنوان');
    expect(link.url).toBe('');
    expect(link.tags).toEqual([]);
  });

  it('القيم الصالحة تُحفظ كما هي', () => {
    const [link] = run('suite_links_records_v1', [
      { id: 'l1', title: 'مورد', url: 'https://example.com', tags: ['مهم'] },
    ]);
    expect(link).toMatchObject({ title: 'مورد', url: 'https://example.com', tags: ['مهم'] });
  });
});

describe('العهد والمهام الكلاسيكية والدواوين', () => {
  it('العهدة: عنوان وحالة افتراضيان', () => {
    const [custody] = run('suite_custody_records_v1', [{ id: 'x' }]);
    expect(custody.title).toBe('عهدة بلا عنوان');
    expect(custody.status).toBe('قيد الاستخدام');
  });

  it('المهام الكلاسيكية: عنوان وحالة وأولوية افتراضية', () => {
    const [task] = run('suite_tasks_items_v2', [{ id: 'x' }]);
    expect(task.title).toBe('مهمة بلا عنوان');
    expect(task.status).toBe('قيد الانتظار');
    expect(task.pri).toBe('C');
  });

  it('الديون: مصفوفة كائنات بمعرّفات فقط (لا تُضاف حقول مالية زائفة)', () => {
    const [debt] = run('suite_debts_records_v1', [{ name: 'أحمد' }]);
    expect(Object.keys(debt).sort()).toEqual(['id', 'name']);
  });
});

describe('الترحيل idempotent — تشغيل ثانٍ لا يغيّر شيئاً', () => {
  it('كل مفتاح: الناتج يُرحَّل مرة أخرى بلا تغيير', () => {
    const sample = [{ id: 'a', title: 'عنوان', progress: 140, totalAmount: Number.NaN, amount: 'x' }, { title: '' }];
    for (const item of SCHEMA_ENTRIES) {
      const once = item.migrations[0](sample, ctx) as Record<string, unknown>[];
      const twice = item.migrations[0](once, ctx) as Record<string, unknown>[];
      expect(twice).toEqual(once);
    }
  });
});
