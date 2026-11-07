import React, { useState, useMemo } from 'react';
import { CalendarViewMode, Task, Commitment } from '../../types';
import { downloadICS } from '../../utils/tasks';
import { calculateArabicDay, formatCurrency, formatArabicDate } from '../../utils/formatters';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Download,
  CheckCircle2,
  Clock,
  User,
  Tag,
  Check,
  Plus,
  Coins,
  DollarSign,
  Search,
  Filter,
  Layers,
  AlertTriangle,
  X,
  FileText,
  CalendarDays,
  Sparkles,
} from 'lucide-react';

export interface CalendarViewProps {
  tasks: Task[];
  commitments?: Commitment[];
  onToggleComplete?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onToggleCompleteCommitment?: (commitment: Commitment) => void;
  onEditCommitment?: (commitment: Commitment) => void;
  onAddTaskForDate?: (dateStr: string) => void;
  onAddCommitmentForDate?: (dateStr: string) => void;
}

const ARABIC_WEEKDAYS = [
  { name: 'السبت', short: 'سبت', index: 6 },
  { name: 'الأحد', short: 'أحد', index: 0 },
  { name: 'الإثنين', short: 'إثنين', index: 1 },
  { name: 'الثلاثاء', short: 'ثلاثاء', index: 2 },
  { name: 'الأربعاء', short: 'أربعاء', index: 3 },
  { name: 'الخميس', short: 'خميس', index: 4 },
  { name: 'الجمعة', short: 'جمعة', index: 5 },
];

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks = [],
  commitments = [],
  onToggleComplete,
  onEditTask,
  onToggleCompleteCommitment,
  onEditCommitment,
  onAddTaskForDate,
  onAddCommitmentForDate,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('monthly');
  // Initialize to current date (not hardcoded to past years)
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'tasks' | 'commitments'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'A' | 'B' | 'C'>('all');

  // Quick Day Click Action Dialog / Popover
  const [selectedDayModal, setSelectedDayModal] = useState<{
    dateStr: string;
    dayNum: number;
    dayName: string;
  } | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const selectedDateStr = useMemo(() => currentDate.toISOString().split('T')[0], [currentDate]);

  // Navigate functions
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'daily') next.setDate(next.getDate() - 1);
    else if (viewMode === 'weekly') next.setDate(next.getDate() - 7);
    else next.setMonth(next.getMonth() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'daily') next.setDate(next.getDate() + 1);
    else if (viewMode === 'weekly') next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper for priority badge styling
  const getPriorityStyle = (pri: string) => {
    if (pri === 'A') return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    if (pri === 'B') return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    if (pri === 'C') return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  // Helper for status badge styling
  const getStatusColor = (status: string) => {
    if (status === 'تم الانجاز') return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    if (status === 'متأخر') return 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    if (status === 'قيد التنفيذ') return 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    return 'text-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  // Filter tasks matching current search & priority
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (typeFilter === 'commitments') return false;
      if (priorityFilter !== 'all' && t.pri !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mTitle = t.title?.toLowerCase().includes(q);
        const mDesc = t.desc?.toLowerCase().includes(q);
        const mCat = t.cat?.toLowerCase().includes(q);
        const mResp = t.resp?.toLowerCase().includes(q);
        const mId = t.id?.toLowerCase().includes(q);
        if (!mTitle && !mDesc && !mCat && !mResp && !mId) return false;
      }
      return true;
    });
  }, [tasks, typeFilter, priorityFilter, searchQuery]);

  // Filter commitments matching current search & priority
  const filteredCommitments = useMemo(() => {
    return commitments.filter((c) => {
      if (typeFilter === 'tasks') return false;
      if (priorityFilter !== 'all' && c.pri !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mName = c.name?.toLowerCase().includes(q);
        const mDesc = c.desc?.toLowerCase().includes(q);
        const mId = c.id?.toLowerCase().includes(q);
        if (!mName && !mDesc && !mId) return false;
      }
      return true;
    });
  }, [commitments, typeFilter, priorityFilter, searchQuery]);

  // Calculate Days in Month for Monthly View (Arabic Saturday offset)
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Arabic week starts Saturday (index 6). Sunday is 0 -> mapped offset: (day + 1) % 7
    const firstDayIndex = (firstDay.getDay() + 1) % 7;
    const totalDays = lastDay.getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; dayName: string }[] = [];

    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      const str = prevDate.toISOString().split('T')[0];
      days.push({
        dateStr: str,
        dayNum: d,
        isCurrentMonth: false,
        dayName: calculateArabicDay(str),
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const curr = new Date(year, month, i);
      const str = curr.toISOString().split('T')[0];
      days.push({
        dateStr: str,
        dayNum: i,
        isCurrentMonth: true,
        dayName: calculateArabicDay(str),
      });
    }

    // Next month padding to fill complete 35 or 42 grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const str = nextDate.toISOString().split('T')[0];
      days.push({
        dateStr: str,
        dayNum: i,
        isCurrentMonth: false,
        dayName: calculateArabicDay(str),
      });
    }

    return days;
  }, [currentDate]);

  // Calculate Week Days for Weekly View (Saturday to Friday)
  const weekDays = useMemo(() => {
    const cur = new Date(currentDate);
    const day = cur.getDay(); // 0: Sun, 6: Sat
    const diffToSat = (day + 1) % 7;

    const sat = new Date(cur);
    sat.setDate(cur.getDate() - diffToSat);

    const days: { dateStr: string; dayName: string; dayNum: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sat);
      d.setDate(sat.getDate() + i);
      const str = d.toISOString().split('T')[0];
      days.push({
        dateStr: str,
        dayName: ARABIC_WEEKDAYS[i].name,
        dayNum: d.getDate(),
      });
    }
    return days;
  }, [currentDate]);

  // Retrieve tasks for a specific date
  const getTasksForDate = (dateStr: string) => {
    return filteredTasks.filter((t) => {
      const tEnd = t.end || t.start;
      return t.start <= dateStr && tEnd >= dateStr;
    });
  };

  // Retrieve commitments for a specific date
  const getCommitmentsForDate = (dateStr: string) => {
    return filteredCommitments.filter((c) => c.due === dateStr);
  };

  // Handlers for day clicks
  const handleDayClick = (dateStr: string, dayNum: number, dayName: string) => {
    setSelectedDayModal({ dateStr, dayNum, dayName });
  };

  const handleQuickAddTask = (dateStr: string) => {
    if (onAddTaskForDate) {
      onAddTaskForDate(dateStr);
    }
    setSelectedDayModal(null);
  };

  const handleQuickAddCommitment = (dateStr: string) => {
    if (onAddCommitmentForDate) {
      onAddCommitmentForDate(dateStr);
    }
    setSelectedDayModal(null);
  };

  // Calculate period summary statistics
  const periodStats = useMemo(() => {
    let activeTasksCount = 0;
    let completedTasksCount = 0;
    let totalCommitmentAmount = 0;
    let commitmentsCount = 0;

    const targetDates =
      viewMode === 'monthly'
        ? monthDays.filter((d) => d.isCurrentMonth).map((d) => d.dateStr)
        : viewMode === 'weekly'
        ? weekDays.map((d) => d.dateStr)
        : [selectedDateStr];

    const targetDateSet = new Set(targetDates);

    filteredTasks.forEach((t) => {
      const tEnd = t.end || t.start;
      const overlaps = targetDates.some((d) => t.start <= d && tEnd >= d);
      if (overlaps) {
        if (t.status === 'تم الانجاز') completedTasksCount++;
        else activeTasksCount++;
      }
    });

    filteredCommitments.forEach((c) => {
      if (c.due && targetDateSet.has(c.due)) {
        commitmentsCount++;
        totalCommitmentAmount += c.amount || 0;
      }
    });

    return {
      activeTasksCount,
      completedTasksCount,
      totalTasks: activeTasksCount + completedTasksCount,
      commitmentsCount,
      totalCommitmentAmount,
    };
  }, [viewMode, monthDays, weekDays, selectedDateStr, filteredTasks, filteredCommitments]);

  return (
    <div className="space-y-4" dir="rtl">
      {/* 1. CONTROL & NAVIGATION HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Navigation Controls & Title */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={handlePrev}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-all cursor-pointer shadow-2xs"
                title="الفترة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-bold hover:bg-white dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 rounded-lg transition-all cursor-pointer shadow-2xs"
              >
                اليوم
              </button>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-all cursor-pointer shadow-2xs"
                title="الفترة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
              <h2 className="font-black text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                {viewMode === 'monthly' &&
                  currentDate.toLocaleDateString('ar-YE', {
                    year: 'numeric',
                    month: 'long',
                  })}
                {viewMode === 'weekly' && (
                  <span>
                    أسبوع: {weekDays[0]?.dayNum} إلى {weekDays[6]?.dayNum}{' '}
                    {currentDate.toLocaleDateString('ar-YE', { month: 'long', year: 'numeric' })}
                  </span>
                )}
                {viewMode === 'daily' && (
                  <span>
                    {calculateArabicDay(selectedDateStr)} •{' '}
                    {currentDate.toLocaleDateString('ar-YE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* View Mode Switcher + Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-end">
            {/* View Mode Segmented Control */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'monthly'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                شهري
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'weekly'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                أسبوعي
              </button>
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'daily'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                يومي
              </button>
            </div>

            {/* Quick Add Task Button */}
            {onAddTaskForDate && (
              <button
                onClick={() => onAddTaskForDate(selectedDateStr)}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ مهمة جديدة</span>
              </button>
            )}

            {/* Quick Add Commitment Button */}
            {onAddCommitmentForDate && (
              <button
                onClick={() => onAddCommitmentForDate(selectedDateStr)}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>+ التزام مالي</span>
              </button>
            )}

            {/* ICS Calendar Export */}
            <button
              onClick={() => downloadICS(tasks, commitments)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="تصدير ملف التقويم ICS لمزامنة Google Calendar و Outlook"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">مزامنة ICS</span>
            </button>
          </div>
        </div>

        {/* Filters & Statistics Strip */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Filter */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                الكل ({tasks.length + commitments.length})
              </button>
              <button
                onClick={() => setTypeFilter('tasks')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  typeFilter === 'tasks'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                المهام ({tasks.length})
              </button>
              <button
                onClick={() => setTypeFilter('commitments')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  typeFilter === 'commitments'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                الالتزامات ({commitments.length})
              </button>
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              <option value="all">كافة الأولويات</option>
              <option value="A">أولوية عاجلة (A)</option>
              <option value="B">أولوية متوسطة (B)</option>
              <option value="C">أولوية عادية (C)</option>
            </select>

            {/* Quick Search Field */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في التقويم..."
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg pr-8 pl-6 py-1 text-[11px] text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 w-36 sm:w-44"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Period Summary Counters */}
          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <span>مهام الفترة:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                {periodStats.totalTasks}
              </strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>التزامات مالية:</span>
              <strong className="text-amber-700 dark:text-amber-400 font-mono font-bold">
                {periodStats.commitmentsCount} ({formatCurrency(periodStats.totalCommitmentAmount)} YER)
              </strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <span>منجز:</span>
              <strong className="font-mono">{periodStats.completedTasksCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. MONTHLY CALENDAR VIEW (جدول شهري تفاعلي) */}
      {viewMode === 'monthly' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Weekday Headers (Saturday to Friday) */}
          <div className="grid grid-cols-7 border-b border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-center py-2.5 text-xs font-black text-slate-700 dark:text-slate-300">
            {ARABIC_WEEKDAYS.map((w) => (
              <div key={w.name} className="flex items-center justify-center gap-1">
                <span>{w.name}</span>
              </div>
            ))}
          </div>

          {/* Days Grid (Interactive cells with click to add) */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
            {monthDays.map((d, idx) => {
              const dayTasks = getTasksForDate(d.dateStr);
              const dayCommitments = getCommitmentsForDate(d.dateStr);
              const totalEvents = dayTasks.length + dayCommitments.length;
              const isToday = d.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(d.dateStr, d.dayNum, d.dayName)}
                  className={`min-h-[120px] p-2 flex flex-col justify-between transition-all group relative cursor-pointer ${
                    !d.isCurrentMonth
                      ? 'bg-slate-50/40 dark:bg-slate-950/40 text-slate-300 dark:text-slate-600'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-teal-50/30 dark:hover:bg-teal-950/20'
                  } ${isToday ? 'bg-teal-50/40 dark:bg-teal-950/30 ring-2 ring-inset ring-teal-500' : ''}`}
                >
                  {/* Day Header Row: Day number + Add Button on Hover + Item Count */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center font-mono ${
                            isToday
                              ? 'bg-teal-600 text-white font-black shadow-xs'
                              : d.isCurrentMonth
                              ? 'text-slate-800 dark:text-slate-200'
                              : 'text-slate-400 dark:text-slate-600'
                          }`}
                        >
                          {d.dayNum}
                        </span>

                        {isToday && (
                          <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 hidden sm:inline">
                            اليوم
                          </span>
                        )}
                      </div>

                      {/* Quick Add Button on Day (Visible on hover and on touch) */}
                      <div className="flex items-center gap-1">
                        {totalEvents > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold">
                            {totalEvents}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAddTask(d.dateStr);
                          }}
                          className="w-5 h-5 rounded-md bg-teal-50 dark:bg-teal-900/60 hover:bg-teal-600 hover:text-white text-teal-700 dark:text-teal-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-2xs"
                          title={`إضافة مهمة جديدة ليوم ${d.dayName} ${d.dayNum}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Event Chips Container (Tasks & Commitments) */}
                    <div className="space-y-1 overflow-y-auto max-h-[80px] no-scrollbar">
                      {/* Task Chips */}
                      {dayTasks.slice(0, 2).map((t) => (
                        <div
                          key={`task-${t.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEditTask) onEditTask(t);
                          }}
                          className={`text-[11px] p-1 rounded-md border truncate font-medium flex items-center justify-between gap-1 transition-all hover:scale-[1.01] ${
                            t.status === 'تم الانجاز'
                              ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 line-through border-slate-200 dark:border-slate-700'
                              : t.pri === 'A'
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-900/60'
                              : 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-900/60'
                          }`}
                          title={`${t.title} (${t.status})`}
                        >
                          <span className="truncate flex-1">{t.title}</span>
                          {onToggleComplete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleComplete(t);
                              }}
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ${
                                t.status === 'تم الانجاز'
                                  ? 'bg-emerald-600 text-white'
                                  : 'border border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                              }`}
                            >
                              <Check className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Commitment Chips */}
                      {dayCommitments.slice(0, 2).map((c) => (
                        <div
                          key={`comm-${c.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEditCommitment) onEditCommitment(c);
                          }}
                          className={`text-[11px] p-1 rounded-md border truncate font-medium flex items-center justify-between gap-1 transition-all hover:scale-[1.01] ${
                            c.status === 'تم الانجاز'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 line-through border-slate-200 dark:border-slate-700'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800/60'
                          }`}
                          title={`التزام: ${c.name} - ${c.amount} YER`}
                        >
                          <div className="flex items-center gap-1 truncate">
                            <Coins className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="truncate">{c.name}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 shrink-0">
                            {Number(c.amount) >= 1000 ? `${Math.round(c.amount / 1000)}k` : c.amount}
                          </span>
                        </div>
                      ))}

                      {/* Overflow Badge */}
                      {totalEvents > 3 && (
                        <div className="text-[10px] text-teal-600 dark:text-teal-400 text-center font-bold pt-0.5">
                          +{totalEvents - 3} أخرى (اضغط للعرض)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Empty Day Prompt (Subtle on hover) */}
                  {totalEvents === 0 && d.isCurrentMonth && (
                    <div className="text-[10px] text-slate-300 dark:text-slate-600 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      + اضغط لإضافة مهمة
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. WEEKLY TIMELINE VIEW (جدول زمني أسبوعي تفاعلي) */}
      {viewMode === 'weekly' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-100 dark:divide-slate-800">
            {weekDays.map((w) => {
              const dayTasks = getTasksForDate(w.dateStr);
              const dayCommitments = getCommitmentsForDate(w.dateStr);
              const totalItems = dayTasks.length + dayCommitments.length;
              const isToday = w.dateStr === todayStr;

              return (
                <div
                  key={w.dateStr}
                  className={`p-3.5 min-h-[380px] flex flex-col justify-between transition-colors ${
                    isToday ? 'bg-teal-50/30 dark:bg-teal-950/20' : 'bg-white dark:bg-slate-900'
                  }`}
                >
                  {/* Day Column Header */}
                  <div>
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-2 mb-2.5">
                      <div className="flex items-center justify-between">
                        <span className="block text-xs font-black text-slate-600 dark:text-slate-400">
                          {w.dayName}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                            isToday
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {totalItems}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span
                          className={`text-lg font-black font-mono ${
                            isToday ? 'text-teal-600 dark:text-teal-400' : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {w.dayNum}
                        </span>
                        {isToday && (
                          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded">
                            اليوم
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Add Button Header in Column */}
                    <div className="flex items-center gap-1 mb-2.5">
                      <button
                        type="button"
                        onClick={() => handleQuickAddTask(w.dateStr)}
                        className="flex-1 py-1 px-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-teal-200/60 dark:border-teal-800/60 shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>مهمة</span>
                      </button>
                      {onAddCommitmentForDate && (
                        <button
                          type="button"
                          onClick={() => handleQuickAddCommitment(w.dateStr)}
                          className="py-1 px-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-amber-200/60 dark:border-amber-800/60 shadow-2xs"
                          title="إضافة التزام مالي لهذا اليوم"
                        >
                          <Coins className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Items List in Column */}
                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[460px] no-scrollbar">
                      {totalItems === 0 ? (
                        <div
                          onClick={() => handleDayClick(w.dateStr, w.dayNum, w.dayName)}
                          className="text-center py-12 text-slate-300 dark:text-slate-600 hover:text-teal-600 transition-colors cursor-pointer border-2 border-dashed border-slate-100 dark:border-slate-800/80 rounded-xl"
                        >
                          <Plus className="w-6 h-6 mx-auto mb-1 opacity-50" />
                          <p className="text-[11px] font-medium">اضغط للإضافة</p>
                        </div>
                      ) : (
                        <>
                          {/* Tasks Section */}
                          {dayTasks.map((t) => (
                            <div
                              key={`week-t-${t.id}`}
                              onClick={() => {
                                if (onEditTask) onEditTask(t);
                              }}
                              className={`p-2.5 rounded-xl border text-xs space-y-1.5 transition-all hover:shadow-xs cursor-pointer ${
                                t.status === 'تم الانجاز'
                                  ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 line-through'
                                  : 'bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 hover:border-teal-400'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <span className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight">
                                  {t.title}
                                </span>
                                {onToggleComplete && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleComplete(t);
                                    }}
                                    className={`p-1 rounded-md shrink-0 transition-colors ${
                                      t.status === 'تم الانجاز'
                                        ? 'bg-emerald-600 text-white'
                                        : 'border border-slate-300 dark:border-slate-600 text-slate-400 hover:border-emerald-500 hover:text-emerald-500'
                                    }`}
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                                <span className={`px-1.5 py-0.2 rounded border font-bold ${getPriorityStyle(t.pri)}`}>
                                  {t.pri}
                                </span>
                                <span className="truncate max-w-[80px]">{t.resp}</span>
                              </div>
                            </div>
                          ))}

                          {/* Commitments Section */}
                          {dayCommitments.map((c) => (
                            <div
                              key={`week-c-${c.id}`}
                              onClick={() => {
                                if (onEditCommitment) onEditCommitment(c);
                              }}
                              className={`p-2.5 rounded-xl border text-xs space-y-1.5 transition-all hover:shadow-xs cursor-pointer ${
                                c.status === 'تم الانجاز'
                                  ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 line-through'
                                  : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/90 dark:border-amber-900/60 hover:border-amber-400'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1 truncate font-bold text-amber-900 dark:text-amber-200">
                                  <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span className="truncate">{c.name}</span>
                                </div>
                                <span className="font-mono font-bold text-amber-800 dark:text-amber-300 shrink-0">
                                  {formatCurrency(c.amount)}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-amber-100 dark:border-amber-900/40">
                                <span className="text-amber-700 dark:text-amber-300 font-semibold">{c.status}</span>
                                <span className="font-bold text-slate-600 dark:text-slate-300">أولوية {c.pri}</span>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Column Bottom Action */}
                  <button
                    type="button"
                    onClick={() => handleDayClick(w.dateStr, w.dayNum, w.dayName)}
                    className="w-full mt-2 py-1.5 text-[11px] font-bold text-slate-500 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-center"
                  >
                    عرض تفاصيل اليوم →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. DAILY AGENDA VIEW (جدول يومي مفصل) */}
      {viewMode === 'daily' && (
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>مهام والتزامات يوم {calculateArabicDay(selectedDateStr)}</span>
                <span className="text-sm font-mono font-normal text-slate-500 dark:text-slate-400">
                  ({selectedDateStr})
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                الجدول الزمني المباشر وتتبع إنجاز المهام والالتزامات المستحقة في هذا اليوم
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickAddTask(selectedDateStr)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ مهمة جديدة لهذا اليوم</span>
              </button>

              {onAddCommitmentForDate && (
                <button
                  type="button"
                  onClick={() => handleQuickAddCommitment(selectedDateStr)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>+ التزام مالي</span>
                </button>
              )}
            </div>
          </div>

          {/* Content Columns: Tasks vs Commitments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Tasks List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>المهام التنفيذية ({getTasksForDate(selectedDateStr).length})</span>
                </h4>
              </div>

              {getTasksForDate(selectedDateStr).length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <CalendarIcon className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-1.5" />
                  <p className="text-xs font-medium">لا توجد مهام مسجلة لهذا اليوم.</p>
                  <button
                    onClick={() => handleQuickAddTask(selectedDateStr)}
                    className="mt-2 text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                  >
                    + إضافة مهمة الآن
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {getTasksForDate(selectedDateStr).map((t) => (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                        t.status === 'تم الانجاز'
                          ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500'
                          : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {onToggleComplete && (
                          <button
                            type="button"
                            onClick={() => onToggleComplete(t)}
                            className={`mt-0.5 p-1.5 rounded-lg shrink-0 transition-colors cursor-pointer ${
                              t.status === 'تم الانجاز'
                                ? 'bg-emerald-600 text-white'
                                : 'border-2 border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-500 hover:text-emerald-500'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.2 rounded">
                              {t.id}
                            </span>
                            <h5
                              className={`font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 ${
                                t.status === 'تم الانجاز' ? 'line-through text-slate-400' : ''
                              }`}
                            >
                              {t.title}
                            </h5>
                            <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getPriorityStyle(t.pri)}`}>
                              أولوية {t.pri}
                            </span>
                          </div>

                          {t.desc && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">{t.desc}</p>
                          )}

                          <div className="flex items-center flex-wrap gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                            <span>الفئة: <strong className="text-slate-700 dark:text-slate-200">{t.cat}</strong></span>
                            <span>العملية: <strong className="text-slate-700 dark:text-slate-200">{t.op}</strong></span>
                            <span>المسؤول: <strong className="text-slate-700 dark:text-slate-200">{t.resp}</strong></span>
                            {t.amount && (
                              <span>
                                المبلغ: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(t.amount)} YER</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(t.status)}`}>
                          {t.status}
                        </span>
                        {onEditTask && (
                          <button
                            type="button"
                            onClick={() => onEditTask(t)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                          >
                            تعديل
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Commitments List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>الالتزامات والمستحقات المالية ({getCommitmentsForDate(selectedDateStr).length})</span>
                </h4>
              </div>

              {getCommitmentsForDate(selectedDateStr).length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <DollarSign className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-1.5" />
                  <p className="text-xs font-medium">لا توجد التزامات مالية مستحقة لهذا اليوم.</p>
                  {onAddCommitmentForDate && (
                    <button
                      onClick={() => handleQuickAddCommitment(selectedDateStr)}
                      className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      + إضافة التزام مالي الآن
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {getCommitmentsForDate(selectedDateStr).map((c) => (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                        c.status === 'تم الانجاز'
                          ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500'
                          : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {onToggleCompleteCommitment && (
                          <button
                            type="button"
                            onClick={() => onToggleCompleteCommitment(c)}
                            className={`mt-0.5 p-1.5 rounded-lg shrink-0 transition-colors cursor-pointer ${
                              c.status === 'تم الانجاز'
                                ? 'bg-emerald-600 text-white'
                                : 'border-2 border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-500 hover:text-emerald-500'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-1.5 py-0.2 rounded">
                              {c.id}
                            </span>
                            <h5
                              className={`font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 ${
                                c.status === 'تم الانجاز' ? 'line-through text-slate-400' : ''
                              }`}
                            >
                              {c.name}
                            </h5>
                            <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getPriorityStyle(c.pri)}`}>
                              أولوية {c.pri}
                            </span>
                          </div>

                          <div className="text-base font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
                            {formatCurrency(c.amount)} YER
                          </div>

                          {c.desc && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{c.desc}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(c.status)}`}>
                          {c.status}
                        </span>
                        {onEditCommitment && (
                          <button
                            type="button"
                            onClick={() => onEditCommitment(c)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                          >
                            تعديل
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. INTERACTIVE DAY MODAL (النافذة السريعة عند النقر على أي يوم بالتقويم) */}
      {selectedDayModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    جدول يوم {selectedDayModal.dayName} ({selectedDayModal.dateStr})
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    اختر الإجراء المطلوب أو استعرض المهام المجدولة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions to Add on this Date */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickAddTask(selectedDayModal.dateStr)}
                className="p-3.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-right transition-all cursor-pointer flex flex-col justify-between shadow-2xs group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-xs group-hover:text-teal-700">مهمة جديدة</span>
                  <Plus className="w-4 h-4 text-teal-600" />
                </div>
                <span className="text-[11px] text-teal-600/80 dark:text-teal-400/80">
                  إضافة مهمة تنفيذية مجدولة لهذا التاريخ
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAddCommitment(selectedDayModal.dateStr)}
                className="p-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-right transition-all cursor-pointer flex flex-col justify-between shadow-2xs group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-xs group-hover:text-amber-700">التزام مالي</span>
                  <Coins className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
                  تسجيل دفعة أو قسط أو مستحق مالي
                </span>
              </button>
            </div>

            {/* Existing Items on this Day */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                <span>المسجل في هذا اليوم:</span>
                <span className="text-[11px] font-mono text-slate-400">
                  {getTasksForDate(selectedDayModal.dateStr).length} مهام •{' '}
                  {getCommitmentsForDate(selectedDayModal.dateStr).length} التزامات
                </span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {getTasksForDate(selectedDayModal.dateStr).length === 0 &&
                getCommitmentsForDate(selectedDayModal.dateStr).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    لا توجد أي مهام أو التزامات مجدولة في هذا اليوم بعد.
                  </p>
                ) : (
                  <>
                    {getTasksForDate(selectedDayModal.dateStr).map((t) => (
                      <div
                        key={`modal-t-${t.id}`}
                        onClick={() => {
                          setSelectedDayModal(null);
                          if (onEditTask) onEditTask(t);
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-teal-400 transition-colors cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                            {t.title}
                          </span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${getPriorityStyle(t.pri)}`}>
                          أولوية {t.pri}
                        </span>
                      </div>
                    ))}

                    {getCommitmentsForDate(selectedDayModal.dateStr).map((c) => (
                      <div
                        key={`modal-c-${c.id}`}
                        onClick={() => {
                          setSelectedDayModal(null);
                          if (onEditCommitment) onEditCommitment(c);
                        }}
                        className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 hover:border-amber-400 transition-colors cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="font-bold text-amber-900 dark:text-amber-100 truncate">
                            {c.name}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                          {formatCurrency(c.amount)} YER
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setCurrentDate(new Date(selectedDayModal.dateStr));
                  setViewMode('daily');
                  setSelectedDayModal(null);
                }}
                className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
              >
                الانتقال للعرض اليومي الكامل لهذا التاريخ ←
              </button>
              <button
                type="button"
                onClick={() => setSelectedDayModal(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
