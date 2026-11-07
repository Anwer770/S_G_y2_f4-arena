// ============================================================================
// ROUTINE MANAGEMENT MODULE TYPES (وحدة إدارة الروتين والعادات والجدولة v1.0.0)
// Product Requirements Document (PRD) Standard Schema
// ============================================================================

export type RoutineType =
  | 'DAILY'
  | 'WEEKDAYS'
  | 'WEEKENDS'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY'
  | 'CUSTOM'
  | 'CUSTOM_INTERVAL'
  | 'ONCE'
  | 'EVERY_X_DAYS'
  | 'EVERY_X_WEEKS'
  | 'EVERY_X_MONTHS';

export type RoutineFrequency =
  | 'يومي'
  | 'أيام العمل'
  | 'أيام مختارة'
  | 'أسبوعي'
  | 'شهري بتاريخ'
  | 'آخر يوم'
  | 'يوم نسبي'
  | 'فترة زمنية'
  | 'مخصص'
  | string;

export type RoutinePriority = 1 | 2 | 3 | 4 | 5; // 1: منخفضة, 2: عادية, 3: متوسطة, 4: عالية, 5: عاجلة
export type RoutinePriorityLabel = 'منخفضة' | 'عادية' | 'متوسطة' | 'عالية' | 'عاجلة';

export type RoutineStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'COMPLETED' | 'CANCELLED' | 'DRAFT';

export type OccurrenceStatus =
  | 'SCHEDULED'
  | 'UPCOMING'
  | 'READY'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'LATE'
  | 'SKIPPED'
  | 'MISSED'
  | 'CANCELLED'
  | 'POSTPONED'
  | 'PENDING';

export type RoutineCompletionRule = 'REQUIRED_ONLY' | 'ALL_STEPS';

export type ExceptionAction = 'SKIP' | 'CHANGE_TIME' | 'RESCHEDULE' | 'DISABLE' | 'OVERRIDE';

export type SkipReasonCode =
  | 'NO_TIME'
  | 'NOT_NEEDED'
  | 'PRIORITY_CHANGED'
  | 'EMERGENCY'
  | 'FORGOT'
  | 'UNABLE'
  | 'OTHER';

export interface RoutineStep {
  id: string;
  routineId?: string;
  title: string;
  description?: string;
  order: number;
  duration: number; // minutes
  isRequired: boolean;
  isCompleted?: boolean;
  notes?: string;
}

export interface RoutineSession {
  id: string;
  executionId?: string;
  startedAt: string; // ISO
  endedAt?: string; // ISO
  duration: number; // seconds
  status: 'active' | 'paused' | 'completed';
  notes?: string;
}

export type RoutineExecutionSession = RoutineSession;

export interface RoutineReminderSettings {
  enabled: boolean;
  offsetsMinutes: number[]; // e.g. [5, 15, 30]
  notifyOnLate: boolean;
  lateOffsetMinutes?: number; // e.g. 10
  notifyAtStart?: boolean;
}

export interface RoutineException {
  id: string;
  routineId: string;
  date: string; // YYYY-MM-DD
  originalDate?: string;
  action: ExceptionAction;
  newTime?: string;
  newDate?: string;
  reason: string;
  createdAt: string;
}

export interface RoutineRecord {
  id: string;
  code: string; // e.g. RTN-101
  name: string;
  shortName?: string;
  description: string;
  categoryId: string;
  categoryName: string;
  subCategoryId?: string;
  type: RoutineType;
  frequency: RoutineFrequency;
  recurrenceRule?: string;
  selectedDays?: number[]; // 0=Sunday, 1=Monday... 6=Saturday
  monthlyDay?: number;
  intervalDays?: number;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // Planned duration in minutes
  priority: RoutinePriority;
  importance: number; // 1-5
  status: RoutineStatus;
  isActive: boolean;
  color: string; // e.g. 'emerald', 'indigo', 'amber', 'rose', 'blue', 'purple', 'teal', 'cyan'
  icon: string; // emoji or icon key
  location?: string;
  owner?: string;
  goalIds?: string[];
  planIds?: string[];
  taskIds?: string[];
  appointmentIds?: string[];
  visitIds?: string[];
  reminderSettings: RoutineReminderSettings;
  steps: RoutineStep[];
  completionRule: RoutineCompletionRule;
  autoCreateTasks?: boolean;
  runOnHolidays?: boolean;
  runOnWeekends?: boolean;
  runOnOffDays?: boolean;
  exceptions?: RoutineException[];
  notes?: string;
  tags: string[];
  currentStreak: number;
  longestStreak: number;
  totalExecutions: number;
  completedExecutions: number;
  lastExecutedDate?: string;
  lastExecutedAt?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface RoutineOccurrence {
  id: string;
  routineId: string;
  routine?: RoutineRecord;
  date: string; // YYYY-MM-DD
  plannedStart: string; // HH:mm
  plannedEnd: string; // HH:mm
  actualStart?: string;
  actualEnd?: string;
  completedAt?: string;
  actualDuration?: number;
  completionRate?: number;
  energyLevel?: number;
  focusLevel?: number;
  postponeCount?: number;
  skipReason?: string;
  status: OccurrenceStatus;
  postponedTo?: string; // HH:mm or YYYY-MM-DD HH:mm
  postponeReason?: string;
  postponedAt?: string;
  skippedReason?: string;
  skippedAt?: string;
  notes?: string;
  isException?: boolean;
  exceptionType?: ExceptionAction;
  stepProgress?: { stepId: string; isCompleted: boolean }[];
}

export interface RoutineExecution {
  id: string;
  routineId: string;
  routineName: string;
  occurrenceId?: string;
  date: string; // YYYY-MM-DD
  plannedStart: string;
  plannedEnd: string;
  actualStart: string; // ISO
  actualEnd?: string; // ISO
  plannedDuration: number; // minutes
  actualDuration: number; // minutes
  status: OccurrenceStatus;
  completionRate: number; // 0..100
  completedStepsCount: number;
  totalStepsCount: number;
  skippedStepsCount: number;
  postponeCount: number;
  pauseCount: number;
  energyLevel?: number; // 1-5
  focusLevel?: number; // 1-5
  difficultyLevel?: number; // 1-5
  rating?: number; // 1-5 stars
  notes?: string;
  reason?: string;
  sessions?: RoutineSession[];
  stepDetails?: {
    id: string;
    title: string;
    isRequired: boolean;
    isCompleted: boolean;
    duration: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface RoutineTemplate {
  id: string;
  title: string;
  name?: string;
  shortName?: string;
  description: string;
  category: string;
  type?: RoutineType;
  frequency?: RoutineFrequency;
  suggestedStartTime?: string;
  suggestedDuration?: number;
  defaultStartTime?: string;
  defaultDuration?: number;
  priority: RoutinePriority;
  icon: string;
  color: string;
  completionRule?: RoutineCompletionRule;
  steps: {
    id?: string;
    order?: number;
    title: string;
    duration: number;
    isRequired: boolean;
    description?: string;
  }[];
  tags: string[];
}

export type RoutineTemplateItem = RoutineTemplate;

export interface RoutineCategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

export interface RoutineTagItem {
  id: string;
  name: string;
  color: string;
}

export interface RoutineAuditLog {
  id: string;
  timestamp: string;
  action: string;
  routineId?: string;
  routineName?: string;
  details: string;
  user?: string;
}

export interface RoutineModuleSettings {
  enableConflictDetection: boolean;
  defaultCompletionRule: RoutineCompletionRule;
  soundAlerts: boolean;
  autoStartNextStep: boolean;
  dayStartTime: string;
  dayEndTime: string;
  workingDays: number[]; // [6, 0, 1, 2, 3, 4] for Yemen/Arab workweek (Sat-Thu or Sun-Thu)
  streakResetGraceHours: number;
  autoScheduleOccurrencesDaysAhead: number;
}

export type RoutineSettings = RoutineModuleSettings;

export interface RoutineFilterState {
  search: string;
  categoryId: string;
  type: string;
  frequency: string;
  priority: string;
  status: string;
  tag: string;
  owner: string;
  onlyActive: boolean;
  onlyWithStreak: boolean;
  linkedGoalId?: string;
  dateRange?: { start: string; end: string };
  isTrashOnly?: boolean;
}

export type RoutineViewMode =
  | 'overview'
  | 'today'
  | 'routines'
  | 'habits'
  | 'timer'
  | 'calendar'
  | 'analytics'
  | 'reports'
  | 'templates'
  | 'executions'
  | 'ai-assistant'
  | 'settings';

export interface ScheduleConflict {
  id: string;
  date: string;
  routineA?: {
    id: string;
    name: string;
    plannedStart: string;
    plannedEnd: string;
  };
  routineB?: {
    id: string;
    name: string;
    plannedStart: string;
    plannedEnd: string;
  };
  occurrence1?: RoutineOccurrence;
  occurrence2?: RoutineOccurrence;
  routine1Name?: string;
  routine2Name?: string;
  overlapMinutes: number;
  timeRange1?: string;
  timeRange2?: string;
  suggestion?: string;
}

export interface RoutineKPIs {
  totalRoutines: number;
  activeRoutines?: number;
  activeRoutinesCount?: number;
  todayPlannedCount?: number;
  todayCompletedCount?: number;
  todayPendingCount?: number;
  todaySkippedCount?: number;
  todayTotal?: number;
  todayCompleted?: number;
  todaySkipped?: number;
  todayInProgress?: number;
  todayUpcoming?: number;
  todayCompletionRate: number;
  completionRate?: number;
  totalCompleted?: number;
  totalOccurrences?: number;
  globalCompletionRate?: number;
  weeklyAdherenceRate?: number;
  monthlyAdherenceRate?: number;
  totalActualHours?: number;
  totalPlannedHours?: number;
  longestStreakRecord?: number;
  activeStreaksCount?: number;
  averageEnergyRating?: number;
  averageFocusRating?: number;
  topStreaks?: { name: string; streak: number; category: string; icon: string }[];
  totalActiveStreaks?: number;
  highestStreak?: number;
  bestStreakRoutine?: string;
  totalFocusTimeMinutes?: number;
  totalActualMinutes?: number;
  avgDurationVariance?: number;
  totalExecutionsCount?: number;
  averageEnergyLevel?: number;
  averageFocusLevel?: number;
  avgEnergyLevel?: number;
  avgFocusLevel?: number;
  conflictsCount?: number;
}

export interface HabitStreakItem {
  routineId: string;
  routineName: string;
  shortName?: string;
  category?: string;
  categoryName?: string;
  icon: string;
  color: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletions?: number;
  consistencyRate?: number;
  consistencyScore?: number;
  history?: { date: string; status: 'completed' | 'missed' | 'skipped' | 'none'; completionRate?: number }[];
  last30DaysGrid?: { date: string; status: 'completed' | 'missed' | 'skipped' | 'none' }[];
}
