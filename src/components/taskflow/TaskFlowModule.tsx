import React, { useState, useEffect, useMemo } from 'react';
import {
  TaskFlowTask,
  TaskFlowProject,
  TaskFlowMember,
  TaskFlowStatus,
  TaskFlowFilterState,
} from '../../types/taskflow';
import {
  loadTaskFlowProjects,
  saveTaskFlowProjects,
  loadTaskFlowMembers,
  saveTaskFlowMembers,
  loadTaskFlowTasks,
  saveTaskFlowTasks,
  loadTaskFlowCurrentUser,
  saveTaskFlowCurrentUser,
  addTaskFlowActivity,
  isTaskOverdue,
  resetTaskFlowSampleData,
  taskflowChannel,
} from '../../utils/taskflowStorage';
import { TaskFlowBoardView } from './TaskFlowBoardView';
import { TaskFlowTimelineView } from './TaskFlowTimelineView';
import { TaskFlowTaskModal } from './TaskFlowTaskModal';
import { TaskFlowProjectsModal } from './TaskFlowProjectsModal';
import { TaskFlowMembersModal } from './TaskFlowMembersModal';
import { TaskFlowUserSwitchModal } from './TaskFlowUserSwitchModal';
import { TaskFlowImportExportModal } from './TaskFlowImportExportModal';
import {
  Kanban,
  Calendar,
  Plus,
  Search,
  Filter,
  Users,
  FolderKanban,
  ArrowRightLeft,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
  Activity,
  Layers,
} from 'lucide-react';

export const TaskFlowModule: React.FC = () => {
  // Main Data States
  const [projects, setProjects] = useState<TaskFlowProject[]>(() => loadTaskFlowProjects());
  const [members, setMembers] = useState<TaskFlowMember[]>(() => loadTaskFlowMembers());
  const [tasks, setTasks] = useState<TaskFlowTask[]>(() => loadTaskFlowTasks());
  const [currentUser, setCurrentUser] = useState<TaskFlowMember>(() => loadTaskFlowCurrentUser());

  // Navigation & View
  const [activeView, setActiveView] = useState<'board' | 'timeline'>('board');

  // Filters State
  const [filters, setFilters] = useState<TaskFlowFilterState>({
    search: '',
    projectId: 'all',
    assigneeId: 'all',
    showCompleted: true,
    onlyOverdue: false,
    groupBy: 'none',
  });

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskFlowTask | null>(null);
  const [initialTaskStatus, setInitialTaskStatus] = useState<TaskFlowStatus>('todo');

  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isUserSwitchModalOpen, setIsUserSwitchModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);

  // Live Toast state
  const [liveToast, setLiveToast] = useState<string | null>(null);

  const showLiveToast = (msg: string) => {
    setLiveToast(msg);
    setTimeout(() => setLiveToast(null), 3000);
  };

  // ==========================================
  // Real-Time Multi-Tab Synchronization
  // ==========================================
  useEffect(() => {
    if (!taskflowChannel) return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || !data.type) return;

      if (data.type === 'TASKS_UPDATED') {
        setTasks(loadTaskFlowTasks());
        showLiveToast('مزامنة حية: تم تحديث المهام من مستخدم آخر');
      } else if (data.type === 'PROJECTS_UPDATED') {
        setProjects(loadTaskFlowProjects());
        showLiveToast('مزامنة حية: تم تحديث المشاريع');
      } else if (data.type === 'MEMBERS_UPDATED') {
        setMembers(loadTaskFlowMembers());
        showLiveToast('مزامنة حية: تم تحديث أعضاء الفريق');
      }
    };

    taskflowChannel.addEventListener('message', handleMessage);

    // Also listen to storage events
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.includes('AL_MANZUMA_TF_TASKS')) setTasks(loadTaskFlowTasks());
      if (e.key?.includes('AL_MANZUMA_TF_PROJECTS')) setProjects(loadTaskFlowProjects());
      if (e.key?.includes('AL_MANZUMA_TF_MEMBERS')) setMembers(loadTaskFlowMembers());
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      taskflowChannel.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const isAdmin = currentUser.role === 'admin';

  // ==========================================
  // Task Handlers
  // ==========================================
  const handleOpenTaskModal = (task?: TaskFlowTask, status?: TaskFlowStatus) => {
    setSelectedTask(task || null);
    setInitialTaskStatus(status || 'todo');
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (
    taskData: Omit<TaskFlowTask, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    const now = new Date().toISOString();
    let updated: TaskFlowTask[];

    if (id) {
      updated = tasks.map((t) => (t.id === id ? { ...t, ...taskData, updatedAt: now } : t));
      addTaskFlowActivity(currentUser.name, 'قام بتعديل المهمة', taskData.title);
      showLiveToast(`تم تحديث المهمة: ${taskData.title}`);
    } else {
      const newTask: TaskFlowTask = {
        ...taskData,
        id: `tf-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      updated = [newTask, ...tasks];
      addTaskFlowActivity(currentUser.name, 'أنشأ مهمة جديدة', taskData.title);
      showLiveToast(`تم إنشاء مهمة جديدة: ${taskData.title}`);
    }

    setTasks(updated);
    saveTaskFlowTasks(updated);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskFlowStatus) => {
    const now = new Date().toISOString();
    const task = tasks.find((t) => t.id === taskId);
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus, updatedAt: now } : t
    );
    setTasks(updated);
    saveTaskFlowTasks(updated);

    const statusName =
      newStatus === 'completed'
        ? 'مكتملة'
        : newStatus === 'in_progress'
        ? 'قيد التنفيذ'
        : 'قيد الانتظار';
    addTaskFlowActivity(currentUser.name, `نقل المهمة إلى (${statusName})`, task?.title);
    showLiveToast(`تم نقل المهمة إلى: ${statusName}`);
  };

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    saveTaskFlowTasks(updated);
    addTaskFlowActivity(currentUser.name, 'حذف المهمة', task?.title);
    showLiveToast('تم حذف المهمة بنجاح');
  };

  // ==========================================
  // Project Handlers (Admin Only)
  // ==========================================
  const handleSaveProject = (project: TaskFlowProject) => {
    const exists = projects.some((p) => p.id === project.id);
    let updated: TaskFlowProject[];
    if (exists) {
      updated = projects.map((p) => (p.id === project.id ? project : p));
    } else {
      updated = [...projects, project];
    }
    setProjects(updated);
    saveTaskFlowProjects(updated);
    addTaskFlowActivity(currentUser.name, exists ? 'عدل المشروع' : 'أنشأ مشروع جديد', project.name);
    showLiveToast(`تم حفظ المشروع: ${project.name}`);
  };

  const handleDeleteProject = (projectId: string) => {
    const updatedProjects = projects.filter((p) => p.id !== projectId);
    const updatedTasks = tasks.filter((t) => t.projectId !== projectId);
    setProjects(updatedProjects);
    saveTaskFlowProjects(updatedProjects);
    setTasks(updatedTasks);
    saveTaskFlowTasks(updatedTasks);
    addTaskFlowActivity(currentUser.name, 'حذف مشروع ومهامه');
    showLiveToast('تم حذف المشروع بنجاح');
  };

  // ==========================================
  // Member Handlers (Admin Only)
  // ==========================================
  const handleSaveMember = (member: TaskFlowMember) => {
    const exists = members.some((m) => m.id === member.id);
    let updated: TaskFlowMember[];
    if (exists) {
      updated = members.map((m) => (m.id === member.id ? member : m));
    } else {
      updated = [...members, member];
    }
    setMembers(updated);
    saveTaskFlowMembers(updated);
    if (member.id === currentUser.id) {
      setCurrentUser(member);
      saveTaskFlowCurrentUser(member);
    }
    addTaskFlowActivity(currentUser.name, exists ? 'عدل بيانات العضو' : 'أضاف عضو جديد', member.name);
    showLiveToast(`تم حفظ بيانات العضو: ${member.name}`);
  };

  const handleDeleteMember = (memberId: string) => {
    if (memberId === currentUser.id) {
      alert('لا يمكن حذف المستخدم النشط حالياً. يرجى اختيار مستخدم آخر أولاً.');
      return;
    }
    const target = members.find((m) => m.id === memberId);
    const updated = members.filter((m) => m.id !== memberId);
    setMembers(updated);
    saveTaskFlowMembers(updated);
    addTaskFlowActivity(currentUser.name, 'حذف عضواً من الفريق', target?.name);
    showLiveToast(`تم حذف العضو: ${target?.name || ''}`);
  };

  const handleToggleMemberActive = (memberId: string) => {
    const updated = members.map((m) => (m.id === memberId ? { ...m, isActive: !m.isActive } : m));
    setMembers(updated);
    saveTaskFlowMembers(updated);
  };

  // ==========================================
  // User Switch & Profile
  // ==========================================
  const handleSwitchUser = (member: TaskFlowMember) => {
    setCurrentUser(member);
    saveTaskFlowCurrentUser(member);
    showLiveToast(`العمل بصفتي: ${member.name} (${member.role === 'admin' ? 'مدير' : 'عضو'})`);
  };

  // ==========================================
  // Import / Export Handlers
  // ==========================================
  const handleImportTasks = (importedTasks: TaskFlowTask[]) => {
    const merged = [...importedTasks, ...tasks];
    setTasks(merged);
    saveTaskFlowTasks(merged);
    addTaskFlowActivity(currentUser.name, `استورد ${importedTasks.length} مهمة من Excel`);
  };

  const handleResetData = () => {
    resetTaskFlowSampleData();
    setProjects(loadTaskFlowProjects());
    setMembers(loadTaskFlowMembers());
    setTasks(loadTaskFlowTasks());
    setCurrentUser(loadTaskFlowCurrentUser());
    showLiveToast('تمت استعادة البيانات النموذجية الحديثة بنجاح!');
  };

  // ==========================================
  // Filtered Tasks Calculation
  // ==========================================
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchDesc) return false;
      }

      // Project
      if (filters.projectId !== 'all' && task.projectId !== filters.projectId) {
        return false;
      }

      // Assignee
      if (filters.assigneeId !== 'all') {
        if (filters.assigneeId === 'unassigned') {
          if (task.assigneeId) return false;
        } else if (task.assigneeId !== filters.assigneeId) {
          return false;
        }
      }

      // Show / Hide Completed
      if (!filters.showCompleted && task.status === 'completed') {
        return false;
      }

      // Overdue Only
      if (filters.onlyOverdue && !isTaskOverdue(task)) {
        return false;
      }

      return true;
    });
  }, [tasks, filters]);

  // Quick Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const overdue = tasks.filter((t) => isTaskOverdue(t)).length;
    return { total, completed, inProgress, overdue };
  }, [tasks]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Live Toast Notification */}
      {liveToast && (
        <div className="fixed bottom-5 left-5 z-50 bg-slate-900 dark:bg-slate-800 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 border border-teal-500/50 animate-in slide-in-from-bottom-5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
          <span className="text-xs font-bold">{liveToast}</span>
        </div>
      )}

      {/* Main Top Header Strip */}
      <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4 animate-fade-in-up stagger-1">
        {/* Row 1: Brand, Live indicator, View Switcher & Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* TaskFlow Logo with live badge */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shadow-xs">
                TF
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100">ادارة منظومة المشاريع</h2>
                  {/* Pulsing Live indicator */}
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/50 dark:border-teal-800/50 text-teal-700 dark:text-teal-300 text-xs font-black">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                    </span>
                    <span>Live</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  منظومة إدارة المشاريع ولوحات كانبان والمخطط الزمني
                </p>
              </div>
            </div>

            {/* View Switcher: Board vs Timeline */}
            <div className="mr-4 flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <button
                onClick={() => setActiveView('board')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeView === 'board'
                    ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>لوحة كانبان (Board)</span>
              </button>
              <button
                onClick={() => setActiveView('timeline')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeView === 'timeline'
                    ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>الجدول الزمني (Timeline)</span>
              </button>
            </div>
          </div>

          {/* Right side controls: Current user & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Current Active User / Operator Pill */}
            <button
              onClick={() => setIsUserSwitchModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-right cursor-pointer"
              title="انقر لاختيار منفذ العمليات النشط"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-2xs"
                style={{ backgroundColor: currentUser.avatarColor }}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-black text-slate-900 dark:text-slate-100 leading-none">{currentUser.name}</div>
                <div className="text-xs text-teal-600 dark:text-teal-400 font-bold leading-none mt-0.5">
                  {currentUser.role === 'admin' ? '👑 مدير (Admin)' : '👤 عضو (Member)'}
                </div>
              </div>
              <ArrowRightLeft className="w-3 h-3 text-slate-400 mr-1" />
            </button>

            {/* Manage Projects (Admin) */}
            <button
              onClick={() => setIsProjectsModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FolderKanban className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>المشاريع ({projects.length})</span>
            </button>

            {/* Manage Team (Admin) */}
            <button
              onClick={() => setIsMembersModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>الفريق ({members.length})</span>
            </button>

            {/* Import / Export */}
            <button
              onClick={() => setIsImportExportModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Excel / استيراد</span>
            </button>

            {/* + New Task Button */}
            <button
              onClick={() => handleOpenTaskModal()}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-black shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>مهمة جديدة</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search, Filters & Stats Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[220px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="بحث في المهام..."
                className="w-full pr-9 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Project Filter */}
            <select
              value={filters.projectId}
              onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              value={filters.assigneeId}
              onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">كافة المسؤولين</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
              <option value="unassigned">غير مسندة</option>
            </select>

            {/* Toggle Show Completed */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300 select-none bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                checked={filters.showCompleted}
                onChange={(e) => setFilters({ ...filters, showCompleted: e.target.checked })}
                className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500"
              />
              <span>إظهار المكتملة</span>
            </label>

            {/* Quick Overdue Toggle */}
            <button
              onClick={() => setFilters({ ...filters, onlyOverdue: !filters.onlyOverdue })}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                filters.onlyOverdue
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-black'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${filters.onlyOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
              <span>المتأخرة فقط ({stats.overdue})</span>
            </button>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              المعروض: {filteredTasks.length} / {stats.total}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-mono border border-teal-200/50 dark:border-teal-800/50">
              ✓ {stats.completed} مكتملة
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: Board View or Timeline View */}
      {activeView === 'board' ? (
        <TaskFlowBoardView
          tasks={filteredTasks}
          projects={projects}
          members={members}
          onOpenTaskModal={handleOpenTaskModal}
          onUpdateTaskStatus={handleUpdateTaskStatus}
          onDeleteTask={handleDeleteTask}
        />
      ) : (
        <TaskFlowTimelineView
          tasks={filteredTasks}
          projects={projects}
          members={members}
          onOpenTaskModal={(t) => handleOpenTaskModal(t)}
        />
      )}

      {/* Modals */}
      <TaskFlowTaskModal
        isOpen={isTaskModalOpen}
        task={selectedTask}
        initialStatus={initialTaskStatus}
        projects={projects}
        members={members}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      <TaskFlowProjectsModal
        isOpen={isProjectsModalOpen}
        projects={projects}
        tasks={tasks}
        isAdmin={isAdmin}
        onClose={() => setIsProjectsModalOpen(false)}
        onSaveProject={handleSaveProject}
        onDeleteProject={handleDeleteProject}
      />

      <TaskFlowMembersModal
        isOpen={isMembersModalOpen}
        members={members}
        currentUserId={currentUser.id}
        isAdmin={isAdmin}
        onClose={() => setIsMembersModalOpen(false)}
        onSaveMember={handleSaveMember}
        onDeleteMember={handleDeleteMember}
        onToggleActive={handleToggleMemberActive}
      />

      <TaskFlowUserSwitchModal
        isOpen={isUserSwitchModalOpen}
        currentUser={currentUser}
        members={members}
        onClose={() => setIsUserSwitchModalOpen(false)}
        onSwitchUser={handleSwitchUser}
      />

      <TaskFlowImportExportModal
        isOpen={isImportExportModalOpen}
        tasks={tasks}
        projects={projects}
        members={members}
        onClose={() => setIsImportExportModalOpen(false)}
        onImportTasks={handleImportTasks}
        onResetData={handleResetData}
      />
    </div>
  );
};
