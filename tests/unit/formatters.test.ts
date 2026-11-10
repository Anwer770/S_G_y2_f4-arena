import { describe, expect, it } from 'vitest';
import {
  ARABIC_DAYS,
  calculateArabicDay,
  formatArabicDate,
  formatCurrency,
  formatNumberLatin,
  getCategoryBadgeStyle,
  getMovementTypeStyle,
  getStatusStyle,
  numberToWordsArabic,
} from '../../src/utils/formatters';

describe('calculateArabicDay', () => {
  it('يعيد اسم اليوم العربي الصحيح', () => {
    // 2026-01-15 يوم خميس (UTC) — نتحقق من التطابق مع Date لا من ثابت مكتوب
    const iso = '2026-01-15T12:00:00';
    const expected = ARABIC_DAYS[new Date(iso).getDay()];
    expect(calculateArabicDay(iso)).toBe(expected);
  });

  it('يُرجع فراغاً للمدخل الفارغ أو غير الصالح', () => {
    expect(calculateArabicDay('')).toBe('');
    expect(calculateArabicDay('ليس تاريخاً')).toBe('');
  });
});

describe('تنسيق الأرقام', () => {
  it('formatNumberLatin يضيف ألفاص وحدّ منزلتين', () => {
    expect(formatNumberLatin(1234.5)).toBe('1,234.5');
    expect(formatNumberLatin(0)).toBe('0');
    expect(formatNumberLatin(null)).toBe('0');
    expect(formatNumberLatin(undefined)).toBe('0');
  });

  it('formatCurrency يثبّت منزلتين عشريتين', () => {
    expect(formatCurrency(1234)).toBe('1,234.00');
    expect(formatCurrency(0)).toBe('0.00');
    expect(formatCurrency(null)).toBe('0.00');
  });
});

describe('formatArabicDate', () => {
  it('يجمع اليوم مع التاريخ أو يعيد المدخل كما هو', () => {
    const out = formatArabicDate('2026-01-15T12:00:00');
    expect(out).toContain(calculateArabicDay('2026-01-15T12:00:00'));
    expect(out).toContain('،');
    expect(formatArabicDate('')).toBe('');
    expect(formatArabicDate('غير صالح')).toBe('غير صالح');
  });
});

describe('أنماط العرض', () => {
  it('getMovementTypeStyle يميّز التوريد عن الصرف', () => {
    const supply = getMovementTypeStyle('توريد');
    const issue = getMovementTypeStyle('صرف');
    expect(supply).toBeTruthy();
    expect(issue).toBeTruthy();
    expect(supply).not.toEqual(issue);
  });

  it('getStatusStyle يعيد نمطاً لكل حالة وبديلاً آمناً للمجهولة', () => {
    expect(getStatusStyle('مكتمل')).toBeTruthy();
    expect(getStatusStyle('حالة غير معروفة')).toBeTruthy();
  });
});

describe('getCategoryBadgeStyle / getStatusStyle — بدائل آمنة', () => {
  it('يعيد نمطاً لكل تصنيف معروف وللمجهول بديلاً', () => {
    for (const category of ['مبيعات', 'مشتريات', 'رواتب', 'تصنيف غير معروف', '']) {
      const style = getCategoryBadgeStyle(category);
      expect(style).toBeTruthy();
    }
  });

  it('أنماط الحالة تُعيد أصناف Tailwind فعلية', () => {
    const style = getStatusStyle('قيد التنفيذ');
    expect(JSON.stringify(style)).toMatch(/bg-|text-|border-/);
  });
});

describe('numberToWordsArabic — تفقيط المبالغ', () => {
  it('يُفوّط الأعداد الأساسية', () => {
    expect(numberToWordsArabic(0)).toBeTruthy();
    expect(numberToWordsArabic(1)).toContain('واحد');
    expect(numberToWordsArabic(5)).toBeTruthy();
    expect(numberToWordsArabic(11)).toBeTruthy();
    expect(numberToWordsArabic(100)).toBeTruthy();
    expect(numberToWordsArabic(1250)).toBeTruthy();
    expect(numberToWordsArabic(1000000)).toBeTruthy();
  });

  it('يتعامل مع الصفر والسالب بلا انهيار', () => {
    expect(typeof numberToWordsArabic(0)).toBe('string');
    expect(typeof numberToWordsArabic(-15)).toBe('string');
    expect(typeof numberToWordsArabic(123.45)).toBe('string');
  });
});

/* ───────────────────── مطابقة دقيقة للتفقيط (R47) ───────────────────── */

describe('numberToWordsArabic — مطابقة دقيقة لا «سلسلة غير فارغة»', () => {
  it.each([
    [0, 'صفر ريال'],
    [1, 'فقط واحد ريال لا غير'],
    [2, 'فقط اثنان ريال لا غير'],
    [10, 'فقط عشرة ريال لا غير'],
    [11, 'فقط أحد عشر ريال لا غير'],
    [19, 'فقط تسعة عشر ريال لا غير'],
    [20, 'فقط عشرون ريال لا غير'],
    [21, 'فقط واحد وعشرون ريال لا غير'],
    [99, 'فقط تسعة وتسعون ريال لا غير'],
    [100, 'فقط مائة ريال لا غير'],
    [101, 'فقط مائة وواحد ريال لا غير'],
    [200, 'فقط مئتان ريال لا غير'],
    [123, 'فقط مائة وثلاثة وعشرون ريال لا غير'],
  ])('المئات والعشرات: %s ⇒ «%s»', (input, expected) => {
    expect(numberToWordsArabic(input as number)).toBe(expected);
  });

  it.each([
    [1000, 'فقط ألف ريال لا غير'],
    [1001, 'فقط ألف وواحد ريال لا غير'],
    [1050, 'فقط ألف وخمسون ريال لا غير'],
    [2000, 'فقط ألفان ريال لا غير'],
    [2100, 'فقط ألفان ومائة ريال لا غير'],
    [3000, 'فقط ثلاثة آلاف ريال لا غير'],
    [11000, 'فقط أحد عشر آلاف ريال لا غير'],
    [100000, 'فقط مائة آلاف ريال لا غير'],
  ])('الآلاف: %s ⇒ «%s»', (input, expected) => {
    expect(numberToWordsArabic(input as number)).toBe(expected);
  });

  it.each([
    [1000000, 'فقط واحد مليون ريال لا غير'],
    [1500000, 'فقط واحد مليون وخمسمائة آلاف ريال لا غير'],
    [1234567, 'فقط واحد مليون ومئتان وأربعة وثلاثون آلاف وخمسمائة وسبعة وستون ريال لا غير'],
  ])('الملايين: %s ⇒ «%s»', (input, expected) => {
    expect(numberToWordsArabic(input as number)).toBe(expected);
  });

  it('«ألف/ألفان» بعد المليون تُسبق بحرف العطف', () => {
    expect(numberToWordsArabic(1_001_000)).toBe('فقط واحد مليون وألف ريال لا غير');
    expect(numberToWordsArabic(1_002_000)).toBe('فقط واحد مليون وألفان ريال لا غير');
    expect(numberToWordsArabic(1_500_000)).toBe('فقط واحد مليون وخمسمائة آلاف ريال لا غير');
  });

  it('الكسر يُقتطع ولا يُقرَّب، والسالب صفر', () => {
    expect(numberToWordsArabic(11.9)).toBe('فقط أحد عشر ريال لا غير');
    expect(numberToWordsArabic(0.99)).toBe('صفر ريال');
    expect(numberToWordsArabic(-5)).toBe('صفر ريال');
    expect(numberToWordsArabic(-1500)).toBe('صفر ريال');
  });

  it('كل ناتج يبدأ بـ«فقط» وينتهي بـ«ريال لا غير» إلا الصفر', () => {
    for (const value of [1, 7, 13, 40, 300, 5000, 250000]) {
      const words = numberToWordsArabic(value);
      expect(words.startsWith('فقط ')).toBe(true);
      expect(words.endsWith(' ريال لا غير')).toBe(true);
    }
  });
});

/* ───────────────────── أنماط الحالة والتصنيف (R47) ───────────────────── */

describe('getStatusStyle — خريطة الحالات كاملة', () => {
  const EMERALD = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  const BLUE = 'bg-blue-50 text-blue-800 border-blue-200';
  const PURPLE = 'bg-purple-50 text-purple-800 border-purple-200';
  const SLATE_LINE = 'bg-slate-100 text-slate-500 border-slate-300 line-through';
  const AMBER = 'bg-amber-50 text-amber-800 border-amber-200';
  const FALLBACK = 'bg-slate-50 text-slate-700 border-slate-200';

  it.each([
    ['تم التنفيذ', EMERALD],
    ['√', EMERALD],
    ['A', EMERALD],
    ['قيد التنفيذ', BLUE],
    ['B', BLUE],
    ['تم ترحيل', PURPLE],
    ['ملغي', SLATE_LINE],
    ['معلق', AMBER],
    ['عهده', AMBER],
    ['حالة غير معروفة', FALLBACK],
    ['', FALLBACK],
  ])('«%s» ⇒ «%s»', (status, expected) => {
    expect(getStatusStyle(status)).toBe(expected);
  });

  it('المسافات الزائدة لا تُغيّر النتيجة', () => {
    expect(getStatusStyle('  A  ')).toBe(EMERALD);
    expect(getStatusStyle(' ملغي ')).toBe(SLATE_LINE);
  });

  it('المدخل غير النصّي لا يرمي ويعطي البديل', () => {
    expect(getStatusStyle(null as unknown as string)).toBe(FALLBACK);
    expect(getStatusStyle(undefined as unknown as string)).toBe(FALLBACK);
  });
});

describe('getCategoryBadgeStyle — خريطة التصنيفات كاملة', () => {
  it('كل تصنيف معروف له نمط خاص ومختلف عن غيره', () => {
    const categories = ['مبيعات', 'مشتريات', 'عينات', 'هدية', 'دعم', 'توزيع', 'تالف', 'مرتجع', 'شركة', 'شخصي'];
    const styles = categories.map(getCategoryBadgeStyle);
    expect(new Set(styles).size).toBe(categories.length);
    for (const style of styles) expect(style).toMatch(/^bg-\w+-50 text-\w+-800 border-\w+-200$/);
  });

  it('التصنيف المجهول والفراغ يعطيان البديل نفسه', () => {
    const fallback = 'bg-slate-50 text-slate-700 border-slate-200';
    expect(getCategoryBadgeStyle('غير معروف')).toBe(fallback);
    expect(getCategoryBadgeStyle('')).toBe(fallback);
    expect(getCategoryBadgeStyle(null as unknown as string)).toBe(fallback);
  });

  it('المسافات الزائدة حول التصنيف لا تُغيّر النتيجة', () => {
    expect(getCategoryBadgeStyle('  مبيعات ')).toBe(getCategoryBadgeStyle('مبيعات'));
  });
});

describe('getMovementTypeStyle — عقد الحقول', () => {
  it('التوريد إدخال والصرف ليس إدخالاً، مع التسميات العربية', () => {
    const supply = getMovementTypeStyle('توريد');
    const issue = getMovementTypeStyle('صرف');
    expect(supply.isInput).toBe(true);
    expect(issue.isInput).toBe(false);
    expect(supply.label).toBe('توريد (IN)');
    expect(issue.label).toBe('صرف (OUT)');
    expect(supply.bg).toContain('emerald');
    expect(issue.bg).toContain('rose');
    for (const key of ['bg', 'badge', 'pill', 'text', 'lightText']) {
      expect((supply as unknown as Record<string, string>)[key]).toBeTruthy();
      expect((issue as unknown as Record<string, string>)[key]).toBeTruthy();
    }
  });

  it('أي نوع آخر يُعامل كصرف', () => {
    expect(getMovementTypeStyle('نوع آخر')).toEqual(getMovementTypeStyle('صرف'));
  });
});

describe('formatArabicDate — التركيب والشكل', () => {
  it('يجمع اليوم والتاريخ بفاصل عربي ويحوي أربعة أرقام للسنة', () => {
    const iso = '2026-01-15T12:00:00';
    const out = formatArabicDate(iso);
    expect(out.startsWith(`${calculateArabicDay(iso)}، `)).toBe(true);
    expect(out).toMatch(/[٠-٩]{4}|20\d{2}/);
  });

  it('الفراغ يعطي فراغاً، وغير الصالح يُعاد كما هو (لا «Invalid Date»)', () => {
    expect(formatArabicDate('')).toBe('');
    expect(formatArabicDate('غير صالح')).toBe('غير صالح');
    expect(formatArabicDate('2026-13-45')).toBe('2026-13-45');
  });
});
