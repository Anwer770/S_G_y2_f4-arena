import { Customer, CustomerFilterState, CustomerSource, CustomerVisitRecord } from '../types';

export function getTodayArabicDay(): string {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayIndex = new Date().getDay();
  return days[dayIndex];
}

export function isCustomerVisitDueToday(route: string): boolean {
  const today = getTodayArabicDay();
  if (route === today) return true;

  const dayOfMonth = new Date().getDate();
  if (route === 'بداية الشهر' && dayOfMonth <= 10) return true;
  if (route === 'نص الشهر' && dayOfMonth > 10 && dayOfMonth <= 20) return true;
  if (route === 'نهاية الشهر' && dayOfMonth > 20) return true;
  if (route === 'شهري') return true;

  return false;
}

export interface CustomerDashboardStats {
  totalCustomers: number;
  totalBalanceYER: number;
  totalBalanceSAR: number;
  totalBalanceUSD: number;
  positiveBalanceYER: number;
  totalDebtYER: number; // إجمالي المديونيات بالسالب
  debtorCount: number;
  internalAccountsCount: number;
  visitsCount: number;
  completedVisitsCount: number;
  inProgressVisitsCount: number;
  plannedVisitsCount: number;
  followUpVisitsCount: number;
  visitCompletionRate: number;
  todayVisitsTotal: number;
  todayVisitsCompleted: number;
  sourceBreakdown: Record<
    CustomerSource,
    {
      count: number;
      balanceYER: number;
      balanceSAR: number;
      balanceUSD: number;
      debtorCount: number;
      totalDebtYER: number;
    }
  >;
  regionBreakdown: { region: string; count: number; percentage: number }[];
  routeBreakdown: { route: string; count: number }[];
  significanceBreakdown: { key: string; count: number }[];
  statusBreakdown: { key: string; count: number }[];
  responsibleStats: {
    name: string;
    total: number;
    completed: number;
    inProgress: number;
    balanceYER: number;
  }[];
  topDebtors: Customer[];
  topBalances: Customer[];
}

export function calculateCustomerStats(
  customers: Customer[],
  visits: CustomerVisitRecord[] = []
): CustomerDashboardStats {
  let totalBalanceYER = 0;
  let totalBalanceSAR = 0;
  let totalBalanceUSD = 0;
  let positiveBalanceYER = 0;
  let totalDebtYER = 0;
  let debtorCount = 0;
  let internalAccountsCount = 0;
  let completedVisitsCount = 0;
  let inProgressVisitsCount = 0;
  let plannedVisitsCount = 0;
  let followUpVisitsCount = 0;
  let todayVisitsTotal = 0;
  let todayVisitsCompleted = 0;

  const sourceMap: Record<CustomerSource, any> = {
    'القيصر الذهبي': { count: 0, balanceYER: 0, balanceSAR: 0, balanceUSD: 0, debtorCount: 0, totalDebtYER: 0 },
    'توب مكياجي': { count: 0, balanceYER: 0, balanceSAR: 0, balanceUSD: 0, debtorCount: 0, totalDebtYER: 0 },
    عفيف: { count: 0, balanceYER: 0, balanceSAR: 0, balanceUSD: 0, debtorCount: 0, totalDebtYER: 0 },
    الأطباء: { count: 0, balanceYER: 0, balanceSAR: 0, balanceUSD: 0, debtorCount: 0, totalDebtYER: 0 },
    أخرى: { count: 0, balanceYER: 0, balanceSAR: 0, balanceUSD: 0, debtorCount: 0, totalDebtYER: 0 },
  };

  const regionMap: Record<string, number> = {};
  const routeMap: Record<string, number> = {};
  const sigMap: Record<string, number> = { A: 0, B: 0, C: 0, '√': 0 };
  const statusMap: Record<string, number> = {
    مخطط: 0,
    'قيد تنفيذ': 0,
    مكتمل: 0,
    ملغي: 0,
    مرحل: 0,
    متابعة: 0,
    مصفر: 0,
  };
  const respMap: Record<string, { total: number; completed: number; inProgress: number; balanceYER: number }> = {};

  customers.forEach((c) => {
    // Balances
    totalBalanceYER += c.balanceYER || 0;
    totalBalanceSAR += c.balanceSAR || 0;
    totalBalanceUSD += c.balanceUSD || 0;

    if (c.balanceYER > 0) {
      positiveBalanceYER += c.balanceYER;
    } else if (c.balanceYER < 0) {
      debtorCount++;
      totalDebtYER += Math.abs(c.balanceYER);
    }

    if (c.isInternalAccount) {
      internalAccountsCount++;
    }

    // Source breakdown
    const srcKey = (c.source || 'أخرى') as CustomerSource;
    if (!sourceMap[srcKey]) {
      sourceMap[srcKey] = { count: 0, balanceYER: 0, balanceSAR: 0, balanceUSD: 0, debtorCount: 0, totalDebtYER: 0 };
    }
    sourceMap[srcKey].count++;
    sourceMap[srcKey].balanceYER += c.balanceYER || 0;
    sourceMap[srcKey].balanceSAR += c.balanceSAR || 0;
    sourceMap[srcKey].balanceUSD += c.balanceUSD || 0;
    if (c.balanceYER < 0) {
      sourceMap[srcKey].debtorCount++;
      sourceMap[srcKey].totalDebtYER += Math.abs(c.balanceYER);
    }

    // Regions
    const reg = c.region || 'غير محدد';
    regionMap[reg] = (regionMap[reg] || 0) + 1;

    // Routes
    const rt = c.route || 'غير محدد';
    routeMap[rt] = (routeMap[rt] || 0) + 1;

    // Significance
    if (c.significance && sigMap[c.significance] !== undefined) {
      sigMap[c.significance]++;
    }

    // Status
    if (c.status) {
      statusMap[c.status] = (statusMap[c.status] || 0) + 1;
      if (c.status === 'مكتمل') completedVisitsCount++;
      else if (c.status === 'قيد تنفيذ') inProgressVisitsCount++;
      else if (c.status === 'مخطط') plannedVisitsCount++;
      else if (c.status === 'متابعة') followUpVisitsCount++;
    }

    // Today's visits
    if (isCustomerVisitDueToday(c.route)) {
      todayVisitsTotal++;
      if (c.status === 'مكتمل') todayVisitsCompleted++;
    }

    // Responsible stats
    const resp = c.responsible || 'غير محدد';
    if (!respMap[resp]) {
      respMap[resp] = { total: 0, completed: 0, inProgress: 0, balanceYER: 0 };
    }
    respMap[resp].total++;
    if (c.status === 'مكتمل') respMap[resp].completed++;
    if (c.status === 'قيد تنفيذ') respMap[resp].inProgress++;
    respMap[resp].balanceYER += c.balanceYER || 0;
  });

  const totalCustomers = customers.length;
  const visitCompletionRate =
    totalCustomers > 0 ? Math.round((completedVisitsCount / totalCustomers) * 100) : 0;

  // Region breakdown sorted
  const regionBreakdown = Object.entries(regionMap)
    .map(([region, count]) => ({
      region,
      count,
      percentage: totalCustomers > 0 ? Math.round((count / totalCustomers) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Route breakdown sorted
  const routeBreakdown = Object.entries(routeMap)
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count);

  // Significance breakdown
  const significanceBreakdown = Object.entries(sigMap).map(([key, count]) => ({ key, count }));

  // Status breakdown
  const statusBreakdown = Object.entries(statusMap).map(([key, count]) => ({ key, count }));

  // Responsible stats array
  const responsibleStats = Object.entries(respMap)
    .map(([name, data]) => ({
      name,
      ...data,
    }))
    .sort((a, b) => b.total - a.total);

  // Top Debtors (Negative balances or high debt)
  const topDebtors = [...customers]
    .filter((c) => c.balanceYER < 0)
    .sort((a, b) => a.balanceYER - b.balanceYER)
    .slice(0, 10);

  // Top Balances
  const topBalances = [...customers]
    .sort((a, b) => b.balanceYER - a.balanceYER)
    .slice(0, 10);

  return {
    totalCustomers,
    totalBalanceYER,
    totalBalanceSAR,
    totalBalanceUSD,
    positiveBalanceYER,
    totalDebtYER,
    debtorCount,
    internalAccountsCount,
    visitsCount: visits.length,
    completedVisitsCount,
    inProgressVisitsCount,
    plannedVisitsCount,
    followUpVisitsCount,
    visitCompletionRate,
    todayVisitsTotal,
    todayVisitsCompleted,
    sourceBreakdown: sourceMap,
    regionBreakdown,
    routeBreakdown,
    significanceBreakdown,
    statusBreakdown,
    responsibleStats,
    topDebtors,
    topBalances,
  };
}

export function filterCustomersList(
  customers: Customer[],
  filters: CustomerFilterState
): Customer[] {
  return customers.filter((c) => {
    // Search query
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const match =
        c.name?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q) ||
        c.subId?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.responsible?.toLowerCase().includes(q) ||
        c.region?.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Source
    if (filters.source && filters.source !== 'الكل' && c.source !== filters.source) {
      return false;
    }

    // Region
    if (filters.region && filters.region !== 'الكل' && c.region !== filters.region) {
      return false;
    }

    // Route
    if (filters.route && filters.route !== 'الكل' && c.route !== filters.route) {
      return false;
    }

    // Significance
    if (filters.significance && filters.significance !== 'الكل' && c.significance !== filters.significance) {
      return false;
    }

    // Status
    if (filters.status && filters.status !== 'الكل' && c.status !== filters.status) {
      return false;
    }

    // Responsible
    if (filters.responsible && filters.responsible !== 'الكل' && c.responsible !== filters.responsible) {
      return false;
    }

    // Debtors only
    if (filters.debtorsOnly && c.balanceYER >= 0) {
      return false;
    }

    // Internal only
    if (filters.internalOnly && !c.isInternalAccount) {
      return false;
    }

    // Today visits only
    if (filters.todayVisitsOnly && !isCustomerVisitDueToday(c.route)) {
      return false;
    }

    // Currency filter
    if (filters.currencyFilter === 'SAR' && (!c.balanceSAR || c.balanceSAR === 0)) return false;
    if (filters.currencyFilter === 'USD' && (!c.balanceUSD || c.balanceUSD === 0)) return false;
    if (filters.currencyFilter === 'YER' && (!c.balanceYER || c.balanceYER === 0)) return false;

    return true;
  });
}

export function generateNextCustomerId(
  customers: Customer[],
  source: CustomerSource
): { id: string; subId: string } {
  let maxIdNum = 1000;
  customers.forEach((c) => {
    const match = c.id?.match(/CUST-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
    }
  });

  const nextId = `CUST-${maxIdNum + 1}`;

  // Generate prefix for subId based on source
  let prefix = 'ذهبي';
  if (source === 'توب مكياجي') prefix = 'توب';
  else if (source === 'عفيف') prefix = 'عفيف';
  else if (source === 'الأطباء') prefix = 'د';

  const sourceCustomers = customers.filter((c) => c.source === source);
  const nextSubNum = (sourceCustomers.length + 1).toString().padStart(3, '0');
  const nextSubId = `${prefix}-${nextSubNum}`;

  return { id: nextId, subId: nextSubId };
}
