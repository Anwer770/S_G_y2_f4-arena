import React, { useState, useMemo } from 'react';
import {
  FolderKanban,
  User,
  Clock,
  Calendar,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import {
  WorkTask,
  WorkProject,
  TeamMember,
  TaskStatus,
  TaskPriority,
} from '../../types/workos';

interface WorkOSKanbanTabProps {
  tasks: WorkTask[];
  projects: WorkProject[];
  team: TeamMember[];
  onOpenTaskDetail: (task: WorkTask) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
}

export const WorkOSKanbanTab: React.FC<WorkOSKanbanTabProps> = ({
  tasks = [],
  projects = [],
  team = [],
  onOpenTaskDetail,
  onUpdateTaskStatus,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const projectMap = useMemo(() => {
    const map = new Map<string, WorkProject>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  const teamMap = useMemo(() => {
    const map = new Map<string, TeamMember>();
    team.forEach((m) => map.set(m.id, m));
    return map;
  }, [team]);

  // The 5 Columns required by the user:
  // 1. لم تبدأ (Not Started)
  // 2. قيد التنفيذ (In Progress)
  // 3. قيد المراجعة (Under Review)
  // 4. مكتملة (Completed)
  // 5. متأخرة (Delayed)
  const columns: { id: TaskStatus; label: string; headerColor: string; borderColor: string }[] = [
    { id: 'planned', label: 'لم تبدأ', headerColor: 'bg-slate-100 text-slate-800', borderColor: 'border-slate-200' },
    { id: 'in_progress', label: 'قيد التنفيذ', headerColor: 'bg-blue-50 text-blue-800 border-blue-200', borderColor: 'border-blue-200' },
    { id: 'review', label: 'قيد المراجعة', headerColor: 'bg-purple-50 text-purple-800 border-purple-200', borderColor: 'border-purple-200' },
    { id: 'completed', label: 'مكتملة', headerColor: 'bg-emerald-50 text-emerald-800 border-emerald-200', borderColor: 'border-emerald-200' },
    { id: 'delayed', label: 'متأخرة', headerColor: 'bg-rose-50 text-rose-800 border-rose-200', borderColor: 'border-rose-200' },
  ];

  // Group tasks into these 5 columns
  const columnTasks = useMemo(() => {
    const groups: Record<TaskStatus, WorkTask[]> = {
      planned: [],
      in_progress: [],
      review: [],
      completed: [],
      delayed: [],
      new: [],
      ready: [],
      blocked: [],
      cancelled: [],
      archived: [],
    };

    tasks.forEach((t) => {
      // If overdue and uncompleted, and user has delayed column
      const isOverdue = t.dueDate && t.dueDate < todayStr && t.status !== 'completed';
      if (isOverdue && t.status !== 'delayed') {
        // Place in delayed or keep in status with badge
      }

      if (t.status === 'delayed' || (isOverdue && t.status !== 'completed' && t.status === 'blocked')) {
        groups.delayed.push(t);
      } else if (t.status === 'in_progress') {
        groups.in_progress.push(t);
      } else if (t.status === 'review') {
        groups.review.push(t);
      } else if (t.status === 'completed') {
        groups.completed.push(t);
      } else {
        groups.planned.push(t);
      }
    });

    return groups;
  }, [tasks, todayStr]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onUpdateTaskStatus(taskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  // Quick move helpers
  const getNextStatus = (current: TaskStatus): TaskStatus => {
    if (current === 'planned') return 'in_progress';
    if (current === 'in_progress') return 'review';
    if (current === 'review') return 'completed';
    return 'completed';
  };

  const getPrevStatus = (current: TaskStatus): TaskStatus => {
    if (current === 'completed') return 'review';
    if (current === 'review') return 'in_progress';
    if (current === 'in_progress') return 'planned';
    return 'planned';
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-start">
        {columns.map((col) => {
          const tasksInCol = columnTasks[col.id] || [];

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="bg-slate-50/70 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-3 min-h-[480px] flex flex-col space-y-2.5 transition"
            >
              {/* Column Header */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between font-bold text-xs ${col.headerColor}`}>
                <span className="flex items-center gap-1.5">
                  <span>{col.label}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80 font-mono text-xs shadow-2xs">
                  {tasksInCol.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[700px] no-scrollbar">
                {tasksInCol.map((task) => {
                  const isOverdue =
                    task.dueDate &&
                    task.dueDate < todayStr &&
                    task.status !== 'completed';
                  const project = task.projectId ? projectMap.get(task.projectId) : undefined;
                  const assignee = task.assigneeId ? teamMap.get(task.assigneeId) : undefined;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => onOpenTaskDetail(task)}
                      className={`bg-white dark:bg-slate-900 rounded-xl p-3.5 border shadow-2xs hover:shadow-md hover:border-teal-400 transition cursor-grab active:cursor-grabbing space-y-2.5 ${
                        isOverdue ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200/80'
                      }`}
                    >
                      {/* Priority & Overdue Indicator */}
                      <div className="flex items-center justify-between gap-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          task.priority === 'urgent'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : task.priority === 'high'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : task.priority === 'medium'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {task.priority === 'urgent'
                            ? 'حرجة'
                            : task.priority === 'high'
                            ? 'عالية'
                            : task.priority === 'medium'
                            ? 'متوسطة'
                            : 'منخفضة'}
                        </span>

                        {isOverdue && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            <span>متأخرة!</span>
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                        {task.title}
                      </h4>

                      {/* Project Name */}
                      {project && (
                        <div className="flex items-center gap-1 text-xs text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50/70 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900">
                          <FolderKanban className="w-3 h-3 shrink-0" />
                          <span className="truncate">{project.name}</span>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 font-mono">
                          <span>الإنجاز:</span>
                          <span className="font-bold text-teal-800 dark:text-teal-200">{task.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              task.status === 'completed' ? 'bg-emerald-500' : 'bg-teal-600'
                            }`}
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer: Assignee & Due Date */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center shrink-0">
                            {assignee ? assignee.name.charAt(0) : '?'}
                          </div>
                          <span className="text-xs truncate max-w-[80px]">
                            {assignee ? assignee.name : 'غير محدد'}
                          </span>
                        </div>

                        <span className={`text-xs font-mono ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                          {task.dueDate || '—'}
                        </span>
                      </div>

                      {/* Quick Move Buttons */}
                      <div className="pt-1 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onUpdateTaskStatus(task.id, getPrevStatus(task.status))}
                          className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="نقل للعمود السابق"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onUpdateTaskStatus(task.id, getNextStatus(task.status))}
                          className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="نقل للعمود التالي"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {tasksInCol.length === 0 && (
                  <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    اسحب المهام هنا
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
