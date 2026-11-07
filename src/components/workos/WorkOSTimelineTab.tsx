import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
} from 'lucide-react';
import {
  WorkProject,
  WorkTask,
  TeamMember,
} from '../../types/workos';

interface WorkOSTimelineTabProps {
  tasks: WorkTask[];
  projects: WorkProject[];
  team: TeamMember[];
  onOpenTaskDetail: (task: WorkTask) => void;
}

export const WorkOSTimelineTab: React.FC<WorkOSTimelineTabProps> = ({
  tasks = [],
  projects = [],
  team = [],
  onOpenTaskDetail,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
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

  // Filter tasks if project selected
  const displayedTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedProjectId !== 'all' && t.projectId !== selectedProjectId) return false;
      return true;
    });
  }, [tasks, selectedProjectId]);

  // Calculate task duration in days
  const getTaskDuration = (startDate?: string, dueDate?: string) => {
    if (!startDate && !dueDate) return 1;
    if (!startDate || !dueDate) return 3; // default
    const d1 = new Date(startDate);
    const d2 = new Date(dueDate);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Timeline Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-700 dark:text-teal-300" />
          <span className="font-bold text-slate-800 dark:text-slate-200">مخطط الجدول الزمني وجانت المبسط</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500 dark:text-slate-400 font-bold">تصفية حسب المشروع:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 cursor-pointer font-medium"
          >
            <option value="all">كافة المشاريع والمهام</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Timeline Overview */}
      {selectedProjectId === 'all' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>الجداول الزمنية الكلية للمشاريع:</span>
          </h3>

          <div className="space-y-2.5">
            {projects.map((proj) => {
              const projTasks = tasks.filter((t) => t.projectId === proj.id);
              const overdueTasks = projTasks.filter(
                (t) => t.dueDate && t.dueDate < todayStr && t.status !== 'completed'
              );

              return (
                <div
                  key={proj.id}
                  className="p-3 bg-slate-50/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/70 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 dark:text-slate-500 font-bold text-xs">{proj.code}</span>
                      <strong className="text-slate-900 dark:text-slate-100">{proj.name}</strong>
                      <span className="text-slate-400 dark:text-slate-500 text-xs">({proj.manager})</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                      <span>البداية: {proj.startDate}</span>
                      <span>الانتهاء: {proj.dueDate}</span>
                      <span className="font-bold text-indigo-700 dark:text-indigo-300">{proj.progress}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gantt / Task Timeline List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
          <span>المهام والجدول الزمني للأنشطة:</span>
          <span className="text-slate-400 dark:text-slate-500 font-normal">يتم تمييز المهام المتأخرة باللون الأحمر</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {displayedTasks.map((task) => {
            const isOverdue =
              task.dueDate &&
              task.dueDate < todayStr &&
              task.status !== 'completed';
            const project = task.projectId ? projectMap.get(task.projectId) : undefined;
            const assignee = task.assigneeId ? teamMap.get(task.assigneeId) : undefined;
            const duration = getTaskDuration(task.startDate, task.dueDate);

            return (
              <div
                key={task.id}
                onClick={() => onOpenTaskDetail(task)}
                className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isOverdue ? 'bg-rose-50/20' : ''
                }`}
              >
                {/* Task info */}
                <div className="space-y-1 min-w-[260px]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400 dark:text-slate-500 font-bold">{task.taskNumber}</span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{task.title}</h4>
                    {isOverdue && (
                      <span className="px-1.5 py-0.2 rounded text-xs font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
                        متأخرة!
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    {project && (
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">{project.name}</span>
                    )}
                    <span>•</span>
                    <span>المسؤول: <strong>{assignee ? assignee.name : 'غير محدد'}</strong></span>
                  </div>
                </div>

                {/* Timeline Bar Visual representation */}
                <div className="flex-1 max-w-md space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span>{task.startDate || 'البداية'}</span>
                    <span className="text-teal-700 dark:text-teal-300 font-bold">المدة: {duration} يوم</span>
                    <span>{task.dueDate || 'الاستحقاق'}</span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        task.status === 'completed'
                          ? 'bg-emerald-500'
                          : isOverdue
                          ? 'bg-rose-600'
                          : 'bg-teal-600'
                      }`}
                      style={{ width: `${Math.max(5, task.progress || 0)}%` }}
                    />
                  </div>
                </div>

                {/* Progress % and action */}
                <div className="flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-200 shrink-0">
                  <span className="font-bold">{task.progress || 0}%</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    task.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : isOverdue
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}>
                    {task.status === 'completed' ? 'منجز' : isOverdue ? 'متأخر' : 'جارٍ'}
                  </span>
                </div>
              </div>
            );
          })}

          {displayedTasks.length === 0 && (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
              لا توجد مهام مسجلة لعرضها في المخطط الزمني.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
