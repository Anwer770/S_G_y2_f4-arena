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
import type { DebtCommitment, MovementRecord, Product } from '../../types';

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
  commitments: DebtCommitment[];
  /** تاريخ اليوم YYYY-MM-DD (يُمرَّر للاختبار) */
  today: string;
  /** حد الطلب الافتراضي لكل صنف لا يحدّد حدّاً خاصاً */
  defaultReorderPoint?: number;
  /** عدد الأيام قبل الاستحقاق */
  leadDays?: number;
}

const DAY_MS = 86_400_000;

/** الفرق بالأيام بين تاريخين (YYYY-MM-DD) بلا تأثير المنطقة الزمنية. */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.NaN;
  return Math.round((b - a) / DAY_MS);
}

/** الكمية المتاحة لكل صنف (بالاسم كما تُسجَّل الحركات). */
export function computeOnHand(products: Product[], movements: MovementRecord[]): Record<string, number> {
  const onHand: Record<string, number> = {};
  for (const p of products) onHand[p.name] = Number(p.openingStock) || 0;
  for (const m of movements) {
    const items = m.items || {};
    for (const [name, qty] of Object.entries(items)) {
      const q = Number(qty) || 0;
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
    const qty = onHand[p.name] ?? 0;
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

const paidOf = (c: DebtCommitment): number =>
  Array.isArray(c.payments) ? c.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) : 0;

/** تنبيهات الالتزامات قبل الاستحقاق (افتراضياً 3 أيام) + المتأخرة. */
export function computeDebtAlerts(commitments: DebtCommitment[], today: string, leadDays = 3): SystemAlert[] {
  const alerts: SystemAlert[] = [];
  for (const c of commitments) {
    if (c.status === 'مكتمل' || c.status === 'ملغي') continue;
    const remaining = (Number(c.amount) || 0) - paidOf(c);
    if (remaining <= 0) continue;
    const due = c.endDate || c.date;
    if (!due) continue;
    const daysLeft = daysBetween(today, due);
    if (Number.isNaN(daysLeft)) continue;
    if (daysLeft > leadDays) continue;
    alerts.push({
      id: `debt-${c.id}`,
      kind: 'debt',
      severity: daysLeft < 0 ? 'critical' : 'warning',
      title: daysLeft < 0 ? `التزام متأخر: ${c.name}` : `استحقاق قريب: ${c.name}`,
      detail:
        daysLeft < 0
          ? `تجاوز الاستحقاق بـ ${Math.abs(daysLeft)} يوماً — المتبقّي ${remaining.toLocaleString('ar-EG')} ${c.currency || ''}.`
          : `يستحق بعد ${daysLeft} ${daysLeft === 1 ? 'يوم' : 'أيام'} — المتبقّي ${remaining.toLocaleString('ar-EG')} ${c.currency || ''}.`,
      entityId: c.id,
      daysLeft,
    });
  }
  return alerts.sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
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
