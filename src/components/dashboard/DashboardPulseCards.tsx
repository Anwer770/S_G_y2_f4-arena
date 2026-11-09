/**
 * نبض اليوم: بطاقات المؤشرات السريعة.
 *
 * قسم من لوحة التحكم — مستخرج من UnifiedDashboard.tsx (R30) بلا تغيير في البنية أو السلوك.
 */
import React from 'react';
import { AlertTriangle, CheckSquare, Coins, Eye, Flame, Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { AnimatedCounter } from '../common/AnimatedCounter';
import type { DashboardModel } from './useDashboardModel';

type Props = Pick<
  DashboardModel,
  | 'activeOpsTab'
  | 'commitments'
  | 'finSummary'
  | 'onNavigateTab'
  | 'overdueCommitments'
  | 'overdueTasks'
  | 'setActiveOpsTab'
  | 'stockStats'
  | 'todayCustomerVisits'
  | 'todayDoctorVisits'
  | 'todayTasks'
>;

export const DashboardPulseCards: React.FC<Props> = ({
  activeOpsTab,
  commitments,
  finSummary,
  onNavigateTab,
  overdueCommitments,
  overdueTasks,
  setActiveOpsTab,
  stockStats,
  todayCustomerVisits,
  todayDoctorVisits,
  todayTasks,
}) => (
  <>
    {/* 3. TODAY'S COMMAND PULSE CARDS (نبض اليوم) */}
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 animate-fade-in-up">
      {/* مهام اليوم */}
      <div
        onClick={() => setActiveOpsTab('today')}
        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
          activeOpsTab === 'today'
            ? 'bg-teal-50/90 dark:bg-teal-950/60 border-teal-500 shadow-xs'
            : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-teal-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">مهام اليوم</span>
          <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
            <CheckSquare className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            <AnimatedCounter value={todayTasks.length} />
          </div>
          <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
            {todayTasks.length > 0 ? 'مفتوحة للمتابعة' : 'كلها منجزة'}
          </span>
        </div>
      </div>

      {/* المتأخرات */}
      <div
        onClick={() => setActiveOpsTab('overdue')}
        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
          activeOpsTab === 'overdue'
            ? 'bg-rose-50/90 dark:bg-rose-950/60 border-rose-500 shadow-xs'
            : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-rose-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">المتأخرات</span>
          <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            <AnimatedCounter value={overdueTasks.length + overdueCommitments.length} />
          </div>
          <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
            {overdueTasks.length + overdueCommitments.length > 0 ? 'تتطلب تدخلاً عاجلاً' : 'لا يوجد تأخير'}
          </span>
        </div>
      </div>

      {/* زيارات اليوم */}
      <div
        onClick={() => setActiveOpsTab('visits')}
        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
          activeOpsTab === 'visits'
            ? 'bg-sky-50/90 dark:bg-sky-950/60 border-sky-500 shadow-xs'
            : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-sky-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">زيارات اليوم</span>
          <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            <AnimatedCounter value={todayCustomerVisits.length + todayDoctorVisits.length} />
          </div>
          <span className="text-xs font-bold text-sky-700 dark:text-sky-400">
            {todayCustomerVisits.length} عميل • {todayDoctorVisits.length} طبيب
          </span>
        </div>
      </div>

      {/* الالتزامات والديون */}
      <div
        onClick={() => setActiveOpsTab('commitments')}
        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
          activeOpsTab === 'commitments'
            ? 'bg-amber-50/90 dark:bg-amber-950/60 border-amber-500 shadow-xs'
            : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-amber-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الالتزامات</span>
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            <AnimatedCounter value={commitments.filter((c) => c.status !== 'تم الانجاز').length} />
          </div>
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">التزامات قائمة</span>
        </div>
      </div>

      {/* تنبيهات المخزون */}
      <div
        onClick={() => onNavigateTab('stock')}
        className="p-4 rounded-xl border bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-rose-400 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">تنبيه المخزون</span>
          <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            <AnimatedCounter value={stockStats.lowStockCount + stockStats.outOfStockCount} />
          </div>
          <span className="text-xs font-bold text-rose-700 dark:text-rose-300">صنف بلغ حد الطلب</span>
        </div>
      </div>

      {/* صافي السيولة النقدية */}
      <div
        onClick={() => onNavigateTab('financial')}
        className="p-4 rounded-xl border bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">صافي السيولة</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono truncate">
            <AnimatedCounter value={finSummary.netBalance} formatter={formatCurrency} />
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ريال يمني (صافي)</span>
        </div>
      </div>
    </div>
  </>
);
