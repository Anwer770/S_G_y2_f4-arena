import React, { useState, useMemo } from 'react';
import {
  WorkTask,
  WorkProject,
  TeamMember,
  ActiveTimerState,
  TaskStatus,
  TaskPriority,
} from '../../types/workos';
import { TaskAuditLog, Task } from '../../types';
import { WorkOSEisenhowerMatrix } from './WorkOSEisenhowerMatrix';
import { UniversalDataExchangeModal } from '../common/UniversalDataExchangeModal';
import { formatCurrency } from '../../utils/formatters';
import { exportTasksToExcel, exportTasksToCSV } from '../../utils/excel';
import { downloadDailyTasksExcelTemplate } from '../../utils/universalDataTemplates';
import { parseDailyTasksExcelFile } from '../../utils/universalImporters';
import {
  AlertCircle,
  AlertTriangle,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  CheckSquare,
  Clock,
  DollarSign,
  Download,
  Edit,
  Edit2,
  ExternalLink,
  FileSpreadsheet,
  Filter,
  Flame,
  FolderKanban,
  GitCommit,
  History,
  Kanban as KanbanIcon,
  Layers,
  LayoutGrid,
  ListFilter,
  ListTodo,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Table as TableIcon,
  Tag,
  Trash2,
  Upload,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';

export type TaskUnifiedViewMode =
  | 'table'
  | 'kanban'
  | 'matrix'
  | 'gantt'
  | 'calendar'
  | 'audit'
  | 'list';

export interface WorkOSTasksViewProps {
  tasks: WorkTask[];
  projects: WorkProject[];
  team: TeamMember[];
  activeTimer: ActiveTimerState | null;
  onStartTimer: (task: WorkTask) => void;
  onOpenTaskDetail: (task: WorkTask) => void;
  onOpenQuickAdd: (type?: string, projectId?: string, priority?: TaskPriority) => void;
  onUpdateTaskStatus: (id: string, status: TaskStatus) => void;
  onUpdateTaskPriority?: (id: string, priority: TaskPriority) => void;
  onDeleteTask: (id: string) => void;
  selectedProjectId?: string;
  onNavigateToProjects?: () => void;
  // Merged Classic Ledger Props:
  auditLogs?: TaskAuditLog[];
  onClearAuditLogs?: () => void;
  onClearCompletedTasks?: () => void;
  onSaveTaskClassic?: (task: Task) => void;
  categories?: string[];
  operations?: string[];
}

export const WorkOSTasksView: React.FC<WorkOSTasksViewProps> = ({
  tasks = [],
  projects = [],
  team = [],
  activeTimer,
  onStartTimer,
  onOpenTaskDetail,
  onOpenQuickAdd,
  onUpdateTaskStatus,
  onUpdateTaskPriority = () => {},
  onDeleteTask,
  selectedProjectId,
  onNavigateToProjects = () => {},
  auditLogs = [],
  onClearAuditLogs = () => {},
  onClearCompletedTasks,
  onSaveTaskClassic,
  categories = [],
  operations = [],
}) => {
  // Navigation & View Modes
  const [viewMode, setViewMode] = useState<TaskUnifiedViewMode>('table');

  // Filtering & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>(selectedProjectId || 'all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Bulk Selection
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Sync external project filter if changed
  React.useEffect(() => {
    if (selectedProjectId) {
      setProjectFilter(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Unified Statistics
  const stats = useMemo(() => {
    let todayCount = 0;
    let overdueCount = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let urgentCount = 0;

    tasks.forEach((t) => {
      const isCompleted = t.status === 'completed';
      const isOverdue = t.dueDate && t.dueDate < todayStr && !isCompleted;
      const isToday = t.dueDate === todayStr;

      if (isToday) todayCount++;
      if (isOverdue) overdueCount++;
      if (isCompleted) completedCount++;
      if (t.status === 'in_progress') inProgressCount++;
      if (t.priority === 'urgent') urgentCount++;
    });

    const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    return {
      total: tasks.length,
      today: todayCount,
      overdue: overdueCount,
      completed: completedCount,
      inProgress: inProgressCount,
      urgent: urgentCount,
      completionRate,
    };
  }, [tasks, todayStr]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (projectFilter !== 'all' && t.projectId !== projectFilter) return false;
      if (assigneeFilter !== 'all' && t.assigneeId !== assigneeFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (overdueOnly) {
        if (t.status === 'completed' || !t.dueDate || t.dueDate >= todayStr) return false;
      }
      if (search) {
        const q = search.toLowerCase().trim();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchNum = t.taskNumber.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchCust = t.customerRef?.toLowerCase().includes(q);
        const matchCat = t.category?.toLowerCase().includes(q);
        if (!matchTitle && !matchNum && !matchDesc && !matchCust && !matchCat) return false;
      }
      return true;
    });
  }, [
    tasks,
    statusFilter,
    priorityFilter,
    projectFilter,
    assigneeFilter,
    categoryFilter,
    overdueOnly,
    search,
    todayStr,
  ]);

  // Status Badges
  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>مكتملة</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
            <span>قيد التنفيذ</span>
          </span>
        );
      case 'ready':
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
            جاهزة
          </span>
        );
      case 'planned':
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            مخطط لها
          </span>
        );
      case 'review':
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            تحتاج مراجعة
          </span>
        );
      case 'blocked':
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>متوقفة</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Priority Badges
  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-600" />
            <span>عاجل جداً (Q1)</span>
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            أولوية عالية (Q2)
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            متوسطة (Q3)
          </span>
        );
      case 'low':
      case 'none':
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            منخفضة (Q4)
          </span>
        );
      default:
        return null;
    }
  };

  // Bulk handlers
  const handleToggleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map((t) => t.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkComplete = () => {
    selectedTaskIds.forEach((id) => onUpdateTaskStatus(id, 'completed'));
    setSelectedTaskIds([]);
  };

  const handleBulkInProgress = () => {
    selectedTaskIds.forEach((id) => onUpdateTaskStatus(id, 'in_progress'));
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف ${selectedTaskIds.length} مهام محددة؟`)) {
      selectedTaskIds.forEach((id) => onDeleteTask(id));
      setSelectedTaskIds([]);
    }
  };

  // Excel & Data Export/Import Handlers
  const handleExportExcel = () => {
    const mappedTasks: Task[] = tasks.map((t) => ({
      id: t.taskNumber || t.id,
      title: t.title,
      desc: t.description || '',
      cat: t.category || 'عام',
      op: (t.tags && t.tags[0]) || 'تنفيذ',
      pri: t.priority === 'urgent' ? 'A' : t.priority === 'high' ? 'B' : t.priority === 'medium' ? 'C' : 'D',
      status:
        t.status === 'completed'
          ? 'تم الانجاز'
          : t.status === 'in_progress'
          ? 'قيد التنفيذ'
          : t.status === 'blocked'
          ? 'مؤجل'
          : 'مخطط',
      resp: team.find((m) => m.id === t.assigneeId)?.name || t.creator || 'غير محدد',
      start: t.startDate || t.dueDate || todayStr,
      end: t.dueDate,
      amount: undefined,
    }));

    exportTasksToExcel(mappedTasks, [], auditLogs);
  };

  const handleExportCSV = () => {
    const mappedFilteredTasks: Task[] = filteredTasks.map((t) => ({
      id: t.taskNumber || t.id,
      title: t.title,
      desc: t.description || '',
      cat: t.category || 'عام',
      op: (t.tags && t.tags[0]) || 'تنفيذ',
      pri: t.priority === 'urgent' ? 'A' : t.priority === 'high' ? 'B' : t.priority === 'medium' ? 'C' : 'D',
      status:
        t.status === 'completed'
          ? 'تم الانجاز'
          : t.status === 'in_progress'
          ? 'قيد التنفيذ'
          : t.status === 'blocked'
          ? 'مؤجل'
          : 'مخطط',
      resp: team.find((m) => m.id === t.assigneeId)?.name || t.creator || 'غير محدد',
      start: t.startDate || t.dueDate || todayStr,
      end: t.dueDate,
      amount: undefined,
    }));

    exportTasksToCSV(mappedFilteredTasks);
  };

  const handleImportFile = async (file: File) => {
    const result = await parseDailyTasksExcelFile(file);
    if (result.count === 0) {
      return { success: false, message: 'الملف لا يحتوي على مهام صالحة.' };
    }

    // Pass to parent classic handler if available, or convert to quick add
    if (onSaveTaskClassic) {
      result.tasks.forEach((t) => onSaveTaskClassic(t));
    }

    return {
      success: true,
      message: `تم استيراد ${result.tasks.length} مهمة بنجاح إلى سجل المهام!`,
    };
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* ============================================================= */}
      {/* 1. TOP HEADER & METRIC SUMMARY RIBBON                         */}
      {/* ============================================================= */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                منظومة المهام والمشاريع والمصفوفة الموحدة
              </h2>
              <span className="text-xs bg-teal-50 text-teal-800 font-black px-2.5 py-0.5 rounded-full border border-teal-200">
                Work OS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              الجدول التشغيلي، مصفوفة أيزنهاور للأولويات، لوحات كانبان، ومخطط غانت في بيئة واحدة متكاملة
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Print */}
          <button
            onClick={() => window.print()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition border border-slate-200 cursor-pointer"
            title="طباعة التقرير"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Universal Excel Import */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200 shadow-2xs cursor-pointer"
            title="استيراد وتصدير إكسل الشامل"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>استيراد إكسل</span>
          </button>

          {/* Excel Export */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200 cursor-pointer"
            title="تصدير ملف إكسل (المهام وسجل التعديلات)"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير إكسل</span>
          </button>

          {/* Add Task Primary */}
          <button
            onClick={() => onOpenQuickAdd('task', projectFilter !== 'all' ? projectFilter : undefined)}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>مهمة جديدة</span>
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 2. STATS KPI CARDS STRIP                                      */}
      {/* ============================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Today */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs text-center">
          <span className="text-xs font-bold text-slate-500 block mb-1">مهام اليوم</span>
          <span className="text-xl font-black font-mono text-slate-800">{stats.today}</span>
        </div>

        {/* In Progress */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs text-center">
          <span className="text-xs font-bold text-amber-600 block mb-1">قيد التنفيذ</span>
          <span className="text-xl font-black font-mono text-amber-600">{stats.inProgress}</span>
        </div>

        {/* Overdue */}
        <div
          className={`p-3.5 rounded-xl border shadow-2xs text-center ${
            stats.overdue > 0
              ? 'bg-rose-50/70 border-rose-300 text-rose-800'
              : 'bg-white border-slate-200/80 text-slate-800'
          }`}
        >
          <span className="text-xs font-bold block mb-1">متأخرة عن الموعد</span>
          <span className="text-xl font-black font-mono text-rose-700">{stats.overdue}</span>
        </div>

        {/* Completed & Rate */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs text-center">
          <span className="text-xs font-bold text-emerald-600 block mb-1">مكتملة ({stats.completionRate}%)</span>
          <span className="text-xl font-black font-mono text-emerald-600">{stats.completed}</span>
        </div>

        {/* Total Tasks */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs text-center">
          <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي المهام</span>
          <span className="text-xl font-black font-mono text-slate-900">{stats.total}</span>
        </div>

        {/* Urgent Tasks (Q1) */}
        <div
          onClick={() => setViewMode('matrix')}
          className={`p-3.5 rounded-xl border shadow-2xs text-center cursor-pointer transition ${
            stats.urgent > 0
              ? 'bg-rose-50/70 border-rose-300 text-rose-800 hover:bg-rose-100/70'
              : 'bg-white border-slate-200/80 text-slate-800 hover:bg-slate-50'
          }`}
          title="عرض المهام العاجلة والحرجة في مصفوفة أيزنهاور"
        >
          <span className="text-xs font-bold block mb-1">عاجلة وحرجة (Q1)</span>
          <span className="text-xl font-black font-mono text-rose-700">{stats.urgent}</span>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 3. UNIFIED VIEW SWITCHER BAR                                  */}
      {/* ============================================================= */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'table'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>جدول المهام</span>
          </button>

          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <KanbanIcon className="w-3.5 h-3.5" />
            <span>لوحة كانبان</span>
          </button>

          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>مصفوفة أيزنهاور (2x2)</span>
          </button>

          <button
            onClick={() => setViewMode('gantt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'gantt'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>مخطط غانت</span>
          </button>

          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>التقويم</span>
          </button>

          <button
            onClick={() => setViewMode('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'audit'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>سجل التدقيق ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'list'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>بطاقات سريعة</span>
          </button>
        </div>

        {/* Quick clear completed if provided */}
        {onClearCompletedTasks && (
          <button
            onClick={onClearCompletedTasks}
            className="text-xs text-slate-500 hover:text-rose-600 font-bold px-2 py-1 rounded transition cursor-pointer self-end md:self-auto"
            title="تنظيف المهام المكتملة"
          >
            تنظيف المكتملة
          </button>
        )}
      </div>

      {/* ============================================================= */}
      {/* 4. FILTER CONTROLS FOR TABLE, KANBAN, LIST, GANTT             */}
      {/* ============================================================= */}
      {(viewMode === 'table' || viewMode === 'kanban' || viewMode === 'list' || viewMode === 'gantt') && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث برقم المهمة، العنوان، الوصف، الفئة، أو العميل..."
                className="w-full pr-9 pl-4 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-teal-500 transition"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">كافة الحالات</option>
              <option value="planned">مخطط لها</option>
              <option value="ready">جاهزة للبدء</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="review">تحتاج مراجعة</option>
              <option value="completed">مكتملة</option>
              <option value="blocked">متوقفة</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">كافة الأولويات</option>
              <option value="urgent">🔴 عاجل جداً (Q1)</option>
              <option value="high">🔵 أولوية عالية (Q2)</option>
              <option value="medium">🟡 متوسطة (Q3)</option>
              <option value="low">⚪ منخفضة (Q4)</option>
            </select>

            {/* Project Filter */}
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">كافة المشاريع</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">كافة المسؤولين</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            {/* Overdue Only Toggle */}
            <label className="flex items-center gap-1.5 text-xs text-rose-700 font-bold cursor-pointer select-none bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="rounded text-rose-600 border-rose-300"
              />
              <span>المتأخرة فقط</span>
            </label>

            {/* Reset Filters */}
            {(search ||
              statusFilter !== 'all' ||
              priorityFilter !== 'all' ||
              projectFilter !== 'all' ||
              assigneeFilter !== 'all' ||
              overdueOnly) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setProjectFilter('all');
                  setAssigneeFilter('all');
                  setOverdueOnly(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                title="إعادة تعيين الفلاتر"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Bulk Selection Actions Bar */}
          {selectedTaskIds.length > 0 && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-2 flex items-center justify-between gap-3 text-xs">
              <span className="text-teal-900 font-bold">
                تم تحديد {selectedTaskIds.length} مهام
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkComplete}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer transition"
                >
                  تعيين كمكتملة
                </button>
                <button
                  onClick={handleBulkInProgress}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold cursor-pointer transition"
                >
                  قيد التنفيذ
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold cursor-pointer transition"
                >
                  حذف المحدد
                </button>
                <button
                  onClick={() => setSelectedTaskIds([])}
                  className="px-2 py-1 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* 5. VIEW MODES RENDERING                                       */}
      {/* ============================================================= */}

      {/* 5.1 TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 select-none">
                  <th className="py-2.5 px-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredTasks.length > 0 &&
                        selectedTaskIds.length === filteredTasks.length
                      }
                      onChange={handleToggleSelectAll}
                      className="rounded text-teal-600 border-slate-300"
                    />
                  </th>
                  <th className="py-2.5 px-2.5 w-24">رقم المهمة</th>
                  <th className="py-2.5 px-3 min-w-[240px]">عنوان المهمة / الإجراء</th>
                  <th className="py-2.5 px-2.5 w-28 text-center">الحالة</th>
                  <th className="py-2.5 px-2.5 w-32 text-center">الأولوية (أيزنهاور)</th>
                  <th className="py-2.5 px-2.5 w-36">المشروع</th>
                  <th className="py-2.5 px-2.5 w-32">المسؤول</th>
                  <th className="py-2.5 px-2.5 w-24">الاستحقاق</th>
                  <th className="py-2.5 px-2.5 w-20 text-center">الإنجاز</th>
                  <th className="py-2.5 px-3 w-28 text-center sticky left-0 z-10 bg-slate-50/90">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  const assignee = team.find((m) => m.id === task.assigneeId);
                  const isSelected = selectedTaskIds.includes(task.id);
                  const isTimerRunning = activeTimer?.taskId === task.id;
                  const isOverdue =
                    task.dueDate && task.dueDate < todayStr && task.status !== 'completed';

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isSelected ? 'bg-teal-50/40' : ''
                      } ${task.status === 'completed' ? 'opacity-60 bg-slate-50/30' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(task.id)}
                          className="rounded text-teal-600 border-slate-300"
                        />
                      </td>

                      {/* Task Number */}
                      <td className="py-2 px-2.5 font-mono text-xs text-slate-500 font-bold">
                        {task.taskNumber}
                      </td>

                      {/* Title & Quick Check */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              onUpdateTaskStatus(
                                task.id,
                                task.status === 'completed' ? 'in_progress' : 'completed'
                              )
                            }
                            className="cursor-pointer text-slate-300 hover:text-emerald-600 transition shrink-0"
                            title={
                              task.status === 'completed'
                                ? 'إلغاء الإكمال'
                                : 'تعليم المهمة كمكتملة'
                            }
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-50" />
                            ) : (
                              <div className="w-4 h-4 rounded-md border border-slate-300 hover:border-teal-600" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <span
                              onClick={() => onOpenTaskDetail(task)}
                              className={`font-bold text-slate-900 hover:text-teal-700 cursor-pointer block truncate ${
                                task.status === 'completed'
                                  ? 'line-through text-slate-400'
                                  : ''
                              }`}
                            >
                              {task.title}
                            </span>
                            {task.customerRef && (
                              <span className="text-xs text-indigo-700 font-bold block">
                                عميل: {task.customerRef}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-2.5 text-center">{getStatusBadge(task.status)}</td>

                      {/* Priority */}
                      <td className="py-2 px-2.5 text-center">{getPriorityBadge(task.priority)}</td>

                      {/* Project */}
                      <td className="py-2 px-2.5">
                        {project ? (
                          <span
                            className="text-slate-700 font-bold truncate block max-w-[140px]"
                            title={project.name}
                          >
                            {project.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Assignee */}
                      <td className="py-2 px-2.5">
                        {assignee ? (
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`w-5 h-5 rounded-full ${assignee.avatarColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                            >
                              {assignee.name.charAt(0)}
                            </div>
                            <span className="truncate text-slate-800 font-medium max-w-[90px]">
                              {assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="py-2 px-2.5 font-mono text-xs">
                        <span
                          className={
                            isOverdue
                              ? 'text-rose-700 font-bold bg-rose-50 px-1 py-0.5 rounded'
                              : 'text-slate-600'
                          }
                        >
                          {task.dueDate}
                        </span>
                      </td>

                      {/* Progress */}
                      <td className="py-2 px-2.5 text-center">
                        <div className="w-14 mx-auto bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-teal-600 h-full rounded-full"
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          {task.progress || 0}%
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-center sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onStartTimer(task)}
                            title={isTimerRunning ? 'إيقاف المؤقت' : 'بدء المؤقت'}
                            className={`p-1 rounded transition cursor-pointer ${
                              isTimerRunning
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {isTimerRunning ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => onOpenTaskDetail(task)}
                            title="عرض وتعديل التفاصيل"
                            className="p-1 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded transition cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            title="حذف المهمة"
                            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-14 text-center text-slate-400">
                      لا توجد مهام مطابقة لخيارات الفلترة الحالية
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5.2 KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-x-auto pb-4">
          {[
            { id: 'planned', label: 'مخطط لها', color: 'border-blue-300 bg-blue-50/30' },
            { id: 'ready', label: 'جاهزة للبدء', color: 'border-cyan-300 bg-cyan-50/30' },
            { id: 'in_progress', label: 'قيد التنفيذ', color: 'border-amber-300 bg-amber-50/30' },
            { id: 'review', label: 'تحتاج مراجعة', color: 'border-purple-300 bg-purple-50/30' },
            { id: 'completed', label: 'مكتملة', color: 'border-emerald-300 bg-emerald-50/30' },
          ].map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className={`rounded-xl border p-3 flex flex-col min-h-[460px] ${col.color}`}
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                  <span className="font-bold text-slate-800 text-xs">{col.label}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white text-slate-700 text-xs font-bold shadow-2xs">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px]">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onOpenTaskDetail(task)}
                      className="bg-white p-3 rounded-xl border border-slate-200 hover:border-teal-400 shadow-2xs hover:shadow-xs transition cursor-pointer space-y-2"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-mono text-xs text-slate-400 font-bold">
                          {task.taskNumber}
                        </span>
                        {getPriorityBadge(task.priority)}
                      </div>

                      <h4 className="font-bold text-slate-900 text-xs leading-snug">
                        {task.title}
                      </h4>

                      {task.customerRef && (
                        <div className="text-xs text-indigo-700 font-bold">
                          {task.customerRef}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                        <span className="font-mono">{task.dueDate}</span>
                        <span>
                          {(task.subtasks || []).filter((s) => s.completed).length}/
                          {(task.subtasks || []).length} مهام
                        </span>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="py-12 text-center text-slate-300 text-xs">لا توجد مهام</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5.3 EISENHOWER MATRIX VIEW */}
      {viewMode === 'matrix' && (
        <WorkOSEisenhowerMatrix
          tasks={tasks}
          projects={projects}
          team={team}
          onOpenTaskDetail={onOpenTaskDetail}
          onOpenQuickAdd={onOpenQuickAdd}
          onUpdateTaskStatus={onUpdateTaskStatus}
          onUpdateTaskPriority={onUpdateTaskPriority}
        />
      )}

      {/* 5.4 GANTT & TIMELINE VIEW */}
      {viewMode === 'gantt' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-xs">
                المخطط الزمني للمهام والاعتماديات (Gantt & Dependencies)
              </h3>
              <p className="text-xs text-slate-500">
                تتبع مدد المهام وتأثير تأخير أي مهمة على المهام المرتبطة بها
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const project = projects.find((p) => p.id === task.projectId);
              return (
                <div
                  key={task.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-500">
                        {task.taskNumber}
                      </span>
                      <span className="font-bold text-slate-900">{task.title}</span>
                      {project && (
                        <span className="text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">
                          {project.name}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-slate-500 text-xs">
                      {task.startDate} ⬅️ {task.dueDate}
                    </span>
                  </div>

                  {/* Gantt Bar Visualization */}
                  <div className="w-full bg-slate-200 rounded-full h-3 relative overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        task.status === 'completed'
                          ? 'bg-emerald-500'
                          : task.priority === 'urgent'
                          ? 'bg-rose-500'
                          : 'bg-teal-600'
                      }`}
                      style={{ width: `${task.progress || 25}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>نسبة الإنجاز: {task.progress}%</span>
                    <span>
                      ساعات العمل المقدرة: {task.estimatedHours} س | الفعلية: {task.actualHours} س
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5.6 CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          <div className="font-bold text-slate-800 text-xs">
            التقويم وجدولة المهام حسب تواريخ الاستحقاق
          </div>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(
              (day, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 rounded-xl p-3 border border-slate-200 min-h-[160px]"
                >
                  <div className="font-bold text-xs text-slate-700 border-b border-slate-200 pb-1 mb-2 text-center">
                    {day}
                  </div>
                  <div className="space-y-1.5">
                    {filteredTasks.slice(idx, idx + 2).map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onOpenTaskDetail(t)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs hover:border-teal-500 transition cursor-pointer"
                      >
                        <div className="font-bold text-slate-800 truncate">{t.title}</div>
                        <div className="font-mono text-slate-400">{t.dueDate}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* 5.7 AUDIT LOG VIEW */}
      {viewMode === 'audit' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                سجل تدقيق وتعديلات المهام والالتزامات (Audit Log)
              </h3>
              <p className="text-xs text-slate-500">
                تسجيل تلقائي لجميع عمليات الإضافة، التعديل، الحذف، والإنجاز مع التوقيت الدقيق
              </p>
            </div>
            {onClearAuditLogs && (
              <button
                onClick={onClearAuditLogs}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 cursor-pointer transition"
              >
                تفريغ السجل
              </button>
            )}
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-16">
                لا توجد سجلات تدقيق مسجلة حالياً.
              </p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/80 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {log.action}: {log.title}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                        {log.entity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{log.details}</p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono shrink-0">
                    {log.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5.8 LIST VIEW (EXPANDED CARDS) */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 hover:border-slate-300 transition flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() =>
                    onUpdateTaskStatus(
                      task.id,
                      task.status === 'completed' ? 'in_progress' : 'completed'
                    )
                  }
                  className="cursor-pointer"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-teal-600" />
                  )}
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{task.title}</span>
                    <span className="font-mono text-xs text-slate-400">{task.taskNumber}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>
                      المشروع:{' '}
                      <strong>
                        {projects.find((p) => p.id === task.projectId)?.name || 'عام'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      المسؤول:{' '}
                      <strong>
                        {team.find((m) => m.id === task.assigneeId)?.name || 'غير محدد'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      الاستحقاق: <strong className="font-mono">{task.dueDate}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {getStatusBadge(task.status)}
                {getPriorityBadge(task.priority)}
                <button
                  onClick={() => onOpenTaskDetail(task)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  التفاصيل
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================= */}
      {/* 6. MODALS                                                     */}
      {/* ============================================================= */}

      {/* Universal Data Exchange Modal for Tasks */}
      <UniversalDataExchangeModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        moduleTitle="منظومة المهام والمشاريع والمصفوفة"
        moduleSubtitle="استيراد وتصدير إكسل الشامل ومزامنة البيانات"
        itemTypeName="المهام والأعمال والمشاريع"
        icon={CheckSquare}
        themeColor="teal"
        supportedColumnsText="المعرف، عنوان المهمة، الوصف، الفئة، العملية، الأولوية (A,B,C,D)، الحالة، المسؤول، تاريخ البداية، وتاريخ الانتهاء"
        onDownloadTemplate={downloadDailyTasksExcelTemplate}
        onImportFile={handleImportFile}
        onExportExcel={handleExportExcel}
        excelSubtitle="تصدير ملف إكسل شامل لسجل المهام التشغيلية وسجل التدقيق"
      />
    </div>
  );
};
