import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FinancialFilterState, FinancialTransaction, FinancialPeriodFilter } from '../../types';
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
  Search,
  Plus,
  FileSpreadsheet,
  Printer,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Layers,
  RotateCcw,
  Building,
  Filter,
  DollarSign,
  X,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Keyboard,
  Info,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  Calendar,
  FileText,
  Paperclip,
  LayoutGrid,
  Table,
} from 'lucide-react';
import { getMovementBadgeStyle, getImportanceBadgeStyle } from '../../data/defaultFinancial';
import { FinancialPrintModal } from './FinancialPrintModal';

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

  // Slide-over Drawer for advanced filters
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const periodDropdownRef = useRef<HTMLDivElement>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(e.target as Node)) {
        setIsPeriodDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Total drafts count
  const draftsCount = useMemo(
    () => transactions.filter((t) => t.isDraft).length,
    [transactions]
  );

  // Filters State
  const [filters, setFilters] = useState<FinancialFilterState>({
    search: '',
    movement: '',
    importance: '',
    restriction: '',
    movementType: '',
    categoryAccount: '',
    restrictionAccount: '',
    accountName: '',
    startDate: '',
    endDate: '',
    currencyFilter: 'all',
    periodFilter: 'all',
    selectedPeriodDate: todayStr,
    isDraftOnly: false,
  });

  const handleSetPeriod = (p: FinancialPeriodFilter) => {
    setFilters((prev) => ({
      ...prev,
      periodFilter: p,
      selectedPeriodDate: prev.selectedPeriodDate || todayStr,
    }));
  };

  const handleNavigatePeriod = (delta: number) => {
    const curDateStr = filters.selectedPeriodDate || todayStr;
    const [y, m, d] = curDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);

    if (filters.periodFilter === 'daily') {
      dateObj.setDate(dateObj.getDate() + delta);
    } else if (filters.periodFilter === 'weekly') {
      dateObj.setDate(dateObj.getDate() + delta * 7);
    } else if (filters.periodFilter === 'monthly') {
      dateObj.setMonth(dateObj.getMonth() + delta);
    } else if (filters.periodFilter === 'yearly') {
      dateObj.setFullYear(dateObj.getFullYear() + delta);
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    setFilters((prev) => ({ ...prev, selectedPeriodDate: `${year}-${month}-${day}` }));
  };

  const periodLabel = useMemo(() => {
    if (!filters.periodFilter || filters.periodFilter === 'all') return 'كافة الفترات';
    const curDateStr = filters.selectedPeriodDate || todayStr;
    const [y, m, d] = curDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);

    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    if (filters.periodFilter === 'daily') {
      const dayName = arabicDays[dateObj.getDay()];
      return `${dayName}، ${d} ${arabicMonths[m - 1]} ${y}`;
    }

    if (filters.periodFilter === 'weekly') {
      const dayOfWeek = dateObj.getDay();
      const diffToSat = (dayOfWeek + 1) % 7;
      const startOfWeek = new Date(dateObj);
      startOfWeek.setDate(dateObj.getDate() - diffToSat);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startD = startOfWeek.getDate();
      const startM = arabicMonths[startOfWeek.getMonth()];
      const endD = endOfWeek.getDate();
      const endM = arabicMonths[endOfWeek.getMonth()];
      const yr = endOfWeek.getFullYear();

      return `الأسبوع: ${startD} ${startM} - ${endD} ${endM} ${yr}`;
    }

    if (filters.periodFilter === 'monthly') {
      return `شهر ${arabicMonths[m - 1]} ${y}`;
    }

    if (filters.periodFilter === 'yearly') {
      return `سنة ${y}`;
    }

    return curDateStr;
  }, [filters.periodFilter, filters.selectedPeriodDate, todayStr]);

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

  // Active filters count & list for Chips
  const activeFilterChips = useMemo(() => {
    const chips: { id: string; label: string; value: string; onRemove: () => void }[] = [];

    if (filters.search.trim()) {
      chips.push({
        id: 'search',
        label: 'بحث',
        value: filters.search,
        onRemove: () => setFilters((f) => ({ ...f, search: '' })),
      });
    }
    if (filters.movement) {
      chips.push({
        id: 'movement',
        label: 'الحركة',
        value: filters.movement,
        onRemove: () => setFilters((f) => ({ ...f, movement: '' })),
      });
    }
    if (filters.importance) {
      chips.push({
        id: 'importance',
        label: 'الأهمية',
        value: filters.importance,
        onRemove: () => setFilters((f) => ({ ...f, importance: '' })),
      });
    }
    if (filters.restriction) {
      chips.push({
        id: 'restriction',
        label: 'نوع القيد',
        value: filters.restriction,
        onRemove: () => setFilters((f) => ({ ...f, restriction: '' })),
      });
    }
    if (filters.movementType) {
      chips.push({
        id: 'movementType',
        label: 'طريقة الدفع',
        value: filters.movementType,
        onRemove: () => setFilters((f) => ({ ...f, movementType: '' })),
      });
    }
    if (filters.categoryAccount) {
      chips.push({
        id: 'categoryAccount',
        label: 'فئة الحساب',
        value: filters.categoryAccount,
        onRemove: () => setFilters((f) => ({ ...f, categoryAccount: '' })),
      });
    }
    if (filters.restrictionAccount) {
      chips.push({
        id: 'restrictionAccount',
        label: 'حساب التقييد',
        value: filters.restrictionAccount,
        onRemove: () => setFilters((f) => ({ ...f, restrictionAccount: '' })),
      });
    }
    if (filters.accountName) {
      chips.push({
        id: 'accountName',
        label: 'اسم الحساب',
        value: filters.accountName,
        onRemove: () => setFilters((f) => ({ ...f, accountName: '' })),
      });
    }
    if (filters.currencyFilter && filters.currencyFilter !== 'all') {
      const currMap: Record<string, string> = { YER: 'ريال يمني', SAR: 'ريال سعودي', USD: 'دولار أمريكي' };
      chips.push({
        id: 'currencyFilter',
        label: 'العملة',
        value: currMap[filters.currencyFilter] || filters.currencyFilter,
        onRemove: () => setFilters((f) => ({ ...f, currencyFilter: 'all' })),
      });
    }
    if (filters.startDate || filters.endDate) {
      chips.push({
        id: 'dateRange',
        label: 'التاريخ',
        value: `${filters.startDate || '...'} إلى ${filters.endDate || '...'}`,
        onRemove: () => setFilters((f) => ({ ...f, startDate: '', endDate: '' })),
      });
    }
    if (filters.periodFilter && filters.periodFilter !== 'all') {
      const periodNames: Record<string, string> = {
        daily: 'يومي',
        weekly: 'أسبوعي',
        monthly: 'شهري',
        yearly: 'سنوي',
      };
      chips.push({
        id: 'periodFilter',
        label: 'المدة',
        value: `${periodNames[filters.periodFilter] || filters.periodFilter} (${periodLabel})`,
        onRemove: () => setFilters((f) => ({ ...f, periodFilter: 'all' })),
      });
    }
    if (filters.isDraftOnly) {
      chips.push({
        id: 'isDraftOnly',
        label: 'الحالة',
        value: 'مسودات فقط',
        onRemove: () => setFilters((f) => ({ ...f, isDraftOnly: false })),
      });
    }

    return chips;
  }, [filters, periodLabel]);

  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (filters.importance) count++;
    if (filters.restriction) count++;
    if (filters.movementType) count++;
    if (filters.categoryAccount) count++;
    if (filters.restrictionAccount) count++;
    if (filters.accountName) count++;
    if (filters.startDate || filters.endDate) count++;
    return count;
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      movement: '',
      importance: '',
      restriction: '',
      movementType: '',
      categoryAccount: '',
      restrictionAccount: '',
      accountName: '',
      startDate: '',
      endDate: '',
      currencyFilter: 'all',
      periodFilter: 'all',
      selectedPeriodDate: todayStr,
      isDraftOnly: false,
    });
  };

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

  const handleToggleRowSelection = (id: string, e: React.MouseEvent) => {
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
      {/* 1. COMPACT HEADER BAR */}
      <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xs px-4 py-3 sm:py-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/50">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                سجل العمليات والقيود المالية اليومية
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-200/50 dark:border-teal-800/50">
                المعيار المحاسبي الشامل
              </span>
            </div>
            <p className="text-xs md:text-xs text-slate-500 dark:text-slate-400">
              إدارة الحركات والقيود وسندات القبض والصرف (YER - SAR - USD)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
          {/* Keyboard Shortcuts Guide */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="اختصارات لوحة المفاتيح"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* طباعة (Matching Annotation 2026-09-23 032232.png) */}
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
            title="طباعة كشف السجل اليومي والقيود"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
            <span>طباعة</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-300 dark:border-slate-700 shadow-2xs"
            title="استيراد قيود مالية من ملف Excel مطابق للقالب"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>استيراد</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            title="تصدير القيود المعروضة إلى Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-lg text-xs font-black shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            title="إضافة قيد جديد (Alt + N)"
          >
            <Plus className="w-4 h-4" />
            <span>قيد جديد</span>
            <kbd className="hidden sm:inline-block mr-1 px-1 py-0.2 bg-teal-700/80 rounded text-xs font-mono text-teal-100 border border-teal-500/50">
              Alt+N
            </kbd>
          </button>
        </div>
      </div>

      {/* 2. KPI SUMMARY BAR (Matching User Design: وارد الفترة | مصروف الفترة | صافي الفترة | عدد الحركات) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. وارد الفترة (Rightmost in RTL) */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
          <div className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-slate-400 text-right">
            وارد الفترة
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight text-right leading-none">
            {periodSummary.totalIncomeYER.toLocaleString()}
          </div>
          {(periodSummary.totalSAR > 0 || periodSummary.totalUSD > 0) && (
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-mono">
              {periodSummary.totalSAR > 0 && <span>SAR {periodSummary.totalSAR.toLocaleString()}</span>}
              {periodSummary.totalUSD > 0 && <span>USD ${periodSummary.totalUSD.toLocaleString()}</span>}
            </div>
          )}
        </div>

        {/* 2. مصروف الفترة */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-rose-300 dark:hover:border-rose-700 transition-all">
          <div className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-slate-400 text-right">
            مصروف الفترة
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black font-mono text-[#e11d48] dark:text-[#f43f5e] tracking-tight text-right leading-none">
            {periodSummary.totalExpenseYER.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-400 dark:text-slate-500 text-right">
            {periodSummary.expenseCount} قيد صرف
          </div>
        </div>

        {/* 3. صافي الفترة */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-teal-300 dark:hover:border-teal-700 transition-all">
          <div className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-slate-400 text-right">
            صافي الفترة
          </div>
          <div className={`mt-2 text-2xl sm:text-3xl font-black font-mono tracking-tight text-right leading-none ${
            periodSummary.netBalanceYER >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {periodSummary.netBalanceYER.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-400 dark:text-slate-500 text-right">
            فارق الحركة
          </div>
        </div>

        {/* 4. عدد الحركات (Leftmost in RTL) */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-teal-300 dark:hover:border-teal-700 transition-all">
          <div className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-slate-400 text-right">
            عدد الحركات
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black font-mono text-teal-600 dark:text-teal-400 tracking-tight text-right leading-none">
            {filteredTransactions.length}
          </div>
          <div className="mt-1 text-xs text-slate-400 dark:text-slate-500 text-right">
            {periodLabel}
          </div>
        </div>
      </div>

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
          {/* 4. INLINE SEARCH & FILTER BAR (Space-saving & Instant) */}
          <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2 relative z-30">
            {/* Consolidated Filter & Search Bar - Period dropdown positioned between Search and Movements */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Compact Quick Search (تصغير حقل/زر البحث) */}
              <div className="relative w-48 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="بحث سريع... (Ctrl+K)"
                  className="w-full pl-8 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
                />
                {filters.search && (
                  <button
                    onClick={() => setFilters({ ...filters, search: '' })}
                    className="absolute left-2.5 top-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* The "الفترة" Dropdown - Located directly between Search and Movements */}
              <div className="relative" ref={periodDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                  className="flex items-center justify-between gap-2.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-teal-600 dark:border-teal-500 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs hover:border-teal-700 transition cursor-pointer min-w-[130px]"
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>
                      {filters.periodFilter === 'all'
                        ? 'الفترة: الكل'
                        : filters.periodFilter === 'daily'
                        ? 'الفترة: يومي'
                        : filters.periodFilter === 'weekly'
                        ? 'الفترة: أسبوعي'
                        : filters.periodFilter === 'monthly'
                        ? 'الفترة: شهري'
                        : 'الفترة: سنوي'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-teal-600 dark:text-teal-400 transition-transform shrink-0 ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Options Popup */}
                {isPeriodDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 space-y-1">
                    {[
                      { id: 'daily', label: 'يومي' },
                      { id: 'weekly', label: 'أسبوعي' },
                      { id: 'monthly', label: 'شهري' },
                      { id: 'yearly', label: 'سنوي' },
                      { id: 'all', label: 'الكل' },
                    ].map((opt) => {
                      const isSelected = filters.periodFilter === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            handleSetPeriod(opt.id as FinancialPeriodFilter);
                            setIsPeriodDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="w-5 h-5 flex items-center justify-center">
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span>{opt.label}</span>
                            <Calendar className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Period Navigator Controls (When a period filter is active: daily, weekly, monthly, yearly) */}
              {filters.periodFilter !== 'all' && (
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => handleNavigatePeriod(-1)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition cursor-pointer"
                    title="الفترة السابقة"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-slate-800 dark:text-slate-200 px-1 text-xs whitespace-nowrap">
                    {periodLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleNavigatePeriod(1)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition cursor-pointer"
                    title="الفترة اللاحقة"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, selectedPeriodDate: todayStr }))}
                    className="px-2 py-0.5 bg-white dark:bg-slate-900 hover:bg-teal-50 text-xs font-bold text-teal-700 dark:text-teal-400 rounded border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
                    title="العودة لتاريخ اليوم"
                  >
                    اليوم
                  </button>
                </div>
              )}

              {/* Quick Movement Filter (كافة الحركات) */}
              <div className="w-36">
                <select
                  value={filters.movement}
                  onChange={(e) => setFilters({ ...filters, movement: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">كافة الحركات</option>
                  {movements.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Currency Filter */}
              <div className="w-28">
                <select
                  value={filters.currencyFilter}
                  onChange={(e) => setFilters({ ...filters, currencyFilter: e.target.value as any })}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">كافة العملات</option>
                  <option value="YER">ريال يمني (YER)</option>
                  <option value="SAR">سعودي (SAR)</option>
                  <option value="USD">دولار (USD)</option>
                </select>
              </div>

              {/* Drafts Filter Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, isDraftOnly: !prev.isDraftOnly }))}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    filters.isDraftOnly
                      ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                  title="تصفية وعرض القيود المحفوظة كمسودة"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>المسودات</span>
                  {draftsCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-xs font-mono font-bold ${
                        filters.isDraftOnly ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {draftsCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Open Slide-over Drawer for Advanced Filters */}
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  activeAdvancedFilterCount > 0
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                title="فتح لوحة الفلاتر المتقدمة (طريقة الدفع، فئة الحساب، التواريخ)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>فلاتر متقدمة</span>
                {activeAdvancedFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[11px] flex items-center justify-center font-bold">
                    {activeAdvancedFilterCount}
                  </span>
                )}
              </button>

              {/* View Mode Toggle: Table vs Mobile Cards */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                  title="عرض الجدول المحاسبي الكامل"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">جدول</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                  title="عرض بطاقات تفاعلية مناسبة للهواتف والميدان"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">بطاقات</span>
                </button>
              </div>

              {/* Reset Filters */}
              {activeFilterChips.length > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-bold transition-colors cursor-pointer"
                  title="مسح جميع الفلاتر"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>مسح ({activeFilterChips.length})</span>
                </button>
              )}
            </div>

            {/* ACTIVE FILTER CHIPS (شارات الفلاتر النشطة) */}
            {activeFilterChips.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">الفلاتر المطبقة:</span>
                {activeFilterChips.map((chip) => (
                  <span
                    key={chip.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60 text-xs font-medium"
                  >
                    <span className="font-bold text-teal-600 dark:text-teal-400">{chip.label}:</span>
                    <span className="max-w-[120px] truncate">{chip.value}</span>
                    <button
                      onClick={chip.onRemove}
                      className="text-teal-600 dark:text-teal-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 cursor-pointer"
                      title="إزالة الفلتر"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 underline font-medium cursor-pointer mr-1"
                >
                  إلغاء الكل
                </button>
              </div>
            )}
          </div>

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
                              onChange={(e) => handleToggleRowSelection(txn.id, e as any)}
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
              {/* Scrollable Container with Sticky Header */}
              <div className="overflow-x-auto max-h-[calc(100vh-270px)] min-h-[380px] overflow-y-auto scrollbar-thin">
                <table className="w-full text-right text-xs border-collapse min-w-[960px] print:min-w-0">
                {/* Sticky Header */}
                <thead className="sticky top-0 z-20">
                  <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700 select-none shadow-2xs">
                    {/* Sticky Column Right: Select Checkbox & ID */}
                    <th className="py-2.5 px-3 sticky right-0 z-30 bg-slate-100/95 dark:bg-slate-800/95 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)] w-28">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length}
                          onChange={handleToggleSelectAll}
                          className="rounded text-teal-600 dark:text-teal-400 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
                          title="تحديد الكل"
                        />
                        <span>القيد</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">اليوم</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">التاريخ</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">الأهمية</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">الحركة</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">القيد</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">طريقة الدفع</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">فئة الحساب</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">حساب التقييد</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">اسم الحساب</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap min-w-[160px]">الوصف</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">الرقم</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap text-left">ريال يمني</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap text-left">سعودي</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap text-left">دولار</th>
                    {/* Sticky Column Left: Quick Actions */}
                    <th className="py-2.5 px-3 text-center sticky left-0 z-30 bg-slate-100/95 dark:bg-slate-800/95 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)] w-24">
                      إجراءات
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
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
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((txn) => {
                      const movBadge = getMovementBadgeStyle(txn.movement);
                      const impBadge = getImportanceBadgeStyle(txn.importance);
                      const isSelected = selectedIds.has(txn.id);
                      const isActive = activeRowId === txn.id;

                      return (
                        <tr
                          key={txn.id}
                          onClick={() => setActiveRowId(txn.id)}
                          className={`group transition-colors cursor-pointer select-none text-[12px] ${
                            isActive
                              ? 'bg-teal-50/80 dark:bg-teal-950/40 ring-1 ring-inset ring-teal-500/30'
                              : isSelected
                              ? 'bg-teal-50/40 dark:bg-teal-950/20'
                              : 'hover:bg-teal-50/30 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          {/* 1. Sticky ID & Select Checkbox */}
                          <td
                            className={`py-2 px-3 font-mono font-bold whitespace-nowrap sticky right-0 z-10 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)] transition-colors ${
                              isActive
                                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                                : isSelected
                                ? 'bg-teal-50/50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300'
                                : 'bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/90 text-teal-700 dark:text-teal-400'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleToggleRowSelection(txn.id, e as any)}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded text-teal-600 dark:text-teal-400 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span>{txn.id}</span>
                              {txn.isDraft && (
                                <span className="px-1.5 py-0.2 rounded text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/80">
                                  مسودة
                                </span>
                              )}
                              {txn.attachmentUrl && (
                                <span title={`مستند مرفق: ${txn.attachmentUrl}`} className="text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400">
                                  <Paperclip className="w-3 h-3 inline" />
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 2. Day */}
                          <td className="py-2 px-2.5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {txn.day}
                          </td>

                          {/* 3. Date */}
                          <td className="py-2 px-2.5 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {txn.date}
                          </td>

                          {/* 4. Importance Badge (Standardized 3-color soft tints) */}
                          <td className="py-2 px-2.5 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${impBadge.bg} ${impBadge.text} ${impBadge.border}`}>
                              {txn.importance}
                            </span>
                          </td>

                          {/* 5. Movement Badge (Standardized 3-color soft tints) */}
                          <td className="py-2 px-2.5 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${movBadge.bg} ${movBadge.text} ${movBadge.border}`}>
                              {txn.movement}
                            </span>
                          </td>

                          {/* 6. Restriction */}
                          <td className="py-2 px-2.5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {txn.restriction}
                          </td>

                          {/* 7. Movement Type */}
                          <td className="py-2 px-2.5 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {txn.movementType}
                          </td>

                          {/* 8. Category Account */}
                          <td className="py-2 px-2.5 font-medium whitespace-nowrap">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs">
                              {txn.categoryAccount}
                            </span>
                          </td>

                          {/* 9. Restriction Account */}
                          <td className="py-2 px-2.5 font-medium text-slate-800 dark:text-slate-200 max-w-[130px] truncate" title={txn.restrictionAccount}>
                            {txn.restrictionAccount}
                          </td>

                          {/* 10. Account Name (High Contrast) */}
                          <td className="py-2 px-2.5 font-black text-slate-900 dark:text-slate-100 max-w-[150px] truncate" title={txn.accountName}>
                            {txn.accountName}
                          </td>

                          {/* 11. Description */}
                          <td className="py-2 px-2.5 text-slate-700 dark:text-slate-300 max-w-[180px] truncate" title={txn.description}>
                            {txn.description || '-'}
                          </td>

                          {/* 12. Number */}
                          <td className="py-2 px-2.5 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {txn.number}
                          </td>

                          {/* 13. Amount YER (High Contrast Monospace) */}
                          <td className="py-2 px-2.5 font-mono font-black text-teal-700 dark:text-teal-300 text-left whitespace-nowrap">
                            {txn.amountYER > 0 ? formatCurrency(txn.amountYER) : '-'}
                          </td>

                          {/* 14. Amount SAR (High Contrast Monospace) */}
                          <td className="py-2 px-2.5 font-mono font-bold text-amber-700 dark:text-amber-300 text-left whitespace-nowrap">
                            {txn.amountSAR > 0 ? formatCurrency(txn.amountSAR) : '-'}
                          </td>

                          {/* 15. Amount USD (High Contrast Monospace) */}
                          <td className="py-2 px-2.5 font-mono font-bold text-sky-700 dark:text-sky-300 text-left whitespace-nowrap">
                            {txn.amountUSD > 0 ? `$${formatCurrency(txn.amountUSD)}` : '-'}
                          </td>

                          {/* 16. Sticky Actions Column */}
                          <td
                            className={`py-2 px-3 whitespace-nowrap sticky left-0 z-10 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)] transition-colors ${
                              isActive
                                ? 'bg-teal-50 dark:bg-teal-950/60'
                                : isSelected
                                ? 'bg-teal-50/50 dark:bg-teal-950/30'
                                : 'bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/90'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setViewingTxn(txn)}
                                title="عرض وطباعة السند"
                                className="p-1 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-md transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(txn)}
                                title="تعديل القيد"
                                className="p-1 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-md transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`هل أنت متأكد من حذف القيد ${txn.id}؟`)) {
                                    onDeleteTransaction(txn.id);
                                  }
                                }}
                                title="حذف القيد"
                                className="p-1 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Table Summary Footer (Sticky at bottom if needed) */}
                {filteredTransactions.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-mono font-black text-xs border-t-2 border-slate-700">
                      <td colSpan={12} className="py-2.5 px-4 font-sans font-black">
                        إجمالي النتائج المعروضة ({filteredTransactions.length} قيد):
                      </td>
                      <td className="py-2.5 px-2.5 text-left text-teal-300">
                        {formatCurrency(filteredTransactions.reduce((s, t) => s + (t.amountYER || 0), 0))} YER
                      </td>
                      <td className="py-2.5 px-2.5 text-left text-amber-300">
                        {formatCurrency(filteredTransactions.reduce((s, t) => s + (t.amountSAR || 0), 0))} SAR
                      </td>
                      <td className="py-2.5 px-2.5 text-left text-sky-300">
                        ${formatCurrency(filteredTransactions.reduce((s, t) => s + (t.amountUSD || 0), 0))} USD
                      </td>
                      <td className="sticky left-0 bg-slate-900"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
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

      {/* 6. SLIDE-OVER DRAWER FOR ADVANCED FILTERS */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            onClick={() => setIsFilterDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs transition-opacity animate-fade-in"
          />

          <div className="fixed inset-y-0 left-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-5 animate-fade-in">
              {/* Drawer Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <SlidersHorizontal className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <h3 className="text-sm font-black">الفلاتر المتقدمة للقيود</h3>
                  </div>
                  <button
                    onClick={() => setIsFilterDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Filters Fields */}
                <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
                  {/* Restriction */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">نوع القيد</label>
                    <select
                      value={filters.restriction}
                      onChange={(e) => setFilters({ ...filters, restriction: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="">جميع أنواع القيود</option>
                      {restrictions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Movement Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">طريقة الدفع</label>
                    <select
                      value={filters.movementType}
                      onChange={(e) => setFilters({ ...filters, movementType: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="">جميع طرق الدفع</option>
                      {movementTypes.map((mt) => (
                        <option key={mt} value={mt}>
                          {mt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Importance */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">درجة الأهمية / الحالة</label>
                    <select
                      value={filters.importance}
                      onChange={(e) => setFilters({ ...filters, importance: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="">جميع الحالات</option>
                      {importanceList.map((imp) => (
                        <option key={imp} value={imp}>
                          {imp}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Account */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">فئة الحساب</label>
                    <select
                      value={filters.categoryAccount}
                      onChange={(e) => setFilters({ ...filters, categoryAccount: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="">جميع فئات الحساب</option>
                      {categoryAccounts.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Restriction Account */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">حساب التقييد</label>
                    <select
                      value={filters.restrictionAccount}
                      onChange={(e) => setFilters({ ...filters, restrictionAccount: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="">جميع حسابات التقييد</option>
                      {restrictionAccounts.map((ra) => (
                        <option key={ra} value={ra}>
                          {ra}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">اسم الحساب المستفيد</label>
                    <select
                      value={filters.accountName}
                      onChange={(e) => setFilters({ ...filters, accountName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="">جميع أسماء الحسابات</option>
                      {accountNames.map((an) => (
                        <option key={an} value={an}>
                          {an}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">الفترة الزمنية</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 block mb-0.5">من تاريخ</span>
                        <input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                          className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 block mb-0.5">إلى تاريخ</span>
                        <input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                          className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  تطبيق الفلاتر
                </button>
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  إعادة ضبط
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
