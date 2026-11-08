import React, { useState, useMemo, useEffect } from 'react';
import { FinancialTransaction } from '../../types';
import {
  calculateFinancialSummary,
  filterFinancialTransactions,
} from '../../utils/financial';
import { formatCurrency } from '../../utils/formatters';
import { exportFinancialToExcel } from '../../utils/excel';
import { FinancialModal } from './FinancialModal';
import { FinancialVoucherModal } from './FinancialVoucherModal';
import { ImportFinancialModal } from './ImportFinancialModal';
import {
  AlertTriangle,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Building,
  X,
  CheckSquare,
  Keyboard,
  Calendar,
  FileText,
  Paperclip,
} from 'lucide-react';
import { getMovementBadgeStyle, getImportanceBadgeStyle } from '../../data/defaultFinancial';
import { FinancialPrintModal } from './FinancialPrintModal';
import { FinancialKPIBar } from './FinancialKPIBar';
import { FinancialJournalTable } from './FinancialJournalTable';
import { FinancialHeaderBar } from './FinancialHeaderBar';
import { FinancialFilters } from './FinancialFilters';
import { FinancialFilterDrawer } from './FinancialFilterDrawer';
import { useFinancialState } from './useFinancialState';

interface Props {
  transactions: FinancialTransaction[];
  onSaveTransaction: (txn: FinancialTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onImportTransactions?: (transactions: FinancialTransaction[], mode: 'append' | 'replace') => void;
  movements: string[];
  restrictions: string[];
  movementTypes: string[];
  importanceList: string[];
  categoryAccounts: string[];
  restrictionAccounts: string[];
  accountNames: string[];
  onAddOption?: (type: 'category' | 'account' | 'restriction' | 'movementType' | 'restrictionAccount' | 'accountName', value: string) => void;
}

export const FinancialModule: React.FC<Props> = ({
  transactions,
  onSaveTransaction,
  onDeleteTransaction,
  onImportTransactions,
  movements,
  restrictions,
  movementTypes,
  importanceList,
  categoryAccounts,
  restrictionAccounts,
  accountNames,
  onAddOption,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'journal' | 'accounts' | 'analytics'>('journal');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<FinancialTransaction | null>(null);
  const [viewingTxn, setViewingTxn] = useState<FinancialTransaction | null>(null);

  // Table UX: Active Row tracking & Multiple Row Selection
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // الفلاتر والفترة الزمنية ولوحة الفلاتر المتقدمة — في hook مستقل (R27)
  const {
    filters,
    setFilters,
    todayStr,
    draftsCount,
    periodLabel,
    handleSetPeriod,
    handleNavigatePeriod,
    activeFilterChips,
    activeAdvancedFilterCount,
    handleResetFilters,
    isFilterDrawerOpen,
    setIsFilterDrawerOpen,
    isPeriodDropdownOpen,
    setIsPeriodDropdownOpen,
    periodDropdownRef,
    searchInputRef,
  } = useFinancialState(transactions);

  // Calculate Metrics
  const summary = useMemo(() => calculateFinancialSummary(transactions), [transactions]);

  // Filtered List
  const filteredTransactions = useMemo(
    () => filterFinancialTransactions(transactions, filters),
    [transactions, filters]
  );

  // Period Summary (Metrics of the current selected period & active filters)
  const periodSummary = useMemo(
    () => calculateFinancialSummary(filteredTransactions),
    [filteredTransactions]
  );

  const handleOpenAdd = () => {
    setEditingTxn(null);
    setIsModalOpen(true);
  };

  const handleOpenReceiptVoucher = () => {
    setEditingTxn({
      id: '',
      date: todayStr,
      day: '',
      importance: '√',
      movement: 'ايرادات',
      restriction: 'سند قبض',
      movementType: 'نقدا',
      categoryAccount: categoryAccounts[0] || 'مبيعات نقدية',
      restrictionAccount: restrictionAccounts[0] || 'الخزينة الرئيسية',
      accountName: '',
      description: '',
      number: '',
      amountYER: 0,
      amountSAR: 0,
      amountUSD: 0,
      isDraft: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenPaymentVoucher = () => {
    setEditingTxn({
      id: '',
      date: todayStr,
      day: '',
      importance: '√',
      movement: 'منصرف',
      restriction: 'سند صرف',
      movementType: 'نقدا',
      categoryAccount: categoryAccounts[0] || 'مصروفات تشغيل',
      restrictionAccount: restrictionAccounts[0] || 'الخزينة الرئيسية',
      accountName: '',
      description: '',
      number: '',
      amountYER: 0,
      amountSAR: 0,
      amountUSD: 0,
      isDraft: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (txn: FinancialTransaction) => {
    setEditingTxn(txn);
    setIsModalOpen(true);
  };

  const handleExportExcel = () => {
    if (selectedIds.size > 0) {
      const selectedTxns = transactions.filter((t) => selectedIds.has(t.id));
      exportFinancialToExcel(selectedTxns, `القيود_المحددة_${selectedTxns.length}.xlsx`);
    } else {
      exportFinancialToExcel(filteredTransactions, `سجل_القيود_المالية_${filteredTransactions.length}.xlsx`);
    }
  };

  // Multiple Row Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  const handleToggleRowSelection = (id: string, e: React.SyntheticEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`هل أنت متأكد من حذف (${selectedIds.size}) قيد محدد نهائياً؟`)) {
      selectedIds.forEach((id) => onDeleteTransaction(id));
      setSelectedIds(new Set());
    }
  };

  // Keyboard Shortcuts (Alt + N, Ctrl + K, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in an active input/textarea except for specific combos
      const target = e.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      // Alt + N -> Open Add Modal
      if (e.altKey && (e.key === 'n' || e.key === 'N' || e.code === 'KeyN')) {
        e.preventDefault();
        handleOpenAdd();
        return;
      }

      // Ctrl + K or Cmd + K -> Focus Search
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Slash '/' when not in input -> Focus Search
      if (!isInInput && e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Escape -> Close drawer, modal, or clear selections
      if (e.key === 'Escape') {
        if (isFilterDrawerOpen) {
          setIsFilterDrawerOpen(false);
        } else if (showShortcutsModal) {
          setShowShortcutsModal(false);
        } else if (selectedIds.size > 0) {
          setSelectedIds(new Set());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFilterDrawerOpen, showShortcutsModal, selectedIds.size]);

  return (
    <div className="space-y-3.5" dir="rtl">
      {/* 1. رأس الصفحة — مكوّن مستقل (R25) */}
      <FinancialHeaderBar
        onAdd={handleOpenAdd}
        onExportExcel={handleExportExcel}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenPrint={() => setIsPrintModalOpen(true)}
        onShowShortcuts={() => setShowShortcutsModal(true)}
      />

      {/* 2. KPI SUMMARY BAR — مكوّن مستقل (R25) */}
      <FinancialKPIBar summary={periodSummary} count={filteredTransactions.length} periodLabel={periodLabel} />

      {/* تنبيه القيود ذات التصنيف غير المعروف (إصلاح R12) */}
      {periodSummary.unclassifiedCount > 0 && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            يوجد{' '}
            <span className="font-black font-mono">{periodSummary.unclassifiedCount.toLocaleString()}</span>{' '}
            قيداً بمبلغ{' '}
            <span className="font-black font-mono">{periodSummary.unclassifiedYER.toLocaleString()}</span>{' '}
            بتصنيف حركة غير معروف، ولم تُحتسب في الوارد أو المصروف. صحّح حقل «نوع الحركة» فيها لتظهر في المجاميع.
          </p>
        </div>
      )}

      {/* 3. SUB-TABS SWITCHER */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
        <button
          onClick={() => setActiveSubTab('journal')}
          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'journal'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>سجل القيود اليومية</span>
          <span className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${
            activeSubTab === 'journal' ? 'bg-teal-700/60 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            {filteredTransactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('accounts')}
          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'accounts'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>كشف الحسابات والأرصدة</span>
          <span className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${
            activeSubTab === 'accounts' ? 'bg-teal-700/60 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            {summary.accountBreakdown.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'analytics'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>التحليلات والمطابقات</span>
          <span className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${
            activeSubTab === 'analytics' ? 'bg-teal-700/60 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            {summary.movementBreakdown.length}
          </span>
        </button>
      </div>

      {/* SUB-TAB 1: JOURNAL VIEW */}
      {activeSubTab === 'journal' && (
        <div className="space-y-2.5">
          {/* 4. INLINE SEARCH & FILTER BAR — مكوّن مستقل (R27) */}
          <FinancialFilters
            filters={filters}
            setFilters={setFilters}
            movements={movements}
            draftsCount={draftsCount}
            activeFilterChips={activeFilterChips}
            activeAdvancedFilterCount={activeAdvancedFilterCount}
            periodLabel={periodLabel}
            todayStr={todayStr}
            onSetPeriod={handleSetPeriod}
            onNavigatePeriod={handleNavigatePeriod}
            onResetFilters={handleResetFilters}
            onOpenAdvanced={() => setIsFilterDrawerOpen(true)}
            isPeriodDropdownOpen={isPeriodDropdownOpen}
            setIsPeriodDropdownOpen={setIsPeriodDropdownOpen}
            periodDropdownRef={periodDropdownRef}
            searchInputRef={searchInputRef}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* BATCH ACTIONS BAR (When 1 or more rows selected) */}
          {selectedIds.size > 0 && (
            <div className="bg-teal-700 text-white px-4 py-2 rounded-xl shadow-md flex items-center justify-between gap-3 text-xs animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-teal-200" />
                <span className="font-bold">تم تحديد ({selectedIds.size}) قيد مالي</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportExcel}
                  className="px-3 py-1 bg-white/10 dark:bg-slate-900/10 hover:bg-white/20 dark:hover:bg-slate-900/20 rounded-lg text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-teal-200" />
                  <span>تصدير المحدد ({selectedIds.size})</span>
                </button>
                <button
                  onClick={handleBatchDelete}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 rounded-lg text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف المحدد</span>
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-2.5 py-1 text-teal-100 hover:text-white underline cursor-pointer"
                >
                  إلغاء التحديد
                </button>
              </div>
            </div>
          )}

          {/* 5. DATA VIEW: TABLE OR CARDS (Mobile / Field friendly) */}
          {viewMode === 'cards' ? (
            <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xs rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 shadow-2xs">
              {filteredTransactions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <p className="font-medium">لا توجد قيود مالية مطابقة للبحث أو الفلاتر المحددة.</p>
                    {(filters.periodFilter !== 'all' || filters.search || filters.movement || filters.currencyFilter !== 'all' || filters.isDraftOnly || filters.importance || filters.restriction) && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 rounded-lg text-xs font-bold border border-teal-200 dark:border-teal-800 cursor-pointer transition shadow-2xs"
                      >
                        عرض كافة القيود (إعادة تعيين الفلاتر)
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredTransactions.map((txn) => {
                    const movBadge = getMovementBadgeStyle(txn.movement);
                    const impBadge = getImportanceBadgeStyle(txn.importance);
                    const isSelected = selectedIds.has(txn.id);
                    const isActive = activeRowId === txn.id;

                    return (
                      <div
                        key={txn.id}
                        onClick={() => setActiveRowId(txn.id)}
                        className={`p-3.5 rounded-xl border transition-all relative flex flex-col justify-between space-y-2.5 shadow-2xs cursor-pointer select-none ${
                          isActive
                            ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-500 ring-2 ring-teal-500/20'
                            : isSelected
                            ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-400'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700'
                        }`}
                      >
                        {/* Header: ID, Date, Badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleToggleRowSelection(txn.id, e)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded text-teal-600 dark:text-teal-400 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="font-mono font-bold text-xs text-teal-700 dark:text-teal-400">
                              {txn.id}
                            </span>
                            {txn.isDraft && (
                              <span className="px-1.5 py-0.2 rounded text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                                مسودة
                              </span>
                            )}
                            {txn.attachmentUrl && (
                              <Paperclip className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" title={`مرفق: ${txn.attachmentUrl}`} />
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${movBadge.bg} ${movBadge.text} ${movBadge.border}`}>
                              {txn.movement}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${impBadge.bg} ${impBadge.text} ${impBadge.border}`}>
                              {txn.importance}
                            </span>
                          </div>
                        </div>

                        {/* Account Details Box */}
                        <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 dark:text-slate-500 text-xs">اسم الحساب:</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px]" title={txn.accountName}>
                              {txn.accountName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span className="truncate max-w-[170px]" title={`${txn.categoryAccount} / ${txn.restrictionAccount}`}>
                              {txn.categoryAccount} • {txn.restrictionAccount}
                            </span>
                            <span className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700 text-xs">
                              {txn.movementType}
                            </span>
                          </div>
                        </div>

                        {/* Amounts Highlight */}
                        <div className="pt-1 flex items-baseline justify-between border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-xs text-slate-400 dark:text-slate-500 block font-medium">المبلغ بالريال اليمني:</span>
                            <span className="text-sm sm:text-base font-mono font-black text-teal-700 dark:text-teal-400">
                              {formatCurrency(txn.amountYER || 0)} YER
                            </span>
                          </div>

                          {((txn.amountSAR || 0) > 0 || (txn.amountUSD || 0) > 0) && (
                            <div className="text-left text-xs font-mono space-y-0.5">
                              {(txn.amountSAR || 0) > 0 && (
                                <div className="text-amber-600 dark:text-amber-400 font-bold">
                                  {formatCurrency(txn.amountSAR)} SAR
                                </div>
                              )}
                              {(txn.amountUSD || 0) > 0 && (
                                <div className="text-sky-600 dark:text-sky-400 font-bold">
                                  ${formatCurrency(txn.amountUSD)} USD
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Date, Day & Voucher Number */}
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <div className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            <span>{txn.day} • {txn.date}</span>
                          </div>
                          {txn.number && (
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-xs">
                              سند #{txn.number}
                            </span>
                          )}
                        </div>

                        {txn.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50/60 dark:bg-slate-800/40 p-1.5 rounded-lg">
                            {txn.description}
                          </p>
                        )}

                        {/* Card Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingTxn(txn);
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-lg flex items-center gap-1 cursor-pointer"
                              title="عرض تفاصيل القيد"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>تفاصيل</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTxn(txn);
                                setIsModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg flex items-center gap-1 cursor-pointer"
                              title="تعديل القيد"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>تعديل</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`هل أنت متأكد من حذف القيد ${txn.id}؟`)) {
                                onDeleteTransaction(txn.id);
                              }
                            }}
                            className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg cursor-pointer transition-colors"
                            title="حذف القيد"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total Card View Summary Footer */}
              {filteredTransactions.length > 0 && (
                <div className="mt-3 p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                  <div className="font-sans font-bold">
                    إجمالي النتائج المعروضة ({filteredTransactions.length} قيد):
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-teal-300 font-bold">
                      {formatCurrency(filteredTransactions.reduce((s, t) => s + (t.amountYER || 0), 0))} YER
                    </span>
                    <span className="text-amber-300 font-bold">
                      {formatCurrency(filteredTransactions.reduce((s, t) => s + (t.amountSAR || 0), 0))} SAR
                    </span>
                    <span className="text-sky-300 font-bold">
                      ${formatCurrency(filteredTransactions.reduce((s, t) => s + (t.amountUSD || 0), 0))} USD
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xs rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
              {/* 5.1 جدول السجل — مكوّن مستقل (R25) */}
              <FinancialJournalTable
                transactions={filteredTransactions}
                filters={filters}
                selectedIds={selectedIds}
                activeRowId={activeRowId}
                onToggleSelectAll={handleToggleSelectAll}
                onToggleRowSelection={handleToggleRowSelection}
                onActivateRow={setActiveRowId}
                onView={setViewingTxn}
                onEdit={handleOpenEdit}
                onDelete={onDeleteTransaction}
                onResetFilters={handleResetFilters}
              />
          </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: ACCOUNTS SUMMARY */}
      {activeSubTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {summary.accountBreakdown.map((acc) => (
            <div key={acc.account} className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xs p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded-lg border border-teal-200/40 dark:border-teal-800/40">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs">{acc.account}</h4>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{acc.count} قيد مسجل</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">ريال يمني:</span>
                  <span className="font-mono font-black text-teal-700 dark:text-teal-400">
                    {formatCurrency(acc.amountYER)} YER
                  </span>
                </div>
                {acc.amountSAR > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">سعودي:</span>
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                      {formatCurrency(acc.amountSAR)} SAR
                    </span>
                  </div>
                )}
                {acc.amountUSD > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">دولار:</span>
                    <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                      ${formatCurrency(acc.amountUSD)} USD
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 3: ANALYTICS */}
      {activeSubTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xs p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">توزيع الحركات المالية</h3>
            <div className="space-y-2">
              {summary.movementBreakdown.map((m) => {
                const b = getMovementBadgeStyle(m.movement);
                return (
                  <div key={m.movement} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${b.bg} ${b.text} ${b.border}`}>
                        {m.movement}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 font-medium">({m.count} قيد)</span>
                    </div>
                    <div className="text-left font-mono font-black text-slate-900 dark:text-slate-100">
                      {formatCurrency(m.amountYER)} ريال
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xs p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">توزيع فئات الحسابات</h3>
            <div className="space-y-2">
              {summary.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{cat.category}</span>
                    <span className="text-slate-400 dark:text-slate-500 font-medium">({cat.count} قيد)</span>
                  </div>
                  <div className="font-mono font-black text-teal-700 dark:text-teal-400">
                    {formatCurrency(cat.amountYER)} ريال
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. SLIDE-OVER DRAWER FOR ADVANCED FILTERS — مكوّن مستقل (R27) */}
      <FinancialFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        setFilters={setFilters}
        restrictions={restrictions}
        movementTypes={movementTypes}
        importanceList={importanceList}
        categoryAccounts={categoryAccounts}
        restrictionAccounts={restrictionAccounts}
        accountNames={accountNames}
        onResetFilters={handleResetFilters}
      />

      {/* 7. KEYBOARD SHORTCUTS MODAL */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">اختصارات لوحة المفاتيح السريعة</h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-300">إضافة قيد مالي جديد</span>
                <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 font-mono text-xs font-bold">
                  Alt + N
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-300">التركيز على شريط البحث</span>
                <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 font-mono text-xs font-bold">
                  Ctrl + K أو /
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-300">إغلاق النوافذ والفلاتر / إلغاء التحديد</span>
                <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 font-mono text-xs font-bold">
                  Esc
                </kbd>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold cursor-pointer"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <FinancialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveTransaction}
        editingTransaction={editingTxn}
        existingTransactions={transactions}
        movements={movements}
        restrictions={restrictions}
        movementTypes={movementTypes}
        importanceList={importanceList}
        categoryAccounts={categoryAccounts}
        restrictionAccounts={restrictionAccounts}
        accountNames={accountNames}
        onAddOption={onAddOption}
      />

      <FinancialVoucherModal
        isOpen={!!viewingTxn}
        onClose={() => setViewingTxn(null)}
        transaction={viewingTxn}
      />

      <ImportFinancialModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingTransactions={transactions}
        onImportTransactions={(imported, mode) => {
          if (onImportTransactions) {
            onImportTransactions(imported, mode);
          }
        }}
      />

      {/* Official Journal Print Report Modal */}
      <FinancialPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        transactions={filteredTransactions}
        periodSummary={periodSummary}
        periodLabel={filters.periodFilter === 'all' ? 'جميع الفترات' : periodLabel}
      />
    </div>
  );
};
