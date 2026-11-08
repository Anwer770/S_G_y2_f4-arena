import React from 'react';
import { WorkOSData, WorkTask, WorkProject, WorkActivityLog, TaskStatus, TaskPriority } from '../../types/workos';
import { triggerConfetti } from '../../utils/workosStorage';

export interface WorkOSTaskActionsParams {
  data: WorkOSData;
  setData: React.Dispatch<React.SetStateAction<WorkOSData>>;
  todayStr: string;
  activeTimerTask: WorkTask | null;
  handleStopTimer: () => void;
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
}

export interface WorkOSTaskActions {
  handleAddTask: (newTask: Partial<WorkTask>) => void;
  handleSaveTask: (updatedTask: WorkTask) => void;
  handleDeleteTask: (taskId: string) => void;
  handleUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  handleUpdateTaskPriority: (taskId: string, priority: TaskPriority) => void;
  handleUpdateTaskAssignee: (taskId: string, assigneeId: string) => void;
  handleUpdateTaskDueDate: (taskId: string, dueDate: string) => void;
  handleDuplicateTask: (task: WorkTask) => void;
  handleConvertToProjectFromTask: (task: WorkTask) => void;
}

/**
 * إجراءات المهام في «إدارة العمل» (R29) — مُستخرجة من WorkOSModule.tsx حرفياً.
 * كل الدوال تُعاد كما هي؛ الحالة تبقى في الوحدة الأم عبر data/setData.
 */
export const useWorkOSTaskActions = ({
  data,
  setData,
  todayStr,
  activeTimerTask,
  handleStopTimer,
  setCurrentTab,
}: WorkOSTaskActionsParams): WorkOSTaskActions => {
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
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, priority, updatedAt: new Date().toISOString() } : t)),
    }));
  };

  const handleUpdateTaskAssignee = (taskId: string, assigneeId: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, assigneeId, updatedAt: new Date().toISOString() } : t)),
    }));
  };

  const handleUpdateTaskDueDate = (taskId: string, dueDate: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, dueDate, updatedAt: new Date().toISOString() } : t)),
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

    const updatedTasks = data.tasks.map((t) => (t.id === task.id ? { ...t, projectId: newProject.id } : t));

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

  return {
    handleAddTask,
    handleSaveTask,
    handleDeleteTask,
    handleUpdateTaskStatus,
    handleUpdateTaskPriority,
    handleUpdateTaskAssignee,
    handleUpdateTaskDueDate,
    handleDuplicateTask,
    handleConvertToProjectFromTask,
  };
};
