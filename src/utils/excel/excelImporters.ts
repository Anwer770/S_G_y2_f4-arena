/**
 * مستورِدات Excel/CSV مع تقرير أمانة الاستيراد — مستخرجة من utils/excel.ts (R30).
 */
import { ImportReport, cellText, cellNumber, autoKey, IMPORT_FIDELITY_BANNER } from '../importFidelity';
import {
  assertFileSize,
  MAX_IMPORT_ROWS,
  readFirstSheetSafe,
  readFirstSheetAoaSafe,
  safeSheetWarnings,
} from '../xlsxSafe';
import { Customer, FinancialTransaction, MovementRecord, Product } from '../../types';
import { normalizeArabicDigits, normalizeDate } from '../stock';
import { calculateArabicDay } from '../formatters';

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
  assertFileSize(file);
  const buffer = await file.arrayBuffer();
  const safeSheet = readFirstSheetAoaSafe(buffer, 'array');
  const rawRows = safeSheet.rows;

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
      const matchedName = knownProducts.find((p) => p.name.trim() === header.trim())?.name || header.trim();

      if (matchedName && matchedName.length > 1) {
        productColMap.push({ colIndex: idx, productName: matchedName });
      }
    }
  });

  const existingSubIds = new Set(existingRecords.map((r) => r.subId));
  const parsedRecords: MovementRecord[] = [];
  const report = new ImportReport();
  /* R52: الاقتطاع عند 20,000 صف كان يحدث صامتاً — المستخدم يرى «نجح» وقد فقد نصف ملفه */
  const warnings: string[] = safeSheet.truncated
    ? [`الملف أكبر من ${MAX_IMPORT_ROWS} صفاً — استُورد أول ${MAX_IMPORT_ROWS} صفاً فقط.`]
    : [];
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
    const mainIdGenerated = autoKey('MAIN', rowIndex + 2);
    const subId = rawSubId || autoKey(isInput ? 'IN' : 'OUT', rowIndex + 2);

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

    if (!rawSubId) report.generated(rowIndex + 2, 'المعرف الفرعي', subId);
    if (!rawMainId) report.generated(rowIndex + 2, 'المعرف الرئيسي', mainIdGenerated);
    if (!rawBeneficiary) report.blank(rowIndex + 2, 'الجهة المستفيدة');
    if (!rawDesc) report.blank(rowIndex + 2, 'الوصف');
    if (!rawStatus) report.blank(rowIndex + 2, 'الحالة');
    if (!rawCategory) report.blank(rowIndex + 2, 'الفئة');
    if (!normalizedD) report.blank(rowIndex + 2, 'التاريخ');

    parsedRecords.push({
      id: subId,
      mainId: rawMainId || mainIdGenerated,
      subId,
      // لا يُستبدل التاريخ بتاريخ اليوم: الخلية الفارغة تبقى فارغة (أمانة الاستيراد)
      date: normalizedD,
      beneficiary: rawBeneficiary,
      description: rawDesc,
      movementType,
      status: rawStatus,
      category: rawCategory,
      items,
      note: rawNote || undefined,
    });
  }

  warnings.push(...report.summary());

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

export async function parseCustomersExcelFile(file: File): Promise<{
  totalRows: number;
  validRows: number;
  customers: Customer[];
  warnings: string[];
}> {
  const data = await file.arrayBuffer();
  const safeSheet = readFirstSheetSafe<Record<string, unknown>>(data, 'array');
  const rawRows = safeSheet.rows;

  const customers: Customer[] = [];
  const warnings: string[] = [IMPORT_FIDELITY_BANNER, ...safeSheetWarnings(safeSheet)];
  const report = new ImportReport();

  rawRows.forEach((row, idx) => {
    const line = idx + 2; // رقم السطر الحقيقي في Excel (1 = الترويسة)
    const name = cellText(row, ['اسم العميل / المنشأة', 'Name', 'اسم العميل', 'العميل', 'اسم المنشأة', 'name']);

    if (name === '') {
      warnings.push(`السطر ${line}: تم تخطيه لعدم وجود اسم العميل`);
      return;
    }

    // المفاتيح: تُقرأ من الملف إن وُجدت، وإلا تُولَّد بوسم AUTO- وتُسجَّل (قاعدة البيانات تحتاج مفتاحاً)
    const rawId = cellText(row, ['المعرف الرئيسي (Main_ID)', 'Main_ID', 'ID']);
    const rawSubId = cellText(row, ['المعرف الفرعي (Sub_ID)', 'Sub_ID', 'الرمز']);
    const id = rawId || autoKey('CUST', line);
    const subId = rawSubId || autoKey('SUB', line);
    if (!rawId) report.generated(line, 'المعرف الرئيسي', id);
    if (!rawSubId) report.generated(line, 'المعرف الفرعي', subId);

    // بيانات المحتوى: الفارغ يبقى فارغاً — لا قيمة افتراضية واحدة
    const source = cellText(row, ['المصدر / العلامة', 'Source', 'المصدر']);
    const region = cellText(row, ['المنطقة الجغرافية', 'Region', 'المنطقة']);
    const route = cellText(row, ['مسار الزيارة (اليوم)', 'Route', 'المسار']);
    const significance = cellText(row, ['مستوى الأهمية', 'Significance', 'الأهمية']);
    const status = cellText(row, ['حالة الزيارة', 'Status', 'الحالة']);
    const responsible = cellText(row, ['المندوب المسؤول', 'Responsible', 'المندوب']);
    const taskDesc = cellText(row, ['وصف المهمة / الغرض', 'TaskDesc', 'المهمة']);

    for (const [field, value] of [
      ['المصدر', source],
      ['المنطقة', region],
      ['المسار', route],
      ['الأهمية', significance],
      ['حالة الزيارة', status],
      ['المندوب', responsible],
    ] as const) {
      if (value === '') report.blank(line, field);
    }

    // التواريخ: لا تُستبدل بتاريخ اليوم — الفراغ يبقى فراغاً
    const dateBegin = normalizeDate(cellText(row, ['تاريخ البدء', 'DateBegin']));
    const dateEnd = normalizeDate(cellText(row, ['تاريخ الانتهاء', 'DateEnd']));
    if (dateBegin === '') report.blank(line, 'تاريخ البدء');
    if (dateEnd === '') report.blank(line, 'تاريخ الانتهاء');

    // الأرصدة: الفراغ يُقرأ صفراً (ضرورة حسابية) ويُسجَّل صراحةً
    const yer = cellNumber(row, ['الرصيد بالريال اليمني', 'Balance_YER', 'الرصيد'], normalizeArabicDigits);
    const sar = cellNumber(row, ['الرصيد بالريال السعودي', 'Balance_SAR'], normalizeArabicDigits);
    const usd = cellNumber(row, ['الرصيد بالدولار', 'Balance_USD'], normalizeArabicDigits);
    if (yer.blank) report.zeroed(line, 'الرصيد YER');
    if (sar.blank) report.zeroed(line, 'الرصيد SAR');
    if (usd.blank) report.zeroed(line, 'الرصيد USD');

    const phone = cellText(row, ['رقم الهاتف', 'Phone', 'الهاتف']);
    const address = cellText(row, ['العنوان / الموقع', 'Address', 'العنوان']);
    const notes = cellText(row, ['ملاحظات', 'Notes']);
    const isInternal =
      cellText(row, ['حساب داخلي / خاص', 'isInternalAccount']) === 'نعم' ||
      name.includes('حساب داخلي') ||
      name.includes('عهدة') ||
      name.includes('بضاعة تالفة');

    customers.push({
      id,
      subId,
      name,
      source: source as Customer['source'],
      region,
      route,
      significance: significance as Customer['significance'],
      status: status as Customer['status'],
      responsible,
      taskDesc,
      dateBegin,
      dateEnd,
      balanceYER: yer.value,
      balanceSAR: sar.value,
      balanceUSD: usd.value,
      phone,
      address,
      notes,
      isInternalAccount: isInternal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  warnings.push(...report.summary());

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
        const safeSheet = readFirstSheetSafe<Record<string, unknown>>(data, 'array');
        const rawJson = safeSheet.rows;

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
        const report = new ImportReport();
        const warnings: string[] = safeSheetWarnings(safeSheet);
        let duplicateCount = 0;

        rawJson.forEach((row, index) => {
          /**
           * R52 — ربط الأعمدة بمرحلتين: مطابقة تامة أولاً، ثم احتواء بالأطول أولاً.
           *
           * كان الترتيب معكوساً: يمرّ على أعمدة الملف ثم يقبل أول «احتواء» بأي اسم بديل.
           * فعمود «فئة الحساب» يطابق الاسم البديل «الحساب» فيُقرأ **اسم الحساب** فئتُه،
           * وعمود «رقم القيد (ID)» في قالب الاستيراد يطابق «القيد» فيُقرأ **نوع القيد**
           * رقمَ القيد — عطلان صامتان يفسدان السجل المالي بلا أي رسالة.
           */
          const findVal = (...aliases: string[]): string => {
            const keys = Object.keys(row);
            const value = (key: string): string => {
              const val = row[key];
              return val !== undefined && val !== null ? String(val).trim() : '';
            };

            // 1) مطابقة تامة (الأدقّ: لا التباس)
            for (const alias of aliases) {
              const a = alias.trim().toLowerCase();
              const key = keys.find((k) => k.trim().toLowerCase() === a);
              if (key !== undefined && value(key) !== '') return value(key);
            }
            // 2) احتواء جزئي — الاسم البديل الأطول أولاً (الأكثر تحديداً)، وتُتجاهل الخلايا الفارغة
            const byLength = [...aliases].sort((x, y) => y.trim().length - x.trim().length);
            for (const alias of byLength) {
              const a = alias.trim().toLowerCase();
              const key = keys.find((k) => k.trim().toLowerCase().includes(a));
              if (key !== undefined && value(key) !== '') return value(key);
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

          // أمانة الاستيراد: لا تاريخ ولا يوم ولا قيمة افتراضية — الفارغ يبقى فارغاً
          const line = index + 2;
          const formattedDate = normalizeDate(rawDate);
          if (!formattedDate) report.blank(line, 'التاريخ');

          /**
           * R52 — كان هنا `computeArabicDay` محلياً (20 سطراً) يعيد **«السبت»** لكل تاريخ
           * لا يُقرأ، أي أنه يخترع يوماً لم يكن في الملف — وهو نقيض سياسة أمانة الاستيراد.
           * صار يستخدم `calculateArabicDay` المعتمد (يعيد '' عند تاريخ غير صالح)،
           * وهو نفس الناتج لكل تاريخ صالح (وهو كل ما يمكن أن يصل إلى هنا).
           */
          const day = rawDay || (formattedDate ? calculateArabicDay(formattedDate) : '');

          const amountYER = parseFloat(normalizeArabicDigits(rawAmountYER || '0')) || 0;
          const amountSAR = parseFloat(normalizeArabicDigits(rawAmountSAR || '0')) || 0;
          const amountUSD = parseFloat(normalizeArabicDigits(rawAmountUSD || '0')) || 0;
          if (!rawAmountYER) report.zeroed(line, 'المبلغ YER');
          if (!rawAmountSAR) report.zeroed(line, 'المبلغ SAR');
          if (!rawAmountUSD) report.zeroed(line, 'المبلغ USD');

          const id = rawId || autoKey('ACC', line);

          if (!rawId) report.generated(line, 'رقم القيد', id);
          if (!rawImportance) report.blank(line, 'درجة الأهمية');
          if (!rawMovement) report.blank(line, 'الحركة');
          if (!rawRestriction) report.blank(line, 'نوع القيد');
          if (!rawMovementType) report.blank(line, 'طريقة الدفع');
          if (!rawCatAccount) report.blank(line, 'فئة الحساب');
          if (!rawRestAccount) report.blank(line, 'حساب التقييد');
          if (!rawAccountName) report.blank(line, 'اسم الحساب');
          if (!rawNumber) report.blank(line, 'رقم السند');

          if (existingIds.has(id)) {
            duplicateCount++;
          }

          parsed.push({
            id,
            day,
            date: formattedDate,
            importance: rawImportance,
            movement: rawMovement,
            restriction: rawRestriction,
            movementType: rawMovementType,
            categoryAccount: rawCatAccount,
            restrictionAccount: rawRestAccount,
            accountName: rawAccountName,
            description: rawDesc || undefined,
            number: rawNumber,
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

        warnings.push(...report.summary());

        resolve({
          success: true,
          transactions: parsed,
          errors: [],
          totalRows: rawJson.length,
          validRows: parsed.length,
          duplicateCount,
          warnings,
        });
      } catch (err: unknown) {
        console.error(err);
        resolve({
          success: false,
          transactions: [],
          errors: [
            'حدث خطأ أثناء قراءة ملف الإكسل: ' +
              ((err instanceof Error ? err.message : String(err)) || 'تنسيق الملف غير صالح'),
          ],
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
