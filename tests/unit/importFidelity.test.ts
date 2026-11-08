import { describe, expect, it } from 'vitest';
import {
  ImportReport,
  autoKey,
  cellNumber,
  cellText,
  cellTextDetailed,
  isAutoKey,
} from '../../src/utils/importFidelity';

describe('cellText — الخلية الفارغة تبقى فارغة', () => {
  it('لا يخترع قيمة افتراضية لخلية فارغة', () => {
    expect(cellText({ الاسم: '' }, ['الاسم'])).toBe('');
    expect(cellText({ الاسم: '   ' }, ['الاسم'])).toBe('');
    expect(cellText({}, ['الاسم'])).toBe('');
    expect(cellText({ الاسم: null }, ['الاسم'])).toBe('');
  });

  it('يقرأ القيمة الأولى غير الفارغة بترتيب الأسماء البديلة', () => {
    const row = { الاسم: '', 'اسم العميل': '  شركة النور  ', Name: 'Other' };
    expect(cellText(row, ['الاسم', 'اسم العميل', 'Name'])).toBe('شركة النور');
  });

  it('يحوّل الأرقام إلى نص بلا إضافة', () => {
    expect(cellText({ qty: 12 }, ['qty'])).toBe('12');
    expect(cellText({ qty: 0 }, ['qty'])).toBe('0');
  });
});

describe('cellNumber — الفراغ 0 مع الوسم', () => {
  it('يرفض اختراع مبالغ: فراغ ⇒ 0 + blank=true', () => {
    expect(cellNumber({}, ['المبلغ'])).toEqual({ value: 0, blank: true });
    expect(cellNumber({ المبلغ: '' }, ['المبلغ'])).toEqual({ value: 0, blank: true });
  });

  it('يقرأ الأرقام ويحترم محوّل النص', () => {
    expect(cellNumber({ المبلغ: '1250' }, ['المبلغ'])).toEqual({ value: 1250, blank: false });
    expect(cellNumber({ المبلغ: '1,250.50' }, ['المبلغ'], (raw) => raw.replace(/,/g, ''))).toEqual({
      value: 1250.5,
      blank: false,
    });
  });

  it('النص غير الرقمي يُعدّ فراغاً لا صفراً صريحاً من الملف', () => {
    expect(cellNumber({ المبلغ: 'غير محدد' }, ['المبلغ'])).toEqual({ value: 0, blank: true });
  });
});

describe('cellTextDetailed + autoKey', () => {
  it('يُبلّغ عن الفراغ الأصلي', () => {
    expect(cellTextDetailed({ a: '' }, ['a'])).toEqual({ value: '', blank: true });
    expect(cellTextDetailed({ a: 'قيمة' }, ['a'])).toEqual({ value: 'قيمة', blank: false });
  });

  it('المفاتيح المولّدة موسومة AUTO- ومثبّتة الطول', () => {
    expect(autoKey('CUST', 12)).toBe('AUTO-CUST-0012');
    expect(autoKey('CUST', 12345)).toBe('AUTO-CUST-12345');
    expect(isAutoKey('AUTO-CUST-0012')).toBe(true);
    expect(isAutoKey('CUST-0012')).toBe(false);
  });
});

describe('ImportReport — تقرير الأمانة', () => {
  it('يجمع الفراغات والمفاتيح المولّدة والتصفير بصدق', () => {
    const report = new ImportReport();
    report.blank(3, 'الهاتف');
    report.generated(5, 'المعرف', 'AUTO-CUST-0005');
    report.zeroed(9, 'المبلغ');

    expect(report.blanks).toBe(1);
    expect(report.generatedCount).toBe(1);
    expect(report.zeroedCount).toBe(1);

    const lines = report.summary();
    expect(lines[0]).toContain('خلية فارغة');
    expect(lines.join('\n')).toContain('AUTO-CUST-0005');
  });

  it('بلا ملاحظات ⇒ رسالة صريحة بأن كل الخلايا مطابقة للملف', () => {
    const report = new ImportReport();
    expect(report.blanks).toBe(0);
    expect(report.summary()[0]).toContain('مطابقة للملف');
  });

  it('يحدّ عدد الأسطر المعروضة حسب الطلب', () => {
    const report = new ImportReport();
    for (let i = 1; i <= 30; i++) report.generated(i, 'المعرف', `AUTO-X-${i}`);
    expect(report.summary(3)).toHaveLength(1 + 3);
  });
});
