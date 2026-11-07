import React, { useMemo } from 'react';
import {
  AlertTriangle,
  Flame,
  Clock,
  Calendar,
  FolderKanban,
  CheckCircle2,
  TrendingUp,
  Activity,
  ArrowRight,
  ChevronLeft,
  Users,
  Target,
} from 'lucide-react';
import {
  WorkTask,
  WorkProject,
  TeamMember,
  AppointmentItem,
  WorkActivityLog,
  GoalItem,
  WorkMeeting,
  WorkCommitment,
} from '../../types/workos';
// قراءة فقط لأغراض العرض (§22: الزيارات تبقى ملكاً لوحدة العملاء/الأطباء — لا نقل منطق)
import { customerService } from '../../services/crm/CustomerService';
import { doctorService } from '../../services/crm/DoctorService';

interface WorkOSOverviewTabProps {
  tasks: WorkTask[];
  projects: WorkProject[];
  team: TeamMember[];
  appointments?: AppointmentItem[];
  activities?: WorkActivityLog[];
  goals?: GoalItem[];
  meetings?: WorkMeeting[];
  commitments?: WorkCommitment[];
  onOpenTaskDetail: (task: WorkTask) => void;
  onNavigateToTab: (tab: string) => void;
  onSelectProject?: (projectId: string) => void;
}

export const WorkOSOverviewTab: React.FC<WorkOSOverviewTabProps> = ({
  tasks = [],
  projects = [],
  team = [],
  appointments = [],
  activities = [],
  goals = [],
  meetings = [],
  commitments = [],
  onOpenTaskDetail,
  onNavigateToTab,
  onSelectProject,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  /**
   * مؤشرات النظرة العامة المشتقة (§6) — كلها مشتقّة من بيانات قائمة، بلا أي حقل جديد
   * وبلا أي تخزين: لا مصدر حقيقة ثانٍ. (الزيارات تُقرأ فقط — لا تُنسخ إلى إدارة العمل.)
   */
  const quickStats = useMemo(() => {
    const CLOSED_PROJECT = ['completed', 'cancelled', 'archived'];
    const delayedProjects = projects.filter(
      (p) => p.status === 'delayed' || (!!p.dueDate && p.dueDate < todayStr && !CLOSED_PROJECT.includes(p.status))
    ).length;

    const upcomingAppointments = appointments.filter((a) => a.date >= todayStr && a.status === 'scheduled').length;

    const activeGoals = goals.filter((g) => g.status !== 'achieved').length;

    let upcomingVisits = 0;
    try {
      const closedVisit = ['مكتمل', 'ملغي'];
      upcomingVisits =
        customerService.getVisits().filter((v) => v.date >= todayStr && !closedVisit.includes(v.status)).length +
        doctorService.getVisits().filter((v) => v.date >= todayStr && !closedVisit.includes(v.status)).length;
    } catch {
      upcomingVisits = 0; // لا تُسقط الشاشة إن تعذّرت قراءة وحدة أخرى
    }

    return { delayedProjects, upcomingAppointments, activeGoals, upcomingVisits };
  }, [projects, appointments, goals, todayStr]);

  /** «القادم» (§10): تجميع عرض فقط لبيانات قائمة — بلا كيانات جديدة */
  const upcomingFeed = useMemo(() => {
    type FeedRow = { key: string; date: string; time?: string; kind: string; title: string; meta?: string; task?: WorkTask };
    const rows: FeedRow[] = [];

    tasks
      .filter((t) => t.status !== 'completed' && t.status !== 'cancelled' && !!t.dueDate && t.dueDate >= todayStr)
      .forEach((t) => rows.push({ key: 'task_' + t.id, date: t.dueDate, time: t.dueTime, kind: 'مهمة', title: t.title, task: t }));

    appointments
      .filter((a) => a.status === 'scheduled' && a.date >= todayStr)
      .forEach((a) => rows.push({ key: 'apt_' + a.id, date: a.date, time: a.time, kind: 'موعد', title: a.title, meta: a.person }));

    meetings
      .filter((m) => !!m.date && m.date >= todayStr)
      .forEach((m) => rows.push({ key: 'mtg_' + m.id, date: m.date, time: m.time, kind: 'اجتماع', title: m.title }));

    commitments
      .filter((c) => !!c.dueDate && c.dueDate >= todayStr && c.status !== 'fulfilled')
      .forEach((c) => rows.push({ key: 'cmt_' + c.id, date: c.dueDate, kind: 'التزام', title: c.title, meta: c.entity }));

    return rows.sort((a, b) => (a.date === b.date ? (a.time || '').localeCompare(b.time || '') : a.date.localeCompare(b.date))).slice(0, 8);
  }, [tasks, appointments, meetings, commitments, todayStr]);

  // Filter and sort tasks according to the strict priority rules requested by the user:
  // 1. متأخرة وعاجلة (Overdue & Urgent)
  // 2. متأخرة (Overdue)
  // 3. مستحقة اليوم (Due Today)
  // 4. قريبة الاستحقاق (Upcoming in 3 days)
  // 5. قيد التنفيذ (In Progress)
  const prioritizedActionTasks = useMemo(() => {
    const uncompleted = tasks.filter((t) => t.status !== 'completed');

    const getTaskRank = (t: WorkTask) => {
      const isOverdue = t.dueDate && t.dueDate < todayStr;
      const isUrgent = t.priority === 'urgent';
      const isDueToday = t.dueDate === todayStr;
      const isUpcoming = t.dueDate && t.dueDate > todayStr && t.dueDate <= getInThreeDays();
      const isInProgress = t.status === 'in_progress';

      if (isOverdue && isUrgent) return 1;
      if (isOverdue) return 2;
      if (isDueToday) return 3;
      if (isUpcoming) return 4;
      if (isInProgress) return 5;
      return 6;
    };

    function getInThreeDays() {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d.toISOString().split('T')[0];
    }

    return [...uncompleted]
      .sort((a, b) => getTaskRank(a) - getTaskRank(b))
      .slice(0, 10);
  }, [tasks, todayStr]);

  // Active Projects
  const activeProjects = useMemo(() => {
    return projects.filter((p) => p.status === 'active' || p.status === 'delayed').slice(0, 6);
  }, [projects]);

  // Overdue count & list
  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== 'completed' && t.dueDate && t.dueDate < todayStr);
  }, [tasks, todayStr]);

  // Due Today
  const dueTodayTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== 'completed' && t.dueDate === todayStr);
  }, [tasks, todayStr]);

  // Overall Completion stats
  const completedCount = useMemo(() => tasks.filter((t) => t.status === 'completed').length, [tasks]);
  const overallProgress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Project map
  const projectMap = useMemo(() => {
    const m = new Map<string, WorkProject>();
    projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. TOP SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Completion Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">نسبة الإنجاز العامة</span>
            <span className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-teal-900">{overallProgress}%</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">من إجمالي {tasks.length} مهمة</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-linear-to-r from-teal-700 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>مكتملة: <strong className="text-emerald-700 dark:text-emerald-300 font-mono">{completedCount}</strong></span>
            <span>متبقية: <strong className="text-blue-700 dark:text-blue-300 font-mono">{tasks.length - completedCount}</strong></span>
          </div>
        </div>

        {/* Overdue Alerts Card */}
        <div
          onClick={() => onNavigateToTab('tasks')}
          className="bg-white dark:bg-slate-900 hover:bg-rose-50/40 dark:hover:bg-rose-950/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-rose-300 shadow-2xs p-5 space-y-3 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300">المهام المتأخرة</span>
            <span className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-rose-700 dark:text-rose-300">{overdueTasks.length}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">تجاوزت موعد التسليم</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            تتطلب متابعة فورية لتفادي تعطل المشاريع. انقر لتصفيتها مباشرة في جدول المهام.
          </p>
        </div>

        {/* Due Today Card */}
        <div
          onClick={() => onNavigateToTab('tasks')}
          className="bg-white dark:bg-slate-900 hover:bg-amber-50/40 dark:hover:bg-amber-950/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-300 shadow-2xs p-5 space-y-3 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-200">مستحقة اليوم</span>
            <span className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-amber-800 dark:text-amber-200">{dueTodayTasks.length}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">مطلوب إنهاؤها بحلول المساء</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            مهام وأعمال مسجلة للاكتمال بتاريخ اليوم. ركز على إنجازها لرفع نسبة الالتزام.
          </p>
        </div>
      </div>

      {/* 1.b مؤشرات سريعة (§6) — أربعة مؤشرات كانت بياناتها متاحة بلا عرض */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { id: 'q_delayed_projects', label: 'المشاريع المتأخرة', value: quickStats.delayedProjects, tone: 'rose', tab: 'projects' },
          { id: 'q_upcoming_appointments', label: 'المواعيد القادمة', value: quickStats.upcomingAppointments, tone: 'sky', tab: 'calendar' },
          { id: 'q_active_goals', label: 'الأهداف النشطة', value: quickStats.activeGoals, tone: 'violet', tab: 'goals' },
          { id: 'q_upcoming_visits', label: 'الزيارات القادمة', value: quickStats.upcomingVisits, tone: 'amber', tab: null },
        ].map((kpi) => {
          const tones: Record<string, string> = {
            rose: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
            sky: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
            violet: 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800',
            amber: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
          };
          return (
            <button
              key={kpi.id}
              type="button"
              disabled={!kpi.tab}
              onClick={() => kpi.tab && onNavigateToTab(kpi.tab)}
              className={`text-right rounded-xl border p-3.5 transition ${tones[kpi.tone]} ${kpi.tab ? 'cursor-pointer hover:shadow-xs' : 'cursor-default'}`}
            >
              <div className="text-xs font-bold opacity-90">{kpi.label}</div>
              <div className="text-2xl font-black font-mono mt-1">{kpi.value}</div>
            </button>
          );
        })}
      </div>

      {/* 1.c القادم (§10) — تجميع عرض لمهام ومواعيد واجتماعات والتزامات قائمة */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>القادم</span>
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">مهام · مواعيد · اجتماعات · التزامات</span>
        </div>
        {upcomingFeed.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-2">لا يوجد عمل قادم مُجدول.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {upcomingFeed.map((row) => (
              <div
                key={row.key}
                onClick={() => row.task && onOpenTaskDetail(row.task)}
                className={`py-2.5 flex items-center justify-between gap-3 px-2 rounded-xl transition ${row.task ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/60' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                    {row.kind}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{row.title}</span>
                  {row.meta && <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{row.meta}</span>}
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
                  {row.date}{row.time ? ' · ' + row.time : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. ACTION REQUIRED TASKS & ACTIVE PROJECTS SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tasks Needing Immediate Action (Ranked 1 to 5) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>المهام التي تحتاج إلى إجراء سريع</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-mono">
                  مرتبة حسب الأولوية
                </span>
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                1. متأخرة وعاجلة ← 2. متأخرة ← 3. مستحقة اليوم ← 4. قريبة ← 5. قيد التنفيذ
              </p>
            </div>

            <button
              onClick={() => onNavigateToTab('tasks')}
              className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
            >
              <span>عرض كل المهام</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {prioritizedActionTasks.map((t, idx) => {
              const isOverdue = t.dueDate && t.dueDate < todayStr;
              const isUrgent = t.priority === 'urgent';
              const isDueToday = t.dueDate === todayStr;
              const project = t.projectId ? projectMap.get(t.projectId) : undefined;

              let badgeText = 'قيد التنفيذ';
              let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';

              if (isOverdue && isUrgent) {
                badgeText = 'متأخرة وعاجلة!';
                badgeColor = 'bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse';
              } else if (isOverdue) {
                badgeText = 'متأخرة';
                badgeColor = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
              } else if (isDueToday) {
                badgeText = 'مستحقة اليوم';
                badgeColor = 'bg-amber-50 text-amber-800 border-amber-200 font-bold';
              } else if (t.priority === 'urgent') {
                badgeText = 'عاجلة';
                badgeColor = 'bg-amber-50 text-amber-800 border-amber-200 font-bold';
              }

              return (
                <div
                  key={t.id}
                  onClick={() => onOpenTaskDetail(t)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 px-2 rounded-xl transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-800 dark:group-hover:text-teal-200">
                        {t.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                        {project && (
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium">{project.name}</span>
                        )}
                        <span>•</span>
                        <span className="font-mono">{t.dueDate || 'بدون موعد'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-lg text-xs border ${badgeColor}`}>
                      {badgeText}
                    </span>
                    <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition" />
                  </div>
                </div>
              );
            })}

            {prioritizedActionTasks.length === 0 && (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                لا توجد مهام حرجة أو متأخرة حالياً. أداء رائع!
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Projects & Upcoming Meetings */}
        <div className="space-y-6">
          {/* Active Projects */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>المشاريع النشطة</span>
              </h3>
              <button
                onClick={() => onNavigateToTab('projects')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 cursor-pointer"
              >
                عرض الكل
              </button>
            </div>

            <div className="space-y-3">
              {activeProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onNavigateToTab('projects')}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 bg-slate-50/50 dark:bg-slate-800/60 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/40 transition cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.name}</span>
                    <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300">{p.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                    <span>المدير: {p.manager}</span>
                    <span className="font-mono">{p.dueDate}</span>
                  </div>
                </div>
              ))}

              {activeProjects.length === 0 && (
                <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                  لا توجد مشاريع نشطة حالياً.
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Appointments & Meetings */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>المواعيد واللقاءات القادمة</span>
              </h3>
            </div>

            <div className="space-y-2">
              {appointments.slice(0, 3).map((a) => (
                <div key={a.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{a.title}</div>
                  <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">
                    <span>{a.date} ({a.time})</span>
                    <span>{a.person}</span>
                  </div>
                </div>
              ))}

              {appointments.length === 0 && (
                <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-xs">
                  لا توجد مواعيد مجدولة قريبة.
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed (آخر التحديثات) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>آخر التحديثات والنشاط</span>
              </h3>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto no-scrollbar">
              {activities.slice(0, 5).map((act) => (
                <div key={act.id} className="p-2.5 bg-slate-50/70 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{act.user}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                      {act.timestamp ? act.timestamp.split('T')[1]?.slice(0, 5) || act.timestamp.split('T')[0] : ''}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-xs">
                    <span className="text-teal-700 dark:text-teal-300 font-semibold">{act.action}</span>: {act.entityTitle}
                  </p>
                </div>
              ))}

              {activities.length === 0 && (
                <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-xs">
                  لا توجد أنشطة مسجلة حديثاً.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
