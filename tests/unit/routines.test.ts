import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RoutineExecution, RoutineException, RoutineOccurrence, RoutineRecord } from '../../src/types/routines';
import { auditService, type CentralAuditEntry } from '../../src/core/audit/AuditService';
import { RoutinesRepository } from '../../src/database/repositories/OtherRepositories';
import { RoutineService } from '../../src/services/routines/RoutineService';
import { Outbox, type OutboxMutation } from '../../src/sync/Outbox';
import {
  calculateHabitStreaksList,
  calculateRoutineKPIs,
  detectScheduleConflicts,
  formatDurationArabic,
  formatTimerSeconds,
  generateOccurrencesForDateRange,
  getAIRoutineOptimizationAdvice,
  isRoutineScheduledForDate,
  minutesToTime,
  parseAIPromptToRoutine,
  timeToMinutes,
} from '../../src/utils/routines';

const routine = (overrides: Partial<RoutineRecord> = {}): RoutineRecord => ({
  id: 'RTN-1001',
  code: 'RTN-1001',
  name: 'روتين الاختبار',
  shortName: 'الاختبار',
  description: 'روتين لتثبيت العقود',
  categoryId: 'cat-test',
  categoryName: 'اختبارات',
  type: 'DAILY',
  frequency: 'يومي',
  startDate: '2026-11-01',
  startTime: '08:00',
  endTime: '08:30',
  duration: 30,
  priority: 4,
  importance: 4,
  status: 'ACTIVE',
  isActive: true,
  color: 'emerald',
  icon: '⚡',
  reminderSettings: { enabled: true, offsetsMinutes: [10], notifyOnLate: false },
  steps: [
    { id: 'STEP-1', title: 'الخطوة الأولى', order: 1, duration: 20, isRequired: true },
    { id: 'STEP-2', title: 'الخطوة الثانية', order: 2, duration: 10, isRequired: false },
  ],
  completionRule: 'REQUIRED_ONLY',
  tags: ['اختبار'],
  currentStreak: 0,
  longestStreak: 0,
  totalExecutions: 0,
  completedExecutions: 0,
  createdAt: '2026-11-01T08:00:00.000Z',
  updatedAt: '2026-11-01T08:00:00.000Z',
  ...overrides,
});

const occurrence = (overrides: Partial<RoutineOccurrence> = {}): RoutineOccurrence => ({
  id: 'OCC-1001',
  routineId: 'RTN-1001',
  date: '2026-11-07',
  plannedStart: '08:00',
  plannedEnd: '08:30',
  status: 'SCHEDULED',
  ...overrides,
});

const execution = (overrides: Partial<RoutineExecution> = {}): RoutineExecution => ({
  id: 'EXE-1001',
  routineId: 'RTN-1001',
  routineName: 'روتين الاختبار',
  occurrenceId: 'OCC-1001',
  date: '2026-11-07',
  plannedStart: '08:00',
  plannedEnd: '08:30',
  actualStart: '2026-11-07T08:00:00.000Z',
  plannedDuration: 30,
  actualDuration: 30,
  status: 'COMPLETED',
  completionRate: 100,
  completedStepsCount: 2,
  totalStepsCount: 2,
  skippedStepsCount: 0,
  postponeCount: 0,
  pauseCount: 0,
  createdAt: '2026-11-07T08:30:00.000Z',
  updatedAt: '2026-11-07T08:30:00.000Z',
  ...overrides,
});

const createRepo = () =>
  ({
    getAll: vi.fn<() => RoutineRecord[]>(() => []),
    getById: vi.fn<(id: string) => RoutineRecord | null>(() => null),
    add: vi.fn<(entry: RoutineRecord) => RoutineRecord>((entry) => entry),
    update: vi.fn<(id: string, patch: Partial<RoutineRecord>) => RoutineRecord | null>(() => null),
    delete: vi.fn<(id: string) => boolean>(() => false),
  }) as unknown as RoutinesRepository;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-07T12:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('R65 — وقت الروتين وتكراره', () => {
  it('يحوّل الوقت والمدة والمؤقت عبر الحدود اليومية وصيغ العربية', () => {
    expect(timeToMinutes('')).toBe(0);
    expect(timeToMinutes('09:05')).toBe(545);
    expect(timeToMinutes('bad:value')).toBe(0);
    expect(minutesToTime(0)).toBe('00:00');
    expect(minutesToTime(1505)).toBe('01:05');
    expect(minutesToTime(-1)).toBe('23:59');
    expect(formatDurationArabic(45)).toBe('45 دقيقة');
    expect(formatDurationArabic(60)).toBe('ساعة واحدة');
    expect(formatDurationArabic(120)).toBe('ساعتان');
    expect(formatDurationArabic(180)).toBe('3 ساعات');
    expect(formatDurationArabic(125)).toBe('2 س و 5 د');
    expect(formatTimerSeconds(65)).toBe('01:05');
    expect(formatTimerSeconds(3661)).toBe('01:01:01');
  });

  it('يرفض الروتين المعطل وخارج الفترة والاستثناء والتاريخ التقويمي غير الصحيح', () => {
    expect(isRoutineScheduledForDate(routine({ isActive: false }), '2026-11-07')).toBe(false);
    expect(isRoutineScheduledForDate(routine({ status: 'ARCHIVED' }), '2026-11-07')).toBe(false);
    expect(isRoutineScheduledForDate(routine({ status: 'DRAFT' }), '2026-11-07')).toBe(false);
    expect(isRoutineScheduledForDate(routine({ startDate: '2026-11-08' }), '2026-11-07')).toBe(false);
    expect(isRoutineScheduledForDate(routine({ endDate: '2026-11-06' }), '2026-11-07')).toBe(false);
    const exceptions: RoutineException[] = [
      {
        id: 'EX-1',
        routineId: 'RTN-1001',
        date: '2026-11-07',
        originalDate: '2026-11-07',
        action: 'SKIP',
        reason: 'إجازة',
        createdAt: '2026-11-01T00:00:00.000Z',
      },
    ];
    expect(isRoutineScheduledForDate(routine(), '2026-11-07', exceptions)).toBe(false);
    expect(isRoutineScheduledForDate(routine(), '2026-11-31')).toBe(false);
    expect(isRoutineScheduledForDate(routine(), '2026-11-7')).toBe(false);
    expect(
      isRoutineScheduledForDate(
        routine({ type: 'CUSTOM_INTERVAL', intervalDays: 3, startDate: '0000-00-00' }),
        '2026-11-07'
      )
    ).toBe(false);
  });

  it('يطابق كل جدول مدعوم مع يومه التقويمي UTC لا يوم المنطقة المحلية', () => {
    const selectedSaturday = routine({ frequency: 'أيام مختارة', selectedDays: [6] });
    expect(isRoutineScheduledForDate(selectedSaturday, '2026-11-07')).toBe(true);
    expect(isRoutineScheduledForDate(selectedSaturday, '2026-11-08')).toBe(false);
    expect(isRoutineScheduledForDate(routine({ type: 'WEEKDAYS' }), '2026-11-06')).toBe(false);
    expect(isRoutineScheduledForDate(routine({ type: 'WEEKDAYS' }), '2026-11-07')).toBe(true);
    expect(isRoutineScheduledForDate(routine({ type: 'WEEKENDS' }), '2026-11-06')).toBe(true);
    expect(isRoutineScheduledForDate(routine({ type: 'WEEKENDS' }), '2026-11-07')).toBe(false);
    expect(isRoutineScheduledForDate(routine({ type: 'WEEKLY', selectedDays: [0] }), '2026-11-08')).toBe(true);
    expect(isRoutineScheduledForDate(routine({ type: 'WEEKLY', selectedDays: [] }), '2026-11-07')).toBe(true);
    expect(isRoutineScheduledForDate(routine({ type: 'MONTHLY', monthlyDay: 7 }), '2026-11-07')).toBe(true);
    expect(isRoutineScheduledForDate(routine({ type: 'MONTHLY' }), '2026-11-01')).toBe(true);
    expect(
      isRoutineScheduledForDate(
        routine({ type: 'CUSTOM_INTERVAL', intervalDays: 3, startDate: '2026-11-01' }),
        '2026-11-07'
      )
    ).toBe(true);
    expect(
      isRoutineScheduledForDate(
        routine({ type: 'CUSTOM_INTERVAL', intervalDays: 3, startDate: '2026-11-01' }),
        '2026-11-06'
      )
    ).toBe(false);
    expect(isRoutineScheduledForDate(routine({ type: 'CUSTOM_INTERVAL', intervalDays: 1 }), '2026-11-07')).toBe(true);
    expect(isRoutineScheduledForDate(routine({ type: 'UNKNOWN' as RoutineRecord['type'] }), '2026-11-07')).toBe(true);

    vi.spyOn(Date.prototype, 'getDay').mockReturnValue(5);
    expect(isRoutineScheduledForDate(selectedSaturday, '2026-11-07')).toBe(true);
  });

  it('ينشئ التكرارات بلا ازدواج ويحترم الوقت الافتراضي والخطوات والاستثناءات', () => {
    const existing = occurrence({ id: 'OCC-EXISTING', date: '2026-11-07' });
    const custom = routine({
      id: 'RTN-CUSTOM',
      frequency: 'أيام مختارة',
      selectedDays: [6, 0],
      startTime: '' as unknown as string,
      endTime: '' as unknown as string,
      duration: 45,
    });
    const skipped = routine({ id: 'RTN-SKIP' });
    const result = generateOccurrencesForDateRange(
      [routine(), custom, skipped],
      '2026-11-07',
      '2026-11-08',
      [existing],
      [
        {
          id: 'EX-SKIP',
          routineId: 'RTN-SKIP',
          date: '2026-11-08',
          originalDate: '2026-11-08',
          action: 'SKIP',
          reason: 'إجازة',
          createdAt: '2026-11-01T00:00:00.000Z',
        },
      ]
    );

    expect(result).toHaveLength(5);
    expect(result.filter((item) => item.routineId === 'RTN-1001')).toEqual([existing, expect.anything()]);
    expect(result.find((item) => item.routineId === 'RTN-CUSTOM' && item.date === '2026-11-07')).toMatchObject({
      plannedStart: '08:00',
      plannedEnd: '08:45',
      stepProgress: [
        { stepId: 'STEP-1', isCompleted: false },
        { stepId: 'STEP-2', isCompleted: false },
      ],
    });
    expect(result.some((item) => item.routineId === 'RTN-SKIP' && item.date === '2026-11-08')).toBe(false);
    expect(generateOccurrencesForDateRange([routine()], 'invalid', '2026-11-08', [existing])).toEqual([existing]);
    expect(generateOccurrencesForDateRange([routine()], '2026-11-08', '2026-11-07', [existing])).toEqual([existing]);
    expect(
      generateOccurrencesForDateRange(
        [
          routine({
            id: 'RTN-EMPTY',
            endTime: '' as unknown as string,
            duration: 0,
            steps: undefined as unknown as RoutineRecord['steps'],
          }),
        ],
        '2026-11-07',
        '2026-11-07'
      )[0]
    ).toMatchObject({ plannedEnd: '08:30', stepProgress: [] });
  });

  it('يكشف التداخل الفعلي فقط ويتجاهل الملغى والمجهول والمتلامس عند الحد', () => {
    const first = occurrence({ id: 'OCC-A', routineId: 'RTN-A', plannedStart: '08:00', plannedEnd: '09:00' });
    const overlap = occurrence({ id: 'OCC-B', routineId: 'RTN-B', plannedStart: '08:30', plannedEnd: '09:30' });
    const boundary = occurrence({ id: 'OCC-C', routineId: 'RTN-C', plannedStart: '09:30', plannedEnd: '10:00' });
    const skipped = occurrence({
      id: 'OCC-D',
      routineId: 'RTN-D',
      status: 'SKIPPED',
      plannedStart: '08:15',
      plannedEnd: '08:45',
    });
    const cancelled = occurrence({
      id: 'OCC-E',
      routineId: 'RTN-E',
      status: 'CANCELLED',
      plannedStart: '08:15',
      plannedEnd: '08:45',
    });
    const missing = occurrence({ id: 'OCC-MISSING', routineId: 'MISSING', plannedStart: '08:15', plannedEnd: '08:45' });
    const result = detectScheduleConflicts(
      [first, overlap, boundary, skipped, cancelled, missing],
      [
        routine({ id: 'RTN-A', name: 'ألف', shortName: undefined }),
        routine({ id: 'RTN-B', name: 'باء', shortName: undefined }),
        routine({ id: 'RTN-C', name: 'جيم' }),
      ]
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'cnf-2026-11-07-RTN-A-RTN-B', overlapMinutes: 30 });
    expect(result[0]?.suggestion).toContain('"ألف"');
  });
});

describe('R65 — مؤشرات العادة ومولد الروتين', () => {
  it('يفصل مؤشرات اليوم والإجمالي والطاقة والتركيز ولا يقسم التركيز على عداد الطاقة', () => {
    const today = '2026-11-07';
    const routines = [
      routine({ currentStreak: 4 }),
      routine({ id: 'RTN-ZERO', name: 'صفر', currentStreak: 0 }),
      routine({ id: 'RTN-PAUSED', isActive: false, status: 'PAUSED', currentStreak: 9 }),
    ];
    const occurrences = [
      occurrence({ status: 'COMPLETED' }),
      occurrence({ id: 'OCC-SKIP', status: 'SKIPPED' }),
      occurrence({ id: 'OCC-PROGRESS', status: 'IN_PROGRESS' }),
      occurrence({ id: 'OCC-READY', status: 'READY' }),
      occurrence({ id: 'OCC-UPCOMING', status: 'UPCOMING' }),
      occurrence({ id: 'OCC-SCHEDULED', status: 'SCHEDULED' }),
      occurrence({ id: 'OCC-OTHER-DAY', date: '2026-11-06', status: 'COMPLETED' }),
    ];
    const kpis = calculateRoutineKPIs(
      routines,
      occurrences,
      [
        execution({ actualDuration: 20, plannedDuration: 30, energyLevel: 2, focusLevel: 4 }),
        execution({ id: 'EXE-2', actualDuration: 40, plannedDuration: 30, focusLevel: 2 }),
        execution({ id: 'EXE-3', actualDuration: 0, plannedDuration: 0, energyLevel: 0, focusLevel: 0 }),
      ],
      today
    );

    expect(kpis).toMatchObject({
      totalRoutines: 3,
      activeRoutines: 2,
      todayPlannedCount: 6,
      todayCompletedCount: 1,
      todaySkippedCount: 1,
      todayPendingCount: 4,
      todayInProgress: 1,
      todayUpcoming: 3,
      todayCompletionRate: 17,
      globalCompletionRate: 29,
      totalActualMinutes: 60,
      totalActualHours: 1,
      totalPlannedHours: 1,
      avgDurationVariance: 0,
      highestStreak: 4,
      bestStreakRoutine: 'روتين الاختبار',
      avgEnergyLevel: 2,
      avgFocusLevel: 3,
    });
    expect(calculateRoutineKPIs([], [], [], today)).toMatchObject({
      todayCompletionRate: 0,
      globalCompletionRate: 0,
      avgEnergyLevel: 4.5,
      avgFocusLevel: 4.5,
    });
  });

  it('يبني تاريخ العادة، ويفرق المكتمل والمتخطى والفائت وغير المجدول', () => {
    const active = routine({
      frequency: 'يومي',
      shortName: undefined,
      categoryName: undefined as unknown as string,
      icon: undefined as unknown as string,
      color: undefined as unknown as string,
      currentStreak: 0,
      longestStreak: 0,
    });
    const inactive = routine({ id: 'RTN-INACTIVE', isActive: false });
    const list = calculateHabitStreaksList(
      [active, inactive],
      [
        occurrence({ id: 'OCC-LATE', date: '2026-11-04', status: 'SCHEDULED' }),
        occurrence({ date: '2026-11-05', status: 'COMPLETED' }),
        occurrence({ id: 'OCC-SKIP', date: '2026-11-06', status: 'SKIPPED' }),
        occurrence({ id: 'OCC-TODAY', date: '2026-11-07', status: 'SCHEDULED' }),
      ],
      5
    );

    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      routineId: 'RTN-1001',
      shortName: 'روتين الاختبار',
      category: 'عام',
      icon: '⚡',
      color: 'emerald',
      consistencyRate: 25,
      currentStreak: 0,
      longestStreak: 0,
    });
    expect(list[0]?.history?.map((entry) => entry.status)).toEqual([
      'missed',
      'missed',
      'completed',
      'skipped',
      'none',
    ]);
    expect(
      calculateHabitStreaksList([routine({ selectedDays: [], frequency: 'أيام مختارة' })], [], 1)[0]?.consistencyRate
    ).toBe(100);
  });

  it('يطبع كل مسار من مولد الروتين النصي ويحفظ الطلب الأصلي في الوصف', () => {
    const cases: Array<[string, Partial<RoutineRecord>]> = [
      ['روتين صباح للعمل', { categoryName: 'صباحي وتخطيط', startTime: '08:00', icon: '🌅' }],
      ['اتصال العملاء', { categoryName: 'مبيعات وعملاء', startTime: '09:30', icon: '🤝' }],
      ['إغلاق الصندوق', { categoryName: 'مالي ومحاسبي', startTime: '18:30', icon: '💰' }],
      ['زيارة طبيب في العيادة', { startTime: '16:00', icon: '🩺' }],
      ['رياضة ومشي', { categoryName: 'صحي وشخصي', startTime: '17:00', icon: '🌿' }],
      ['مراجعة أسبوعية', { type: 'WEEKLY', frequency: 'أسبوعي', startTime: '10:00', icon: '📊' }],
      ['   ', { name: 'روتين تشغيلي مخصص', startTime: '08:30', icon: '⚡' }],
      ['custom', { name: 'custom', startTime: '08:30', icon: '⚡' }],
    ];

    for (const [prompt, expected] of cases) {
      const generated = parseAIPromptToRoutine(prompt);
      expect(generated).toMatchObject(expected);
      expect(generated.steps?.length).toBeGreaterThan(0);
      expect(generated.description).toContain(prompt);
      expect(generated).toMatchObject({
        priority: 4,
        importance: 4,
        completionRule: 'REQUIRED_ONLY',
        isActive: true,
        status: 'ACTIVE',
      });
    }
  });

  it('يعطي نصائح التحسين للمدة والخطوات والتنبيه ولكل نطاق وقت', () => {
    const weak = routine({
      duration: 90,
      startTime: '08:00',
      steps: [routine().steps[0]!],
      reminderSettings: { enabled: false, offsetsMinutes: [], notifyOnLate: false },
    });
    const morning = getAIRoutineOptimizationAdvice(weak);
    expect(morning).toMatchObject({ score: 70, suggestedSteps: weak.steps });
    expect(morning.tips).toHaveLength(3);
    expect(morning.circadianAdvice).toContain('الصباحية');
    expect(getAIRoutineOptimizationAdvice(routine({ startTime: '12:00' })).circadianAdvice).toContain('بعد الظهيرة');
    expect(getAIRoutineOptimizationAdvice(routine({ startTime: '18:00' })).circadianAdvice).toContain('المسائية');
    expect(getAIRoutineOptimizationAdvice(routine({ startTime: '16:00' })).circadianAdvice).toContain('متناسق');
    expect(
      getAIRoutineOptimizationAdvice(
        routine({
          startTime: undefined as unknown as string,
          steps: undefined as unknown as RoutineRecord['steps'],
          reminderSettings: undefined as unknown as RoutineRecord['reminderSettings'],
        })
      )
    ).toMatchObject({ suggestedSteps: [], circadianAdvice: expect.stringContaining('الصباحية') });
  });
});

describe('R65 — خدمة الروتين', () => {
  it('يقرأ ويحفظ الروتين الجديد أو المحدث ويسجل Audit وOutbox حتى لو لم يعد التحديث قيمة', () => {
    const repo = createRepo();
    const service = new RoutineService(repo);
    const entry = routine();
    const saved = routine({ name: 'روتين محفوظ' });
    const outbox = vi.spyOn(Outbox, 'enqueue').mockReturnValue({} as OutboxMutation);
    const audit = vi.spyOn(auditService, 'log').mockReturnValue({} as CentralAuditEntry);

    vi.mocked(repo.getAll).mockReturnValue([entry]);
    expect(service.getAll()).toEqual([entry]);
    expect(service.getById(entry.id)).toBeNull();

    vi.mocked(repo.getById).mockReturnValueOnce(null);
    vi.mocked(repo.add).mockReturnValue(saved);
    expect(service.saveRoutine(entry)).toEqual(saved);
    expect(audit).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'Create', entity: 'Routine', newValue: entry })
    );
    expect(outbox).toHaveBeenLastCalledWith('Routine', 'INSERT', entry.id, entry);

    vi.mocked(repo.getById).mockReturnValue(entry);
    vi.mocked(repo.update).mockReturnValueOnce(saved).mockReturnValueOnce(null);
    expect(service.saveRoutine(entry)).toEqual(saved);
    expect(service.saveRoutine(entry)).toEqual(entry);
    expect(audit).toHaveBeenCalledTimes(3);
    expect(outbox).toHaveBeenLastCalledWith('Routine', 'UPDATE', entry.id, entry);
  });

  it('لا يعلن الحذف غير الموجود، ويسجل الحذف الناجح بالحمولة الأصلية', () => {
    const repo = createRepo();
    const service = new RoutineService(repo);
    const entry = routine();
    const outbox = vi.spyOn(Outbox, 'enqueue').mockReturnValue({} as OutboxMutation);
    const audit = vi.spyOn(auditService, 'log').mockReturnValue({} as CentralAuditEntry);

    vi.mocked(repo.getById).mockReturnValueOnce(null).mockReturnValueOnce(entry).mockReturnValueOnce(entry);
    vi.mocked(repo.delete).mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(service.deleteRoutine('مفقود')).toBe(false);
    expect(service.deleteRoutine(entry.id)).toBe(false);
    expect(service.deleteRoutine(entry.id)).toBe(true);
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'Delete', oldValue: entry }));
    expect(outbox).toHaveBeenLastCalledWith('Routine', 'DELETE', entry.id, entry);
  });
});
