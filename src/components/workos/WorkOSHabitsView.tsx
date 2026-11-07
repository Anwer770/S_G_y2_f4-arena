import React from 'react';
import { HabitItem } from '../../types/workos';
import { Flame, Check, Plus, Trophy, Award, Calendar, RotateCcw } from 'lucide-react';

interface WorkOSHabitsViewProps {
  habits: HabitItem[];
  onToggleHabitDay: (habitId: string, dateStr: string) => void;
  onOpenQuickAdd: (type?: string) => void;
}

export const WorkOSHabitsView: React.FC<WorkOSHabitsViewProps> = ({
  habits = [],
  onToggleHabitDay = (..._args: any[]) => {},
  onOpenQuickAdd = (..._args: any[]) => {},
}) => {
  // Generate current week dates (last 7 days)
  const today = new Date();
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return {
      dateStr: `${yyyy}-${mm}-${dd}`,
      dayName: d.toLocaleDateString('ar-YE', { weekday: 'narrow' }),
      dayNumber: dd,
    };
  });

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">سجل العادات اليومية والانضباط المهني</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">تتبع استمرارية العادات وسلاسل الالتزام (Streaks) لتحقيق الكفاءة</p>
          </div>
        </div>

        <button
          onClick={() => onOpenQuickAdd('habit')}
          className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>عادة جديدة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.map((habit) => {
          return (
            <div
              key={habit.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-5 space-y-4 hover:border-orange-300 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-700">
                    {habit.category}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1">{habit.name}</h3>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 dark:bg-orange-950/40 text-orange-700 rounded-full border border-orange-200 text-xs font-bold font-mono">
                  <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400 fill-orange-500" />
                  <span>{habit.streak} يوم</span>
                </div>
              </div>

              {habit.notes && (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{habit.notes}</p>
              )}

              {/* 7-Day interactive check-in dots */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-400 dark:text-slate-500 font-bold">تسجيل إنجاز آخر 7 أيام:</div>
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {weekDays.map((wd) => {
                    const isDone = habit.completedDates.includes(wd.dateStr);
                    return (
                      <button
                        key={wd.dateStr}
                        onClick={() => onToggleHabitDay(habit.id, wd.dateStr)}
                        className={`p-1.5 rounded-lg text-xs font-bold flex flex-col items-center justify-center transition cursor-pointer ${
                          isDone
                            ? 'bg-orange-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <span className="text-xs opacity-80">{wd.dayName}</span>
                        <span className="font-mono text-xs">{wd.dayNumber}</span>
                        {isDone ? (
                          <Check className="w-3 h-3 mt-0.5" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-1">
                <span>الهدف: {habit.targetDaysPerWeek} أيام أسبوعياً</span>
                <span className="font-mono font-bold text-slate-600 dark:text-slate-300">أفضل سلسلة: {habit.bestStreak} يوم</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
