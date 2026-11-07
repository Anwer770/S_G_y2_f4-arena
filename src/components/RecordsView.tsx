import React, { useState, useMemo } from 'react';
import { MovementRecord, Product } from '../types';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Calendar,
  Layers,
  User,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  CheckSquare,
  Square,
  AlertCircle,
  Printer,
  Table,
  LayoutGrid,
} from 'lucide-react';
import {
  calculateArabicDay,
  formatNumberLatin,
  getCategoryBadgeStyle,
  getMovementTypeStyle,
  getStatusStyle,
} from '../utils/formatters';
import { exportRecordsToCSV, exportRecordsToExcel } from '../utils/excel';

interface RecordsViewProps {
  records: MovementRecord[];
  products: Product[];
  categories: string[];
  statuses: string[];
  onOpenAddModal: () => void;
  onEditRecord: (record: MovementRecord) => void;
  onDeleteRecord: (record: MovementRecord) => void;
  onCloneRecord: (record: MovementRecord) => void;
  onViewRecord: (record: MovementRecord) => void;
  onBulkDelete: (subIds: string[]) => void;
}

export const RecordsView: React.FC<RecordsViewProps> = ({
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
}) => {
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

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header & Quick Actions Bar */}
      <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#0D9488]" />
              <span>سجل حركات الصرف والتوريد</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              إدارة وبحث وتصفية الحركات المسجلة مع إمكانية التصدير والطباعة
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Bulk delete action if items selected */}
            {selectedSubIds.length > 0 && (
              <button
                onClick={() => {
                  if (
                    confirm(
                      `هل أنت متأكد من حذف ${selectedSubIds.length} حركة محددة نهائياً؟`
                    )
                  ) {
                    onBulkDelete(selectedSubIds);
                    setSelectedSubIds([]);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#EF4444] hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف المحدد ({selectedSubIds.length})</span>
              </button>
            )}

            {/* Export Excel (FR-35) */}
            <button
              onClick={() => exportRecordsToExcel(filteredRecords, products, 'حركات_صرف_وتوريد_مفلترة.xlsx')}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              title="تصدير الحركات المعروضة إلى ملف Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير Excel</span>
            </button>

            {/* Export CSV (FR-42) */}
            <button
              onClick={() => exportRecordsToCSV(filteredRecords, products)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              title="تصدير CSV بترميز UTF-8"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>

            {/* Add Movement */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0D9488] hover:bg-[#059669] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>حركة جديدة</span>
            </button>
          </div>
        </div>

        {/* 2. Search & Filter Controls Matrix (FR-14, FR-15) */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Main Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="بحث سريع برقم السند (IN-0001 / OUT-0299)، اسم المستفيد، البيان، أو المعرف..."
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Filter Selectors Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
            {/* Movement Type */}
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1 text-xs">نوع الحركة</label>
              <select
                value={movementType}
                onChange={(e) => {
                  setMovementType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 font-medium"
              >
                <option value="">الكل (توريد وصرف)</option>
                <option value="توريد">توريد (IN)</option>
                <option value="صرف">صرف (OUT)</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1 text-xs">الفئة</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 font-medium"
              >
                <option value="">جميع الفئات</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1 text-xs">الحالة</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 font-medium"
              >
                <option value="">جميع الحالات</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Specific Product */}
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1 text-xs">الصنف</label>
              <select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 font-medium truncate"
              >
                <option value="">جميع الأصناف (62)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1 text-xs">من تاريخ</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:bg-white dark:focus:bg-slate-900 font-mono"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1 text-xs">إلى تاريخ</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:bg-white dark:focus:bg-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Secondary Filter Row: Beneficiary & Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Beneficiary quick filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-semibold text-xs">المستفيد:</span>
                <select
                  value={selectedBeneficiary}
                  onChange={(e) => {
                    setSelectedBeneficiary(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="p-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-lg text-xs max-w-xs"
                >
                  <option value="">جميع المستفيدين</option>
                  {uniqueBeneficiaries.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* FR-22: Filter without quantities only */}
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200 font-medium">
                <input
                  type="checkbox"
                  checked={withoutQuantitiesOnly}
                  onChange={(e) => {
                    setWithoutQuantitiesOnly(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="rounded text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                />
                <span>عرض الحركات بدون كميات فقط (OUT-0250 إلى OUT-0265)</span>
              </label>
            </div>

            {/* Reset Filters button */}
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط الفلاتر</span>
            </button>
          </div>
        </div>

        {/* 3. Live Totals Ribbon for Filtered Results */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              نتائج الفلترة: <strong className="text-blue-600 dark:text-blue-400 font-mono font-black">{filteredTotals.totalCount}</strong> حركة
            </span>
            <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-200 font-bold">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>توريد: {filteredTotals.inCount} حركة ({formatNumberLatin(filteredTotals.inUnits)} وحدة)</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-200 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>صرف: {filteredTotals.outCount} حركة ({formatNumberLatin(filteredTotals.outUnits)} وحدة)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle: Table vs Mobile Cards */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-600">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="عرض الجدول الكامل"
              >
                <Table className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">جدول</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="عرض بطاقات تفاعلية مناسبة للهواتف والميدان"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">بطاقات</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 text-xs">عدد السجلات بالصفحة:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="p-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-xs font-mono"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Movements: Cards View or Table View (FR-11, FR-12, FR-13) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        {viewMode === 'cards' ? (
          <div className="p-3">
            {paginatedRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                لا توجد حركات مخزنية مطابقة لمعايير البحث المحددة
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {paginatedRecords.map((r) => {
                  const typeStyle = getMovementTypeStyle(r.movementType);
                  const statusStyle = getStatusStyle(r.status);
                  const categoryStyle = getCategoryBadgeStyle(r.category);
                  const isSelected = selectedSubIds.includes(r.subId);

                  const itemsCount = Object.keys(r.items || {}).length;
                  const totalUnits = (Object.values(r.items || {}) as (number | string)[]).reduce<number>((s, q) => s + (Number(q) || 0), 0);

                  return (
                    <div
                      key={r.id || r.subId}
                      className={`p-3.5 rounded-xl border transition-all relative flex flex-col justify-between space-y-2.5 shadow-2xs ${
                        isSelected
                          ? 'bg-blue-50/50 border-blue-400 ring-2 ring-blue-500/20'
                          : 'bg-white border-slate-200 hover:border-teal-400'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(r.subId)}
                            className="rounded text-blue-600 dark:text-blue-400 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                            {r.subId}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${typeStyle}`}>
                            {r.movementType}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${statusStyle}`}>
                            {r.status}
                          </span>
                        </div>
                      </div>

                      {/* Beneficiary & Category */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 dark:text-slate-500 text-xs">المستفيد:</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px]" title={r.beneficiary}>
                            {r.beneficiary || 'غير محدد'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className={`px-1.5 py-0.2 rounded border ${categoryStyle}`}>
                            {r.category}
                          </span>
                          <span className="font-mono text-slate-400 dark:text-slate-500">
                            {r.mainId}
                          </span>
                        </div>
                      </div>

                      {/* Quantities summary */}
                      <div className="pt-1 flex items-baseline justify-between border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div>
                          <span className="text-xs text-slate-400 dark:text-slate-500 block font-medium">الأصناف المصروفة/الموردة:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {itemsCount} أصناف ({formatNumberLatin(totalUnits)} وحدة)
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          {calculateArabicDay(r.date)} • {r.date}
                        </div>
                      </div>

                      {/* Items list pill preview */}
                      {itemsCount > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(r.items || {}).slice(0, 3).map(([item, qty]) => (
                            <span key={item} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-700 dark:text-slate-200 truncate max-w-[140px]">
                              {item}: <strong>{formatNumberLatin(Number(qty) || 0)}</strong>
                            </span>
                          ))}
                          {itemsCount > 3 && (
                            <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs">
                              +{itemsCount - 3} أخرى
                            </span>
                          )}
                        </div>
                      )}

                      {r.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg">
                          {r.description}
                        </p>
                      )}

                      {/* Card Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onViewRecord(r)}
                            className="px-2 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg flex items-center gap-1 cursor-pointer"
                            title="معاينة السند"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>معاينة</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditRecord(r)}
                            className="px-2 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg flex items-center gap-1 cursor-pointer"
                            title="تعديل الحركة"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onCloneRecord(r)}
                            className="p-1 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg cursor-pointer transition-colors"
                            title="تكرار الحركة"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteRecord(r)}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                          title="حذف الحركة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-270px)] min-h-[380px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-right text-xs border-collapse min-w-[820px] print:min-w-0">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold select-none shadow-2xs">
                <th className="py-2.5 px-3 w-10 text-center sticky right-0 z-30 bg-slate-100/95 dark:bg-slate-800/95 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                  <button
                    onClick={handleToggleSelectAll}
                    className="cursor-pointer text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                    title="تحديد / إلغاء تحديد الكل في هذه الصفحة"
                  >
                    {paginatedRecords.length > 0 &&
                    paginatedRecords.every((r) => selectedSubIds.includes(r.subId)) ? (
                      <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th
                  onClick={() => {
                    if (sortField === 'subId') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('subId');
                      setSortOrder('desc');
                    }
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                >
                  الرقم الفرعي {sortField === 'subId' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => {
                    if (sortField === 'date') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('date');
                      setSortOrder('desc');
                    }
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                >
                  التاريخ {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2.5 px-2.5">نوع الحركة</th>
                <th className="py-2.5 px-2.5">المستفيد</th>
                <th className="py-2.5 px-2.5">البيان والوصف</th>
                <th className="py-2.5 px-2.5">الفئة / الحالة</th>
                <th className="py-2.5 px-2.5">تفاصيل الأصناف والكميات</th>
                <th className="py-2.5 px-3 text-center sticky left-0 z-30 bg-slate-100/95 dark:bg-slate-800/95 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)] w-28">الإجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-6 h-6 text-slate-300" />
                      <span>لا توجد حركات تطابق معايير الفلترة والبحث الحالية</span>
                      <button
                        onClick={handleResetFilters}
                        className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline mt-1"
                      >
                        إعادة ضبط الفلاتر
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => {
                  const isSelected = selectedSubIds.includes(r.subId);
                  const moveStyle = getMovementTypeStyle(r.movementType);
                  const itemsEntries = Object.entries(r.items || {});
                  const totalUnits = itemsEntries.reduce((sum, [, q]) => sum + (Number(q) || 0), 0);
                  const dayName = calculateArabicDay(r.date);

                  return (
                    <tr
                      key={r.subId}
                      className={`transition-colors text-[12px] group ${
                        isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className={`py-2 px-3 text-center sticky right-0 z-10 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)] transition-colors ${
                        isSelected ? 'bg-blue-50/90' : 'bg-white group-hover:bg-slate-50'
                      }`}>
                        <button
                          onClick={() => handleToggleSelectOne(r.subId)}
                          className="cursor-pointer text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Sub ID */}
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex flex-col">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold w-fit ${
                            r.movementType === 'توريد' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-900'
                          }`}>
                            {r.subId}
                          </span>
                          {r.mainId && (
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                              {r.mainId}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date & Day */}
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-mono text-xs">
                        <div>{r.date}</div>
                        {dayName && <div className="text-xs text-slate-400 dark:text-slate-500 font-sans">{dayName}</div>}
                      </td>

                      {/* Movement Type */}
                      <td className="py-2 px-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${moveStyle.badge}`}>
                          {r.movementType === 'توريد' ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          <span>{r.movementType}</span>
                        </span>
                      </td>

                      {/* Beneficiary */}
                      <td className="py-2 px-2.5 font-bold text-slate-900 dark:text-slate-100 max-w-[160px] truncate" title={r.beneficiary}>
                        {r.beneficiary}
                      </td>

                      {/* Description */}
                      <td className="py-2 px-2.5 text-slate-600 dark:text-slate-300 max-w-[200px] truncate text-xs" title={r.description}>
                        {r.description}
                        {r.note && (
                          <div className="text-xs text-amber-700 dark:text-amber-300 italic truncate" title={r.note}>
                            ملاحظة: {r.note}
                          </div>
                        )}
                      </td>

                      {/* Category & Status */}
                      <td className="py-2 px-2.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getCategoryBadgeStyle(r.category)}`}>
                            {r.category}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getStatusStyle(r.status)}`}>
                            {r.status}
                          </span>
                        </div>
                      </td>

                      {/* Items Chips (FR-13, FR-22) */}
                      <td className="py-2 px-2.5">
                        {itemsEntries.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded text-xs font-semibold">
                            <AlertCircle className="w-3 h-3" />
                            <span>بدون كميات رقمية</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 flex-wrap max-w-sm">
                            {itemsEntries.slice(0, 3).map(([name, qty]) => (
                              <span
                                key={name}
                                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700"
                              >
                                {name} <strong className="font-mono text-blue-700 dark:text-blue-300">×{qty}</strong>
                              </span>
                            ))}
                            {itemsEntries.length > 3 && (
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-800/60 px-1.5 py-0.5 rounded">
                                +{itemsEntries.length - 3}
                              </span>
                            )}
                            <span className="text-xs text-slate-600 dark:text-slate-300 font-mono font-bold mr-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              الإجمالي: {totalUnits}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className={`py-2 px-3 text-center sticky left-0 z-10 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)] transition-colors ${
                        isSelected ? 'bg-blue-50/90' : 'bg-white group-hover:bg-slate-50'
                      }`}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewRecord(r)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                            title="معاينة السند / طباعة"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onEditRecord(r)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                            title="تعديل الحركة"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onCloneRecord(r)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                            title="تكرار / استنساخ الحركة"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteRecord(r)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="حذف الحركة"
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
          </table>
        </div>
        )}

        {/* 5. Pagination Bar (FR-12) */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 dark:text-slate-400 font-medium">
            عرض {paginatedRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} إلى{' '}
            {Math.min(currentPage * pageSize, sortedRecords.length)} من إجمالي{' '}
            <strong className="text-slate-900 dark:text-slate-100 font-mono">{sortedRecords.length}</strong> حركة
          </div>

          <div className="flex items-center gap-1 font-mono">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 font-sans cursor-pointer"
            >
              السابق
            </button>

            <div className="px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200">
              {currentPage} / {totalPages}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 font-sans cursor-pointer"
            >
              التالي
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
