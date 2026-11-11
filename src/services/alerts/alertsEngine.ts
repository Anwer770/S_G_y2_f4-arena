/**
 * محرك التنبيهات الاستباقية (Automation Engine) — منطق نقي قابل للاختبار.
 *
 * يغطي تنبيهين لم يكن النظام يفعّلهما فعلياً:
 *   1) **حد الطلب (Reorder Point):** كميات الأصناف تُحسب من الرصيد الافتتاحي + التوريد − الصرف،
 *      وعند بلوغ حدّ الطلب يُولَّد تنبيه (حرج إن وصل صفراً).
 *   2) **الديون والالتزامات:** تنبيه قبل الاستحقاق بـ 3 أيام (قابل للتعديل) للمتبقّي غير المسدَّد.
 *
 * لا يقرأ من التخزين ولا يرسم — يستهلكه `App` لحساب شارة التنبيهات ومركز التنبيهات.
 */
import type { Commitment, DebtCommitment, MovementRecord, Product } from '../../types';

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertKind = 'stock' | 'debt';

export interface SystemAlert {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  detail: string;
  entityId?: string;
  /** أيام متبقية (سالب = متأخر) للديون */
  daysLeft?: number;
  /** الكمية الحالية للأصناف */
  quantity?: number;
}

export interface AlertsInput {
  products: Product[];
  movements: MovementRecord[];
  commitments: AlertCommitment[];
  /** تاريخ اليوم YYYY-MM-DD (يُمرَّر للاختبار) */
  today: string;
  /** حد الطلب الافتراضي لكل صنف لا يحدّد حدّاً خاصاً */
  defaultReorderPoint?: number;
  /** عدد الأيام قبل الاستحقاق */
  leadDays?: number;
}

const DAY_MS = 86_400_000;

/**
 * يقبل تاريخاً تقويمياً كاملاً فقط. `Date.parse` يطبع تاريخاً مثل 2026-02-31
 * إلى مارس، فتتحول بيانات تالفة إلى إنذار صحيح ظاهرياً.
 */
const parseCalendarDate = (value: string): number => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return Number.NaN;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1) {
    return Number.NaN;
  }
  return timestamp;
};

/** الفرق بالأيام بين تاريخين (YYYY-MM-DD) بلا تأثير المنطقة الزمنية. */
export function daysBetween(from: string, to: string): number {
  const a = parseCalendarDate(from);
  const b = parseCalendarDate(to);
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.NaN;
  return Math.round((b - a) / DAY_MS);
}

/** الكمية المتاحة لكل صنف (بالاسم كما تُسجَّل الحركات). */
export function computeOnHand(products: Product[], movements: MovementRecord[]): Record<string, number> {
  const onHand: Record<string, number> = {};
  for (const p of products) onHand[p.name] = Number(p.openingStock) || 0;
  for (const m of movements) {
    /** يطابق رصيد المخزون: الإذن الملغي لا يغير كمية متاحة. */
    if (m.status === 'ملغي') continue;
    const items = m.items || {};
    for (const [name, qty] of Object.entries(items)) {
      const q = Number(qty);
      if (!Number.isFinite(q) || q <= 0) continue;
      if (!(name in onHand)) onHand[name] = 0;
      onHand[name] += m.movementType === 'توريد' ? q : -q;
    }
  }
  return onHand;
}

/** تنبيهات حدّ الطلب. */
export function computeReorderAlerts(
  products: Product[],
  movements: MovementRecord[],
  defaultReorderPoint = 5
): SystemAlert[] {
  const onHand = computeOnHand(products, movements);
  const alerts: SystemAlert[] = [];
  for (const p of products) {
    if (p.isActive === false) continue;
    const reorder = Number((p as Product & { reorderPoint?: number }).reorderPoint ?? defaultReorderPoint);
    if (!Number.isFinite(reorder) || reorder <= 0) continue;
    const qty = onHand[p.name];
    if (qty > reorder) continue;
    alerts.push({
      id: `stock-${p.id}`,
      kind: 'stock',
      severity: qty <= 0 ? 'critical' : 'warning',
      title: qty <= 0 ? `نفاد الصنف: ${p.name}` : `بلغ حد الطلب: ${p.name}`,
      detail:
        qty <= 0
          ? `الكمية المتاحة 0 ${p.unit || ''} — يجب التوريد فوراً.`
          : `الكمية المتاحة ${qty} ${p.unit || ''} وحدّ الطلب ${reorder}.`,
      entityId: p.id,
      quantity: qty,
    });
  }
  return alerts.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1));
}

/** الالتزام القديم في App ودفتر الديون الحديث كلاهما يغذيان مركز التنبيهات. */
export type AlertCommitment = Commitment | DebtCommitment;

const paidOf = (commitment: AlertCommitment): number => {
  const payments = 'payments' in commitment ? commitment.payments : undefined;
  return Array.isArray(payments)
    ? payments.reduce((sum, payment) => {
        const amount = Number(payment.amount);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0)
    : 0;
};

const isClosedCommitment = (status: string): boolean =>
  status === 'مكتمل' || status === 'منجز' || status === 'منجز ✔' || status === 'تم الانجاز' || status === 'ملغي';

const dueOf = (commitment: AlertCommitment): string | undefined =>
  'endDate' in commitment ? commitment.endDate || commitment.date : commitment.due;

const currencyOf = (commitment: AlertCommitment): string => ('currency' in commitment ? commitment.currency || '' : '');

/** تنبيهات الالتزامات قبل الاستحقاق (افتراضياً 3 أيام) + المتأخرة. */
export function computeDebtAlerts(commitments: AlertCommitment[], today: string, leadDays = 3): SystemAlert[] {
  const alerts: SystemAlert[] = [];
  for (const commitment of commitments) {
    if (isClosedCommitment(commitment.status)) continue;
    const amount = Number(commitment.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const remaining = amount - paidOf(commitment);
    if (remaining <= 0) continue;
    const due = dueOf(commitment);
    if (!due) continue;
    const daysLeft = daysBetween(today, due);
    if (Number.isNaN(daysLeft)) continue;
    if (daysLeft > leadDays) continue;
    const currency = currencyOf(commitment);
    alerts.push({
      id: `debt-${commitment.id}`,
      kind: 'debt',
      severity: daysLeft < 0 ? 'critical' : 'warning',
      title: daysLeft < 0 ? `التزام متأخر: ${commitment.name}` : `استحقاق قريب: ${commitment.name}`,
      detail:
        daysLeft < 0
          ? `تجاوز الاستحقاق بـ ${Math.abs(daysLeft)} يوماً — المتبقّي ${remaining.toLocaleString('ar-EG')} ${currency}.`
          : `يستحق بعد ${daysLeft} ${daysLeft === 1 ? 'يوم' : 'أيام'} — المتبقّي ${remaining.toLocaleString('ar-EG')} ${currency}.`,
      entityId: commitment.id,
      daysLeft,
    });
  }
  return alerts.sort((a, b) => a.daysLeft! - b.daysLeft!);
}

/** كل التنبيهات مرتّبة بالخطورة. */
export function computeSystemAlerts(input: AlertsInput): SystemAlert[] {
  const { products, movements, commitments, today, defaultReorderPoint = 5, leadDays = 3 } = input;
  const all = [
    ...computeReorderAlerts(products || [], movements || [], defaultReorderPoint),
    ...computeDebtAlerts(commitments || [], today, leadDays),
  ];
  const rank: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return all.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export const alertsSummary = (alerts: SystemAlert[]) => ({
  total: alerts.length,
  critical: alerts.filter((a) => a.severity === 'critical').length,
  stock: alerts.filter((a) => a.kind === 'stock').length,
  debt: alerts.filter((a) => a.kind === 'debt').length,
});
