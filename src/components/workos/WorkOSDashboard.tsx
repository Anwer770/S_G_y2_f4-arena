import React from 'react';
import {
  WorkTask,
  WorkProject,
  TeamMember,
  DailyRoutineBlock,
  HabitItem,
  AppointmentItem,
  WorkCommitment,
} from '../../types/workos';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  Flame,
  Calendar,
  Briefcase,
  Play,
  Pause,
  Plus,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Users,
  Target,
  ShieldAlert,
} from 'lucide-react';
import { ActiveTimerState } from '../../utils/workosStorage';

interface WorkOSDashboardProps {
  tasks: WorkTask[];
  projects: WorkProject[];
  team: TeamMember[];
  routine: DailyRoutineBlock[];
  habits: HabitItem[];
  appointments: AppointmentItem[];
  commitments: WorkCommitment[];
  activeTimer: ActiveTimerState | null;
  onStartTimer: (task: WorkTask) => void;
  onToggleTimer: () => void;
  onNavigateView: (view: any) => void;
  onOpenQuickAdd: (type?: string) => void;
  onOpenTaskDetail: (task: WorkTask) => void;
  onOpenAICopilot: () => void;
}

export const WorkOSDashboard: React.FC<WorkOSDashboardProps> = ({
  tasks = [],
  projects = [],
  team = [],
  routine = [],
  habits = [],
  appointments = [],
  commitments = [],
  activeTimer = null,
  onStartTimer = (..._args: any[]) => {},
  onToggleTimer = (..._args: any[]) => {},
  onNavigateView = (..._args: any[]) => {},
  onOpenQuickAdd = (..._args: any[]) => {},
  onOpenTaskDetail = (..._args: any[]) => {},
  onOpenAICopilot = (..._args: any[]) => {},
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Metrics
  const activeTasks = (tasks || []).filter((t) => t && t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'archived');
  const completedTasks = (tasks || []).filter((t) => t && t.status === 'completed');
  const overdueTasks = activeTasks.filter((t) => t && t.dueDate < todayStr);
  const urgentTasks = activeTasks.filter((t) => t && t.priority === 'urgent');
  const dueTodayTasks = activeTasks.filter((t) => t && t.dueDate === todayStr);

  const completionRate = (tasks || []).length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const activeProjects = (projects || []).filter((p) => p && p.status === 'active');
  const upcomingAppointments = (appointments || []).filter((a) => a && a.date >= todayStr).slice(0, 3);
  const pendingCommitments = (commitments || []).filter((c) => c && c.status !== 'fulfilled').slice(0, 3);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner: Greeting & AI Plan Bar */}
      <div className="bg-linear-to-l from-teal-900 via-slate-900 to-indigo-950 text-white p-6 rounded-xl shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-300" /> نظام إدارة الأعمال والمهام — Work OS
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {new Date().toLocaleDateString('ar-YE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white">مرحباً بك في غرفة القيادة وإدارة العمليات</h1>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
              لديك اليوم <strong className="text-amber-300">{dueTodayTasks.length} مهام مستحقة</strong>،{' '}
              <strong className="text-rose-300">{overdueTasks.length} متأخرة</strong>، و{' '}
              <strong className="text-teal-300">{upcomingAppointments.length} مواعيد مجدولة</strong>. نسبة إنجازك الإجمالية{' '}
              <strong className="text-emerald-300">{completionRate}%</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenAICopilot}
              className="px-4 py-2 bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
              <span>مساعد العمل الذكي (AI)</span>
            </button>
            <button
              onClick={() => onOpenQuickAdd('task')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-teal-300" />
              <span>إضافة مهمة سريعة</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => onNavigateView('all_tasks')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-teal-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>المهام النشطة</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">{activeTasks.length}</div>
          <div className="text-xs text-slate-400 mt-1">من إجمالي {tasks.length} مهمة</div>
        </div>

        <div
          onClick={() => onNavigateView('all_tasks')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-amber-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>مهام اليوم</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{dueTodayTasks.length}</div>
          <div className="text-xs text-slate-400 mt-1">تستحق الإنجاز اليوم</div>
        </div>

        <div
          onClick={() => onNavigateView('all_tasks')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-rose-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>متأخرة</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">{overdueTasks.length}</div>
          <div className="text-xs text-rose-500 font-bold mt-1">تحتاج معالجة فورية</div>
        </div>

        <div
          onClick={() => onNavigateView('projects')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>المشاريع</span>
            <FolderKanban className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">{activeProjects.length}</div>
          <div className="text-xs text-slate-400 mt-1">مشاريع نشطة قيد العمل</div>
        </div>

        <div
          onClick={() => onNavigateView('habits')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-orange-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>العادات والالتزام</span>
            <Flame className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-orange-700">
            {habits.length > 0 ? `${habits[0].streak} يوم` : '0'}
          </div>
          <div className="text-xs text-slate-400 mt-1">أطول سلسلة إنجاز</div>
        </div>

        <div
          onClick={() => onNavigateView('reports')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-emerald-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>نسبة الإنجاز</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{completionRate}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Right 2 cols: Today's Priorities & Active Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Urgent & Today's Tasks */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <h2 className="text-sm font-bold text-slate-800">أولويات اليوم والمهام العاجلة</h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
                  {urgentTasks.length + dueTodayTasks.length} مهام
                </span>
              </div>
              <button
                onClick={() => onNavigateView('all_tasks')}
                className="text-xs text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>عرض الكل</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>

            <div className="space-y-2.5">
              {[...urgentTasks, ...dueTodayTasks.filter((t) => t.priority !== 'urgent')]
                .slice(0, 5)
                .map((task) => {
                  const isOverdue = task.dueDate < todayStr;
                  const isCurrentTimer = activeTimer?.taskId === task.id;
                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                        isOverdue
                          ? 'bg-rose-50/40 border-rose-200/80'
                          : task.priority === 'urgent'
                          ? 'bg-amber-50/40 border-amber-200/80'
                          : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                            task.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : task.priority === 'high'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {task.priority === 'urgent' ? 'عاجلة' : task.priority === 'high' ? 'عالية' : 'متوسطة'}
                        </span>
                        <div className="min-w-0">
                          <button
                            onClick={() => onOpenTaskDetail(task)}
                            className="font-bold text-slate-800 text-xs truncate block hover:text-teal-700 text-right cursor-pointer"
                          >
                            {task.title}
                          </button>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="font-mono text-slate-500">{task.taskNumber}</span>
                            <span>•</span>
                            <span className="text-slate-600">{task.category}</span>
                            {task.customerRef && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-600 font-bold">{task.customerRef}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-mono px-2 py-0.5 rounded ${
                            isOverdue ? 'bg-rose-100 text-rose-700 font-bold' : 'text-slate-500'
                          }`}
                        >
                          {task.dueDate}
                        </span>

                        <button
                          onClick={() => onStartTimer(task)}
                          title={isCurrentTimer ? 'إيقاف المؤقت' : 'بدء تتبع الوقت'}
                          className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                            isCurrentTimer
                              ? 'bg-emerald-600 text-white border-emerald-700 animate-pulse'
                              : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isCurrentTimer ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              {urgentTasks.length === 0 && dueTodayTasks.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  لا توجد مهام عاجلة مستحقة اليوم، عمل رائع! 🎉
                </div>
              )}
            </div>
          </div>

          {/* Active Projects Overview */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-800">المشاريع الاستراتيجية النشطة</h2>
              </div>
              <button
                onClick={() => onNavigateView('projects')}
                className="text-xs text-indigo-700 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>دليل المشاريع</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeProjects.slice(0, 4).map((project) => (
                <div
                  key={project.id}
                  onClick={() => onNavigateView('projects')}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/40 hover:bg-slate-50 transition cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs text-slate-400 font-bold block">{project.code}</span>
                      <h3 className="font-bold text-slate-800 text-xs leading-snug">{project.name}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {project.category}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                      <span>نسبة الإنجاز</span>
                      <span className="text-indigo-700 font-mono">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-200/60">
                    <span className="text-slate-600 font-medium">المدير: {project.manager}</span>
                    <span className="font-mono text-slate-500">ينتهي: {project.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Left Column: Routine, Upcoming Appointments, Commitments & Team */}
        <div className="space-y-6">
          {/* Daily Routine Widget */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-bold text-slate-800">الروتين اليومي المخطط</h3>
              </div>
              <button
                onClick={() => onNavigateView('routine')}
                className="text-xs text-teal-700 font-bold hover:underline cursor-pointer"
              >
                عرض الجدول
              </button>
            </div>

            <div className="space-y-2">
              {routine.slice(0, 4).map((rt) => (
                <div
                  key={rt.id}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                    rt.status === 'completed'
                      ? 'bg-emerald-50/40 border-emerald-200 text-slate-700'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <span className="font-mono text-xs text-slate-400 block font-bold">{rt.timeSlot}</span>
                    <span className="font-bold text-slate-800 text-xs">{rt.title}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                      rt.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {rt.status === 'completed' ? 'منفذ' : 'مخطط'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Appointments & Commitments */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>المواعيد القادمة</span>
                </div>
                <button
                  onClick={() => onNavigateView('appointments')}
                  className="text-xs text-amber-700 font-bold hover:underline cursor-pointer"
                >
                  الكل
                </button>
              </div>
              <div className="space-y-2">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="p-2 rounded-lg bg-amber-50/40 border border-amber-200/70 text-xs">
                    <div className="font-bold text-slate-800">{apt.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-amber-800 font-bold">{apt.date} • {apt.time}</span>
                      <span>مع: {apt.person}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>الالتزامات المهمة</span>
                </div>
                <button
                  onClick={() => onNavigateView('commitments')}
                  className="text-xs text-rose-700 font-bold hover:underline cursor-pointer"
                >
                  الكل
                </button>
              </div>
              <div className="space-y-2">
                {pendingCommitments.map((cmt) => (
                  <div key={cmt.id} className="p-2 rounded-lg bg-rose-50/40 border border-rose-200/70 text-xs">
                    <div className="font-bold text-slate-800">{cmt.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
                      <span>الجهة: {cmt.entity}</span>
                      <span className="font-mono text-rose-700 font-bold">تسليم: {cmt.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Team Workload snapshot */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-bold text-slate-800">فريق العمل والمهام</h3>
              </div>
              <button
                onClick={() => onNavigateView('team')}
                className="text-xs text-teal-700 font-bold hover:underline cursor-pointer"
              >
                توزيع الأعباء
              </button>
            </div>

            <div className="space-y-2">
              {team.slice(0, 4).map((member) => (
                <div key={member.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-none">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${member.avatarColor} text-white flex items-center justify-center text-xs font-bold`}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">{member.name}</span>
                      <span className="text-xs text-slate-400">{member.department}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs font-mono">
                    {member.activeTasksCount} مهام
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
