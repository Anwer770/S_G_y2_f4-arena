/**
 * الإحصاءات والحسابات المالية للديون — مستخرجة من utils/debts.ts (R30).
 */
import { DebtCommitment, DebtRecord } from '../../types';

// STATISTICAL & BUSINESS LOGIC CALCULATIONS (PRD RULES)
// ============================================================================

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
  totalCommitmentsAmount: number;
  totalCommitmentsPaid: number;
  totalCommitmentsRemaining: number;
  commitmentsCompletionRate: number;

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

export function calculateCommitmentRemaining(c: DebtCommitment): {
  paid: number;
  remaining: number;
  isCompleted: boolean;
  progressPercent: number;
} {
  const paid = (c.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
  const remaining = Math.max(0, (c.amount || 0) - paid);
  const isCompleted = remaining <= 0 || c.status === 'منجز ✔' || c.icon === '✔';
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

  debtRecords.forEach((r) => {
    const cur = (r.currency || 'YER').toUpperCase();
    if (r.book === 'anwar') {
      anwarDebit += r.debit || 0;
      anwarCredit += r.credit || 0;
    }
    if (r.book === 'ali_qat') {
      aliQatDebit += r.debit || 0;
      aliQatCredit += r.credit || 0;
    }

    if (cur === 'YER' || cur === 'ريال' || cur === 'ريال يمني') {
      totalDebitYER += r.debit || 0;
      totalCreditYER += r.credit || 0;
    } else if (cur === 'USD' || cur === 'دولار' || cur === '$') {
      totalDebitUSD += r.debit || 0;
      totalCreditUSD += r.credit || 0;
    } else if (cur === 'SAR' || cur === 'سعودي' || cur === 'ر.س') {
      totalDebitSAR += r.debit || 0;
      totalCreditSAR += r.credit || 0;
    } else {
      totalDebitYER += r.debit || 0;
      totalCreditYER += r.credit || 0;
    }
  });

  // Commitments Logic
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let activeCommitmentsCount = 0;
  let overdueCommitmentsCount = 0;
  let dueSoonCommitmentsCount = 0;
  let completedCommitmentsCount = 0;
  let totalCommitmentsAmountYER = 0;
  let totalCommitmentsPaidYER = 0;
  let totalCommitmentsRemainingYER = 0;

  const categoryMap: Record<string, { amount: number; count: number }> = {};
  const overdueList: (DebtCommitment & { daysOverdue: number; remainingAmount: number })[] = [];
  const dueSoonList: (DebtCommitment & { daysRemaining: number; remainingAmount: number })[] = [];

  commitments.forEach((c) => {
    const paid = (c.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const remaining = Math.max(0, (c.amount || 0) - paid);
    const isCompleted = c.status.includes('منجز') || c.status.includes('مكتمل') || c.icon === '✔' || remaining === 0;

    totalCommitmentsAmountYER += c.amount || 0;
    totalCommitmentsPaidYER += paid;
    totalCommitmentsRemainingYER += remaining;

    // Categories
    const cat = c.category || 'أخرى';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { amount: 0, count: 0 };
    }
    categoryMap[cat].amount += remaining;
    categoryMap[cat].count += 1;

    if (isCompleted) {
      completedCommitmentsCount++;
    } else {
      activeCommitmentsCount++;

      // Check due date
      if (c.endDate) {
        const dueDate = new Date(c.endDate);
        dueDate.setHours(0, 0, 0, 0);
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
    totalCommitmentsAmountYER,
    totalCommitmentsPaidYER,
    totalCommitmentsRemainingYER,
    totalCommitmentsAmount: totalCommitmentsAmountYER,
    totalCommitmentsPaid: totalCommitmentsPaidYER,
    totalCommitmentsRemaining: totalCommitmentsRemainingYER,
    commitmentsCompletionRate,

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
