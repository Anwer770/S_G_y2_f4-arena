// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaskPriority, TaskStatus, TeamMember, WorkOSData, WorkSubtask, WorkTask } from '../../src/types/workos';

const mocks = vi.hoisted(() => ({ triggerConfetti: vi.fn() }));

vi.mock('../../src/utils/workosStorage', () => ({ triggerConfetti: mocks.triggerConfetti }));

import { useWorkOSTaskActions } from '../../src/components/workos/useWorkOSTaskActions';

const fixedNow = '2026-11-07T12:00:00.000Z';

function task(overrides: Partial<WorkTask> = {}): WorkTask {
  return {
    id: 'task-existing',
    taskNumber: 'TK-001',
    title: 'المهمة الأصلية',
    description: 'وصف المهمة الأصلية',
    status: 'planned',
    priority: 'high',
    category: 'تشغيل',
    tags: ['مهم'],
    assigneeId: 'member-1',
    startDate: '2026-11-06',
    dueDate: '2026-11-08',
    estimatedHours: 3,
    actualHours: 1,
    progress: 25,
    subtasks: [],
    checklist: [],
    comments: [],
    timeEntries: [],
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-01T08:00:00.000Z',
    ...overrides,
  };
}

function activity(title = 'نشاط سابق') {
  return {
    id: 'activity-existing',
    timestamp: '2026-11-01T08:00:00.000Z',
    user: 'مستخدم سابق',
    action: 'تحديث',
    entity: 'task',
    entityTitle: title,
  };
}

const teamMember: TeamMember = {
  id: 'member-1',
  name: 'عضو الفريق',
  role: 'منسق',
  department: 'التشغيل',
  email: 'member@example.test',
  avatarColor: 'blue',
  capacityHoursPerWeek: 40,
  activeTasksCount: 0,
};

interface ActionSetup {
  data: WorkOSData;
  setData: ReturnType<typeof vi.fn>;
  stopTimer: ReturnType<typeof vi.fn>;
  setCurrentTab: ReturnType<typeof vi.fn>;
  actions: ReturnType<typeof useWorkOSTaskActions>;
}

function setup({
  tasks = [task(), task({ id: 'task-other', taskNumber: 'TK-002', title: 'مهمة أخرى' })],
  projects = [],
  team = [teamMember],
  activities = [activity()],
  activeTimerTask = null,
}: Partial<Pick<WorkOSData, 'tasks' | 'projects' | 'team' | 'activities'>> & {
  activeTimerTask?: WorkTask | null;
} = {}): ActionSetup {
  const data = { tasks, projects, team, activities } as unknown as WorkOSData;
  const setData = vi.fn();
  const stopTimer = vi.fn();
  const setCurrentTab = vi.fn();

  const { result } = renderHook(() =>
    useWorkOSTaskActions({
      data,
      setData,
      todayStr: '2026-11-07',
      activeTimerTask,
      handleStopTimer: stopTimer,
      setCurrentTab,
    })
  );

  return { data, setData, stopTimer, setCurrentTab, actions: result.current };
}

function applyLatestUpdate(setData: ReturnType<typeof vi.fn>, current: WorkOSData): WorkOSData {
  const update = setData.mock.calls.at(-1)?.[0] as (previous: WorkOSData) => WorkOSData;
  expect(update).toEqual(expect.any(Function));
  return update(current);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(fixedNow));
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('R88 — إجراءات مهام WorkOS', () => {
  it('ينشئ مهمة بالبدائل الآمنة، ثم يحفظ كل الحقول الصريحة ويحتفل عند إنشائها مكتملة', () => {
    const defaults = setup({ team: [] });
    defaults.data.activities = undefined as unknown as WorkOSData['activities'];
    defaults.actions.handleAddTask({});
    const defaultResult = applyLatestUpdate(defaults.setData, defaults.data);
    const created = defaultResult.tasks[0];

    expect(created).toMatchObject({
      taskNumber: 'TK-003',
      title: 'مهمة جديدة',
      description: '',
      status: 'planned',
      priority: 'medium',
      category: 'عام',
      tags: [],
      assigneeId: 'u1',
      startDate: '2026-11-07',
      dueDate: '2026-11-07',
      estimatedHours: 2,
      actualHours: 0,
      progress: 0,
      timeEntries: [],
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });
    expect(defaultResult.activities).toEqual([
      expect.objectContaining({ action: 'إنشاء مهمة جديدة', entityTitle: 'مهمة جديدة' }),
    ]);
    expect(mocks.triggerConfetti).not.toHaveBeenCalled();

    const explicit = setup();
    explicit.actions.handleAddTask({
      title: 'مهمة مكتملة',
      description: 'تُحفظ كما هي',
      status: 'completed',
      priority: 'urgent',
      category: 'تدقيق',
      tags: ['نهائية'],
      assigneeId: 'member-2',
      projectId: 'project-1',
      startDate: '2026-11-03',
      dueDate: '2026-11-09',
      estimatedHours: 7,
      progress: 11,
      subtasks: [{ id: 'sub-1', title: 'فرعي', completed: false }],
      checklist: [{ id: 'check-1', text: 'تحقق', completed: false }],
      comments: [{ id: 'comment-1', author: 'عضو', text: 'ملاحظة', createdAt: fixedNow }],
    });
    const explicitResult = applyLatestUpdate(explicit.setData, explicit.data);

    expect(explicitResult.tasks[0]).toMatchObject({
      title: 'مهمة مكتملة',
      description: 'تُحفظ كما هي',
      status: 'completed',
      priority: 'urgent',
      category: 'تدقيق',
      tags: ['نهائية'],
      assigneeId: 'member-2',
      projectId: 'project-1',
      startDate: '2026-11-03',
      dueDate: '2026-11-09',
      estimatedHours: 7,
      progress: 100,
    });
    expect(explicitResult.activities).toEqual([expect.objectContaining({ entityTitle: 'مهمة مكتملة' }), activity()]);
    expect(mocks.triggerConfetti).toHaveBeenCalledOnce();
  });

  it('يحفظ ويحدّث الحالة والأولوية والمسند والموعد من دون مسّ المهمة الأخرى', () => {
    const current = setup();
    const [target, other] = current.data.tasks;

    current.actions.handleSaveTask({ ...target, title: 'مهمة محفوظة', status: 'completed' });
    expect(applyLatestUpdate(current.setData, current.data).tasks).toEqual([
      expect.objectContaining({ id: target.id, title: 'مهمة محفوظة' }),
      other,
    ]);
    expect(mocks.triggerConfetti).toHaveBeenCalledOnce();

    current.actions.handleSaveTask({ ...target, status: 'planned' });
    expect(mocks.triggerConfetti).toHaveBeenCalledOnce();

    current.actions.handleUpdateTaskStatus(target.id, 'completed');
    const completed = applyLatestUpdate(current.setData, current.data);
    expect(completed.tasks).toEqual([
      expect.objectContaining({
        id: target.id,
        status: 'completed',
        progress: 100,
        completedAt: fixedNow,
        updatedAt: fixedNow,
      }),
      other,
    ]);
    expect(completed.activities[0]).toMatchObject({
      action: 'تغيير حالة المهمة إلى: مكتملة',
      entityTitle: target.title,
      newValue: 'completed',
    });

    current.data.activities = undefined as unknown as WorkOSData['activities'];
    current.actions.handleUpdateTaskStatus(target.id, 'planned');
    const reopened = applyLatestUpdate(current.setData, current.data);
    expect(reopened.tasks).toEqual([
      expect.objectContaining({ id: target.id, status: 'planned', progress: target.progress, completedAt: undefined }),
      other,
    ]);
    expect(reopened.activities).toEqual([expect.objectContaining({ action: 'تغيير حالة المهمة إلى: مخططة' })]);

    current.actions.handleUpdateTaskStatus('missing', 'unexpected' as TaskStatus);
    const missing = applyLatestUpdate(current.setData, current.data);
    expect(missing.tasks).toEqual(current.data.tasks);
    expect(missing.activities[0]).toMatchObject({
      action: 'تغيير حالة المهمة إلى: unexpected',
      entityTitle: 'مهمة',
      newValue: 'unexpected',
    });

    current.actions.handleUpdateTaskPriority(target.id, 'low');
    expect(applyLatestUpdate(current.setData, current.data).tasks).toEqual([
      expect.objectContaining({ id: target.id, priority: 'low', updatedAt: fixedNow }),
      other,
    ]);
    current.actions.handleUpdateTaskAssignee(target.id, 'member-2');
    expect(applyLatestUpdate(current.setData, current.data).tasks).toEqual([
      expect.objectContaining({ id: target.id, assigneeId: 'member-2', updatedAt: fixedNow }),
      other,
    ]);
    current.actions.handleUpdateTaskDueDate(target.id, '2026-11-30');
    expect(applyLatestUpdate(current.setData, current.data).tasks).toEqual([
      expect.objectContaining({ id: target.id, dueDate: '2026-11-30', updatedAt: fixedNow }),
      other,
    ]);
    expect(mocks.triggerConfetti).toHaveBeenCalledTimes(2);
  });

  it('يسجل الحذف ويوقف المؤقت للمهمة النشطة، ويحذف بأمان حتى عند غياب المهمة', () => {
    const active = task({ id: 'task-active', title: 'المهمة النشطة' });
    const other = task({ id: 'task-other', title: 'المهمة الباقية' });
    const current = setup({ tasks: [active, other], activeTimerTask: active });

    current.actions.handleDeleteTask(active.id);
    const deleted = applyLatestUpdate(current.setData, current.data);
    expect(deleted.tasks).toEqual([other]);
    expect(deleted.activities[0]).toMatchObject({ action: 'حذف مهمة', entityTitle: active.title });
    expect(current.stopTimer).toHaveBeenCalledOnce();

    const missing = setup({ tasks: [other] });
    missing.data.activities = undefined as unknown as WorkOSData['activities'];
    missing.actions.handleDeleteTask('missing');
    const missingResult = applyLatestUpdate(missing.setData, missing.data);
    expect(missingResult.tasks).toEqual([other]);
    expect(missingResult.activities).toEqual([expect.objectContaining({ entityTitle: 'مهمة' })]);
    expect(missing.stopTimer).not.toHaveBeenCalled();
  });

  it('ينسخ المهمة كخطة جديدة مستقلة بلا تاريخ إتمام أو تقدم سابق', () => {
    const source = task({ status: 'completed', progress: 100, completedAt: '2026-11-06T10:00:00.000Z' });
    const current = setup({ tasks: [source] });

    current.actions.handleDuplicateTask(source);
    const duplicated = applyLatestUpdate(current.setData, current.data).tasks[0];

    expect(duplicated).toMatchObject({
      taskNumber: 'TK-002',
      title: 'المهمة الأصلية (نسخة)',
      status: 'planned',
      progress: 0,
      createdAt: fixedNow,
      updatedAt: fixedNow,
      completedAt: undefined,
    });
    expect(duplicated.id).not.toBe(source.id);
    expect(mocks.triggerConfetti).not.toHaveBeenCalled();
  });

  it('يحوّل المهمة إلى مشروع ويربط الأصل ويولد المهام الفرعية ويحفظ العضو والتبويب', () => {
    const source = task({
      id: 'task-convert',
      taskNumber: 'TK-CONVERT',
      subtasks: [
        { id: 'sub-done', title: 'فرعي مكتمل', completed: true },
        { id: 'sub-open', title: 'فرعي مفتوح', completed: false },
      ],
    });
    const other = task({ id: 'task-other' });
    const current = setup({ tasks: [source, other], projects: [] });

    current.actions.handleConvertToProjectFromTask(source);
    const converted = applyLatestUpdate(current.setData, current.data);
    const project = converted.projects[0];

    expect(project).toMatchObject({
      code: 'PRJ-001',
      name: source.title,
      description: source.description,
      status: 'active',
      priority: source.priority,
      progress: source.progress,
      startDate: source.startDate,
      dueDate: source.dueDate,
      manager: 'عضو الفريق',
      category: source.category,
    });
    expect(converted.tasks).toEqual([
      expect.objectContaining({ id: source.id, projectId: project.id }),
      other,
      expect.objectContaining({ title: 'فرعي مكتمل', projectId: project.id, status: 'completed', progress: 100 }),
      expect.objectContaining({ title: 'فرعي مفتوح', projectId: project.id, status: 'planned', progress: 0 }),
    ]);
    expect(current.setCurrentTab).toHaveBeenCalledWith('projects');
    expect(mocks.triggerConfetti).toHaveBeenCalledOnce();
  });

  it('يبني مشروع التحويل ببدائل النص والفريق والفئة عند غيابها ولا يولد مهمة فرعية وهمية', () => {
    const sparse = task({
      id: 'task-sparse',
      taskNumber: '',
      description: '',
      priority: '' as TaskPriority,
      category: '',
      progress: 0,
      startDate: undefined,
      dueDate: '',
      assigneeId: 'missing-member',
      subtasks: [{ id: 'sub-sparse', title: 'فرعي افتراضي', completed: false }],
    });
    const current = setup({ tasks: [sparse], team: [] });

    current.actions.handleConvertToProjectFromTask(sparse);
    const converted = applyLatestUpdate(current.setData, current.data);
    const project = converted.projects[0];

    expect(project).toMatchObject({
      name: sparse.title,
      description: `مشروع تم إنشاؤه من المهمة ${sparse.title}`,
      priority: 'medium',
      progress: 0,
      startDate: '2026-11-07',
      dueDate: '2026-11-07',
      manager: 'محمد العولقي',
      category: 'عام',
    });
    expect(converted.tasks).toEqual([
      expect.objectContaining({ id: sparse.id, projectId: project.id }),
      expect.objectContaining({
        title: 'فرعي افتراضي',
        projectId: project.id,
        priority: 'medium',
        category: 'عام',
        status: 'planned',
        progress: 0,
      }),
    ]);

    const withoutSubtasks = {
      ...sparse,
      id: 'task-without-subtasks',
      subtasks: undefined as unknown as WorkSubtask[],
    };
    const noSubtasks = setup({ tasks: [withoutSubtasks], team: [] });
    noSubtasks.actions.handleConvertToProjectFromTask(withoutSubtasks);
    const noSubtasksResult = applyLatestUpdate(noSubtasks.setData, noSubtasks.data);
    expect(noSubtasksResult.tasks).toEqual([
      expect.objectContaining({ id: withoutSubtasks.id, projectId: noSubtasksResult.projects[0].id }),
    ]);
  });
});
