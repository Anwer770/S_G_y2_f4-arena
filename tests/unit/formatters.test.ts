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
