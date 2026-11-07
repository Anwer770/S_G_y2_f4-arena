import React, { useState, useMemo } from 'react';
import { DebtBookId, DebtRecord } from '../../types';
import {
  computeAliQatRunningBalances,
  DEBT_BOOKS_META,
  DEBT_ICONS,
  exportDebtRecordsToCSV,
  formatDebtAmount,
} from '../../utils/debts';
import {
  Search,
  Plus,
  Filter,
  Download,
  CheckCircle2,
  Copy,
  Edit2,
  Trash2,
  ArrowUpDown,
  FileSpreadsheet,
  AlertCircle,
  Printer,
} from 'lucide-react';

interface DebtLedgerTableProps {
  records: DebtRecord[];
  activeBook: DebtBookId;
  onSelectBook: (book: DebtBookId) => void;
  onAddRecord: (book: DebtBookId) => void;
  onEditRecord: (record: DebtRecord) => void;
  onDuplicateRecord: (record: DebtRecord) => void;
  onDeleteRecord: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onChangeIcon: (id: string, icon: string) => void;
  onOpenPrint?: () => void;
}

export const DebtLedgerTable: React.FC<DebtLedgerTableProps> = ({
  records,
  activeBook,
  onSelectBook,
  onAddRecord,
  onEditRecord,
  onDuplicateRecord,
  onDeleteRecord,
  onToggleComplete,
  onChangeIcon,
  onOpenPrint,
}) => {
  const [search, setSearch] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'YER' | 'SAR' | 'USD'>('all');
  const [iconFilter, setIconFilter] = useState('all');
  const [completedFilter, setCompletedFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter records belonging to active book
  const bookRecords = useMemo(() => {
    return records.filter((r) => r.book === activeBook);
  }, [records, activeBook]);

  // Apply running balances if Ali Al-Qat
  const processedRecords = useMemo(() => {
    if (activeBook === 'ali_qat') {
      return computeAliQatRunningBalances(bookRecords);
    }
    return bookRecords;
  }, [bookRecords, activeBook]);

  // Filtered rows
  const filteredRecords = useMemo(() => {
    return processedRecords.filter((r) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = (r.name || '').toLowerCase().includes(q);
        const matchNote = (r.note || '').toLowerCase().includes(q);
        const matchId = (r.id || '').toLowerCase().includes(q);
        if (!matchName && !matchNote && !matchId) return false;
      }

      // Currency
      if (currencyFilter !== 'all') {
        const cur = (r.currency || 'YER').toUpperCase();
        if (currencyFilter === 'YER' && cur !== 'YER') return false;
        if (currencyFilter === 'SAR' && cur !== 'SAR') return false;
        if (currencyFilter === 'USD' && cur !== 'USD') return false;
      }

      // Icon
      if (iconFilter !== 'all' && r.icon !== iconFilter) {
        return false;
      }

      // Completed
      if (completedFilter === 'active' && r.isCompleted) return false;
      if (completedFilter === 'completed' && !r.isCompleted) return false;

      return true;
    });
  }, [processedRecords, search, currencyFilter, iconFilter, completedFilter]);

  // BR-06: Dynamic Totals calculated for current filter view
  const totals = useMemo(() => {
    let totalDebitYER = 0;
    let totalCreditYER = 0;
    let totalDebitSAR = 0;
    let totalCreditSAR = 0;
    let totalDebitUSD = 0;
    let totalCreditUSD = 0;

    filteredRecords.forEach((r) => {
      const cur = (r.currency || 'YER').toUpperCase();
      if (cur === 'SAR') {
        totalDebitSAR += r.debit || 0;
        totalCreditSAR += r.credit || 0;
      } else if (cur === 'USD') {
        totalDebitUSD += r.debit || 0;
        totalCreditUSD += r.credit || 0;
      } else {
        totalDebitYER += r.debit || 0;
        totalCreditYER += r.credit || 0;
      }
    });

    return {
      totalDebitYER,
      totalCreditYER,
      netYER: totalCreditYER - totalDebitYER,
      totalDebitSAR,
      totalCreditSAR,
      netSAR: totalCreditSAR - totalDebitSAR,
      totalDebitUSD,
      totalCreditUSD,
      netUSD: totalCreditUSD - totalDebitUSD,
    };
  }, [filteredRecords]);

  const currentBookMeta = DEBT_BOOKS_META[activeBook];

  return (
    <div className="space-y-4">
      {/* 4 Books Sub-Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          {(Object.keys(DEBT_BOOKS_META) as DebtBookId[]).map((bkId) => {
            const meta = DEBT_BOOKS_META[bkId];
            const isSelected = activeBook === bkId;
            const count = records.filter((r) => r.book === bkId).length;

            return (
              <button
                key={bkId}
                onClick={() => onSelectBook(bkId)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span>{meta.title}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${
                    isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportDebtRecordsToCSV(filteredRecords, currentBookMeta.badge)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            title="تصدير CSV بترميز UTF-8 يفتح في Excel بالعربية"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تصدير CSV</span>
          </button>

          <button
            onClick={() => onAddRecord(activeBook)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة قيد</span>
          </button>
        </div>
      </div>

      {/* Book Description Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black">{currentBookMeta.title}</h3>
            <span className="bg-amber-400/20 text-amber-300 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
              {currentBookMeta.badge}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">{currentBookMeta.description}</p>
        </div>

        {/* Quick totals badge on the banner */}
        <div className="flex items-center gap-3 text-xs bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-xs">إجمالي المدين (عليه):</span>
            <span className="font-black text-rose-400">
              {formatDebtAmount(totals.totalDebitYER, 'YER')}
            </span>
          </div>
          <div className="w-px h-6 bg-slate-700" />
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-xs">إجمالي الدائن (له):</span>
            <span className="font-black text-emerald-400">
              {formatDebtAmount(totals.totalCreditYER, 'YER')}
            </span>
          </div>
          <div className="w-px h-6 bg-slate-700" />
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-xs">صافي الرصيد:</span>
            <span
              className={`font-black ${
                totals.netYER >= 0 ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {totals.netYER >= 0 ? 'له ' : 'عليه '}
              {formatDebtAmount(Math.abs(totals.netYER), 'YER')}
            </span>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث في البيان، الوصف، الملاحظات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Currency Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">العملة:</span>
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">الكل</option>
            <option value="YER">ريال يمني (YER)</option>
            <option value="SAR">ريال سعودي (SAR)</option>
            <option value="USD">دولار أمريكي (USD)</option>
          </select>
        </div>

        {/* Icon Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الرمز:</span>
          <select
            value={iconFilter}
            onChange={(e) => setIconFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">كل الرموز</option>
            {DEBT_ICONS.map((ic) => (
              <option key={ic.symbol} value={ic.symbol}>
                {ic.symbol} {ic.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setCompletedFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              completedFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            الكل ({processedRecords.length})
          </button>
          <button
            onClick={() => setCompletedFilter('active')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              completedFilter === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            النشطة ({processedRecords.filter((r) => !r.isCompleted).length})
          </button>
          <button
            onClick={() => setCompletedFilter('completed')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              completedFilter === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            المكتملة ✔ ({processedRecords.filter((r) => r.isCompleted).length})
          </button>
        </div>

        {/* Print Button */}
        {onOpenPrint && (
          <button
            type="button"
            onClick={onOpenPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
            title="معاينة وطباعة كشف حساب هذا الدفتر"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>طباعة الكشف</span>
          </button>
        )}
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-270px)] min-h-[380px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-right text-xs border-collapse min-w-[960px] print:min-w-0">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-900 text-white font-bold border-b border-slate-800 shadow-2xs select-none">
                <th className="py-2.5 px-3 w-10 text-center sticky right-0 z-30 bg-slate-900 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.2)]">#</th>
                <th className="py-2.5 px-2.5 w-24">التاريخ</th>
                <th className="py-2.5 px-2 w-14 text-center">الرمز</th>
                <th className="py-2.5 px-3 min-w-[200px]">البيان / الوصف</th>
                <th className="py-2.5 px-2 w-16 text-center">العملة</th>
                <th className="py-2.5 px-2.5 w-24 text-left text-rose-300">مدين (عليه)</th>
                <th className="py-2.5 px-2.5 w-24 text-left text-emerald-300">دائن (له)</th>
                {activeBook === 'ali_qat' && (
                  <th className="py-2.5 px-2.5 w-28 text-left text-amber-300 bg-slate-800">
                    الرصيد التراكمي
                  </th>
                )}
                <th className="py-2.5 px-2.5 min-w-[140px]">ملاحظات</th>
                <th className="py-2.5 px-3 w-24 text-center sticky left-0 z-30 bg-slate-900 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.2)]">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeBook === 'ali_qat' ? 10 : 9}
                    className="p-8 text-center text-slate-400 dark:text-slate-500"
                  >
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold">لا توجد قيود مسجلة تطابق التصفية الحالية</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => {
                  const iconObj = DEBT_ICONS.find((ic) => ic.symbol === record.icon);
                  const isGray = record.isCompleted;

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-[12px] group ${
                        isGray ? 'bg-slate-50/80 text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {/* # Number */}
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-400 dark:text-slate-500 sticky right-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        {index + 1}
                      </td>

                      {/* Date */}
                      <td className="py-2 px-2.5 font-mono font-medium whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {record.date || '—'}
                      </td>

                      {/* Icon with quick switcher */}
                      <td className="py-2 px-2 text-center">
                        <select
                          value={record.icon || '⚑'}
                          onChange={(e) => onChangeIcon(record.id, e.target.value)}
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

                      {/* Name / Description */}
                      <td className="py-2 px-3 font-bold">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleComplete(record.id)}
                            title={isGray ? 'إلغاء وسم الاكتمال' : 'وسم كمنجز / مكتمل'}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              isGray
                                ? 'text-emerald-600 bg-emerald-50'
                                : 'text-slate-300 hover:text-emerald-600'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <span className={isGray ? 'line-through text-slate-400' : ''}>
                            {record.name}
                          </span>
                        </div>
                      </td>

                      {/* Currency */}
                      <td className="py-2 px-2 text-center font-bold">
                        <span className="px-1.5 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {record.currency || 'YER'}
                        </span>
                      </td>

                      {/* Debit (عليه) */}
                      <td className="py-2 px-2.5 text-left font-mono font-bold text-rose-600 dark:text-rose-400">
                        {(record.debit || 0) > 0 ? (record.debit || 0).toLocaleString() : '—'}
                      </td>

                      {/* Credit (له) */}
                      <td className="py-2 px-2.5 text-left font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {(record.credit || 0) > 0 ? (record.credit || 0).toLocaleString() : '—'}
                      </td>

                      {/* Ali Al-Qat Running Cumulative Balance */}
                      {activeBook === 'ali_qat' && (
                        <td className="py-2 px-2.5 text-left font-mono font-black bg-slate-50 dark:bg-slate-800/60">
                          {record.runningBalance !== undefined ? (
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                (record.runningBalance || 0) > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : (record.runningBalance || 0) < 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {(record.runningBalance || 0) > 0
                                ? `+${(record.runningBalance || 0).toLocaleString()} (له)`
                                : (record.runningBalance || 0) < 0
                                ? `${(record.runningBalance || 0).toLocaleString()} (عليه)`
                                : '0'}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      )}

                      {/* Notes */}
                      <td className="py-2 px-2.5 text-slate-500 dark:text-slate-400 font-medium max-w-xs truncate text-xs">
                        {record.note || '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-center sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onDuplicateRecord(record)}
                            title="نسخ السجل"
                            className="p-1 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditRecord(record)}
                            title="تعديل السجل"
                            className="p-1 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {deleteConfirmId === record.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  onDeleteRecord(record.id);
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
                              onClick={() => setDeleteConfirmId(record.id)}
                              title="حذف السجل"
                              className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
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
                  إجمالي المبالغ وفق التصفية الحالية ({filteredRecords.length} سجل)
                </td>
                <td className="p-3 text-left font-mono font-black text-rose-400">
                  {(totals.totalDebitYER || 0).toLocaleString()} YER
                  {(totals.totalDebitSAR || 0) > 0 && <div className="text-xs text-rose-300">{(totals.totalDebitSAR || 0).toLocaleString()} SAR</div>}
                  {(totals.totalDebitUSD || 0) > 0 && <div className="text-xs text-rose-300">{(totals.totalDebitUSD || 0).toLocaleString()} USD</div>}
                </td>
                <td className="p-3 text-left font-mono font-black text-emerald-400">
                  {(totals.totalCreditYER || 0).toLocaleString()} YER
                  {(totals.totalCreditSAR || 0) > 0 && <div className="text-xs text-emerald-300">{(totals.totalCreditSAR || 0).toLocaleString()} SAR</div>}
                  {(totals.totalCreditUSD || 0) > 0 && <div className="text-xs text-emerald-300">{(totals.totalCreditUSD || 0).toLocaleString()} USD</div>}
                </td>
                {activeBook === 'ali_qat' && (
                  <td className="p-3 text-left font-mono font-black text-amber-300 bg-slate-800">
                    صافي الرصيد: {(totals.netYER || 0) > 0 ? `+${(totals.netYER || 0).toLocaleString()} (له)` : `${(totals.netYER || 0).toLocaleString()} (عليه)`}
                  </td>
                )}
                <td colSpan={2} className="p-3 text-center text-xs text-slate-400 dark:text-slate-500">
                  صافي الرصيد العام: {(totals.netYER || 0).toLocaleString()} YER
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
