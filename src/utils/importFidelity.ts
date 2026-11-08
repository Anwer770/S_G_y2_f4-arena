/**
 * أمانة الاستيراد (Import Fidelity) — لا تُملأ الخلايا الفارغة بقيم افتراضية.
 *
 * المشكلة (طلب المستخدم + R18): كانت مُحلّلات Excel تضع قيماً مخترعة للخلايا الفارغة
 * (`'القيصر الذهبي'`، `'صنعاء'`، `'السبت'`، `'انور'`، `'تم التنفيذ'`، `'مبيعات'`، تاريخ اليوم…)،
 * فيظهر سجل لم يكن في الملف أصلاً ويستحيل التمييز بين ما استُورد وما اخترعه التطبيق.
 *
 * السياسة المعتمدة هنا:
 *   1) خلية فارغة ⇒ القيمة تبقى فارغة (`''`) أو صفراً للأرقام المالية (مع تسجيل ذلك).
 *   2) المفاتيح الداخلية (id/subId/mainId) مسموح بتوليدها لأن قاعدة البيانات تحتاج مفتاحاً،
 *      لكنها تُولَّد بوسم `AUTO-` ظاهر + تُسجَّل في التقرير، فلا تختلط بمعرّفات الملف.
 *   3) كل تعديل يُسجَّل سطراً بسطر (السطر · الحقل · النوع) ويُعرض للمستخدم قبل الاستيراد.
 *
 * ملف نقي (pure) بلا DOM ولا xlsx — لذلك يمكن اختباره مباشرة في `npm run imports`.
 */

export type FidelityKind = 'blank' | 'generated' | 'zeroed';

export interface FidelityNote {
  line: number;
  field: string;
  kind: FidelityKind;
  /** القيمة المولّدة إن وُجدت (للمفاتيح الداخلية فقط) */
  value?: string;
}

/** يجمع ملاحظات الاستيراد ويصوغها بلغة عربية للمستخدم. */
export class ImportReport {
  readonly notes: FidelityNote[] = [];

  blank(line: number, field: string): void {
    this.notes.push({ line, field, kind: 'blank' });
  }

  zeroed(line: number, field: string): void {
    this.notes.push({ line, field, kind: 'zeroed' });
  }

  generated(line: number, field: string, value: string): void {
    this.notes.push({ line, field, kind: 'generated', value });
  }

  get blanks(): number {
    return this.notes.filter((n) => n.kind === 'blank').length;
  }

  get zeroedCount(): number {
    return this.notes.filter((n) => n.kind === 'zeroed').length;
  }

  get generatedCount(): number {
    return this.notes.filter((n) => n.kind === 'generated').length;
  }

  /** أسطر جاهزة للعرض في نافذة الاستيراد (تُضاف إلى warnings). */
  summary(limit = 12): string[] {
    if (this.notes.length === 0) {
      return ['أمانة الاستيراد: كل الخلايا المستوردة مطابقة للملف — لا قيمة افتراضية واحدة.'];
    }
    const lines = [
      `أمانة الاستيراد: ${this.blanks} خلية فارغة بقيت فارغة كما في الملف · ` +
        `${this.generatedCount} مفتاح داخلي مولّد بوسم AUTO- · ` +
        `${this.zeroedCount} خلية رقمية فارغة قُرئت كـ 0 (ضرورة حسابية).`,
    ];
    const generated = this.notes.filter((n) => n.kind === 'generated');
    for (const n of generated.slice(0, limit)) {
      lines.push(`السطر ${n.line}: مفتاح داخلي مولّد (${n.field}) = ${n.value} — ليس من الملف.`);
    }
    return lines;
  }
}

/** يقرأ نص الخلية كما هو: الفراغ يبقى فراغاً. أول مرشّح غير فارغ فقط. */
export const cellText = (row: Record<string, unknown>, aliases: readonly string[]): string => {
  for (const key of aliases) {
    const raw = row?.[key];
    if (raw === undefined || raw === null) continue;
    const value = String(raw).trim();
    if (value !== '') return value;
  }
  return '';
};

/** مثل `cellText` لكن يُعيد أيضاً هل كانت الخلية فارغة (قبل أي تحويل). */
export const cellTextDetailed = (
  row: Record<string, unknown>,
  aliases: readonly string[]
): { value: string; blank: boolean } => {
  const value = cellText(row, aliases);
  return { value, blank: value === '' };
};

/** رقم من خلية: الفراغ ⇒ 0 مع إمكان تسجيله في التقرير (لا اختراع مبالغ). */
export const cellNumber = (
  row: Record<string, unknown>,
  aliases: readonly string[],
  convert: (raw: string) => string = (raw) => raw
): { value: number; blank: boolean } => {
  const raw = cellText(row, aliases);
  if (raw === '') return { value: 0, blank: true };
  const parsed = parseFloat(convert(raw));
  return Number.isFinite(parsed) ? { value: parsed, blank: false } : { value: 0, blank: true };
};

/**
 * مفتاح داخلي مولّد — بوسم `AUTO-` ظاهر حتى لا يُظنّ أنه معرّف قادم من الملف.
 * مثال: `autoKey('CUST', 12) === 'AUTO-CUST-0012'`
 */
export const autoKey = (prefix: string, line: number): string => `AUTO-${prefix}-${String(line).padStart(4, '0')}`;

/** هل المفتاح مولّد من التطبيق (لا من الملف)؟ */
export const isAutoKey = (value: string): boolean => /^AUTO-/.test(value);

/** نص ترويسة النافذة الذي يوضّح السياسة للمستخدم. */
export const IMPORT_FIDELITY_BANNER =
  'يُستورد الملف كما هو: الخلايا الفارغة تبقى فارغة، والمفاتيح الداخلية المولّدة تُوسم AUTO- وتُعرض لك قبل الحفظ.';
