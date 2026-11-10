/**
 * مسار الفشل في المستورِد المالي (R52).
 *
 * الدالة تلفّ القراءة كلها في `try/catch` كي لا يُسقط ملف تالف النافذة. هذا الملف
 * يجعل الحاجز نفسه يرمي (بدل ملف تالف حقيقي) ليثبت أن الرسالة تصل للمستخدم عربية
 * وأن المحصّلة `success: false` لا استثناء. البيئة jsdom لأن الدالة تعتمد `FileReader`.
 */
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  fail: null as null | (() => never),
  rows: null as null | Record<string, unknown>[],
}));

vi.mock('../../src/utils/xlsxSafe', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/utils/xlsxSafe')>();
  return {
    ...actual,
    readFirstSheetSafe: () => {
      if (state.fail) state.fail();
      if (state.rows) return { rows: state.rows, truncated: false, sanitizedKeys: 0 };
      throw new Error('حدود الأمان: ملف غير مقروء');
    },
  };
});

import { parseFinancialExcelOrCSV } from '../../src/utils/excel/excelImporters';

describe('فشل القراءة داخل المستورِد المالي', () => {
  it('يُعاد success=false برسالة تحمل سبب الفشل، بلا رمي', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'تالف.xlsx');

    const result = await parseFinancialExcelOrCSV(file, []);

    expect(result.success).toBe(false);
    expect(result.transactions).toEqual([]);
    expect(result.errors[0]).toContain('حدث خطأ أثناء قراءة ملف الإكسل');
    expect(result.errors[0]).toContain('ملف غير مقروء');
    expect(result.warnings).toEqual([]);
  });

  it('خطأ غير Error برسالة فارغة ⇒ النص الافتراضي لا «undefined»', async () => {
    state.fail = () => {
      throw '';
    };
    const result = await parseFinancialExcelOrCSV(new File([new Uint8Array([1])], 'تالف.xlsx'), []);

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('تنسيق الملف غير صالح');
    expect(result.errors[0]).not.toContain('undefined');

    state.fail = null;
  });
});

describe('خلية بقيمة null من الحاجز — لا تُقرأ نصاً', () => {
  it('عمود يطابق الاسم البديل بقيمة null يُتجاوَز إلى عمود آخر، لا يصير «null»', async () => {
    state.rows = [{ 'اسم الحساب': null, الحساب: 'صيدلية من العمود الثاني', 'المبلغ (ريال يمني)': 12 }];

    const result = await parseFinancialExcelOrCSV(new File([new Uint8Array([1])], 'x.xlsx'), []);

    expect(result.success).toBe(true);
    expect(result.transactions[0].accountName).toBe('صيدلية من العمود الثاني');
    state.rows = null;
  });
});
