import React from 'react';
import { FinancialFilterState, FinancialPeriodFilter } from '../../types';
import {
  Search,
  RotateCcw,
  SlidersHorizontal,
  X,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Check,
  FileText,
  LayoutGrid,
  Table,
} from 'lucide-react';
import type { FinancialFilterChip } from './useFinancialState';

interface Props {
  filters: FinancialFilterState;
  setFilters: React.Dispatch<React.SetStateAction<FinancialFilterState>>;
  movements: string[];
  draftsCount: number;
  activeFilterChips: FinancialFilterChip[];
  activeAdvancedFilterCount: number;
  periodLabel: string;
  todayStr: string;
  onSetPeriod: (p: FinancialPeriodFilter) => void;
  onNavigatePeriod: (delta: number) => void;
  onResetFilters: () => void;
  onOpenAdvanced: () => void;
  isPeriodDropdownOpen: boolean;
  setIsPeriodDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  periodDropdownRef: React.RefObject<HTMLDivElement | null>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  viewMode: 'table' | 'cards';
  onViewModeChange: (m: 'table' | 'cards') => void;
}

const PERIOD_OPTIONS: { id: FinancialPeriodFilter; label: string }[] = [
  { id: 'daily', label: 'يومي' },
  { id: 'weekly', label: 'أسبوعي' },
  { id: 'monthly', label: 'شهري' },
  { id: 'yearly', label: 'سنوي' },
  { id: 'all', label: 'الكل' },
];

const PERIOD_BUTTON_LABEL: Record<FinancialPeriodFilter, string> = {
  all: 'الفترة: الكل',
  daily: 'الفترة: يومي',
  weekly: 'الفترة: أسبوعي',
  monthly: 'الفترة: شهري',
  yearly: 'الفترة: سنوي',
};

/**
 * شريط البحث والفلاتر السريعة + شارات الفلاتر المطبقة.
 * مستخرج من FinancialModule.tsx (R27) — نفس العناصر ونفس hooks الاختبارية.
 */
export const FinancialFilters: React.FC<Props> = ({
  filters,
  setFilters,
  movements,
  draftsCount,
  activeFilterChips,
  activeAdvancedFilterCount,
  periodLabel,
  todayStr,
  onSetPeriod,
  onNavigatePeriod,
  onResetFilters,
  onOpenAdvanced,
  isPeriodDropdownOpen,
  setIsPeriodDropdownOpen,
  periodDropdownRef,
  searchInputRef,
  viewMode,
  onViewModeChange,
}) => {
  return (
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
              <span>{PERIOD_BUTTON_LABEL[filters.periodFilter] ?? PERIOD_BUTTON_LABEL.all}</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-teal-600 dark:text-teal-400 transition-transform shrink-0 ${isPeriodDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Options Popup */}
          {isPeriodDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 space-y-1">
              {PERIOD_OPTIONS.map((opt) => {
                const isSelected = filters.periodFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onSetPeriod(opt.id);
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
              onClick={() => onNavigatePeriod(-1)}
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
              onClick={() => onNavigatePeriod(1)}
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
            onChange={(e) =>
              setFilters({ ...filters, currencyFilter: e.target.value as FinancialFilterState['currencyFilter'] })
            }
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
                  filters.isDraftOnly
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {draftsCount}
              </span>
            )}
          </button>
        </div>

        {/* Open Slide-over Drawer for Advanced Filters */}
        <button
          onClick={onOpenAdvanced}
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
            <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-bold">
              {activeAdvancedFilterCount}
            </span>
          )}
        </button>

        {/* View Mode Toggle: Table vs Mobile Cards */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
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
            onClick={() => onViewModeChange('cards')}
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
            onClick={onResetFilters}
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
            onClick={onResetFilters}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 underline font-medium cursor-pointer mr-1"
          >
            إلغاء الكل
          </button>
        </div>
      )}
    </div>
  );
};
