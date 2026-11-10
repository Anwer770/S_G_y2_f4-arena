// @vitest-environment jsdom
/**
 * اختبارات تصدير/استيراد Excel وCSV (R52) — الحلقة الكاملة: ما نُصدِّره يجب أن يُستورَد.
 *
 * `excelExporters.ts` (607 سطراً) و`excelImporters.ts` (468) و`excelCore.ts` كانت **خارج
 * مقام التغطية**؛ إدخالها أنزل الإجمالي إلى 78.78% أسطر. وهذه ليست دوالاً تجميلية: هي الطريق
 * الذي يخرج منه دفتر المستخدم إلى ملف ويعود منه. الاختبار هنا يُصدِّر فعلاً، يقرأ الملف الناتج،
 * يُمرّره على المستورِد الحقيقي، ثم يقارن الحقول — لا يتحقق من «أن الدالة لم ترمِ».
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Customer, FinancialTransaction, MovementRecord, Product, Task } from '../../src/types';
import {
  exportCustomersToExcel,
  exportFinancialToExcel,
  exportFullBackupJSON,
  exportRecordsToCSV,
  exportRecordsToExcel,
  exportTasksToCSV,
  exportTasksToExcel,
  exportUnifiedBackupJSON,
} from '../../src/utils/excel/excelExporters';
import { generateSimpleChecksum } from '../../src/utils/excel/excelCore';
import {
  parseCustomersExcelFile,
  parseExcelForImport,
  parseFinancialExcelOrCSV,
} from '../../src/utils/excel/excelImporters';
import { readFirstSheetAoaSafe } from '../../src/utils/xlsxSafe';
import type { UnifiedBackupState } from '../../src/types';

/* ─────────── بيئة jsdom: التقاط التنزيل وقراءة Blob ─────────── */

let captured: { blob: Blob | null; filename: string } = { blob: null, filename: '' };

const bytesOf = (blob: Blob): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });

const fileOf = async (blob: Blob, name = 'test.xlsx'): Promise<File> => new File([await bytesOf(blob)], name);

beforeEach(() => {
  captured = { blob: null, filename: '' };
  /* jsdom لا ينفّذ التنزيل ولا يوفّر arrayBuffer على Blob/File — نوفّرهما كما في المتصفح */
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

afterEach(() => vi.restoreAllMocks());

/* ─────────── بيانات مرجعية ─────────── */

const products = [
  { id: 'P-1', name: 'باراسيتامول 500', openingStock: 10, unit: 'علبة', isActive: true },
  { id: 'P-2', name: 'أموكسيسيلين 250', openingStock: 0, unit: 'علبة', isActive: true },
] as Product[];

const record = (over: Partial<MovementRecord> = {}): MovementRecord => ({
  id: 'IN-0001',
  mainId: 'Categ-1001',
  subId: 'IN-0001',
  date: '2026-11-01',
  beneficiary: 'مؤسسة الدواء',
  description: 'توريد دفعة',
  movementType: 'توريد',
  status: 'تم التنفيذ',
  category: 'مشتريات',
  items: { 'باراسيتامول 500': 12 },
  note: 'ملاحظة',
  ...over,
});

const tx = (over: Partial<FinancialTransaction> = {}): FinancialTransaction =>
  ({
    id: 'ACC-1001',
    day: 'السبت',
    date: '2026-11-01',
    importance: 'A',
    movement: 'ايرادات',
    restriction: 'سند قبض',
    movementType: 'نقدا',
    categoryAccount: 'تحصيل',
    restrictionAccount: 'حساب الصندوق العام',
    accountName: 'صيدلية الشفاء',
    description: 'دفعة نقدية',
    number: '8541',
    amountYER: 250000,
    amountSAR: 1200,
    amountUSD: 40,
    ...over,
  }) as FinancialTransaction;

const customer = (over: Partial<Customer> = {}): Customer =>
  ({
    id: 'CUST-1001',
    subId: 'C-101',
    name: 'صيدلية الأمل',
    source: 'القيصر الذهبي',
    region: 'صنعاء',
    route: 'السبت',
    significance: 'A',
    status: 'مكتمل',
    responsible: 'انور',
    taskDesc: 'زيارة دورية',
    dateBegin: '2026-11-01',
    dateEnd: '',
    balanceYER: 120000,
    balanceSAR: 500,
    balanceUSD: 0,
    phone: '777000111',
    address: 'شارع التحرير',
    notes: 'عميل نشط',
    isInternalAccount: false,
    ...over,
  }) as Customer;

describe('البصمة والتنزيل (excelCore)', () => {
  it('البصمة حتمية، موسومة، وتتغيّر بتغيّر حرف واحد', () => {
    const a = generateSimpleChecksum('{"records":[1,2]}');
    expect(a).toBe(generateSimpleChecksum('{"records":[1,2]}'));
    expect(a).toMatch(/^sha256-[0-9a-f]{8}$/);
    expect(generateSimpleChecksum('{"records":[1,3]}')).not.toBe(a);
    expect(generateSimpleChecksum('')).toBe('sha256-00000000');
  });

  it('التنزيل يمرّ بـ createObjectURL ثم revokeObjectURL بلا ترك رابط معلّق', () => {
    const revoke = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { revokeObjectURL: revoke }));

    exportRecordsToCSV([record()], products);

    expect(captured.filename).toContain('.csv');
    expect(revoke).toHaveBeenCalledWith('blob:qeema-test');
  });
});

describe('حركات المخزون: تصدير ← استيراد', () => {
  it('Excel: الترويسة تسعة أعمدة أساسية + أصناف، والكميات كما هي', async () => {
    exportRecordsToExcel([record()], products);
    const sheet = readFirstSheetAoaSafe(await bytesOf(captured.blob as Blob), 'array');

    expect(sheet.rows[0].slice(0, 9)).toEqual([
      'Main_ID',
      'Sub_ID',
      'date',
      'Beneficiary Name',
      'Description',
      'Movement',
      'Cases',
      'Category',
      'note',
    ]);
    expect(sheet.rows[0].slice(9)).toEqual(['باراسيتامول 500', 'أموكسيسيلين 250']);
    const dataRow = sheet.rows[1];
    expect(dataRow[1]).toBe('IN-0001');
    expect(dataRow[9]).toBe(12);
    expect(dataRow[10]).toBe('');
  });

  it('Excel ← المستورِد الحقيقي: السجل يعود بالمعرّف والتاريخ والبند والكمية', async () => {
    exportRecordsToExcel([record()], products);
    const result = await parseExcelForImport(await fileOf(captured.blob as Blob), [], products, 2026);

    expect(result.validRows).toBe(1);
    const imported = result.parsedRecords[0];
    expect(imported.subId).toBe('IN-0001');
    expect(imported.mainId).toBe('Categ-1001');
    expect(imported.date).toBe('2026-11-01');
    expect(imported.beneficiary).toBe('مؤسسة الدواء');
    expect(imported.movementType).toBe('توريد');
    expect(imported.items).toEqual({ 'باراسيتامول 500': 12 });
  });

  it('CSV: BOM للعربية، ترويسة مؤطّرة، وتهريب علامة التنصيص', async () => {
    exportRecordsToCSV([record({ beneficiary: 'شركة "النور" للتجارة' })], products);
    const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(await bytesOf(captured.blob as Blob));

    expect(text.startsWith('\uFEFF')).toBe(true);
    expect(text.split('\n')[0]).toContain('"Main_ID","Sub_ID"');
    expect(text).toContain('"شركة ""النور"" للتجارة"');
    expect(text.split('\n')).toHaveLength(2);
  });
});

describe('السجل المالي: تصدير ← استيراد', () => {
  it('المبالغ الثلاثة والتاريخ تبقى منفصلة ولا تختلط (YER/SAR/USD)', async () => {
    exportFinancialToExcel([tx()]);
    const imported = await parseFinancialExcelOrCSV(await fileOf(captured.blob as Blob), []);

    expect(imported.success).toBe(true);
    const row = imported.transactions[0];
    expect(row.id).toBe('ACC-1001');
    expect(row.amountYER).toBe(250000);
    expect(row.amountSAR).toBe(1200);
    expect(row.amountUSD).toBe(40);
    expect(row.date).toBe('2026-11-01');
    expect(row.day).toBe('السبت');
    expect(row.accountName).toBe('صيدلية الشفاء');
    expect(row.description).toBe('دفعة نقدية');
    expect(row.number).toBe('8541');
  });

  it('ملف بلا أسطر صالحة ⇒ success=false برسالة عربية لا استثناء', async () => {
    exportFinancialToExcel([]);
    const imported = await parseFinancialExcelOrCSV(await fileOf(captured.blob as Blob), []);

    expect(imported.success).toBe(false);
    expect(imported.errors[0]).toContain('الملف فارغ');
    expect(imported.totalRows).toBe(0);
  });

  it('تكرار رقم القيد يُعدّ ويُبلَّغ ولا يمنع الاستيراد', async () => {
    const existing = [tx({ id: 'ACC-1001' })];
    exportFinancialToExcel([tx()]);
    const imported = await parseFinancialExcelOrCSV(await fileOf(captured.blob as Blob), existing);

    expect(imported.success).toBe(true);
    expect(imported.duplicateCount).toBe(1);
  });
});

describe('العملاء: تصدير ← استيراد', () => {
  it('الاسم والأرصدة والعنوان تعود كما هي، والصف بلا اسم يُتخطّى', async () => {
    exportCustomersToExcel([customer(), customer({ id: 'CUST-1002', name: '', balanceYER: 0 })]);
    const imported = await parseCustomersExcelFile(await fileOf(captured.blob as Blob));

    expect(imported.validRows).toBe(1);
    const back = imported.customers[0];
    expect(back.id).toBe('CUST-1001');
    expect(back.subId).toBe('C-101');
    expect(back.name).toBe('صيدلية الأمل');
    expect(back.balanceYER).toBe(120000);
    expect(back.balanceSAR).toBe(500);
    expect(back.address).toBe('شارع التحرير');
    expect(back.isInternalAccount).toBe(false);
    expect(imported.warnings.join(' ')).toContain('عدم وجود اسم العميل');
  });

  it('الحساب الداخلي يُقرأ من عمود «نعم» لا من التخمين', async () => {
    exportCustomersToExcel([customer({ name: 'حساب داخلي - عهدة', isInternalAccount: true })]);
    const imported = await parseCustomersExcelFile(await fileOf(captured.blob as Blob));

    expect(imported.customers[0].isInternalAccount).toBe(true);
  });
});

describe('المهام والالتزامات والنسخ JSON', () => {
  const task = {
    id: 'T-1',
    sub: 'S-1',
    start: '2026-11-01',
    end: '2026-11-05',
    title: 'جرد المستودع',
    desc: 'وصف',
    cat: 'عمليات',
    op: 'جرد',
    pri: 'عالي',
    status: 'قيد التنفيذ',
    resp: 'انور',
    amount: 5000,
  } as unknown as Task;

  it('ثلاث أوراق: المهام، الالتزامات (عند وجودها)، وسجل التعديلات', async () => {
    const commitment = {
      id: 'CM-1',
      name: 'إيجار',
      amount: 900,
      pri: 'عالي',
      due: '2026-12-01',
      status: 'مستحق',
      desc: 'شهري',
    } as never;
    const audit = { time: '10:00', action: 'إضافة', entity: 'مهام', title: 'جرد', details: 'سطر' } as never;

    exportTasksToExcel([task], [commitment], [audit]);
    const bytes = await bytesOf(captured.blob as Blob);
    const sheet = readFirstSheetAoaSafe(bytes, 'array');
    expect(sheet.rows[0][4]).toBe('عنوان المهمة');
    expect(sheet.rows[1][4]).toBe('جرد المستودع');

    /* الأوراق الثلاث تُقرأ بنفس الحاجز: نتحقّق من وجودها عبر إعادة القراءة */
    const { default: XLSX } = await import('xlsx');
    const wb = XLSX.read(bytes, { type: 'array' });
    expect(wb.SheetNames).toEqual(['المهام والأعمال', 'الالتزامات المالية', 'سجل التعديلات']);
  });

  it('بلا التزامات: لا تُنشأ الورقة الثانية (لا ورقة فارغة في الملف)', async () => {
    exportTasksToExcel([task]);
    const bytes = await bytesOf(captured.blob as Blob);
    const { default: XLSX } = await import('xlsx');
    const wb = XLSX.read(bytes, { type: 'array' });

    expect(wb.SheetNames).toEqual(['المهام والأعمال', 'سجل التعديلات']);
  });

  it('CSV المهام يحمل الترويسة العربية وسطرَ المهمة', async () => {
    exportTasksToCSV([task]);
    const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(await bytesOf(captured.blob as Blob));

    expect(text).toContain('المعرف');
    expect(text).toContain('جرد المستودع');
  });

  it('نسخة JSON الشاملة: كائن الحالة يُكتب كما هو وباسم مؤرَّخ', () => {
    exportUnifiedBackupJSON({ modules: {}, version: '3.40.0' } as unknown as UnifiedBackupState);

    expect(captured.filename).toMatch(/نسخة_شاملة.*\.json$/);
    expect(captured.blob?.type).toContain('application/json');
  });

  it('النسخة الكاملة القديمة: تُلفّ مع بصمة، وبلا سجلات تُكتب كما هي', async () => {
    exportFullBackupJSON(products, [record()], ['مشتريات'], ['تم التنفيذ'], { skipCancelled: true }, { IN: 1 }, []);
    const withRecords = JSON.parse(new TextDecoder().decode(await bytesOf(captured.blob as Blob)));
    expect(withRecords.checksum).toBe(generateSimpleChecksum(JSON.stringify([record()])));
    expect(withRecords.app).toBe('دفتر صرف وتوريد الأصناف');
    expect(withRecords.records).toHaveLength(1);

    exportFullBackupJSON({ modules: {} });
    const passthrough = JSON.parse(new TextDecoder().decode(await bytesOf(captured.blob as Blob)));
    expect(passthrough).toEqual({ modules: {} });
  });
});

describe('ربط الحقول في المستورِد — الأعطال الصامتة', () => {
  it('عمود «نوع القيد» يُقرأ من عموده هو لا من رقم القيد', async () => {
    /* الملف هنا على هيئة «قالب الاستيراد»: العمود الأول اسمه «رقم القيد (ID)» */
    const { default: XLSX } = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet([
      {
        'رقم القيد (ID)': 'ACC-777',
        اليوم: 'الأحد',
        التاريخ: '2026-11-02',
        الحركة: 'ايرادات',
        'نوع القيد': 'سند قبض',
        'اسم الحساب': 'صيدلية النور',
        'المبلغ (ريال يمني)': 1000,
        'المبلغ (ريال سعودي)': 200,
        'المبلغ (دولار)': 30,
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قالب');
    const bytes = new Uint8Array(XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer);

    const imported = await parseFinancialExcelOrCSV(new File([bytes], 'قالب.xlsx'), []);

    const row = imported.transactions[0];
    expect(row.id).toBe('ACC-777');
    expect(row.restriction).toBe('سند قبض');
    expect(row.amountYER).toBe(1000);
  });
});
