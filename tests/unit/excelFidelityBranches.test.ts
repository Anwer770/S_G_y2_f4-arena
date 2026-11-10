// @vitest-environment jsdom
/**
 * أفرع الربط والأمانة في الاستيراد/التصدير (R52) — الجزء الثالث.
 *
 * تركيز هذا الملف: (١) التاريخ غير الصالح لا يُنتج يوماً مختلَقاً، (٢) الأعمدة الغائبة
 * لا تُربَط بأعمدة أخرى، (٣) الحقول الاختيارية الغائبة (`undefined`) لا تصير نصاً `undefined`،
 * (٤) ملف بلا أي سطر صالح يقول ذلك صراحةً.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';
import type { Customer, FinancialTransaction, MovementRecord, Product, Task } from '../../src/types';
import { normalizeDate } from '../../src/utils/stock';
import {
  exportCustomersToExcel,
  exportFinancialToExcel,
  exportRecordsToCSV,
  exportRecordsToExcel,
  exportTasksToCSV,
  exportTasksToExcel,
  downloadStockRecordsExcelTemplate,
} from '../../src/utils/excel/excelExporters';
import {
  parseCustomersExcelFile,
  parseExcelForImport,
  parseFinancialExcelOrCSV,
} from '../../src/utils/excel/excelImporters';

let captured: { blob: Blob | null; filename: string } = { blob: null, filename: '' };

const bytesOf = (blob: Blob): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });

const sheetBytes = (rows: Record<string, unknown>[]): Uint8Array => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'ورقة');
  return new Uint8Array(XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer);
};

beforeEach(() => {
  captured = { blob: null, filename: '' };
  Object.defineProperty(Blob.prototype, 'arrayBuffer', {
    configurable: true,
    value(this: Blob) {
      return bytesOf(this).then((b) => b.buffer);
    },
  });
  vi.stubGlobal(
    'URL',
    Object.assign(URL, {
      createObjectURL: (blob: Blob) => {
        captured.blob = blob;
        return 'blob:qeema-test';
      },
      /* لا شيء: jsdom لا يحرّر روابط blob */
      revokeObjectURL: () => undefined,
    })
  );
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    captured.filename = this.download;
  });
});

const products = [{ id: 'P-1', name: 'باراسيتامول 500', openingStock: 0, unit: 'علبة', isActive: true }] as Product[];

describe('التاريخ غير الصالح لا يخترع يوماً', () => {
  it('normalizeDate يمرّر الشكل لا المعنى، والتاريخ غير الصالح لا يُنتج «السبت»', async () => {
    /* 2026-13-45 يمرّ من فحص الشكل في `normalizeDate` لكن `new Date()` يرفضه */
    expect(normalizeDate('2026-13-45')).toBe('2026-13-45');

    const result = await parseFinancialExcelOrCSV(
      new File([sheetBytes([{ 'اسم الحساب': 'صيدلية', التاريخ: '2026-13-45', 'المبلغ (ريال يمني)': 10 }])], 'x.xlsx'),
      []
    );

    expect(result.success).toBe(true);
    expect(result.transactions[0].day).toBe('');
    expect(result.transactions[0].date).toBe('2026-13-45');
  });
});

describe('ملف بلا أي سطر صالح: يقول ذلك ولا ينجح زوراً', () => {
  it('صفوف موجودة لكن كلها بلا حساب/مبلغ/وصف/حركة ⇒ success=false', async () => {
    const result = await parseFinancialExcelOrCSV(
      new File(
        [
          sheetBytes([
            { 'اسم الحساب': '', 'المبلغ (ريال يمني)': '', الوصف: '', الحركة: '' },
            { 'اسم الحساب': '', 'المبلغ (ريال يمني)': '', الوصف: '', الحركة: '' },
          ]),
        ],
        'x.xlsx'
      ),
      []
    );

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('لم يتم العثور على أسطر قيود مالية صالحة');
    expect(result.totalRows).toBe(2);
  });

  it('سطر كامل الحقول لا يُسجَّل فيه أي نقص', async () => {
    const result = await parseFinancialExcelOrCSV(
      new File(
        [
          sheetBytes([
            {
              'رقم القيد': 'ACC-1',
              اليوم: 'الأحد',
              التاريخ: '2026-11-01',
              'درجة الأهمية': 'A',
              الحركة: 'ايرادات',
              'نوع القيد': 'سند قبض',
              'طريقة الدفع': 'نقدا',
              'فئة الحساب': 'تحصيل',
              'حساب التقييد': 'الصندوق',
              'اسم الحساب': 'صيدلية',
              الوصف: 'دفعة',
              'رقم السند': '10',
              'المبلغ (ريال يمني)': 5,
              'المبلغ (ريال سعودي)': 1,
              'المبلغ (دولار)': 1,
            },
          ]),
        ],
        'x.xlsx'
      ),
      []
    );

    expect(result.transactions[0].id).toBe('ACC-1');
    expect(result.warnings.join(' ')).toContain('مطابقة للملف');
  });
});

describe('أعمدة غائبة في مستورِد المخزون', () => {
  it('ورقة بأعمدة ناقصة: لا انهيار، والمفاتيح تُولَّد، والتاريخ والتاريخ الفارغ يُسجَّلان', async () => {
    const result = await parseExcelForImport(
      new File([sheetBytes([{ 'Beneficiary Name': 'صيدلية', 'باراسيتامول 500': 2 }])], 'x.xlsx'),
      [],
      products,
      2026
    );

    const row = result.parsedRecords[0];
    expect(row.mainId).toMatch(/^AUTO-MAIN-/);
    expect(row.subId).toMatch(/^AUTO-(IN|OUT)-/);
    expect(row.date).toBe('');
    expect(result.warnings.join(' ')).toContain('خلية فارغة');
  });

  it('ترويسة فارغة لا تُعدّ صنفاً', async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ['Sub_ID', '', 'date'],
        ['IN-1', 5, '2026-11-01'],
      ]),
      'S'
    );
    const bytes = new Uint8Array(XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer);

    const result = await parseExcelForImport(new File([bytes], 'x.xlsx'), [], products, 2026);

    expect(result.matchedProductsCount).toBe(0);
    expect(result.parsedRecords[0].items).toEqual({});
  });
});

describe('الحقول الغائبة (undefined) لا تتحوّل إلى نص «undefined»', () => {
  it('سجل حركة بلا معرّف رئيسي ولا ملاحظة ولا بنود', async () => {
    const record = {
      id: 'IN-1',
      subId: 'IN-1',
      date: '2026-11-01',
      movementType: 'توريد',
      items: {},
    } as unknown as MovementRecord;

    exportRecordsToExcel([record], products);
    const wb = XLSX.read(await bytesOf(captured.blob as Blob), { type: 'array' });
    const row = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]])[0];

    expect(row.Main_ID).toBe('');
    expect(row.note).toBe('');
    expect(JSON.stringify(row)).not.toContain('undefined');
  });

  it('CSV بلا قائمة أصناف يستخدم القائمة الافتراضية ولا يكتب undefined', async () => {
    const record = { id: 'IN-2', subId: 'IN-2', movementType: 'صرف', items: {} } as unknown as MovementRecord;

    exportRecordsToCSV([record]);
    const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(await bytesOf(captured.blob as Blob));

    expect(text).not.toContain('undefined');
    const [header, data] = text.split('\n');
    expect(header).toContain('Main_ID');
    expect(data.split('","').length).toBeGreaterThan(9);
  });

  it('معاملة مالية بحقول غائبة تُصدَّر بفراغ لا بـ«undefined»', async () => {
    exportFinancialToExcel([{ id: 'ACC-9', amountYER: 0 } as unknown as FinancialTransaction]);
    const wb = XLSX.read(await bytesOf(captured.blob as Blob), { type: 'array' });
    const row = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]])[0];

    expect(row['اسم الحساب']).toBe('');
    expect(JSON.stringify(row)).not.toContain('undefined');
  });

  it('عميل بلا حقول اختيارية: العمود فارغ، والمهمة بلا وصف ولا التزامات', async () => {
    exportCustomersToExcel(
      [{ id: 'C-1', subId: 'S-1', name: 'عميل' } as unknown as Customer],
      [{ id: 'V-1', customerId: 'C-1' } as never]
    );
    const wb = XLSX.read(await bytesOf(captured.blob as Blob), { type: 'array' });
    expect(wb.SheetNames).toEqual(['دليل العملاء', 'سجل الزيارات الميدانية']);
    const row = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['دليل العملاء'])[0];
    expect(row['آخر زيارة']).toBe('');
    expect(JSON.stringify(row)).not.toContain('undefined');

    const visits = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['سجل الزيارات الميدانية'])[0];
    expect(visits['المبلغ المحصل (ريال)']).toBe(0);
    expect(JSON.stringify(visits)).not.toContain('undefined');
  });

  it('مهام CSV والتزامات غائبة: لا undefined في الملف', async () => {
    exportTasksToCSV([{ id: 'T-1', title: 'مهمة', start: '2026-11-01' } as unknown as Task]);
    const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(await bytesOf(captured.blob as Blob));
    expect(text).not.toContain('undefined');

    exportTasksToExcel(
      [{ id: 'T-1', title: 'م' } as unknown as Task],
      [{ id: 'CM-1', name: 'التزام', amount: 5, pri: 'A', status: 'x' } as never]
    );
    const tasksWb = XLSX.read(await bytesOf(captured.blob as Blob), { type: 'array' });
    const commitment = XLSX.utils.sheet_to_json<Record<string, unknown>>(tasksWb.Sheets['الالتزامات المالية'])[0];
    expect(commitment['تاريخ الاستحقاق']).toBe('');
    expect(JSON.stringify(commitment)).not.toContain('undefined');
  });

  it('مستورِد العملاء: معرّفان موجودان لا يولّد شيئاً', async () => {
    const result = await parseCustomersExcelFile(
      new File(
        [
          sheetBytes([
            { 'المعرف الرئيسي (Main_ID)': 'CUST-7', 'المعرف الفرعي (Sub_ID)': 'SUB-7', 'اسم العميل / المنشأة': 'عميل' },
          ]),
        ],
        'x.xlsx'
      )
    );

    expect(result.customers[0].id).toBe('CUST-7');
    expect(result.warnings.join(' ')).not.toContain('= AUTO-');
  });
});

describe('قالب المخزون: قائمة أصناف فارغة أو ممتلئة', () => {
  it('بلا أصناف تُستخدم الأصناف الافتراضية، ومعها تُستخدم أسماؤها بالترتيب', async () => {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const path = await import('node:path');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qeema-stk-'));
    const cwd = process.cwd();
    process.chdir(dir);
    try {
      downloadStockRecordsExcelTemplate();
      const name = fs.readdirSync(dir)[0];
      const wb1 = XLSX.read(fs.readFileSync(path.join(dir, name)), { type: 'buffer' });
      const header1 = XLSX.utils.sheet_to_json<string[]>(wb1.Sheets[wb1.SheetNames[0]], { header: 1 })[0];
      expect(header1).toHaveLength(9 + 15);

      const three = [1, 2, 3].map(
        (i) => ({ id: `P-${i}`, name: `صنف ${i}`, openingStock: 0, unit: 'علبة', isActive: true }) as Product
      );
      /* الاسم نفسه، فالثاني يستبدل الأول — نقرأ الملف بعد كل نداء */
      downloadStockRecordsExcelTemplate(three);
      const wb2 = XLSX.read(fs.readFileSync(path.join(dir, name)), { type: 'buffer' });
      const header2 = XLSX.utils.sheet_to_json<string[]>(wb2.Sheets[wb2.SheetNames[0]], { header: 1 })[0];
      expect(header2.slice(9)).toEqual(['صنف 1', 'صنف 2', 'صنف 3']);
    } finally {
      process.chdir(cwd);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 30_000);
});

describe('أفرع التصدير المكمّلة — القيم الموجودة لا تُستبدل', () => {
  it('سجل كامل الحقول في CSV وExcel: كل قيمة موجودة تُكتب كما هي', async () => {
    const full = {
      id: 'IN-77',
      mainId: 'Categ-7',
      subId: 'IN-77',
      date: '2026-11-03',
      beneficiary: 'مؤسسة',
      description: 'وصف',
      movementType: 'توريد',
      status: 'تم التنفيذ',
      category: 'مشتريات',
      items: { 'باراسيتامول 500': 4 },
      note: 'ملاحظة',
    } as MovementRecord;

    exportRecordsToCSV([full], products);
    const csv = new TextDecoder('utf-8', { ignoreBOM: true }).decode(await bytesOf(captured.blob as Blob));
    expect(csv).toContain('"Categ-7"');
    expect(csv).toContain('"IN-77"');
    expect(csv).toContain('"توريد"');

    exportRecordsToExcel([full], products);
    const wb = XLSX.read(await bytesOf(captured.blob as Blob), { type: 'array' });
    const row = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]])[0];
    expect(row.Sub_ID).toBe('IN-77');
    expect(row.Movement).toBe('توريد');
  });

  it('مهام كاملة الحقول في CSV: لا سطر «undefined» ولا قيمة مبتورة', async () => {
    const task = {
      id: 'T-9',
      sub: 'S-9',
      start: '2026-11-01',
      end: '2026-11-09',
      title: 'مهمة كاملة',
      desc: 'وصف',
      cat: 'فئة',
      op: 'عملية',
      pri: 'عالية',
      status: 'قيد التنفيذ',
      resp: 'انور',
      amount: 700,
    } as unknown as Task;

    exportTasksToCSV([task]);
    const csv = new TextDecoder('utf-8', { ignoreBOM: true }).decode(await bytesOf(captured.blob as Blob));

    expect(csv).toContain('"T-9"');
    expect(csv).toContain('"2026-11-01"');
    expect(csv).toContain('"مهمة كاملة"');
    expect(csv).toContain('"700"');
  });

  it('عميل بلا معرّفين: يُصدَّر بمعرّف بديل ظاهر لا بفراغ', async () => {
    exportCustomersToExcel([{ name: 'عميل بلا معرّف' } as unknown as Customer]);
    const wb = XLSX.read(await bytesOf(captured.blob as Blob), { type: 'array' });
    const row = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['دليل العملاء'])[0];

    expect(row['المعرف الرئيسي (Main_ID)']).toBe('CUST-1001');
    expect(row['المعرف الفرعي (Sub_ID)']).toBe('');
  });

  it('عميل بتاريخ انتهاء حاضر: القيمة تُكتب ولا تُستبدل', async () => {
    const result = await parseCustomersExcelFile(
      new File([sheetBytes([{ 'اسم العميل / المنشأة': 'عميل', 'تاريخ الانتهاء': '2026-12-01' }])], 'x.xlsx')
    );

    expect(result.customers[0].dateEnd).toBe('2026-12-01');
  });
});

describe('مستورِد المخزون: مفاتيح مولّدة من نوعَي الحركة', () => {
  it('صف توريد بلا رقم فرعي يأخذ بادئة IN، والحركة تُستنتج من الكلمة', async () => {
    const result = await parseExcelForImport(
      new File([sheetBytes([{ 'Beneficiary Name': 'مورد', Movement: 'توريد', date: '2026-11-01' }])], 'x.xlsx'),
      [],
      products,
      2026
    );

    expect(result.parsedRecords[0].subId).toMatch(/^AUTO-IN-/);
    expect(result.parsedRecords[0].movementType).toBe('توريد');
  });
});

describe('المستورِد المالي: حسابٌ غائب مع مبلغ حاضر (السطر غير فارغ)', () => {
  it('يُسجَّل نقص اسم الحساب صريحاً ولا يُتخطّى السطر', async () => {
    const result = await parseFinancialExcelOrCSV(
      new File([sheetBytes([{ 'اسم الحساب': '', 'المبلغ (ريال يمني)': 15 }])], 'x.xlsx'),
      []
    );

    expect(result.success).toBe(true);
    expect(result.transactions[0].accountName).toBe('');
    expect(result.transactions[0].amountYER).toBe(15);
  });
});

describe('الحقول الغائبة تماماً (بلا قيمة) في التصدير', () => {
  it('Excel: سجل بلا Sub_ID ولا Movement ⇒ خليتان فارغتان لا «undefined»', async () => {
    exportRecordsToExcel([{ id: 'IN-5', items: {} } as unknown as MovementRecord], products);
    const wb = XLSX.read(await bytesOf(captured.blob as Blob), { type: 'array' });
    const row = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]])[0];

    expect(row.Sub_ID).toBe('');
    expect(row.Movement).toBe('');
  });

  it('CSV: سجل بلا Sub_ID ولا Movement ⇒ أعمدة فارغة', async () => {
    exportRecordsToCSV([{ id: 'IN-6', items: {} } as unknown as MovementRecord]);
    const csv = new TextDecoder('utf-8', { ignoreBOM: true }).decode(await bytesOf(captured.blob as Blob));

    /* أعمدة CSV: Main_ID, Sub_ID, date — الثلاثة غائبة هنا */
    expect(csv.split('\n')[1].startsWith('"","",""')).toBe(true);
    expect(csv).not.toContain('undefined');
  });

  it('CSV المهام: مهمة بلا معرّف ولا بداية ولا عنوان ⇒ أعمدة فارغة', async () => {
    exportTasksToCSV([{ desc: 'بلا حقول' } as unknown as Task]);
    const csv = new TextDecoder('utf-8', { ignoreBOM: true }).decode(await bytesOf(captured.blob as Blob));

    expect(csv.split('\n')[1].startsWith('"",""')).toBe(true);
    expect(csv).not.toContain('undefined');
  });
});

describe('خلايا فارغة في أعمدة موجودة (المستورِد)', () => {
  it('أعمدة معروفة بلا قيم: تُقرأ فراغاً وتُسجَّل، والصف يبقى لوجود خلية أخرى', async () => {
    const result = await parseExcelForImport(
      new File(
        [
          sheetBytes([
            {
              Main_ID: '',
              Sub_ID: '',
              date: '',
              'Beneficiary Name': '',
              Description: '',
              Movement: '',
              Cases: '',
              Category: '',
              note: 'ملاحظة فقط',
            },
          ]),
        ],
        'x.xlsx'
      ),
      [],
      products,
      2026
    );

    const row = result.parsedRecords[0];
    expect(row.note).toBe('ملاحظة فقط');
    expect(row.mainId).toMatch(/^AUTO-MAIN-/);
    expect(result.warnings.join(' ')).toContain('خلية فارغة');
  });
});

describe('سقف الصفوف في مستورِد المخزون يُعلَن للمستخدم', () => {
  it('ملف أكبر من 20,000 صف: تحذير اقتطاع صريح لا استيراد صامت', async () => {
    const rows: Record<string, unknown>[] = [];
    for (let i = 0; i < 20005; i += 1) {
      rows.push({ Main_ID: `C-${i}`, Sub_ID: `IN-${i}`, date: '2026-11-01', 'باراسيتامول 500': 1 });
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'كبير');
    const bytes = new Uint8Array(XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer);

    const result = await parseExcelForImport(new File([bytes], 'كبير.xlsx'), [], products, 2026);

    expect(result.warnings.join(' ')).toContain('أكبر من 20000 صفاً');
    expect(result.validRows).toBe(20000);
  }, 120_000);
});
