import React, { useState, useEffect, useMemo } from 'react';
import {
  WorkOSData,
  WorkOSViewMode,
  WorkTask,
  WorkProject,
  InboxItem,
  DailyRoutineBlock,
  DailyReviewRecord,
  HabitItem,
  GoalItem,
  AppointmentItem,
  WorkCommitment,
  WorkNote,
  WorkMeeting,
  AutomationRule,
  TeamMember,
  TaskStatus,
  TaskPriority,
  WorkActivityLog,
} from '../../types/workos';
import {
  loadWorkOSData,
  saveWorkOSData,
  exportWorkOSToJSON,
  exportWorkOSToCSV,
  exportWorkOSToExcel,
  downloadWorkOSTasksTemplate,
  importWorkOSTasksFromExcel,
  resetWorkOSToDefault,
  triggerConfetti,
  parseNaturalLanguageTask,
  ActiveTimerState,
} from '../../utils/workosStorage';
import { UniversalDataExchangeModal } from '../common/UniversalDataExchangeModal';

// Unified Components
import { WorkOSUnifiedTopBar } from './WorkOSUnifiedTopBar';
import { WorkOSKPICards } from './WorkOSKPICards';
import { WorkOSFilterStrip } from './WorkOSFilterStrip';
import { WorkOSTaskDrawer } from './WorkOSTaskDrawer';

// 7 Primary View Tabs
import { WorkOSOverviewTab } from './WorkOSOverviewTab';
import { WorkOSProjectsTab } from './WorkOSProjectsTab';
import { WorkOSTasksTab } from './WorkOSTasksTab';
import { WorkOSKanbanTab } from './WorkOSKanbanTab';
import { WorkOSTimelineTab } from './WorkOSTimelineTab';
import { WorkOSPrioritiesTab } from './WorkOSPrioritiesTab';
import { WorkOSTeamWorkloadTab } from './WorkOSTeamWorkloadTab';

// Secondary Utility Views
import { WorkOSInbox } from './WorkOSInbox';
import { WorkOSRoutineView } from './WorkOSRoutineView';
import { WorkOSDailyPlannerView } from './WorkOSDailyPlannerView';
import { WorkOSVisitsView } from './WorkOSVisitsView';
import { WorkOSHabitsView } from './WorkOSHabitsView';
import { WorkOSGoalsView } from './WorkOSGoalsView';
import { WorkOSAppointmentsCommitmentsView } from './WorkOSAppointmentsCommitmentsView';
import { WorkOSNotesMeetingsView } from './WorkOSNotesMeetingsView';
import { WorkOSAutomationView } from './WorkOSAutomationView';
import { WorkOSReportsView } from './WorkOSReportsView';
import { TasksModule } from '../tasks/TasksModule';
import { CentralUnifiedLedger } from './CentralUnifiedLedger';

// Modals
import { WorkOSAICopilotModal } from './WorkOSAICopilotModal';
import { WorkOSQuickAddModal } from './WorkOSQuickAddModal';
import { WorkOSCommandPaletteModal } from './WorkOSCommandPaletteModal';

import {
  BarChart3,
  BookOpen,
  Briefcase,
  Calendar,
  CheckSquare,
  ChevronDown,
  Clock,
  Coffee,
  Eye,
  Flame,
  FolderKanban,
  Inbox,
  Kanban,
  LayoutDashboard,
  ShoppingCart,
  Sparkles,
  Sun,
  Target,
  Users,
  Zap,
  ArrowDownUp,
  Printer,
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
    let interval: any = null;
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
  const handleAddTask = (newTask: Partial<WorkTask>) => {
    const task: WorkTask = {
      id: `task_${Date.now()}`,
      taskNumber: `TK-${String(data.tasks.length + 1).padStart(3, '0')}`,
      title: newTask.title || 'مهمة جديدة',
      description: newTask.description || '',
      status: newTask.status || 'planned',
      priority: newTask.priority || 'medium',
      category: newTask.category || 'عام',
      tags: newTask.tags || [],
      projectId: newTask.projectId,
      assigneeId: newTask.assigneeId || data.team[0]?.id || 'u1',
      creator: 'محمد العولقي',
      startDate: newTask.startDate || todayStr,
      dueDate: newTask.dueDate || todayStr,
      estimatedHours: newTask.estimatedHours || 2,
      actualHours: 0,
      progress: newTask.status === 'completed' ? 100 : newTask.progress || 0,
      subtasks: newTask.subtasks || [],
      checklist: newTask.checklist || [],
      comments: newTask.comments || [],
      timeEntries: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newActivity: WorkActivityLog = {
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: 'محمد العولقي',
      action: 'إنشاء مهمة جديدة',
      entity: 'task',
      entityTitle: task.title,
    };

    setData((prev) => ({
      ...prev,
      tasks: [task, ...prev.tasks],
      activities: [newActivity, ...(prev.activities || [])],
    }));

    if (task.status === 'completed') {
      triggerConfetti();
    }
  };

  const handleSaveTask = (updatedTask: WorkTask) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    }));
    if (updatedTask.status === 'completed') {
      triggerConfetti();
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = data.tasks.find((t) => t.id === taskId);
    const delActivity: WorkActivityLog = {
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: 'محمد العولقي',
      action: 'حذف مهمة',
      entity: 'task',
      entityTitle: taskToDelete?.title || 'مهمة',
    };

    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
      activities: [delActivity, ...(prev.activities || [])],
    }));
    if (activeTimerTask?.id === taskId) {
      handleStopTimer();
    }
  };

  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
    const targetTask = data.tasks.find((t) => t.id === taskId);
    const statusLabels: Partial<Record<TaskStatus, string>> = {
      planned: 'مخططة',
      in_progress: 'قيد التنفيذ',
      review: 'قيد المراجعة',
      completed: 'مكتملة',
      delayed: 'متأخرة',
      blocked: 'معلقة',
    };

    const statusActivity: WorkActivityLog = {
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: 'محمد العولقي',
      action: `تغيير حالة المهمة إلى: ${statusLabels[status] || status}`,
      entity: 'task',
      entityTitle: targetTask?.title || 'مهمة',
      newValue: status,
    };

    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id === taskId) {
          const isComp = status === 'completed';
          return {
            ...t,
            status,
            progress: isComp ? 100 : t.progress,
            completedAt: isComp ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      }),
      activities: [statusActivity, ...(prev.activities || [])],
    }));

    if (status === 'completed') {
      triggerConfetti();
    }
  };

  const handleUpdateTaskPriority = (taskId: string, priority: TaskPriority) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, priority, updatedAt: new Date().toISOString() } : t
      ),
    }));
  };

  const handleUpdateTaskAssignee = (taskId: string, assigneeId: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, assigneeId, updatedAt: new Date().toISOString() } : t
      ),
    }));
  };

  const handleUpdateTaskDueDate = (taskId: string, dueDate: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, dueDate, updatedAt: new Date().toISOString() } : t
      ),
    }));
  };

  const handleDuplicateTask = (task: WorkTask) => {
    const copy: WorkTask = {
      ...task,
      id: `task_${Date.now()}`,
      taskNumber: `TK-${String(data.tasks.length + 1).padStart(3, '0')}`,
      title: `${task.title} (نسخة)`,
      status: 'planned',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: undefined,
    };
    setData((prev) => ({ ...prev, tasks: [copy, ...prev.tasks] }));
  };

  // Convert Task to Project
  const handleConvertToProjectFromTask = (task: WorkTask) => {
    const newProject: WorkProject = {
      id: `prj_${Date.now()}`,
      code: `PRJ-${String(data.projects.length + 1).padStart(3, '0')}`,
      name: task.title,
      description: task.description || `مشروع تم إنشاؤه من المهمة ${task.taskNumber || task.title}`,
      status: 'active',
      priority: task.priority || 'medium',
      progress: task.progress || 0,
      startDate: task.startDate || todayStr,
      dueDate: task.dueDate || todayStr,
      manager: data.team.find((m) => m.id === task.assigneeId)?.name || 'محمد العولقي',
      category: task.category || 'عام',
    };

    const updatedTasks = data.tasks.map((t) =>
      t.id === task.id ? { ...t, projectId: newProject.id } : t
    );

    const generatedSubtasks: WorkTask[] = (task.subtasks || []).map((st, idx) => ({
      id: `task_${Date.now()}_${idx}`,
      taskNumber: `TK-${Date.now().toString().slice(-4)}-${idx + 1}`,
      title: st.title,
      description: `مهمة فرعية للمشروع ${newProject.name}`,
      status: st.completed ? 'completed' : 'planned',
      priority: task.priority || 'medium',
      category: task.category || 'عام',
      tags: [],
      projectId: newProject.id,
      assigneeId: task.assigneeId,
      creator: 'محمد العولقي',
      startDate: task.startDate,
      dueDate: task.dueDate,
      progress: st.completed ? 100 : 0,
      subtasks: [],
      checklist: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setData((prev) => ({
      ...prev,
      projects: [...prev.projects, newProject],
      tasks: [...updatedTasks, ...generatedSubtasks],
    }));

    setCurrentTab('projects');
    triggerConfetti();
  };

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
  const primaryTabs = [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard, group: 'work' },
    { id: 'projects', label: 'المشاريع', icon: FolderKanban, count: data.projects.length, group: 'work' },
    { id: 'tasks', label: 'المهام', icon: CheckSquare, count: data.tasks.length, group: 'work' },
    { id: 'orders', label: 'الدفتر المركزي والطلبيات', icon: ShoppingCart, count: data.orders?.length || 0, group: 'work' },
    { id: 'kanban', label: 'كانبان', icon: Kanban, group: 'views' },
    { id: 'timeline', label: 'الجدول الزمني', icon: Clock, group: 'views' },
    { id: 'priorities', label: 'الأولويات', icon: Flame, group: 'insights' },
    { id: 'workload', label: 'عبء الفريق', icon: Users, group: 'insights' },
    // مجموعة «التخطيط والمتابعة» (§6 · §25) — مداخل إلى الواجهات القائمة نفسها (لا واجهات جديدة)
    { id: 'planner', label: 'التخطيط اليومي', icon: Sun, group: 'planning', secondary: 'planner' as const },
    { id: 'goals', label: 'الأهداف', icon: Target, group: 'planning', secondary: 'goals' as const, count: data.goals.length },
    { id: 'routine', label: 'الروتين', icon: Coffee, group: 'planning', secondary: 'routine' as const },
    { id: 'visits', label: 'الزيارات', icon: Eye, group: 'planning', secondary: 'visits' as const },
  ];

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

        {/* 3. MAIN IN-PAGE TAB NAVIGATION BAR */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs gap-2">
          {/* 7 تبويبات العمل/العروض/التحليل + مجموعة التخطيط والمتابعة (§25) */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {primaryTabs.map((tab, idx) => {
              const Icon = tab.icon;
              const tabSecondary = (tab as { secondary?: string }).secondary;
              const isActive = tabSecondary ? secondaryView === tabSecondary : currentTab === tab.id && secondaryView === null;
              const groupedSeparator = idx > 0 && primaryTabs[idx - 1].group !== tab.group;

              return (
                <React.Fragment key={tab.id}>
                {groupedSeparator && (
                  <span
                    aria-hidden="true"
                    className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0"
                  />
                )}
                <button
                  onClick={() => {
                    if (tabSecondary) {
                      setSecondaryView(tabSecondary);
                    } else {
                      setCurrentTab(tab.id);
                      setSecondaryView(null);
                    }
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${
                        isActive ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
                </React.Fragment>
              );
            })}
          </div>

            {/* More Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  secondaryView
                    ? 'bg-teal-50 text-teal-800 border-teal-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>
                  {secondaryView === 'inbox'
                    ? 'أداة: صندوق الوارد'
                    : secondaryView === 'visits'
                    ? 'أداة: الزيارات (قراءة فقط)'
                    : secondaryView === 'planner'
                    ? 'أداة: التخطيط اليومي'
                    : secondaryView === 'routine'
                    ? 'أداة: الروتين اليومي'
                    : secondaryView === 'habits'
                    ? 'أداة: متتبع العادات'
                    : secondaryView === 'goals'
                    ? 'أداة: الخطط والأهداف'
                    : secondaryView === 'notes'
                    ? 'أداة: الملاحظات والاجتماعات'
                    : secondaryView === 'works'
                    ? 'أداة: الأعمال والالتزامات'
                    : secondaryView === 'calendar'
                    ? 'أداة: التقويم والمواعيد'
                    : secondaryView === 'automation'
                    ? 'أداة: قواعد الأتمتة'
                    : secondaryView === 'reports'
                    ? 'أداة: التقارير والتصدير'
                    : secondaryView === 'classic_tasks'
                    ? 'أداة: سجل المهام الكلاسيكي'
                    : 'أدوات إضافية'}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isMoreMenuOpen && (
                <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-40 text-xs font-bold animate-in fade-in">
                  <button
                    onClick={() => {
                      setSecondaryView('inbox');
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Inbox className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>صندوق الوارد السريع</span>
                  </button>

                  <button
                    onClick={() => {
                      setSecondaryView('planner');
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>التخطيط اليومي</span>
                  </button>

                  <button
                    onClick={() => {
                      setSecondaryView('routine');
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>الروتين ومربعات التركيز</span>
                  </button>

                  <button
                    onClick={() => {
                      setSecondaryView('habits');
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>متتبع العادات والانضباط</span>
                  </button>

                  <button
                    onClick={() => {
                      setSecondaryView('goals');
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>الأهداف والنتائج الرئيسية (OKRs)</span>
                  </button>

                  <button
                    onClick={() => {
                      setSecondaryView('calendar');
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>التقويم والمواعيد والالتزامات</span>
                  </button>

                  <button
                    onClick={() => {
                      setSecondaryView('visits');
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>الزيارات (قراءة فقط)</span>
                  </button>

                  <button
                    onClick={() => {
                      setSecondaryView('works');
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>الأعمال والالتزامات المستقلة</span>
                  </button>

                  <button
                    onClick={() => {
                      setSecondaryView('notes');
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>الملاحظات ومحاضر الاجتماعات</span>
                  </button>

                  <button
                    onClick={() => {
                      setSecondaryView('automation');
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>قواعد الأتمتة الذكية</span>
                  </button>

                  <button
                    onClick={() => {
                      setSecondaryView('reports');
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>تقارير وتصدير Work OS</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                </div>
              )}
            </div>

            {/* Print Report Preview Button */}
            <button
              onClick={() => setIsPrintReportOpen(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs shrink-0"
              title="معاينة وطباعة تقرير إنجاز المشاريع والمهام رسمياً (أو اضغط P)"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>طباعة تقرير</span>
              <span className="hidden sm:inline-block px-1 py-0.2 text-[9px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">P</span>
            </button>

            {/* Data Exchange (Excel & Backup) Button */}
            <button
              onClick={() => setIsExchangeModalOpen(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-800 dark:hover:text-teal-200 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs shrink-0"
              title="استيراد وتصدير بيانات Work OS مع Excel وJSON"
            >
              <ArrowDownUp className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>استيراد وتصدير</span>
            </button>
        </div>

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
          {/* Secondary Views (if triggered from more menu) */}
          {secondaryView === 'inbox' && (
            <WorkOSInbox
              inbox={data.inbox}
              onAddItem={(c, t) => {
                const newItem: InboxItem = {
                  id: `inbox_${Date.now()}`,
                  content: c,
                  type: t,
                  createdAt: new Date().toISOString(),
                  status: 'unprocessed',
                };
                setData((prev) => ({ ...prev, inbox: [newItem, ...prev.inbox] }));
              }}
              onConvertToTask={(item) => {
                const parsed = parseNaturalLanguageTask(item.content);
                handleAddTask({ ...parsed, category: 'صندوق الوارد' });
                setData((prev) => ({
                  ...prev,
                  inbox: prev.inbox.filter((i) => i.id !== item.id),
                }));
              }}
              onConvertToProject={(item) => {
                const newProject: WorkProject = {
                  id: `prj_${Date.now()}`,
                  code: `PRJ-${String(data.projects.length + 1).padStart(3, '0')}`,
                  name: item.content.slice(0, 50),
                  description: item.content,
                  status: 'active',
                  priority: 'medium',
                  category: 'عام',
                  progress: 0,
                  startDate: todayStr,
                  dueDate: todayStr,
                  manager: 'محمد العولقي',
                };
                setData((prev) => ({
                  ...prev,
                  projects: [...prev.projects, newProject],
                  inbox: prev.inbox.filter((i) => i.id !== item.id),
                }));
                setSecondaryView(null);
                setCurrentTab('projects');
              }}
              onArchiveItem={(id) => {
                setData((prev) => ({
                  ...prev,
                  inbox: prev.inbox.map((i) => (i.id === id ? { ...i, status: 'archived' } : i)),
                }));
              }}
              onDeleteItem={(id) => {
                setData((prev) => ({
                  ...prev,
                  inbox: prev.inbox.filter((i) => i.id !== id),
                }));
              }}
            />
          )}

          {secondaryView === 'visits' && <WorkOSVisitsView />}

          {secondaryView === 'planner' && (
            <WorkOSDailyPlannerView
              tasks={data.tasks}
              appointments={data.appointments}
              routine={data.dailyRoutine}
              activeTimer={activeTimer}
              onOpenTaskDetail={setSelectedTaskForDrawer}
              onUpdateTaskDueDate={handleUpdateTaskDueDate}
              onOpenQuickAdd={(type) => {
                setQuickAddInitialType(type);
                setIsQuickAddOpen(true);
              }}
            />
          )}

          {secondaryView === 'routine' && (
            <WorkOSRoutineView
              routine={data.dailyRoutine}
              reviews={data.dailyReviews}
              activeTimer={activeTimer}
              onStartRoutineBlock={(block) => {
                setActiveTimerTask({
                  id: block.id,
                  taskNumber: 'BLOCK',
                  title: block.title,
                  status: 'in_progress',
                  priority: 'medium',
                  creator: 'المستخدم',
                  startDate: todayStr,
                  dueDate: todayStr,
                  progress: 0,
                });
                setTimerSeconds(0);
                setIsTimerRunning(true);
              }}
              onAddRoutineBlock={(b) => {
                const nb: DailyRoutineBlock = { ...b, id: `rt_${Date.now()}` };
                setData((prev) => ({ ...prev, dailyRoutine: [...prev.dailyRoutine, nb] }));
              }}
              onSaveReview={(rev) => {
                setData((prev) => ({ ...prev, dailyReviews: [rev, ...prev.dailyReviews] }));
                triggerConfetti();
              }}
            />
          )}

          {secondaryView === 'habits' && (
            <WorkOSHabitsView
              habits={data.habits}
              onToggleHabitDay={(hId, dStr) => {
                setData((prev) => ({
                  ...prev,
                  habits: prev.habits.map((h) => {
                    if (h.id !== hId) return h;
                    const exists = h.completedDates.includes(dStr);
                    const newDates = exists
                      ? h.completedDates.filter((d) => d !== dStr)
                      : [...h.completedDates, dStr];
                    const newStreak = exists ? Math.max(0, h.streak - 1) : h.streak + 1;
                    return {
                      ...h,
                      completedDates: newDates,
                      streak: newStreak,
                      bestStreak: Math.max(h.bestStreak, newStreak),
                    };
                  }),
                }));
              }}
              onAddHabit={(nh) => {
                const h: HabitItem = {
                  ...nh,
                  id: `h_${Date.now()}`,
                  streak: 0,
                  bestStreak: 0,
                  completedDates: [],
                };
                setData((prev) => ({ ...prev, habits: [...prev.habits, h] }));
              }}
              onDeleteHabit={(id) => {
                setData((prev) => ({ ...prev, habits: prev.habits.filter((h) => h.id !== id) }));
              }}
            />
          )}

          {secondaryView === 'goals' && (
            <WorkOSGoalsView
              goals={data.goals}
              projects={data.projects}
              onUpdateKeyResultProgress={(gId, krId, val) => {
                setData((prev) => ({
                  ...prev,
                  goals: prev.goals.map((g) => {
                    if (g.id !== gId) return g;
                    const uKrs = g.keyResults.map((kr) =>
                      kr.id === krId ? { ...kr, currentValue: val } : kr
                    );
                    const avg = Math.round(
                      uKrs.reduce(
                        (acc, k) => acc + Math.min(100, (k.currentValue / k.targetValue) * 100),
                        0
                      ) / (uKrs.length || 1)
                    );
                    return { ...g, keyResults: uKrs, progress: avg };
                  }),
                }));
              }}
              onAddGoal={(g) => {
                const ng: GoalItem = { ...g, id: `g_${Date.now()}`, progress: 0 };
                setData((prev) => ({ ...prev, goals: [...prev.goals, ng] }));
              }}
            />
          )}

          {secondaryView === 'calendar' && (
            <WorkOSAppointmentsCommitmentsView
              appointments={data.appointments}
              commitments={data.commitments}
              onOpenQuickAdd={(type) => {
                setQuickAddInitialType(type || 'appointment');
                setIsQuickAddOpen(true);
              }}
              onUpdateAppointmentStatus={(id, status) => {
                setData((prev) => ({
                  ...prev,
                  appointments: prev.appointments.map((a) =>
                    a.id === id ? { ...a, status } : a
                  ),
                }));
              }}
              onUpdateCommitmentStatus={(id, status) => {
                setData((prev) => ({
                  ...prev,
                  commitments: prev.commitments.map((c) =>
                    c.id === id ? { ...c, status } : c
                  ),
                }));
              }}
            />
          )}

          {secondaryView === 'notes' && (
            <WorkOSNotesMeetingsView
              notes={data.notes}
              meetings={data.meetings}
              projects={data.projects}
              team={data.team}
              onSaveNote={(n) => {
                const exists = data.notes.some((x) => x.id === n.id);
                setData((prev) => ({
                  ...prev,
                  notes: exists
                    ? prev.notes.map((x) => (x.id === n.id ? n : x))
                    : [n, ...prev.notes],
                }));
              }}
              onDeleteNote={(id) => {
                setData((prev) => ({ ...prev, notes: prev.notes.filter((x) => x.id !== id) }));
              }}
              onSaveMeeting={(m) => {
                const exists = data.meetings.some((x) => x.id === m.id);
                setData((prev) => ({
                  ...prev,
                  meetings: exists
                    ? prev.meetings.map((x) => (x.id === m.id ? m : x))
                    : [m, ...prev.meetings],
                }));
              }}
              onConvertMeetingActionToTask={(action) => {
                handleAddTask({
                  title: action.title,
                  assigneeId: action.assigneeId,
                  dueDate: action.dueDate,
                });
              }}
            />
          )}

          {secondaryView === 'automation' && (
            <WorkOSAutomationView
              automations={data.automations}
              onToggleAutomation={(id) => {
                setData((prev) => ({
                  ...prev,
                  automations: prev.automations.map((a) =>
                    a.id === id ? { ...a, isActive: !a.isActive } : a
                  ),
                }));
              }}
              onExecuteAutomationManually={(rule) => {
                setData((prev) => {
                  let updatedTasks = [...prev.tasks];
                  let updatedProjects = [...prev.projects];

                  // Execute rule action
                  if (rule.actionType === 'tag_priority_urgent') {
                    updatedTasks = updatedTasks.map((t) =>
                      t.status !== 'completed' ? { ...t, priority: 'urgent' } : t
                    );
                  } else if (rule.actionType === 'create_followup_task') {
                    const followupTask: WorkTask = {
                      id: `tsk_${Date.now()}`,
                      taskNumber: `TSK-${String(updatedTasks.length + 1).padStart(3, '0')}`,
                      title: `متابعة تنفيذية: ${rule.name}`,
                      description: `مهمة متابعة تم توليدها تلقائياً بواسطة محرك الأتمتة (${rule.name})`,
                      status: 'planned',
                      priority: 'high',
                      projectId: updatedProjects[0]?.id || 'prj_1',
                      category: 'تشغيلي',
                      tags: ['أتمتة', 'متابعة'],
                      creator: 'محرك الأتمتة',
                      assigneeId: prev.team[0]?.id || 'mem_1',
                      startDate: todayStr,
                      dueDate: todayStr,
                      estimatedHours: 2,
                      actualHours: 0,
                      progress: 0,
                      subtasks: [],
                      checklist: [],
                      comments: [],
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    };
                    updatedTasks = [followupTask, ...updatedTasks];
                  }

                  const updatedAutomations = prev.automations.map((a) =>
                    a.id === rule.id
                      ? {
                          ...a,
                          executionsCount: a.executionsCount + 1,
                          lastExecutedAt: new Date().toISOString(),
                        }
                      : a
                  );

                  return {
                    ...prev,
                    tasks: updatedTasks,
                    projects: updatedProjects,
                    automations: updatedAutomations,
                  };
                });
              }}
              onAddAutomation={(newRule) => {
                setData((prev) => ({
                  ...prev,
                  automations: [newRule, ...prev.automations],
                }));
              }}
              onDeleteAutomation={(ruleId) => {
                setData((prev) => ({
                  ...prev,
                  automations: prev.automations.filter((a) => a.id !== ruleId),
                }));
              }}
            />
          )}

          {secondaryView === 'reports' && (
            <WorkOSReportsView
              tasks={data.tasks}
              projects={data.projects}
              team={data.team}
              onExportJSON={() => exportWorkOSToJSON(data)}
              onExportCSV={() => exportWorkOSToCSV(data.tasks)}
              onOpenPrintReport={() => setIsPrintReportOpen(true)}
            />
          )}

          {(secondaryView === 'works' || secondaryView === 'classic_tasks') && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <TasksModule
                tasks={classicTasks || []}
                commitments={commitments || []}
                categories={categories || []}
                operations={operations || []}
                assignees={assignees || []}
                auditLogs={auditLogs || []}
                onSaveTask={onSaveClassicTask || (() => {})}
                onDeleteTask={onDeleteClassicTask || (() => {})}
                onToggleCompleteTask={onToggleCompleteClassicTask || (() => {})}
                onSaveCommitment={onSaveCommitment || (() => {})}
                onDeleteCommitment={onDeleteCommitment || (() => {})}
                onToggleCompleteCommitment={onToggleCompleteCommitment || (() => {})}
                onClearCompletedTasks={onClearCompletedTasks || (() => {})}
                onClearAuditLogs={onClearAuditLogs || (() => {})}
              />
            </div>
          )}

          {/* Primary 7 Tabs */}
          {!secondaryView && (
            <>
              {currentTab === 'overview' && (
                <WorkOSOverviewTab
                  tasks={data.tasks}
                  projects={data.projects}
                  team={data.team}
                  appointments={data.appointments}
                  activities={data.activities}
                  goals={data.goals}
                  meetings={data.meetings}
                  commitments={data.commitments}
                  onOpenTaskDetail={setSelectedTaskForDrawer}
                  onNavigateToTab={setCurrentTab}
                  onSelectProject={(pId) => {
                    setSelectedProjectId(pId);
                    setCurrentTab('tasks');
                  }}
                />
              )}

              {currentTab === 'projects' && (
                <WorkOSProjectsTab
                  projects={data.projects}
                  tasks={data.tasks}
                  team={data.team}
                  onOpenTaskDetail={setSelectedTaskForDrawer}
                  onNavigateToTasksWithProject={(pId) => {
                    setSelectedProjectId(pId);
                    setCurrentTab('tasks');
                  }}
                  onUpdateProject={(upProj) => {
                    setData((prev) => ({
                      ...prev,
                      projects: prev.projects.map((p) => (p.id === upProj.id ? upProj : p)),
                    }));
                  }}
                />
              )}

              {currentTab === 'tasks' && (
                <WorkOSTasksTab
                  tasks={filteredTasks}
                  projects={data.projects}
                  team={data.team}
                  onOpenTaskDetail={setSelectedTaskForDrawer}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onUpdateTaskPriority={handleUpdateTaskPriority}
                  onUpdateTaskAssignee={handleUpdateTaskAssignee}
                  onUpdateTaskDueDate={handleUpdateTaskDueDate}
                  onDeleteTask={handleDeleteTask}
                  onDuplicateTask={handleDuplicateTask}
                  density={density}
                />
              )}

              {currentTab === 'orders' && (
                <CentralUnifiedLedger
                  orders={data.orders || []}
                  tasks={data.tasks}
                  commitments={data.commitments}
                  team={data.team}
                  onOpenQuickAdd={(type) => {
                    setQuickAddInitialType(type || 'order');
                    setIsQuickAddOpen(true);
                  }}
                  onUpdateOrders={(updatedOrders) => {
                    setData((prev) => ({ ...prev, orders: updatedOrders }));
                  }}
                  onUpdateTasks={(updatedTasks) => {
                    setData((prev) => ({ ...prev, tasks: updatedTasks }));
                  }}
                  onUpdateCommitments={(updatedCommitments) => {
                    setData((prev) => ({ ...prev, commitments: updatedCommitments }));
                  }}
                />
              )}

              {currentTab === 'kanban' && (
                <WorkOSKanbanTab
                  tasks={filteredTasks}
                  projects={data.projects}
                  team={data.team}
                  onOpenTaskDetail={setSelectedTaskForDrawer}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                />
              )}

              {currentTab === 'timeline' && (
                <WorkOSTimelineTab
                  tasks={filteredTasks}
                  projects={data.projects}
                  team={data.team}
                  onOpenTaskDetail={setSelectedTaskForDrawer}
                />
              )}

              {currentTab === 'priorities' && (
                <WorkOSPrioritiesTab
                  tasks={filteredTasks}
                  projects={data.projects}
                  team={data.team}
                  onOpenTaskDetail={setSelectedTaskForDrawer}
                  onUpdateTaskPriority={handleUpdateTaskPriority}
                />
              )}

              {currentTab === 'workload' && (
                <WorkOSTeamWorkloadTab
                  team={data.team}
                  tasks={data.tasks}
                  projects={data.projects}
                  onOpenTaskDetail={setSelectedTaskForDrawer}
                />
              )}

              {currentTab === 'works' && (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <TasksModule
                    tasks={classicTasks || []}
                    commitments={commitments || []}
                    categories={categories || []}
                    operations={operations || []}
                    assignees={assignees || []}
                    auditLogs={auditLogs || []}
                    onSaveTask={onSaveClassicTask || (() => {})}
                    onDeleteTask={onDeleteClassicTask || (() => {})}
                    onToggleCompleteTask={onToggleCompleteClassicTask || (() => {})}
                    onSaveCommitment={onSaveCommitment || (() => {})}
                    onDeleteCommitment={onDeleteCommitment || (() => {})}
                    onToggleCompleteCommitment={onToggleCompleteCommitment || (() => {})}
                    onClearCompletedTasks={onClearCompletedTasks || (() => {})}
                    onClearAuditLogs={onClearAuditLogs || (() => {})}
                  />
                </div>
              )}

              {currentTab === 'goals' && (
                <WorkOSGoalsView
                  goals={data.goals}
                  projects={data.projects}
                  onUpdateKeyResultProgress={(gId, krId, val) => {
                    setData((prev) => ({
                      ...prev,
                      goals: prev.goals.map((g) => {
                        if (g.id !== gId) return g;
                        const uKrs = g.keyResults.map((kr) =>
                          kr.id === krId ? { ...kr, currentValue: val } : kr
                        );
                        const avg = Math.round(
                          uKrs.reduce(
                            (acc, c) =>
                              acc +
                              Math.min(
                                100,
                                Math.round(
                                  ((c.currentValue - c.startValue) /
                                    Math.max(1, c.targetValue - c.startValue)) *
                                    100
                                )
                              ),
                            0
                          ) / Math.max(1, uKrs.length)
                        );
                        return { ...g, keyResults: uKrs, progress: avg };
                      }),
                    }));
                  }}
                  onAddGoal={(ng) => {
                    setData((prev) => ({ ...prev, goals: [...prev.goals, ng] }));
                    triggerConfetti();
                  }}
                />
              )}

              {currentTab === 'calendar' && (
                <WorkOSAppointmentsCommitmentsView
                  appointments={data.appointments}
                  commitments={data.commitments}
                  onOpenQuickAdd={(type) => {
                    setQuickAddInitialType(type || 'appointment');
                    setIsQuickAddOpen(true);
                  }}
                  onUpdateAppointmentStatus={(id, status) => {
                    setData((prev) => ({
                      ...prev,
                      appointments: prev.appointments.map((a) =>
                        a.id === id ? { ...a, status } : a
                      ),
                    }));
                  }}
                  onUpdateCommitmentStatus={(id, status) => {
                    setData((prev) => ({
                      ...prev,
                      commitments: prev.commitments.map((c) =>
                        c.id === id ? { ...c, status } : c
                      ),
                    }));
                  }}
                />
              )}

              {currentTab === 'reports' && (
                <WorkOSReportsView
                  tasks={data.tasks}
                  projects={data.projects}
                  team={data.team}
                  onExportJSON={() => exportWorkOSToJSON(data)}
                  onExportCSV={() => exportWorkOSToCSV(data.tasks)}
                />
              )}
            </>
          )}
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
            id: `apt_${Date.now()}`,
            ...a,
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
          setQuickAddInitialType((type as any) || 'task');
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
            setCurrentTab(view as any);
            setSecondaryView(null);
          } else {
            setSecondaryView(view);
          }
          setIsCommandPaletteOpen(false);
        }}
        onNavigate={(view) => {
          if (['overview', 'projects', 'tasks', 'kanban', 'timeline', 'priorities', 'workload'].includes(view)) {
            setCurrentTab(view as any);
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
