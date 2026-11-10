/** R56 — فروع بدائل ترويسات الاستيراد الموحّد وأخطاء القارئ. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const safe = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[] | undefined,
  warnings: [] as string[],
  assertFileSize: vi.fn(),
  readFirstSheetSafe: vi.fn(() => ({ rows: safe.rows })),
  safeSheetWarnings: vi.fn(() => safe.warnings),
}));

vi.mock('../../src/utils/xlsxSafe', () => ({
  assertFileSize: safe.assertFileSize,
  readFirstSheetSafe: safe.readFirstSheetSafe,
  safeSheetWarnings: safe.safeSheetWarnings,
}));

import {
  parseCustomersExcelFile,
  parseCustodyExcelFile,
  parseDailyTasksExcelFile,
  parseDebtsExcelFile,
  parseLinksExcelFile,
  parseNotesExcelFile,
  parseRoutinesExcelFile,
  parseStockExcelFile,
  readFileToRows,
} from '../../src/utils/universalImporters';

class SuccessfulFileReader {
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;

  readAsBinaryString(): void {
    this.onload?.({ target: { result: 'binary' } } as unknown as ProgressEvent<FileReader>);
  }
}

class FailingFileReader {
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;

  readAsBinaryString(): void {
    this.onerror?.({} as ProgressEvent<FileReader>);
  }
}

const file = {} as File;

beforeEach(() => {
  safe.rows = [];
  safe.warnings = [];
  safe.assertFileSize.mockReset();
  safe.readFirstSheetSafe.mockClear();
  safe.safeSheetWarnings.mockClear();
  vi.stubGlobal('FileReader', SuccessfulFileReader);
});

afterEach(() => vi.unstubAllGlobals());

describe('قارئ الملف', () => {
  it('يمرر التحذيرات، ويعيد صفوفاً فارغة عند غيابها، ويرفض أخطاء القراءة أو الحارس', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    safe.rows = undefined;
    safe.warnings = ['تنبيه الحارس'];
    await expect(readFileToRows(file)).resolves.toEqual([]);
    expect(safe.assertFileSize).toHaveBeenCalledWith(file);
    expect(warning).toHaveBeenCalledWith('[import]', 'تنبيه الحارس');

    safe.assertFileSize.mockImplementationOnce(() => {
      throw new Error('ملف مرفوض');
    });
    await expect(readFileToRows(file)).rejects.toThrow('ملف مرفوض');

    vi.stubGlobal('FileReader', FailingFileReader);
    await expect(readFileToRows(file)).rejects.toThrow('فشلت قراءة الملف');
  });
});

describe('كل بدائل ترويسات وحدات الاستيراد', () => {
  it('يقرأ الاسم العربي والإنجليزي والبدائل الأخيرة من دون اختراع قيمة', async () => {
    safe.rows = [
      {
        Book: 'التزامات',
        Name: 'إنجليزي',
        Amount: 1,
        Currency: 'USD',
        'نوع المعاملة': 'علينا',
        Category: 'X',
        Date: '2026-11-01',
        'Due Date': '2026-11-02',
        المسؤول: 'م',
        Notes: 'n',
      },
      {
        الدفتر: 'دين قديم',
        الاسم: 'عربي',
        المبلغ: 2,
        العملة: 'YER',
        النوع: 'طلب',
        التصنيف: 'Y',
        التاريخ: '2026-11-01',
        'تاريخ الاستحقاق': '2026-11-02',
        'الشخص المسؤول': 'م',
        ملاحظات: 'n',
      },
      {
        'دفتر الحساب': 'دين زها',
        الجهة: 'جهة',
        المبلغ: 0,
        العملة: '',
        النوع: '',
        التصنيف: '',
        التاريخ: '',
        'تاريخ الاستحقاق': '',
        المسؤول: '',
        ملاحظات: '',
      },
      {},
    ];
    const debts = await parseDebtsExcelFile(file);
    expect(debts.count).toBe(4);

    safe.rows = [
      {
        النوع: 'صرف',
        الكود: 'OUT-code',
        Date: '2026-11-01',
        الصنف: 'صنف عربي',
        Quantity: 1,
        العميل: 'عميل',
        Notes: 'n',
      },
      {
        Type: 'IN',
        'المعرف الفرعي': 'IN-direct',
        التاريخ: '2026-11-01',
        Item: 'English item',
        الكمية: 2,
        الجهة: 'جهة',
        ملاحظات: 'n',
      },
      { 'نوع الحركة': '', 'رقم السند': '', 'اسم الصنف': 'بلا سند', الكمية: 3 },
    ];
    const stock = await parseStockExcelFile(file);
    expect(stock.movements.map((movement) => movement.subId)).toEqual(['OUT-code', 'IN-direct', 'AUTO-IN-0004']);

    safe.rows = [
      {
        المهمة: 'عربي',
        Category: 'تصنيف E',
        Operation: 'عملية E',
        Priority: 'CRITICAL',
        Assignee: 'م',
        'Due Date': '2026-11-08',
        الوصف: 'd',
        Status: 'completed',
      },
      {
        Title: 'إنجليزي',
        التصنيف: 'تصنيف ع',
        العملية: 'عملية ع',
        الأولوية: 'HIGH',
        المسؤول: 'م',
        'تاريخ الاستحقاق': '2026-11-08',
        ملاحظات: 'd',
        الحالة: 'new',
      },
      { 'عنوان المهمة': 'Arabic', الأولوية: 'MEDIUM', الحالة: 'cancelled' },
      { 'عنوان المهمة': 'Arabic2', الأولوية: 'LOW', الحالة: 'postponed' },
      { 'عنوان المهمة': 'Arabic3', الأولوية: 'x', الحالة: 'overdue' },
      { 'عنوان المهمة': 'Arabic4', الأولوية: 'عاجلة', الحالة: 'goal' },
      { 'عنوان المهمة': 'Arabic5', الأولوية: 'عالية جدا', الحالة: 'migrated' },
      { 'عنوان المهمة': 'Arabic6', الأولوية: 'متوسط', الحالة: 'deferred' },
      {},
      { الحالة: 'قيد التنفيذ' },
    ];
    const tasks = await parseDailyTasksExcelFile(file);
    expect(tasks.tasks.map((task) => [task.pri, task.status])).toEqual([
      ['A', 'تم الانجاز'],
      ['B', 'مخطط'],
      ['C', 'ملغي'],
      ['D', 'مؤجل'],
      ['B', 'متأخر'],
      ['A', 'الهدف'],
      ['A', 'تم ترحيل'],
      ['C', 'مؤجل'],
      ['C', 'مخطط'],
      ['C', 'قيد التنفيذ'],
    ]);

    safe.rows = [
      {
        الكود: 'S-1',
        'اسم العميل': 'عميل 1',
        المنطقة: 'صنعاء',
        المسار: 'السبت',
        الهاتف: '1',
        المسؤول: 'م',
        المديونية: 2,
      },
      {
        'كود العميل': 'S-2',
        الاسم: 'عميل 2',
        المحافظة: 'إب',
        'المسار / اليوم': 'الأحد',
        'رقم الهاتف': '2',
        'الشخص المسؤول': 'ن',
        'مديونية سابقة': 3,
        ملاحظات: 'n',
      },
      { Name: 'عميل 3' },
    ];
    expect((await parseCustomersExcelFile(file)).count).toBe(3);

    safe.rows = [
      { الروتين: 'R1', المدة: 20, الوصف: 'وصف' },
      { Title: 'R2', 'المدة (دقائق)': 0, ملاحظات: 'ملاحظة' },
      { 'اسم الروتين': '', 'المدة (دقائق)': 'غير رقم', الهدف: 'هدف' },
      {},
    ];
    expect((await parseRoutinesExcelFile(file)).count).toBe(4);

    safe.rows = [
      { العنوان: 'N1', النص: 'C1', Tags: 'a,b' },
      { Title: 'N2', Content: 'C2', الوسوم: 'ج،د' },
      { 'عنوان الملاحظة': '', المحتوى: '', التصنيف: '', التاريخ: '' },
    ];
    expect((await parseNotesExcelFile(file)).count).toBe(3);

    safe.rows = [
      { Section: 'issue', العنوان: 'I1', الملاحظات: 'وصف', المسؤول: 'م', المبلغ: 2 },
      { القسم: 'custody', الاسم: 'I2', الوصف: 'و', 'الشخص المسؤول': 'ن', التصنيف: 'فئة', المبلغ: 0, التاريخ: '' },
      { القسم: '', 'العنوان / البيان': '', العملة: '' },
    ];
    expect((await parseCustodyExcelFile(file)).count).toBe(3);

    safe.rows = [
      { 'اسم الموقع': 'L1', الرابط: 'https://one.example', الوصف: 'D1', 'مميز بنجمة': 'نعم' },
      { العنوان: 'L2', URL: 'https://two.example' },
      { 'عنوان الرابط': '', 'الرابط (URL)': '', 'مميز بنجمة': '' },
    ];
    expect((await parseLinksExcelFile(file)).count).toBe(3);
  });
});
