/**
 * قراءة ملفات Excel بأمان (تخفيف R3).
 *
 * `xlsx@0.18.5` غير محدّثة على npm وفيها ثغرتان معروفتان (Prototype Pollution + ReDoS)
 * بلا إصلاح متاح في السجل العام. لا يمكننا استبدال المكتبة الآن، لذلك نحصر سطح الهجوم:
 *
 *   1) حدّ لحجم الملف قبل القراءة (15MB) — يمنع استهلاك الذاكرة/التعليق على ملفات ضخمة.
 *   2) `sheetRows` في `XLSX.read` — يُوقف التحليل عند سقف صفوف فلا يكتمل نمط ReDoS.
 *   3) تنظيف مفاتيح الصفوف من `__proto__` / `constructor` / `prototype` — يُبطل تلويث prototype.
 *   4) تعطيل قراءة الصيغ وVBA وHTML داخل الخلايا (لا نحتاجها في الاستيراد).
 *   5) كل خطأ يُحوَّل إلى رسالة عربية واضحة بدل انهيار النافذة.
 *
 * كل مُحلّل استيراد يجب أن يمرّ من هنا — بوابة `npm run security` تفشل على أي `XLSX.read` خارج هذا الملف.
 */
import * as XLSX from 'xlsx';

/** أقصى حجم ملف مقبول للاستيراد (15 ميجابايت). */
export const MAX_IMPORT_BYTES = 15 * 1024 * 1024;
/** أقصى عدد صفوف يُحلَّل من ورقة واحدة. */
export const MAX_IMPORT_ROWS = 20_000;

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export class ImportSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportSecurityError';
  }
}

export interface SafeSheetResult<T = Record<string, unknown>> {
  /** صفوف الورقة الأولى بعد التنظيف */
  rows: T[];
  /** هل تم إيقاف التحليل عند السقف؟ (ملف أكبر من المسموح) */
  truncated: boolean;
  /** عدد المفاتيح الخطرة التي أُزيلت (للتقرير) */
  sanitizedKeys: number;
}

/** يتحقّق من حجم الملف قبل أي تحليل. */
export function assertFileSize(file: { size?: number; name?: string } | null | undefined): void {
  const size = file?.size ?? 0;
  if (size > MAX_IMPORT_BYTES) {
    const mb = (size / (1024 * 1024)).toFixed(1);
    throw new ImportSecurityError(
      `حجم الملف ${mb}MB يتجاوز الحد المسموح ${MAX_IMPORT_BYTES / (1024 * 1024)}MB. قسّم الملف ثم أعد المحاولة.`
    );
  }
}

/** يُزيل المفاتيح الخطرة من صف واحد (تلويث prototype) ويعدّها. */
function sanitizeRow(row: Record<string, unknown>): { row: Record<string, unknown>; removed: number } {
  let removed = 0;
  for (const key of Object.keys(row)) {
    if (FORBIDDEN_KEYS.has(key)) {
      delete (row as Record<string, unknown>)[key];
      removed += 1;
    }
  }
  return { row, removed };
}

/** يقرأ الورقة الأولى بعد حدود الأمان ويعيد الصفوف منظّفة. */
export function readFirstSheetSafe<T = Record<string, unknown>>(
  data: ArrayBuffer | Uint8Array | string,
  type: 'array' | 'binary' = 'array'
): SafeSheetResult<T> {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data as never, {
      type,
      // سقف الصفوف يوقف التحليل مبكراً (تخفيف ReDoS)
      sheetRows: MAX_IMPORT_ROWS + 1,
      cellFormula: false,
      cellHTML: false,
      cellStyles: false,
      bookVBA: false,
      bookDeps: false,
      cellNF: false,
    });
  } catch (err: unknown) {
    throw new ImportSecurityError(
      `تعذّر قراءة الملف — تأكد أنه ملف Excel/CSV سليم (${err instanceof Error ? err.message : String(err)})`
    );
  }

  const sheetName = workbook.SheetNames?.[0];
  if (!sheetName || !workbook.Sheets?.[sheetName]) {
    return { rows: [], truncated: false, sanitizedKeys: 0 };
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    defval: '',
    raw: true,
  });

  const truncated = rawRows.length > MAX_IMPORT_ROWS;
  const limited = truncated ? rawRows.slice(0, MAX_IMPORT_ROWS) : rawRows;

  let sanitizedKeys = 0;
  const rows = limited.map((row) => {
    const { row: clean, removed } = sanitizeRow(row);
    sanitizedKeys += removed;
    return clean as T;
  });

  return { rows, truncated, sanitizedKeys };
}

/** يقرأ الورقة الأولى كمصفوفة صفوف (نمط `header: 1`) مع نفس حدود الأمان. */
export function readFirstSheetAoaSafe(
  data: ArrayBuffer | Uint8Array | string,
  type: 'array' | 'binary' = 'array'
): { rows: unknown[][]; truncated: boolean } {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data as never, {
      type,
      sheetRows: MAX_IMPORT_ROWS + 1,
      cellFormula: false,
      cellHTML: false,
      cellStyles: false,
      bookVBA: false,
      bookDeps: false,
      cellNF: false,
    });
  } catch (err: unknown) {
    throw new ImportSecurityError(
      `تعذّر قراءة الملف — تأكد أنه ملف Excel/CSV سليم (${err instanceof Error ? err.message : String(err)})`
    );
  }
  const sheetName = workbook.SheetNames?.[0];
  if (!sheetName || !workbook.Sheets?.[sheetName]) return { rows: [], truncated: false };
  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: '',
    raw: true,
    blankrows: false,
  });
  const truncated = rows.length > MAX_IMPORT_ROWS;
  return { rows: truncated ? rows.slice(0, MAX_IMPORT_ROWS) : rows, truncated };
}

/** رسالة عربية موحّدة لملف مُقتطع أو مُنظَّف — تُضاف إلى تحذيرات الاستيراد. */
export function safeSheetWarnings(result: SafeSheetResult): string[] {
  const out: string[] = [];
  if (result.truncated) {
    out.push(`الملف أكبر من ${MAX_IMPORT_ROWS} صفاً — حُلِّل أول ${MAX_IMPORT_ROWS} صفاً فقط.`);
  }
  if (result.sanitizedKeys > 0) {
    out.push(`أُزيل ${result.sanitizedKeys} مفتاحاً خطِراً من بيانات الملف (حماية من تلويث prototype).`);
  }
  return out;
}
