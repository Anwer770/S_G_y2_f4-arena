import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  Clock,
  Calendar,
  User,
  Users,
  FolderKanban,
  Tag,
  AlertTriangle,
  Flame,
  CheckCircle2,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Archive,
  Play,
  Pause,
  ExternalLink,
  ChevronDown,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import {
  WorkTask,
  WorkProject,
  TeamMember,
  TaskStatus,
  TaskPriority,
} from '../../types/workos';

interface WorkOSTasksTabProps {
  tasks: WorkTask[];
  projects: WorkProject[];
  team: TeamMember[];
  onOpenTaskDetail: (task: WorkTask) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onUpdateTaskPriority: (taskId: string, priority: TaskPriority) => void;
  onUpdateTaskAssignee?: (taskId: string, assigneeId: string) => void;
  onUpdateTaskDueDate?: (taskId: string, dueDate: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDuplicateTask?: (task: WorkTask) => void;
  onArchiveTask?: (taskId: string) => void;
  density?: 'comfortable' | 'compact';
}

export const WorkOSTasksTab: React.FC<WorkOSTasksTabProps> = ({
  tasks = [],
  projects = [],
  team = [],
  onOpenTaskDetail,
  onUpdateTaskStatus,
  onUpdateTaskPriority,
  onUpdateTaskAssignee,
  onUpdateTaskDueDate,
  onDeleteTask,
  onDuplicateTask,
  onArchiveTask,
  density = 'comfortable',
}) => {
  // Selected tasks for bulk operations
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [activeActionMenuTaskId, setActiveActionMenuTaskId] = useState<string | null>(null);

  // Quick edit date inline modal
  const [dateEditTaskId, setDateEditTaskId] = useState<string | null>(null);
  const [tempDueDate, setTempDueDate] = useState<string>('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Map Project and Member lookups for zero latency
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

  // Status badge styling
  const renderStatusSelector = (task: WorkTask) => {
    const currentStatus = task.status;
    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
    let label = 'لم تبدأ';

    if (currentStatus === 'in_progress') {
      badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'قيد التنفيذ';
    } else if (currentStatus === 'review') {
      badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
      label = 'قيد المراجعة';
    } else if (currentStatus === 'completed') {
      badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'مكتملة';
    } else if (currentStatus === 'delayed' || (task.dueDate && task.dueDate < todayStr)) {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'متأخرة';
    } else if (currentStatus === 'blocked') {
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'معلقة';
    }

    return (
      <select
        value={task.status}
        onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
        onClick={(e) => e.stopPropagation()}
        className={`px-2 py-0.5 rounded-lg text-xs font-bold border cursor-pointer focus:outline-hidden ${badgeClass}`}
      >
        <option value="planned">لم تبدأ</option>
        <option value="in_progress">قيد التنفيذ</option>
        <option value="review">قيد المراجعة</option>
        <option value="completed">مكتملة</option>
        <option value="delayed">متأخرة</option>
        <option value="blocked">معلقة</option>
      </select>
    );
  };

  // Priority badge styling
  const renderPrioritySelector = (task: WorkTask) => {
    let priClass = 'bg-slate-100 text-slate-600 border-slate-200';
    if (task.priority === 'urgent') priClass = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
    else if (task.priority === 'high') priClass = 'bg-amber-50 text-amber-800 border-amber-200 font-bold';
    else if (task.priority === 'medium') priClass = 'bg-blue-50 text-blue-700 border-blue-200 font-bold';
    else priClass = 'bg-slate-100 text-slate-600 border-slate-200';

    return (
      <select
        value={task.priority}
        onChange={(e) => onUpdateTaskPriority(task.id, e.target.value as TaskPriority)}
        onClick={(e) => e.stopPropagation()}
        className={`px-2 py-0.5 rounded-lg text-xs border cursor-pointer focus:outline-hidden ${priClass}`}
      >
        <option value="urgent">حرجة وعاجلة</option>
        <option value="high">عالية</option>
        <option value="medium">متوسطة</option>
        <option value="low">منخفضة</option>
      </select>
    );
  };

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map((t) => t.id));
    }
  };

  const handleToggleSelectTask = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkComplete = () => {
    selectedTaskIds.forEach((id) => onUpdateTaskStatus(id, 'completed'));
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف ${selectedTaskIds.length} مهام محددة؟`)) {
      selectedTaskIds.forEach((id) => onDeleteTask(id));
      setSelectedTaskIds([]);
    }
  };

  return (
    <div className="space-y-3" dir="rtl">
      {/* Bulk Action Bar if tasks selected */}
      {selectedTaskIds.length > 0 && (
        <div className="bg-teal-900 text-white p-3 rounded-xl flex items-center justify-between shadow-md text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-teal-300" />
            <span className="font-bold">تم تحديد {selectedTaskIds.length} مهمة</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkComplete}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer"
            >
              تعيين كمكتملة
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition cursor-pointer"
            >
              حذف المحدد
            </button>
            <button
              onClick={() => setSelectedTaskIds([])}
              className="px-3 py-1.5 bg-teal-800 hover:bg-teal-700 text-teal-100 rounded-xl transition cursor-pointer"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* Main Tasks Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs min-w-[960px] print:min-w-0">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-bold">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={tasks.length > 0 && selectedTaskIds.length === tasks.length}
                    onChange={handleSelectAll}
                    className="rounded text-teal-600 dark:text-teal-400 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 w-24">رقم المهمة</th>
                <th className="py-3 px-4 min-w-[200px]">اسم المهمة</th>
                <th className="py-3 px-3 min-w-[140px]">المشروع</th>
                <th className="py-3 px-3 min-w-[130px]">المسؤول</th>
                <th className="py-3 px-3">الحالة</th>
                <th className="py-3 px-3">الأولوية</th>
                <th className="py-3 px-3 min-w-[100px]">البداية</th>
                <th className="py-3 px-3 min-w-[110px]">الاستحقاق</th>
                <th className="py-3 px-3 w-28">نسبة الإنجاز</th>
                <th className="py-3 px-3 w-24">آخر تحديث</th>
                <th className="py-3 px-3 text-center w-16">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tasks.map((task) => {
                const isSelected = selectedTaskIds.includes(task.id);
                const isOverdue =
                  task.dueDate &&
                  task.dueDate < todayStr &&
                  task.status !== 'completed';
                const project = task.projectId ? projectMap.get(task.projectId) : undefined;
                const assignee = task.assigneeId ? teamMap.get(task.assigneeId) : undefined;

                return (
                  <tr
                    key={task.id}
                    onClick={() => onOpenTaskDetail(task)}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition cursor-pointer group ${
                      isSelected ? 'bg-teal-50/40' : ''
                    } ${isOverdue ? 'bg-rose-50/30' : ''} ${density === 'compact' ? 'py-1.5' : 'py-3'}`}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-3 px-3 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelectTask(task.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-teal-600 dark:text-teal-400 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                      />
                    </td>

                    {/* Task # */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-500 dark:text-slate-400 text-xs">
                      {task.taskNumber || 'TASK'}
                    </td>

                    {/* Task Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {task.title}
                        </span>
                        {isOverdue && (
                          <span className="px-1.5 py-0.2 rounded text-xs font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 shrink-0">
                            متأخرة!
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5 font-normal">
                          {task.description}
                        </p>
                      )}
                    </td>

                    {/* Project */}
                    <td className="py-3 px-3">
                      {project ? (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/60 dark:border-indigo-800/60 inline-flex items-center gap-1 max-w-[130px] truncate">
                          <FolderKanban className="w-3 h-3 shrink-0" />
                          <span className="truncate">{project.name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-xs">مهمة عامة</span>
                      )}
                    </td>

                    {/* Assignee */}
                    <td className="py-3 px-3">
                      {onUpdateTaskAssignee ? (
                        <select
                          value={task.assigneeId || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onUpdateTaskAssignee(task.id, e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-hidden max-w-[125px] truncate"
                        >
                          {team.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center shrink-0">
                            {assignee ? assignee.name.charAt(0) : '?'}
                          </div>
                          <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[90px]">
                            {assignee ? assignee.name : 'غير محدد'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      {renderStatusSelector(task)}
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      {renderPrioritySelector(task)}
                    </td>

                    {/* Start Date */}
                    <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400 text-xs">
                      {task.startDate || '—'}
                    </td>

                    {/* Due Date with inline quick edit */}
                    <td className="py-3 px-3 font-mono text-xs" onClick={(e) => e.stopPropagation()}>
                      {dateEditTaskId === task.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={tempDueDate}
                            onChange={(e) => setTempDueDate(e.target.value)}
                            className="px-1.5 py-0.5 rounded border border-teal-500 text-xs"
                          />
                          <button
                            onClick={() => {
                              if (onUpdateTaskDueDate && tempDueDate) {
                                onUpdateTaskDueDate(task.id, tempDueDate);
                              }
                              setDateEditTaskId(null);
                            }}
                            className="px-1.5 py-0.5 bg-teal-700 text-white rounded text-xs font-bold"
                          >
                            حفظ
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => {
                            setDateEditTaskId(task.id);
                            setTempDueDate(task.dueDate || todayStr);
                          }}
                          className={`cursor-pointer hover:underline ${
                            isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'
                          }`}
                          title="انقر لتعديل تاريخ الاستحقاق"
                        >
                          {task.dueDate || '—'}
                        </span>
                      )}
                    </td>

                    {/* Progress */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              task.status === 'completed'
                                ? 'bg-emerald-600'
                                : 'bg-teal-600'
                            }`}
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-700 dark:text-slate-200 text-xs font-bold">
                          {task.progress || 0}%
                        </span>
                      </div>
                    </td>

                    {/* Last Updated */}
                    <td className="py-3 px-3 font-mono text-slate-400 dark:text-slate-500 text-xs">
                      {task.updatedAt ? task.updatedAt.split('T')[0] : '—'}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() =>
                            setActiveActionMenuTaskId(
                              activeActionMenuTaskId === task.id ? null : task.id
                            )
                          }
                          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition cursor-pointer"
                          title="خيارات المهمة"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Action Dropdown Menu */}
                        {activeActionMenuTaskId === task.id && (
                          <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 z-50 text-xs animate-in fade-in zoom-in-95">
                            <button
                              onClick={() => {
                                setActiveActionMenuTaskId(null);
                                onOpenTaskDetail(task);
                              }}
                              className="w-full text-right px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              <span>فتح التفاصيل</span>
                            </button>

                            <button
                              onClick={() => {
                                setActiveActionMenuTaskId(null);
                                onOpenTaskDetail(task);
                              }}
                              className="w-full text-right px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>تعديل المهمة</span>
                            </button>

                            {onDuplicateTask && (
                              <button
                                onClick={() => {
                                  setActiveActionMenuTaskId(null);
                                  onDuplicateTask(task);
                                }}
                                className="w-full text-right px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span>نسخ المهمة</span>
                              </button>
                            )}

                            {onArchiveTask && (
                              <button
                                onClick={() => {
                                  setActiveActionMenuTaskId(null);
                                  onArchiveTask(task.id);
                                }}
                                className="w-full text-right px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                              >
                                <Archive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>أرشفة</span>
                              </button>
                            )}

                            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                            <button
                              onClick={() => {
                                setActiveActionMenuTaskId(null);
                                if (window.confirm('هل أنت متأكد من حذف هذه المهمة نهائياً؟')) {
                                  onDeleteTask(task.id);
                                }
                              }}
                              className="w-full text-right px-2.5 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف المهمة</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {tasks.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-sm text-slate-600 dark:text-slate-300">لا توجد مهام تطابق الفلاتر الحالية</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">جرّب تغيير خيارات البحث أو قم بإضافة مهمة جديدة</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
