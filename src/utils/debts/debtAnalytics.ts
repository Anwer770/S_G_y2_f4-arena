/**
 * الإحصاءات والحسابات المالية للديون — مستخرجة من utils/debts.ts (R30).
 */
import { DebtCommitment, DebtRecord } from '../../types';

// STATISTICAL & BUSINESS LOGIC CALCULATIONS (PRD RULES)
// ============================================================================

export type DebtCurrency = 'YER' | 'USD' | 'SAR';

export interface DebtCurrencyTotals {
  YER: number;
  USD: number;
  SAR: number;
}

/** تاريخ تقويمي محلي لـ input[type=date]، لا تاريخ UTC منزاح في منتصف الليل. */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DebtStatsSummary {
  totalRecords: number;
  totalDebitYER: number;
  totalCreditYER: number;
  netYER: number; // Credit - Debit
  totalDebitUSD: number;
  totalCreditUSD: number;
  netUSD: number;
  totalDebitSAR: number;
  totalCreditSAR: number;
  netSAR: number;

  // Anwar Ledger specific
  anwarDebit: number;
  anwarCredit: number;
  anwarNet: number;

  // Commitments Breakdown
  commitmentsCount: number;
  activeCommitmentsCount: number;
  overdueCommitmentsCount: number;
  dueSoonCommitmentsCount: number;
  overdueCount: number;
  dueSoonCount: number;
  completedCommitmentsCount: number;
  totalCommitmentsAmountYER: number;
  totalCommitmentsPaidYER: number;
  totalCommitmentsRemainingYER: number;
  /** إجماليات كل عملة على حدة؛ لا تُحوَّل العملات أو تُجمع معاً. */
  totalCommitmentsAmountByCurrency: DebtCurrencyTotals;
  totalCommitmentsPaidByCurrency: DebtCurrencyTotals;
  totalCommitmentsRemainingByCurrency: DebtCurrencyTotals;
  /** توافق رجعي: هذه الحقول تعني الريال اليمني فقط. */
  totalCommitmentsAmount: number;
  totalCommitmentsPaid: number;
  totalCommitmentsRemaining: number;
  commitmentsCompletionRate: number;

  /** سجلات عملتها غير معروفة لا تدخل في إجمالي أي عملة معلومة. */
  unknownCurrencyCount: number;
  unknownCurrencies: string[];

  // Category distribution
  categoryDistribution: { category: string; amount: number; count: number; percentage: number }[];

  // Ali Al-Qat specifics
  aliQatDebit: number;
  aliQatCredit: number;
  aliQatNetBalance: number; // positive = له, negative = عليه

  // Alert lists
  overdueCommitments: (DebtCommitment & { daysOverdue: number; remainingAmount: number })[];
  dueSoonCommitments: (DebtCommitment & { daysRemaining: number; remainingAmount: number })[];
}

function normalizeCurrency(currency: string | undefined): DebtCurrency | null {
  const normalized = (currency || 'YER').trim().toUpperCase();
  if (normalized === 'YER' || normalized === 'ريال' || normalized === 'ريال يمني') return 'YER';
  if (normalized === 'USD' || normalized === 'دولار' || normalized === '$') return 'USD';
  if (normalized === 'SAR' || normalized === 'سعودي' || normalized === 'ر.س') return 'SAR';
  return null;
}

function emptyCurrencyTotals(): DebtCurrencyTotals {
  return { YER: 0, USD: 0, SAR: 0 };
}

function isCommitmentCompleted(c: DebtCommitment, remaining: number): boolean {
  const status = c.status || '';
  return remaining <= 0 || status.includes('منجز') || status.includes('مكتمل') || c.icon === '✔';
}

/** يبني تاريخاً محلياً من YYYY-MM-DD لتفادي تحويله إلى UTC ثم انزياح يوم الاستحقاق. */
function localDateFromISO(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function calculateCommitmentRemaining(c: DebtCommitment): {
  paid: number;
  remaining: number;
  isCompleted: boolean;
  progressPercent: number;
} {
  const paid = (c.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
  const remaining = Math.max(0, (c.amount || 0) - paid);
  const isCompleted = isCommitmentCompleted(c, remaining);
  const progressPercent = c.amount > 0 ? Math.min(100, Math.round((paid / c.amount) * 100)) : 0;
  return { paid, remaining, isCompleted, progressPercent };
}

export function calculateDebtStats(
  debtRecords: DebtRecord[],
  commitments: DebtCommitment[],
  alertDaysWindow: number = 30
): DebtStatsSummary {
  let totalDebitYER = 0;
  let totalCreditYER = 0;
  let totalDebitUSD = 0;
  let totalCreditUSD = 0;
  let totalDebitSAR = 0;
  let totalCreditSAR = 0;

  let anwarDebit = 0;
  let anwarCredit = 0;

  let aliQatDebit = 0;
  let aliQatCredit = 0;
  let unknownCurrencyCount = 0;
  const unknownCurrencies = new Set<string>();

  debtRecords.forEach((r) => {
    const cur = normalizeCurrency(r.currency);
    if (r.book === 'anwar') {
      anwarDebit += r.debit || 0;
      anwarCredit += r.credit || 0;
    }
    if (r.book === 'ali_qat') {
      aliQatDebit += r.debit || 0;
      aliQatCredit += r.credit || 0;
    }

    if (cur === 'YER') {
      totalDebitYER += r.debit || 0;
      totalCreditYER += r.credit || 0;
    } else if (cur === 'USD') {
      totalDebitUSD += r.debit || 0;
      totalCreditUSD += r.credit || 0;
    } else if (cur === 'SAR') {
      totalDebitSAR += r.debit || 0;
      totalCreditSAR += r.credit || 0;
    } else {
      unknownCurrencyCount++;
      unknownCurrencies.add((r.currency || '').trim() || '(فارغة)');
    }
  });

  // Commitments Logic
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let activeCommitmentsCount = 0;
  let overdueCommitmentsCount = 0;
  let dueSoonCommitmentsCount = 0;
  let completedCommitmentsCount = 0;
  const totalCommitmentsAmountByCurrency = emptyCurrencyTotals();
  const totalCommitmentsPaidByCurrency = emptyCurrencyTotals();
  const totalCommitmentsRemainingByCurrency = emptyCurrencyTotals();

  const categoryMap: Record<string, { amount: number; count: number }> = {};
  const overdueList: (DebtCommitment & { daysOverdue: number; remainingAmount: number })[] = [];
  const dueSoonList: (DebtCommitment & { daysRemaining: number; remainingAmount: number })[] = [];

  commitments.forEach((c) => {
    const { paid, remaining, isCompleted } = calculateCommitmentRemaining(c);
    const currency = normalizeCurrency(c.currency);

    if (currency) {
      totalCommitmentsAmountByCurrency[currency] += c.amount || 0;
      totalCommitmentsPaidByCurrency[currency] += paid;
      totalCommitmentsRemainingByCurrency[currency] += remaining;
    } else {
      unknownCurrencyCount++;
      unknownCurrencies.add((c.currency || '').trim() || '(فارغة)');
    }

    // رسم الفئات في الواجهة بلا رمز عملة، لذلك نحسبه بالريال اليمني فقط ولا نخلط العملات.
    if (currency === 'YER') {
      const cat = c.category || 'أخرى';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { amount: 0, count: 0 };
      }
      categoryMap[cat].amount += remaining;
      categoryMap[cat].count += 1;
    }

    if (isCompleted) {
      completedCommitmentsCount++;
    } else {
      activeCommitmentsCount++;

      // Check due date
      if (c.endDate) {
        const dueDate = localDateFromISO(c.endDate);
        const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          // Overdue
          overdueCommitmentsCount++;
          overdueList.push({
            ...c,
            daysOverdue: Math.abs(diffDays),
            remainingAmount: remaining,
          });
        } else if (diffDays <= alertDaysWindow) {
          // Due soon
          dueSoonCommitmentsCount++;
          dueSoonList.push({
            ...c,
            daysRemaining: diffDays,
            remainingAmount: remaining,
          });
        }
      }
    }
  });

  // Sort overdue by oldest first
  overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue);
  // Sort due soon by closest first
  dueSoonList.sort((a, b) => a.daysRemaining - b.daysRemaining);

  const totalCatAmount = Object.values(categoryMap).reduce((s, v) => s + v.amount, 0);
  const categoryDistribution = Object.entries(categoryMap).map(([category, val]) => ({
    category,
    amount: val.amount,
    count: val.count,
    percentage: totalCatAmount > 0 ? Math.round((val.amount / totalCatAmount) * 100) : 0,
  }));
  categoryDistribution.sort((a, b) => b.amount - a.amount);

  const commitmentsCompletionRate =
    commitments.length > 0 ? Math.round((completedCommitmentsCount / commitments.length) * 100) : 0;

  return {
    totalRecords: debtRecords.length,
    totalDebitYER,
    totalCreditYER,
    netYER: totalCreditYER - totalDebitYER,
    totalDebitUSD,
    totalCreditUSD,
    netUSD: totalCreditUSD - totalDebitUSD,
    totalDebitSAR,
    totalCreditSAR,
    netSAR: totalCreditSAR - totalDebitSAR,

    commitmentsCount: commitments.length,
    activeCommitmentsCount,
    overdueCommitmentsCount,
    dueSoonCommitmentsCount,
    overdueCount: overdueCommitmentsCount,
    dueSoonCount: dueSoonCommitmentsCount,
    completedCommitmentsCount,
    totalCommitmentsAmountYER: totalCommitmentsAmountByCurrency.YER,
    totalCommitmentsPaidYER: totalCommitmentsPaidByCurrency.YER,
    totalCommitmentsRemainingYER: totalCommitmentsRemainingByCurrency.YER,
    totalCommitmentsAmountByCurrency,
    totalCommitmentsPaidByCurrency,
    totalCommitmentsRemainingByCurrency,
    totalCommitmentsAmount: totalCommitmentsAmountByCurrency.YER,
    totalCommitmentsPaid: totalCommitmentsPaidByCurrency.YER,
    totalCommitmentsRemaining: totalCommitmentsRemainingByCurrency.YER,
    commitmentsCompletionRate,
    unknownCurrencyCount,
    unknownCurrencies: [...unknownCurrencies].sort(),

    anwarDebit,
    anwarCredit,
    anwarNet: anwarCredit - anwarDebit,

    categoryDistribution,

    aliQatDebit,
    aliQatCredit,
    aliQatNetBalance: aliQatCredit - aliQatDebit,

    overdueCommitments: overdueList,
    dueSoonCommitments: dueSoonList,
  };
}

// Calculate running cumulative balance for Ali Al-Qat
export function computeAliQatRunningBalances(records: DebtRecord[]): DebtRecord[] {
  let running = 0;
  return records.map((rec) => {
    // BR-07: الرصيد التراكمي (علي القات) = مجموع (دائن − مدين) ترتيبياً؛ موجب = «له»، سالب = «عليه»
    const diff = (rec.credit || 0) - (rec.debit || 0);
    running += diff;
    return {
      ...rec,
      runningBalance: running,
    };
  });
}

// Generate Next Automatic Commitment ID (التزامات-001)
export function generateNextCommitmentId(commitments: DebtCommitment[]): string {
  const prefix = 'التزامات-';
  let maxSeq = 0;

  commitments.forEach((c) => {
    if (c.id && c.id.startsWith(prefix)) {
      const numPart = parseInt(c.id.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
  });

  return `${prefix}${(maxSeq + 1).toString().padStart(3, '0')}`;
}

// Format Currency
export function formatDebtAmount(amount: number, currency: string = 'YER'): string {
  const numStr = (amount || 0).toLocaleString();
  const curUpper = (currency || 'YER').toUpperCase();
  if (curUpper === 'USD' || curUpper === '$') return `${numStr} $`;
  if (curUpper === 'SAR' || curUpper === 'ر.س') return `${numStr} ر.س`;
  return `${numStr} ريال`;
}
