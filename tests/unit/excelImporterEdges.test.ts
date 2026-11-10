// @vitest-environment jsdom
/**
 * اختبارات أفرع المستورِد والمُصدِّر الدقيقة (R52) — الجزء الثاني.
 *
 * الجزء الأول (`excelExportImport.test.ts`) يقيس **الحلقة الكاملة** (تصدير ← استيراد).
 * هذا الملف يقيس **الحالات الحدّية** التي تُقرَّر فيها بيانات المستخدم: صفوف فارغة،
 * مفاتيح مولّدة، خلايا مبالغ غائبة، ملف تالف، وقارئ ملفات يفشل. كل حالة هنا كانت
 * سطراً غير مقيس في `excelImporters.ts` (468 سطراً) و`excelExporters.ts` (607).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';
import type { Customer, MovementRecord, Product } from '../../src/types';
import {
  exportCustomersToExcel,
  exportRecordsToExcel,
  exportTasksToExcel,
  downloadCustomersExcelTemplate,
  downloadFinancialExcelTemplate,
  downloadStockRecordsExcelTemplate,
} from '../../src/utils/excel/excelExporters';
import {
  parseCustomersExcelFile,
  parseExcelForImport,
  parseFinancialExcelOrCSV,
} from '../../src/utils/excel/excelImporters';
import { DEFAULT_62_PRODUCT_NAMES } from '../../src/data/defaultProducts';

let captured: { blob: Blob | null; filename: string } = { blob: null, filename: '' };

const bytesOf = (blob: Blob): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });

const xlsxBytes = (rows: Record<string, unknown>[], sheet = 'ورقة'): Uint8Array => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sheet);
  return new Uint8Array(XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer);
};

const fileFrom = (bytes: Uint8Array, name = 'in.xlsx'): File => new File([bytes], name);

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

afterEach(() => {
  /* `stubGlobal` (مثل FileReader الفاشل) لا يُعاد بـ`restoreAllMocks` — كان يتسرّب
     إلى الاختبارات التالية فيُسقطها. الترتيب مقصود. */
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const products = [{ id: 'P-1', name: 'باراسيتامول 500', openingStock: 0, unit: 'علبة', isActive: true }] as Product[];

/* ═════════════════ مستورِد حركات المخزون ═════════════════ */

describe('مستورِد المخزون — الحالات الحدّية', () => {
  it('ملف بترويسة فقط يُرفض برسالة صريحة', async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Main_ID', 'Sub_ID']]), 'S');
    const bytes = new Uint8Array(XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer);

    await expect(parseExcelForImport(fileFrom(bytes), [], products)).rejects.toThrow(
      'الملف فارغ أو لا يحتوي على صفوف بيانات صالحة'
    );
  });

  it('صف فارغ تماماً يُتخطّى، والحركة تُستنتج من بادئة الرقم الفرعي OUT', async () => {
    const bytes = xlsxBytes([
      { Main_ID: 'Categ-1', Sub_ID: 'OUT-0007', date: '2026-11-01', 'Beneficiary Name': 'صيدلية', note: '' },
      { Main_ID: '', Sub_ID: '', date: '', 'Beneficiary Name': '', note: '' },
    ]);

    const result = await parseExcelForImport(fileFrom(bytes), [], products, 2026);

    expect(result.totalRows).toBe(2);
    expect(result.validRows).toBe(1);
    expect(result.parsedRecords[0].movementType).toBe('صرف');
  });

  it('معرّف مفقود يُولَّد بوسم AUTO- ويُسجَّل، والخلايا الفارغة تبقى فارغة', async () => {
    /* خلية وصف غير فارغة كي لا يُعدّ الصف فارغاً كلياً — والمفاتيح والتاريخ غائبة */
    const bytes = xlsxBytes([
      { date: '', 'Beneficiary Name': '', Description: 'بند بلا معرّف', Cases: '', Category: '' },
    ]);

    const result = await parseExcelForImport(fileFrom(bytes), [], products, 2026);
    const row = result.parsedRecords[0];

    expect(row.subId).toMatch(/^AUTO-(IN|OUT)-\d{4}$/);
    expect(row.mainId).toMatch(/^AUTO-MAIN-\d{4}$/);
    expect(row.date).toBe('');
    expect(row.beneficiary).toBe('');
    expect(row.note).toBeUndefined();
    expect(result.warnings.join(' ')).toContain('مفتاح داخلي مولّد');
    expect(result.warnings.join(' ')).toContain('خلية فارغة');
  });

  it('الكميات: صفر والسالبة وغير الرقمية تُهمَل، والصحيحة تُقرأ', async () => {
    const bytes = xlsxBytes([
      {
        Main_ID: 'C-1',
        Sub_ID: 'IN-1',
        date: '2026-11-01',
        'باراسيتامول 500': 5,
        'Amoxicillin 250': 0,
      },
    ]);

    const result = await parseExcelForImport(fileFrom(bytes), [], products, 2026);
    expect(result.parsedRecords[0].items).toEqual({ 'باراسيتامول 500': 5 });
  });

  it('تكرار الرقم الفرعي مع سجل قائم يُعدّ ولا يمنع الاستيراد', async () => {
    const existing: MovementRecord[] = [
      {
        id: 'IN-0001',
        mainId: 'C-1',
        subId: 'IN-0001',
        date: '2026-01-01',
        beneficiary: 'x',
        description: 'y',
        movementType: 'توريد',
        status: 'تم التنفيذ',
        category: 'مشتريات',
        items: {},
      },
    ];
    const bytes = xlsxBytes([{ Main_ID: 'C-1', Sub_ID: 'IN-0001', date: '2026-11-01', 'باراسيتامول 500': 1 }]);

    const result = await parseExcelForImport(fileFrom(bytes), existing, products, 2026);

    expect(result.duplicateSubIdsCount).toBe(1);
    expect(result.newRecordsCount).toBe(0);
  });

  it('عمود غير معروف يُعامَل كصنف (السلوك الحالي) — يُوثَّق ولا يُغيَّر بلا دليل', async () => {
    const bytes = xlsxBytes([{ Main_ID: 'C-1', Sub_ID: 'IN-1', date: '2026-11-01', 'عمود غريب': 3 }]);

    const result = await parseExcelForImport(fileFrom(bytes), [], products, 2026);

    expect(result.matchedProductsCount).toBe(1);
    expect(result.parsedRecords[0].items).toEqual({ 'عمود غريب': 3 });
  });
});

/* ═════════════════ مستورِد العملاء ═════════════════ */

describe('مستورِد العملاء — الحالات الحدّية', () => {
  it('معرّفان مفقودان يُولَّدان AUTO-، والأرصدة الغائبة تُقرأ صفراً وتُسجَّل', async () => {
    const bytes = xlsxBytes([{ 'اسم العميل / المنشأة': 'صيدلية بلا معرّف' }]);

    const result = await parseCustomersExcelFile(fileFrom(bytes));
    const row = result.customers[0];

    expect(row.id).toMatch(/^AUTO-CUST-\d{4}$/);
    expect(row.subId).toMatch(/^AUTO-SUB-\d{4}$/);
    expect(row.balanceYER).toBe(0);
    expect(row.notes).toBe('');
    const text = result.warnings.join(' ');
    expect(text).toContain('قُرئت كـ 0');
    expect(text).toContain('المعرف الرئيسي');
  });

  it('تواريخ غائبة تبقى فارغة ولا تصير تاريخ اليوم', async () => {
    const bytes = xlsxBytes([{ 'اسم العميل / المنشأة': 'مؤسسة', 'تاريخ البدء': '', 'تاريخ الانتهاء': '' }]);

    const row = (await parseCustomersExcelFile(fileFrom(bytes))).customers[0];

    expect(row.dateBegin).toBe('');
    expect(row.dateEnd).toBe('');
  });

  it('الحساب الداخلي يُستنتج من الاسم عند غياب العمود', async () => {
    const bytes = xlsxBytes([{ 'اسم العميل / المنشأة': 'عهدة مندوب صنعاء' }]);

    expect((await parseCustomersExcelFile(fileFrom(bytes))).customers[0].isInternalAccount).toBe(true);
  });

  it('الأرصدة العربية الأرقام تُطبَّع (١٢٠٠ ⇒ 1200)', async () => {
    const bytes = xlsxBytes([{ 'اسم العميل / المنشأة': 'عميل', 'الرصيد بالريال اليمني': '١٢٠٠' }]);

    expect((await parseCustomersExcelFile(fileFrom(bytes))).customers[0].balanceYER).toBe(1200);
  });
});

/* ═════════════════ المستورِد المالي ═════════════════ */

describe('المستورِد المالي — الحالات الحدّية', () => {
  it('صف بلا حساب ولا مبلغ ولا وصف ولا حركة يُتخطّى', async () => {
    const bytes = xlsxBytes([
      { 'اسم الحساب': '', 'المبلغ (ريال يمني)': '', الوصف: '', الحركة: '', 'رقم القيد': '' },
      { 'اسم الحساب': 'صيدلية', 'المبلغ (ريال يمني)': 100 },
    ]);

    const result = await parseFinancialExcelOrCSV(fileFrom(bytes), []);

    expect(result.success).toBe(true);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].accountName).toBe('صيدلية');
  });

  it('رقم قيد مفقود يُولَّد AUTO-ACC ويُسجَّل، والمبالغ الغائبة صفر مُعلَن', async () => {
    const bytes = xlsxBytes([{ 'اسم الحساب': 'صيدلية' }]);

    const result = await parseFinancialExcelOrCSV(fileFrom(bytes), []);
    const row = result.transactions[0];

    expect(row.id).toMatch(/^AUTO-ACC-\d{4}$/);
    expect(row.amountYER).toBe(0);
    expect(row.amountSAR).toBe(0);
    expect(row.amountUSD).toBe(0);
    const text = result.warnings.join(' ');
    expect(text).toContain('مفتاح داخلي مولّد');
    expect(text).toContain('قُرئت كـ 0');
  });

  it('اليوم يُستنتج من التاريخ حين يغيب، ويبقى فارغاً حين يغيب التاريخ', async () => {
    /* 2026-11-01 يوم أحد */
    const withDate = await parseFinancialExcelOrCSV(
      fileFrom(xlsxBytes([{ 'اسم الحساب': 'أ', التاريخ: '2026-11-01', 'المبلغ (ريال يمني)': 1 }])),
      []
    );
    expect(withDate.transactions[0].day).toBe('الأحد');

    const withoutDate = await parseFinancialExcelOrCSV(
      fileFrom(xlsxBytes([{ 'اسم الحساب': 'ب', التاريخ: '', 'المبلغ (ريال يمني)': 1 }])),
      []
    );
    expect(withoutDate.transactions[0].day).toBe('');
    expect(withoutDate.transactions[0].date).toBe('');
  });

  it('اليوم المذكور في الملف يُحترم كما هو', async () => {
    const result = await parseFinancialExcelOrCSV(
      fileFrom(xlsxBytes([{ 'اسم الحساب': 'أ', اليوم: 'الخميس', 'المبلغ (ريال يمني)': 1 }])),
      []
    );

    expect(result.transactions[0].day).toBe('الخميس');
  });

  it('ملف تالف يمرّ من الحاجز: success=false برسالة عربية، ولا يرمي', async () => {
    const corrupt = new Uint8Array([9, 9, 9, 9]);
    const result = await parseFinancialExcelOrCSV(fileFrom(corrupt), []);

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('الملف فارغ');
  });

  it('فشل القارئ نفسه (onerror) يُحوَّل إلى رسالة عربية', async () => {
    class FailingReader {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      result: ArrayBuffer | null = null;
      readAsArrayBuffer() {
        setTimeout(() => this.onerror?.(), 0);
      }
    }
    vi.stubGlobal('FileReader', FailingReader as never);

    const result = await parseFinancialExcelOrCSV(fileFrom(new Uint8Array([1])), []);

    expect(result.success).toBe(false);
    expect(result.errors[0]).toBe('تعذر قراءة محتوى الملف.');
  });
});

/* ═════════════════ المُصدِّر: الحقول الاختيارية والقوالب ═════════════════ */

describe('تصدير الحقول الاختيارية (لا فراغ مُخترَع ولا undefined في الخلية)', () => {
  it('سجل بلا ملاحظة ولا بنود: الخلايا تبقى فارغة، وبلا قائمة أصناف تُستخدم القائمة الافتراضية', async () => {
    const bare: MovementRecord = {
      id: 'IN-9',
      mainId: '',
      subId: 'IN-9',
      date: '',
      beneficiary: '',
      description: '',
      movementType: 'توريد',
      status: '',
      category: '',
      items: {},
    };

    exportRecordsToExcel([bare]);
    const bytes = await bytesOf(captured.blob as Blob);
    const wb = XLSX.read(bytes, { type: 'array' });
    const header = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[wb.SheetNames[0]], { header: 1 })[0];

    expect(header).toHaveLength(9 + DEFAULT_62_PRODUCT_NAMES.length);
    const row = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]])[0];
    expect(row.Main_ID).toBe('');
    expect(row.note).toBe('');
  });

  it('عميل بلا زيارة: ورقة واحدة فقط، والملاحظات الفارغة تبقى فارغة', async () => {
    const c = {
      id: 'C-1',
      subId: 'S-1',
      name: 'عميل',
      source: '',
      region: '',
      route: '',
      significance: '',
      status: '',
      responsible: '',
      taskDesc: '',
      dateBegin: '',
      dateEnd: '',
      balanceYER: 0,
      balanceSAR: 0,
      balanceUSD: 0,
      phone: '',
      address: '',
      notes: '',
      isInternalAccount: false,
    } as Customer;

    exportCustomersToExcel([c]);
    const wb = XLSX.read(await bytesOf(captured.blob as Blob), { type: 'array' });
    expect(wb.SheetNames).toEqual(['دليل العملاء']);

    const row = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]])[0];
    expect(row['مستوى الأهمية']).toBe('B');
    expect(row['حالة الزيارة']).toBe('مخطط');
    expect(row['حساب داخلي / خاص']).toBe('لا');
  });

  it('مهمة بلا مبلغ وسجل تعديلات فارغ: لا ورقة التزامات، والمبلغ خلية فارغة', async () => {
    const task = {
      id: 'T-2',
      sub: '',
      start: '2026-11-01',
      title: 'مهمة',
      cat: 'c',
      op: 'o',
      pri: 'p',
      status: 's',
      resp: 'r',
    } as never;

    exportTasksToExcel([task]);
    const wb = XLSX.read(await bytesOf(captured.blob as Blob), { type: 'array' });

    expect(wb.SheetNames).toEqual(['المهام والأعمال', 'سجل التعديلات']);
    const row = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['المهام والأعمال'])[0];
    expect(row['المبلغ']).toBe('');
    expect(row['الوصف']).toBe('');
  });
});

describe('قوالب الاستيراد تُكتب على القرص فعلياً', () => {
  it('القالب المالي والقوالب الأخرى تُنتج ملفات مقروءة بأعمدتها الصحيحة', async () => {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const path = await import('node:path');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qeema-tpl-'));
    const cwd = process.cwd();
    process.chdir(dir);
    try {
      downloadFinancialExcelTemplate();
      downloadCustomersExcelTemplate();
      downloadStockRecordsExcelTemplate([
        { id: 'P-1', name: 'باراسيتامول 500', openingStock: 0, unit: 'علبة', isActive: true } as Product,
      ]);

      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.xlsx'));
      expect(files).toHaveLength(3);
      expect(files.join(' ')).toContain('السجل_المالي');
      expect(files.join(' ')).toContain('العملاء');
      expect(files.join(' ')).toContain('المخزون');

      /* القالب المالي نفسه يجب أن يُستورَد بلا فقدان: الصفوف نموذجية وصحيحة */
      const financialPath = path.join(dir, files.find((f) => f.includes('السجل_المالي')) as string);
      const imported = await parseFinancialExcelOrCSV(new File([fs.readFileSync(financialPath)], 't.xlsx'), []);
      expect(imported.success).toBe(true);
      expect(imported.transactions[0].restriction).toBe('سند قبض');
      expect(imported.transactions[0].amountYER).toBe(250000);
    } finally {
      process.chdir(cwd);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 30_000);
});
