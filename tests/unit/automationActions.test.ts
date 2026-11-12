import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkTask } from '../../src/types/workos';
import type { DomainEvent, PlannedAction } from '../../src/utils/automation/automationTypes';

const mocks = vi.hoisted(() => ({
  tasks: [] as unknown[],
  projects: [] as unknown[],
  orders: [] as unknown[],
  automations: [] as unknown[],
  saveTasks: vi.fn(),
  saveProjects: vi.fn(),
  logWorkActivity: vi.fn(),
  sendSystemNotification: vi.fn(),
  withAutomationOrigin: vi.fn(<T>(effect: () => T) => effect()),
}));

vi.mock('../../src/utils/workos/workosLoaders', () => ({
  loadTasks: () => mocks.tasks,
  loadProjects: () => mocks.projects,
  loadOrders: () => mocks.orders,
  loadAutomations: () => mocks.automations,
  saveTasks: mocks.saveTasks,
  saveProjects: mocks.saveProjects,
  logWorkActivity: mocks.logWorkActivity,
}));

vi.mock('../../src/utils/webNotifications', () => ({ sendSystemNotification: mocks.sendSystemNotification }));
vi.mock('../../src/utils/automation/automationEvents', () => ({ withAutomationOrigin: mocks.withAutomationOrigin }));

import { countActiveRules, countLateOrders, executePlannedAction } from '../../src/utils/automation/automationActions';

const now = new Date('2026-11-07T08:09:10.000Z');

const task = (over: Partial<WorkTask> = {}): WorkTask =>
  ({
    id: 'task-1',
    taskNumber: 'TSK-1',
    title: 'مهمة المصدر',
    description: '',
    status: 'planned',
    priority: 'medium',
    category: 'عام',
    tags: [],
    assigneeId: 'member-1',
    dueDate: '2026-11-08',
    progress: 0,
    subtasks: [],
    checklist: [],
    comments: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...over,
  }) as WorkTask;

const event = (over: Partial<DomainEvent> = {}): DomainEvent => ({
  id: 'evt-1',
  at: now.toISOString(),
  origin: 'user',
  type: 'task_completed',
  entityType: 'task',
  entityId: 'task-1',
  title: 'مهمة المصدر',
  ...over,
});

const action = (actionType: string, over: Partial<PlannedAction> = {}): PlannedAction =>
  ({
    ruleId: 'rule-1',
    ruleName: 'قاعدة اختبار',
    actionType,
    eventType: 'task_completed',
    entityType: 'task',
    entityId: 'task-1',
    key: 'rule-1::task_completed::task-1',
    title: 'تنبيه الأتمتة',
    body: 'تفاصيل الأثر',
    ...over,
  }) as PlannedAction;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  mocks.tasks = [];
  mocks.projects = [];
  mocks.orders = [];
  mocks.automations = [];
  mocks.saveTasks.mockImplementation((next) => {
    mocks.tasks = next;
  });
  mocks.saveProjects.mockImplementation((next) => {
    mocks.projects = next;
  });
  mocks.sendSystemNotification.mockReturnValue(false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('R83 — إجراءات محرك الأتمتة', () => {
  it('يرسل إشعار النظام حين ينجح، ويسجل بديلاً آمناً عند رفضه أو رميه', () => {
    mocks.sendSystemNotification
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockImplementationOnce(() => {
        throw new Error('notifications unavailable');
      });

    expect(executePlannedAction(action('notify_team'), event())).toEqual({ ok: true, note: 'أُرسل إشعار نظام' });
    expect(executePlannedAction(action('notify_team', { key: 'k2' }), event({ title: '' }))).toMatchObject({
      ok: true,
      note: expect.stringContaining('غير مسموح'),
    });
    expect(executePlannedAction(action('notify_team', { key: 'k3' }), event())).toMatchObject({
      ok: true,
      note: expect.stringContaining('غير مسموح'),
    });
    expect(mocks.sendSystemNotification).toHaveBeenCalledWith('تنبيه الأتمتة', {
      body: 'تفاصيل الأثر',
      tag: 'rule-1::task_completed::task-1',
      data: { entityType: 'task', entityId: 'task-1' },
    });
    expect(mocks.logWorkActivity).toHaveBeenNthCalledWith(
      2,
      'محرّك الأتمتة',
      'إشعار أتمتة',
      'task',
      'task-1',
      undefined,
      'قاعدة اختبار'
    );
  });

  it('ينشئ مهمة المتابعة مرة واحدة، ويربطها بالمصدر أو بالبديل الآمن عند غياب المصدر والمشروع', () => {
    mocks.tasks = [task({ id: 'tsk_auto_rule_1__task_completed__task_1' })];
    expect(executePlannedAction(action('create_followup_task'), event())).toMatchObject({
      ok: true,
      note: expect.stringContaining('موجودة مسبقاً'),
    });
    expect(mocks.saveTasks).not.toHaveBeenCalled();

    mocks.tasks = [task({ id: 'task-1', projectId: 'project-source', assigneeId: 'owner-source' })];
    mocks.projects = [{ id: 'project-first', name: 'مشروع أول' }];
    const created = executePlannedAction(action('create_followup_task', { key: 'source-key' }), event());
    expect(created.note).toContain('TSK-AUTO-2');
    expect(mocks.tasks[0]).toMatchObject({
      id: 'tsk_auto_source_key',
      projectId: 'project-source',
      assigneeId: 'owner-source',
      priority: 'high',
      startDate: '2026-11-07',
      dueDate: '2026-11-07',
    });

    mocks.tasks = [];
    mocks.projects = [];
    executePlannedAction(action('create_followup_task', { key: 'no-source' }), event({ entityId: 'missing' }));
    expect(mocks.tasks[0]).toMatchObject({ projectId: undefined, assigneeId: 'mem_1' });
  });

  it('يرفع أولوية المهام القابلة فقط ضمن المشروع أو المهمة، ولا يكتب عندما لا يوجد ما يلمس', () => {
    mocks.tasks = [
      task({ id: 'eligible', projectId: 'p-1' }),
      task({ id: 'completed', projectId: 'p-1', status: 'completed' }),
      task({ id: 'cancelled', projectId: 'p-1', status: 'cancelled' }),
      task({ id: 'urgent', projectId: 'p-1', priority: 'urgent' }),
      task({ id: 'other', projectId: 'p-2' }),
    ];
    expect(executePlannedAction(action('tag_priority_urgent'), event({ data: { projectId: 'p-1' } }))).toEqual({
      ok: true,
      note: 'رُفعت أولوية 1 مهمة إلى «عاجل»',
    });
    expect((mocks.tasks[0] as WorkTask).priority).toBe('urgent');
    expect((mocks.tasks[4] as WorkTask).priority).toBe('medium');

    expect(executePlannedAction(action('tag_priority_urgent'), event({ entityId: 'completed' }))).toEqual({
      ok: true,
      note: 'لا مهام تحتاج رفع الأولوية',
    });
  });

  it('يغلق المشروع مرة واحدة ويسجل النشاط، ويعيد نتيجة صريحة للمفقود أو المغلق', () => {
    expect(
      executePlannedAction(action('mark_project_completed'), event({ entityType: 'project', entityId: 'missing' }))
    ).toEqual({
      ok: false,
      note: 'المشروع غير موجود',
    });
    mocks.projects = [
      { id: 'done', name: 'مغلق', status: 'completed', progress: 100 },
      { id: 'active', name: 'نشط', status: 'active', progress: 40 },
    ];
    expect(
      executePlannedAction(action('mark_project_completed'), event({ entityType: 'project', entityId: 'done' }))
    ).toEqual({
      ok: true,
      note: 'المشروع مغلق مسبقاً',
    });
    expect(
      executePlannedAction(action('mark_project_completed'), event({ entityType: 'project', entityId: 'active' }))
    ).toEqual({
      ok: true,
      note: 'أُغلق المشروع تلقائياً',
    });
    expect(mocks.projects[1]).toMatchObject({ status: 'completed', progress: 100, updatedAt: now.toISOString() });
    expect(mocks.logWorkActivity).toHaveBeenCalledWith(
      'محرّك الأتمتة',
      'إغلاق مشروع',
      'project',
      'نشط',
      'active',
      'completed'
    );
  });

  it('يحصر الأرشفة في المهام، ويتعامل مع الغياب والتكرار ثم يضيف وقت الأرشفة', () => {
    expect(executePlannedAction(action('archive_item'), event({ entityType: 'order' }))).toEqual({
      ok: true,
      note: 'الأرشفة مقيّدة بالمهام',
    });
    expect(executePlannedAction(action('archive_item'), event({ entityId: 'missing' }))).toEqual({
      ok: false,
      note: 'المهمة غير موجودة',
    });
    mocks.tasks = [task({ id: 'archived', status: 'archived' }), task({ id: 'ready' })];
    expect(executePlannedAction(action('archive_item'), event({ entityId: 'archived' }))).toEqual({
      ok: true,
      note: 'مؤرشفة مسبقاً',
    });
    expect(executePlannedAction(action('archive_item'), event({ entityId: 'ready' }))).toEqual({
      ok: true,
      note: 'أُرشفت المهمة',
    });
    expect(mocks.tasks[1]).toMatchObject({ status: 'archived', archivedAt: now.toISOString() });
  });

  it('يرفض الإجراء المجهول، ويعيد سبب الخطأ سواء كان Error أو قيمة أخرى', () => {
    expect(executePlannedAction(action('unknown_action'), event())).toEqual({
      ok: false,
      note: 'إجراء غير معروف: unknown_action',
    });
    const errorAction = Object.defineProperty(action('notify_team'), 'actionType', {
      get: () => {
        throw new Error('action getter failed');
      },
    });
    expect(executePlannedAction(errorAction, event())).toEqual({ ok: false, note: 'action getter failed' });
    const nonErrorAction = Object.defineProperty(action('notify_team'), 'actionType', {
      get: () => {
        throw 'raw failure';
      },
    });
    expect(executePlannedAction(nonErrorAction, event())).toEqual({ ok: false, note: 'خطأ غير معروف' });
  });

  it('يعد القواعد النشطة والطلبيات المتأخرة فقط', () => {
    mocks.automations = [{ isActive: true }, { isActive: false }, { isActive: true }];
    mocks.orders = [
      { status: 'pending', deliveryDate: '2026-11-06' },
      { status: 'pending', deliveryDate: '2026-11-07' },
      { status: 'delivered', deliveryDate: '2026-11-01' },
      { status: 'cancelled', deliveryDate: '2026-11-01' },
    ];
    expect(countActiveRules()).toBe(2);
    expect(countLateOrders()).toBe(1);
  });
});
