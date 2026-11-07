import React, { useState, useMemo } from 'react';
import { Customer, CustomerVisitRecord, VisitStatus } from '../../types';
import { CUSTOMER_RESPONSIBLES, CUSTOMER_ROUTES } from '../../data/defaultCustomers';
import { getTodayArabicDay, isCustomerVisitDueToday } from '../../utils/customers';
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  UserCheck,
  Search,
  Filter,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Phone,
  DollarSign,
  Printer,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface Props {
  customers: Customer[];
  visits: CustomerVisitRecord[];
  onRecordVisit: (customer: Customer) => void;
  onViewDetails: (customer: Customer) => void;
  onUpdateStatus: (customerId: string, status: VisitStatus) => void;
}

export const VisitsPlanner: React.FC<Props> = ({
  customers,
  visits,
  onRecordVisit,
  onViewDetails,
  onUpdateStatus,
}) => {
  const todayArabic = getTodayArabicDay();
  const [selectedRoute, setSelectedRoute] = useState<string>(todayArabic);
  const [search, setSearch] = useState('');
  const [selectedResponsible, setSelectedResponsible] = useState<string>('الكل');

  // Days list for route tabs
  const routeTabs = [
    'السبت',
    'الأحد',
    'الاثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
    'الجمعة',
    'شهري',
    'بداية الشهر',
    'نص الشهر',
    'نهاية الشهر',
    'غير محدد',
  ];

  // Route customers calculation
  const routeCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (selectedRoute !== 'الكل' && c.route !== selectedRoute) return false;
      if (selectedResponsible !== 'الكل' && c.responsible !== selectedResponsible) return false;
      if (search) {
        const q = search.toLowerCase();
        const match =
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.region.toLowerCase().includes(q) ||
          c.responsible.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [customers, selectedRoute, selectedResponsible, search]);

  // Today's due visits metrics
  const todayDueCustomers = useMemo(() => {
    return customers.filter((c) => isCustomerVisitDueToday(c.route));
  }, [customers]);

  const todayCompletedCount = useMemo(() => {
    return todayDueCustomers.filter((c) => c.status === 'مكتمل').length;
  }, [todayDueCustomers]);

  const todayRate =
    todayDueCustomers.length > 0
      ? Math.round((todayCompletedCount / todayDueCustomers.length) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Today Visits Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-xl border border-indigo-900/50 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black">جدول وزيارات اليوم: يوم {todayArabic}</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                  {new Date().toLocaleDateString('ar-YE')}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                لديك <strong className="text-white">{todayDueCustomers.length}</strong> عميل مجدول للمتابعة اليوم
                وفق خطة المسارات الأسبوعية والشهرية
              </p>
            </div>
          </div>

          {/* Progress gauge */}
          <div className="flex items-center gap-4 bg-white/5 dark:bg-slate-900/5 backdrop-blur-xs p-3 rounded-xl border border-white/10 w-full md:w-auto justify-between">
            <div className="text-right">
              <div className="text-xs text-slate-300 font-bold">نسبة إنجاز زيارات اليوم</div>
              <div className="text-lg font-black font-mono text-emerald-400">
                {todayCompletedCount} / {todayDueCustomers.length} ({todayRate}%)
              </div>
            </div>
            <button
              onClick={() => setSelectedRoute(todayArabic)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              عرض زيارات اليوم
            </button>
          </div>
        </div>
      </div>

      {/* Route Tabs Selector */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-3">
        {/* Horizontal tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
          <button
            onClick={() => setSelectedRoute('الكل')}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              selectedRoute === 'الكل'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            كافة المسارات ({customers.length})
          </button>

          {routeTabs.map((day) => {
            const count = customers.filter((c) => c.route === day).length;
            const isTodayTab = day === todayArabic;
            const isSelected = selectedRoute === day;

            return (
              <button
                key={day}
                onClick={() => setSelectedRoute(day)}
                className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isTodayTab
                    ? 'bg-amber-50 text-amber-900 border border-amber-300'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>مسار {day}</span>
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-black ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : isTodayTab
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
                {isTodayTab && !isSelected && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="تصفية حسب اسم العميل أو المنطقة..."
              className="w-full pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">المندوب:</label>
            <select
              value={selectedResponsible}
              onChange={(e) => setSelectedResponsible(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 text-xs"
            >
              <option value="الكل">كافة المندوبين</option>
              {CUSTOMER_RESPONSIBLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Customer Visits Grid for Selected Route */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {routeCustomers.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
            <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-600 dark:text-slate-300">لا يوجد عملاء مجدولون لهذا المسار حالياً</p>
          </div>
        ) : (
          routeCustomers.map((c) => {
            const isCompleted = c.status === 'مكتمل';
            const isInProgress = c.status === 'قيد تنفيذ';

            return (
              <div
                key={c.id}
                className={`bg-white dark:bg-slate-900 p-4 rounded-xl border transition-all space-y-3 relative shadow-2xs ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : isInProgress
                    ? 'border-blue-200 bg-blue-50/10'
                    : 'border-slate-200/80 hover:border-indigo-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm">{c.name}</h4>
                      <span className="px-2 py-0.2 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                        {c.source}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                      {c.id} • {c.subId}
                    </p>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs">
                    {c.significance}
                  </span>
                </div>

                {/* Region & Responsible */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>{c.region}</span>
                  </div>
                  <div className="font-bold text-indigo-700 dark:text-indigo-300">{c.responsible}</div>
                </div>

                {/* Balance & Task */}
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">الرصيد:</span>
                    <span
                      className={`font-black font-mono ${
                        (c.balanceYER || 0) < 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {(c.balanceYER || 0).toLocaleString()} ريال
                    </span>
                  </div>
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 font-mono text-xs"
                    >
                      <Phone className="w-3 h-3" />
                      {c.phone}
                    </a>
                  )}
                </div>

                {c.taskDesc && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-amber-50/50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-100 dark:border-amber-900 leading-relaxed">
                    {c.taskDesc}
                  </p>
                )}

                {/* Quick Status Buttons & Record Visit Action */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 text-xs">
                  {/* Status Toggle buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateStatus(c.id, 'مكتمل')}
                      className={`px-2 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                      title="تحديد كمكتمل"
                    >
                      ✓ تم
                    </button>
                    <button
                      onClick={() => onUpdateStatus(c.id, 'قيد تنفيذ')}
                      className={`px-2 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isInProgress
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                      title="قيد التنفيذ"
                    >
                      قيد التنفيذ
                    </button>
                    <button
                      onClick={() => onUpdateStatus(c.id, 'متابعة')}
                      className={`px-2 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        c.status === 'متابعة'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-700'
                      }`}
                      title="متابعة لاحقة"
                    >
                      متابعة
                    </button>
                  </div>

                  {/* Record Detailed Visit */}
                  <button
                    onClick={() => onRecordVisit(c)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    تقرير الزيارة
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
