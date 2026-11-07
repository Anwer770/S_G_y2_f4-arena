import React, { useState, useMemo } from 'react';
import {
  CustodyIssueRecord,
  CustodySection,
  CustodyFilterState,
} from '../../types/custodyIssues';
import {
  calculateCustodyKPIs,
  loadCustodyCategories,
  loadCustodyIssues,
  loadCustodyPriorities,
  loadCustodyResponsibles,
  loadCustodyStatuses,
  logCustodyAudit,
  resetCustodyToDefault,
  saveCustodyCategories,
  saveCustodyIssues,
  saveCustodyResponsibles,
} from '../../utils/storage';
import {
  exportCustodyToCSV,
  exportCustodyToExcel,
  exportCustodyToJSON,
  searchCustodyRecords,
} from '../../utils/custodyExport';
import { UniversalDataExchangeModal } from '../common/UniversalDataExchangeModal';
import { downloadCustodyExcelTemplate } from '../../utils/universalDataTemplates';
import { parseCustodyExcelFile } from '../../utils/universalImporters';
import { CustodyStatsCards } from './CustodyStatsCards';
import { CustodyIssuesTable } from './CustodyIssuesTable';
import { CustodyIssueModal } from './CustodyIssueModal';
import { CustodyPrintReport } from './CustodyPrintReport';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Printer,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Layers,
  X,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';

export const CustodyIssuesModule: React.FC = () => {
  // --- Module State ---
  const [records, setRecords] = useState<CustodyIssueRecord[]>(() => loadCustodyIssues());
  const [categories, setCategories] = useState<string[]>(() => loadCustodyCategories());
  const [responsibles, setResponsibles] = useState<string[]>(() => loadCustodyResponsibles());
  const [statuses] = useState<string[]>(() => loadCustodyStatuses());
  const [priorities] = useState<string[]>(() => loadCustodyPriorities());

  // --- View Mode (List vs Print) ---
  const [viewMode, setViewMode] = useState<'list' | 'print'>('list');

  // --- Modals State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CustodyIssueRecord | null>(null);
  const [defaultModalSection, setDefaultModalSection] = useState<CustodySection>('custody');
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleImportFile = async (file: File) => {
    const result = await parseCustodyExcelFile(file);
    if (result.count === 0) {
      return { success: false, message: 'الملف لا يحتوي على سجلات عهد أو إشكاليات صالحة.' };
    }

    const map = new Map<string, CustodyIssueRecord>();
    records.forEach((r) => map.set(r.id, r));
    result.records.forEach((r) => map.set(r.id, r));
    const merged = Array.from(map.values());

    updateRecords(merged);
    logCustodyAudit('استيراد', `تم استيراد ${result.count} سجل عهد وإشكاليات من ملف Excel`, 'BATCH');

    return {
      success: true,
      message: `تم استيراد ${result.count} سجل عهد وإشكاليات بنجاح!`,
    };
  };

  // --- Filtering & Search State ---
  const [filterState, setFilterState] = useState<CustodyFilterState>({
    search: '',
    section: 'all',
    status: 'all',
    priority: 'all',
    category: 'all',
    responsible: 'all',
    onlyLateOrPostponed: false,
    onlyUnclassified: false,
    onlyCorrupted: false,
  });

  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // --- Handlers for Storage Updates ---
  const updateRecords = (newRecords: CustodyIssueRecord[]) => {
    setRecords(newRecords);
    saveCustodyIssues(newRecords);
  };

  // --- KPIs Calculation ---
  const kpis = useMemo(() => calculateCustodyKPIs(records), [records]);

  // --- Filtered and Sorted Records ---
  const filteredRecords = useMemo(() => {
    let result = records;

    // 1. Text Search with Arabic Normalization
    if (filterState.search.trim()) {
      result = searchCustodyRecords(result, filterState.search);
    }

    // 2. Section Filter
    if (filterState.section !== 'all') {
      result = result.filter((r) => r.section === filterState.section);
    }

    // 3. Status Filter
    if (filterState.status !== 'all') {
      if (filterState.status === 'بدون حالة') {
        result = result.filter((r) => !r.status || r.status === 'بدون حالة' || r.status.trim() === '');
      } else {
        result = result.filter((r) => r.status === filterState.status);
      }
    }

    // 4. Priority Filter
    if (filterState.priority !== 'all') {
      result = result.filter((r) => (r.pri || '').toUpperCase() === filterState.priority.toUpperCase());
    }

    // 5. Category Filter
    if (filterState.category !== 'all') {
      result = result.filter((r) => r.cat === filterState.category);
    }

    // 6. Responsible Filter
    if (filterState.responsible !== 'all') {
      result = result.filter((r) => r.resp === filterState.responsible);
    }

    // 7. Quick Flags
    if (filterState.onlyLateOrPostponed) {
      result = result.filter((r) => r.status === 'متأخر' || r.status === 'مؤجل');
    }

    if (filterState.onlyUnclassified) {
      result = result.filter((r) => !r.status || r.status === 'بدون حالة' || r.status.trim() === '');
    }

    if (filterState.onlyCorrupted) {
      result = result.filter((r) => r.isCorruptedReference || (r.desc && r.desc.includes('Schedule!')));
    }

    // 8. Sorting by Date
    return [...result].sort((a, b) => {
      const dateA = a.date || '0000-00-00';
      const dateB = b.date || '0000-00-00';
      return sortOrder === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    });
  }, [records, filterState, sortOrder]);

  // --- CRUD Handlers ---
  const handleOpenAddModal = (section: CustodySection = 'custody') => {
    setEditingRecord(null);
    setDefaultModalSection(section);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: CustodyIssueRecord) => {
    setEditingRecord(record);
    setDefaultModalSection(record.section);
    setIsModalOpen(true);
  };

  const handleSaveRecord = (recordData: Partial<CustodyIssueRecord>) => {
    if (recordData.id) {
      // Edit existing
      const updated = records.map((r) => (r.id === recordData.id ? ({ ...r, ...recordData } as CustodyIssueRecord) : r));
      updateRecords(updated);
      logCustodyAudit('تعديل', `تم تعديل السجل ${recordData.id}: ${recordData.name || ''} - ${recordData.desc || ''}`, recordData.id);
    } else {
      // Add new
      const newId = `CI-${String(records.length + 1).padStart(2, '0')}`;
      const newRecord: CustodyIssueRecord = {
        id: newId,
        section: recordData.section || 'custody',
        date: recordData.date || new Date().toISOString().split('T')[0],
        name: recordData.name || '',
        desc: recordData.desc || '',
        cat: recordData.cat || 'أخرى',
        pri: recordData.pri || 'A',
        status: recordData.status || 'مخطط',
        resp: recordData.resp || 'انا',
        amount: recordData.amount || 0,
        currency: recordData.currency || 'ريال يمني',
        notes: recordData.notes || '',
        link: recordData.link || '',
        isCorruptedReference: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [newRecord, ...records];
      updateRecords(updated);

      // Auto-update categories/responsibles lists if new
      if (newRecord.cat && !categories.includes(newRecord.cat)) {
        const nextCats = [...categories, newRecord.cat];
        setCategories(nextCats);
        saveCustodyCategories(nextCats);
      }
      if (newRecord.resp && !responsibles.includes(newRecord.resp)) {
        const nextResps = [...responsibles, newRecord.resp];
        setResponsibles(nextResps);
        saveCustodyResponsibles(nextResps);
      }

      logCustodyAudit('إضافة', `تمت إضافة سجل جديد ${newId}: ${newRecord.name || ''} - ${newRecord.desc}`, newId);
    }
  };

  const handleCloneRecord = (record: CustodyIssueRecord) => {
    const cloneId = `CI-${String(records.length + 1).padStart(2, '0')}`;
    const cloned: CustodyIssueRecord = {
      ...record,
      id: cloneId,
      desc: `${record.desc} (نسخة مستنسخة)`,
      status: 'مخطط',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [cloned, ...records];
    updateRecords(updated);
    logCustodyAudit('استنساخ', `تم استنساخ السجل ${record.id} إلى ${cloneId}`, cloneId);
  };

  const handleDeleteRecord = (id: string) => {
    setRecordToDelete(id);
  };

  const confirmDeleteRecord = () => {
    if (!recordToDelete) return;
    const target = records.find((r) => r.id === recordToDelete);
    const updated = records.filter((r) => r.id !== recordToDelete);
    updateRecords(updated);
    logCustodyAudit('حذف', `تم حذف السجل ${recordToDelete}: ${target?.name || ''} - ${target?.desc || ''}`, recordToDelete);
    setRecordToDelete(null);
  };

  const handleChangeStatus = (id: string, newStatus: string) => {
    const updated = records.map((r) => (r.id === id ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r));
    updateRecords(updated);
    logCustodyAudit('تغيير حالة', `تم تغيير حالة السجل ${id} إلى "${newStatus}"`, id);
  };

  const handleResetToDefault = () => {
    resetCustodyToDefault();
    setRecords(loadCustodyIssues());
    setCategories(loadCustodyCategories());
    setResponsibles(loadCustodyResponsibles());
    setIsResetConfirmOpen(false);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.records)) {
          updateRecords(parsed.records);
          logCustodyAudit('استيراد', `تم استيراد ${parsed.records.length} سجل من ملف JSON بنجاح`);
          alert(`تم استيراد ${parsed.records.length} سجل بنجاح!`);
        } else if (Array.isArray(parsed)) {
          updateRecords(parsed);
          logCustodyAudit('استيراد', `تم استيراد ${parsed.length} سجل من ملف JSON بنجاح`);
          alert(`تم استيراد ${parsed.length} سجل بنجاح!`);
        } else {
          alert('الملف المحدد لا يحتوي على بنية بيانات سجلات العهد والاشكاليات الصحيحة.');
        }
      } catch (err) {
        console.error('Import error:', err);
        alert('حدث خطأ أثناء قراءة ملف JSON. تأكد من سلامة الملف.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const hasActiveFilters =
    filterState.search ||
    filterState.section !== 'all' ||
    filterState.status !== 'all' ||
    filterState.priority !== 'all' ||
    filterState.category !== 'all' ||
    filterState.responsible !== 'all' ||
    filterState.onlyLateOrPostponed ||
    filterState.onlyUnclassified ||
    filterState.onlyCorrupted;

  const clearAllFilters = () => {
    setFilterState({
      search: '',
      section: 'all',
      status: 'all',
      priority: 'all',
      category: 'all',
      responsible: 'all',
      onlyLateOrPostponed: false,
      onlyUnclassified: false,
      onlyCorrupted: false,
    });
  };

  // If Print View is active, render Print Component
  if (viewMode === 'print') {
    return (
      <CustodyPrintReport
        records={filteredRecords}
        kpis={kpis}
        onBack={() => setViewMode('list')}
        filterSummary={
          filterState.section === 'custody'
            ? 'قسم العهد وحسابات'
            : filterState.section === 'issues'
            ? 'قسم الاشكاليات المعلقة'
            : 'كافة الأقسام'
        }
      />
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header Banner */}
      <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[#0D9488] text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
                ادارة العهد والاشكاليات
              </h1>
              <span className="bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-black text-xs px-2.5 py-0.5 rounded-full border border-teal-200/50 dark:border-teal-800/50">
                الحسابات المعلقة
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              متابعة العهد المالية ودفاتر السندات والفواتير، حسابات (له/عليه)، وإقفال إشكاليات المرتجعات وفروقات الجرد
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="استيراد وتصدير سجلات العهد والإشكاليات Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>استيراد إكسل</span>
          </button>

          <button
            onClick={() => handleOpenAddModal('custody')}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl font-black text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>عهدة / حساب جديد</span>
          </button>

          <button
            onClick={() => handleOpenAddModal('issues')}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl font-black text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>إشكالية معلقة</span>
          </button>

          <button
            onClick={() => setViewMode('print')}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="معاينة وطباعة التقرير"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">طباعة</span>
          </button>

          <button
            onClick={() => exportCustodyToCSV(filteredRecords)}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="تصدير CSV متوافق مع Excel (UTF-8 BOM)"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics & Quick Filter Highlights */}
      <CustodyStatsCards
        kpis={kpis}
        activeStatusFilter={filterState.status}
        onSelectStatusFilter={(status) => {
          setFilterState((prev) => ({
            ...prev,
            status,
            onlyLateOrPostponed: false,
            onlyUnclassified: false,
            onlyCorrupted: false,
          }));
        }}
        onFilterCorrupted={() => {
          setFilterState((prev) => ({
            ...prev,
            onlyCorrupted: !prev.onlyCorrupted,
            onlyLateOrPostponed: false,
            onlyUnclassified: false,
            status: 'all',
          }));
        }}
      />

      {/* 3. Search & Comprehensive Filter Bar */}
      <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Text Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterState.search}
              onChange={(e) => setFilterState((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="بحث بالاسم، الوصف، الفئة، رقم السند، المسؤول..."
              className="w-full pl-3 pr-10 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
            {filterState.search && (
              <button
                onClick={() => setFilterState((prev) => ({ ...prev, search: '' }))}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Section Filter */}
          <div>
            <select
              value={filterState.section}
              onChange={(e) => setFilterState((prev) => ({ ...prev, section: e.target.value as any }))}
              className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">جميع الأقسام ({records.length})</option>
              <option value="custody">العهد وحسابات ({kpis.custodyCount})</option>
              <option value="issues">الاشكاليات المعلقة ({kpis.issuesCount})</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterState.status}
              onChange={(e) => setFilterState((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">جميع الحالات</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={filterState.priority}
              onChange={(e) => setFilterState((prev) => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">جميع الأولويات</option>
              {priorities.map((p) => (
                <option key={p} value={p}>
                  أولوية {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filter Row: Category, Responsible & Quick Flags */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <select
              value={filterState.category}
              onChange={(e) => setFilterState((prev) => ({ ...prev, category: e.target.value }))}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
            >
              <option value="all">كل الفئات</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Responsible Dropdown */}
            <select
              value={filterState.responsible}
              onChange={(e) => setFilterState((prev) => ({ ...prev, responsible: e.target.value }))}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
            >
              <option value="all">كل المسؤولين</option>
              {responsibles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Quick Flag: Late & Postponed */}
            <button
              onClick={() =>
                setFilterState((prev) => ({
                  ...prev,
                  onlyLateOrPostponed: !prev.onlyLateOrPostponed,
                }))
              }
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                filterState.onlyLateOrPostponed
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
              }`}
            >
              المتأخر والمؤجل فقط ({kpis.lateCount + kpis.postponedCount})
            </button>

            {/* Quick Flag: Corrupted References */}
            {kpis.corruptedCount > 0 && (
              <button
                onClick={() =>
                  setFilterState((prev) => ({
                    ...prev,
                    onlyCorrupted: !prev.onlyCorrupted,
                  }))
                }
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                  filterState.onlyCorrupted
                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                }`}
              >
                مراجع تالفة ({kpis.corruptedCount})
              </button>
            )}
          </div>

          {/* Results Count & Clear Button */}
          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-slate-400 font-bold">
              عرض <strong className="text-slate-900 dark:text-slate-100 font-mono">{filteredRecords.length}</strong> من أصل{' '}
              <strong className="text-slate-900 dark:text-slate-100 font-mono">{records.length}</strong> سجل
            </span>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-teal-600 dark:text-teal-400 hover:underline text-xs font-black cursor-pointer"
              >
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Main Records Table */}
      <CustodyIssuesTable
        records={filteredRecords}
        activeSectionTab={filterState.section}
        onSelectSectionTab={(sec) => setFilterState((prev) => ({ ...prev, section: sec }))}
        custodyCount={kpis.custodyCount}
        issuesCount={kpis.issuesCount}
        totalCount={kpis.total}
        onEditRecord={handleOpenEditModal}
        onDeleteRecord={handleDeleteRecord}
        onCloneRecord={handleCloneRecord}
        onChangeStatus={handleChangeStatus}
        onSortByDate={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
        sortOrder={sortOrder}
      />

      {/* 5. Bottom Utilities: Backup, JSON Export/Import, and Restore */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs font-bold">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Layers className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span>إدارة وحفظ بيانات الدفتر (محلي وتلقائي 100% دون خادم)</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* JSON Export */}
          <button
            onClick={() => exportCustodyToJSON(records)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير نسخة JSON</span>
          </button>

          {/* JSON Import */}
          <label className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>استيراد JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>

          {/* Restore Original 40 records */}
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-[#EF4444] dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة بيانات Excel الأصلية</span>
          </button>
        </div>
      </div>

      {/* 6. Modal: Add / Edit Record */}
      <CustodyIssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecord}
        initialRecord={editingRecord}
        defaultSection={defaultModalSection}
        categories={categories}
        responsibles={responsibles}
        statuses={statuses}
        priorities={priorities}
      />

      {/* 7. Modal: Delete Confirmation */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-3 text-[#EF4444] dark:text-rose-400">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">تأكيد حذف السجل</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              هل أنت متأكد من رغبتك في حذف هذا السجل بشكل نهائي؟ لا يمكن التراجع عن هذه العملية بعد إتمامها.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDeleteRecord}
                className="px-4 py-2 text-xs font-black bg-[#EF4444] hover:bg-rose-700 text-white rounded-lg shadow-md transition cursor-pointer"
              >
                نعم، احذف السجل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal: Reset Confirm */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <RotateCcw className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">استعادة بيانات Excel الأصلية</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              سيتم استبدال السجلات الحالية بالبيانات الـ 40 الأساسية المنظفة المستوردة من ملف Excel الأصلي. هل تريد الاستمرار؟
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleResetToDefault}
                className="px-4 py-2 text-xs font-black bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md transition cursor-pointer"
              >
                استعادة الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Universal Data Exchange Modal for Custody & Issues */}
      <UniversalDataExchangeModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        moduleTitle="العهد والإشكاليات والحسابات المعلقة"
        itemTypeName="سجلات العهد والإشكاليات"
        icon={ShieldCheck}
        themeColor="teal"
        supportedColumnsText="المعرف، القسم (عهد/إشكاليات)، التاريخ، الاسم/الجهة، الوصف، الفئة، الأولوية، الحالة، المسؤول، والمبلغ"
        onDownloadTemplate={downloadCustodyExcelTemplate}
        onImportFile={handleImportFile}
        onExportExcel={() => exportCustodyToExcel(records)}
        excelSubtitle="ملف إكسل كامل بسجلات العهد والإشكاليات مع ورقة عمل عربية منسقة"
        onExportJSON={() => exportCustodyToJSON(records)}
        jsonSubtitle="تصدير نسخة احتياطية بصيغة JSON شاملة لكافة الحقول"
      />
    </div>
  );
};
