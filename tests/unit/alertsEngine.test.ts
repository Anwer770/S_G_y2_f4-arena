import { describe, expect, it } from 'vitest';
import type { Commitment, DebtCommitment, MovementRecord, Product } from '../../src/types';
import {
  alertsSummary,
  computeDebtAlerts,
  computeOnHand,
  computeReorderAlerts,
  computeSystemAlerts,
  daysBetween,
} from '../../src/services/alerts/alertsEngine';

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'P-1',
  name: 'صنف أ',
  openingStock: 0,
  unit: 'علبة',
  isActive: true,
  ...overrides,
});

const movement = (overrides: Partial<MovementRecord> = {}): MovementRecord => ({
  id: 'MV-1',
  mainId: 'CAT-1',
  subId: 'IN-0001',
  date: '2026-11-07',
  beneficiary: 'مورد',
  description: 'حركة اختبار',
  movementType: 'توريد',
  status: 'تم التنفيذ',
  category: 'مشتريات',
  items: { 'صنف أ': 1 },
  ...overrides,
});

const commitment = (overrides: Partial<Commitment> = {}): Commitment => ({
  id: 'C-1',
  name: 'التزام اختبار',
  amount: 100,
  pri: 'B',
  due: '2026-11-07',
  status: 'قيد التنفيذ',
  ...overrides,
});

const debtCommitment = (overrides: Partial<DebtCommitment> = {}): DebtCommitment => ({
  id: 'D-1',
  name: 'التزام دفتر الديون',
  date: '2026-11-01',
  endDate: '2026-11-08',
  priority: 'B',
  status: 'جارية',
  icon: '⚐',
  owner: 'أنور',
  category: 'التزامات',
  amount: 100,
  currency: 'USD',
  dir: 'debit',
  payments: [],
  ...overrides,
});

describe('R67 — محرك تنبيهات المخزون والاستحقاق', () => {
  it('يفرق الأيام التقويمية UTC ويرفض النص الناقص أو التاريخ المستحيل بدل تطبيعه', () => {
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1);
    expect(daysBetween('2026-11-07', '2026-11-06')).toBe(-1);
    expect(Number.isNaN(daysBetween('2026-02-31', '2026-03-01'))).toBe(true);
    expect(Number.isNaN(daysBetween('2026-11', '2026-11-07'))).toBe(true);
    expect(Number.isNaN(daysBetween('2026-11-7', '2026-11-07'))).toBe(true);
    expect(Number.isNaN(daysBetween('not-a-date', '2026-11-07'))).toBe(true);
    expect(Number.isNaN(daysBetween('2026-11-07', '2026-13-01'))).toBe(true);
  });

  it('يحسب المتاح مثل دفتر المخزون: لا حركة ملغاة ولا كمية سالبة أو مشوهة', () => {
    const onHand = computeOnHand(
      [product({ name: 'أ', openingStock: 4 }), product({ id: 'P-2', name: 'ب', openingStock: 0 })],
      [
        movement({ id: 'in', items: { أ: 2 } }),
        movement({ id: 'cancelled', status: 'ملغي', items: { أ: 100 } }),
        movement({ id: 'out', movementType: 'صرف', items: { أ: 3, مجهول: 2 } }),
        movement({ id: 'bad', items: { ب: -4, أ: 'ليس رقماً' as never } }),
        movement({ id: 'empty', items: undefined as never }),
      ]
    );

    expect(onHand).toEqual({ أ: 3, ب: 0, مجهول: -2 });
  });

  it('ينشئ إنذار حد الطلب للحالات الفعالة فقط، ويميز النفاد عن الوصول للحد ويرتب الحرج أولاً', () => {
    const alerts = computeReorderAlerts(
      [
        product({ id: 'critical', name: 'حرج', openingStock: 1, unit: '', reorderPoint: 5 }),
        product({ id: 'warning-1', name: 'تحذير أ', openingStock: 6, reorderPoint: 5 }),
        product({ id: 'warning-2', name: 'تحذير ب', openingStock: 5, unit: '', reorderPoint: 5 }),
        product({ id: 'abundant', name: 'وفير', openingStock: 7, reorderPoint: 5 }),
        product({ id: 'inactive', name: 'متوقف', openingStock: 0, isActive: false }),
        product({ id: 'disabled', name: 'بلا حد', openingStock: 0, reorderPoint: 0 }),
        product({ id: 'invalid', name: 'حد مشوه', openingStock: 0, reorderPoint: Number.NaN }),
      ],
      [
        movement({ id: 'out-critical', movementType: 'صرف', items: { حرج: 1 } }),
        movement({ id: 'cancelled', movementType: 'صرف', status: 'ملغي', items: { 'تحذير أ': 100 } }),
        movement({ id: 'out-warning', movementType: 'صرف', items: { 'تحذير أ': 2 } }),
      ]
    );

    expect(alerts.map((alert) => [alert.id, alert.severity, alert.quantity])).toEqual([
      ['stock-critical', 'critical', 0],
      ['stock-warning-1', 'warning', 4],
      ['stock-warning-2', 'warning', 5],
    ]);
    expect(alerts[0]?.title).toContain('نفاد الصنف');
    expect(alerts[0]?.detail).not.toContain('undefined');
    expect(alerts[1]?.title).toContain('بلغ حد الطلب');

    expect(
      computeReorderAlerts(
        [
          product({ id: 'late-warning', name: 'تحذير متقدم', openingStock: 2, reorderPoint: 5 }),
          product({ id: 'late-critical', name: 'حرج متقدم', openingStock: 0, reorderPoint: 5 }),
        ],
        []
      ).map((alert) => alert.id)
    ).toEqual(['stock-late-critical', 'stock-late-warning']);
  });

  it('يقرأ التزامات التطبيق الفعلية ودفتر الديون، ويستثني المنجز والملغى والمدفوع والمبلغ أو التاريخ غير الصالح', () => {
    const alerts = computeDebtAlerts(
      [
        commitment({ id: 'legacy-overdue', name: 'قديم', due: '2026-11-05' }),
        commitment({ id: 'legacy-today', name: 'اليوم', due: '2026-11-07' }),
        commitment({ id: 'legacy-complete', status: 'تم الانجاز', due: '2026-11-05' }),
        commitment({ id: 'legacy-cancelled', status: 'ملغي', due: '2026-11-05' }),
        commitment({ id: 'legacy-zero', amount: 0, due: '2026-11-05' }),
        commitment({ id: 'legacy-infinite', amount: Number.POSITIVE_INFINITY, due: '2026-11-05' }),
        commitment({ id: 'legacy-invalid', due: '2026-02-31' }),
        commitment({ id: 'legacy-none', due: undefined }),
        commitment({ id: 'legacy-far', due: '2026-11-12' }),
        debtCommitment({ id: 'debt-complete', status: 'مكتمل', endDate: '2026-11-05' }),
        debtCommitment({ id: 'debt-done', status: 'منجز', endDate: '2026-11-05' }),
        debtCommitment({ id: 'debt-done-symbol', status: 'منجز ✔', endDate: '2026-11-05' }),
        debtCommitment({
          id: 'debt-paid',
          endDate: '2026-11-05',
          payments: [{ pid: 'PAY-1', date: '2026-11-01', amount: 100 }],
        }),
        debtCommitment({ id: 'debt-date-fallback', endDate: '', date: '2026-11-07', currency: '' }),
        debtCommitment({
          id: 'debt-soon',
          endDate: '2026-11-08',
          amount: 100,
          payments: [
            { pid: 'PAY-2', date: '2026-11-01', amount: 40 },
            { pid: 'PAY-bad', date: '2026-11-01', amount: Number.NEGATIVE_INFINITY },
          ],
        }),
      ],
      '2026-11-07',
      1
    );

    expect(alerts.map((alert) => [alert.id, alert.severity, alert.daysLeft])).toEqual([
      ['debt-legacy-overdue', 'critical', -2],
      ['debt-legacy-today', 'warning', 0],
      ['debt-debt-date-fallback', 'warning', 0],
      ['debt-debt-soon', 'warning', 1],
    ]);
    expect(alerts[0]?.detail).toContain('تجاوز الاستحقاق');
    expect(alerts[1]?.detail).toContain('0 أيام');
    expect(alerts[3]?.detail).toContain('بعد 1 يوم');
    expect(alerts[3]?.detail).toContain('٦٠');
    expect(alerts[3]?.detail).toContain('USD');
  });

  it('يجمع الإنذارات حسب الخطورة ويحسب الملخص مع مدخلات غائبة آمنة', () => {
    const alerts = computeSystemAlerts({
      products: [product({ id: 'stock-critical', name: 'حرج', openingStock: 0 })],
      movements: [],
      commitments: [commitment({ id: 'overdue', due: '2026-11-06' })],
      today: '2026-11-07',
      defaultReorderPoint: 5,
      leadDays: 0,
    });

    expect(alerts.map((alert) => [alert.kind, alert.severity])).toEqual([
      ['stock', 'critical'],
      ['debt', 'critical'],
    ]);
    expect(alertsSummary(alerts)).toEqual({ total: 2, critical: 2, stock: 1, debt: 1 });
    expect(
      computeSystemAlerts({
        products: undefined as never,
        movements: undefined as never,
        commitments: undefined as never,
        today: '2026-11-07',
      })
    ).toEqual([]);
  });
});
