/**
 * حرّاس `xlsxSafe` عند مصنّف بلا أوراق (R52).
 *
 * `XLSX.read` في الإصدار الحالي يعيد ورقة افتراضية دائماً، فلا يمكن الوصول إلى فرع
 * «لا ورقة أولى» بملف حقيقي. هذا الملف يثبت أن الحارس يعمل إن تغيّر سلوك المكتبة يوماً:
 * يأتي بنتيجة `read` مصطنعة (بلا أوراق، ثم بورقة بلا كائن) ويتحقّق من العائد الآمن.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: { sheet_to_json: vi.fn(() => [{ a: 1 }]) },
}));

import * as XLSX from 'xlsx';
import { readFirstSheetAoaSafe, readFirstSheetSafe } from '../../src/utils/xlsxSafe';

describe('حاجز القراءة مع نتيجة مكتبة غير متوقّعة', () => {
  it('مصنّف بلا أسماء أوراق ⇒ صفر صفوف لا انهيار', () => {
    (XLSX.read as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue({ SheetNames: [], Sheets: {} });

    expect(readFirstSheetSafe(new Uint8Array([1]))).toEqual({ rows: [], truncated: false, sanitizedKeys: 0 });
    expect(readFirstSheetAoaSafe(new Uint8Array([1]))).toEqual({ rows: [], truncated: false });
  });

  it('اسم ورقة بلا كائن مطابق ⇒ صفر صفوف لا انهيار', () => {
    (XLSX.read as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue({
      SheetNames: ['موجودة'],
      Sheets: {},
    });

    expect(readFirstSheetSafe(new Uint8Array([1])).rows).toEqual([]);
    expect(readFirstSheetAoaSafe(new Uint8Array([1])).rows).toEqual([]);
  });

  it('حقل Sheets غائب كلياً (نتيجة مكتبة ناقصة) ⇒ صفر صفوف لا انهيار', () => {
    (XLSX.read as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue({ SheetNames: ['س'] });

    expect(readFirstSheetSafe(new Uint8Array([1])).rows).toEqual([]);
    expect(readFirstSheetAoaSafe(new Uint8Array([1])).rows).toEqual([]);
  });
});
