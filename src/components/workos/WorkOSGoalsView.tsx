import React from 'react';
import { GoalItem, WorkProject } from '../../types/workos';
import { Target, Plus, CheckCircle, ArrowRight, TrendingUp, Calendar } from 'lucide-react';

interface WorkOSGoalsViewProps {
  goals: GoalItem[];
  projects: WorkProject[];
  onOpenQuickAdd: (type?: string) => void;
}

export const WorkOSGoalsView: React.FC<WorkOSGoalsViewProps> = ({
  goals = [],
  projects = [],
  onOpenQuickAdd = (..._args: any[]) => {},
}) => {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">الأهداف الاستراتيجية والمخرجات الرئيسية (OKRs & Goals)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">ربط الأعمال اليومية والمشاريع بالرؤية الكبرى للشركة</p>
          </div>
        </div>

        <button
          onClick={() => onOpenQuickAdd('goal')}
          className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>هدف جديد</span>
        </button>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          return (
            <div
              key={goal.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-5 space-y-4 hover:border-teal-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300">
                      {goal.category}
                    </span>
                    <span className="font-mono text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> موعد التحقيق: {goal.targetDate}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1">{goal.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{goal.visionDescription}</p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-2xl font-black text-teal-700 dark:text-teal-300 font-mono">{goal.progress}%</span>
                  <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mt-1">
                    <div className="bg-teal-600 h-full rounded-full" style={{ width: `${goal.progress}%` }} />
                  </div>
                </div>
              </div>

              {/* Objectives */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">الأهداف المرحلية المرتبطة (Key Objectives):</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {goal.objectives.map((obj) => {
                    const linkedPrj = projects.find((p) => p.id === obj.linkedProjectId);
                    return (
                      <div key={obj.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                          <span>{obj.title}</span>
                          <span className="font-mono text-teal-700 dark:text-teal-300">{obj.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                          <div className="bg-teal-600 h-full rounded-full" style={{ width: `${obj.progress}%` }} />
                        </div>
                        {linkedPrj && (
                          <div className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                            المشروع التنفيذي: <strong>{linkedPrj.name}</strong>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
