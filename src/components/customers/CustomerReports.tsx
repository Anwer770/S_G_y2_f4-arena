import React, { useMemo } from 'react';
import { Customer, CustomerVisitRecord } from '../../types';
import { calculateCustomerStats } from '../../utils/customers';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
} from 'lucide-react';

interface Props {
  customers: Customer[];
  visits: CustomerVisitRecord[];
}

export const CustomerReports: React.FC<Props> = ({ customers, visits }) => {
  const stats = useMemo(() => calculateCustomerStats(customers, visits), [customers, visits]);

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold text-xs">
            <span>إجمالي شبكة العملاء</span>
            <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
            {stats.totalCustomers}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">عميل ومنشأة مسجلة في المنظومة</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold text-xs">
            <span>نسبة إنجاز الزيارات</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.visitCompletionRate}%
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {stats.completedVisitsCount} زيارة مكتملة من إجمالي الخطة
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold text-xs">
            <span>إجمالي المديونيات بالسالب</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
            {(stats.totalDebtYER || 0).toLocaleString()} ريال
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            على {stats.debtorCount} عميل مستحق التحصيل
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold text-xs">
            <span>الزيارات الميدانية الموثقة</span>
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-black font-mono text-indigo-700 dark:text-indigo-300 mt-1">
            {stats.visitsCount}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">تقرير زيارة مسجل في قاعدة البيانات</p>
        </div>
      </div>

      {/* Grid: Geographic Distribution & Route Schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Geographic Regions Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              التوزيع الجغرافي للعملاء والمحافظات
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono font-bold">
              {stats.regionBreakdown.length} منطقة
            </span>
          </div>

          <div className="space-y-3">
            {stats.regionBreakdown.map((item) => (
              <div key={item.region} className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-800 dark:text-slate-200">{item.region}</span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">
                    {item.count} عميل ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Routes & Weekly Schedule Distribution */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              توزيع العملاء على مسارات الزيارات الأسبوعية
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono font-bold">
              {stats.routeBreakdown.length} مسار
            </span>
          </div>

          <div className="space-y-3">
            {stats.routeBreakdown.slice(0, 8).map((item) => {
              const pct = stats.totalCustomers > 0 ? Math.round((item.count / stats.totalCustomers) * 100) : 0;
              return (
                <div key={item.route} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-800 dark:text-slate-200">مسار {item.route}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                      {item.count} عميل ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: Representative Performance & Significance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 3. Representative Performance Rankings */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              أداء المناديب ومسؤولي المتابعة والتحصيل
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {stats.responsibleStats.map((resp, index) => {
              const compRate = resp.total > 0 ? Math.round((resp.completed / resp.total) * 100) : 0;
              return (
                <div key={resp.name} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-700 dark:text-slate-200 text-xs">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-slate-100">{resp.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {resp.total} عميل مسند • {resp.completed} مكتمل
                      </p>
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-xs">
                      {compRate}% إنجاز
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                      رصيد {(resp.balanceYER || 0).toLocaleString()} ريال
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Significance & Status Matrix */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-4">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            تصنيف العملاء حسب درجات الأهمية والحالة
          </h3>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Significance */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1">مستويات الأهمية:</h4>
              {stats.significanceBreakdown.map((s) => (
                <div key={s.key} className="flex justify-between font-medium">
                  <span>
                    {s.key === 'A'
                      ? '⭐ فئة A (عالي)'
                      : s.key === 'B'
                      ? 'فئة B (متوسط)'
                      : s.key === 'C'
                      ? 'فئة C (عادي)'
                      : 'فئة √ (مؤكد)'}
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{s.count}</span>
                </div>
              ))}
            </div>

            {/* Status */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1">حالات المتابعة:</h4>
              {stats.statusBreakdown.slice(0, 5).map((st) => (
                <div key={st.key} className="flex justify-between font-medium">
                  <span>{st.key}</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{st.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
