import React, { useState, useMemo } from 'react';
import { DebtCommitment } from '../../types';
import {
  calculateCommitmentRemaining,
  DEBT_ICONS,
  exportDebtCommitmentsToCSV,
  formatDebtAmount,
} from '../../utils/debts';
import {
  Search,
  Plus,
  Download,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Copy,
  Edit2,
  Trash2,
  DollarSign,
  Calendar,
  AlertCircle,
  Filter,
} from 'lucide-react';

interface CommitmentsTableProps {
  commitments: DebtCommitment[];
  categories: string[];
  owners: string[];
  onAddCommitment: () => void;
  onEditCommitment: (commitment: DebtCommitment) => void;
  onDuplicateCommitment: (commitment: DebtCommitment) => void;
  onDeleteCommitment: (id: string) => void;
  onOpenPaymentModal: (commitment: DebtCommitment) => void;
  onChangeIcon: (id: string, icon: string) => void;
}

export const CommitmentsTable: React.FC<CommitmentsTableProps> = ({
  commitments,
  categories,
  owners,
  onAddCommitment,
  onEditCommitment,
  onDuplicateCommitment,
  onDeleteCommitment,
  onOpenPaymentModal,
  onChangeIcon,
}) => {
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'overdue' | 'dueSoon' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'A' | 'B' | 'C'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const in30DaysStr = in30Days.toISOString().split('T')[0];

  // Counters for status chips
  const counts = useMemo(() => {
    let active = 0;
    let overdue = 0;
    let dueSoon = 0;
    let completed = 0;

    commitments.forEach((c) => {
      const { remaining, isCompleted } = calculateCommitmentRemaining(c);
      if (isCompleted || remaining <= 0) {
        completed++;
      } else {
        active++;
        if (c.endDate && c.endDate < todayStr) {
          overdue++;
        } else if (c.endDate && c.endDate >= todayStr && c.endDate <= in30DaysStr) {
          dueSoon++;
        }
      }
    });

    return {
      all: commitments.length,
      active,
      overdue,
      dueSoon,
      completed,
    };
  }, [commitments, todayStr, in30DaysStr]);

  // Filtered rows
  const filteredCommitments = useMemo(() => {
    return commitments.filter((c) => {
      const { remaining, isCompleted } = calculateCommitmentRemaining(c);

      // Status Tab
      if (statusTab === 'completed' && !isCompleted && remaining > 0) return false;
      if (statusTab === 'active' && (isCompleted || remaining <= 0)) return false;
      if (statusTab === 'overdue') {
        if (isCompleted || remaining <= 0 || !c.endDate || c.endDate >= todayStr) return false;
      }
      if (statusTab === 'dueSoon') {
        if (isCompleted || remaining <= 0 || !c.endDate || c.endDate < todayStr || c.endDate > in30DaysStr)
          return false;
      }

      // Priority
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;

      // Category
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;

      // Owner
      if (ownerFilter !== 'all' && c.owner !== ownerFilter) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchId = (c.id || '').toLowerCase().includes(q);
        const matchName = (c.name || '').toLowerCase().includes(q);
        const matchDesc = (c.desc || '').toLowerCase().includes(q);
        const matchNote = (c.note || '').toLowerCase().includes(q);
        if (!matchId && !matchName && !matchDesc && !matchNote) return false;
      }

      return true;
    });
  }, [commitments, statusTab, priorityFilter, categoryFilter, ownerFilter, search, todayStr, in30DaysStr]);

  // Dynamic Totals (BR-06)
  const totals = useMemo(() => {
    let totalAmountYER = 0;
    let totalPaidYER = 0;
    let totalRemainingYER = 0;

    filteredCommitments.forEach((c) => {
      const { paid, remaining } = calculateCommitmentRemaining(c);
      totalAmountYER += c.amount || 0;
      totalPaidYER += paid;
      totalRemainingYER += remaining;
    });

    return {
      totalAmountYER,
      totalPaidYER,
      totalRemainingYER,
    };
  }, [filteredCommitments]);

  return (
    <div className="space-y-4">
      {/* Header & Status Chips */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Status Tab Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusTab('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>الكل</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md font-mono bg-slate-200/80 dark:bg-slate-700/80 text-slate-800 dark:text-slate-200">
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('active')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusTab === 'active'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <span>النشطة</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md font-mono bg-indigo-200 text-indigo-900">
              {counts.active}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('overdue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusTab === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>المتأخرة</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md font-mono bg-rose-200 text-rose-900">
              {counts.overdue}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('dueSoon')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusTab === 'dueSoon'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>قريب الاستحقاق (≤ 30 يوم)</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md font-mono bg-amber-200 text-amber-900">
              {counts.dueSoon}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('completed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>المسددة بالكامل</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md font-mono bg-emerald-200 text-emerald-900">
              {counts.completed}
            </span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportDebtCommitmentsToCSV(filteredCommitments)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            title="تصدير جدول الالتزامات إلى ملف Excel / CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تصدير CSV</span>
          </button>

          <button
            onClick={onAddCommitment}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء التزام مالي</span>
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالمعرف (التزامات-001)، الاسم، الوصف، الملاحظات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-500 dark:text-slate-400">الأهمية:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">كل الدرجات</option>
            <option value="A">A - عالية (حرجة)</option>
            <option value="B">B - متوسطة</option>
            <option value="C">C - منخفضة</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-500 dark:text-slate-400">الفئة:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">كل الفئات</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Owner Filter */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-500 dark:text-slate-400">المسؤول:</span>
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">كل المسؤولين</option>
            {owners.map((ow) => (
              <option key={ow} value={ow}>
                {ow}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Commitments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-270px)] min-h-[380px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-right text-xs border-collapse min-w-[960px] print:min-w-0">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-900 text-white font-bold border-b border-slate-800 shadow-2xs select-none">
                <th className="py-2.5 px-3 w-24 sticky right-0 z-30 bg-slate-900 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.2)]">المعرف</th>
                <th className="py-2.5 px-2 w-14 text-center">الأهمية</th>
                <th className="py-2.5 px-2 w-14 text-center">الرمز</th>
                <th className="py-2.5 px-3 min-w-[180px]">الالتزام والوصف</th>
                <th className="py-2.5 px-2.5 w-24">الفئة / المسؤول</th>
                <th className="py-2.5 px-2.5 w-24 text-left">المبلغ الكلي</th>
                <th className="py-2.5 px-2.5 w-24 text-left text-emerald-300">المدفوع</th>
                <th className="py-2.5 px-2.5 w-24 text-left text-rose-300">المتبقي</th>
                <th className="py-2.5 px-2 w-20 text-center">نسبة السداد</th>
                <th className="py-2.5 px-2.5 w-28">تاريخ الاستحقاق</th>
                <th className="py-2.5 px-3 w-28 text-center sticky left-0 z-30 bg-slate-900 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.2)]">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredCommitments.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold">لا توجد التزامات مطابقة للفلترة الحالية</p>
                  </td>
                </tr>
              ) : (
                filteredCommitments.map((c) => {
                  const { paid, remaining, progressPercent, isCompleted } = calculateCommitmentRemaining(c);
                  const isOverdue = !isCompleted && remaining > 0 && c.endDate && c.endDate < todayStr;
                  const isDueSoon =
                    !isCompleted &&
                    remaining > 0 &&
                    c.endDate &&
                    c.endDate >= todayStr &&
                    c.endDate <= in30DaysStr;

                  const iconObj = DEBT_ICONS.find((ic) => ic.symbol === c.icon);

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-[12px] group ${
                        isCompleted
                          ? 'bg-slate-50/70 text-slate-400'
                          : isOverdue
                          ? 'bg-rose-50/40'
                          : isDueSoon
                          ? 'bg-amber-50/30'
                          : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="py-2 px-3 font-mono font-bold text-indigo-700 dark:text-indigo-300 whitespace-nowrap sticky right-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        {c.id}
                      </td>

                      {/* Priority */}
                      <td className="py-2 px-2 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded font-bold text-xs ${
                            c.priority === 'A'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : c.priority === 'B'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {c.priority}
                        </span>
                      </td>

                      {/* Icon Switcher */}
                      <td className="py-2 px-2 text-center">
                        <select
                          value={c.icon || '⚑'}
                          onChange={(e) => onChangeIcon(c.id, e.target.value)}
                          className={`text-xs font-black px-1 py-0.5 rounded cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:outline-hidden ${
                            iconObj ? iconObj.color : 'text-slate-600 bg-slate-100'
                          }`}
                        >
                          {DEBT_ICONS.map((ic) => (
                            <option key={ic.symbol} value={ic.symbol}>
                              {ic.symbol}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Name & Desc */}
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{c.name}</div>
                        {c.desc && <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs">{c.desc}</div>}
                        {c.note && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 italic">ملاحظة: {c.note}</div>
                        )}
                      </td>

                      {/* Category & Owner */}
                      <td className="py-2 px-2.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{c.category}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">المسؤول: {c.owner}</div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-2 px-2.5 text-left font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatDebtAmount(c.amount, c.currency)}
                      </td>

                      {/* Paid */}
                      <td className="py-2 px-2.5 text-left font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatDebtAmount(paid, c.currency)}
                      </td>

                      {/* Remaining */}
                      <td className="py-2 px-2.5 text-left font-mono font-black text-rose-600 dark:text-rose-400">
                        {formatDebtAmount(remaining, c.currency)}
                      </td>

                      {/* Progress */}
                      <td className="py-2 px-2 text-center">
                        <div className="w-14 mx-auto">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-0.5">
                            <span>{progressPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                progressPercent === 100
                                  ? 'bg-emerald-500'
                                  : progressPercent > 50
                                  ? 'bg-indigo-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-2 px-2.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        <div className="font-mono font-medium">{c.endDate || '—'}</div>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="w-3 h-3" />
                            متأخر
                          </span>
                        )}
                        {isDueSoon && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                            <Clock className="w-3 h-3" />
                            قريب الاستحقاق
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            مسدد
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-center sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center justify-center gap-1">
                          {/* Payment Button */}
                          <button
                            onClick={() => onOpenPaymentModal(c)}
                            title="تسجيل دفعة سداد / استعراض السجل"
                            className="p-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded transition-colors cursor-pointer"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDuplicateCommitment(c)}
                            title="نسخ الالتزام"
                            className="p-1 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onEditCommitment(c)}
                            title="تعديل الالتزام"
                            className="p-1 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {deleteConfirmId === c.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  onDeleteCommitment(c.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-1.5 py-0.5 bg-rose-600 text-white rounded-md text-xs font-bold"
                              >
                                حذف
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md text-xs"
                              >
                                لا
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(c.id)}
                              title="حذف الالتزام"
                              className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Dynamic Totals Table Footer (BR-06) */}
            <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-700">
              <tr>
                <td colSpan={5} className="p-3 text-right font-black">
                  إجمالي المبالغ والالتزامات الحالية ({filteredCommitments.length} التزام)
                </td>
                <td className="p-3 text-left font-mono font-black text-slate-200">
                  {(totals.totalAmountYER || 0).toLocaleString()} YER
                </td>
                <td className="p-3 text-left font-mono font-black text-emerald-400">
                  {(totals.totalPaidYER || 0).toLocaleString()} YER
                </td>
                <td className="p-3 text-left font-mono font-black text-rose-400">
                  {(totals.totalRemainingYER || 0).toLocaleString()} YER
                </td>
                <td colSpan={3} className="p-3 text-center text-xs text-slate-400 dark:text-slate-500">
                  نسبة الإنجاز المالي العام:{' '}
                  {totals.totalAmountYER > 0
                    ? `${Math.round((totals.totalPaidYER / totals.totalAmountYER) * 100)}%`
                    : '0%'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
