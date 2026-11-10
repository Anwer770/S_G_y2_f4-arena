// @vitest-environment jsdom
/**
 * الديون: الحسابات التي تُعرض على الشاشة (R54).
 *
 * `debtAnalytics` كان خارج المقام: إدخاله أنزل الأسطر من 100% إلى 78.35% مع بقية ملفات
 * الدفعة. الاختبارات هنا لا تقيس «أن الدالة تعمل» بل **أن الرقم المعروض صحيح**:
 * العملة التي تُخلط، والحالة التي يُختلف في تفسيرها بين شاشتين.
 */
import { describe, expect, it } from 'vitest';
import {
  calculateCommitmentRemaining,
  calculateDebtStats,
  computeAliQatRunningBalances,
  formatDebtAmount,
  generateNextCommitmentId,
  getLocalDateString,
} from '../../src/utils/debts/debtAnalytics';
import { DEFAULT_DEBT_COMMITMENTS } from '../../src/utils/debts/debtCommitmentSeeds';
import { DEFAULT_DEBT_RECORDS } from '../../src/utils/debts/debtSeeds';
import type { DebtCommitment, DebtRecord } from '../../src/types';

const DAY = 86_400_000;
const iso = (offsetDays: number): string => new Date(Date.now() + offsetDays * DAY).toISOString().split('T')[0];

const debt = (over: Partial<DebtRecord> = {}): DebtRecord => ({
  id: 'DEBT-0001',
  book: 'anwar',
  date: '2024-01-01',
  icon: '',
  name: 'قيد',
  currency: 'YER',
  debit: 0,
  credit: 0,
  note: '',
  isCompleted: false,
  ...over,
});

const commitment = (over: Partial<DebtCommitment> = {}): DebtCommitment => ({
  id: 'التزامات-900',
  name: 'التزام',
  date: '2024-01-01',
  endDate: iso(10),
  priority: 'B',
  status: 'جارية',
  icon: '★',
  owner: 'أنور',
  category: 'أخرى',
  amount: 1000,
  currency: 'YER',
  dir: 'debit',
  payments: [],
  ...over,
});

describe('calculateCommitmentRemaining — الحالة والتناقض بين شاشتين', () => {
  it('يجمع الدفعات ويحصر المتبقي عند صفر ويحسب النسبة', () => {
    const c = commitment({
      amount: 1000,
      payments: [
        { pid: 'P1', date: '2024-01-02', amount: 400 },
        { pid: 'P2', date: '2024-01-03', amount: 300 },
      ],
    });

    const r = calculateCommitmentRemaining(c);

    expect(r.paid).toBe(700);
    expect(r.remaining).toBe(300);
    expect(r.progressPercent).toBe(70);
    expect(r.isCompleted).toBe(false);
  });

  it('دفعات تتجاوز المبلغ ⇒ المتبقي صفر والتقدّم 100 لا 120', () => {
    const c = commitment({ amount: 1000, payments: [{ pid: 'P1', date: '2024-01-02', amount: 1300 }] });
    const r = calculateCommitmentRemaining(c);

    expect(r.remaining).toBe(0);
    expect(r.progressPercent).toBe(100);
    expect(r.isCompleted).toBe(true);
  });

  it('مبلغ صفر لا يُنتج قسمة على صفر', () => {
    const r = calculateCommitmentRemaining(commitment({ amount: 0 }));
    expect(r.progressPercent).toBe(0);
    expect(Number.isFinite(r.remaining)).toBe(true);
  });

  it('«منجز» بلا علامة ✔ يُعدّ منجزاً — نفس ما تعتقده الإحصاءات', () => {
    /* العيب: `calculateCommitmentRemaining` تشترط النص الحرفي 'منجز ✔' أو icon '✔'،
       بينما `calculateDebtStats` تستخدم `status.includes('منجز')`. فالالتزام نفسه
       يظهر «جارياً» في نافذة التفاصيل و«منجزاً» في الإحصاءات. */
    const c = commitment({ status: 'منجز', icon: '' });

    expect(calculateCommitmentRemaining(c).isCompleted).toBe(true);
    expect(calculateDebtStats([], [c]).completedCommitmentsCount).toBe(1);
  });

  it('«منجز ✔» وicon ✔ و«مكتمل» كلها منجزة', () => {
    expect(calculateCommitmentRemaining(commitment({ status: 'منجز ✔' })).isCompleted).toBe(true);
    expect(calculateCommitmentRemaining(commitment({ status: 'جارية', icon: '✔' })).isCompleted).toBe(true);
    expect(calculateCommitmentRemaining(commitment({ status: 'مكتمل' })).isCompleted).toBe(true);
  });
});

describe('calculateDebtStats — العملات', () => {
  it('كل عملة في دلوها الصحيح', () => {
    const records = [
      debt({ id: 'A', currency: 'YER', debit: 100, credit: 40 }),
      debt({ id: 'B', currency: 'USD', debit: 10, credit: 3 }),
      debt({ id: 'C', currency: 'SAR', debit: 20, credit: 5 }),
    ];

    const s = calculateDebtStats(records, []);

    expect(s.totalDebitYER).toBe(100);
    expect(s.netYER).toBe(-60);
    expect(s.totalDebitUSD).toBe(10);
    expect(s.netUSD).toBe(-7);
    expect(s.totalDebitSAR).toBe(20);
    expect(s.netSAR).toBe(-15);
  });

  it('أسماء عملة عربية ومختصرة تُقبل', () => {
    const s = calculateDebtStats(
      [
        debt({ id: 'A', currency: 'ريال يمني', debit: 1 }),
        debt({ id: 'B', currency: 'دولار', debit: 2 }),
        debt({ id: 'C', currency: 'ر.س', debit: 3 }),
        debt({ id: 'D', currency: '$', debit: 4 }),
      ],
      []
    );

    expect(s.totalDebitYER).toBe(1);
    expect(s.totalDebitUSD).toBe(6);
    expect(s.totalDebitSAR).toBe(3);
  });

  it('مسافات وحالة أحرف لا تُخرج العملة من دلوها', () => {
    /* العيب: `toUpperCase()` بلا `trim()` ⇒ ' usd ' لا تُطابق شيئاً فتسقط في دلو الريال،
       فرقم الدولار يُضاف إلى إجمالي الريال. */
    const s = calculateDebtStats(
      [debt({ id: 'A', currency: ' usd ', debit: 7 }), debt({ id: 'B', currency: 'Sar ', debit: 9 })],
      []
    );

    expect(s.totalDebitUSD).toBe(7);
    expect(s.totalDebitSAR).toBe(9);
    expect(s.totalDebitYER).toBe(0);
  });

  it('عملة مجهولة تُبلَّغ ولا تُخلط صامتة في الريال', () => {
    const s = calculateDebtStats(
      [debt({ id: 'A', currency: 'EUR', debit: 100, credit: undefined as never })],
      [commitment({ id: 'C', currency: 'KWD' })]
    );

    expect(s.totalDebitYER).toBe(0);
    expect(s.unknownCurrencyCount).toBe(2);
    expect(s.unknownCurrencies).toEqual(['EUR', 'KWD']);
    expect(s.totalCommitmentsAmountByCurrency).toEqual({ YER: 0, USD: 0, SAR: 0 });
  });
});

describe('calculateDebtStats — الدفاتر والالتزامات', () => {
  it('يفصل دفتر أنور عن دفتر علي القات', () => {
    const s = calculateDebtStats(
      [
        debt({ id: 'A', book: 'anwar', debit: 50, credit: 20 }),
        debt({ id: 'B', book: 'ali_qat', debit: 10, credit: 90 }),
      ],
      []
    );

    expect(s.anwarDebit).toBe(50);
    expect(s.anwarCredit).toBe(20);
    expect(s.anwarNet).toBe(-30);
    expect(s.aliQatNetBalance).toBe(80);
  });

  it('الالتزامات: مكتمل وجارٍ ومتأخر وقريب الاستحقاق', () => {
    const s = calculateDebtStats(
      [],
      [
        commitment({ id: 'C1', amount: 1000, payments: [{ pid: 'P', date: '2024-01-01', amount: 1000 }] }),
        commitment({ id: 'C2', amount: 500, endDate: iso(-5) }),
        commitment({ id: 'C3', amount: 300, endDate: iso(3) }),
        commitment({ id: 'C4', amount: 200, endDate: iso(90) }),
      ],
      30
    );

    expect(s.commitmentsCount).toBe(4);
    expect(s.completedCommitmentsCount).toBe(1);
    expect(s.activeCommitmentsCount).toBe(3);
    expect(s.overdueCommitmentsCount).toBe(1);
    expect(s.dueSoonCommitmentsCount).toBe(1);
    expect(s.overdueCommitments[0].daysOverdue).toBe(5);
    expect(s.dueSoonCommitments[0].daysRemaining).toBe(3);
    expect(s.commitmentsCompletionRate).toBe(25);
  });

  it('قائمة المتأخرات مرتّبة بالأقدم أولاً، والقريبة بالأقرب أولاً', () => {
    const s = calculateDebtStats(
      [],
      [
        commitment({ id: 'C1', endDate: iso(-2) }),
        commitment({ id: 'C2', endDate: iso(-9) }),
        commitment({ id: 'C3', endDate: iso(6) }),
        commitment({ id: 'C4', endDate: iso(1) }),
      ],
      30
    );

    expect(s.overdueCommitments.map((c) => c.id)).toEqual(['C2', 'C1']);
    expect(s.dueSoonCommitments.map((c) => c.id)).toEqual(['C4', 'C3']);
  });

  it('الالتزام المنجز لا يدخل المتأخرات ولو تجاوز موعده', () => {
    const s = calculateDebtStats([], [commitment({ status: 'منجز ✔', endDate: iso(-30) })]);

    expect(s.overdueCommitmentsCount).toBe(0);
    expect(s.activeCommitmentsCount).toBe(0);
  });

  it('التزام نشط بلا تاريخ استحقاق يبقى نشطاً بلا تنبيه، والدفعات الغائبة تعامل كقائمة فارغة', () => {
    const c = commitment({ endDate: '' as never, payments: undefined as never });
    const s = calculateDebtStats([], [c]);

    expect(calculateCommitmentRemaining(c)).toMatchObject({ paid: 0, remaining: 1000, isCompleted: false });
    expect(s.activeCommitmentsCount).toBe(1);
    expect(s.overdueCommitmentsCount).toBe(0);
    expect(s.dueSoonCommitmentsCount).toBe(0);
  });

  it('إجمالي الالتزامات بالريال لا يضم الدولار ولا السعودي', () => {
    /* العيب المقيس على البيانات المُشحونة نفسها: 9 التزامات بالريال + 2 دولار + 1 سعودي
       كانت تُجمع كلها في حقل اسمه `...AmountYER` ويُعرض على الشاشة «ريال». */
    const s = calculateDebtStats([], DEFAULT_DEBT_COMMITMENTS);

    expect(s.totalCommitmentsAmountYER).toBe(1_326_000);
    expect(s.totalCommitmentsAmountByCurrency.USD).toBe(700);
    expect(s.totalCommitmentsAmountByCurrency.SAR).toBe(1800);
    expect(s.totalCommitmentsAmount).toBe(s.totalCommitmentsAmountYER);
  });

  it('توزيع الفئات يوزّع المتبقي لا المبلغ الكامل', () => {
    const s = calculateDebtStats(
      [],
      [
        commitment({
          id: 'C1',
          category: 'إيجار',
          amount: 1000,
          payments: [{ pid: 'P', date: '2024-01-01', amount: 600 }],
        }),
        commitment({ id: 'C2', category: 'فواتير', amount: 400 }),
      ]
    );

    expect(s.categoryDistribution[0]).toMatchObject({ category: 'إيجار', amount: 400, count: 1 });
    expect(s.categoryDistribution[1]).toMatchObject({ category: 'فواتير', amount: 400, count: 1 });
    expect(s.categoryDistribution[0].percentage).toBe(50);
  });

  it('قائمة فارغة تماماً لا تُنتج NaN', () => {
    const s = calculateDebtStats([], []);

    expect(s.commitmentsCompletionRate).toBe(0);
    expect(s.categoryDistribution).toEqual([]);
    expect(s.netYER).toBe(0);
  });

  it('يحمي الحقول القديمة الفارغة: عملة وحالة وفئة ومبلغ وتاريخ اختياري', () => {
    const legacyDebt = debt({ currency: '' });
    const legacyCommitment = commitment({
      currency: '' as never,
      status: '' as never,
      category: '' as never,
      endDate: '' as never,
      amount: undefined as never,
      payments: undefined as never,
    });
    const s = calculateDebtStats([legacyDebt], [legacyCommitment]);

    expect(s.totalDebitYER).toBe(0);
    expect(s.totalCommitmentsAmountYER).toBe(0);
    expect(s.activeCommitmentsCount).toBe(0); // الالتزام صفر المبلغ محسوم، حتى بلا حالة
    expect(s.categoryDistribution).toEqual([{ category: 'أخرى', amount: 0, count: 1, percentage: 0 }]);
  });
});

describe('الرصيد التراكمي والترقيم والتنسيق', () => {
  it('الرصيد التراكمي لعلي القات = مجموع (دائن − مدين)', () => {
    const out = computeAliQatRunningBalances([
      debt({ id: 'A', credit: 100, debit: 0 }),
      debt({ id: 'B', credit: 0, debit: 40 }),
      debt({ id: 'C', credit: 10, debit: 0 }),
    ]);

    expect(out.map((r) => r.runningBalance)).toEqual([100, 60, 70]);
  });

  it('الترقيم التالي يبدأ من 001 ويتجاوز الأعلى ويتجاهل غير المطابق', () => {
    expect(generateNextCommitmentId([])).toBe('التزامات-001');
    expect(
      generateNextCommitmentId([
        commitment({ id: 'التزامات-007' }),
        commitment({ id: 'التزامات-030' }),
        commitment({ id: 'ملاحظة-999' }),
        commitment({ id: '' as never }),
      ])
    ).toBe('التزامات-031');
  });

  it('تاريخ الإدخال يبقى تقويمياً محلياً والتنسيق يضع رمز العملة في موضعه', () => {
    expect(getLocalDateString(new Date(2026, 10, 7, 0, 5))).toBe('2026-11-07');
    expect(formatDebtAmount(1200, 'YER')).toContain('ريال');
    expect(formatDebtAmount(1200, 'USD')).toContain('$');
    expect(formatDebtAmount(1200, 'SAR')).toContain('ر.س');
    expect(formatDebtAmount(0)).toBe('0 ريال');
    expect(formatDebtAmount(0, '' as never)).toBe('0 ريال');
  });

  it('بيانات الديون المُشحونة تُحسب بلا NaN ولا خلط عملات', () => {
    const s = calculateDebtStats(DEFAULT_DEBT_RECORDS, DEFAULT_DEBT_COMMITMENTS);

    expect(s.totalRecords).toBe(126);
    expect(Number.isFinite(s.netYER)).toBe(true);
    expect(s.unknownCurrencyCount).toBe(0);
    expect(s.totalDebitYER + s.totalDebitUSD + s.totalDebitSAR).toBeGreaterThan(0);
  });
});
