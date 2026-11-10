// @vitest-environment jsdom
/**
 * R56 — حلقة الاستيراد الموحّد: صف ملف حقيقي → عقد الوحدة.
 * نستعمل ملف XLSX فعلياً، لا mock للدوال الداخلية، لضمان أن ترويسات القوالب العربية
 * تصل إلى قارئ الحماية ثم إلى محلل كل وحدة كما تصل من زر الاستيراد في الواجهة.
 */
import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
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

function excelFile(rows: Record<string, unknown>[], name = 'import.xlsx'): File {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'استيراد');
  return new File([XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

describe('قارئ الملف الموحّد', () => {
  it('يقرأ الورقة الأولى الحقيقية بترويساتها العربية كما هي', async () => {
    const rows = await readFileToRows(excelFile([{ الاسم: 'صف صحيح', المبلغ: 12 }]));
    expect(rows).toEqual([{ الاسم: 'صف صحيح', المبلغ: 12 }]);
  });
});

describe('الديون والالتزامات', () => {
  it('يفصل الالتزام عن الديون ويحفظ الدفاتر والمدين/الدائن من الترويسات المعتمدة', async () => {
    const result = await parseDebtsExcelFile(
      excelFile([
        {
          'دفتر الحساب': 'دين أنور',
          'الاسم / الجهة': 'صيدلية أنور',
          المبلغ: 75,
          العملة: ' ريال يمني ',
          'نوع المعاملة': 'لنا (طلب)',
          التصنيف: 'مبيعات',
          التاريخ: '2026-11-01',
          'تاريخ الاستحقاق': '2026-11-10',
          'الشخص المسؤول': 'أنور',
          ملاحظات: 'مدين',
        },
        {
          الدفتر: 'دين سابق',
          الاسم: 'قديم',
          Amount: 20,
          Currency: 'USD',
          النوع: 'له',
          Date: '2026-11-02',
        },
        { الدفتر: 'دين زها', الجهة: 'زها', المبلغ: 30, النوع: 'له' },
        { الدفتر: 'دين علي قات', الجهة: 'علي', المبلغ: 40, النوع: 'له' },
        {
          'دفتر الحساب': 'التزامات وأقساط',
          'الاسم / الجهة': 'قسط السيارة',
          المبلغ: 300,
          العملة: 'دولار',
          'نوع المعاملة': 'علينا (التزام)',
          'تاريخ الاستحقاق': '2026-11-20',
          ملاحظات: 'قسط',
        },
      ])
    );

    expect(result.count).toBe(5);
    expect(result.debts.map((item) => item.book)).toEqual(['anwar', 'previous', 'zaha', 'ali_qat']);
    expect(result.debts[0]).toMatchObject({ debit: 75, credit: 0, name: 'صيدلية أنور', note: 'مدين' });
    expect(result.debts[1]).toMatchObject({ debit: 0, credit: 20, currency: 'USD' });
    expect(result.commitments[0]).toMatchObject({
      name: 'قسط السيارة',
      amount: 300,
      endDate: '2026-11-20',
      currency: 'دولار',
      note: 'قسط',
    });
  });
});

describe('حركات المخزون', () => {
  it('يتعرّف التوريد والصرف، ويستبعد الصف غير القابل للحفظ فقط', async () => {
    const { movements, count } = await parseStockExcelFile(
      excelFile([
        {
          'نوع الحركة': 'توريد (IN)',
          التاريخ: '2026-11-01',
          'اسم الصنف': 'سيروم',
          الكمية: -12,
          'رقم السند': 'IN-9',
          'الجهة / المورد': 'المورد',
          ملاحظات: 'توريد',
          التصنيف: 'مشتريات',
        },
        {
          Type: 'OUT',
          Date: '2026-11-02',
          Item: 'كريم',
          Quantity: 3,
          Sub_ID: 'OUT-9',
          العميل: 'الصيدلية',
          Notes: 'صرف',
        },
        { 'اسم الصنف': '', الكمية: 10 },
        { 'اسم الصنف': 'لا كمية', الكمية: 0 },
      ])
    );

    expect(count).toBe(2);
    expect(movements[0]).toMatchObject({ movementType: 'توريد', subId: 'IN-9', items: { سيروم: 12 } });
    expect(movements[1]).toMatchObject({ movementType: 'صرف', subId: 'OUT-9', items: { كريم: 3 } });
  });
});

describe('المهام اليومية', () => {
  it('يترجم الأولوية والحالة العربية والإنجليزية ويحفظ بقية حقول الصف', async () => {
    const { tasks, count } = await parseDailyTasksExcelFile(
      excelFile([
        {
          'عنوان المهمة': 'عاجلة',
          التصنيف: 'مبيعات',
          العملية: 'زيارة',
          الأولوية: 'عالية جداً',
          الحالة: 'مكتملة',
          المسؤول: 'أنور',
          'تاريخ الاستحقاق': '2026-11-08',
          ملاحظات: 'مكتملة',
        },
        { المهمة: 'مخططة', Priority: 'D', Status: 'planned', Assignee: 'أحمد', 'Due Date': '2026-11-09' },
        { Title: 'مؤجلة', الأولوية: 'منخفضة', الحالة: 'مؤجل' },
        { Title: 'متأخرة', الأولوية: 'متوسطة', الحالة: 'متأخر' },
        { Title: 'ملغاة', الأولوية: 'عالية', الحالة: 'ملغي' },
        { Title: 'هدف', الأولوية: 'حرجة', الحالة: 'الهدف' },
        { Title: 'مرحلة', الأولوية: 'مرتفع', الحالة: 'تم ترحيل' },
      ])
    );

    expect(count).toBe(7);
    expect(tasks.map((task) => [task.pri, task.status])).toEqual([
      ['A', 'تم الانجاز'],
      ['D', 'مخطط'],
      ['D', 'مؤجل'],
      ['C', 'متأخر'],
      ['B', 'ملغي'],
      ['A', 'الهدف'],
      ['B', 'تم ترحيل'],
    ]);
    expect(tasks[0]).toMatchObject({ cat: 'مبيعات', op: 'زيارة', resp: 'أنور', desc: 'مكتملة' });
  });
});

describe('عملاء وروتينات وملاحظات', () => {
  it('يحفظ العميل ذا الاسم فقط ولا يختلق صفاً للصف الفارغ', async () => {
    const { customers, count } = await parseCustomersExcelFile(
      excelFile([
        {
          'كود العميل': 'C-1',
          'اسم العميل / الصيدلية': 'صيدلية الأمل',
          المحافظة: 'صنعاء',
          'المسار / اليوم': 'السبت',
          'رقم الهاتف': '777',
          'الشخص المسؤول': 'أنور',
          'مديونية سابقة': 40,
          ملاحظات: 'مميز',
        },
        { 'كود العميل': 'C-2', المحافظة: 'إب' },
      ])
    );

    expect(count).toBe(1);
    expect(customers[0]).toMatchObject({ subId: 'C-1', name: 'صيدلية الأمل', balanceYER: 40, phone: '777' });
  });

  it('يبني الروتين والملاحظة من الحقول الموحّدة مع تفكيك وسوم العربية والإنجليزية', async () => {
    const routines = await parseRoutinesExcelFile(
      excelFile([
        {
          'اسم الروتين': 'مراجعة صباحية',
          التصنيف: 'مالي',
          الوقت: '08:30',
          'المدة (دقائق)': 45,
          الهدف: 'مطابقة',
        },
      ])
    );
    const notes = await parseNotesExcelFile(
      excelFile([
        {
          'عنوان الملاحظة': 'خطة',
          المحتوى: 'محتوى',
          النوع: 'خطة عمل',
          التصنيف: 'تسويق',
          الوسوم: 'أول، second, ثالث',
          التاريخ: '2026-11-03',
        },
      ])
    );

    expect(routines.routines[0]).toMatchObject({
      name: 'مراجعة صباحية',
      startTime: '08:30',
      duration: 45,
      description: 'مطابقة',
    });
    expect(notes.notes[0]).toMatchObject({
      title: 'خطة',
      content: 'محتوى',
      tags: ['أول', 'second', 'ثالث'],
      date: '2026-11-03',
    });
  });
});

describe('العهد والروابط', () => {
  it('يفصل الإشكالية عن العهد ويقرأ رابط القالب ومفضليته', async () => {
    const custody = await parseCustodyExcelFile(
      excelFile([
        { القسم: 'إشكالية معلقة', 'العنوان / البيان': 'فارق جرد', المبلغ: 10, التاريخ: '2026-11-01' },
        { Section: 'custody', الاسم: 'دفتر سندات', الوصف: 'عهدة', العملة: 'ريال يمني' },
      ])
    );
    const links = await parseLinksExcelFile(
      excelFile([
        {
          'عنوان الرابط': 'كانفا',
          'الرابط (URL)': 'https://canva.com',
          'التصنيف الأساسي': 'تصميم',
          الفئة: 'تسويق',
          النوع: 'أداة',
          الأهمية: 'A',
          'مميز بنجمة': 'نعم',
          الوصف: 'تصميم',
        },
        { 'اسم الموقع': 'بوابة', URL: 'https://example.com', 'مميز بنجمة': 'لا' },
      ])
    );

    expect(custody.records.map((record) => record.section)).toEqual(['issues', 'custody']);
    expect(custody.records[1]).toMatchObject({ name: 'دفتر سندات', desc: 'عهدة', currency: 'ريال يمني' });
    expect(links.links).toMatchObject([
      { siteName: 'كانفا', url: 'https://canva.com', isFavorite: true },
      { siteName: 'بوابة', url: 'https://example.com', isFavorite: false },
    ]);
  });
});
