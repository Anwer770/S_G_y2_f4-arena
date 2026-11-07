import React from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Activity,
  ListTodo,
  TrendingUp,
} from 'lucide-react';

export interface WorkOSKPICardsProps {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  urgentTasks: number;
  dueTodayTasks?: number;
  openTasks?: number;
  completionRate?: number;
  overallCompletionRate?: number;
  activeFilterType?: string | null;
  onFilterClick?: (type: any) => void;
  onCardClick?: (type: any) => void;
}

export const WorkOSKPICards: React.FC<WorkOSKPICardsProps> = ({
  totalProjects,
  activeProjects,
  totalTasks,
  completedTasks,
  inProgressTasks,
  overdueTasks,
  urgentTasks,
  completionRate,
  overallCompletionRate,
  activeFilterType,
  onFilterClick,
  onCardClick,
}) => {
  const handleClick = (type: string) => {
    if (typeof onFilterClick === 'function') onFilterClick(type);
    if (typeof onCardClick === 'function') onCardClick(type);
  };

  const rate = typeof completionRate === 'number' ? completionRate : (overallCompletionRate || 0);

  // The 8 official Interactive KPI cards specified in the Master Prompt
  const cards = [
    {
      id: 'total_projects',
      label: 'إجمالي المشاريع',
      value: totalProjects,
      icon: FolderKanban,
      color: 'text-slate-800',
      activeColor: 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-200',
      iconColor: 'text-indigo-600',
      hint: 'عرض كل المشاريع',
    },
    {
      id: 'active_projects',
      label: 'المشاريع النشطة',
      value: activeProjects,
      icon: Activity,
      color: 'text-teal-700',
      activeColor: 'bg-teal-50/80 border-teal-400 ring-2 ring-teal-200',
      iconColor: 'text-teal-600',
      hint: 'تصفية المشاريع النشطة',
    },
    {
      id: 'total_tasks',
      label: 'إجمالي المهام',
      value: totalTasks,
      icon: ListTodo,
      color: 'text-slate-900',
      activeColor: 'bg-slate-100 border-slate-400 ring-2 ring-slate-200',
      iconColor: 'text-slate-600',
      hint: 'عرض كافة المهام',
    },
    {
      id: 'completed_tasks',
      label: 'المهام المكتملة',
      value: completedTasks,
      icon: CheckCircle2,
      color: 'text-emerald-700',
      activeColor: 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200',
      iconColor: 'text-emerald-600',
      hint: 'تصفية المهام المكتملة',
    },
    {
      id: 'in_progress_tasks',
      label: 'قيد التنفيذ',
      value: inProgressTasks,
      icon: Clock,
      color: 'text-blue-700',
      activeColor: 'bg-blue-50 border-blue-400 ring-2 ring-blue-200',
      iconColor: 'text-blue-600',
      hint: 'تصفية المهام الجارية',
    },
    {
      id: 'overdue_tasks',
      label: 'المهام المتأخرة',
      value: overdueTasks,
      icon: AlertTriangle,
      color: overdueTasks > 0 ? 'text-rose-700' : 'text-slate-600',
      activeColor: 'bg-rose-50 border-rose-400 ring-2 ring-rose-200',
      iconColor: overdueTasks > 0 ? 'text-rose-600' : 'text-slate-400',
      cardBg: overdueTasks > 0 ? 'bg-rose-50/30 border-rose-200' : '',
      hint: 'تصفية المهام المتأخرة فوراً',
    },
    {
      id: 'urgent_tasks',
      label: 'المهام العاجلة',
      value: urgentTasks,
      icon: Flame,
      color: urgentTasks > 0 ? 'text-amber-700' : 'text-slate-600',
      activeColor: 'bg-amber-50 border-amber-400 ring-2 ring-amber-200',
      iconColor: urgentTasks > 0 ? 'text-amber-600' : 'text-slate-400',
      cardBg: urgentTasks > 0 ? 'bg-amber-50/30 border-amber-200' : '',
      hint: 'تصفية المهام العاجلة والحرجة',
    },
    {
      id: 'completion_rate',
      label: 'نسبة إنجاز العمل',
      value: `${rate}%`,
      icon: TrendingUp,
      color: 'text-teal-800',
      activeColor: 'bg-teal-50/80 border-teal-400 ring-2 ring-teal-200',
      iconColor: 'text-teal-700',
      hint: 'عرض النظرة العامة للتقدم',
      isProgress: true,
      progressVal: rate,
    },
  ];

  return (
    <div className="space-y-1.5" dir="rtl">
      {/* KPI Interactive Grid (8 Interactive Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {cards.map((card) => {
          const Icon = card.icon;
          const isActive = activeFilterType === card.id;

          return (
            <button
              key={card.id}
              onClick={() => handleClick(card.id)}
              className={`p-2.5 rounded-xl border transition-all text-right cursor-pointer group select-none ${
                isActive
                  ? `${card.activeColor} shadow-xs`
                  : card.cardBg
                  ? `${card.cardBg} hover:shadow-2xs`
                  : 'bg-white border-slate-200/80 hover:border-teal-300 hover:shadow-2xs'
              }`}
              title={card.hint}
            >
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-[85px]">
                  {card.label}
                </span>
                <Icon className={`w-3.5 h-3.5 shrink-0 ${card.iconColor}`} />
              </div>

              <div className={`text-xl font-black font-mono ${card.color}`}>
                {card.value}
              </div>

              {card.isProgress ? (
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
                  <div
                    className="bg-teal-700 h-full rounded-full transition-all duration-500"
                    style={{ width: `${card.progressVal}%` }}
                  />
                </div>
              ) : (
                <div className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
                  {isActive ? '● نشط حالياً' : 'انقر للتصفية'}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
