import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  SkipForward,
  MoreVertical,
  Calendar,
  Layers,
  Sparkles,
  Filter,
  CheckSquare,
  Square,
  ArrowRight,
  Flame,
} from 'lucide-react';
import {
  RoutineOccurrence,
  RoutineRecord,
  ScheduleConflict,
} from '../../types/routines';
import { formatDurationArabic } from '../../utils/routines';

interface RoutineOccurrencesListProps {
  occurrences: RoutineOccurrence[];
  routines: RoutineRecord[];
  conflicts: ScheduleConflict[];
  selectedDate: string;
  onDateChange: (dateStr: string) => void;
  onStartTimer: (routine: RoutineRecord, occurrence: RoutineOccurrence) => void;
  onToggleQuickComplete: (occurrence: RoutineOccurrence) => void;
  onPostponeClick: (occurrence: RoutineOccurrence, routine: RoutineRecord) => void;
  onSkipClick: (occurrence: RoutineOccurrence, routine: RoutineRecord) => void;
  onViewDetail: (routine: RoutineRecord) => void;
}

export const RoutineOccurrencesList: React.FC<RoutineOccurrencesListProps> = ({
  occurrences,
  routines,
  conflicts,
  selectedDate,
  onDateChange,
  onStartTimer,
  onToggleQuickComplete,
  onPostponeClick,
  onSkipClick,
  onViewDetail,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const routineMap = new Map<string, RoutineRecord>();
  routines.forEach((r) => routineMap.set(r.id, r));

  const filteredOccurrences = occurrences.filter((occ) => {
    if (occ.date !== selectedDate) return false;
    const routine = routineMap.get(occ.routineId);
    if (!routine) return false;

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PENDING' && (occ.status === 'COMPLETED' || occ.status === 'SKIPPED')) return false;
      if (statusFilter === 'COMPLETED' && occ.status !== 'COMPLETED') return false;
      if (statusFilter === 'SKIPPED' && occ.status !== 'SKIPPED') return false;
    }

    if (categoryFilter !== 'ALL' && routine.categoryId !== categoryFilter) return false;

    return true;
  });

  // Sort by plannedStart time ascending
  const sortedOccurrences = [...filteredOccurrences].sort((a, b) =>
    a.plannedStart.localeCompare(b.plannedStart)
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  const totalForDay = occurrences.filter((o) => o.date === selectedDate).length;
  const completedForDay = occurrences.filter(
    (o) => o.date === selectedDate && o.status === 'COMPLETED'
  ).length;
  const dayCompletionRate = totalForDay > 0 ? Math.round((completedForDay / totalForDay) * 100) : 0;

  return (
    <div id="routine-today-timeline" className="space-y-4">
      {/* Top Header & Day Navigator */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold">
            <Calendar size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                {isToday ? 'جدول روتين اليوم' : `جدول يوم: ${selectedDate}`}
              </h2>
              {isToday && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                  اليوم الحاضر
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              إنجاز {completedForDay} من أصل {totalForDay} روتينات مجدولة ({dayCompletionRate}%)
            </p>
          </div>
        </div>

        {/* Date Selector & Quick Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              onDateChange(d.toISOString().split('T')[0]);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            ← اليوم السابق
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
          />

          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              onDateChange(d.toISOString().split('T')[0]);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            اليوم التالي →
          </button>

          {!isToday && (
            <button
              onClick={() => onDateChange(todayStr)}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition"
            >
              العودة لليوم
            </button>
          )}
        </div>
      </div>

      {/* Conflicts Alert Banner if any on this date */}
      {conflicts.filter((c) => c.date === selectedDate).length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 p-3.5 rounded-xl text-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
            <span>تم رصد تعارض زمني في جدول اليوم ({conflicts.filter((c) => c.date === selectedDate).length})</span>
          </div>
          {conflicts
            .filter((c) => c.date === selectedDate)
            .map((cnf) => (
              <p key={cnf.id} className="text-amber-700 dark:text-amber-300/90 pr-6">
                {cnf.suggestion}
              </p>
            ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            statusFilter === 'ALL'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          الكل ({totalForDay})
        </button>
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            statusFilter === 'PENDING'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          بانتظار الإنجاز ({totalForDay - completedForDay})
        </button>
        <button
          onClick={() => setStatusFilter('COMPLETED')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            statusFilter === 'COMPLETED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          مكتملة ({completedForDay})
        </button>
      </div>

      {/* Timeline List */}
      {sortedOccurrences.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto text-2xl">
            🌿
          </div>
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
            لا توجد روتينات مجدولة لهذا اليوم
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            يمكنك تخصيص الجداول وإضافة روتينات يومية أو أسبوعية جديدة من خلال معالج الروتين الذكي.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedOccurrences.map((occ) => {
            const routine = routineMap.get(occ.routineId);
            if (!routine) return null;

            const isCompleted = occ.status === 'COMPLETED';
            const isSkipped = occ.status === 'SKIPPED';
            const isInProgress = occ.status === 'IN_PROGRESS';

            return (
              <div
                key={occ.id}
                className={`bg-white dark:bg-slate-900 rounded-xl border transition p-4 md:p-5 shadow-sm hover:shadow-md ${
                  isCompleted
                    ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/20'
                    : isSkipped
                    ? 'border-slate-200 dark:border-slate-800 opacity-60'
                    : isInProgress
                    ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-400/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Time & Icon & Details */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {routine.icon || '⚡'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Clock size={12} className="text-emerald-600 dark:text-emerald-400" />
                          {occ.plannedStart} - {occ.plannedEnd} ({routine.duration} د)
                        </span>

                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {routine.categoryName}
                        </span>

                        {routine.currentStreak > 0 && (
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg">
                            <Flame size={12} className="fill-amber-500 text-amber-500" />
                            {routine.currentStreak} يوم
                          </span>
                        )}

                        {isCompleted && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <CheckCircle2 size={12} /> مكتمل
                          </span>
                        )}

                        {isSkipped && (
                          <span className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-lg">
                            تم التخطي ({occ.skipReason || 'بعذر'})
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => onViewDetail(routine)}
                        className="text-base font-bold text-slate-800 dark:text-white hover:text-emerald-600 cursor-pointer transition"
                      >
                        {routine.name}
                      </h3>

                      {routine.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {routine.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {!isCompleted && !isSkipped && (
                      <>
                        <button
                          onClick={() => onStartTimer(routine, occ)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow transition active:scale-95"
                          title="بدء مؤقت التركيز التفاعلي"
                        >
                          <Play size={14} className="fill-white" /> بدء الجلسة
                        </button>

                        <button
                          onClick={() => onToggleQuickComplete(occ)}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold transition"
                          title="توثيق الإنجاز السريع"
                        >
                          <CheckCircle2 size={18} />
                        </button>

                        <button
                          onClick={() => onPostponeClick(occ, routine)}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold transition"
                          title="تأجيل الموعد"
                        >
                          <Clock size={18} />
                        </button>

                        <button
                          onClick={() => onSkipClick(occ, routine)}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition"
                          title="تخطي اليوم بعذر"
                        >
                          <SkipForward size={18} />
                        </button>
                      </>
                    )}

                    {isCompleted && (
                      <button
                        onClick={() => onToggleQuickComplete(occ)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
                      >
                        إلغاء الإكمال
                      </button>
                    )}

                    <button
                      onClick={() => onViewDetail(routine)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition"
                    >
                      التفاصيل
                    </button>
                  </div>
                </div>

                {/* Steps mini list */}
                {routine.steps && routine.steps.length > 0 && !isCompleted && !isSkipped && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-2 text-xs">
                    {routine.steps.map((st, i) => (
                      <span
                        key={st.id || i}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1"
                      >
                        <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-[11px] flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        {st.title} ({st.duration} د)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
