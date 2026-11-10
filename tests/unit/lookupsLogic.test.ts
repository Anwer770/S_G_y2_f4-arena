/**
 * اختبارات وحدة لمنطق قوائم الثوابت (R44) — منطق نقي بلا DOM ولا تخزين.
 *
 * قبل R44 كان هذا الملف (160 سطراً) **خارج مظلّة التغطية** في `vitest.config.ts`،
 * فكان مقياس التغطية يقيس 91% على مقام ناقص. هذا الاختبار يغطّي كل فرع:
 *   - الاستنساخ العميق للافتراضي ومنع تسرّب التعديل إلى `DEFAULT_LOOKUPS`
 *   - تعقيم ما يصل من التخزين (الأنواع · الأسماء الفارغة · الترتيب · اللون · id)
 *   - الإضافة/التسمية/التعديل/الحذف/الترتيب/الاستبدال وكل حالات الرفض
 *   - حرمة الحالة الأصلية (كل الدوال تُعيد نسخة ولا تُعدّل ما دخلها)
 */
import { describe, it, expect } from 'vitest';
import { DEFAULT_LOOKUPS, type LookupsState } from '../../src/constants/lookups';
import {
  LookupError,
  addLookup,
  cloneDefaults,
  moveLookup,
  normalizeLookups,
  patchLookup,
  removeLookup,
  renameLookup,
  replaceLookupList,
} from '../../src/utils/lookupsLogic';

const state = (): LookupsState => cloneDefaults();

describe('cloneDefaults', () => {
  it('يُعيد نسخة عميقة مطابقة للافتراضي', () => {
    const copy = cloneDefaults();
    expect(copy).toEqual(DEFAULT_LOOKUPS);
    expect(copy).not.toBe(DEFAULT_LOOKUPS);
    expect(copy.categories).not.toBe(DEFAULT_LOOKUPS.categories);
    expect(copy.categories.map((i) => i.id)).toEqual(DEFAULT_LOOKUPS.categories.map((i) => i.id));
  });

  it('التعديل على النسخة لا يتسرّب إلى الثابت الافتراضي', () => {
    const copy = cloneDefaults();
    copy.categories[0].label = 'مُعدَّل';
    copy.categories.push({ id: 'x', label: 'دخيل', order: 99, active: true });
    expect(DEFAULT_LOOKUPS.categories[0].label).not.toBe('مُعدَّل');
    expect(DEFAULT_LOOKUPS.categories.some((i) => i.id === 'x')).toBe(false);
  });

  it('كل نسخة مستقلّة عن الأخرى', () => {
    expect(cloneDefaults().owners).not.toBe(cloneDefaults().owners);
  });
});

describe('LookupError', () => {
  it('نوع خطأ حقيقي يُلتقط بـ instanceof Error', () => {
    const err = new LookupError('سبب');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(LookupError);
    expect(err.message).toBe('سبب');
  });
});

describe('normalizeLookups — تعقيم ما يصل من التخزين', () => {
  it('القيم غير الكائنية تُرجع الافتراضي كاملاً', () => {
    for (const raw of [null, undefined, 0, '', 'نص', false, 42]) {
      const out = normalizeLookups(raw);
      expect(out.categories).toEqual(DEFAULT_LOOKUPS.categories);
      expect(out.grades).toEqual(DEFAULT_LOOKUPS.grades);
      expect(out.version).toBe(1);
    }
  });

  it('قائمة مفقودة أو فارغة أو ليست مصفوفة ⇒ افتراضي هذه القائمة وحدها', () => {
    const out = normalizeLookups({ categories: [], owners: 'x', beneficiaries: null });
    expect(out.categories).toEqual(DEFAULT_LOOKUPS.categories);
    expect(out.owners).toEqual(DEFAULT_LOOKUPS.owners);
    expect(out.beneficiaries).toEqual(DEFAULT_LOOKUPS.beneficiaries);
    // بقية القوائم لم تُذكر ⇒ افتراضية أيضاً
    expect(out.statuses).toEqual(DEFAULT_LOOKUPS.statuses);
    expect(out.grades).toEqual(DEFAULT_LOOKUPS.grades);
  });

  it('يُسقط العناصر التالفة (غير كائن أو بلا label نصّي) ويُبقي السليم', () => {
    const out = normalizeLookups({
      categories: [
        { id: 'c-1', label: 'سليم', order: 1, active: true },
        null,
        'نص',
        { id: 'c-2', label: 42 },
        { id: 'c-3', label: '  ' },
        { id: 'c-4', label: 'ثانٍ', order: 2 },
      ],
    });
    expect(out.categories.map((i) => i.label)).toEqual(['سليم', 'ثانٍ']);
  });

  it('يُكمل id و order المفقودين ويحفظ الصالح منهما', () => {
    const out = normalizeLookups({
      owners: [
        { label: 'بلا معرّف' },
        { id: 'own-x', label: 'بترتيب', order: 9 },
        { id: '', label: 'معرّف فارغ', order: Number.NaN },
      ],
    });
    // الترتيب المُسند = موضع العنصر في المصفوفة الأصلية + 1
    expect(out.owners[0]).toMatchObject({ id: 'own-1', order: 1, active: true });
    expect(out.owners[1]).toMatchObject({ id: 'own-x', order: 9 });
    expect(out.owners[2].id).toBe('own-3');
    expect(out.owners[2].order).toBe(3);
    expect(Number.isFinite(out.owners[2].order)).toBe(true);
  });

  it('active يحفظ false صريحة ويُعتبر غيابها true', () => {
    const out = normalizeLookups({
      statuses: [
        { id: 's1', label: 'مخفي', active: false },
        { id: 's2', label: 'ظاهر' },
      ],
    });
    expect(out.statuses[0].active).toBe(false);
    expect(out.statuses[1].active).toBe(true);
  });

  it('الدرجات: لون افتراضي slate وتلميح محفوظ وحقل tone لا يظهر في القوائم العادية', () => {
    const out = normalizeLookups({
      grades: [
        { id: 'g1', label: 'ممتاز', tone: 'rose', hint: 'عالي' },
        { id: 'g2', label: 'عادي' },
      ],
      categories: [{ id: 'c1', label: 'فئة', tone: 'rose' }],
    });
    expect(out.grades[0]).toMatchObject({ id: 'g1', tone: 'rose', hint: 'عالي' });
    expect(out.grades[1].tone).toBe('slate');
    expect(out.grades[1].hint).toBeUndefined();
    expect('tone' in out.categories[0]).toBe(false);
  });

  it('تاريخ التحديث: نص سليم يُحفظ، وغير النص يُولَّد ISO', () => {
    const kept = normalizeLookups({ updatedAt: '2026-01-01T00:00:00.000Z', categories: [] });
    expect(kept.updatedAt).toBe('2026-01-01T00:00:00.000Z');
    const generated = normalizeLookups({ updatedAt: 123456, categories: [] });
    expect(generated.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(Number.isNaN(Date.parse(generated.updatedAt))).toBe(false);
  });

  it('الإصدار يُثبَّت على 1 مهما كان القادم', () => {
    expect(normalizeLookups({ version: 99, categories: [] }).version).toBe(1);
  });

  it('لا يعدّل الكائن القادم من التخزين', () => {
    const raw = { categories: [{ id: 'c1', label: ' فئة ' }] };
    const snapshot = JSON.stringify(raw);
    normalizeLookups(raw);
    expect(JSON.stringify(raw)).toBe(snapshot);
    expect(raw.categories[0].label).toBe(' فئة ');
  });
});

describe('addLookup', () => {
  it('يُضيف عنصراً نشطاً ويُعيده مع الحالة الجديدة', () => {
    const before = state();
    const { state: next, item } = addLookup(before, 'categories', 'قطع غيار');
    expect(item).toMatchObject({ label: 'قطع غيار', active: true, id: 'cat-7', order: 7 });
    expect(next.categories).toHaveLength(before.categories.length + 1);
    expect(next.categories.at(-1)).toMatchObject({ id: 'cat-7', label: 'قطع غيار', order: 7 });
    expect(before.categories).toHaveLength(6); // الأصل لم يتغيّر
    expect(next.updatedAt).not.toBe(before.updatedAt);
  });

  it('يقصّ المسافات قبل الحفظ', () => {
    const { state: next, item } = addLookup(state(), 'owners', '   سعيد   ');
    expect(item.label).toBe('سعيد');
    expect(next.owners.at(-1)?.label).toBe('سعيد');
  });

  it('يرفض الاسم الفارغ والمسافات فقط', () => {
    for (const bad of ['', '   ', '\t\n']) {
      expect(() => addLookup(state(), 'categories', bad)).toThrow(LookupError);
      expect(() => addLookup(state(), 'categories', bad)).toThrow('الاسم مطلوب');
    }
  });

  it('يرفض التكرار بلا حساسية لحالة الأحرف أو المسافات', () => {
    const s = state();
    expect(() => addLookup(s, 'grades', 'A')).toThrow(/موجود بالفعل/);
    expect(() => addLookup(s, 'grades', ' a ')).toThrow(LookupError);
    expect(() => addLookup(s, 'categories', '  عناية وتجميل ')).toThrow(LookupError);
  });

  it('التكرار محسوب داخل القائمة نفسها فقط (الاسم نفسه في قائمة أخرى مقبول)', () => {
    const s = state();
    const { item } = addLookup(s, 'statuses', 'عناية وتجميل');
    expect(item.label).toBe('عناية وتجميل');
  });

  it('يولّد معرّفاً متسلسلاً بلا تصادم', () => {
    const s = state();
    const twice = addLookup(addLookup(s, 'statuses', 'أول').state, 'statuses', 'ثانٍ');
    expect(twice.item.id).toBe('st-8');
    // حالة بمعرّف موجود مسبقاً في موضع n ⇒ القفز إلى التالي الحر
    const collision = {
      ...s,
      categories: [
        { id: 'cat-1', label: 'أ', order: 1, active: true },
        { id: 'cat-3', label: 'ب', order: 2, active: true },
      ],
    };
    expect(addLookup(collision, 'categories', 'ج').item.id).toBe('cat-4');
  });

  it('الدرجات تأخذ اللون والتلميح، وبقية القوائم لا تحمل الحقول', () => {
    const { state: next, item } = addLookup(state(), 'grades', 'D', { tone: 'amber', hint: 'نادر' });
    expect(item).toMatchObject({ tone: 'amber', hint: 'نادر' });
    expect(next.grades.at(-1)).toMatchObject({ label: 'D', tone: 'amber', hint: 'نادر' });
    const plain = addLookup(state(), 'grades', 'E', {});
    expect((plain.item as { tone?: string }).tone).toBe('slate');
    const cat = addLookup(state(), 'categories', 'جديدة');
    expect('tone' in cat.item).toBe(false);
  });

  it('يُعيد ترقيماً متسلسلاً 1..n بعد الإضافة', () => {
    const s = {
      ...state(),
      beneficiaries: [
        { id: 'ben-a', label: 'أ', order: 1, active: true },
        { id: 'ben-b', label: 'ب', order: 7, active: true },
      ],
    };
    const { state: next } = addLookup(s, 'beneficiaries', 'ج');
    expect(next.beneficiaries.map((i) => i.order)).toEqual([1, 2, 3]);
  });
});

describe('renameLookup', () => {
  it('يُعيد التسمية بعد قصّ المسافات ويحدّث التاريخ', () => {
    const s = state();
    const next = renameLookup(s, 'owners', 'own-anwar', '  أنور علي ');
    expect(next.owners.find((i) => i.id === 'own-anwar')?.label).toBe('أنور علي');
    expect(next.owners).toHaveLength(s.owners.length);
    expect(next.updatedAt).not.toBe(s.updatedAt);
    expect(s.owners.find((i) => i.id === 'own-anwar')?.label).toBe('أنور');
  });

  it('يرفض الاسم الفارغ (نص فارغ أو مسافات أو null)', () => {
    expect(() => renameLookup(state(), 'owners', 'own-anwar', '')).toThrow('الاسم مطلوب');
    expect(() => renameLookup(state(), 'owners', 'own-anwar', '  ')).toThrow('الاسم مطلوب');
    // القيمة القادمة من الواجهة قد تكون غير نصّية أصلاً
    expect(() => renameLookup(state(), 'owners', 'own-anwar', null as unknown as string)).toThrow('الاسم مطلوب');
  });

  it('يرفض الاسم المستخدم لعنصر آخر في القائمة', () => {
    expect(() => renameLookup(state(), 'owners', 'own-anwar', 'صدام')).toThrow(LookupError);
    expect(() => renameLookup(state(), 'owners', 'own-anwar', ' صدام ')).toThrow(/موجود بالفعل/);
  });

  it('تسمية العنصر باسمه نفسه (بحالة أحرف مختلفة) مسموحة', () => {
    const next = renameLookup(state(), 'grades', 'gr-a', ' a ');
    expect(next.grades.find((i) => i.id === 'gr-a')?.label).toBe('a');
  });

  it('معرّف غير موجود ⇒ لا تغيير في المحتوى', () => {
    const s = state();
    const next = renameLookup(s, 'owners', 'ghost', 'اسم');
    expect(next.owners).toEqual(s.owners);
    expect(next.categories).toEqual(s.categories);
  });

  it('لا يعدّل الحالة الأصلية', () => {
    const s = state();
    renameLookup(s, 'owners', 'own-anwar', 'آخر');
    expect(s.owners.find((i) => i.id === 'own-anwar')?.label).toBe('أنور');
  });
});

describe('patchLookup', () => {
  it('يعدّل اللون والتلميح في الدرجات', () => {
    const next = patchLookup(state(), 'grades', 'gr-b', { tone: 'sky', hint: 'جديد' });
    expect(next.grades.find((i) => i.id === 'gr-b')).toMatchObject({ tone: 'sky', hint: 'جديد' });
  });

  it('يُعطّل عنصراً (active=false) ويُبقيه في القائمة', () => {
    const s = state();
    const next = patchLookup(s, 'categories', 'cat-other', { active: false });
    expect(next.categories).toHaveLength(s.categories.length);
    expect(next.categories.find((i) => i.id === 'cat-other')?.active).toBe(false);
    expect(s.categories.find((i) => i.id === 'cat-other')?.active).toBe(true);
  });

  it('تعديل جزئي لا يمسّ بقية الحقول', () => {
    const next = patchLookup(state(), 'owners', 'own-jamal', {});
    const original = state().owners.find((i) => i.id === 'own-jamal');
    expect(next.owners.find((i) => i.id === 'own-jamal')).toEqual(original);
  });

  it('معرّف غير موجود ⇒ القائمة كما هي', () => {
    const s = state();
    expect(patchLookup(s, 'owners', 'ghost', { active: false }).owners).toEqual(s.owners);
  });
});

describe('removeLookup', () => {
  it('يحذف العنصر ويُعيد ترقيماً متسلسلاً', () => {
    const s = state();
    const next = removeLookup(s, 'categories', 'cat-services');
    expect(next.categories).toHaveLength(s.categories.length - 1);
    expect(next.categories.some((i) => i.id === 'cat-services')).toBe(false);
    expect(next.categories.map((i) => i.order)).toEqual([1, 2, 3, 4, 5]);
    expect(s.categories).toHaveLength(6);
  });

  it('معرّف غير موجود ⇒ نفس الكائن بلا أي تغيير', () => {
    const s = state();
    expect(removeLookup(s, 'categories', 'ghost')).toBe(s);
  });

  it('يمنع حذف آخر عنصر نشط', () => {
    const s = replaceLookupList(state(), 'owners', ['وحيد']);
    expect(() => removeLookup(s, 'owners', s.owners[0].id)).toThrow('لا يمكن حذف آخر عنصر نشط في القائمة');
  });

  it('إذا كان البديل الوحيد معطّلاً يُعتبر الحذف إفراغاً ويُرفض', () => {
    const s = patchLookup(replaceLookupList(state(), 'owners', ['نشط', 'معطّل']), 'owners', 'own-import-2', {
      active: false,
    });
    expect(() => removeLookup(s, 'owners', s.owners[0].id)).toThrow(LookupError);
  });

  it('حذف عنصر معطّل مسموح ما دام هناك نشط', () => {
    const base = replaceLookupList(state(), 'owners', ['نشط', 'معطّل']);
    const s = patchLookup(base, 'owners', base.owners[1].id, { active: false });
    const next = removeLookup(s, 'owners', s.owners[1].id);
    expect(next.owners.map((i) => i.label)).toEqual(['نشط']);
  });
});

describe('moveLookup', () => {
  it('يُصعد العنصر ويُعيد ترقيماً متسلسلاً', () => {
    const s = state();
    const next = moveLookup(s, 'categories', 'cat-devices', -1);
    expect(next.categories.slice(0, 2).map((i) => i.id)).toEqual(['cat-devices', 'cat-care']);
    expect(next.categories.map((i) => i.order)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('يُنزل العنصر', () => {
    const next = moveLookup(state(), 'statuses', 'st-planned', 1);
    expect(next.statuses.slice(0, 2).map((i) => i.id)).toEqual(['st-progress', 'st-planned']);
  });

  it('الحدود لا تُحرّك شيئاً وتُعيد نفس الكائن', () => {
    const s = state();
    expect(moveLookup(s, 'categories', 'cat-care', -1)).toBe(s);
    expect(moveLookup(s, 'categories', 'cat-other', 1)).toBe(s);
    expect(moveLookup(s, 'categories', 'ghost', 1)).toBe(s);
    expect(moveLookup(s, 'categories', 'ghost', -1)).toBe(s);
  });

  it('الترتيب يعتمد على `order` لا على ترتيب المصفوفة', () => {
    const s = {
      ...state(),
      owners: [
        { id: 'own-b', label: 'ب', order: 2, active: true },
        { id: 'own-a', label: 'أ', order: 1, active: true },
        { id: 'own-c', label: 'ج', order: 3, active: true },
      ],
    };
    const next = moveLookup(s, 'owners', 'own-c', -1);
    expect(next.owners.map((i) => i.id)).toEqual(['own-a', 'own-c', 'own-b']);
    expect(next.owners.map((i) => i.order)).toEqual([1, 2, 3]);
    expect(s.owners.map((i) => i.id)).toEqual(['own-b', 'own-a', 'own-c']);
  });
});

describe('replaceLookupList', () => {
  it('يستبدل القائمة كاملة بمعرّفات استيراد مرقّمة', () => {
    const next = replaceLookupList(state(), 'beneficiaries', [' زيد ', '', 'عبيد ']);
    expect(next.beneficiaries).toEqual([
      { id: 'ben-import-1', label: 'زيد', order: 1, active: true },
      { id: 'ben-import-2', label: 'عبيد', order: 2, active: true },
    ]);
  });

  it('قائمة فارغة (أو مسافات فقط) ⇒ لا تغيير إطلاقاً', () => {
    const s = state();
    expect(replaceLookupList(s, 'beneficiaries', [])).toBe(s);
    expect(replaceLookupList(s, 'beneficiaries', ['', '   '])).toBe(s);
  });

  it('لا يمسّ بقية القوائم', () => {
    const s = state();
    const next = replaceLookupList(s, 'owners', ['واحد']);
    expect(next.categories).toEqual(s.categories);
    expect(next.grades).toEqual(s.grades);
    expect(next.owners).toHaveLength(1);
  });

  it('الدرجات تُستبدل كقائمة عادية بلا لون (سلوك محفوظ)', () => {
    const next = replaceLookupList(state(), 'grades', ['A', 'B']);
    expect(next.grades).toEqual([
      { id: 'gr-import-1', label: 'A', order: 1, active: true },
      { id: 'gr-import-2', label: 'B', order: 2, active: true },
    ]);
  });
});
