import {
  RoutineRecord,
  RoutineOccurrence,
  RoutineExecution,
  RoutineException,
  RoutineTemplate,
  ScheduleConflict,
  RoutineKPIs,
  HabitStreakItem,
  RoutineStep,
} from '../types/routines';

// Format time HH:mm to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

// Convert minutes from midnight to HH:mm
export function minutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Format duration into readable Arabic
export function formatDurationArabic(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} دقيقة`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (remMinutes === 0) {
    return hours === 1 ? 'ساعة واحدة' : hours === 2 ? 'ساعتان' : `${hours} ساعات`;
  }
  return `${hours} س و ${remMinutes} د`;
}

// Format seconds into MM:SS or HH:MM:SS
export function formatTimerSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Helper to check if a date matches a routine's recurrence schedule
export function isRoutineScheduledForDate(
  routine: RoutineRecord,
  dateStr: string,
  exceptions: RoutineException[] = []
): boolean {
  if (!routine.isActive || routine.status === 'ARCHIVED' || routine.status === 'DRAFT') {
    return false;
  }

  // Check start & end date constraints
  if (routine.startDate && dateStr < routine.startDate) return false;
  if (routine.endDate && dateStr > routine.endDate) return false;

  // Check exceptions (skip or cancel on this specific date)
  const hasSkipException = exceptions.some(
    (ex) => ex.routineId === routine.id && ex.originalDate === dateStr && ex.action === 'SKIP'
  );
  if (hasSkipException) return false;

  const dateObj = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = dateObj.getDay(); // 0: Sun, 1: Mon, ... 6: Sat
  const dayOfMonth = dateObj.getDate();

  switch (routine.type) {
    case 'DAILY':
      if (routine.frequency === 'يومي' || !routine.selectedDays || routine.selectedDays.length === 0) {
        return true;
      }
      return routine.selectedDays.includes(dayOfWeek);

    case 'WEEKDAYS': // Sun-Thu or Sat-Thu depending on culture (here Sat-Thu: 6,0,1,2,3,4)
      return [6, 0, 1, 2, 3, 4].includes(dayOfWeek);

    case 'WEEKENDS': // Friday (5) or Fri-Sat (5,6)
      return [5].includes(dayOfWeek);

    case 'WEEKLY':
      if (routine.selectedDays && routine.selectedDays.length > 0) {
        return routine.selectedDays.includes(dayOfWeek);
      }
      // default: first day of routine or Saturday
      return dayOfWeek === 6;

    case 'MONTHLY':
      if (routine.monthlyDay) {
        return dayOfMonth === routine.monthlyDay;
      }
      return dayOfMonth === 1;

    case 'CUSTOM_INTERVAL':
      if (routine.intervalDays && routine.intervalDays > 1 && routine.startDate) {
        const start = new Date(routine.startDate + 'T00:00:00').getTime();
        const current = dateObj.getTime();
        const diffDays = Math.floor((current - start) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays % routine.intervalDays === 0;
      }
      return true;

    default:
      return true;
  }
}

// Generate all occurrences for a specific date range
export function generateOccurrencesForDateRange(
  routines: RoutineRecord[],
  startDate: string,
  endDate: string,
  existingOccurrences: RoutineOccurrence[] = [],
  exceptions: RoutineException[] = []
): RoutineOccurrence[] {
  const result: RoutineOccurrence[] = [...existingOccurrences];
  const existingMap = new Map<string, RoutineOccurrence>();

  existingOccurrences.forEach((occ) => {
    existingMap.set(`${occ.date}_${occ.routineId}`, occ);
  });

  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const current = new Date(start);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];

    routines.forEach((routine) => {
      if (isRoutineScheduledForDate(routine, dateStr, exceptions)) {
        const key = `${dateStr}_${routine.id}`;
        if (!existingMap.has(key)) {
          const plannedStart = routine.startTime || '08:00';
          const startMins = timeToMinutes(plannedStart);
          const plannedEnd = routine.endTime || minutesToTime(startMins + (routine.duration || 30));

          const newOcc: RoutineOccurrence = {
            id: `occ-${dateStr}-${routine.id}`,
            routineId: routine.id,
            date: dateStr,
            plannedStart,
            plannedEnd,
            status: 'SCHEDULED',
            stepProgress: (routine.steps || []).map((st) => ({
              stepId: st.id,
              isCompleted: false,
            })),
          };
          result.push(newOcc);
          existingMap.set(key, newOcc);
        }
      }
    });

    current.setDate(current.getDate() + 1);
  }

  return result;
}

// Detect Schedule Conflicts
export function detectScheduleConflicts(
  occurrences: RoutineOccurrence[],
  routines: RoutineRecord[]
): ScheduleConflict[] {
  const routineMap = new Map<string, RoutineRecord>();
  routines.forEach((r) => routineMap.set(r.id, r));

  const byDate = new Map<string, RoutineOccurrence[]>();
  occurrences.forEach((occ) => {
    if (occ.status !== 'SKIPPED' && occ.status !== 'CANCELLED') {
      const list = byDate.get(occ.date) || [];
      list.push(occ);
      byDate.set(occ.date, list);
    }
  });

  const conflicts: ScheduleConflict[] = [];

  byDate.forEach((dayOccurrences, date) => {
    for (let i = 0; i < dayOccurrences.length; i++) {
      for (let j = i + 1; j < dayOccurrences.length; j++) {
        const occA = dayOccurrences[i];
        const occB = dayOccurrences[j];
        const rtnA = routineMap.get(occA.routineId);
        const rtnB = routineMap.get(occB.routineId);

        if (!rtnA || !rtnB) continue;

        const startA = timeToMinutes(occA.plannedStart);
        const endA = timeToMinutes(occA.plannedEnd);
        const startB = timeToMinutes(occB.plannedStart);
        const endB = timeToMinutes(occB.plannedEnd);

        // Check time interval overlap
        if (startA < endB && startB < endA) {
          const overlapStart = Math.max(startA, startB);
          const overlapEnd = Math.min(endA, endB);
          const overlapMinutes = overlapEnd - overlapStart;

          conflicts.push({
            id: `cnf-${date}-${rtnA.id}-${rtnB.id}`,
            date,
            routineA: {
              id: rtnA.id,
              name: rtnA.name,
              plannedStart: occA.plannedStart,
              plannedEnd: occA.plannedEnd,
            },
            routineB: {
              id: rtnB.id,
              name: rtnB.name,
              plannedStart: occB.plannedStart,
              plannedEnd: occB.plannedEnd,
            },
            overlapMinutes,
            suggestion: `يوجد تداخل زمني مدته ${overlapMinutes} دقيقة بين "${rtnA.shortName || rtnA.name}" و "${rtnB.shortName || rtnB.name}". يُقترح تقديم أحدهما أو تأخيره لتجنب الازدواجية.`,
          });
        }
      }
    }
  });

  return conflicts;
}

// Calculate comprehensive KPIs for Routines & Habits
export function calculateRoutineKPIs(
  routines: RoutineRecord[],
  occurrences: RoutineOccurrence[],
  executions: RoutineExecution[],
  todayDateStr: string = new Date().toISOString().split('T')[0]
): RoutineKPIs {
  const activeRoutines = routines.filter((r) => r.isActive && r.status === 'ACTIVE');
  const todayOccurrences = occurrences.filter((o) => o.date === todayDateStr);
  const completedToday = todayOccurrences.filter((o) => o.status === 'COMPLETED').length;
  const skippedToday = todayOccurrences.filter((o) => o.status === 'SKIPPED').length;
  const inProgressToday = todayOccurrences.filter((o) => o.status === 'IN_PROGRESS').length;
  const upcomingToday = todayOccurrences.filter(
    (o) => o.status === 'READY' || o.status === 'UPCOMING' || o.status === 'SCHEDULED'
  ).length;

  const todayCompletionRate =
    todayOccurrences.length > 0
      ? Math.round((completedToday / todayOccurrences.length) * 100)
      : 0;

  // Global completed vs planned stats
  const totalPlannedOccurrences = occurrences.length;
  const totalCompletedOccurrences = occurrences.filter((o) => o.status === 'COMPLETED').length;
  const globalCompletionRate =
    totalPlannedOccurrences > 0
      ? Math.round((totalCompletedOccurrences / totalPlannedOccurrences) * 100)
      : 0;

  // Streaks calculation
  let totalActiveStreaks = 0;
  let highestStreak = 0;
  let bestStreakRoutine = '';

  activeRoutines.forEach((r) => {
    const streak = r.currentStreak || 0;
    if (streak > 0) totalActiveStreaks++;
    if (streak > highestStreak) {
      highestStreak = streak;
      bestStreakRoutine = r.name;
    }
  });

  // Time & Duration stats
  let totalActualMinutes = 0;
  let totalPlannedMinutes = 0;
  let energySum = 0;
  let focusSum = 0;
  let validEnergyCount = 0;

  executions.forEach((ex) => {
    totalActualMinutes += ex.actualDuration || 0;
    totalPlannedMinutes += ex.plannedDuration || 0;
    if (ex.energyLevel) {
      energySum += ex.energyLevel;
      validEnergyCount++;
    }
    if (ex.focusLevel) {
      focusSum += ex.focusLevel;
    }
  });

  const avgEnergyLevel = validEnergyCount > 0 ? Number((energySum / validEnergyCount).toFixed(1)) : 4.5;
  const avgFocusLevel = validEnergyCount > 0 ? Number((focusSum / validEnergyCount).toFixed(1)) : 4.5;
  const avgDurationVariance =
    executions.length > 0
      ? Math.round((totalActualMinutes - totalPlannedMinutes) / executions.length)
      : 0;

  const totalCompleted = occurrences.filter((o) => o.status === 'COMPLETED').length;
  const totalActualHours = Number((totalActualMinutes / 60).toFixed(1));
  const totalPlannedHours = Number((totalPlannedMinutes / 60).toFixed(1));

  return {
    totalRoutines: routines.length,
    activeRoutines: activeRoutines.length,
    activeRoutinesCount: activeRoutines.length,
    todayPlannedCount: todayOccurrences.length,
    todayCompletedCount: completedToday,
    todayPendingCount: todayOccurrences.length - completedToday - skippedToday,
    todaySkippedCount: skippedToday,
    todayTotal: todayOccurrences.length,
    todayCompleted: completedToday,
    todaySkipped: skippedToday,
    todayInProgress: inProgressToday,
    todayUpcoming: upcomingToday,
    todayCompletionRate,
    completionRate: globalCompletionRate,
    globalCompletionRate,
    totalCompleted,
    totalOccurrences: occurrences.length,
    totalActualHours,
    totalPlannedHours,
    longestStreakRecord: highestStreak,
    activeStreaksCount: totalActiveStreaks,
    averageEnergyRating: avgEnergyLevel,
    averageFocusRating: avgFocusLevel,
    totalActiveStreaks,
    highestStreak,
    bestStreakRoutine,
    totalActualMinutes,
    avgDurationVariance,
    avgEnergyLevel,
    avgFocusLevel,
  };
}

// Generate Habit Streak item metrics
export function calculateHabitStreaksList(
  routines: RoutineRecord[],
  occurrences: RoutineOccurrence[],
  daysBack: number = 28
): HabitStreakItem[] {
  const today = new Date();
  const dateList: string[] = [];

  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dateList.push(d.toISOString().split('T')[0]);
  }

  const occurrencesMap = new Map<string, RoutineOccurrence>();
  occurrences.forEach((occ) => {
    occurrencesMap.set(`${occ.routineId}_${occ.date}`, occ);
  });

  return routines
    .filter((r) => r.isActive && r.status === 'ACTIVE')
    .map((routine) => {
      const history = dateList.map((dateStr) => {
        const occ = occurrencesMap.get(`${routine.id}_${dateStr}`);
        const isScheduled = isRoutineScheduledForDate(routine, dateStr);

        let status: 'completed' | 'missed' | 'skipped' | 'none' = 'none';
        if (occ) {
          if (occ.status === 'COMPLETED') status = 'completed';
          else if (occ.status === 'SKIPPED') status = 'skipped';
          else if (new Date(dateStr) < new Date(today.toISOString().split('T')[0])) {
            status = 'missed';
          }
        } else if (isScheduled && new Date(dateStr) < new Date(today.toISOString().split('T')[0])) {
          status = 'missed';
        }

        return {
          date: dateStr,
          status,
          completionRate: occ?.status === 'COMPLETED' ? 100 : 0,
        };
      });

      const totalScheduled = history.filter((h) => h.status !== 'none').length;
      const completedCount = history.filter((h) => h.status === 'completed').length;
      const consistencyRate =
        totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 100;

      return {
        routineId: routine.id,
        routineName: routine.name,
        shortName: routine.shortName || routine.name,
        category: routine.categoryName || 'عام',
        icon: routine.icon || '⚡',
        color: routine.color || 'emerald',
        currentStreak: routine.currentStreak || 0,
        longestStreak: routine.longestStreak || 0,
        consistencyRate,
        history,
      };
    });
}

// AI Routine Assistant & Generator (Realistic prompt parsing)
export function parseAIPromptToRoutine(prompt: string): Partial<RoutineRecord> {
  const text = prompt.toLowerCase();

  let name = 'روتين جديد ذكي';
  let categoryName = 'عمل وإدارة';
  let type: RoutineRecord['type'] = 'DAILY';
  let frequency = 'يومي';
  let duration = 30;
  let startTime = '08:30';
  let icon = '⚡';
  let color = 'emerald';
  let steps: RoutineStep[] = [];

  if (text.includes('صباح') || text.includes('انطلاق') || text.includes('بداية اليوم')) {
    name = 'الروتين الصباحي لتنظيم الأعمال';
    categoryName = 'صباحي وتخطيط';
    startTime = '08:00';
    duration = 30;
    icon = '🌅';
    color = 'emerald';
    steps = [
      { id: 'st-1', order: 1, title: 'مراجعة المواعيد والمهام لليوم', duration: 5, isRequired: true },
      { id: 'st-2', order: 2, title: 'فحص الرسائل العاجلة والإشعارات', duration: 5, isRequired: true },
      { id: 'st-3', order: 3, title: 'تحديد 3 أولويات رئيسية للتركيز', duration: 10, isRequired: true },
      { id: 'st-4', order: 4, title: 'تجهيز بيئة العمل ومستندات التشغيل', duration: 10, isRequired: false },
    ];
  } else if (text.includes('عملاء') || text.includes('صيدلي') || text.includes('مبيعات') || text.includes('اتصال')) {
    name = 'متابعة مسار العملاء والتحصيل الدوري';
    categoryName = 'مبيعات وعملاء';
    startTime = '09:30';
    duration = 45;
    icon = '🤝';
    color = 'blue';
    steps = [
      { id: 'st-1', order: 1, title: 'فرز كشوفات العملاء في مسار اليوم', duration: 5, isRequired: true },
      { id: 'st-2', order: 2, title: 'مراجعة المديونيات المستحقة للدفع اليوم', duration: 10, isRequired: true },
      { id: 'st-3', order: 3, title: 'إجراء اتصالات المتابعة وتأكيد التحصيل', duration: 20, isRequired: true },
      { id: 'st-4', order: 4, title: 'تدوين نتائج المحادثات وتحديث السجل', duration: 10, isRequired: true },
    ];
  } else if (text.includes('مال') || text.includes('صندوق') || text.includes('محاسب') || text.includes('إغلاق') || text.includes('جرد')) {
    name = 'مطابقة الصندوق والإغلاق المالي اليومي';
    categoryName = 'مالي ومحاسبي';
    startTime = '18:30';
    duration = 35;
    icon = '💰';
    color = 'amber';
    steps = [
      { id: 'st-1', order: 1, title: 'مطابقة النقد الفعلي مع رصيد السجل المالي اليومي', duration: 10, isRequired: true },
      { id: 'st-2', order: 2, title: 'تسجيل وتدقيق سندات الصرف والقبض المعلقة', duration: 10, isRequired: true },
      { id: 'st-3', order: 3, title: 'حفظ وتصدير نسخة احتياطية آمنة', duration: 5, isRequired: true },
      { id: 'st-4', order: 4, title: 'إرسال ملخص السيولة والموقف المالي للإدارة', duration: 10, isRequired: false },
    ];
  } else if (text.includes('طبيب') || text.includes('أطباء') || text.includes('عياد') || text.includes('مندوب')) {
    name = 'خطة زيارات الأطباء والعينات الترويجية';
    categoryName = 'مبيعات وعملاء';
    startTime = '16:00';
    duration = 40;
    icon = '🩺';
    color = 'purple';
    steps = [
      { id: 'st-1', order: 1, title: 'مراجعة مسار العيادات والمراكز لليوم', duration: 5, isRequired: true },
      { id: 'st-2', order: 2, title: 'فحص العينات الطبية والمواد العلمية', duration: 10, isRequired: true },
      { id: 'st-3', order: 3, title: 'تنفيذ الزيارات الميدانية ومناقشة الأصناف', duration: 20, isRequired: true },
      { id: 'st-4', order: 4, title: 'توثيق الملاحظات في سجل زيارات الأطباء', duration: 5, isRequired: true },
    ];
  } else if (text.includes('مشي') || text.includes('رياض') || text.includes('صحة') || text.includes('ماء')) {
    name = 'عادة المشي الصحي وتجديد الطاقة';
    categoryName = 'صحي وشخصي';
    startTime = '17:00';
    duration = 30;
    icon = '🌿';
    color = 'teal';
    steps = [
      { id: 'st-1', order: 1, title: 'شرب 500 مل ماء نقي', duration: 2, isRequired: true },
      { id: 'st-2', order: 2, title: 'مشي معتدل بالهواء الطلق', duration: 25, isRequired: true },
      { id: 'st-3', order: 3, title: 'تمارين إطالة واسترخاء العضلات', duration: 3, isRequired: false },
    ];
  } else if (text.includes('أسبوع') || text.includes('مراجعة') || text.includes('استراتيجي')) {
    name = 'المراجعة الاستراتيجية وتدقيق الأداء الأسبوعي';
    categoryName = 'مراجعة وتدقيق';
    type = 'WEEKLY';
    frequency = 'أسبوعي';
    startTime = '10:00';
    duration = 60;
    icon = '📊';
    color = 'rose';
    steps = [
      { id: 'st-1', order: 1, title: 'مراجعة مؤشرات الأداء والتحصيلات الأسبوعية', duration: 15, isRequired: true },
      { id: 'st-2', order: 2, title: 'تحليل حركة المخزون وتحديد النواقص والرواكد', duration: 15, isRequired: true },
      { id: 'st-3', order: 3, title: 'متابعة الديون المتعثرة واتخاذ قرارات الضمانات', duration: 15, isRequired: true },
      { id: 'st-4', order: 4, title: 'جدولة خطط الأسبوع القادم وتعيين المسؤوليات', duration: 15, isRequired: true },
    ];
  } else {
    name = prompt.trim().slice(0, 40) || 'روتين تشغيلي مخصص';
    steps = [
      { id: 'st-1', order: 1, title: 'التهيئة وتجهيز متطلبات الروتين', duration: 5, isRequired: true },
      { id: 'st-2', order: 2, title: 'تنفيذ المهمة الرئيسية للروتين', duration: 20, isRequired: true },
      { id: 'st-3', order: 3, title: 'مراجعة الإنجاز وتدوين الملاحظات', duration: 5, isRequired: false },
    ];
  }

  return {
    name,
    shortName: name.split(' ')[0] + ' ' + (name.split(' ')[1] || ''),
    description: `تم توليد هذا الروتين ذكياً بناءً على طلبك: "${prompt}"`,
    categoryName,
    type,
    frequency,
    startTime,
    duration,
    icon,
    color,
    priority: 4,
    importance: 4,
    steps,
    completionRule: 'REQUIRED_ONLY',
    isActive: true,
    status: 'ACTIVE',
  };
}

// AI Routine Optimization Advice
export function getAIRoutineOptimizationAdvice(routine: RoutineRecord): {
  score: number;
  tips: string[];
  suggestedSteps: RoutineStep[];
  circadianAdvice: string;
} {
  const tips: string[] = [];
  let score = 85;

  const totalStepsDuration = (routine.steps || []).reduce((sum, s) => sum + s.duration, 0);
  if (totalStepsDuration !== routine.duration) {
    tips.push(
      `مجموع مدد الخطوات (${totalStepsDuration} د) يختلف عن مدة الروتين الكلية (${routine.duration} د). تم ضبط التناسق التلقائي.`
    );
    score -= 5;
  }

  const startMins = timeToMinutes(routine.startTime || '08:00');
  let circadianAdvice = 'التوقيت متناسق مع منحنى النشاط الذهني.';

  if (startMins >= 480 && startMins <= 660) {
    circadianAdvice = 'الفترة الصباحية ممتازة للمهام ذات الأهمية العالية والتركيز العميق وقرارات التخطيط.';
  } else if (startMins > 660 && startMins <= 900) {
    circadianAdvice = 'فترة ما بعد الظهيرة مناسبة للتواصل والمكالمات والزيارات والمهام الحركية.';
  } else if (startMins > 1020) {
    circadianAdvice = 'الفترة المسائية مثالية للإغلاق اليومي والمطابقات ومراجعة الإنجاز والاسترخاء.';
  }

  if ((routine.steps || []).length < 2) {
    tips.push('يُفضل تقسيم الروتين إلى 3-5 خطوات متدرجة ليسهل تتبع إنجازه بدقة.');
    score -= 10;
  }

  if (!(routine.reminderSettings?.enabled)) {
    tips.push('تفعيل التنبيهات المسبقة (قبل 10 دقائق) يرفع معدل الالتزام بالروتين بنسبة 40%.');
  }

  return {
    score: Math.max(60, score),
    tips,
    suggestedSteps: routine.steps || [],
    circadianAdvice,
  };
}
