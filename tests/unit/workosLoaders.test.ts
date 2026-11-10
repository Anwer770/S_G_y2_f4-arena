import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dbStorage } from '../../src/database/dbStorage';
import { KEYS } from '../../src/utils/workos/workosKeys';
import {
  loadActiveTimer,
  loadActivity,
  loadAppointments,
  loadAutomations,
  loadCommitments,
  loadCurrentWorkspaceId,
  loadDailyReviews,
  loadGoals,
  loadHabits,
  loadInbox,
  loadMeetings,
  loadNotes,
  loadOrders,
  loadProjects,
  loadRoutine,
  loadTasks,
  loadTeam,
  loadWorkOSData,
  loadWorkspaces,
  logWorkActivity,
  parseNaturalLanguageTask,
  resetWorkOSToDefault,
  saveActiveTimer,
  saveActivity,
  saveAppointments,
  saveAutomations,
  saveCommitments,
  saveCurrentWorkspaceId,
  saveDailyReviews,
  saveGoals,
  saveHabits,
  saveInbox,
  saveMeetings,
  saveNotes,
  saveOrders,
  saveProjects,
  saveRoutine,
  saveTasks,
  saveTasksWithoutEvents,
  saveTeam,
  saveWorkOSData,
  saveWorkspaces,
} from '../../src/utils/workos/workosLoaders';

describe('R55 — عقود القراءة والكتابة لمساحة العمل', () => {
  beforeEach(() => {
    dbStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-07T08:00:00.000Z'));
  });

  afterEach(() => {
    dbStorage.clear();
    vi.useRealTimers();
  });

  it('يعيد البذور عند الغياب أو JSON سليم بالشكل الخطأ، ويقبل القوائم الصحيحة لكل مجال', () => {
    expect(loadWorkspaces().length).toBeGreaterThan(0);
    expect(loadProjects().length).toBeGreaterThan(0);
    expect(loadTasks().length).toBeGreaterThan(0);
    expect(loadOrders().length).toBeGreaterThan(0);
    expect(loadInbox().length).toBeGreaterThan(0);
    expect(loadRoutine().length).toBeGreaterThan(0);
    expect(loadDailyReviews()).toEqual([]);
    expect(loadHabits().length).toBeGreaterThan(0);
    expect(loadGoals().length).toBeGreaterThan(0);
    expect(loadAppointments().length).toBeGreaterThan(0);
    expect(loadCommitments().length).toBeGreaterThan(0);
    expect(loadMeetings().length).toBeGreaterThan(0);
    expect(loadNotes().length).toBeGreaterThan(0);
    expect(loadTeam().length).toBeGreaterThan(0);
    expect(loadAutomations().length).toBeGreaterThan(0);
    expect(loadActivity().length).toBeGreaterThan(0);

    dbStorage.setItem(KEYS.ROUTINES, JSON.stringify({ broken: true }));
    dbStorage.setItem(KEYS.REVIEWS, JSON.stringify({ broken: true }));
    expect(loadRoutine().length).toBeGreaterThan(0);
    expect(loadDailyReviews()).toEqual([]);

    saveWorkspaces([]);
    const projectForEvent = { ...loadProjects()[0], id: 'project-event' };
    saveProjects([...loadProjects(), projectForEvent]);
    saveProjects([]);
    saveTasks([]);
    saveOrders([]);
    saveInbox([]);
    saveRoutine([]);
    saveDailyReviews([{ id: 'review', date: '2026-11-07' } as never]);
    saveHabits([]);
    saveGoals([]);
    saveAppointments([]);
    saveCommitments([]);
    saveMeetings([]);
    saveNotes([]);
    saveTeam([]);
    saveAutomations([]);
    saveActivity([]);

    expect(loadWorkspaces()).toEqual([]);
    expect(loadProjects()).toEqual([]);
    expect(loadTasks()).toEqual([]);
    expect(loadOrders()).toEqual([]);
    expect(loadInbox()).toEqual([]);
    expect(loadRoutine()).toEqual([]);
    expect(loadDailyReviews()).toHaveLength(1);
    expect(loadHabits()).toEqual([]);
    expect(loadGoals()).toEqual([]);
    expect(loadAppointments()).toEqual([]);
    expect(loadCommitments()).toEqual([]);
    expect(loadMeetings()).toEqual([]);
    expect(loadNotes()).toEqual([]);
    expect(loadTeam()).toEqual([]);
    expect(loadAutomations()).toEqual([]);
    expect(loadActivity()).toEqual([]);
  });

  it('يطبع معرّف مساحة العمل القديم غير المنصّص ويعالج null وJSON التالف بأمان', () => {
    expect(loadCurrentWorkspaceId()).toBe('ws_main');

    saveCurrentWorkspaceId('ws-typed');
    expect(loadCurrentWorkspaceId()).toBe('ws-typed');

    dbStorage.setItem(KEYS.CURRENT_WORKSPACE, 'legacy-workspace');
    expect(loadCurrentWorkspaceId()).toBe('legacy-workspace');
    expect(dbStorage.getItem(KEYS.CURRENT_WORKSPACE)).toBe('"legacy-workspace"');

    dbStorage.setItem(KEYS.CURRENT_WORKSPACE, 'null');
    expect(loadCurrentWorkspaceId()).toBe('ws_main');
    saveCurrentWorkspaceId('');
    expect(loadCurrentWorkspaceId()).toBe('ws_main');
    dbStorage.setItem(KEYS.PROJECTS, '{invalid');
    expect(loadProjects().length).toBeGreaterThan(0);
  });

  it('يطبع مصفوفات المهمة المتضررة ويحفظ المسار الصامت والسجل والمؤقت', () => {
    dbStorage.setItem(
      KEYS.TASKS,
      JSON.stringify([
        { id: 'task', title: 'مهمة', subtasks: null, checklist: {}, comments: null, tags: 'x', dependencies: null },
      ])
    );
    expect(loadTasks()[0]).toMatchObject({ subtasks: [], checklist: [], comments: [], tags: [], dependencies: [] });

    saveTasksWithoutEvents([]);
    expect(loadTasks()).toEqual([]);

    expect(loadActiveTimer()).toBeNull();
    saveActiveTimer({
      taskId: 't1',
      taskTitle: 'تركيز',
      startedAt: '2026-11-07T08:00:00.000Z',
      elapsedSeconds: 9,
      isRunning: true,
    });
    expect(loadActiveTimer()?.elapsedSeconds).toBe(9);

    saveActivity([]);
    logWorkActivity('المستخدم', 'تعديل', 'task', 'عنوان', 'قديم', 'جديد');
    expect(loadActivity()[0]).toMatchObject({ user: 'المستخدم', oldValue: 'قديم', newValue: 'جديد' });
  });

  it('يفسر الصيغ العربية للتاريخ والساعة والأولوية والتصنيف بلا إسقاط لبديل لغوي', () => {
    const phrases = [
      'غدا',
      'غداً',
      'بكرة',
      'بعد غد',
      'بعد غداً',
      'اليوم',
      'السبت',
      'الأحد',
      'الإثنين',
      'الاثنين',
      'الثلاثاء',
      'الأربعاء',
      'الخميس',
      'الساعة 8',
      'الساعة 08',
      'الساعة 9',
      'الساعة 09',
      'الساعة 10',
      'الساعة 11',
      'الساعة 12',
      'الساعة 1',
      'الواحدة',
      'الساعة 2',
      'الثانية',
      'الساعة 3',
      'الثالثة',
      'الساعة 4',
      'الرابعة',
      'الساعة 5',
      'الخامسة',
      'الساعة 8 مساء',
      'الساعة 12 مساء',
      'عاجل',
      'ضروري',
      'طارئ',
      'مهم',
      'أولوية عالية',
      'عميل',
      'صيدلية',
      'بيع',
      'عرض',
      'حساب',
      'سند',
      'تحصيل',
      'مبلغ',
      'طبيب',
      'عيادة',
      'دكتور',
      'مخزن',
      'بضاعة',
      'صرف',
      'توريد',
    ];
    for (const phrase of phrases) {
      const parsed = parseNaturalLanguageTask(`متابعة ${phrase}`);
      expect(parsed.dueDate).toMatch(/^2026-\d{2}-\d{2}$/);
      expect(parsed.dueTime).toMatch(/^\d{2}:00$/);
    }

    expect(parseNaturalLanguageTask('إرسال عرض عاجل غداً الساعة 8 مساء')).toMatchObject({
      dueTime: '20:00',
      priority: 'urgent',
      category: 'مبيعات وعملاء',
      relatedAction: 'إرسال مستندات',
    });
    expect(parseNaturalLanguageTask('غداً')).toMatchObject({ title: 'غداً', relatedAction: 'متابعة مباشرة' });

    for (const [date, weekday] of [
      ['2026-11-08T08:00:00.000Z', 'الأحد'],
      ['2026-11-09T08:00:00.000Z', 'الإثنين'],
      ['2026-11-10T08:00:00.000Z', 'الثلاثاء'],
      ['2026-11-11T08:00:00.000Z', 'الأربعاء'],
      ['2026-11-12T08:00:00.000Z', 'الخميس'],
    ] as const) {
      vi.setSystemTime(new Date(date));
      expect(parseNaturalLanguageTask(`متابعة ${weekday}`).dueDate).toMatch(/^2026-11-\d{2}$/);
    }
  });

  it('يعيد ضبط المجالات كلها ويقرأ/يحفظ حالة WorkOS الكاملة، بما فيها المسار الجزئي', () => {
    saveWorkOSData(null as never);
    saveWorkOSData({} as never);
    resetWorkOSToDefault();

    const data = loadWorkOSData();
    expect(data.currentWorkspaceId).toBe('ws_main');
    expect(data.projects.length).toBeGreaterThan(0);
    expect(data.tasks.length).toBeGreaterThan(0);

    saveWorkOSData({ ...data, currentWorkspaceId: 'ws_main', dailyReviews: [] });
    expect(loadWorkOSData().currentWorkspaceId).toBe('ws_main');
  });
});
