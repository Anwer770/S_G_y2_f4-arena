/**
 * نموذج عرض سجل الحركات (R30): الفلاتر والترتيب والترقيم والتحديد.
 *
 * استُخرج من `RecordsView.tsx` كما هو حرفياً — نفس الحالة ونفس `useMemo` ونفس الترتيب.
 */
import { useMemo, useState } from 'react';
import type { RecordsViewProps } from './recordsTypes';

export function useRecordsViewModel(props: RecordsViewProps) {
  const {
    records,
    products,
    categories,
    statuses,
    onOpenAddModal,
    onEditRecord,
    onDeleteRecord,
    onCloneRecord,
    onViewRecord,
    onBulkDelete,
  } = props;

  // Filters State
  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [withoutQuantitiesOnly, setWithoutQuantitiesOnly] = useState(false);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<'date' | 'subId'>('subId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Multi-selection state
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Unique beneficiaries for filter dropdown
  const uniqueBeneficiaries = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) {
      if (r.beneficiary) set.add(r.beneficiary.trim());
    }
    return Array.from(set).sort();
  }, [records]);

  // Filter logic
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Text search
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const b = (r.beneficiary || '').toLowerCase();
        const d = (r.description || '').toLowerCase();
        const s = (r.subId || '').toLowerCase();
        const m = (r.mainId || '').toLowerCase();
        const n = (r.note || '').toLowerCase();
        if (
          !b.includes(query) &&
          !d.includes(query) &&
          !s.includes(query) &&
          !m.includes(query) &&
          !n.includes(query)
        ) {
          return false;
        }
      }

      if (movementType && r.movementType !== movementType) return false;
      if (status && r.status !== status) return false;
      if (category && r.category !== category) return false;
      if (selectedBeneficiary && r.beneficiary !== selectedBeneficiary) return false;
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;

      // Product filter
      if (selectedProduct) {
        if (!r.items || !(selectedProduct in r.items)) return false;
      }

      // Without quantities only
      if (withoutQuantitiesOnly) {
        const hasItems = r.items && Object.keys(r.items).length > 0;
        if (hasItems) return false;
      }

      return true;
    });
  }, [
    records,
    search,
    movementType,
    status,
    category,
    selectedBeneficiary,
    selectedProduct,
    startDate,
    endDate,
    withoutQuantitiesOnly,
  ]);

  // Sorting
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = (a.date || '').localeCompare(b.date || '');
      } else {
        comparison = (a.subId || '').localeCompare(b.subId || '', undefined, {
          numeric: true,
        });
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredRecords, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(Math.ceil(sortedRecords.length / pageSize), 1);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  // Quick reset filters
  const handleResetFilters = () => {
    setSearch('');
    setMovementType('');
    setStatus('');
    setCategory('');
    setSelectedProduct('');
    setSelectedBeneficiary('');
    setStartDate('');
    setEndDate('');
    setWithoutQuantitiesOnly(false);
    setCurrentPage(1);
  };

  // Select all / Deselect on page
  const handleToggleSelectAll = () => {
    const pageSubIds = paginatedRecords.map((r) => r.subId);
    const allSelected = pageSubIds.every((id) => selectedSubIds.includes(id));

    if (allSelected) {
      setSelectedSubIds(selectedSubIds.filter((id) => !pageSubIds.includes(id)));
    } else {
      const merged = new Set([...selectedSubIds, ...pageSubIds]);
      setSelectedSubIds(Array.from(merged));
    }
  };

  const handleToggleSelectOne = (subId: string) => {
    if (selectedSubIds.includes(subId)) {
      setSelectedSubIds(selectedSubIds.filter((id) => id !== subId));
    } else {
      setSelectedSubIds([...selectedSubIds, subId]);
    }
  };

  // Summary of filtered dataset
  const filteredTotals = useMemo(() => {
    let inCount = 0;
    let outCount = 0;
    let inUnits = 0;
    let outUnits = 0;

    for (const r of filteredRecords) {
      const items = r.items || {};
      const units = Object.values(items).reduce<number>((sum, q) => sum + (Number(q) || 0), 0);

      if (r.movementType === 'توريد') {
        inCount += 1;
        inUnits += units;
      } else {
        outCount += 1;
        outUnits += units;
      }
    }

    return { inCount, outCount, inUnits, outUnits, totalCount: filteredRecords.length };
  }, [filteredRecords]);

  return {
    ...props,
    category,
    products,
    categories,
    statuses,
    onOpenAddModal,
    onEditRecord,
    onDeleteRecord,
    onCloneRecord,
    onViewRecord,
    onBulkDelete,
    currentPage,
    endDate,
    filteredRecords,
    filteredTotals,
    handleResetFilters,
    handleToggleSelectAll,
    handleToggleSelectOne,
    movementType,
    pageSize,
    paginatedRecords,
    search,
    selectedBeneficiary,
    selectedProduct,
    selectedSubIds,
    setCategory,
    setCurrentPage,
    setEndDate,
    setMovementType,
    setPageSize,
    setSearch,
    setSelectedBeneficiary,
    setSelectedProduct,
    setSelectedSubIds,
    setSortField,
    setSortOrder,
    setStartDate,
    setStatus,
    setViewMode,
    setWithoutQuantitiesOnly,
    sortField,
    sortOrder,
    sortedRecords,
    startDate,
    status,
    totalPages,
    uniqueBeneficiaries,
    viewMode,
    withoutQuantitiesOnly,
  };
}

export type RecordsViewModel = ReturnType<typeof useRecordsViewModel>;
