import React, { useState, useEffect, useMemo } from 'react';
import {
  WorkOSData,
  WorkOSViewMode,
  WorkTask,
  WorkProject,
  HabitItem,
  GoalItem,
  AppointmentItem,
  WorkCommitment,
  WorkNote,
  TaskPriority,
} from '../../types/workos';
import {
  loadWorkOSData,
  saveWorkOSData,
  exportWorkOSToJSON,
  exportWorkOSToExcel,
  downloadWorkOSTasksTemplate,
  importWorkOSTasksFromExcel,
  resetWorkOSToDefault,
  triggerConfetti,
  ActiveTimerState,
} from '../../utils/workosStorage';
import { UniversalDataExchangeModal } from '../common/UniversalDataExchangeModal';

// Unified Components
import { WorkOSUnifiedTopBar } from './WorkOSUnifiedTopBar';
import { WorkOSSecondaryViews } from './WorkOSSecondaryViews';
import { WorkOSPrimaryTabs } from './WorkOSPrimaryTabs';
import { WorkOSViewNav } from './WorkOSViewNav';
import { useWorkOSTaskActions } from './useWorkOSTaskActions';
import { buildWorkOSNavTabs } from './workosNavTabs';
import { WorkOSKPICards } from './WorkOSKPICards';
import { WorkOSFilterStrip } from './WorkOSFilterStrip';
import { WorkOSTaskDrawer } from './WorkOSTaskDrawer';

// 7 Primary View Tabs

// Secondary Utility Views

// Modals
import { WorkOSAICopilotModal } from './WorkOSAICopilotModal';
import { WorkOSQuickAddModal } from './WorkOSQuickAddModal';
import { WorkOSCommandPaletteModal } from './WorkOSCommandPaletteModal';

import {
  Briefcase,
} from 'lucide-react';
import { Task, Commitment, TaskAuditLog } from '../../types';
import { exportTasksToExcel } from '../../utils/excel';
import { WorkOSPrintReportModal } from './WorkOSPrintReportModal';
import { broadcastDataChange } from '../../utils/multiTabSync';

interface WorkOSModuleProps {
  initialView?: WorkOSViewMode;
  onNavigateToERP?: (tab: string) => void;
  // Integrated props for TasksModule
  tasks?: Task[];
  commitments?: Commitment[];
  categories?: string[];
  operations?: string[];
  assignees?: string[];
  auditLogs?: TaskAuditLog[];
  onSaveTask?: (task: Task) => void;
  onDeleteTask?: (id: string) => void;
  onToggleCompleteTask?: (task: Task) => void;
  onSaveCommitment?: (commitment: Commitment) => void;
  onDeleteCommitment?: (id: string) => void;
  onToggleCompleteCommitment?: (commitment: Commitment) => void;
  onClearCompletedTasks?: () => void;
  onClearAuditLogs?: () => void;
}

export const WorkOSModule: React.FC<WorkOSModuleProps> = ({
  initialView,
  onNavigateToERP,
  tasks: classicTasks,
  commitments,
  categories,
  operations,
  assignees,
  auditLogs,
  onSaveTask: onSaveClassicTask,
  onDeleteTask: onDeleteClassicTask,
  onToggleCompleteTask: onToggleCompleteClassicTask,
  onSaveCommitment,
  onDeleteCommitment,
  onToggleCompleteCommitment,
  onClearCompletedTasks,
  onClearAuditLogs,
}) => {
  // State
  const [data, setData] = useState<WorkOSData>(() => loadWorkOSData());

  // Current active tab/view
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (initialView === 'taskflow') return 'kanban';
    if (initialView === 'classic_tasks') return 'tasks';
    if (initialView === 'projects') return 'projects';
    if (initialView === 'tasks') return 'tasks';
    if (initialView === 'workload') return 'workload';
    if (initialView && ['overview', 'projects', 'tasks', 'kanban', 'timeline', 'priorities', 'workload'].includes(initialView)) {
      return initialView;
    }
    return 'overview';
  });

  const [secondaryView, setSecondaryView] = useState<string | null>(null);

  // Global Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');
  const [minProgress, setMinProgress] = useState(0);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [completedOnly, setCompletedOnly] = useState(false);

  // View Settings
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [showCompleted, setShowCompleted] = useState(false);

  // Task Drawer & Modals state
  const [selectedTaskForDrawer, setSelectedTaskForDrawer] = useState<WorkTask | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddInitialType, setQuickAddInitialType] = useState('task');
  const [quickAddProjectId, setQuickAddProjectId] = useState<string | undefined>(undefined);
  const [quickAddPriority, setQuickAddPriority] = useState<TaskPriority | undefined>(undefined);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);

  // More menu dropdown
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);

  // Active Timer State (Floating Pomodoro / Work Timer)
  const [activeTimerTask, setActiveTimerTask] = useState<WorkTask | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const activeTimer: ActiveTimerState | null = activeTimerTask
    ? {
        taskId: activeTimerTask.id,
        taskTitle: activeTimerTask.title,
        startedAt: new Date().toISOString(),
        elapsedSeconds: timerSeconds,
        isRunning: isTimerRunning,
      }
    : null;

  // Save to LocalStorage & broadcast sync to dashboard
  useEffect(() => {
    saveWorkOSData(data);
    broadcastDataChange('TASK_UPDATED');
  }, [data]);

  // Synchronize when navigating from external tabs
  useEffect(() => {
    if (!initialView) return;
    if (initialView === 'taskflow' || initialView === 'kanban') {
      setCurrentTab('kanban');
      setSecondaryView(null);
    } else if (initialView === 'tasks') {
      setCurrentTab('tasks');
      setSecondaryView(null);
    } else if (initialView === 'projects') {
      setCurrentTab('projects');
      setSecondaryView(null);
    } else if (initialView === 'workload') {
      setCurrentTab('workload');
      setSecondaryView(null);
    } else if (['overview', 'timeline', 'priorities'].includes(initialView)) {
      setCurrentTab(initialView);
      setSecondaryView(null);
    } else if (initialView === 'classic_tasks') {
      setSecondaryView('classic_tasks');
    }
  }, [initialView]);

  // Global Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        (activeEl as HTMLElement)?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (!isInputActive && (e.key === 'n' || e.key === 'N' || e.key === 'ى')) {
        // 'N' for New item
        e.preventDefault();
        setQuickAddInitialType('task');
        setIsQuickAddOpen(true);
      } else if (!isInputActive && (e.key === 'p' || e.key === 'P' || e.key === 'ح')) {
        // 'P' for Print report
        e.preventDefault();
        setIsPrintReportOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Timer Tick
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleStartTimer = (task: WorkTask) => {
    setActiveTimerTask(task);
    setTimerSeconds(0);
    setIsTimerRunning(true);
  };

  const handleToggleTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  const handleStopTimer = () => {
    if (activeTimerTask && timerSeconds > 0) {
      const addedHours = Number((timerSeconds / 3600).toFixed(2));
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === activeTimerTask.id
            ? {
                ...t,
                actualHours: (t.actualHours || 0) + addedHours,
                timeEntries: [
                  ...(t.timeEntries || []),
                  {
                    id: `te_${Date.now()}`,
                    userId: t.assigneeId || 'u1',
                    durationMinutes: Math.round(timerSeconds / 60),
                    startedAt: new Date(Date.now() - timerSeconds * 1000).toISOString(),
                    endedAt: new Date().toISOString(),
                  },
                ],
              }
            : t
        ),
      }));
    }
    setActiveTimerTask(null);
    setTimerSeconds(0);
    setIsTimerRunning(false);
  };

  // --- KPI Metrics Computation ---
  const kpiStats = useMemo(() => {
    const validProjects = (data.projects || []).filter(Boolean);
    const validTasks = (data.tasks || []).filter(Boolean);

    const totalProjects = validProjects.length;
    const activeProjects = validProjects.filter(
      (p) => p && (p.status === 'active' || p.status === 'delayed')
    ).length;

    const totalTasks = validTasks.length;
    const completedTasks = validTasks.filter((t) => t && t.status === 'completed').length;
    const inProgressTasks = validTasks.filter((t) => t && t.status === 'in_progress').length;
    const overdueTasks = validTasks.filter(
      (t) => t && t.status !== 'completed' && t.dueDate && t.dueDate < todayStr
    ).length;
    const urgentTasks = validTasks.filter(
      (t) => t && t.status !== 'completed' && t.priority === 'urgent'
    ).length;
    const dueTodayTasks = validTasks.filter(
      (t) => t && t.status !== 'completed' && t.dueDate === todayStr
    ).length;
    const openTasks = validTasks.filter((t) => t && t.status !== 'completed').length;

    const overallCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      urgentTasks,
      dueTodayTasks,
      openTasks,
      overallCompletionRate,
    };
  }, [data.projects, data.tasks, todayStr]);

  // Clickable KPI Action Handlers
  const handleKPICardClick = (type: string) => {
    setSecondaryView(null);
    if (type === 'total_projects') {
      setCurrentTab('projects');
      setSelectedProjectId('all');
    } else if (type === 'active_projects') {
      setCurrentTab('projects');
    } else if (type === 'total_tasks') {
      setCurrentTab('tasks');
      setSelectedStatus('all');
      setOverdueOnly(false);
      setCompletedOnly(false);
    } else if (type === 'completed_tasks') {
      setCurrentTab('tasks');
      setSelectedStatus('completed');
      setShowCompleted(true);
      setCompletedOnly(true);
      setOverdueOnly(false);
    } else if (type === 'in_progress_tasks') {
      setCurrentTab('tasks');
      setSelectedStatus('in_progress');
      setOverdueOnly(false);
      setCompletedOnly(false);
    } else if (type === 'overdue_tasks') {
      setCurrentTab('tasks');
      setOverdueOnly(true);
      setCompletedOnly(false);
      setSelectedStatus('all');
    } else if (type === 'urgent_tasks') {
      setCurrentTab('tasks');
      setSelectedPriority('urgent');
      setOverdueOnly(false);
      setCompletedOnly(false);
    } else if (type === 'due_today') {
      setCurrentTab('tasks');
      setDueDateFrom(todayStr);
      setDueDateTo(todayStr);
      setOverdueOnly(false);
      setCompletedOnly(false);
    } else if (type === 'completion_rate') {
      setCurrentTab('overview');
    }
  };

  // --- Task CRUD and State Handlers ---
  // --- Task CRUD and State Handlers — hook مستقل (R29) ---
  const {
    handleAddTask,
    handleSaveTask,
    handleDeleteTask,
    handleUpdateTaskStatus,
    handleUpdateTaskPriority,
    handleUpdateTaskAssignee,
    handleUpdateTaskDueDate,
    handleDuplicateTask,
    handleConvertToProjectFromTask,
  } = useWorkOSTaskActions({
    data,
    setData,
    todayStr,
    activeTimerTask,
    handleStopTimer,
    setCurrentTab,
  });

  // Filter Tasks list
  const filteredTasks = useMemo(() => {
    return (data.tasks || []).filter((t) => {
      if (!t) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        const matchesNum = (t.taskNumber || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesNum) return false;
      }

      // Hide completed by default unless explicitly allowed or filtered
      if (!showCompleted && !completedOnly && selectedStatus !== 'completed' && t.status === 'completed') {
        return false;
      }

      // Completed only
      if (completedOnly && t.status !== 'completed') return false;

      // Project filter
      if (selectedProjectId !== 'all' && t.projectId !== selectedProjectId) return false;

      // Assignee filter
      if (selectedAssigneeId !== 'all' && t.assigneeId !== selectedAssigneeId) return false;

      // Status filter
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;

      // Priority filter
      if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;

      // Overdue filter
      if (overdueOnly) {
        if (!t.dueDate || t.dueDate >= todayStr || t.status === 'completed') return false;
      }

      // Min Progress
      if (minProgress > 0 && (t.progress || 0) < minProgress) return false;

      // Date Range
      if (dueDateFrom && t.dueDate && t.dueDate < dueDateFrom) return false;
      if (dueDateTo && t.dueDate && t.dueDate > dueDateTo) return false;

      return true;
    });
  }, [
    data.tasks,
    searchQuery,
    showCompleted,
    completedOnly,
    selectedProjectId,
    selectedAssigneeId,
    selectedStatus,
    selectedPriority,
    overdueOnly,
    minProgress,
    dueDateFrom,
    dueDateTo,
    todayStr,
  ]);

  // Export to Excel handler
  const handleExportExcel = () => {
    const mapped: Task[] = filteredTasks.map((t) => ({
      id: t.taskNumber || t.id,
      title: t.title,
      desc: t.description || '',
      cat: t.category || 'عام',
      op: (t.tags && t.tags[0]) || 'تنفيذ',
      pri: t.priority === 'urgent' ? 'A' : t.priority === 'high' ? 'B' : t.priority === 'medium' ? 'C' : 'D',
      status: t.status === 'completed' ? 'تم الانجاز' : t.status === 'in_progress' ? 'قيد التنفيذ' : 'مخطط',
      resp: data.team.find((m) => m.id === t.assigneeId)?.name || 'غير محدد',
      start: t.startDate || t.dueDate || todayStr,
      end: t.dueDate,
    }));
    exportTasksToExcel(mapped, [], []);
  };

  // The Standard 7 Workspaces Primary Tabs definition (As mandated by the Work OS Unified Master Prompt)
  // التبويبات الأولية موزّعة على ثلاث مجموعات (نفس المنظومة، زوايا نظر مختلفة — §25):
  //   work     : ما هو العمل نفسه
  //   views    : كيف نراه (طرق عرض للبيانات نفسها)
  //   insights : كيف نقرأه (تحليل ومتابعة)
  // الفواصل بصرية فقط: لا تتغيّر أي معرّفات ولا مسارات ولا حالة.
  const primaryTabs = useMemo(() => buildWorkOSNavTabs(data), [data]);

  const activeKPIFilter = useMemo(() => {
    if (overdueOnly) return 'overdue_tasks';
    if (selectedPriority === 'urgent') return 'urgent_tasks';
    if (completedOnly || selectedStatus === 'completed') return 'completed_tasks';
    if (selectedStatus === 'in_progress') return 'in_progress_tasks';
    if (currentTab === 'projects' && selectedProjectId !== 'all') return 'active_projects';
    if (currentTab === 'projects') return 'total_projects';
    if (currentTab === 'tasks' && selectedProjectId === 'all' && selectedAssigneeId === 'all' && selectedStatus === 'all' && !overdueOnly && !completedOnly && selectedPriority === 'all') return 'total_tasks';
    if (currentTab === 'overview') return 'completion_rate';
    return null;
  }, [overdueOnly, selectedPriority, completedOnly, selectedStatus, currentTab, selectedProjectId, selectedAssigneeId]);

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-800/60 pb-16 font-sans text-slate-800 dark:text-slate-200" dir="rtl">
      {/* 1. TOP UNIFIED BAR (Single unified header across the app) */}
      <WorkOSUnifiedTopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenQuickAdd={(type) => {
          setQuickAddInitialType(type);
          setIsQuickAddOpen(true);
        }}
        onOpenAddModal={(type) => {
          setQuickAddInitialType(type);
          setIsQuickAddOpen(true);
        }}
        tasks={data.tasks}
        projects={data.projects}
        overdueTasksCount={kpiStats.overdueTasks}
        urgentTasksCount={kpiStats.urgentTasks}
        activeTimer={activeTimer}
        onToggleTimer={handleToggleTimer}
        onStopTimer={handleStopTimer}
        density={density}
        onChangeDensity={setDensity}
        onDensityChange={setDensity}
        showCompleted={showCompleted}
        hideCompleted={!showCompleted}
        onToggleShowCompleted={() => setShowCompleted((prev) => !prev)}
        onToggleHideCompleted={() => setShowCompleted((prev) => !prev)}
        onFilterByOverdue={() => {
          setCurrentTab('tasks');
          setSecondaryView(null);
          setOverdueOnly(true);
        }}
        onFilterByUrgent={() => {
          setCurrentTab('tasks');
          setSecondaryView(null);
          setSelectedPriority('urgent');
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-4">
        {/* 2. CLICKABLE KPI CARDS (Syncs filter/views on click) */}
        <WorkOSKPICards
          totalProjects={kpiStats.totalProjects}
          activeProjects={kpiStats.activeProjects}
          totalTasks={kpiStats.totalTasks}
          completedTasks={kpiStats.completedTasks}
          inProgressTasks={kpiStats.inProgressTasks}
          overdueTasks={kpiStats.overdueTasks}
          urgentTasks={kpiStats.urgentTasks}
          dueTodayTasks={kpiStats.dueTodayTasks}
          openTasks={kpiStats.openTasks}
          overallCompletionRate={kpiStats.overallCompletionRate}
          completionRate={kpiStats.overallCompletionRate}
          activeFilterType={activeKPIFilter}
          onCardClick={handleKPICardClick}
          onFilterClick={handleKPICardClick}
        />

        {/* 3. MAIN IN-PAGE TAB NAVIGATION BAR — مكوّن مستقل (R29) */}
        <WorkOSViewNav
          primaryTabs={primaryTabs}
          currentTab={currentTab}
          secondaryView={secondaryView}
          setCurrentTab={setCurrentTab}
          setSecondaryView={setSecondaryView}
          isMoreMenuOpen={isMoreMenuOpen}
          setIsMoreMenuOpen={setIsMoreMenuOpen}
          setIsPrintReportOpen={setIsPrintReportOpen}
          setIsExchangeModalOpen={setIsExchangeModalOpen}
        />

        {/* 4. COLLAPSIBLE FILTER STRIP (Shown for tasks, projects, kanban, or timeline) */}
        {!secondaryView && ['tasks', 'projects', 'kanban', 'timeline'].includes(currentTab) && (
          <WorkOSFilterStrip
            projects={data.projects}
            team={data.team}
            selectedProjectId={selectedProjectId}
            onSelectProjectId={setSelectedProjectId}
            selectedAssigneeId={selectedAssigneeId}
            onSelectAssigneeId={setSelectedAssigneeId}
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            selectedPriority={selectedPriority}
            onSelectPriority={setSelectedPriority}
            dueDateFrom={dueDateFrom}
            onDueDateFromChange={setDueDateFrom}
            dueDateTo={dueDateTo}
            onDueDateToChange={setDueDateTo}
            minProgress={minProgress}
            onMinProgressChange={setMinProgress}
            overdueOnly={overdueOnly}
            onToggleOverdueOnly={() => setOverdueOnly((prev) => !prev)}
            completedOnly={completedOnly}
            onToggleCompletedOnly={() => setCompletedOnly((prev) => !prev)}
            onClearFilters={() => {
              setSelectedProjectId('all');
              setSelectedAssigneeId('all');
              setSelectedStatus('all');
              setSelectedPriority('all');
              setDueDateFrom('');
              setDueDateTo('');
              setMinProgress(0);
              setOverdueOnly(false);
              setCompletedOnly(false);
            }}
            totalResults={filteredTasks.length}
            onExportExcel={handleExportExcel}
            onExportPDF={() => window.print()}
          />
        )}

        {/* 5. MAIN TAB CONTENT AREA */}
        <div>
          {/* Secondary Views (if triggered from more menu) — مكوّن مستقل (R29) */}
          <WorkOSSecondaryViews
            secondaryView={secondaryView}
            data={data}
            setData={setData}
            setSecondaryView={setSecondaryView}
            setCurrentTab={setCurrentTab}
            todayStr={todayStr}
            activeTimer={activeTimer}
            setActiveTimerTask={setActiveTimerTask}
            setTimerSeconds={setTimerSeconds}
            setIsTimerRunning={setIsTimerRunning}
            setSelectedTaskForDrawer={setSelectedTaskForDrawer}
            setQuickAddInitialType={setQuickAddInitialType}
            setIsQuickAddOpen={setIsQuickAddOpen}
            setIsPrintReportOpen={setIsPrintReportOpen}
            handleAddTask={handleAddTask}
            handleUpdateTaskDueDate={handleUpdateTaskDueDate}
            handleUpdateTaskStatus={handleUpdateTaskStatus}
            handleUpdateTaskPriority={handleUpdateTaskPriority}
            handleUpdateTaskAssignee={handleUpdateTaskAssignee}
            handleDeleteTask={handleDeleteTask}
            handleDuplicateTask={handleDuplicateTask}
            classicTasks={classicTasks}
            commitments={commitments}
            categories={categories}
            operations={operations}
            assignees={assignees}
            auditLogs={auditLogs}
            onSaveClassicTask={onSaveClassicTask}
            onDeleteClassicTask={onDeleteClassicTask}
            onToggleCompleteClassicTask={onToggleCompleteClassicTask}
            onSaveCommitment={onSaveCommitment}
            onDeleteCommitment={onDeleteCommitment}
            onToggleCompleteCommitment={onToggleCompleteCommitment}
            onClearCompletedTasks={onClearCompletedTasks}
            onClearAuditLogs={onClearAuditLogs}
          />

          {/* Primary 7 Tabs — مكوّن مستقل (R29) */}
          <WorkOSPrimaryTabs
            secondaryView={secondaryView}
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            setSecondaryView={setSecondaryView}
            data={data}
            setData={setData}
            filteredTasks={filteredTasks}
            density={density}
            setSelectedProjectId={setSelectedProjectId}
            setSelectedTaskForDrawer={setSelectedTaskForDrawer}
            setQuickAddInitialType={setQuickAddInitialType}
            setIsQuickAddOpen={setIsQuickAddOpen}
            handleUpdateTaskStatus={handleUpdateTaskStatus}
            handleUpdateTaskPriority={handleUpdateTaskPriority}
            handleUpdateTaskAssignee={handleUpdateTaskAssignee}
            handleUpdateTaskDueDate={handleUpdateTaskDueDate}
            handleDeleteTask={handleDeleteTask}
            handleDuplicateTask={handleDuplicateTask}
            classicTasks={classicTasks}
            commitments={commitments}
            categories={categories}
            operations={operations}
            assignees={assignees}
            auditLogs={auditLogs}
            onSaveClassicTask={onSaveClassicTask}
            onDeleteClassicTask={onDeleteClassicTask}
            onToggleCompleteClassicTask={onToggleCompleteClassicTask}
            onSaveCommitment={onSaveCommitment}
            onDeleteCommitment={onDeleteCommitment}
            onToggleCompleteCommitment={onToggleCompleteCommitment}
            onClearCompletedTasks={onClearCompletedTasks}
            onClearAuditLogs={onClearAuditLogs}
          />
        </div>
      </div>

      {/* 6. SIDE DRAWER FOR TASK DETAILS (No multi-page jumping) */}
      {selectedTaskForDrawer && (
        <WorkOSTaskDrawer
          isOpen={!!selectedTaskForDrawer}
          task={selectedTaskForDrawer}
          projects={data.projects}
          team={data.team}
          onClose={() => setSelectedTaskForDrawer(null)}
          onSaveTask={handleSaveTask}
          onDeleteTask={handleDeleteTask}
          onConvertToProject={handleConvertToProjectFromTask}
          onStartTimer={handleStartTimer}
        />
      )}

      {/* 7. QUICK ADD MODAL (Opened from unified top bar) */}
      <WorkOSQuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setQuickAddProjectId(undefined);
          setQuickAddPriority(undefined);
        }}
        initialType={quickAddInitialType}
        initialProjectId={quickAddProjectId}
        initialPriority={quickAddPriority}
        projects={data.projects}
        team={data.team}
        onAddTask={handleAddTask}
        onAddOrder={(order) => {
          setData((prev) => ({
            ...prev,
            orders: [order, ...(prev.orders || [])],
          }));
          setCurrentTab('orders');
          setSecondaryView(null);
        }}
        onAddProject={(p) => {
          const newP: WorkProject = {
            id: `prj_${Date.now()}`,
            code: `PRJ-${String(data.projects.length + 1).padStart(3, '0')}`,
            name: p.name,
            description: p.description,
            status: 'active',
            priority: p.priority || 'medium',
            progress: 0,
            startDate: p.startDate,
            dueDate: p.dueDate,
            manager: p.manager,
            category: p.category,
            budget: p.budget,
          };
          setData((prev) => ({ ...prev, projects: [...prev.projects, newP] }));
          setCurrentTab('projects');
          setSecondaryView(null);
        }}
        onAddNote={(n) => {
          const newN: WorkNote = {
            id: `note_${Date.now()}`,
            title: n.title,
            content: n.content,
            type: n.type || 'idea',
            tags: n.tags || [],
            linkedProjectId: n.linkedProjectId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setData((prev) => ({ ...prev, notes: [newN, ...prev.notes] }));
        }}
        onAddAppointment={(a) => {
          const newA: AppointmentItem = {
            ...a,
            id: `apt_${Date.now()}`,
            attendees: a.attendees ?? [],
          };
          setData((prev) => ({ ...prev, appointments: [...prev.appointments, newA] }));
        }}
        onAddCommitment={(c) => {
          const newC: WorkCommitment = {
            id: `cmt_${Date.now()}`,
            title: c.title || 'التزام جديد',
            entity: c.entity || 'جهة عامة',
            person: c.person || 'المسؤول',
            description: c.description || '',
            commitmentDate: c.commitmentDate || todayStr,
            dueDate: c.dueDate || todayStr,
            status: 'in_progress',
            importance: c.importance || 'B',
            notes: c.notes || '',
          };
          setData((prev) => ({ ...prev, commitments: [newC, ...prev.commitments] }));
          if (onSaveCommitment) {
            onSaveCommitment({
              id: newC.id,
              name: newC.title,
              beneficiary: newC.entity,
              due: newC.dueDate,
              amount: 0,
              pri: newC.importance === 'A' ? 'A' : 'B',
              status: 'قيد التنفيذ',
            });
          }
        }}
        onAddHabit={(h) => {
          const newH: HabitItem = {
            ...h,
            id: `h_${Date.now()}`,
            streak: 0,
            bestStreak: 0,
            completedDates: [],
          };
          setData((prev) => ({ ...prev, habits: [...prev.habits, newH] }));
        }}
        onAddGoal={(g) => {
          const newG: GoalItem = {
            ...g,
            id: `g_${Date.now()}`,
            progress: 0,
          };
          setData((prev) => ({ ...prev, goals: [...prev.goals, newG] }));
        }}
      />

      {/* 8. AI COPILOT & COMMAND PALETTE */}
      <WorkOSAICopilotModal
        isOpen={isAICopilotOpen}
        onClose={() => setIsAICopilotOpen(false)}
        tasks={data.tasks}
        projects={data.projects}
        appointments={data.appointments}
        routine={data.dailyRoutine}
        onAddTaskFromAI={handleAddTask}
      />

      <WorkOSCommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={data.tasks}
        projects={data.projects}
        onOpenQuickAdd={(type) => {
          setQuickAddInitialType(type || 'task');
          setIsQuickAddOpen(true);
        }}
        onOpenAI={() => setIsAICopilotOpen(true)}
        onOpenPrintReport={() => setIsPrintReportOpen(true)}
        onSelectTask={(task) => {
          setSelectedTaskForDrawer(task);
          setIsCommandPaletteOpen(false);
        }}
        onSelectProject={(project) => {
          setSelectedProjectId(project.id);
          setCurrentTab('projects');
          setSecondaryView(null);
          setIsCommandPaletteOpen(false);
        }}
        onSelectView={(view) => {
          if (['overview', 'projects', 'tasks', 'kanban', 'timeline', 'priorities', 'workload'].includes(view)) {
            setCurrentTab(view);
            setSecondaryView(null);
          } else {
            setSecondaryView(view);
          }
          setIsCommandPaletteOpen(false);
        }}
        onNavigate={(view) => {
          if (['overview', 'projects', 'tasks', 'kanban', 'timeline', 'priorities', 'workload'].includes(view)) {
            setCurrentTab(view);
            setSecondaryView(null);
          } else {
            setSecondaryView(view);
          }
          setIsCommandPaletteOpen(false);
        }}
      />

      {/* 9. UNIVERSAL DATA EXCHANGE MODAL (Excel / Backup / Template) */}
      <UniversalDataExchangeModal
        isOpen={isExchangeModalOpen}
        onClose={() => setIsExchangeModalOpen(false)}
        moduleTitle="إدارة العمل (Work OS)"
        moduleSubtitle="تصدير واستيراد المشاريع والمهام مع Excel والنسخ الاحتياطي"
        itemTypeName="المهام والمشاريع"
        icon={Briefcase}
        themeColor="teal"
        supportedColumnsText="عنوان المهمة، الوصف، الحالة، الأولوية، اسم المشروع، اسم المسؤول، تاريخ الاستحقاق، نسبة الإنجاز %، الساعات التقديرية، والوسوم"
        onDownloadTemplate={downloadWorkOSTasksTemplate}
        onImportFile={async (file) => {
          const res = await importWorkOSTasksFromExcel(file);
          if (res.success) {
            setData(loadWorkOSData());
            triggerConfetti();
          }
          return res;
        }}
        onGenerateSampleData={() => {
          resetWorkOSToDefault();
          setData(loadWorkOSData());
          triggerConfetti();
        }}
        sampleDataDescription="إعادة ملء المنظومة بحزمة كاملة من المشاريع والمهام والروتين والالتزامات النموذجية لعام 2026."
        onExportExcel={() => exportWorkOSToExcel(data)}
        excelSubtitle="ملف Excel يشمل مصنف المهام ومصنف المشاريع التنفيذية"
        onExportJSON={() => exportWorkOSToJSON(data)}
        jsonSubtitle="نسخة JSON احتياطية كاملة لكافة جداول Work OS"
      />

      {/* 10. WORK OS PRINT & PDF REPORT MODAL */}
      <WorkOSPrintReportModal
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
        tasks={filteredTasks}
        projects={data.projects}
        team={data.team}
        onExportExcel={handleExportExcel}
      />
    </div>
  );
};
