import React, { useMemo } from 'react';
import {
  Flame,
  Calendar,
  Users,
  Inbox,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  FolderKanban,
  CheckCircle2,
} from 'lucide-react';
import {
  WorkTask,
  WorkProject,
  TeamMember,
  TaskPriority,
} from '../../types/workos';

interface WorkOSPrioritiesTabProps {
  tasks: WorkTask[];
  projects: WorkProject[];
  team: TeamMember[];
  onOpenTaskDetail: (task: WorkTask) => void;
  onUpdateTaskPriority: (taskId: string, priority: TaskPriority) => void;
}

export const WorkOSPrioritiesTab: React.FC<WorkOSPrioritiesTabProps> = ({
  tasks = [],
  projects = [],
  team = [],
  onOpenTaskDetail,
  onUpdateTaskPriority,
}) => {
  const projectMap = useMemo(() => {
    const map = new Map<string, WorkProject>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  // Quadrants of Eisenhower Matrix:
  // Q1: Urgent & Important (عاجل ومهم - افعل الآن) -> priority: 'urgent'
  // Q2: Not Urgent & Important (مهم وغير عاجل - خطط له) -> priority: 'high'
  // Q3: Urgent & Not Important (عاجل وغير مهم - فوضه أو سرعه) -> priority: 'medium'
  // Q4: Not Urgent & Not Important (غير عاجل وغير مهم - احذفه أو راجعه) -> priority: 'low' or 'none'

  const quadrants = useMemo(() => {
    const q1: WorkTask[] = [];
    const q2: WorkTask[] = [];
    const q3: WorkTask[] = [];
    const q4: WorkTask[] = [];

    tasks.forEach((t) => {
      if (t.priority === 'urgent') q1.push(t);
      else if (t.priority === 'high') q2.push(t);
      else if (t.priority === 'medium') q3.push(t);
      else q4.push(t);
    });

    return { q1, q2, q3, q4 };
  }, [tasks]);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Intro strip */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between text-xs">
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200">مصفوفة أيزنهاور لتحديد الأولويات (2×2)</span>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            رتب المهام حسب العجلة والأهمية، واستخدم القوائم المنسدلة لنقل المهام وتعديل الأولويات مباشرة.
          </p>
        </div>
      </div>

      {/* 2x2 Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Q1: Urgent & Important (عاجل ومهم) */}
        <div className="bg-rose-50/40 dark:bg-rose-950/40 rounded-xl border-2 border-rose-200/80 dark:border-rose-800/80 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-800 pb-2">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-black text-xs">
              <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
              <span>1. عاجل ومهم (افعل الآن)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono text-xs font-bold">
              {quadrants.q1.length}
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
            {quadrants.q1.map((task) => (
              <div
                key={task.id}
                onClick={() => onOpenTaskDetail(task)}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-800 shadow-2xs hover:border-rose-400 transition cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">{task.title}</h4>
                  <select
                    value={task.priority}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdateTaskPriority(task.id, e.target.value as TaskPriority)}
                    className="text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800 rounded px-1.5 py-0.5 cursor-pointer focus:outline-hidden"
                  >
                    <option value="urgent">Q1 عاجل ومهم</option>
                    <option value="high">Q2 مهم وغير عاجل</option>
                    <option value="medium">Q3 عاجل وغير مهم</option>
                    <option value="low">Q4 غير عاجل وغير مهم</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-mono">
                  <span>{task.dueDate || 'بدون استحقاق'}</span>
                  <span>{task.progress || 0}%</span>
                </div>
              </div>
            ))}

            {quadrants.q1.length === 0 && (
              <div className="text-center py-8 text-rose-300 text-xs font-medium">
                لا توجد مهام حرجة في هذا المربع.
              </div>
            )}
          </div>
        </div>

        {/* Q2: Important & Not Urgent (مهم وغير عاجل) */}
        <div className="bg-indigo-50/40 dark:bg-indigo-950/40 rounded-xl border-2 border-indigo-200/80 dark:border-indigo-800/80 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-200 dark:border-indigo-800 pb-2">
            <div className="flex items-center gap-2 text-indigo-800 font-black text-xs">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>2. مهم وغير عاجل (خطط له)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-mono text-xs font-bold">
              {quadrants.q2.length}
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
            {quadrants.q2.map((task) => (
              <div
                key={task.id}
                onClick={() => onOpenTaskDetail(task)}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-2xs hover:border-indigo-400 transition cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">{task.title}</h4>
                  <select
                    value={task.priority}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdateTaskPriority(task.id, e.target.value as TaskPriority)}
                    className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 rounded px-1.5 py-0.5 cursor-pointer focus:outline-hidden"
                  >
                    <option value="high">Q2 مهم وغير عاجل</option>
                    <option value="urgent">Q1 عاجل ومهم</option>
                    <option value="medium">Q3 عاجل وغير مهم</option>
                    <option value="low">Q4 غير عاجل وغير مهم</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-mono">
                  <span>{task.dueDate || 'بدون استحقاق'}</span>
                  <span>{task.progress || 0}%</span>
                </div>
              </div>
            ))}

            {quadrants.q2.length === 0 && (
              <div className="text-center py-8 text-indigo-300 text-xs font-medium">
                لا توجد مهام في هذا المربع.
              </div>
            )}
          </div>
        </div>

        {/* Q3: Urgent & Not Important (عاجل وغير مهم) */}
        <div className="bg-amber-50/40 dark:bg-amber-950/40 rounded-xl border-2 border-amber-200/80 dark:border-amber-800/80 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800 pb-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-black text-xs">
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>3. عاجل وغير مهم (فوّض أو سرّع)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white font-mono text-xs font-bold">
              {quadrants.q3.length}
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
            {quadrants.q3.map((task) => (
              <div
                key={task.id}
                onClick={() => onOpenTaskDetail(task)}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800 shadow-2xs hover:border-amber-400 transition cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">{task.title}</h4>
                  <select
                    value={task.priority}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdateTaskPriority(task.id, e.target.value as TaskPriority)}
                    className="text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800 rounded px-1.5 py-0.5 cursor-pointer focus:outline-hidden"
                  >
                    <option value="medium">Q3 عاجل وغير مهم</option>
                    <option value="urgent">Q1 عاجل ومهم</option>
                    <option value="high">Q2 مهم وغير عاجل</option>
                    <option value="low">Q4 غير عاجل وغير مهم</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-mono">
                  <span>{task.dueDate || 'بدون استحقاق'}</span>
                  <span>{task.progress || 0}%</span>
                </div>
              </div>
            ))}

            {quadrants.q3.length === 0 && (
              <div className="text-center py-8 text-amber-300 text-xs font-medium">
                لا توجد مهام في هذا المربع.
              </div>
            )}
          </div>
        </div>

        {/* Q4: Not Urgent & Not Important (غير عاجل وغير مهم) */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border-2 border-slate-200/80 dark:border-slate-700/80 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-black text-xs">
              <Inbox className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>4. غير عاجل وغير مهم (راجع أو تخلّص)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-600 text-white font-mono text-xs font-bold">
              {quadrants.q4.length}
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
            {quadrants.q4.map((task) => (
              <div
                key={task.id}
                onClick={() => onOpenTaskDetail(task)}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-slate-400 transition cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">{task.title}</h4>
                  <select
                    value={task.priority}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdateTaskPriority(task.id, e.target.value as TaskPriority)}
                    className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 cursor-pointer focus:outline-hidden"
                  >
                    <option value="low">Q4 غير عاجل وغير مهم</option>
                    <option value="urgent">Q1 عاجل ومهم</option>
                    <option value="high">Q2 مهم وغير عاجل</option>
                    <option value="medium">Q3 عاجل وغير مهم</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-mono">
                  <span>{task.dueDate || 'بدون استحقاق'}</span>
                  <span>{task.progress || 0}%</span>
                </div>
              </div>
            ))}

            {quadrants.q4.length === 0 && (
              <div className="text-center py-8 text-slate-300 text-xs font-medium">
                لا توجد مهام في هذا المربع.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
