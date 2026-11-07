import { FinancialFilterState, FinancialTransaction } from '../types';

export interface FinancialSummary {
  // YER Totals
  totalIncomeYER: number;
  totalExpenseYER: number;
  netBalanceYER: number;

  // Multi-currency Totals
  totalSAR: number;
  totalUSD: number;

  // Counts
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;

  // Breakdowns
  movementBreakdown: { movement: string; amountYER: number; amountSAR: number; amountUSD: number; count: number }[];
  categoryBreakdown: { category: string; amountYER: number; count: number }[];
  accountBreakdown: { account: string; amountYER: number; amountSAR: number; amountUSD: number; count: number }[];
  
  // Legacy compatibility helpers
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  accountBalances: { account: string; balance: number }[];
}

export function calculateFinancialSummary(
  transactions: FinancialTransaction[]
): FinancialSummary {
  let totalIncomeYER = 0;
  let totalExpenseYER = 0;
  let totalSAR = 0;
  let totalUSD = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  const movementMap: Record<string, { amountYER: number; amountSAR: number; amountUSD: number; count: number }> = {};
  const categoryMap: Record<string, { amountYER: number; count: number }> = {};
  const accountMap: Record<string, { amountYER: number; amountSAR: number; amountUSD: number; count: number }> = {};

  transactions.forEach((txn) => {
    if (txn.importance === 'اشكال') {
      // Still included in count, but noted
    }

    const yer = txn.amountYER || 0;
    const sar = txn.amountSAR || 0;
    const usd = txn.amountUSD || 0;

    totalSAR += sar;
    totalUSD += usd;

    // Determine if movement is income-like or expense-like
    const isIncome = txn.movement === 'ايرادات' || txn.movement === 'الصندوق' || txn.movement === 'حساب له' || txn.movement === 'حساب دائن (له)';
    const isExpense = txn.movement === 'منصرف' || txn.movement === 'حساب عليه' || txn.movement === 'سلفه' || txn.movement === 'حساب مدين (ع)';

    if (isIncome) {
      totalIncomeYER += yer;
      incomeCount++;
    } else if (isExpense) {
      totalExpenseYER += yer;
      expenseCount++;
    } else {
      // Default to general income or flow
      totalIncomeYER += yer;
    }

    // Movement Map
    const mov = txn.movement || 'أخرى';
    if (!movementMap[mov]) {
      movementMap[mov] = { amountYER: 0, amountSAR: 0, amountUSD: 0, count: 0 };
    }
    movementMap[mov].amountYER += yer;
    movementMap[mov].amountSAR += sar;
    movementMap[mov].amountUSD += usd;
    movementMap[mov].count += 1;

    // Category Map
    const cat = txn.categoryAccount || 'غير مصنف';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { amountYER: 0, count: 0 };
    }
    categoryMap[cat].amountYER += yer;
    categoryMap[cat].count += 1;

    // Account Map
    const acc = txn.accountName || txn.restrictionAccount || 'حساب عام';
    if (!accountMap[acc]) {
      accountMap[acc] = { amountYER: 0, amountSAR: 0, amountUSD: 0, count: 0 };
    }
    accountMap[acc].amountYER += yer;
    accountMap[acc].amountSAR += sar;
    accountMap[acc].amountUSD += usd;
    accountMap[acc].count += 1;
  });

  const movementBreakdown = Object.entries(movementMap).map(([movement, data]) => ({
    movement,
    ...data,
  }));

  const categoryBreakdown = Object.entries(categoryMap).map(([category, data]) => ({
    category,
    amountYER: data.amountYER,
    count: data.count,
  }));

  const accountBreakdown = Object.entries(accountMap).map(([account, data]) => ({
    account,
    ...data,
  }));

  const accountBalances = Object.entries(accountMap).map(([account, data]) => ({
    account,
    balance: data.amountYER,
  }));

  const netYER = totalIncomeYER - totalExpenseYER;

  return {
    totalIncomeYER,
    totalExpenseYER,
    netBalanceYER: netYER,
    totalSAR,
    totalUSD,
    transactionCount: transactions.length,
    incomeCount,
    expenseCount,
    movementBreakdown,
    categoryBreakdown,
    accountBreakdown,
    // Legacy support:
    totalIncome: totalIncomeYER,
    totalExpense: totalExpenseYER,
    netBalance: netYER,
    accountBalances,
  };
}

export function filterFinancialTransactions(
  transactions: FinancialTransaction[],
  filters: FinancialFilterState
): FinancialTransaction[] {
  return transactions.filter((txn) => {
    // Search across id, number, accountName, restrictionAccount, categoryAccount, description
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const matchId = txn.id ? txn.id.toLowerCase().includes(q) : false;
      const matchNumber = txn.number ? txn.number.toLowerCase().includes(q) : false;
      const matchAccountName = txn.accountName ? txn.accountName.toLowerCase().includes(q) : false;
      const matchRestAccount = txn.restrictionAccount ? txn.restrictionAccount.toLowerCase().includes(q) : false;
      const matchCat = txn.categoryAccount ? txn.categoryAccount.toLowerCase().includes(q) : false;
      const matchDesc = txn.description ? txn.description.toLowerCase().includes(q) : false;
      const matchRest = txn.restriction ? txn.restriction.toLowerCase().includes(q) : false;
      const matchMov = txn.movement ? txn.movement.toLowerCase().includes(q) : false;
      const matchDay = txn.day ? txn.day.toLowerCase().includes(q) : false;

      if (!matchId && !matchNumber && !matchAccountName && !matchRestAccount && !matchCat && !matchDesc && !matchRest && !matchMov && !matchDay) {
        return false;
      }
    }

    // Movement
    if (filters.movement && txn.movement !== filters.movement) return false;

    // Importance
    if (filters.importance && txn.importance !== filters.importance) return false;

    // Restriction
    if (filters.restriction && txn.restriction !== filters.restriction) return false;

    // Movement Type
    if (filters.movementType && txn.movementType !== filters.movementType) return false;

    // Category Account
    if (filters.categoryAccount && txn.categoryAccount !== filters.categoryAccount) return false;

    // Restriction Account
    if (filters.restrictionAccount && txn.restrictionAccount !== filters.restrictionAccount) return false;

    // Account Name
    if (filters.accountName && txn.accountName !== filters.accountName) return false;

    // Currency filter
    if (filters.currencyFilter && filters.currencyFilter !== 'all') {
      if (filters.currencyFilter === 'YER' && (txn.amountYER || 0) <= 0) return false;
      if (filters.currencyFilter === 'SAR' && (txn.amountSAR || 0) <= 0) return false;
      if (filters.currencyFilter === 'USD' && (txn.amountUSD || 0) <= 0) return false;
    }

    // Draft filter
    if (filters.isDraftOnly && !txn.isDraft) return false;

    // Period filter (all, daily, weekly, monthly, yearly)
    if (filters.periodFilter && filters.periodFilter !== 'all') {
      const txnDate = txn.date;
      if (!txnDate) return false;
      const targetDate = filters.selectedPeriodDate || new Date().toISOString().split('T')[0];

      if (filters.periodFilter === 'daily') {
        if (txnDate !== targetDate) return false;
      } else if (filters.periodFilter === 'weekly') {
        const d = new Date(targetDate);
        const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
        // Calculate week starting on Saturday
        const diffToSat = (dayOfWeek + 1) % 7;
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - diffToSat);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const startStr = startOfWeek.toISOString().split('T')[0];
        const endStr = endOfWeek.toISOString().split('T')[0];

        if (txnDate < startStr || txnDate > endStr) return false;
      } else if (filters.periodFilter === 'monthly') {
        const monthPrefix = targetDate.slice(0, 7);
        if (!txnDate.startsWith(monthPrefix)) return false;
      } else if (filters.periodFilter === 'yearly') {
        const yearPrefix = targetDate.slice(0, 4);
        if (!txnDate.startsWith(yearPrefix)) return false;
      }
    }

    // Date range
    if (filters.startDate && txn.date < filters.startDate) return false;
    if (filters.endDate && txn.date > filters.endDate) return false;

    return true;
  });
}

export function generateNextTransactionId(transactions: FinancialTransaction[]): string {
  let maxId = 1000;
  transactions.forEach((t) => {
    if (t.id && t.id.startsWith('ACC-')) {
      const num = parseInt(t.id.replace('ACC-', ''), 10);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
    }
  });
  return `ACC-${maxId + 1}`;
}
