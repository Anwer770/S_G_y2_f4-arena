import React, { useState, useMemo } from 'react';
import {
  TaskFlowTask,
  TaskFlowProject,
  TaskFlowMember,
} from '../../types/taskflow';
import { isTaskOverdue } from '../../utils/taskflowStorage';
import {
  Calendar,
  Clock,
  Layers,
  User,
  FolderKanban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface TaskFlowTimelineViewProps {
  tasks: TaskFlowTask[];
  projects: TaskFlowProject[];
  members: TaskFlowMember[];
  onOpenTaskModal: (task: TaskFlowTask) => void;
}

export const TaskFlowTimelineView: React.FC<TaskFlowTimelineViewProps> = ({
  tasks,
  projects,
  members,
  onOpenTaskModal,
}) => {
  const [groupBy, setGroupBy] = useState<'project' | 'assignee' | 'none'>('project');

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  // Compute overall timeline date span
  const { minDate, maxDate, totalDays, datesList } = useMemo(() => {
    let earliest = '2026-08-20';
    let latest = '2026-09-20';

    tasks.forEach((t) => {
      if (t.startDate && t.startDate < earliest) earliest = t.startDate;
      if (t.dueDate && t.dueDate > latest) latest = t.dueDate;
    });

    const start = new Date(earliest);
    const end = new Date(latest);
    // Add buffer of 3 days before and after
    start.setDate(start.getDate() - 2);
    end.setDate(end.getDate() + 3);

    const list: string[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      list.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }

    return {
      minDate: list[0],
      maxDate: list[list.length - 1],
      totalDays: list.length,
      datesList: list,
    };
  }, [tasks]);

  // Grouping tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return [{ id: 'all', title: 'جميع المهام', color: '#6366f1', tasks }];
    }

    if (groupBy === 'project') {
      return projects.map((p) => ({
        id: p.id,
        title: p.name,
        color: p.color,
        tasks: tasks.filter((t) => t.projectId === p.id),
      }));
    }

    // Group by Assignee
    const memberGroups = members.map((m) => ({
      id: m.id,
      title: m.name,
      color: m.avatarColor,
      tasks: tasks.filter((t) => t.assigneeId === m.id),
    }));

    const unassignedTasks = tasks.filter((t) => !t.assigneeId);
    if (unassignedTasks.length > 0) {
      memberGroups.push({
        id: 'unassigned',
        title: 'مهام غير مسندة',
        color: '#94a3b8',
        tasks: unassignedTasks,
      });
    }

    return memberGroups;
  }, [tasks, projects, members, groupBy]);

  // Calculate position & width percentage of a task bar
  const getTaskBarCoords = (task: TaskFlowTask) => {
    const sDate = task.startDate || task.dueDate || minDate;
    const eDate = task.dueDate || task.startDate || maxDate;

    const startIndex = datesList.indexOf(sDate);
    const endIndex = datesList.indexOf(eDate);

    const safeStart = startIndex >= 0 ? startIndex : 0;
    const safeEnd = endIndex >= 0 ? endIndex : Math.min(safeStart + 2, totalDays - 1);

    const leftPercent = (safeStart / totalDays) * 100;
    const widthPercent = Math.max(((safeEnd - safeStart + 1) / totalDays) * 100, 2.5);

    return { leftPercent, widthPercent };
  };

  const overdueCount = tasks.filter((t) => isTaskOverdue(t)).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Timeline Controls Toolbar */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">الجدول الزمني ومسار الإنجاز (Gantt Timeline)</h3>
            <p className="text-xs text-slate-500">
              عرض زمني تفاعلي لتوزيع المهام حسب تواريخ البداية والاستحقاق
            </p>
          </div>
        </div>

        {/* Group By selector & Overdue indicator */}
        <div className="flex items-center gap-3">
          {overdueCount > 0 && (
            <span className="px-2.5 py-1 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black flex items-center gap-1.5 animate-pulse">
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              <span>{overdueCount} مهام متأخرة</span>
            </span>
          )}

          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
            <span className="px-2 text-slate-500 text-xs">تجميع حسب:</span>
            <button
              onClick={() => setGroupBy('project')}
              className={`px-3 py-1 rounded-lg transition-all ${
                groupBy === 'project' ? 'bg-white text-indigo-700 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              المشروع
            </button>
            <button
              onClick={() => setGroupBy('assignee')}
              className={`px-3 py-1 rounded-lg transition-all ${
                groupBy === 'assignee' ? 'bg-white text-indigo-700 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              المسؤول
            </button>
            <button
              onClick={() => setGroupBy('none')}
              className={`px-3 py-1 rounded-lg transition-all ${
                groupBy === 'none' ? 'bg-white text-indigo-700 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل
            </button>
          </div>
        </div>
      </div>

      {/* Main Gantt Grid Area */}
      <div className="overflow-x-auto min-h-[450px]">
        <div className="min-w-[950px] p-6">
          {/* Header Row of Days */}
          <div className="flex border-b border-slate-200 pb-2 mb-4 text-xs font-mono text-slate-500">
            <div className="w-64 shrink-0 font-bold font-sans text-xs text-slate-700">المهمة / المجموعة</div>
            <div className="flex-1 flex justify-between px-2">
              <span className="font-bold text-slate-800">{minDate}</span>
              <span className="text-slate-400">--- المسار الزمني للمهام ---</span>
              <span className="font-bold text-slate-800">{maxDate}</span>
            </div>
          </div>

          {/* Grouped Rows */}
          <div className="space-y-6">
            {groupedTasks.map((group) => {
              if (group.tasks.length === 0) return null;

              return (
                <div key={group.id} className="space-y-2">
                  {/* Group Title Header */}
                  <div className="flex items-center gap-2 py-1 px-2.5 rounded-xl bg-slate-100/80 border border-slate-200/80">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
                    <span className="text-xs font-black text-slate-900">{group.title}</span>
                    <span className="text-xs text-slate-500 font-mono">({group.tasks.length} مهمة)</span>
                  </div>

                  {/* Tasks Rows */}
                  <div className="space-y-2">
                    {group.tasks.map((task) => {
                      const overdue = isTaskOverdue(task);
                      const project = projectMap.get(task.projectId);
                      const member = memberMap.get(task.assigneeId || '');
                      const { leftPercent, widthPercent } = getTaskBarCoords(task);

                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-4 py-1.5 hover:bg-slate-50 rounded-xl transition-colors group"
                        >
                          {/* Task Label on left side */}
                          <div
                            onClick={() => onOpenTaskModal(task)}
                            className="w-64 shrink-0 cursor-pointer flex flex-col justify-center"
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-xs font-bold truncate group-hover:text-indigo-600 transition-colors ${
                                  task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'
                                }`}
                              >
                                {task.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                              <span>{member ? member.name.split(' ')[0] : 'بدون مسؤول'}</span>
                              <span>•</span>
                              <span>{task.dueDate}</span>
                            </div>
                          </div>

                          {/* Horizontal Timeline Track */}
                          <div className="flex-1 relative h-9 bg-slate-100/60 rounded-xl overflow-hidden border border-slate-200/50">
                            {/* Grid vertical markers */}
                            <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                              <div className="border-r border-slate-400 h-full" />
                              <div className="border-r border-slate-400 h-full" />
                              <div className="border-r border-slate-400 h-full" />
                              <div className="border-r border-slate-400 h-full" />
                            </div>

                            {/* Task Bar */}
                            <div
                              onClick={() => onOpenTaskModal(task)}
                              title={`${task.title} (${task.startDate} إلى ${task.dueDate})`}
                              className={`absolute top-1 bottom-1 rounded-lg cursor-pointer flex items-center justify-between px-2.5 text-xs font-bold text-white shadow-xs transition-transform hover:scale-[1.01] ${
                                overdue
                                  ? 'bg-rose-500 ring-2 ring-rose-300 ring-offset-1'
                                  : task.status === 'completed'
                                  ? 'bg-emerald-600 opacity-80'
                                  : 'bg-indigo-600'
                              }`}
                              style={{
                                left: `${leftPercent}%`,
                                width: `${widthPercent}%`,
                                backgroundColor: overdue
                                  ? '#ef4444'
                                  : project?.color || (task.status === 'completed' ? '#10b981' : '#6366f1'),
                              }}
                            >
                              <span className="truncate drop-shadow-xs">{task.title}</span>
                              {overdue && (
                                <span className="bg-white/25 px-1 rounded text-xs font-mono shrink-0 ml-1">
                                  متأخرة!
                                </span>
                              )}
                              {task.status === 'completed' && (
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 ml-1" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
