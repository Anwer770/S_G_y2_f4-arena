import React, { useState, useMemo } from 'react';
import {
  Customer,
  CustomerFilterState,
  CustomerSource,
  CustomerVisitRecord,
} from '../../types';
import {
  CUSTOMER_REGIONS,
  CUSTOMER_RESPONSIBLES,
  CUSTOMER_ROUTES,
  CUSTOMER_SIGNIFICANCES,
  CUSTOMER_SOURCES,
  CUSTOMER_STATUSES,
} from '../../data/defaultCustomers';
import { filterCustomersList, isCustomerVisitDueToday } from '../../utils/customers';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Printer,
  Edit,
  Trash2,
  Phone,
  Eye,
  Calendar,
  Building2,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  UserCheck,
  Grid,
  List,
} from 'lucide-react';

interface Props {
  customers: Customer[];
  visits: CustomerVisitRecord[];
  onAddCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onViewDetails: (customer: Customer) => void;
  onRecordVisit: (customer: Customer) => void;
  onOpenStatement: (customer: Customer) => void;
  onExportExcel: () => void;
  onImportExcel: () => void;
}

export const CustomerDirectory: React.FC<Props> = ({
  customers,
  visits,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onViewDetails,
  onRecordVisit,
  onOpenStatement,
  onExportExcel,
  onImportExcel,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [filters, setFilters] = useState<CustomerFilterState>({
    search: '',
    source: 'الكل',
    region: 'الكل',
    route: 'الكل',
    significance: 'الكل',
    status: 'الكل',
    responsible: 'الكل',
    debtorsOnly: false,
    internalOnly: false,
    todayVisitsOnly: false,
  });

  const [sortBy, setSortBy] = useState<'id' | 'name' | 'balance' | 'route'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtered and sorted customers
  const filteredCustomers = useMemo(() => {
    const list = filterCustomersList(customers, filters);

    return list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, 'ar');
      } else if (sortBy === 'balance') {
        comparison = (a.balanceYER || 0) - (b.balanceYER || 0);
      } else if (sortBy === 'route') {
        comparison = (a.route || '').localeCompare(b.route || '', 'ar');
      } else {
        comparison = a.id.localeCompare(b.id, 'en', { numeric: true });
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [customers, filters, sortBy, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  const handleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'القيصر الذهبي':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'توب مكياجي':
        return 'bg-pink-50 text-pink-800 border-pink-300';
      case 'عفيف':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'الأطباء':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-300';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'مكتمل':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'قيد تنفيذ':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'مخطط':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'متابعة':
        return 'bg-purple-50 text-purple-700 border-purple-300';
      case 'ملغي':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      case 'مصفر':
        return 'bg-slate-50 text-slate-600 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Control & Filter Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-3">
        {/* Top bar: Search + Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setCurrentPage(1);
              }}
              placeholder="البحث بالاسم، المعرف، الهاتف، المندوب، أو المسار..."
              className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white shadow-2xs text-amber-600' : 'text-slate-500'
                }`}
                title="عرض جدول"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white shadow-2xs text-amber-600' : 'text-slate-500'
                }`}
                title="عرض بطاقات"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onImportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              استيراد Excel
            </button>

            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 rounded-xl font-bold text-xs border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
              title="تصدير كشف العملاء إلى ملف Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>تصدير Excel</span>
            </button>

            <button
              onClick={onAddCustomer}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs shadow-xs shadow-amber-200 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              إضافة عميل جديد
            </button>
          </div>
        </div>

        {/* Filter Selectors Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Source Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">المصدر / العلامة</label>
            <select
              value={filters.source}
              onChange={(e) => {
                setFilters({ ...filters, source: e.target.value as any });
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="الكل">جميع المصادر ({customers.length})</option>
              {CUSTOMER_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Region Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">المنطقة الجغرافية</label>
            <select
              value={filters.region}
              onChange={(e) => {
                setFilters({ ...filters, region: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="الكل">كافة المناطق</option>
              {CUSTOMER_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Route Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">مسار الزيارة (اليوم)</label>
            <select
              value={filters.route}
              onChange={(e) => {
                setFilters({ ...filters, route: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="الكل">كافة المسارات</option>
              {CUSTOMER_ROUTES.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </div>

          {/* Significance Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">مستوى الأهمية</label>
            <select
              value={filters.significance}
              onChange={(e) => {
                setFilters({ ...filters, significance: e.target.value as any });
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="الكل">كافة المستويات</option>
              {CUSTOMER_SIGNIFICANCES.map((sig) => (
                <option key={sig} value={sig}>
                  {sig}
                </option>
              ))}
            </select>
          </div>

          {/* Responsible Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">المندوب المسؤول</label>
            <select
              value={filters.responsible}
              onChange={(e) => {
                setFilters({ ...filters, responsible: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="الكل">كافة المندوبين</option>
              {CUSTOMER_RESPONSIBLES.map((resp) => (
                <option key={resp} value={resp}>
                  {resp}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">حالة الزيارة</label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value as any });
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="الكل">كافة الحالات</option>
              {CUSTOMER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fast Toggle Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
          <button
            onClick={() => setFilters({ ...filters, debtorsOnly: !filters.debtorsOnly })}
            className={`px-3 py-1 rounded-xl font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              filters.debtorsOnly
                ? 'bg-rose-500 text-white border-rose-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>⚠️ المديونيات بالسالب فقط</span>
          </button>

          <button
            onClick={() => setFilters({ ...filters, todayVisitsOnly: !filters.todayVisitsOnly })}
            className={`px-3 py-1 rounded-xl font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              filters.todayVisitsOnly
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>📅 زيارات اليوم المستحقة</span>
          </button>

          <button
            onClick={() => setFilters({ ...filters, internalOnly: !filters.internalOnly })}
            className={`px-3 py-1 rounded-xl font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              filters.internalOnly
                ? 'bg-purple-600 text-white border-purple-700'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>🏢 الحسابات الداخلية والعهدة</span>
          </button>

          {(filters.search ||
            filters.source !== 'الكل' ||
            filters.region !== 'الكل' ||
            filters.route !== 'الكل' ||
            filters.significance !== 'الكل' ||
            filters.status !== 'الكل' ||
            filters.responsible !== 'الكل' ||
            filters.debtorsOnly ||
            filters.todayVisitsOnly ||
            filters.internalOnly) && (
            <button
              onClick={() => {
                setFilters({
                  search: '',
                  source: 'الكل',
                  region: 'الكل',
                  route: 'الكل',
                  significance: 'الكل',
                  status: 'الكل',
                  responsible: 'الكل',
                  debtorsOnly: false,
                  internalOnly: false,
                  todayVisitsOnly: false,
                });
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline mr-auto cursor-pointer"
            >
              إعادة ضبط الفلاتر ↺
            </button>
          )}
        </div>
      </div>

      {/* Main View: Table Mode */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-270px)] min-h-[380px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-right border-collapse text-xs min-w-[960px] print:min-w-0">
              <thead className="sticky top-0 z-20">
                <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700 select-none shadow-2xs">
                  <th
                    onClick={() => handleSort('id')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors w-24 sticky right-0 z-30 bg-slate-100/95 dark:bg-slate-800/95 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)]"
                  >
                    <div className="flex items-center gap-1">
                      <span>المعرف</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className="py-2.5 px-2.5 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors min-w-[180px]"
                  >
                    <div className="flex items-center gap-1">
                      <span>اسم العميل / المنشأة</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    </div>
                  </th>
                  <th className="py-2.5 px-2 w-20">المصدر</th>
                  <th className="py-2.5 px-2.5 w-24">المنطقة</th>
                  <th
                    onClick={() => handleSort('route')}
                    className="py-2.5 px-2.5 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors w-24"
                  >
                    <div className="flex items-center gap-1">
                      <span>المسار</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    </div>
                  </th>
                  <th className="py-2.5 px-2 text-center w-14">الأهمية</th>
                  <th className="py-2.5 px-2 w-20">الحالة</th>
                  <th className="py-2.5 px-2.5 w-24">المندوب</th>
                  <th
                    onClick={() => handleSort('balance')}
                    className="py-2.5 px-2.5 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors text-left w-28"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>الرصيد YER</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center sticky left-0 z-30 bg-slate-100/95 dark:bg-slate-800/95 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)] w-36">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-400 dark:text-slate-500">
                      لا توجد بيانات مطابقة لمعايير البحث الحالية
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((c) => {
                    const isDueToday = isCustomerVisitDueToday(c.route);
                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-[12px] group ${
                          isDueToday ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        {/* ID & SubId */}
                        <td className="py-2 px-3 font-mono sticky right-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">{c.id}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-sans">{c.subId}</span>
                        </td>

                        {/* Name + Phone */}
                        <td className="py-2 px-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{c.name}</span>
                            {c.isInternalAccount && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-bold">
                                داخلي
                              </span>
                            )}
                          </div>
                          {c.phone && (
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5" />
                              {c.phone}
                            </span>
                          )}
                        </td>

                        {/* Source */}
                        <td className="py-2 px-2">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold text-xs border ${getSourceBadgeColor(
                              c.source
                            )}`}
                          >
                            {c.source}
                          </span>
                        </td>

                        {/* Region */}
                        <td className="py-2 px-2.5 font-medium text-slate-700 dark:text-slate-200">{c.region}</td>

                        {/* Route */}
                        <td className="py-2 px-2.5">
                          <span
                            className={`font-bold text-xs ${
                              isDueToday ? 'text-amber-700 font-black' : 'text-blue-700'
                            }`}
                          >
                            {c.route}
                            {isDueToday && <span className="mr-1 text-xs bg-amber-200 px-1 rounded-sm">اليوم</span>}
                          </span>
                        </td>

                        {/* Significance */}
                        <td className="py-2 px-2 text-center">
                          <span className="inline-block w-5 h-5 leading-5 rounded-full bg-slate-100 dark:bg-slate-800 font-black text-slate-800 dark:text-slate-200 text-xs">
                            {c.significance}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-2 px-2">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold text-xs border ${getStatusBadgeColor(
                              c.status
                            )}`}
                          >
                            {c.status}
                          </span>
                        </td>

                        {/* Responsible */}
                        <td className="py-2 px-2.5 font-bold text-indigo-700 dark:text-indigo-300">{c.responsible}</td>

                        {/* Balance */}
                        <td className="py-2 px-2.5 text-left font-mono">
                          <span
                            className={`font-black text-xs block ${
                              (c.balanceYER || 0) < 0
                                ? 'text-rose-600'
                                : (c.balanceYER || 0) > 0
                                ? 'text-emerald-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {(c.balanceYER || 0).toLocaleString('ar-YE')} ريال
                          </span>
                          {(c.balanceSAR || c.balanceUSD) ? (
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                              {c.balanceSAR ? `${(c.balanceSAR || 0).toLocaleString()} SAR ` : ''}
                              {c.balanceUSD ? `$${(c.balanceUSD || 0).toLocaleString()}` : ''}
                            </span>
                          ) : null}
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-3 text-center sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onViewDetails(c)}
                              title="معاينة الملف الكامل"
                              className="p-1 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onRecordVisit(c)}
                              title="تسجيل زيارة"
                              className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenStatement(c)}
                              title="كشف حساب"
                              className="p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEditCustomer(c)}
                              title="تعديل"
                              className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteCustomer(c.id)}
                              title="حذف"
                              className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
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

          {/* Pagination Toolbar */}
          <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 flex-wrap gap-2">
            <div>
              عرض{' '}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {filteredCustomers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              إلى{' '}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {Math.min(currentPage * itemsPerPage, filteredCustomers.length)}
              </span>{' '}
              من أصل <span className="font-bold text-slate-900 dark:text-slate-100">{filteredCustomers.length}</span> عميل
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-mono font-bold text-slate-800 dark:text-slate-200">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Cards View Mode */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedCustomers.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:shadow-md transition-all space-y-3 relative group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm">{c.name}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-xs border ${getSourceBadgeColor(
                          c.source
                        )}`}
                      >
                        {c.source}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                      {c.id} • {c.subId}
                    </p>
                  </div>
                  <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-800 dark:text-slate-200 text-xs">
                    {c.significance}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-xs">المنطقة والمسار:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {c.region} • {c.route}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-xs">المندوب:</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">{c.responsible}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">الرصيد اليمني:</span>
                    <span
                      className={`font-black font-mono text-sm ${
                        (c.balanceYER || 0) < 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {(c.balanceYER || 0).toLocaleString()} ريال
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-xs border ${getStatusBadgeColor(
                      c.status
                    )}`}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 text-xs">
                  <button
                    onClick={() => onViewDetails(c)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    معاينة
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRecordVisit(c)}
                      className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      زيارة
                    </button>
                    <button
                      onClick={() => onOpenStatement(c)}
                      className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold transition-colors cursor-pointer"
                    >
                      كشف
                    </button>
                    <button
                      onClick={() => onEditCustomer(c)}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cards Pagination */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span>
              الصفحة {currentPage} من {totalPages} ({filteredCustomers.length} عميل)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 font-bold disabled:opacity-40"
              >
                السابق
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 font-bold disabled:opacity-40"
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
