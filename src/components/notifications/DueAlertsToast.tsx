import React, { useState } from 'react';
import { Bell, Clock, AlertTriangle, ChevronLeft, X, CheckCircle2 } from 'lucide-react';
import { DueAlertsSummary, formatDueText } from '../../utils/dueAlerts';

interface DueAlertsToastProps {
  summary: DueAlertsSummary;
  onOpenDetails: () => void;
  onNavigateToTasks: () => void;
  onDismiss: () => void;
}

export const DueAlertsToast: React.FC<DueAlertsToastProps> = ({
  summary,
  onOpenDetails,
  onNavigateToTasks,
  onDismiss,
}) => {
  if (summary.total === 0) return null;

  // Highlights the most urgent item
  const mostUrgent = summary.items[0];
  const urgentDue = formatDueText(mostUrgent.diffDays);

  return (
    <aside
      aria-label="تنبيهات المواعيد والاستحقاقات"
      className="fixed bottom-5 left-5 z-40 max-w-md w-[calc(100vw-2.5rem)] sm:w-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-amber-200 dark:border-amber-900/60 shadow-2xl rounded-xl p-3.5 sm:p-4 text-slate-800 dark:text-slate-100 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shrink-0 shadow-md">
            {summary.overdueCount > 0 ? (
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[11px] font-black ring-2 ring-white dark:ring-slate-900">
              {summary.total}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                تنبيه اقتراب موعد التنفيذ
              </h4>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${urgentDue.badgeColor}`}>
                {urgentDue.text}
              </span>
            </div>
            <p className="text-xs sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 max-w-[240px] sm:max-w-[280px]">
              {mostUrgent.type === 'task' ? 'مهمة: ' : 'التزام: '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{mostUrgent.title}</span>
            </p>
          </div>
        </div>

        {/* Close / Dismiss */}
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          title="إغلاق التنبيه مؤقتاً"
          aria-label="إغلاق التنبيه"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Badges and Actions */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          {summary.overdueCount > 0 && (
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              {summary.overdueCount} متأخرة
            </span>
          )}
          {summary.overdueCount > 0 && summary.todayCount > 0 && <span>•</span>}
          {summary.todayCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              {summary.todayCount} اليوم
            </span>
          )}
          {(summary.overdueCount > 0 || summary.todayCount > 0) && summary.soonCount > 0 && <span>•</span>}
          {summary.soonCount > 0 && (
            <span className="text-teal-600 dark:text-teal-400 font-bold">
              {summary.soonCount} قريباً
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenDetails}
            className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>التفاصيل ({summary.total})</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onNavigateToTasks}
            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition-colors cursor-pointer shadow-xs"
          >
            فتح المهام
          </button>
        </div>
      </div>
    </aside>
  );
};
