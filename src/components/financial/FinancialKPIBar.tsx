import React from 'react';

export interface FinancialPeriodSummaryView {
  totalIncomeYER: number;
  totalExpenseYER: number;
  netBalanceYER: number;
  incomeCount: number;
  expenseCount: number;
  totalSAR?: number;
  totalUSD?: number;
}

interface Props {
  summary: FinancialPeriodSummaryView;
  count: number;
  periodLabel: string;
}

/** شريط مؤشرات الفترة (وارد · مصروف · صافي · عدد الحركات) — مستخرج من FinancialModule (R25). */
export const FinancialKPIBar: React.FC<Props> = ({ summary, count, periodLabel }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-financial-kpi>
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
      <div className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-slate-400 text-right">
        وارد الفترة
      </div>
      <div className="mt-2 text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight text-right leading-none">
        {summary.totalIncomeYER.toLocaleString()}
      </div>
      {((summary.totalSAR || 0) > 0 || (summary.totalUSD || 0) > 0) && (
        <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-mono">
          {(summary.totalSAR || 0) > 0 && <span>SAR {(summary.totalSAR || 0).toLocaleString()}</span>}
          {(summary.totalUSD || 0) > 0 && <span>USD ${(summary.totalUSD || 0).toLocaleString()}</span>}
        </div>
      )}
    </div>

    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-rose-300 dark:hover:border-rose-700 transition-all">
      <div className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-slate-400 text-right">
        مصروف الفترة
      </div>
      <div className="mt-2 text-2xl sm:text-3xl font-black font-mono text-[#e11d48] dark:text-[#f43f5e] tracking-tight text-right leading-none">
        {summary.totalExpenseYER.toLocaleString()}
      </div>
      <div className="mt-1 text-xs text-slate-400 dark:text-slate-500 text-right">{summary.expenseCount} قيد صرف</div>
    </div>

    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-teal-300 dark:hover:border-teal-700 transition-all">
      <div className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-slate-400 text-right">
        صافي الفترة
      </div>
      <div
        className={`mt-2 text-2xl sm:text-3xl font-black font-mono tracking-tight text-right leading-none ${
          summary.netBalanceYER >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
        }`}
      >
        {summary.netBalanceYER.toLocaleString()}
      </div>
      <div className="mt-1 text-xs text-slate-400 dark:text-slate-500 text-right">فارق الحركة</div>
    </div>

    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-teal-300 dark:hover:border-teal-700 transition-all">
      <div className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-slate-400 text-right">
        عدد الحركات
      </div>
      <div className="mt-2 text-2xl sm:text-3xl font-black font-mono text-teal-600 dark:text-teal-400 tracking-tight text-right leading-none">
        {count}
      </div>
      <div className="mt-1 text-xs text-slate-400 dark:text-slate-500 text-right">{periodLabel}</div>
    </div>
  </div>
);

export default FinancialKPIBar;
