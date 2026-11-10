/**
 * اختبارات حدود الأمان في قراءة ملفات Excel (R52).
 *
 * `xlsxSafe.ts` هو الحاجز الوحيد بين ملف يرفعه المستخدم ومكتبة `xlsx@0.18.5` التي تحمل
 * ثغرتَي Prototype Pollution وReDoS بلا إصلاح. وكان **خارج مقام التغطية**: إدخاله أنزل
 * الإجمالي إلى 78.78% أسطر. هنا يُقاس الحاجز نفسه: الحجم، السقف، التنظيف، والرسالة العربية.
 */
import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import {
  ImportSecurityError,
  MAX_IMPORT_BYTES,
  MAX_IMPORT_ROWS,
  assertFileSize,
  readFirstSheetAoaSafe,
  readFirstSheetSafe,
  safeSheetWarnings,
} from '../../src/utils/xlsxSafe';

const sheetBuffer = (aoa: unknown[][]): Uint8Array => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Sheet1');
  return new Uint8Array(XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer);
};

describe('حدّ الحجم قبل أي تحليل', () => {
  it('الحد 15MB: ما دونه يُقبل وما فوقه يُرفض برسالة عربية تحمل الرقم', () => {
    expect(() => assertFileSize({ size: MAX_IMPORT_BYTES, name: 'حد.xlsx' })).not.toThrow();

    let caught: unknown;
    try {
      assertFileSize({ size: MAX_IMPORT_BYTES + 1, name: 'كبير.xlsx' });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ImportSecurityError);
    expect((caught as Error).message).toContain('15MB');
    expect((caught as Error).message).toContain('قسّم الملف');
  });

  it('غياب الملف أو حجمه (undefined) لا يُسقط الفحص', () => {
    expect(() => assertFileSize(null)).not.toThrow();
    expect(() => assertFileSize(undefined)).not.toThrow();
    expect(() => assertFileSize({})).not.toThrow();
  });
});

describe('قراءة الورقة الأولى — التنظيف والسقف', () => {
  it('مفاتيح prototype الخطرة تُزال من الصف ولا تُلوّث الكائن العام', () => {
    const buffer = sheetBuffer([
      ['__proto__', 'constructor', 'prototype', 'name'],
      ['polluted', 'x', 'y', 'صيدلية النور'],
    ]);

    const result = readFirstSheetSafe<Record<string, unknown>>(buffer, 'array');

    /* `sheet_to_json` يسمّي الأعمدة المكرّرة بلاحقة (`__proto___NaN`)، فيبقى `prototype`
       هو المفتاح الخطر الوحيد الواصل إلى الصف — والحارس يحذفه ويعدّه. */
    expect(result.sanitizedKeys).toBe(1);
    expect(result.rows[0]).not.toHaveProperty('prototype');
    expect(result.rows[0].name).toBe('صيدلية النور');
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('ملف سليم بلا مفاتيح خطرة: صفر تنظيف وقيم كما هي (الفراغ يبقى فراغاً)', () => {
    const result = readFirstSheetSafe<Record<string, unknown>>(
      sheetBuffer([
        ['اسم العميل', 'المنطقة'],
        ['صيدلية الشفاء', ''],
        ['مؤسسة الأمل', 'صنعاء'],
      ]),
      'array'
    );

    expect(result.sanitizedKeys).toBe(0);
    expect(result.truncated).toBe(false);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[1]).toEqual({ 'اسم العميل': 'مؤسسة الأمل', المنطقة: 'صنعاء' });
  });

  it('خطأ القراءة الداخلي يُحوَّل إلى ImportSecurityError برسالة عربية', () => {
    let caught: unknown;
    try {
      readFirstSheetSafe(null as never, 'array');
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ImportSecurityError);
    expect((caught as Error).message).toContain('تعذّر قراءة الملف');

    let caughtAoa: unknown;
    try {
      readFirstSheetAoaSafe(null as never, 'array');
    } catch (err) {
      caughtAoa = err;
    }
    expect(caughtAoa).toBeInstanceOf(ImportSecurityError);
  });

  it('بايتات غير مقروءة: صفر صفوف بلا انهيار (لا رسالة استثناء خام)', () => {
    const result = readFirstSheetSafe(new Uint8Array([1, 2, 3, 4, 5]), 'array');
    expect(result.rows).toEqual([]);
    expect(result.truncated).toBe(false);
  });

  it('ورقة بترويسة فقط ⇒ صفر كائنات، لكن نمط المصفوفة يعيد الترويسة كما هي', () => {
    const buffer = sheetBuffer([['اسم العميل', 'المنطقة']]);

    const objects = readFirstSheetSafe<Record<string, unknown>>(buffer, 'array');
    expect(objects.rows).toEqual([]);
    expect(objects.sanitizedKeys).toBe(0);

    const aoa = readFirstSheetAoaSafe(buffer, 'array');
    expect(aoa.rows).toEqual([['اسم العميل', 'المنطقة']]);
  });

  it('السقف 20,000 صف: الملف الأكبر يُقتطع ويُعلَن الاقتطاع', () => {
    const aoa: unknown[][] = [['المعرف', 'القيمة']];
    for (let i = 0; i < MAX_IMPORT_ROWS + 5; i += 1) aoa.push([`R-${i}`, i]);

    const objectRows = readFirstSheetSafe<Record<string, unknown>>(sheetBuffer(aoa), 'array');
    expect(objectRows.truncated).toBe(true);
    expect(objectRows.rows).toHaveLength(MAX_IMPORT_ROWS);

    const arrayRows = readFirstSheetAoaSafe(sheetBuffer(aoa), 'array');
    expect(arrayRows.truncated).toBe(true);
    expect(arrayRows.rows).toHaveLength(MAX_IMPORT_ROWS + 1);
  }, 30_000);

  it('نمط المصفوفة (header:1) يحفظ الترتيب ويُسقط الصفوف الفارغة تماماً', () => {
    const result = readFirstSheetAoaSafe(
      sheetBuffer([
        ['Main_ID', 'Sub_ID'],
        ['C-1', 'IN-1'],
        ['', ''],
        ['C-2', 'OUT-1'],
      ]),
      'array'
    );

    expect(result.rows[0]).toEqual(['Main_ID', 'Sub_ID']);
    /* الصف الفارغ يصل كخلايا فارغة (المرشّح الحقيقي في المستورِد) — لا يُسقط ولا يرمي */
    expect(result.rows).toHaveLength(4);
    expect(result.rows[3]).toEqual(['C-2', 'OUT-1']);
  });
});

describe('تحذيرات الحاجز — تُقال للمستخدم لا تُكتَم', () => {
  it('بلا اقتطاع ولا تنظيف ⇒ لا تحذير', () => {
    expect(safeSheetWarnings({ rows: [], truncated: false, sanitizedKeys: 0 })).toEqual([]);
  });

  it('الاقتطاع والتنظيف كلاهما يُصرَّح بعدديهما', () => {
    const warnings = safeSheetWarnings({ rows: [], truncated: true, sanitizedKeys: 2 });

    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toContain(String(MAX_IMPORT_ROWS));
    expect(warnings[1]).toContain('2');
  });
});
