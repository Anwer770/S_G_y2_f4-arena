import React, { useState, useMemo } from 'react';
import { WorkTask, WorkProject, TeamMember, TaskPriority } from '../../types/workos';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Flame,
  FolderKanban,
  LayoutGrid,
  MoveRight,
  Plus,
  Search,
  Sparkles,
  Target,
  User,
  Users,
  Zap,
} from 'lucide-react';

interface WorkOSEisenhowerMatrixProps {
  tasks: WorkTask[];
  projects: WorkProject[];
  team: TeamMember[];
  onOpenTaskDetail: (task: WorkTask) => void;
  onOpenQuickAdd: (type?: string, projectId?: string, priority?: TaskPriority) => void;
  onUpdateTaskStatus: (id: string, status: any) => void;
  onUpdateTaskPriority: (id: string, priority: TaskPriority) => void;
}

export const WorkOSEisenhowerMatrix: React.FC<WorkOSEisenhowerMatrixProps> = ({
  tasks = [],
  projects = [],
  team = [],
  onOpenTaskDetail,
  onOpenQuickAdd,
  onUpdateTaskStatus,
  onUpdateTaskPriority,
}) => {
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [hideCompleted, setHideCompleted] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === 'archived' || t.status === 'cancelled') return false;
      if (hideCompleted && t.status === 'completed') return false;
      if (projectFilter !== 'all' && t.projectId !== projectFilter) return false;
      if (search) {
        const q = search.toLowerCase().trim();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchNum = t.taskNumber.toLowerCase().includes(q);
        const matchCust = t.customerRef?.toLowerCase().includes(q);
        if (!matchTitle && !matchNum && !matchCust) return false;
      }
      return true;
    });
  }, [tasks, search, projectFilter, hideCompleted]);

  // Eisenhower categorization:
  // Q1 (Do First - عاجل ومهم): priority === 'urgent' OR (priority === 'high' && (dueDate <= todayStr || status === 'in_progress'))
  // Q2 (Schedule - مهم وغير عاجل): (priority === 'high' && dueDate > todayStr) OR (priority === 'medium' && Boolean(t.projectId))
  // Q3 (Delegate - عاجل وغير مهم): (priority === 'medium' && !t.projectId) OR (priority === 'low' && dueDate <= todayStr)
  // Q4 (Eliminate / Backlog - غير عاجل وغير مهم): priority === 'low' || priority === 'none'
  const quadrants = useMemo(() => {
    const q1: WorkTask[] = [];
    const q2: WorkTask[] = [];
    const q3: WorkTask[] = [];
    const q4: WorkTask[] = [];

    filteredTasks.forEach((task) => {
      const isUrgent = task.priority === 'urgent' || (task.dueDate && task.dueDate <= todayStr);
      const isImportant = task.priority === 'urgent' || task.priority === 'high';

      if (task.priority === 'urgent') {
        q1.push(task);
      } else if (task.priority === 'high') {
        if (task.dueDate && task.dueDate <= todayStr) {
          q1.push(task);
        } else {
          q2.push(task);
        }
      } else if (task.priority === 'medium') {
        if (task.dueDate && task.dueDate <= todayStr) {
          q3.push(task);
        } else {
          q2.push(task);
        }
      } else {
        // low or none
        if (task.dueDate && task.dueDate <= todayStr) {
          q3.push(task);
        } else {
          q4.push(task);
        }
      }
    });

    return { q1, q2, q3, q4 };
  }, [filteredTasks, todayStr]);

  const totalFiltered = filteredTasks.length || 1;

  const renderTaskCard = (task: WorkTask, currentQ: 'q1' | 'q2' | 'q3' | 'q4') => {
    const isCompleted = task.status === 'completed';
    const isOverdue = task.dueDate && task.dueDate < todayStr && !isCompleted;
    const isToday = task.dueDate === todayStr;
    const project = projects.find((p) => p.id === task.projectId);
    const assignee = team.find((m) => m.id === task.assigneeId);

    return (
      <div
        key={task.id}
        className={`bg-white rounded-xl p-3 border shadow-2xs transition-all space-y-2 group ${
          isCompleted
            ? 'opacity-60 bg-slate-50/80 border-slate-200'
            : isOverdue
            ? 'border-rose-300 hover:border-rose-400 hover:shadow-xs'
            : 'border-slate-200/90 hover:border-teal-500 hover:shadow-xs'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Completion Checkbox */}
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateTaskStatus(task.id, isCompleted ? 'in_progress' : 'completed');
              }}
              className="mt-0.5 shrink-0 text-slate-300 hover:text-emerald-600 transition cursor-pointer"
              title={isCompleted ? 'إعادة فتح المهمة' : 'تعيين كمكتملة'}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-50" />
              ) : (
                <div className="w-4 h-4 rounded-md border border-slate-300 group-hover:border-teal-600" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <button
                onClick={() => onOpenTaskDetail(task)}
                className={`text-xs font-bold text-slate-800 hover:text-teal-700 text-right leading-snug cursor-pointer block ${
                  isCompleted ? 'line-through text-slate-400' : ''
                }`}
              >
                {task.title}
              </button>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
                <span>{task.taskNumber}</span>
                {task.customerRef && (
                  <>
                    <span>•</span>
                    <span className="text-indigo-600 font-sans font-bold">{task.customerRef}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Quadrant / Priority Shift */}
          <div className="shrink-0 flex items-center gap-1">
            <select
              value={task.priority}
              onChange={(e) => onUpdateTaskPriority(task.id, e.target.value as TaskPriority)}
              className="text-xs font-bold py-0.5 px-1 rounded border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer"
              title="تغيير الأولوية لنقل المهمة بين أرباع المصفوفة"
            >
              <option value="urgent">🔴 عاجلة (Q1)</option>
              <option value="high">🔵 هامة (Q2)</option>
              <option value="medium">🟡 متوسطة (Q3)</option>
              <option value="low">⚪ منخفضة (Q4)</option>
            </select>
          </div>
        </div>

        {/* Project Tag & Subtasks */}
        <div className="flex items-center justify-between gap-1 text-xs pt-1.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 min-w-0">
            {project ? (
              <span className="truncate max-w-[120px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">
                {project.name}
              </span>
            ) : (
              <span className="text-slate-400">{task.category || 'عام'}</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Due Date Indicator */}
            {task.dueDate && (
              <span
                className={`font-mono px-1.5 py-0.5 rounded font-bold text-xs ${
                  isOverdue
                    ? 'bg-rose-100 text-rose-800'
                    : isToday
                    ? 'bg-amber-100 text-amber-800 font-black'
                    : 'text-slate-500 bg-slate-100'
                }`}
              >
                {task.dueDate}
              </span>
            )}

            {/* Assignee Avatar */}
            {assignee && (
              <div
                className={`w-4 h-4 rounded-full ${assignee.avatarColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                title={`المسؤول: ${assignee.name}`}
              >
                {assignee.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Matrix Strategy Explanation Ribbon */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>مصفوفة أيزنهاور الاستراتيجية لتحديد الأولويات (Eisenhower 2x2 Matrix)</span>
              <span className="text-xs bg-teal-50 text-teal-800 font-black px-2 py-0.5 rounded-full border border-teal-200">
                إدارة الوقت الذكية
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              تصنيف المهام والأعمال حسب الأهمية والاستعجال لاتخاذ القرارات: نفّذ، خطط، فوّض، أو تخلص.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في المصفوفة..."
              className="pr-8 pl-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">كافة المشاريع</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              className="rounded text-teal-600 border-slate-300"
            />
            <span>إخفاء المكتملة</span>
          </label>
        </div>
      </div>

      {/* 2x2 Interactive Quadrants Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ========================================================= */}
        {/* QUADRANT 1: URGENT & IMPORTANT (DO FIRST)                 */}
        {/* ========================================================= */}
        <div className="rounded-xl border-2 border-rose-300/80 bg-rose-50/30 p-4 flex flex-col min-h-[480px] shadow-2xs">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-rose-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                Q1
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-slate-900 text-sm">عاجل ومهم • نفّذ فوراً (Do First)</h4>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-black">
                    {quadrants.q1.length}
                  </span>
                </div>
                <p className="text-xs text-rose-800/80 font-medium mt-0.5">
                  أزمات، مواعيد نهائية حرجة، وأولويات قصوى لا تحتمل التأخير
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenQuickAdd('task', undefined, 'urgent')}
              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer shrink-0"
              title="إضافة مهمة ذات أولوية قصوى فورية"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>مهمة لـ Q1</span>
            </button>
          </div>

          {/* Cards List */}
          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[450px] pr-1 scrollbar-thin">
            {quadrants.q1.map((task) => renderTaskCard(task, 'q1'))}
            {quadrants.q1.length === 0 && (
              <div className="py-16 text-center text-rose-300 text-xs font-medium">
                ممتاز! لا توجد أزمات أو مهام عاجلة جداً متراكمة حالياً.
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* QUADRANT 2: NOT URGENT & IMPORTANT (SCHEDULE / PLAN)      */}
        {/* ========================================================= */}
        <div className="rounded-xl border-2 border-indigo-300/80 bg-indigo-50/30 p-4 flex flex-col min-h-[480px] shadow-2xs">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-indigo-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                Q2
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-slate-900 text-sm">مهم وغير عاجل • خطط وجدول (Schedule)</h4>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black">
                    {quadrants.q2.length}
                  </span>
                </div>
                <p className="text-xs text-indigo-800/80 font-medium mt-0.5">
                  التطوير المستقبلي، الفرص الاستراتيجية، وبناء الأنظمة المستدامة
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenQuickAdd('task', undefined, 'high')}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer shrink-0"
              title="إضافة مهمة استراتيجية مجدولة"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>مهمة لـ Q2</span>
            </button>
          </div>

          {/* Cards List */}
          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[450px] pr-1 scrollbar-thin">
            {quadrants.q2.map((task) => renderTaskCard(task, 'q2'))}
            {quadrants.q2.length === 0 && (
              <div className="py-16 text-center text-indigo-300 text-xs font-medium">
                لا توجد مهام استراتيجية مجدولة حالياً. خصص وقتاً للتخطيط!
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* QUADRANT 3: URGENT & NOT IMPORTANT (DELEGATE)             */}
        {/* ========================================================= */}
        <div className="rounded-xl border-2 border-amber-300/80 bg-amber-50/30 p-4 flex flex-col min-h-[480px] shadow-2xs">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-amber-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                Q3
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-slate-900 text-sm">عاجل وغير مهم • فوّض ونسّق (Delegate)</h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                    {quadrants.q3.length}
                  </span>
                </div>
                <p className="text-xs text-amber-800/80 font-medium mt-0.5">
                  مقاطعات روتينية، مكالمات، وتكليفات يمكن تفويضها لأعضاء الفريق
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenQuickAdd('task', undefined, 'medium')}
              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer shrink-0"
              title="إضافة مهمة للتفويض والمتابعة"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>مهمة لـ Q3</span>
            </button>
          </div>

          {/* Cards List */}
          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[450px] pr-1 scrollbar-thin">
            {quadrants.q3.map((task) => renderTaskCard(task, 'q3'))}
            {quadrants.q3.length === 0 && (
              <div className="py-16 text-center text-amber-300 text-xs font-medium">
                لا توجد مهام تفويض متراكمة حالياً.
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* QUADRANT 4: NOT URGENT & NOT IMPORTANT (ELIMINATE)        */}
        {/* ========================================================= */}
        <div className="rounded-xl border-2 border-slate-300/80 bg-slate-50/50 p-4 flex flex-col min-h-[480px] shadow-2xs">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                Q4
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-slate-900 text-sm">غير عاجل وغير مهم • أرجئ أو تخلص (Eliminate)</h4>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-xs font-black">
                    {quadrants.q4.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  مهام ثانوية، أنشطة منخفضة الأثر، أو أفكار قابلة للأرشفة أو الإلغاء
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenQuickAdd('task', undefined, 'low')}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer shrink-0"
              title="إضافة مهمة مؤجلة أو منخفضة الأثر"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>مهمة لـ Q4</span>
            </button>
          </div>

          {/* Cards List */}
          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[450px] pr-1 scrollbar-thin">
            {quadrants.q4.map((task) => renderTaskCard(task, 'q4'))}
            {quadrants.q4.length === 0 && (
              <div className="py-16 text-center text-slate-300 text-xs font-medium">
                لا توجد مهام ثانوية أو مؤجلة في هذا الربع.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
