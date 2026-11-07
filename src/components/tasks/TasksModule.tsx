import React, { useState, useMemo } from 'react';
import {
  Commitment,
  Task,
  TaskAuditLog,
  TaskFilterState,
  TaskPriority,
  TaskStatus,
} from '../../types';
import { calculateTaskStats, filterTasks, getUpcomingTasks } from '../../utils/tasks';
import { exportTasksToCSV, exportTasksToExcel } from '../../utils/excel';
import { formatArabicDate, formatCurrency } from '../../utils/formatters';
import { TaskModal } from './TaskModal';
import { CommitmentModal } from './CommitmentModal';
import { CalendarView } from './CalendarView';
import { CommitmentsTable } from './CommitmentsTable';
import { UniversalDataExchangeModal } from '../common/UniversalDataExchangeModal';
import { downloadDailyTasksExcelTemplate } from '../../utils/universalDataTemplates';
import { parseDailyTasksExcelFile } from '../../utils/universalImporters';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Printer,
  Calendar as CalendarIcon,
  DollarSign,
  History,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Edit2,
  Check,
  Tag,
  User,
  Activity,
  BarChart3,
  ListTodo,
  TrendingUp,
} from 'lucide-react';

interface Props {
  tasks: Task[];
  commitments: Commitment[];
  categories: string[];
  operations: string[];
  assignees: string[];
  auditLogs: TaskAuditLog[];
  onSaveTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleCompleteTask: (task: Task) => void;
  onSaveCommitment: (commitment: Commitment) => void;
  onDeleteCommitment: (id: string) => void;
  onToggleCompleteCommitment: (commitment: Commitment) => void;
  onClearCompletedTasks: () => void;
  onClearAuditLogs: () => void;
}

export const TasksModule: React.FC<Props> = ({
  tasks,
  commitments,
  categories,
  operations,
  assignees,
  auditLogs,
  onSaveTask,
  onDeleteTask,
  onToggleCompleteTask,
  onSaveCommitment,
  onDeleteCommitment,
  onToggleCompleteCommitment,
  onClearCompletedTasks,
  onClearAuditLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'commitments' | 'calendar' | 'audit'>('dashboard');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskModalInitialDate, setTaskModalInitialDate] = useState<string | undefined>(undefined);
  const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [commitmentModalInitialDate, setCommitmentModalInitialDate] = useState<string | undefined>(undefined);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleImportFile = async (file: File) => {
    const result = await parseDailyTasksExcelFile(file);
    if (result.count === 0) {
      return { success: false, message: 'الملف لا يحتوي على مهام صالحة.' };
    }

    result.tasks.forEach((t) => onSaveTask(t));

    return {
      success: true,
      message: `تم استيراد ${result.tasks.length} مهمة بنجاح!`,
    };
  };

  const handleExportJSON = () => {
    const data = {
      tasks,
      commitments,
      auditLogs,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `نسخة_احتياطية_المهام_والالتزامات_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Filters State
  const [filters, setFilters] = useState<TaskFilterState>({
    search: '',
    cat: '',
    op: '',
    pri: '',
    status: '',
    resp: '',
    startDate: '',
    endDate: '',
    overdueOnly: false,
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const stats = useMemo(() => calculateTaskStats(tasks, commitments), [tasks, commitments]);
  const upcomingTasks = useMemo(() => getUpcomingTasks(tasks, 8, todayStr), [tasks, todayStr]);

  const filteredTasks = useMemo(() => {
    return filterTasks(tasks, filters, todayStr);
  }, [tasks, filters, todayStr]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      cat: '',
      op: '',
      pri: '',
      status: '',
      resp: '',
      startDate: '',
      endDate: '',
      overdueOnly: false,
    });
  };

  const handleOpenAdd = (dateStr?: string) => {
    setEditingTask(null);
    setTaskModalInitialDate(typeof dateStr === 'string' ? dateStr : undefined);
    setIsTaskModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTaskModalInitialDate(task.start);
    setIsTaskModalOpen(true);
  };

  const handleExportExcel = () => {
    exportTasksToExcel(tasks, commitments, auditLogs);
  };

  const handleExportCSV = () => {
    exportTasksToCSV(filteredTasks);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner Header */}
      <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-5 md:p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-xs">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">ادارة المهام</h1>
              <span className="text-xs bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-black px-2.5 py-0.5 rounded-full border border-teal-200/50 dark:border-teal-800/50">
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              منظومة المتابعة اليومية للأعمال، الالتزامات المالية، التذكيرات، وتقويم الإنجاز
            </p>
          </div>
        </div>

        {/* Top Action Bar */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={handlePrint}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-700 cursor-pointer"
            title="طباعة تقرير الصفحة"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer"
            title="استيراد وتصدير مهام والتزامات Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>استيراد إكسل</span>
          </button>
          <button
            id="export-tasks-excel-btn"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-200/80 dark:border-slate-700 cursor-pointer"
            title="تصدير ملف إكسل بـ 3 أوراق (المهام، الالتزامات، وسجل التعديلات)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>تصدير إكسل</span>
          </button>
          <button
            id="add-task-header-btn"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مهمة جديدة</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-colors shrink-0 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>لوحة المتابعة والإحصائيات</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-colors shrink-0 cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>قائمة المهام والأعمال ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('commitments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-colors shrink-0 cursor-pointer ${
            activeTab === 'commitments'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4 text-amber-500" />
          <span>الالتزامات المالية ({commitments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-colors shrink-0 cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>التقويم التفاعلي (3 عروض)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-colors shrink-0 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل التعديلات (Audit Log)</span>
        </button>
      </div>

      {/* 1. DASHBOARD & STATS VIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* FR-20: 8 Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {/* Today */}
            <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">مهام اليوم</span>
              <span className="text-2xl font-black font-mono text-teal-600 dark:text-teal-400">{stats.today}</span>
            </div>

            {/* This Week */}
            <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">هذا الأسبوع</span>
              <span className="text-2xl font-black font-mono text-slate-800 dark:text-slate-200">{stats.thisWeek}</span>
            </div>

            {/* This Month */}
            <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">هذا الشهر</span>
              <span className="text-2xl font-black font-mono text-slate-800 dark:text-slate-200">{stats.thisMonth}</span>
            </div>

            {/* Overdue */}
            <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-3.5 rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs text-center">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block mb-1">متأخرة</span>
              <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">{stats.overdue}</span>
            </div>

            {/* Completed */}
            <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-1">مكتملة</span>
              <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{stats.completed}</span>
            </div>

            {/* In Progress */}
            <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mb-1">قيد التنفيذ</span>
              <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">{stats.inProgress}</span>
            </div>

            {/* Total Tasks */}
            <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">إجمالي المهام</span>
              <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">{stats.total}</span>
            </div>

            {/* Total Commitments */}
            <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs text-center">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block mb-1">الالتزامات</span>
              <span className="text-lg font-black font-mono text-amber-700 dark:text-amber-300 truncate block" title={String(stats.outstandingCommitmentsAmount)}>
                {formatCurrency(stats.outstandingCommitmentsAmount)}
              </span>
            </div>
          </div>

          {/* Charts & Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Distribution Bars */}
            <div className="lg:col-span-2 bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">توزيع المهام حسب الفئات (18 فئة)</h3>
                <span className="text-xs text-slate-400 dark:text-slate-500">نسبة الإنجاز العامة: {stats.completionRate}%</span>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {stats.categoryDistribution.map((c) => {
                  const pct = Math.round((c.count / (stats.total || 1)) * 100);
                  return (
                    <div key={c.cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>{c.cat}</span>
                        <span className="font-mono">{c.count} مهمة ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-600 dark:bg-teal-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FR-22: Upcoming 8 Tasks */}
            <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">أقرب المهام المستحقة</h3>
                <span className="text-xs text-teal-600 dark:text-teal-400 font-bold">8 مهام</span>
              </div>

              <div className="space-y-3">
                {upcomingTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">لا توجد مهام مستحقة قادمة</p>
                ) : (
                  upcomingTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleOpenEdit(t)}
                      className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{t.title}</span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                            t.pri === 'A' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300' : 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
                          }`}
                        >
                          {t.pri}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>المسؤول: {t.resp}</span>
                        <span className="font-mono text-teal-600 dark:text-teal-400">{t.end || t.start}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TASKS LIST VIEW */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-3" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="بحث بالعنوان، المعرف، المسؤول، الوصف..."
                  className="w-full pl-3 pr-9 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={filters.cat}
                  onChange={(e) => setFilters({ ...filters, cat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-900"
                >
                  <option value="">جميع الفئات</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <select
                  value={filters.pri}
                  onChange={(e) => setFilters({ ...filters, pri: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-900"
                >
                  <option value="">جميع الأولويات</option>
                  <option value="A">أولوية A (حرجة)</option>
                  <option value="B">أولوية B (عالية)</option>
                  <option value="C">أولوية C (متوسطة)</option>
                  <option value="D">أولوية D (منخفضة)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-900"
                >
                  <option value="">جميع الحالات</option>
                  <option value="مخطط">مخطط</option>
                  <option value="قيد التنفيذ">قيد التنفيذ</option>
                  <option value="تم الانجاز">تم الانجاز</option>
                  <option value="متأخر">متأخر</option>
                  <option value="مؤجل">مؤجل</option>
                  <option value="ملغي">ملغي</option>
                </select>
              </div>

              {/* Assignee Filter */}
              <div>
                <select
                  value={filters.resp}
                  onChange={(e) => setFilters({ ...filters, resp: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-900"
                >
                  <option value="">جميع المسؤولين</option>
                  {assignees.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Actions & Reset */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.overdueOnly}
                    onChange={(e) => setFilters({ ...filters, overdueOnly: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-600 text-rose-600 dark:text-rose-400 focus:ring-rose-500"
                  />
                  <span>عرض المهام المتأخرة فقط</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير CSV</span>
                </button>
                <button
                  onClick={onClearCompletedTasks}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="تنظيف وحذف المهام المكتملة دفعة واحدة"
                >
                  تنظيف المكتملة
                </button>
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة تعيين</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto max-h-[calc(100vh-270px)] min-h-[380px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-right text-xs border-collapse min-w-[960px] print:min-w-0">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700 shadow-2xs select-none">
                    <th className="py-2.5 px-3 w-12 text-center sticky right-0 z-30 bg-slate-100/95 dark:bg-slate-800/95 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)]">إنجاز</th>
                    <th className="py-2.5 px-2.5 w-20">المعرف</th>
                    <th className="py-2.5 px-3 min-w-[200px]">عنوان المهمة</th>
                    <th className="py-2.5 px-2.5 w-24">الفئة</th>
                    <th className="py-2.5 px-2.5 w-24">العملية</th>
                    <th className="py-2.5 px-2 w-14 text-center">الأولوية</th>
                    <th className="py-2.5 px-2.5 w-24">التاريخ</th>
                    <th className="py-2.5 px-2.5 w-24">المسؤول</th>
                    <th className="py-2.5 px-2.5 w-24 text-center">الحالة</th>
                    <th className="py-2.5 px-3 text-center sticky left-0 z-30 bg-slate-100/95 dark:bg-slate-800/95 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)] w-24">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        لا توجد مهام مطابقة للفلاتر المحددة.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((t) => {
                      const isCompleted = t.status === 'تم الانجاز';
                      return (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-[12px] group">
                          <td className="py-2 px-3 text-center sticky right-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                            <button
                              onClick={() => onToggleCompleteTask(t)}
                              className={`p-1 rounded transition-colors cursor-pointer ${
                                isCompleted
                                  ? 'bg-emerald-600 text-white'
                                  : 'border border-slate-300 text-slate-300 hover:border-emerald-500 hover:text-emerald-500'
                              }`}
                              title={isCompleted ? 'مكتملة (انقر لإعادة الفتح)' : 'انقر لتعيين تم الإنجاز'}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </td>
                          <td className="py-2 px-2.5 font-mono font-bold text-xs text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                            {t.id}
                            {t.sub && <span className="block text-xs text-slate-400 dark:text-slate-500 font-sans">{t.sub}</span>}
                          </td>
                          <td className={`py-2 px-3 font-bold text-slate-900 dark:text-slate-100 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                            <div className="truncate max-w-sm">{t.title}</div>
                            {t.desc && <p className="text-xs text-slate-400 dark:text-slate-500 font-normal truncate max-w-sm">{t.desc}</p>}
                          </td>
                          <td className="py-2 px-2.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700">
                              {t.cat}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-xs text-slate-600 dark:text-slate-300">
                            {t.op}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${
                                t.pri === 'A'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : t.pri === 'B'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {t.pri}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-xs text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">
                            {t.start}
                          </td>
                          <td className="py-2 px-2.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                            {t.resp}
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                                isCompleted
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : t.status === 'متأخر'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(t)}
                                title="تعديل المهمة"
                                className="p-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`هل تريد حذف المهمة ${t.title}؟`)) {
                                    onDeleteTask(t.id);
                                  }
                                }}
                                title="حذف المهمة"
                                className="p-1 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
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
          </div>
        </div>
      )}

      {/* 3. COMMITMENTS VIEW */}
      {activeTab === 'commitments' && (
        <CommitmentsTable
          commitments={commitments}
          onSaveCommitment={onSaveCommitment}
          onDeleteCommitment={onDeleteCommitment}
          onToggleComplete={onToggleCompleteCommitment}
        />
      )}

      {/* 4. CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <CalendarView
          tasks={tasks}
          commitments={commitments}
          onToggleComplete={onToggleCompleteTask}
          onEditTask={handleOpenEdit}
          onToggleCompleteCommitment={onToggleCompleteCommitment}
          onEditCommitment={(c) => {
            setEditingCommitment(c);
            setCommitmentModalInitialDate(c.due);
            setIsCommitmentModalOpen(true);
          }}
          onAddTaskForDate={(dateStr) => {
            setEditingTask(null);
            setTaskModalInitialDate(dateStr);
            setIsTaskModalOpen(true);
          }}
          onAddCommitmentForDate={(dateStr) => {
            setEditingCommitment(null);
            setCommitmentModalInitialDate(dateStr);
            setIsCommitmentModalOpen(true);
          }}
        />
      )}

      {/* 5. AUDIT LOG VIEW */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">سجل تدقيق وتعديلات المهام (Audit Log)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تسجيل تلقائي لجميع عمليات الإضافة، التعديل، الحذف، والإنجاز مع التوقيت الدقيق
              </p>
            </div>
            <button
              onClick={onClearAuditLogs}
              className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 font-bold px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              تفريغ السجل
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-12">لا توجد سجلات مسجلة.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{log.action}: {log.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold">
                        {log.entity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{log.details}</p>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono shrink-0">{log.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={onSaveTask}
        editingTask={editingTask}
        existingTasks={tasks}
        categories={categories}
        operations={operations}
        assignees={assignees}
        initialDate={taskModalInitialDate}
      />

      {/* Commitment Modal */}
      <CommitmentModal
        isOpen={isCommitmentModalOpen}
        onClose={() => setIsCommitmentModalOpen(false)}
        onSave={(c) => {
          onSaveCommitment(c);
          setIsCommitmentModalOpen(false);
        }}
        editingCommitment={editingCommitment}
        existingCommitments={commitments}
        initialDate={commitmentModalInitialDate}
      />

      {/* Universal Data Exchange Modal for Tasks */}
      <UniversalDataExchangeModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        moduleTitle="المهام والالتزامات"
        itemTypeName="المهام ومتابعة الأعمال"
        icon={CheckSquare}
        themeColor="teal"
        supportedColumnsText="عنوان المهمة، الوصف، الفئة، العملية / القسم، الأولوية (A/B/C)، الحالة، تاريخ البدء، تاريخ الاستحقاق، المسؤول، النسبة"
        onDownloadTemplate={downloadDailyTasksExcelTemplate}
        onImportFile={handleImportFile}
        onExportExcel={handleExportExcel}
        excelSubtitle="ملف إكسل كامل بـ 3 أوراق (المهام، الالتزامات المالية، وسجل التدقيق)"
        onExportJSON={handleExportJSON}
        jsonSubtitle="نسخة احتياطية شاملة لكافة المهام والالتزامات المالية"
      />
    </div>
  );
};
