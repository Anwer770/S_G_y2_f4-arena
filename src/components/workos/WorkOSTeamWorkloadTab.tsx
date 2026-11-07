import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  TeamMember,
  WorkTask,
  WorkProject,
} from '../../types/workos';

interface WorkOSTeamWorkloadTabProps {
  team: TeamMember[];
  tasks: WorkTask[];
  projects: WorkProject[];
  onOpenTaskDetail: (task: WorkTask) => void;
}

export const WorkOSTeamWorkloadTab: React.FC<WorkOSTeamWorkloadTabProps> = ({
  team = [],
  tasks = [],
  projects = [],
  onOpenTaskDetail,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter tasks based on project
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedProjectId !== 'all' && t.projectId !== selectedProjectId) return false;
      return true;
    });
  }, [tasks, selectedProjectId]);

  // Compute workload per member
  const memberWorkloads = useMemo(() => {
    return team
      .filter((m) => selectedDept === 'all' || m.department === selectedDept)
      .map((member) => {
        const memberTasks = filteredTasks.filter((t) => t.assigneeId === member.id);
        const currentTasks = memberTasks.filter((t) => t.status !== 'completed');
        const completedTasks = memberTasks.filter((t) => t.status === 'completed');
        const overdueTasks = currentTasks.filter(
          (t) => t.dueDate && t.dueDate < todayStr
        );
        const urgentTasks = currentTasks.filter((t) => t.priority === 'urgent');

        const completionRate =
          memberTasks.length > 0
            ? Math.round((completedTasks.length / memberTasks.length) * 100)
            : 0;

        // Workload stress indicator:
        // أخضر (منخفض): 0-3 مهام نشطة
        // برتقالي (متوسط): 4-7 مهام نشطة
        // أحمر (مرتفع): 8+ مهام نشطة أو وجود مهام متأخرة عاجلة
        let stressLevel: 'low' | 'medium' | 'high' = 'low';
        if (currentTasks.length >= 8 || overdueTasks.length >= 3) {
          stressLevel = 'high';
        } else if (currentTasks.length >= 4 || overdueTasks.length >= 1) {
          stressLevel = 'medium';
        }

        return {
          member,
          totalCount: memberTasks.length,
          currentCount: currentTasks.length,
          completedCount: completedTasks.length,
          overdueCount: overdueTasks.length,
          urgentCount: urgentTasks.length,
          completionRate,
          stressLevel,
          currentTasks,
        };
      });
  }, [team, filteredTasks, selectedDept, todayStr]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    team.forEach((m) => {
      if (m.department) set.add(m.department);
    });
    return Array.from(set);
  }, [team]);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Filtering Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-teal-700 dark:text-teal-300" />
          <span className="font-bold text-slate-800 dark:text-slate-200">مراقبة وتوزيع عبء الفريق</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-bold">القسم:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 cursor-pointer font-medium"
            >
              <option value="all">كل الأقسام</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-bold">المشروع:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 cursor-pointer font-medium"
            >
              <option value="all">كل المشاريع</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Legend Indicator */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-600 dark:text-slate-300">
        <span className="text-slate-400 dark:text-slate-500">مؤشرات مستوى ضغط العمل:</span>
        <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>عبء منخفض (0 - 3 مهام)</span>
        </span>
        <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>عبء متوسط (4 - 7 مهام)</span>
        </span>
        <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span>عبء مرتفع (8+ مهام أو تأخير)</span>
        </span>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {memberWorkloads.map((item) => {
          const isExpanded = expandedMemberId === item.member.id;

          let stressBadge = (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>عبء منخفض</span>
            </span>
          );

          if (item.stressLevel === 'medium') {
            stressBadge = (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>عبء متوسط</span>
              </span>
            );
          } else if (item.stressLevel === 'high') {
            stressBadge = (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>عبء مرتفع!</span>
              </span>
            );
          }

          return (
            <div
              key={item.member.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-600 transition"
            >
              {/* Member Info */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-teal-800 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                    {item.member.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.member.name}</h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">{item.member.role || 'عضو الفريق'}</span>
                  </div>
                </div>
                {stressBadge}
              </div>

              {/* Workload Metric Chips */}
              <div className="grid grid-cols-4 gap-1.5 text-center text-xs py-1">
                <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-xs text-slate-400 dark:text-slate-500 block font-bold">الحالية</span>
                  <span className="font-black font-mono text-slate-900 dark:text-slate-100 text-sm">{item.currentCount}</span>
                </div>

                <div className="p-2 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl">
                  <span className="text-xs text-emerald-700 dark:text-emerald-300 block font-bold">المكتملة</span>
                  <span className="font-black font-mono text-emerald-700 dark:text-emerald-300 text-sm">{item.completedCount}</span>
                </div>

                <div className="p-2 bg-rose-50/60 dark:bg-rose-950/40 rounded-xl">
                  <span className="text-xs text-rose-700 dark:text-rose-300 block font-bold">المتأخرة</span>
                  <span className="font-black font-mono text-rose-700 dark:text-rose-300 text-sm">{item.overdueCount}</span>
                </div>

                <div className="p-2 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl">
                  <span className="text-xs text-amber-700 dark:text-amber-300 block font-bold">العاجلة</span>
                  <span className="font-black font-mono text-amber-700 dark:text-amber-300 text-sm">{item.urgentCount}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                  <span>نسبة الإنجاز الإجمالية:</span>
                  <span className="font-mono text-teal-800 dark:text-teal-200">{item.completionRate}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-teal-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${item.completionRate}%` }}
                  />
                </div>
              </div>

              {/* Toggle show assigned tasks */}
              <button
                type="button"
                onClick={() => setExpandedMemberId(isExpanded ? null : item.member.id)}
                className="w-full py-1.5 px-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <span>المهام المكلف بها ({item.currentCount})</span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Expanded Tasks List */}
              {isExpanded && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                  {item.currentTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onOpenTaskDetail(t)}
                      className="p-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg text-xs flex items-center justify-between cursor-pointer transition"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[170px]">{t.title}</span>
                      <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{t.dueDate}</span>
                    </div>
                  ))}

                  {item.currentTasks.length === 0 && (
                    <div className="text-center py-2 text-slate-400 dark:text-slate-500 text-xs">
                      لا توجد مهام نشطة حالياً.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
