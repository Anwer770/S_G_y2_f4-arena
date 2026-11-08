import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FinancialFilterState, FinancialPeriodFilter, FinancialTransaction } from '../../types';

/** شارة فلتر نشط (تُعرض في شريط «الفلاتر المطبقة») */
export interface FinancialFilterChip {
  id: string;
  label: string;
  value: string;
  onRemove: () => void;
}

/** حالة الفلاتر الافتراضية — لا قيم مخترعة، حقول فارغة (R18) */
export const createDefaultFilters = (todayStr: string): FinancialFilterState => ({
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

export interface FinancialState {
  filters: FinancialFilterState;
  setFilters: React.Dispatch<React.SetStateAction<FinancialFilterState>>;
  todayStr: string;
  draftsCount: number;
  periodLabel: string;
  handleSetPeriod: (p: FinancialPeriodFilter) => void;
  handleNavigatePeriod: (delta: number) => void;
  activeFilterChips: FinancialFilterChip[];
  activeAdvancedFilterCount: number;
  handleResetFilters: () => void;
  isFilterDrawerOpen: boolean;
  setIsFilterDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isPeriodDropdownOpen: boolean;
  setIsPeriodDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  periodDropdownRef: React.RefObject<HTMLDivElement | null>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/**
 * حالة وحدة المالية: الفلاتر، الفترة الزمنية، الشارات، ولوحة الفلاتر المتقدمة.
 * مستخرجة من FinancialModule.tsx (R27) — بلا أي تغيير سلوكي.
 */
export const useFinancialState = (transactions: FinancialTransaction[]): FinancialState => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
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

  const draftsCount = useMemo(() => transactions.filter((t) => t.isDraft).length, [transactions]);

  const [filters, setFilters] = useState<FinancialFilterState>(() => createDefaultFilters(todayStr));

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

    if (filters.periodFilter === 'daily') {
      const dayName = ARABIC_DAYS[dateObj.getDay()];
      return `${dayName}، ${d} ${ARABIC_MONTHS[m - 1]} ${y}`;
    }

    if (filters.periodFilter === 'weekly') {
      const dayOfWeek = dateObj.getDay();
      const diffToSat = (dayOfWeek + 1) % 7;
      const startOfWeek = new Date(dateObj);
      startOfWeek.setDate(dateObj.getDate() - diffToSat);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startD = startOfWeek.getDate();
      const startM = ARABIC_MONTHS[startOfWeek.getMonth()];
      const endD = endOfWeek.getDate();
      const endM = ARABIC_MONTHS[endOfWeek.getMonth()];
      const yr = endOfWeek.getFullYear();

      return `الأسبوع: ${startD} ${startM} - ${endD} ${endM} ${yr}`;
    }

    if (filters.periodFilter === 'monthly') {
      return `شهر ${ARABIC_MONTHS[m - 1]} ${y}`;
    }

    if (filters.periodFilter === 'yearly') {
      return `سنة ${y}`;
    }

    return curDateStr;
  }, [filters.periodFilter, filters.selectedPeriodDate, todayStr]);

  // Active filters count & list for Chips
  const activeFilterChips = useMemo<FinancialFilterChip[]>(() => {
    const chips: FinancialFilterChip[] = [];

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
    setFilters(createDefaultFilters(todayStr));
  };

  return {
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
  };
};
