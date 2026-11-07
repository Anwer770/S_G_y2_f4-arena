import React from 'react';
import { MovementRecord, ProductStock } from '../types';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  Clock,
  Eye,
  Plus,
  FileSpreadsheet,
  PieChart,
  UserCheck,
} from 'lucide-react';
import {
  formatNumberLatin,
  getCategoryBadgeStyle,
  getMovementTypeStyle,
  getStatusStyle,
} from '../utils/formatters';

interface DashboardViewProps {
  records: MovementRecord[];
  stocks: ProductStock[];
  onOpenAddModal: () => void;
  onViewRecord: (record: MovementRecord) => void;
  onGoToRecords: () => void;
  onGoToInventory: () => void;
  onGoToReports: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  stocks,
  onOpenAddModal,
  onViewRecord,
  onGoToRecords,
  onGoToInventory,
  onGoToReports,
}) => {
  // FR-01 Calculations
  let totalIn = 0;
  let totalOut = 0;
  let totalOpening = 0;
  let negativeCount = 0;

  for (const s of stocks) {
    totalIn += s.totalIn;
    totalOut += s.totalOut;
    totalOpening += s.openingStock;
    if (s.currentStock < 0) negativeCount += 1;
  }

  const netStock = totalOpening + totalIn - totalOut;

  // FR-02: Top 8 Most Dispensed Products
  const topDispensed = [...stocks]
    .sort((a, b) => b.totalOut - a.totalOut)
    .slice(0, 8);

  const maxDispensed = Math.max(...topDispensed.map((p) => p.totalOut), 1);

  // FR-03: Recent 8 Movements
  const recentRecords = [...records].slice(0, 8);

  // Category distribution
  const categoryCounts: Record<string, number> = {};
  for (const r of records) {
    const cat = r.category || 'أخرى';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const categoryStats = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Stat Summary Cards (FR-01) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total In */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">إجمالي التوريد (IN)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {formatNumberLatin(totalIn)}
          </div>
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
            <span>وارد لجميع الأصناف</span>
          </span>
        </div>

        {/* Total Out */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">إجمالي الصرف (OUT)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {formatNumberLatin(totalOut)}
          </div>
          <span className="text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-1">
            <span>منصرف للعملاء والمستفيدين</span>
          </span>
        </div>

        {/* Net Total Stock */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">صافي المخزون الكلي</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono ${netStock >= 0 ? 'text-blue-900' : 'text-rose-900'}`}>
            {formatNumberLatin(netStock)}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">افتتاحي + توريد − صرف</span>
        </div>

        {/* Total Records */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">عدد الحركات</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {formatNumberLatin(records.length)}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">حركة توريد وصرف مسجلة</span>
        </div>

        {/* Negative Stock Alert */}
        <div className={`p-4.5 rounded-xl border shadow-2xs space-y-2 col-span-2 sm:col-span-1 ${
          negativeCount > 0
            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">أصناف سالبة الرصيد</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              negativeCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono ${negativeCount > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
            {negativeCount} صنف
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {negativeCount > 0 ? 'يتطلب مراجعة التوريد' : 'المخزون مضبوط تماماً'}
          </span>
        </div>
      </div>

      {/* 2. Middle Row: Top 8 Dispensed Products & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 8 Most Dispensed Items (FR-02) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                الأصناف الأكثر صرفاً (أعلى 8 منتجات)
              </h2>
            </div>
            <button
              onClick={onGoToInventory}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
            >
              عرض كافة الأصناف ({stocks.length}) ←
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {topDispensed.map((prod, idx) => {
              const percent = Math.round((prod.totalOut / maxDispensed) * 100);
              return (
                <div key={prod.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{prod.name}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-rose-700 dark:text-rose-300 font-bold">
                        {formatNumberLatin(prod.totalOut)} {prod.unit}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-xs">
                        (الرصيد: {formatNumberLatin(prod.currentStock)})
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown & Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>توزيع الحركات حسب الفئة</span>
            </h2>

            <div className="space-y-2">
              {categoryStats.map(([cat, count]) => {
                const percent = Math.round((count / records.length) * 100);
                return (
                  <div key={cat} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getCategoryBadgeStyle(cat)}`}>
                        {cat}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{count} حركة</span>
                      <span className="text-slate-400 dark:text-slate-500 text-xs">({percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="bg-slate-900 text-white p-5 rounded-xl shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-300">إجراءات سريعة</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={onOpenAddModal}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة حركة</span>
              </button>
              <button
                onClick={onGoToReports}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>تقرير المستفيد</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Recent 8 Movements (FR-03) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              آخر الحركات المسجلة
            </h2>
          </div>
          <button
            onClick={onGoToRecords}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
          >
            عرض سجل الحركات بالكامل ({records.length}) ←
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs min-w-[820px] print:min-w-0">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                <th className="py-2.5 px-3">الرقم الفرعي</th>
                <th className="py-2.5 px-3">التاريخ</th>
                <th className="py-2.5 px-3">نوع الحركة</th>
                <th className="py-2.5 px-3">المستفيد</th>
                <th className="py-2.5 px-3">الفئة / الحالة</th>
                <th className="py-2.5 px-3">الأصناف</th>
                <th className="py-2.5 px-3 text-left">معاينة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentRecords.map((r) => {
                const moveStyle = getMovementTypeStyle(r.movementType);
                const itemsEntries = Object.entries(r.items || {});
                const totalUnits = itemsEntries.reduce((sum, [, q]) => sum + (Number(q) || 0), 0);

                return (
                  <tr key={r.subId} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">
                        {r.subId}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono">
                      {r.date}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${moveStyle.badge}`}>
                        {r.movementType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100 max-w-[180px] truncate">
                      {r.beneficiary}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getCategoryBadgeStyle(r.category)}`}>
                          {r.category}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getStatusStyle(r.status)}`}>
                          {r.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {itemsEntries.length === 0 ? (
                        <span className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded text-xs font-medium">
                          بدون كميات رقمية
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                          {itemsEntries.slice(0, 2).map(([name, qty]) => (
                            <span
                              key={name}
                              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs px-2 py-0.5 rounded-full"
                            >
                              {name} ×{qty}
                            </span>
                          ))}
                          {itemsEntries.length > 2 && (
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">
                              +{itemsEntries.length - 2} أصناف أخرى
                            </span>
                          )}
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold mr-1">
                            ({totalUnits} وحدة)
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-left">
                      <button
                        onClick={() => onViewRecord(r)}
                        className="p-1 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                        title="معاينة السند"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
