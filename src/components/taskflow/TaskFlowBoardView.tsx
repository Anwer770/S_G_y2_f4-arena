import React, { useState } from 'react';
import {
  TaskFlowTask,
  TaskFlowProject,
  TaskFlowMember,
  TaskFlowStatus,
} from '../../types/taskflow';
import { isTaskOverdue } from '../../utils/taskflowStorage';
import {
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Plus,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Flag,
} from 'lucide-react';

interface TaskFlowBoardViewProps {
  tasks: TaskFlowTask[];
  projects: TaskFlowProject[];
  members: TaskFlowMember[];
  onOpenTaskModal: (task?: TaskFlowTask, initialStatus?: TaskFlowStatus) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskFlowStatus) => void;
  onDeleteTask: (taskId: string) => void;
}

const COLUMNS: { id: TaskFlowStatus; title: string; subtitle: string; color: string; badge: string }[] = [
  {
    id: 'todo',
    title: 'قيد الانتظار',
    subtitle: 'To Do',
    color: 'border-slate-300 bg-slate-50/70',
    badge: 'bg-slate-200 text-slate-700',
  },
  {
    id: 'in_progress',
    title: 'قيد التنفيذ',
    subtitle: 'In Progress',
    color: 'border-amber-300 bg-amber-50/40',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'completed',
    title: 'المكتملة',
    subtitle: 'Completed',
    color: 'border-emerald-300 bg-emerald-50/40',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
];

export const TaskFlowBoardView: React.FC<TaskFlowBoardViewProps> = ({
  tasks,
  projects,
  members,
  onOpenTaskModal,
  onUpdateTaskStatus,
  onDeleteTask,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeDropCol, setActiveDropCol] = useState<TaskFlowStatus | null>(null);

  const projectMap = new Map<string, TaskFlowProject>(projects.map((p) => [p.id, p]));
  const memberMap = new Map<string, TaskFlowMember>(members.map((m) => [m.id, m]));

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: TaskFlowStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropCol !== colId) {
      setActiveDropCol(colId);
    }
  };

  const handleDragLeave = () => {
    setActiveDropCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetColId: TaskFlowStatus) => {
    e.preventDefault();
    setActiveDropCol(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onUpdateTaskStatus(taskId, targetColId);
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        const isDropTarget = activeDropCol === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`rounded-xl border transition-all duration-200 p-4 flex flex-col min-h-[550px] ${
              isDropTarget
                ? 'ring-2 ring-indigo-500 bg-indigo-50/50 border-indigo-300'
                : 'bg-white border-slate-200/90 shadow-xs'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    col.id === 'todo'
                      ? 'bg-slate-400'
                      : col.id === 'in_progress'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
                <h3 className="text-sm font-black text-slate-900">{col.title}</h3>
                <span className="text-xs text-slate-400 font-mono">({col.subtitle})</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${col.badge}`}>
                  {colTasks.length}
                </span>
              </div>

              <button
                onClick={() => onOpenTaskModal(undefined, col.id)}
                title="إضافة مهمة سريعة في هذا العمود"
                className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task Cards List */}
            <div className="flex-1 space-y-3 overflow-y-auto">
              {colTasks.length === 0 ? (
                <div className="h-40 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                  <span>لا توجد مهام في هذا العمود</span>
                  <button
                    onClick={() => onOpenTaskModal(undefined, col.id)}
                    className="mt-2 text-indigo-600 font-bold hover:underline"
                  >
                    + أضف أول مهمة هنا
                  </button>
                </div>
              ) : (
                colTasks.map((task) => {
                  const project = projectMap.get(task.projectId);
                  const member = memberMap.get(task.assigneeId || '');
                  const overdue = isTaskOverdue(task);

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => onOpenTaskModal(task)}
                      className={`group p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing bg-white hover:shadow-md ${
                        overdue
                          ? 'border-rose-300 ring-1 ring-rose-200 shadow-rose-100'
                          : 'border-slate-200 hover:border-indigo-200'
                      }`}
                    >
                      {/* Project Tag & Overdue Badge Row */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: project?.color || '#6366f1' }}
                          />
                          <span className="text-xs font-bold text-slate-600 truncate max-w-[140px]">
                            {project?.name || 'مشروع عام'}
                          </span>
                        </div>

                        {overdue && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-black border border-rose-200 flex items-center gap-1 shrink-0 animate-pulse">
                            <Clock className="w-3 h-3 text-rose-600" />
                            متأخرة!
                          </span>
                        )}

                        {task.status === 'completed' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            تم الإنجاز
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4
                        className={`text-xs font-black text-slate-900 leading-snug mb-1.5 group-hover:text-indigo-600 transition-colors ${
                          task.status === 'completed' ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {task.title}
                      </h4>

                      {/* Description snippet */}
                      {task.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                          {task.description}
                        </p>
                      )}

                      {/* Footer: Assignee & Due Date */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        {/* Assignee */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          {member ? (
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 shadow-2xs"
                              style={{ backgroundColor: member.avatarColor }}
                              title={member.name}
                            >
                              {member.name.charAt(0)}
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold">
                              -
                            </div>
                          )}
                          <span className="text-xs text-slate-600 font-bold truncate max-w-[100px]">
                            {member ? member.name.split(' ')[0] : 'غير مسند'}
                          </span>
                        </div>

                        {/* Due Date & Quick Move Navigation */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex items-center gap-1 font-mono text-xs font-bold ${
                              overdue ? 'text-rose-600 font-black' : 'text-slate-500'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            {task.dueDate}
                          </span>

                          {/* Quick stage transition buttons */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
                          >
                            {col.id !== 'todo' && (
                              <button
                                onClick={() => {
                                  const target = col.id === 'completed' ? 'in_progress' : 'todo';
                                  onUpdateTaskStatus(task.id, target);
                                }}
                                title="إرجاع للمرحلة السابقة"
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs"
                              >
                                ▶
                              </button>
                            )}
                            {col.id !== 'completed' && (
                              <button
                                onClick={() => {
                                  const target = col.id === 'todo' ? 'in_progress' : 'completed';
                                  onUpdateTaskStatus(task.id, target);
                                }}
                                title="تقديم للمرحلة التالية"
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 flex items-center justify-center text-xs"
                              >
                                ◀
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
