import React, { useState, useMemo } from 'react';
import { WorkTask, WorkProject, TeamMember } from '../../types/workos';
import {
  BarChart3,
  TrendingUp,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  FolderKanban,
  Users,
  Filter,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface WorkOSReportsViewProps {
  tasks: WorkTask[];
  projects: WorkProject[];
  team: TeamMember[];
  onExportJSON: () => void;
  onExportCSV: () => void;
  onOpenPrintReport?: () => void;
}

export const WorkOSReportsView: React.FC<WorkOSReportsViewProps> = ({
  tasks = [],
  projects = [],
  team = [],
  onExportJSON,
  onExportCSV,
  onOpenPrintReport,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | '30days' | 'currentMonth'>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t) return false;
      if (selectedProjectId !== 'all' && t.projectId !== selectedProjectId) return false;
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      return true;
    });
  }, [tasks, selectedProjectId, selectedCategory]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const completedTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'completed'),
    [filteredTasks]
  );

  const inProgressTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'in_progress'),
    [filteredTasks]
  );

  const overdueTasks = useMemo(
    () => filteredTasks.filter((t) => t.status !== 'completed' && t.dueDate < todayStr),
    [filteredTasks, todayStr]
  );

  const totalEstimatedHours = useMemo(
    () => filteredTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0),
    [filteredTasks]
  );

  const totalActualHours = useMemo(
    () => filteredTasks.reduce((acc, t) => acc + (t.actualHours || 0), 0),
    [filteredTasks]
  );

  const completionRate = filteredTasks.length > 0
    ? Math.round((completedTasks.length / filteredTasks.length) * 100)
    : 0;

  // Status Distribution
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      completed: completedTasks.length,
      in_progress: inProgressTasks.length,
      overdue: overdueTasks.length,
      planned: filteredTasks.filter((t) => t.status === 'planned' || t.status === 'new').length,
    };
    return counts;
  }, [filteredTasks, completedTasks, inProgressTasks, overdueTasks]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              التقارير والتحليلات المؤسسية المتقدمة
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              مؤشرات إنجاز المشاريع، كفاءة وتوزيع أعباء العمل، ووثائق التصدير والطباعة الرسمية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {onOpenPrintReport && (
            <button
              onClick={onOpenPrintReport}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-teal-400" />
              <span>معاينة وطباعة التقرير (P)</span>
            </button>
          )}
          <button
            onClick={onExportCSV}
            className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>تصدير Excel / CSV</span>
          </button>
          <button
            onClick={onExportJSON}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>نسخة احتياطية JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold shrink-0">
          <Filter className="w-4 h-4 text-teal-600" />
          <span>تصفية التحليلات:</span>
        </div>

        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:border-teal-600 cursor-pointer"
        >
          <option value="all">كافة المشاريع والمبادرات ({projects.length})</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} - {p.name}
            </option>
          ))}
        </select>

        {categories.length > 0 && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:border-teal-600 cursor-pointer"
          >
            <option value="all">كافة التصنيفات التشغيلية</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        {(selectedProjectId !== 'all' || selectedCategory !== 'all') && (
          <button
            onClick={() => {
              setSelectedProjectId('all');
              setSelectedCategory('all');
            }}
            className="px-2.5 py-1 text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
          >
            إعادة تعيين المرشحات
          </button>
        )}

        <div className="mr-auto text-xs text-slate-400 font-mono">
          تم احتساب: <strong>{filteredTasks.length}</strong> مهمة
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>المهام المكتملة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
            {completedTasks.length} / {filteredTasks.length}
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 pt-1">
            نسبة الإنجاز الإجمالية: <strong>{completionRate}%</strong>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>المهام المتأخرة</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-300 font-mono">
            {overdueTasks.length}
          </div>
          <div className="text-xs text-rose-500 font-bold mt-1">
            {overdueTasks.length > 0 ? 'تتطلب إعادة جدولة فورية' : 'لا توجد مهام متأخرة حالياً'}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">
            تجاوزت موعد التسليم المحدد
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>ساعات العمل المقدرة</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
            {totalEstimatedHours} س
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            المخطط لها في خطط العمل
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">
            معدل {filteredTasks.length > 0 ? (totalEstimatedHours / filteredTasks.length).toFixed(1) : 0} س/مهمة
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>ساعات العمل الفعلية</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-700 dark:text-teal-300 font-mono">
            {totalActualHours} س
          </div>
          <div className="text-xs text-teal-600 dark:text-teal-400 font-bold mt-1">
            المسجلة في مؤقت العمل
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">
            نسبة الالتزام بالوقت: {totalEstimatedHours > 0 ? Math.round((totalActualHours / totalEstimatedHours) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Visual Work Distribution & Projects Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Health Progress */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-600" />
              <span>معدلات إنجاز المشاريع والمبادرات النشطة</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{projects.length} مشاريع</span>
          </div>

          <div className="space-y-3.5">
            {projects.map((p) => {
              const pTasks = tasks.filter((t) => t.projectId === p.id);
              const pDone = pTasks.filter((t) => t.status === 'completed');
              const pRate = pTasks.length > 0 ? Math.round((pDone.length / pTasks.length) * 100) : p.progress;

              return (
                <div key={p.id} className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{p.code}</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{p.name}</span>
                    </div>
                    <span className="font-mono font-bold text-teal-700 dark:text-teal-300">{pRate}%</span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        pRate >= 80 ? 'bg-emerald-600' : pRate >= 40 ? 'bg-teal-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${pRate}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>المدير: {p.manager}</span>
                    <span>المهام: {pDone.length} من {pTasks.length} مكتملة</span>
                    <span>التسليم: {p.dueDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            <span>توزيع حالات المهام الحالية</span>
          </h3>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-emerald-950 dark:text-emerald-200">مكتملة وناجحة</span>
              </div>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{statusCounts.completed}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-800/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span className="font-bold text-teal-950 dark:text-teal-200">قيد التنفيذ النشط</span>
              </div>
              <span className="font-mono font-bold text-teal-700 dark:text-teal-300">{statusCounts.in_progress}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="font-bold text-amber-950 dark:text-amber-200">مجدولة للمستقبل</span>
              </div>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300">{statusCounts.planned}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="font-bold text-rose-950 dark:text-rose-200">متأخرة عن الموعد</span>
              </div>
              <span className="font-mono font-bold text-rose-700 dark:text-rose-300">{statusCounts.overdue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Productivity Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            <span>مؤشرات أداء أعضاء الفريق والمسؤولين التنفيذيين</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">{team.length} أعضاء</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs min-w-[650px] print:min-w-0">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-3">الموظف</th>
                <th className="py-3 px-3">القسم</th>
                <th className="py-3 px-3 text-center">المهام الكلية</th>
                <th className="py-3 px-3 text-center">المنجزة</th>
                <th className="py-3 px-3 text-center">المتأخرة</th>
                <th className="py-3 px-3 text-center">الساعات الفعلية</th>
                <th className="py-3 px-3 text-center">نسبة الإنجاز</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {team.map((m) => {
                const mTasks = tasks.filter((t) => t.assigneeId === m.id);
                const mDone = mTasks.filter((t) => t.status === 'completed');
                const mOverdue = mTasks.filter(
                  (t) => t.status !== 'completed' && t.dueDate < todayStr
                );
                const mActualHours = mTasks.reduce((acc, t) => acc + (t.actualHours || 0), 0);
                const rate = mTasks.length > 0 ? Math.round((mDone.length / mTasks.length) * 100) : 0;

                return (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: m.avatarColor || '#0d9488' }}
                        />
                        <span>{m.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{m.department}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-medium">{mTasks.length}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                      {mDone.length}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-rose-700 dark:text-rose-300 font-bold">
                      {mOverdue.length}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-300">
                      {mActualHours} س
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full font-mono font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 text-xs">
                        {rate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
