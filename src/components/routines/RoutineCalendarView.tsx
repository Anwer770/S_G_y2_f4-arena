import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Play,
  Flame,
} from 'lucide-react';
import { RoutineOccurrence, RoutineRecord } from '../../types/routines';

interface RoutineCalendarViewProps {
  occurrences: RoutineOccurrence[];
  routines: RoutineRecord[];
  onSelectDate: (dateStr: string) => void;
  onSelectRoutine: (routine: RoutineRecord) => void;
}

export const RoutineCalendarView: React.FC<RoutineCalendarViewProps> = ({
  occurrences,
  routines,
  onSelectDate,
  onSelectRoutine,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const routineMap = new Map<string, RoutineRecord>();
  routines.forEach((r) => routineMap.set(r.id, r));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0: Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Arabic month names
  const monthNames = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Group occurrences by date
  const occurrencesByDate = new Map<string, RoutineOccurrence[]>();
  occurrences.forEach((occ) => {
    const list = occurrencesByDate.get(occ.date) || [];
    list.push(occ);
    occurrencesByDate.set(occ.date, list);
  });

  return (
    <div id="routine-calendar-view" className="space-y-4">
      {/* Calendar Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              تقويم الروتين والجدولة ({monthNames[month]} {year})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              استعراض المواعيد والجداول الشهرية لكافة الروتينات والأنشطة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            الشهر الحالي
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300">
          <div>السبت</div>
          <div>الأحد</div>
          <div>الاثنين</div>
          <div>الثلاثاء</div>
          <div>الأربعاء</div>
          <div>الخميس</div>
          <div>الجمعة</div>
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {/* Empty cells for padding before day 1 */}
          {/* Note: In Yemen/Arab week starts Saturday (6 in JS standard getDay()). If first day is 6 -> 0 offset. */}
          {Array.from({ length: (firstDayIndex + 1) % 7 }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="min-h-[110px] p-2 bg-slate-50/40 dark:bg-slate-950/20 border-b border-r border-slate-100 dark:border-slate-800/60"
            />
          ))}

          {daysArray.map((dayNum) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const dayOccurrences = occurrencesByDate.get(dateStr) || [];

            return (
              <div
                key={dayNum}
                onClick={() => onSelectDate(dateStr)}
                className={`min-h-[115px] p-2 border-b border-r border-slate-100 dark:border-slate-800/60 transition cursor-pointer flex flex-col justify-between ${
                  isToday
                    ? 'bg-emerald-50/30 dark:bg-emerald-950/20 ring-1 ring-emerald-500/50'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isToday
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayOccurrences.length > 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">
                      {dayOccurrences.filter((o) => o.status === 'COMPLETED').length}/{dayOccurrences.length}
                    </span>
                  )}
                </div>

                {/* Day Routine Chips */}
                <div className="space-y-1 overflow-y-auto max-h-[80px]">
                  {dayOccurrences.slice(0, 3).map((occ) => {
                    const routine = routineMap.get(occ.routineId);
                    if (!routine) return null;
                    const isCompleted = occ.status === 'COMPLETED';

                    return (
                      <div
                        key={occ.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRoutine(routine);
                        }}
                        className={`text-xs font-bold px-1.5 py-0.5 rounded truncate flex items-center gap-1 transition ${
                          isCompleted
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 line-through opacity-80'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                        }`}
                        title={`${routine.name} (${occ.plannedStart})`}
                      >
                        <span>{routine.icon || '⚡'}</span>
                        <span className="truncate">{routine.shortName || routine.name}</span>
                      </div>
                    );
                  })}
                  {dayOccurrences.length > 3 && (
                    <div className="text-xs font-bold text-slate-400 dark:text-slate-500 text-center">
                      +{dayOccurrences.length - 3} المزيد
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
