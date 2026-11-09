/**
 * نموذج عرض التقويم (R30) — الحالة والمحسوبات والمعالِجات، مستخرجة حرفياً
 * من `CalendarView.tsx` (نفس الترتيب ونفس الاعتماديات).
 */
import { useMemo, useState } from 'react';
import { CalendarViewMode } from '../../types';
import { calculateArabicDay } from '../../utils/formatters';
import { Filter } from 'lucide-react';
import type { CalendarViewProps } from './calendarTypes';
import { ARABIC_WEEKDAYS } from './calendarTypes';

export function useCalendarModel(props: CalendarViewProps) {
  const {
    tasks = [],
    commitments = [],
    onToggleComplete,
    onEditTask,
    onToggleCompleteCommitment,
    onEditCommitment,
    onAddTaskForDate,
    onAddCommitmentForDate,
  } = props;

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
    if (pri === 'A')
      return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    if (pri === 'B')
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    if (pri === 'C')
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  // Helper for status badge styling
  const getStatusColor = (status: string) => {
    if (status === 'تم الانجاز')
      return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    if (status === 'متأخر')
      return 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    if (status === 'قيد التنفيذ')
      return 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
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
      tasks,
      commitments,
      onToggleComplete,
      onEditTask,
      onToggleCompleteCommitment,
      onEditCommitment,
      onAddTaskForDate,
      onAddCommitmentForDate,
      activeTasksCount,
      completedTasksCount,
      totalTasks: activeTasksCount + completedTasksCount,
      commitmentsCount,
      totalCommitmentAmount,
    };
  }, [viewMode, monthDays, weekDays, selectedDateStr, filteredTasks, filteredCommitments]);

  return {
    getPriorityStyle,
    getStatusColor,
    typeFilter,
    tasks,
    commitments,
    onToggleComplete,
    onEditTask,
    onToggleCompleteCommitment,
    onEditCommitment,
    onAddTaskForDate,
    onAddCommitmentForDate,
    currentDate,
    getCommitmentsForDate,
    getTasksForDate,
    handleDayClick,
    handleNext,
    handlePrev,
    handleQuickAddCommitment,
    handleQuickAddTask,
    handleToday,
    monthDays,
    periodStats,
    priorityFilter,
    searchQuery,
    selectedDateStr,
    selectedDayModal,
    setCurrentDate,
    setPriorityFilter,
    setSearchQuery,
    setSelectedDayModal,
    setTypeFilter,
    setViewMode,
    todayStr,
    viewMode,
    weekDays,
  };
}

export type CalendarModel = ReturnType<typeof useCalendarModel>;
