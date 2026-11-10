/** R56 — القوالب الموحدة تخرج فعلاً كـXLSX RTL وبالترويسات التي يقرأها المستورِد. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const xlsx = vi.hoisted(() => ({
  jsonToSheet: vi.fn(() => ({}) as Record<string, unknown>),
  bookNew: vi.fn(() => ({ workbook: true })),
  bookAppendSheet: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: xlsx.jsonToSheet,
    book_new: xlsx.bookNew,
    book_append_sheet: xlsx.bookAppendSheet,
  },
  writeFile: xlsx.writeFile,
}));

import {
  downloadCustodyExcelTemplate,
  downloadCustomersExcelTemplate,
  downloadDailyTasksExcelTemplate,
  downloadDebtsExcelTemplate,
  downloadDoctorsExcelTemplate,
  downloadFinancialExcelTemplate,
  downloadLinksExcelTemplate,
  downloadNotesExcelTemplate,
  downloadRoutinesExcelTemplate,
  downloadStockExcelTemplate,
  saveRTLWorkbook,
} from '../../src/utils/universalDataTemplates';

beforeEach(() => {
  xlsx.jsonToSheet.mockReset();
  xlsx.jsonToSheet.mockImplementation(() => ({}));
  xlsx.bookNew.mockClear();
  xlsx.bookAppendSheet.mockClear();
  xlsx.writeFile.mockClear();
});

describe('كاتب مصنف RTL', () => {
  it('ينشئ ورقة ومصنفاً واتجاهاً من اليمين إلى اليسار حين لا تكون views موجودة', () => {
    saveRTLWorkbook([{ الاسم: 'صف' }], 'ورقة', 'قالب.xlsx');

    const sheet = xlsx.jsonToSheet.mock.results[0].value as { ['!views']?: unknown[] };
    expect(sheet['!views']).toEqual([{ rightToLeft: true }]);
    expect(xlsx.bookAppendSheet).toHaveBeenCalledWith({ workbook: true }, sheet, 'ورقة');
    expect(xlsx.writeFile).toHaveBeenCalledWith({ workbook: true }, 'قالب.xlsx');
  });

  it('يحافظ على مصفوفة views الموجودة ويضيف اتجاه RTL إليها', () => {
    const sheet: Record<string, unknown> = { '!views': [{ zoom: 90 }] };
    xlsx.jsonToSheet.mockReturnValueOnce(sheet);

    saveRTLWorkbook([], 'موجودة', 'existing.xlsx');

    expect(sheet['!views']).toEqual([{ zoom: 90 }, { rightToLeft: true }]);
  });
});

describe('قوالب الوحدات العشرة', () => {
  it('تنتج كل القوالب ملفات XLSX عربية بأمثلة وترويسات القراءة المطابقة', () => {
    const templates = [
      downloadFinancialExcelTemplate,
      downloadDebtsExcelTemplate,
      downloadStockExcelTemplate,
      downloadDailyTasksExcelTemplate,
      downloadCustomersExcelTemplate,
      downloadDoctorsExcelTemplate,
      downloadRoutinesExcelTemplate,
      downloadNotesExcelTemplate,
      downloadCustodyExcelTemplate,
      downloadLinksExcelTemplate,
    ];
    templates.forEach((download) => download());

    expect(xlsx.writeFile).toHaveBeenCalledTimes(10);
    expect(xlsx.writeFile.mock.calls.map(([, filename]) => filename)).toEqual([
      'نموذج_استيراد_السجل_اليومي.xlsx',
      'نموذج_استيراد_الديون_والالتزامات.xlsx',
      'نموذج_استيراد_سندات_صرف_وتوريد.xlsx',
      'نموذج_استيراد_المهام_اليومية.xlsx',
      'نموذج_استيراد_دليل_العملاء.xlsx',
      'نموذج_استيراد_دفتر_زيارات_الأطباء.xlsx',
      'نموذج_استيراد_الروتين_والعادات.xlsx',
      'نموذج_استيراد_الملاحظات_والمعرفة.xlsx',
      'نموذج_استيراد_العهد_والاشكاليات.xlsx',
      'نموذج_استيراد_مكتبة_الروابط.xlsx',
    ]);

    const rows = (xlsx.jsonToSheet.mock.calls as unknown as Array<[Record<string, unknown>[]]>).map(([value]) => value);
    expect(rows.every((sample) => sample.length >= 2)).toBe(true);
    expect(rows[1][0]).toEqual(
      expect.objectContaining({ 'دفتر الحساب': 'دين أنور', 'الاسم / الجهة': 'د. خلدون عبدالكريم' })
    );
    expect(rows[2][0]).toEqual(expect.objectContaining({ 'نوع الحركة': 'توريد (IN)', 'رقم السند': 'IN-2026-045' }));
    expect(rows[3][0]).toEqual(
      expect.objectContaining({ 'عنوان المهمة': 'متابعة طلبيات صيدليات شارع تعز', الأولوية: 'عالية' })
    );
    expect(rows[4][0]).toEqual(
      expect.objectContaining({ 'كود العميل': 'CUST-101', 'اسم العميل / الصيدلية': 'صيدلية النور الكبرى' })
    );
    expect(rows[5][0]).toEqual(expect.objectContaining({ 'اسم الطبيب / المركز': 'د. خالد عبدالجليل الشرجبي' }));
    expect(rows[6][0]).toEqual(expect.objectContaining({ 'اسم الروتين': 'مراجعة المبيعات الصباحية وجرد الصناديق' }));
    expect(rows[7][0]).toEqual(
      expect.objectContaining({ 'عنوان الملاحظة': 'خطة تسويق منتجات العناية الطبيعية الربع الأخير 2026' })
    );
    expect(rows[8][0]).toEqual(
      expect.objectContaining({ القسم: 'عهدة وحساب', 'العنوان / البيان': 'دفتر سندات قبض رقم (12)' })
    );
    expect(rows[9][0]).toEqual(
      expect.objectContaining({ 'عنوان الرابط': 'بوابة الهيئة العليا للأدوية والمستلزمات الطبية' })
    );
  });
});
