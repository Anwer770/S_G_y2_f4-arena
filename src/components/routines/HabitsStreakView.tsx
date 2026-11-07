import React, { useState } from 'react';
import {
  Flame,
  Award,
  TrendingUp,
  Calendar,
  Filter,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  Info,
} from 'lucide-react';
import { HabitStreakItem, RoutineRecord } from '../../types/routines';

interface HabitsStreakViewProps {
  habits: HabitStreakItem[];
  routines: RoutineRecord[];
  onSelectRoutine: (routineId: string) => void;
  onStartTimer: (routine: RoutineRecord) => void;
}

export const HabitsStreakView: React.FC<HabitsStreakViewProps> = ({
  habits,
  routines,
  onSelectRoutine,
  onStartTimer,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const categories = Array.from(new Set(habits.map((h) => h.category)));

  const filteredHabits = habits.filter((h) => {
    if (categoryFilter !== 'ALL' && h.category !== categoryFilter) return false;
    return true;
  });

  // Champions
  const bestStreakHabit = [...habits].sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0))[0];
  const bestConsistencyHabit = [...habits].sort((a, b) => (b.consistencyRate || 0) - (a.consistencyRate || 0))[0];

  return (
    <div id="habits-streak-view" className="space-y-5">
      {/* Top Highlights Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 rounded-xl shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <span className="text-xs font-bold text-amber-100 flex items-center gap-1">
              <Flame size={16} className="fill-white" /> أطول Streak حالي نشط
            </span>
            <h3 className="text-2xl font-black">{bestStreakHabit?.currentStreak || 0} يوماً متتالياً</h3>
            <p className="text-xs text-amber-100 line-clamp-1">{bestStreakHabit?.routineName || 'لا توجد بيانات'}</p>
          </div>
          <Flame size={110} className="absolute -left-4 -bottom-6 text-white/10" />
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-xl shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <span className="text-xs font-bold text-emerald-100 flex items-center gap-1">
              <Award size={16} /> أعلى معدل انضباط واستمرارية
            </span>
            <h3 className="text-2xl font-black">{bestConsistencyHabit?.consistencyRate || 100}%</h3>
            <p className="text-xs text-emerald-100 line-clamp-1">
              {bestConsistencyHabit?.routineName || 'لا توجد بيانات'}
            </p>
          </div>
          <Award size={110} className="absolute -left-4 -bottom-6 text-white/10" />
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-5 rounded-xl shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <span className="text-xs font-bold text-indigo-100 flex items-center gap-1">
              <TrendingUp size={16} /> إجمالي العادات والروتينات
            </span>
            <h3 className="text-2xl font-black">{habits.length} عادة مؤسسية</h3>
            <p className="text-xs text-indigo-100">تتبع مستمر على مدار الـ 28 يوماً السابقة</p>
          </div>
          <TrendingUp size={110} className="absolute -left-4 -bottom-6 text-white/10" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setCategoryFilter('ALL')}
          className={`px-3.5 py-2 rounded-xl font-bold transition ${
            categoryFilter === 'ALL'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          كافة التصنيفات ({habits.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-2 rounded-xl font-bold transition ${
              categoryFilter === cat
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {cat} ({habits.filter((h) => h.category === cat).length})
          </button>
        ))}
      </div>

      {/* Habit Matrix Cards */}
      <div className="space-y-4">
        {filteredHabits.map((habit) => {
          const correspondingRoutine = routines.find((r) => r.id === habit.routineId);

          return (
            <div
              key={habit.routineId}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl">
                    {habit.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        onClick={() => onSelectRoutine(habit.routineId)}
                        className="text-base font-bold text-slate-800 dark:text-white hover:text-emerald-600 cursor-pointer transition"
                      >
                        {habit.routineName}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        {habit.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      معدل الالتزام: <span className="font-bold text-emerald-600 dark:text-emerald-400">{habit.consistencyRate}%</span> • أطول مسار مستمر: {habit.longestStreak} يوم
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-amber-50 dark:bg-amber-950/40 px-3.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/40 flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-xs">
                    <Flame size={16} className="fill-amber-500 text-amber-500" />
                    <span>{habit.currentStreak} يوم متتالي</span>
                  </div>

                  {correspondingRoutine && (
                    <button
                      onClick={() => onStartTimer(correspondingRoutine)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
                    >
                      بدء الجلسة
                    </button>
                  )}
                </div>
              </div>

              {/* 28-Day Heatmap Grid */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-1.5">
                  <span>الـ 28 يوماً السابقة (من الأقدم إلى اليوم)</span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> مكتمل
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" /> فات الموعد
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> تم التخطي
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-slate-700 inline-block" /> غير مجدول
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-14 sm:grid-cols-28 gap-1.5">
                  {habit.history.map((day, idx) => {
                    let bgClass = 'bg-slate-100 dark:bg-slate-800 text-transparent';
                    if (day.status === 'completed') bgClass = 'bg-emerald-500 text-white';
                    else if (day.status === 'missed') bgClass = 'bg-rose-400 text-white';
                    else if (day.status === 'skipped') bgClass = 'bg-amber-400 text-white';

                    return (
                      <div
                        key={idx}
                        className={`h-7 rounded-md ${bgClass} flex items-center justify-center text-xs font-bold transition hover:scale-110 cursor-pointer`}
                        title={`${day.date}: ${day.status === 'completed' ? 'مكتمل' : day.status === 'missed' ? 'فات' : day.status === 'skipped' ? 'تم التخطي' : 'غير مجدول'}`}
                      >
                        {day.status === 'completed' ? '✓' : ''}
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
