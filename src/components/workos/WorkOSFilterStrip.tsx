import React, { useState } from 'react';
import {
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookmarkCheck,
  Check,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { WorkProject, TeamMember } from '../../types/workos';

export interface FilterState {
  projectId?: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
  dueDateRange?: string;
  progressRange?: string;
  overdueOnly?: boolean;
  showCompleted?: boolean;
}

export interface WorkOSFilterStripProps {
  projects?: WorkProject[];
  team?: TeamMember[];
  selectedProjectId?: string;
  onSelectProjectId?: (id: string) => void;
  selectedAssigneeId?: string;
  onSelectAssigneeId?: (id: string) => void;
  selectedStatus?: string;
  onSelectStatus?: (status: string) => void;
  selectedPriority?: string;
  onSelectPriority?: (priority: string) => void;
  dueDateFrom?: string;
  onDueDateFromChange?: (date: string) => void;
  dueDateTo?: string;
  onDueDateToChange?: (date: string) => void;
  minProgress?: number;
  onMinProgressChange?: (val: number) => void;
  overdueOnly?: boolean;
  onToggleOverdueOnly?: () => void;
  completedOnly?: boolean;
  onToggleCompletedOnly?: () => void;
  onClearFilters?: () => void;
  totalResults?: number;
  onExportExcel?: () => void;
  onExportPDF?: () => void;

  // Legacy compatibility props
  filters?: FilterState;
  onFilterChange?: (newFilters: FilterState) => void;
  onResetFilters?: () => void;
}

export const WorkOSFilterStrip: React.FC<WorkOSFilterStripProps> = ({
  projects = [],
  team = [],
  selectedProjectId = 'all',
  onSelectProjectId,
  selectedAssigneeId = 'all',
  onSelectAssigneeId,
  selectedStatus = 'all',
  onSelectStatus,
  selectedPriority = 'all',
  onSelectPriority,
  dueDateFrom = '',
  onDueDateFromChange,
  dueDateTo = '',
  onDueDateToChange,
  minProgress = 0,
  onMinProgressChange,
  overdueOnly = false,
  onToggleOverdueOnly,
  completedOnly = false,
  onToggleCompletedOnly,
  onClearFilters,
  totalResults,
  onExportExcel,
  onExportPDF,
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterSavedToast, setFilterSavedToast] = useState(false);

  // Normalize between direct props and optional `filters` object
  const curProjectId = filters?.projectId ?? selectedProjectId;
  const curAssigneeId = filters?.assigneeId ?? selectedAssigneeId;
  const curStatus = filters?.status ?? selectedStatus;
  const curPriority = filters?.priority ?? selectedPriority;
  const curOverdueOnly = filters?.overdueOnly ?? overdueOnly;
  const curCompletedOnly = completedOnly;

  const activeFiltersCount =
    (curProjectId !== 'all' ? 1 : 0) +
    (curAssigneeId !== 'all' ? 1 : 0) +
    (curStatus !== 'all' ? 1 : 0) +
    (curPriority !== 'all' ? 1 : 0) +
    (dueDateFrom ? 1 : 0) +
    (dueDateTo ? 1 : 0) +
    (minProgress > 0 ? 1 : 0) +
    (curOverdueOnly ? 1 : 0) +
    (curCompletedOnly ? 1 : 0);

  const handleReset = () => {
    if (onClearFilters) {
      onClearFilters();
    }
    if (onResetFilters) {
      onResetFilters();
    }
  };

  const handleSaveFilter = () => {
    try {
      const savedConfig = {
        projectId: curProjectId,
        assigneeId: curAssigneeId,
        status: curStatus,
        priority: curPriority,
        dueDateFrom,
        dueDateTo,
        minProgress,
        overdueOnly: curOverdueOnly,
      };
      localStorage.setItem('workos_saved_filters', JSON.stringify(savedConfig));
      setFilterSavedToast(true);
      setTimeout(() => setFilterSavedToast(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden" dir="rtl">
      {/* Header of Filter Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">تصفية وبحث متقدم</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 text-xs font-mono font-bold">
              {activeFiltersCount} فلتر نشط
            </span>
          )}
          {typeof totalResults === 'number' && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              ({totalResults} عنصر)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              title="تصدير جدول المهام إلى إكسل"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">إكسل</span>
            </button>
          )}

          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              title="طباعة أو تصدير PDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          )}

          {activeFiltersCount > 0 && (
            <button
              onClick={handleReset}
              className="px-2.5 py-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              title="مسح كافة الفلاتر"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>مسح الفلاتر</span>
            </button>
          )}

          <button
            onClick={handleSaveFilter}
            className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            title="حفظ الفلتر الحالي كافتراضي"
          >
            {filterSavedToast ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300">تم الحفظ!</span>
              </>
            ) : (
              <>
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">حفظ الفلتر</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition"
            title={isCollapsed ? 'توسيع الفلاتر' : 'طي الفلاتر'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick Presets Row */}
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 shrink-0">طرق عرض سريعة:</span>
        <button
          type="button"
          onClick={() => {
            if (!curOverdueOnly && onToggleOverdueOnly) {
              onToggleOverdueOnly();
            }
          }}
          className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer border ${
            curOverdueOnly
              ? 'bg-rose-100 text-rose-800 border-rose-300'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          المهام المتأخرة
        </button>
        <button
          type="button"
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            onDueDateFromChange?.(today);
            onDueDateToChange?.(today);
          }}
          className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer border ${
            dueDateFrom && dueDateFrom === dueDateTo
              ? 'bg-sky-100 text-sky-800 border-sky-300'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          مهام اليوم
        </button>
        <button
          type="button"
          onClick={() => onSelectPriority?.('urgent')}
          className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer border ${
            curPriority === 'urgent'
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          المهام العاجلة
        </button>
        <button
          type="button"
          onClick={() => onSelectStatus?.('in_progress')}
          className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer border ${
            curStatus === 'in_progress'
              ? 'bg-blue-100 text-blue-800 border-blue-300'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          قيد التنفيذ
        </button>
        <button
          type="button"
          onClick={() => onToggleCompletedOnly?.()}
          className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer border ${
            curCompletedOnly
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          المهام المكتملة
        </button>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="px-2 py-1 rounded-lg font-bold text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer mr-auto"
          >
            مسح الفلاتر
          </button>
        )}
      </div>

      {/* Filter Options (Collapsible Body) */}
      {!isCollapsed && (
        <div className="p-3.5 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
            {/* 1. Project */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">المشروع:</label>
              <select
                value={curProjectId}
                onChange={(e) => {
                  const val = e.target.value;
                  onSelectProjectId?.(val);
                  if (filters && onFilterChange) {
                    onFilterChange({ ...filters, projectId: val });
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">كل المشاريع</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Assignee */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">المسؤول:</label>
              <select
                value={curAssigneeId}
                onChange={(e) => {
                  const val = e.target.value;
                  onSelectAssigneeId?.(val);
                  if (filters && onFilterChange) {
                    onFilterChange({ ...filters, assigneeId: val });
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">كل المسؤولين</option>
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Status */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">الحالة:</label>
              <select
                value={curStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  onSelectStatus?.(val);
                  if (filters && onFilterChange) {
                    onFilterChange({ ...filters, status: val });
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">كل الحالات</option>
                <option value="planned">مخطط</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="review">قيد المراجعة</option>
                <option value="completed">مكتملة</option>
                <option value="delayed">متأخرة</option>
                <option value="blocked">معلقة / محظورة</option>
              </select>
            </div>

            {/* 4. Priority */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">الأولوية:</label>
              <select
                value={curPriority}
                onChange={(e) => {
                  const val = e.target.value;
                  onSelectPriority?.(val);
                  if (filters && onFilterChange) {
                    onFilterChange({ ...filters, priority: val });
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">كل الأولويات</option>
                <option value="urgent">عاجلة وحرجة</option>
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>
            </div>

            {/* 5. Due Date From & To */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">تاريخ الاستحقاق (من):</label>
              <input
                type="date"
                value={dueDateFrom}
                onChange={(e) => onDueDateFromChange?.(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">تاريخ الاستحقاق (إلى):</label>
              <input
                type="date"
                value={dueDateTo}
                onChange={(e) => onDueDateToChange?.(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
              />
            </div>
          </div>

          {/* Progress & Quick Checkbox Toggles */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">الحد الأدنى للإنجاز:</label>
              <input
                type="range"
                min={0}
                max={100}
                step={10}
                value={minProgress}
                onChange={(e) => onMinProgressChange?.(Number(e.target.value))}
                className="w-24 accent-teal-600 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-teal-800 dark:text-teal-200">{minProgress}%</span>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={curOverdueOnly}
                  onChange={() => {
                    onToggleOverdueOnly?.();
                    if (filters && onFilterChange) {
                      onFilterChange({ ...filters, overdueOnly: !filters.overdueOnly });
                    }
                  }}
                  className="rounded text-rose-600 dark:text-rose-400 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <span className={curOverdueOnly ? 'text-rose-700 font-extrabold' : ''}>المهام المتأخرة فقط</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={curCompletedOnly}
                  onChange={() => onToggleCompletedOnly?.()}
                  className="rounded text-teal-600 dark:text-teal-400 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                />
                <span className={curCompletedOnly ? 'text-teal-700 font-extrabold' : ''}>المهام المكتملة فقط</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
