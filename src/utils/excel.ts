import * as XLSX from 'xlsx';
import {
  AppSettings,
  AuditLog,
  Commitment,
  Customer,
  CustomerAuditLog,
  CustomerVisitRecord,
  FinancialTransaction,
  MovementRecord,
  Product,
  Task,
  TaskAuditLog,
  UnifiedBackupState,
} from '../types';
import { DEFAULT_62_PRODUCT_NAMES } from '../data/defaultProducts';
import { normalizeArabicDigits, normalizeDate } from './stock';

// Fixed base column headers for stock
export const BASE_EXCEL_HEADERS = [
  'Main_ID',
  'Sub_ID',
  'date',
  'Beneficiary Name',
  'Description',
  'Movement',
  'Cases',
  'Category',
  'note',
];

// Helper to download blob
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Simple checksum generator for backup integrity
function generateSimpleChecksum(dataStr: string): string {
  let hash = 0;
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

// ============================================================================
// 1. STOCK EXCEL & CSV EXPORT
// ============================================================================
export function exportRecordsToExcel(
  records: MovementRecord[],
  productsList: Product[] = [],
  filename: string = 'دفتر_صرف_وتوريد_الأصناف.xlsx'
) {
  const productNames =
    productsList.length > 0
      ? productsList.map((p) => p.name)
      : DEFAULT_62_PRODUCT_NAMES;

  const headers = [...BASE_EXCEL_HEADERS, ...productNames];

  const dataRows = records.map((r) => {
    const row: Record<string, any> = {
      Main_ID: r.mainId || '',
      Sub_ID: r.subId || '',
      date: r.date || '',
      'Beneficiary Name': r.beneficiary || '',
      Description: r.description || '',
      Movement: r.movementType || '',
      Cases: r.status || '',
      Category: r.category || '',
      note: r.note || '',
    };

    for (const pName of productNames) {
      const qty = r.items && r.items[pName] ? r.items[pName] : '';
      row[pName] = qty;
    }

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(dataRows, { header: headers });

  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 28 },
    { wch: 35 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 25 },
    ...productNames.map(() => ({ wch: 16 })),
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'دفتر الحركات');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });

  triggerDownload(blob, filename);
}

export function exportRecordsToCSV(
  records: MovementRecord[],
  productsList: Product[] = [],
  filename: string = 'سجل_حركات_المخزون.csv'
) {
  const productNames =
    productsList.length > 0
      ? productsList.map((p) => p.name)
      : DEFAULT_62_PRODUCT_NAMES;

  const headers = [...BASE_EXCEL_HEADERS, ...productNames];
  const lines: string[] = [];
  lines.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

  for (const r of records) {
    const row = [
      r.mainId || '',
      r.subId || '',
      r.date || '',
      r.beneficiary || '',
      r.description || '',
      r.movementType || '',
      r.status || '',
      r.category || '',
      r.note || '',
      ...productNames.map((p) => (r.items && r.items[p] ? r.items[p] : '')),
    ];
    lines.push(row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','));
  }

  const csvContent = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

// ============================================================================
// 2. FINANCIAL EXCEL & CSV EXPORT (15-Column Schema)
// ============================================================================
export function exportFinancialToExcel(
  transactions: FinancialTransaction[],
  filename: string = 'دفتر_السجل_المالي_اليومي.xlsx'
) {
  const headers = [
    'ID',
    'اليوم',
    'التاريخ',
    'درجة الأهمية',
    'الحركة',
    'القيد',
    'طريقة الدفع',
    'فئة الحساب',
    'حساب التقييد',
    'اسم الحساب',
    'الوصف',
    'الرقم',
    'المبلغ (ريال يمني)',
    'المبلغ (ريال سعودي)',
    'المبلغ (دولار)',
  ];

  const dataRows = transactions.map((t) => ({
    'ID': t.id,
    'اليوم': t.day || '',
    'التاريخ': t.date || '',
    'درجة الأهمية': t.importance || '',
    'الحركة': t.movement || '',
    'القيد': t.restriction || '',
    'طريقة الدفع': t.movementType || '',
    'فئة الحساب': t.categoryAccount || '',
    'حساب التقييد': t.restrictionAccount || '',
    'اسم الحساب': t.accountName || '',
    'الوصف': t.description || '',
    'الرقم': t.number || '',
    'المبلغ (ريال يمني)': t.amountYER || 0,
    'المبلغ (ريال سعودي)': t.amountSAR || 0,
    'المبلغ (دولار)': t.amountUSD || 0,
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataRows, { header: headers });
  worksheet['!cols'] = [
    { wch: 14 }, // ID
    { wch: 12 }, // اليوم
    { wch: 14 }, // التاريخ
    { wch: 14 }, // درجة الأهمية
    { wch: 16 }, // الحركة
    { wch: 16 }, // القيد
    { wch: 14 }, // طريقة الدفع
    { wch: 18 }, // فئة الحساب
    { wch: 24 }, // حساب التقييد
    { wch: 26 }, // اسم الحساب
    { wch: 35 }, // الوصف
    { wch: 12 }, // الرقم
    { wch: 18 }, // المبلغ YER
    { wch: 18 }, // المبلغ SAR
    { wch: 18 }, // المبلغ USD
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'دفتر السجل المالي');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });

  triggerDownload(blob, filename);
}

// ============================================================================
// 3. TASKS & COMMITMENTS EXCEL EXPORT (PRD FR-41: 3 Sheets)
// ============================================================================
export function exportTasksToExcel(
  tasks: Task[],
  commitments: Commitment[] = [],
  auditLogs: TaskAuditLog[] = [],
  filename: string = 'دفتر_المهام_والأعمال_والخطط_والأهداف.xlsx'
) {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: المهام (Tasks)
  const taskHeaders = [
    'المعرف الرئيسي',
    'المعرف الفرعي',
    'تاريخ البداية',
    'تاريخ الانتهاء',
    'عنوان المهمة',
    'الوصف',
    'الفئة',
    'العملية',
    'الأولوية',
    'الحالة',
    'المسؤول',
    'المبلغ',
  ];

  const taskRows = tasks.map((t) => ({
    'المعرف الرئيسي': t.id,
    'المعرف الفرعي': t.sub || '',
    'تاريخ البداية': t.start,
    'تاريخ الانتهاء': t.end || '',
    'عنوان المهمة': t.title,
    'الوصف': t.desc || '',
    'الفئة': t.cat,
    'العملية': t.op,
    'الأولوية': t.pri,
    'الحالة': t.status,
    'المسؤول': t.resp,
    'المبلغ': t.amount !== undefined ? t.amount : '',
  }));

  const taskSheet = XLSX.utils.json_to_sheet(taskRows, { header: taskHeaders });
  taskSheet['!cols'] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 35 },
    { wch: 40 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(workbook, taskSheet, 'المهام والأعمال');

  // Sheet 2: الالتزامات المالية (Commitments) - if available
  if (commitments && commitments.length > 0) {
    const commitmentHeaders = [
      'المعرف',
      'الالتزام / الجهة',
      'المبلغ',
      'الأهمية',
      'تاريخ الاستحقاق',
      'الحالة',
      'الوصف / ملاحظات',
    ];

    const commitmentRows = commitments.map((c) => ({
      'المعرف': c.id,
      'الالتزام / الجهة': c.name,
      'المبلغ': c.amount,
      'الأهمية': c.pri,
      'تاريخ الاستحقاق': c.due || '',
      'الحالة': c.status,
      'الوصف / ملاحظات': c.desc || '',
    }));

    const commitmentSheet = XLSX.utils.json_to_sheet(commitmentRows, { header: commitmentHeaders });
    commitmentSheet['!cols'] = [
      { wch: 16 },
      { wch: 35 },
      { wch: 16 },
      { wch: 12 },
      { wch: 16 },
      { wch: 14 },
      { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(workbook, commitmentSheet, 'الالتزامات المالية');
  }

  // Sheet 3: سجل التعديلات (Audit Log)
  const auditHeaders = ['الوقت', 'العملية', 'القسم', 'العنصر', 'التفاصيل'];
  const auditRows = auditLogs.map((l) => ({
    'الوقت': l.time,
    'العملية': l.action,
    'القسم': l.entity,
    'العنصر': l.title,
    'التفاصيل': l.details,
  }));

  const auditSheet = XLSX.utils.json_to_sheet(auditRows, { header: auditHeaders });
  auditSheet['!cols'] = [
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 25 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(workbook, auditSheet, 'سجل التعديلات');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });

  triggerDownload(blob, filename);
}

// FR-50: Export Tasks to CSV
export function exportTasksToCSV(tasks: Task[], filename = 'قائمة_المهام.csv') {
  const headers = [
    'المعرف',
    'المعرف الفرعي',
    'البداية',
    'الانتهاء',
    'المهمة',
    'الوصف',
    'الفئة',
    'العملية',
    'الأولوية',
    'الحالة',
    'المسؤول',
    'المبلغ',
  ];

  const lines: string[] = [];
  lines.push(headers.map((h) => `"${h}"`).join(','));

  for (const t of tasks) {
    const row = [
      t.id,
      t.sub || '',
      t.start,
      t.end || '',
      t.title,
      t.desc || '',
      t.cat,
      t.op,
      t.pri,
      t.status,
      t.resp,
      t.amount !== undefined ? t.amount : '',
    ];
    lines.push(row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','));
  }

  const csvContent = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

// ============================================================================
// 4. UNIFIED FULL JSON BACKUP EXPORT & IMPORT
// ============================================================================
export function exportUnifiedBackupJSON(backupState: UnifiedBackupState) {
  const str = JSON.stringify(backupState, null, 2);
  const blob = new Blob([str], { type: 'application/json;charset=utf-8;' });
  const dateStr = new Date().toISOString().split('T')[0];
  triggerDownload(blob, `نسخة_شاملة_منظومة_الإدارة_والمخزون_والمهام_${dateStr}.json`);
}

// ============================================================================
// 5. EXCEL PARSER FOR STOCK IMPORT
// ============================================================================
export interface ImportPreviewResult {
  totalRows: number;
  validRows: number;
  matchedProductsCount: number;
  newRecordsCount: number;
  duplicateSubIdsCount: number;
  parsedRecords: MovementRecord[];
  warnings: string[];
}

export async function parseExcelForImport(
  file: File,
  existingRecords: MovementRecord[],
  knownProducts: Product[],
  defaultYear: number = 2024
): Promise<ImportPreviewResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
  });

  if (!rawRows || rawRows.length < 2) {
    throw new Error('الملف فارغ أو لا يحتوي على صفوف بيانات صالحة.');
  }

  const headerRow = rawRows[0].map((cell) => String(cell || '').trim());

  let mainIdIdx = -1;
  let subIdIdx = -1;
  let dateIdx = -1;
  let beneficiaryIdx = -1;
  let descIdx = -1;
  let movementIdx = -1;
  let statusIdx = -1;
  let categoryIdx = -1;
  let noteIdx = -1;

  const productColMap: { colIndex: number; productName: string }[] = [];

  headerRow.forEach((header, idx) => {
    const h = header.toLowerCase();
    if (h === 'main_id' || h === 'main id' || h === 'الرقم الرئيسي') mainIdIdx = idx;
    else if (h === 'sub_id' || h === 'sub id' || h === 'الرقم الفرعي') subIdIdx = idx;
    else if (h === 'date' || h === 'التاريخ' || h === 'تاريخ') dateIdx = idx;
    else if (h.includes('beneficiary') || h.includes('مستفيد')) beneficiaryIdx = idx;
    else if (h.includes('desc') || h.includes('وصف') || h.includes('بيان')) descIdx = idx;
    else if (h.includes('movement') || h.includes('حركة') || h.includes('نوع الحركة')) movementIdx = idx;
    else if (h.includes('cases') || h.includes('case') || h.includes('حالة')) statusIdx = idx;
    else if (h.includes('category') || h.includes('فئة')) categoryIdx = idx;
    else if (h.includes('note') || h.includes('ملاحظ')) noteIdx = idx;
    else {
      const matchedName = knownProducts.find(
        (p) => p.name.trim() === header.trim()
      )?.name || header.trim();

      if (matchedName && matchedName.length > 1) {
        productColMap.push({ colIndex: idx, productName: matchedName });
      }
    }
  });

  const existingSubIds = new Set(existingRecords.map((r) => r.subId));
  const parsedRecords: MovementRecord[] = [];
  const warnings: string[] = [];
  let duplicateSubIdsCount = 0;

  for (let rowIndex = 1; rowIndex < rawRows.length; rowIndex++) {
    const row = rawRows[rowIndex];
    if (!row || row.every((c) => c === '' || c === undefined || c === null)) {
      continue;
    }

    const rawSubId = subIdIdx >= 0 ? String(row[subIdIdx] || '').trim() : '';
    const rawMainId = mainIdIdx >= 0 ? String(row[mainIdIdx] || '').trim() : '';
    const rawDate = dateIdx >= 0 ? String(row[dateIdx] || '').trim() : '';
    const rawBeneficiary = beneficiaryIdx >= 0 ? String(row[beneficiaryIdx] || '').trim() : '';
    const rawDesc = descIdx >= 0 ? String(row[descIdx] || '').trim() : '';
    const rawMovement = movementIdx >= 0 ? String(row[movementIdx] || '').trim() : '';
    const rawStatus = statusIdx >= 0 ? String(row[statusIdx] || '').trim() : '';
    const rawCategory = categoryIdx >= 0 ? String(row[categoryIdx] || '').trim() : '';
    const rawNote = noteIdx >= 0 ? String(row[noteIdx] || '').trim() : '';

    const isInput =
      rawMovement.includes('توريد') ||
      rawMovement.toUpperCase().includes('IN') ||
      rawSubId.toUpperCase().startsWith('IN');

    const movementType = isInput ? 'توريد' : 'صرف';
    const subId =
      rawSubId ||
      `${isInput ? 'IN' : 'OUT'}-${String(rowIndex + 1000).padStart(4, '0')}`;

    if (existingSubIds.has(subId)) {
      duplicateSubIdsCount += 1;
    }

    const items: Record<string, number> = {};
    for (const col of productColMap) {
      const cellVal = row[col.colIndex];
      if (cellVal !== undefined && cellVal !== null && cellVal !== '') {
        const numStr = normalizeArabicDigits(String(cellVal).trim());
        const qty = parseFloat(numStr);
        if (!isNaN(qty) && qty > 0) {
          items[col.productName] = qty;
        }
      }
    }

    const normalizedD = normalizeDate(rawDate, defaultYear);

    parsedRecords.push({
      id: subId,
      mainId: rawMainId || `Categ-${1000 + rowIndex}`,
      subId,
      date: normalizedD || new Date().toISOString().split('T')[0],
      beneficiary: rawBeneficiary || 'غير محدد',
      description: rawDesc || `حركة مستوردة من Excel - ${subId}`,
      movementType,
      status: rawStatus || 'تم التنفيذ',
      category: rawCategory || 'مبيعات',
      items,
      note: rawNote || undefined,
    });
  }

  return {
    totalRows: rawRows.length - 1,
    validRows: parsedRecords.length,
    matchedProductsCount: productColMap.length,
    newRecordsCount: parsedRecords.length - duplicateSubIdsCount,
    duplicateSubIdsCount,
    parsedRecords,
    warnings,
  };
}

export function exportFullBackupJSON(
  backupStateOrProducts: any,
  records?: any,
  categories?: any,
  statuses?: any,
  settings?: any,
  seq?: any,
  auditLogs?: any
) {
  let backupData: any;
  if (records !== undefined) {
    backupData = {
      app: 'دفتر صرف وتوريد الأصناف',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      checksum: generateSimpleChecksum(JSON.stringify(records)),
      products: backupStateOrProducts,
      records,
      categories,
      statuses,
      settings,
      seq,
      auditLogs,
    };
  } else {
    backupData = backupStateOrProducts;
  }

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const filename = `نسخة_احتياطية_كاملة_${new Date().toISOString().split('T')[0]}.json`;
  triggerDownload(blob, filename);
}

// ============================================================================
// 4. CUSTOMERS & VISITS EXCEL EXPORT & IMPORT (دفتر إدارة العملاء والزيارات)
// ============================================================================
export function exportCustomersToExcel(
  customers: Customer[],
  visits: CustomerVisitRecord[] = [],
  filename: string = 'سجل_العملاء_والزيارات_القيصر_الذهبي.xlsx'
) {
  const customerRows = customers.map((c, index) => ({
    'م': index + 1,
    'المعرف الرئيسي (Main_ID)': c.id || `CUST-${1001 + index}`,
    'المعرف الفرعي (Sub_ID)': c.subId || '',
    'اسم العميل / المنشأة': c.name || '',
    'المصدر / العلامة': c.source || '',
    'المنطقة الجغرافية': c.region || '',
    'مسار الزيارة (اليوم)': c.route || '',
    'مستوى الأهمية': c.significance || 'B',
    'حالة الزيارة': c.status || 'مخطط',
    'المندوب المسؤول': c.responsible || '',
    'وصف المهمة / الغرض': c.taskDesc || '',
    'تاريخ البدء': c.dateBegin || '',
    'تاريخ الانتهاء': c.dateEnd || '',
    'الرصيد بالريال اليمني': c.balanceYER || 0,
    'الرصيد بالريال السعودي': c.balanceSAR || 0,
    'الرصيد بالدولار': c.balanceUSD || 0,
    'رقم الهاتف': c.phone || '',
    'العنوان / الموقع': c.address || '',
    'حساب داخلي / خاص': c.isInternalAccount ? 'نعم' : 'لا',
    'آخر زيارة': c.lastVisitDate || '',
    'نتيجة الزيارة': c.visitResult || '',
    'ملاحظات': c.notes || '',
  }));

  const visitsRows = visits.map((v, index) => ({
    'م': index + 1,
    'رقم الزيارة': v.id,
    'رقم العميل': v.customerId,
    'اسم العميل': v.customerName,
    'التاريخ': v.date,
    'اليوم': v.dayOfWeek,
    'المندوب': v.responsible,
    'الحالة': v.status,
    'المبلغ المحصل (ريال)': v.amountCollectedYER || 0,
    'المبلغ المحصل (سعودي)': v.amountCollectedSAR || 0,
    'المبلغ المحصل (دولار)': v.amountCollectedUSD || 0,
    'ملاحظات ونتائج': v.notes,
  }));

  const wb = XLSX.utils.book_new();

  const wsCustomers = XLSX.utils.json_to_sheet(customerRows);
  XLSX.utils.book_append_sheet(wb, wsCustomers, 'دليل العملاء');

  if (visitsRows.length > 0) {
    const wsVisits = XLSX.utils.json_to_sheet(visitsRows);
    XLSX.utils.book_append_sheet(wb, wsVisits, 'سجل الزيارات الميدانية');
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, filename);
}

export async function parseCustomersExcelFile(
  file: File
): Promise<{
  totalRows: number;
  validRows: number;
  customers: Customer[];
  warnings: string[];
}> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const customers: Customer[] = [];
  const warnings: string[] = [];

  rawRows.forEach((row, idx) => {
    const name =
      row['اسم العميل / المنشأة'] ||
      row['Name'] ||
      row['اسم العميل'] ||
      row['العميل'] ||
      row['اسم المنشأة'] ||
      row['name'];

    if (!name || String(name).trim() === '') {
      warnings.push(`السطر ${idx + 2}: تم تخطيه لعدم وجود اسم العميل`);
      return;
    }

    const id = row['المعرف الرئيسي (Main_ID)'] || row['Main_ID'] || row['ID'] || `CUST-${1000 + idx + 1}`;
    const subId = row['المعرف الفرعي (Sub_ID)'] || row['Sub_ID'] || row['الرمز'] || `C-${idx + 1}`;
    const source = row['المصدر / العلامة'] || row['Source'] || row['المصدر'] || 'القيصر الذهبي';
    const region = row['المنطقة الجغرافية'] || row['Region'] || row['المنطقة'] || 'صنعاء';
    const route = row['مسار الزيارة (اليوم)'] || row['Route'] || row['المسار'] || 'السبت';
    const significance = (row['مستوى الأهمية'] || row['Significance'] || row['الأهمية'] || 'B') as any;
    const status = (row['حالة الزيارة'] || row['Status'] || row['الحالة'] || 'مخطط') as any;
    const responsible = row['المندوب المسؤول'] || row['Responsible'] || row['المندوب'] || 'انور';
    const taskDesc = row['وصف المهمة / الغرض'] || row['TaskDesc'] || row['المهمة'] || '';
    const dateBegin = normalizeDate(row['تاريخ البدء'] || row['DateBegin'] || '') || new Date().toISOString().split('T')[0];
    const dateEnd = normalizeDate(row['تاريخ الانتهاء'] || row['DateEnd'] || '') || '';
    
    const balanceYER = parseFloat(normalizeArabicDigits(String(row['الرصيد بالريال اليمني'] || row['Balance_YER'] || row['الرصيد'] || 0))) || 0;
    const balanceSAR = parseFloat(normalizeArabicDigits(String(row['الرصيد بالريال السعودي'] || row['Balance_SAR'] || 0))) || 0;
    const balanceUSD = parseFloat(normalizeArabicDigits(String(row['الرصيد بالدولار'] || row['Balance_USD'] || 0))) || 0;
    
    const phone = normalizeArabicDigits(String(row['رقم الهاتف'] || row['Phone'] || row['الهاتف'] || ''));
    const address = String(row['العنوان / الموقع'] || row['Address'] || row['العنوان'] || '');
    const notes = String(row['ملاحظات'] || row['Notes'] || '');
    const isInternal =
      row['حساب داخلي / خاص'] === 'نعم' ||
      row['isInternalAccount'] === true ||
      String(name).includes('حساب داخلي') ||
      String(name).includes('عهدة') ||
      String(name).includes('بضاعة تالفة');

    customers.push({
      id,
      subId,
      name: String(name).trim(),
      source,
      region,
      route,
      significance,
      status,
      responsible,
      taskDesc,
      dateBegin,
      dateEnd,
      balanceYER,
      balanceSAR,
      balanceUSD,
      phone,
      address,
      notes,
      isInternalAccount: isInternal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  return {
    totalRows: rawRows.length,
    validRows: customers.length,
    customers,
    warnings,
  };
}

// ============================================================================
// 5. EXCEL TEMPLATE DOWNLOADERS (قوالب الإكسل الجاهزة)
// ============================================================================

/**
 * تحميل نموذج إكسل جاهز للسجل المالي اليومي (15 عمود)
 */
export function downloadFinancialExcelTemplate() {
  const templateData = [
    {
      'رقم القيد (ID)': 'ACC-1001',
      'اليوم': 'السبت',
      'التاريخ': new Date().toISOString().split('T')[0],
      'درجة الأهمية': 'A',
      'الحركة': 'ايرادات',
      'نوع القيد': 'سند قبض',
      'طريقة الدفع': 'نقدا',
      'فئة الحساب': 'تحصيل',
      'حساب التقييد': 'حساب الصندوق العام',
      'اسم الحساب': 'صيدلية الشفاء التخصصية',
      'البيان / الوصف': 'دفعة نقدية سداد جزء من حساب المبيعات',
      'رقم السند': '8541',
      'المبلغ (ريال يمني)': 250000,
      'المبلغ (ريال سعودي)': 0,
      'المبلغ (دولار)': 0,
    },
    {
      'رقم القيد (ID)': 'ACC-1002',
      'اليوم': 'الأحد',
      'التاريخ': new Date().toISOString().split('T')[0],
      'درجة الأهمية': 'B',
      'الحركة': 'منصرف',
      'نوع القيد': 'سند صرف',
      'طريقة الدفع': 'كريمي',
      'فئة الحساب': 'مصاريف تشغيلية',
      'حساب التقييد': 'بنك الكريمي',
      'اسم الحساب': 'شركة الكهرباء والطاقة',
      'البيان / الوصف': 'سداد فاتورة استهلاك الكهرباء الشهرية',
      'رقم السند': '4120',
      'المبلغ (ريال يمني)': 45000,
      'المبلغ (ريال سعودي)': 0,
      'المبلغ (دولار)': 0,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  worksheet['!cols'] = [
    { wch: 16 }, // ID
    { wch: 12 }, // اليوم
    { wch: 14 }, // التاريخ
    { wch: 14 }, // درجة الأهمية
    { wch: 16 }, // الحركة
    { wch: 16 }, // نوع القيد
    { wch: 14 }, // طريقة الدفع
    { wch: 18 }, // فئة الحساب
    { wch: 22 }, // حساب التقييد
    { wch: 26 }, // اسم الحساب
    { wch: 38 }, // البيان
    { wch: 14 }, // رقم السند
    { wch: 18 }, // المبلغ YER
    { wch: 18 }, // المبلغ SAR
    { wch: 18 }, // المبلغ USD
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'قالب_السجل_المالي');

  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ rightToLeft: true });

  XLSX.writeFile(workbook, 'نموذج_استيراد_السجل_المالي_اليومي.xlsx');
}

/**
 * تحميل نموذج إكسل جاهز للعملاء والزيارات
 */
export function downloadCustomersExcelTemplate() {
  const templateData = [
    {
      'المعرف الرئيسي (Main_ID)': 'CUST-1001',
      'المعرف الفرعي (Sub_ID)': 'C-101',
      'اسم العميل / المنشأة': 'صيدلية الأمل النموذجية',
      'المصدر / العلامة': 'القيصر الذهبي',
      'المنطقة الجغرافية': 'صنعاء - التحرير',
      'مسار الزيارة (اليوم)': 'السبت',
      'مستوى الأهمية': 'A',
      'حالة الزيارة': 'مكتمل',
      'المندوب المسؤول': 'انور',
      'وصف المهمة / الغرض': 'زيارة دورية للتحصيل ومتابعة نواقص المنتجات',
      'تاريخ البدء': new Date().toISOString().split('T')[0],
      'تاريخ الانتهاء': '',
      'الرصيد بالريال اليمني': 120000,
      'الرصيد بالريال السعودي': 0,
      'الرصيد بالدولار': 0,
      'رقم الهاتف': '777000111',
      'العنوان / الموقع': 'شارع علي عبدالمغني - جوار البريد',
      'ملاحظات': 'عميل نشط ومنتظم',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'قالب_العملاء');

  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ rightToLeft: true });

  XLSX.writeFile(workbook, 'نموذج_استيراد_دليل_العملاء.xlsx');
}

/**
 * تحميل نموذج إكسل جاهز لحركات الصرف والتوريد
 */
export function downloadStockRecordsExcelTemplate(productsList: Product[] = []) {
  const productNames =
    productsList.length > 0
      ? productsList.slice(0, 15).map((p) => p.name)
      : DEFAULT_62_PRODUCT_NAMES.slice(0, 15);

  const row1: Record<string, any> = {
    'Main_ID': 'Categ-1001',
    'Sub_ID': 'IN-1001',
    'date': new Date().toISOString().split('T')[0],
    'Beneficiary Name': 'مؤسسة الدواء والمستلزمات',
    'Description': 'توريد دفعة مخزنية جديدة من المصنع',
    'Movement': 'توريد',
    'Cases': 'تم التنفيذ',
    'Category': 'مستودع صنعاء',
    'note': 'تم الفحص والمطابقة',
  };

  productNames.forEach((pName, idx) => {
    row1[pName] = (idx + 1) * 10;
  });

  const row2: Record<string, any> = {
    'Main_ID': 'Categ-1002',
    'Sub_ID': 'OUT-1001',
    'date': new Date().toISOString().split('T')[0],
    'Beneficiary Name': 'صيدلية الشفاء',
    'Description': 'صرف فاتورة مبيعات رقم 402',
    'Movement': 'صرف',
    'Cases': 'تم التنفيذ',
    'Category': 'مبيعات',
    'note': 'تسليم مندوب التوزيع',
  };

  productNames.forEach((pName, idx) => {
    row2[pName] = (idx % 2 === 0) ? (idx + 2) : 0;
  });

  const worksheet = XLSX.utils.json_to_sheet([row1, row2]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'حركات_المخزون');

  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ rightToLeft: true });

  XLSX.writeFile(workbook, 'نموذج_استيراد_حركات_المخزون.xlsx');
}

// ============================================================================
// 6. FINANCIAL EXCEL / CSV PARSER WITH SMART MAPPING
// ============================================================================

function computeArabicDay(dateStr: string): string {
  if (!dateStr) return 'السبت';
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'السبت';
    return days[d.getDay()];
  } catch {
    return 'السبت';
  }
}

export async function parseFinancialExcelOrCSV(
  file: File,
  existingTransactions: FinancialTransaction[] = []
): Promise<{
  success: boolean;
  transactions: FinancialTransaction[];
  errors: string[];
  totalRows: number;
  validRows: number;
  duplicateCount: number;
  warnings: string[];
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve({
            success: false,
            transactions: [],
            errors: ['الملف فارغ أو لا يحتوي على صفوف بيانات صالحة'],
            totalRows: 0,
            validRows: 0,
            duplicateCount: 0,
            warnings: [],
          });
          return;
        }

        const existingIds = new Set(existingTransactions.map((t) => t.id));
        const parsed: FinancialTransaction[] = [];
        const warnings: string[] = [];
        let duplicateCount = 0;
        let runningId = 1000 + existingTransactions.length;

        rawJson.forEach((row, index) => {
          // Helper to find column by aliases
          const findVal = (...aliases: string[]): string => {
            for (const key of Object.keys(row)) {
              const cleanKey = key.trim().toLowerCase();
              for (const alias of aliases) {
                const cleanAlias = alias.trim().toLowerCase();
                if (cleanKey === cleanAlias || cleanKey.includes(cleanAlias)) {
                  const val = row[key];
                  return val !== undefined && val !== null ? String(val).trim() : '';
                }
              }
            }
            return '';
          };

          const rawId = findVal('رقم القيد', 'المعرف', 'id', 'acc', 'كود القيد');
          const rawAccountName = findVal('اسم الحساب', 'الحساب', 'account', 'اسم العميل', 'الجهة');
          const rawMovement = findVal('الحركة', 'نوع الحركة', 'movement');
          const rawRestriction = findVal('القيد', 'نوع القيد', 'السند', 'restriction');
          const rawMovementType = findVal('طريقة الدفع', 'الدفع', 'طريقة', 'payment', 'type');
          const rawCatAccount = findVal('فئة الحساب', 'الفئة', 'category');
          const rawRestAccount = findVal('حساب التقييد', 'حساب تقييد', 'التقييد');
          const rawDate = findVal('التاريخ', 'تاريخ', 'date');
          const rawDay = findVal('اليوم', 'يوم', 'day');
          const rawImportance = findVal('درجة الأهمية', 'الأهمية', 'الحالة', 'importance');
          const rawDesc = findVal('البيان', 'الوصف', 'تفاصيل', 'الملاحظات', 'description', 'desc');
          const rawNumber = findVal('رقم السند', 'الرقم', 'المرجع', 'سند', 'number', 'ref');

          const rawAmountYER = findVal('ريال يمني', 'يمني', 'yer', 'المبلغ (ريال يمني)', 'المبلغ');
          const rawAmountSAR = findVal('ريال سعودي', 'سعودي', 'sar', 'المبلغ (ريال سعودي)');
          const rawAmountUSD = findVal('دولار', 'دولار أمريكي', 'usd', 'المبلغ (دولار)');

          // If no account name and no amount and no description, skip empty row
          if (!rawAccountName && !rawAmountYER && !rawDesc && !rawMovement) {
            return;
          }

          let formattedDate = normalizeDate(rawDate);
          if (!formattedDate) {
            formattedDate = new Date().toISOString().split('T')[0];
          }

          const day = rawDay || computeArabicDay(formattedDate);
          const amountYER = parseFloat(normalizeArabicDigits(rawAmountYER || '0')) || 0;
          const amountSAR = parseFloat(normalizeArabicDigits(rawAmountSAR || '0')) || 0;
          const amountUSD = parseFloat(normalizeArabicDigits(rawAmountUSD || '0')) || 0;

          runningId++;
          const id = rawId || `ACC-${runningId}`;

          if (existingIds.has(id)) {
            duplicateCount++;
          }

          parsed.push({
            id,
            day,
            date: formattedDate,
            importance: rawImportance || 'A',
            movement: rawMovement || 'ايرادات',
            restriction: rawRestriction || 'سند قبض',
            movementType: rawMovementType || 'نقدا',
            categoryAccount: rawCatAccount || 'تحصيل',
            restrictionAccount: rawRestAccount || 'حساب الصندوق العام',
            accountName: rawAccountName || 'حساب غير محدد',
            description: rawDesc || undefined,
            number: rawNumber || String(1000 + index),
            amountYER,
            amountSAR,
            amountUSD,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });

        if (parsed.length === 0) {
          resolve({
            success: false,
            transactions: [],
            errors: ['لم يتم العثور على أسطر قيود مالية صالحة بالملف. تأكد من احتواء الملف على أعمدة مطابقة.'],
            totalRows: rawJson.length,
            validRows: 0,
            duplicateCount: 0,
            warnings,
          });
          return;
        }

        resolve({
          success: true,
          transactions: parsed,
          errors: [],
          totalRows: rawJson.length,
          validRows: parsed.length,
          duplicateCount,
          warnings,
        });
      } catch (err: any) {
        console.error(err);
        resolve({
          success: false,
          transactions: [],
          errors: ['حدث خطأ أثناء قراءة ملف الإكسل: ' + (err?.message || 'تنسيق الملف غير صالح')],
          totalRows: 0,
          validRows: 0,
          duplicateCount: 0,
          warnings: [],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        transactions: [],
        errors: ['تعذر قراءة محتوى الملف.'],
        totalRows: 0,
        validRows: 0,
        duplicateCount: 0,
        warnings: [],
      });
    };

    reader.readAsArrayBuffer(file);
  });
}


