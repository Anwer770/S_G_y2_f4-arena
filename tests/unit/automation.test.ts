/**
 * اختبارات وحدة لمشغّل أحداث الأتمتة (R31) — منطق نقي بلا DOM ولا تخزين.
 *
 * يغطّي: مطابقة القواعد للآحداث · منع التكرار · تجاهل أحداث المحرّك نفسه ·
 * اشتقاق الأحداث من فرق الحالة · المسح الزمني للمتأخرات · تحديث العدّادات · تشغيل يدوي.
 */
import { describe, it, expect, vi } from 'vitest';
import type { AutomationRule, WorkTask } from '../../src/types/workos';
import type { AutomationRun, DomainEvent } from '../../src/utils/automation/automationTypes';
import {
  RULE_TRIGGER_EVENTS,
  ruleMatchesEvent,
  planRuleAction,
  runKeyFor,
  isDuplicateRun,
  applyExecution,
  pruneRuns,
  isTaskOverdue,
} from '../../src/utils/automation/automationRules';
import {
  deriveTaskEvents,
  deriveProjectEvents,
  deriveOrderEvents,
  deriveCommitmentEvents,
} from '../../src/utils/automation/automationDerive';
import {
  processDomainEvent,
  sweepOverdueTasks,
  runRuleManually,
  dispatchDomainEvent,
  defaultAutomationDeps,
  type AutomationDeps,
} from '../../src/utils/automation/automationRunner';
import { executePlannedAction } from '../../src/utils/automation/automationActions';
import { subscribeDomainEvents, withAutomationOrigin } from '../../src/utils/automation/automationEvents';

const rule = (over: Partial<AutomationRule> = {}): AutomationRule => ({
  id: 'aut_1',
  name: 'قاعدة اختبار',
  description: 'وصف',
  triggerEvent: 'task_completed',
  actionType: 'notify_team',
  isActive: true,
  executionsCount: 0,
  ...over,
});

const event = (over: Partial<DomainEvent> = {}): DomainEvent => ({
  id: 'evt_1',
  at: '2026-11-07T08:00:00.000Z',
  origin: 'user',
  type: 'task_completed',
  entityType: 'task',
  entityId: 't1',
  title: 'مهمة',
  ...over,
});

const task = (over: Partial<WorkTask> = {}): WorkTask =>
  ({
    id: 't1',
    taskNumber: 'T-1',
    title: 'مهمة',
    description: '',
    status: 'in_progress',
    priority: 'medium',
    category: 'عام',
    tags: [],
    assigneeId: 'm1',
    progress: 0,
    subtasks: [],
    checklist: [],
    comments: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...over,
  }) as WorkTask;

/** بيئة مشغّل وهمية بالكامل داخل الذاكرة — لا IndexedDB ولا localStorage. */
function fakeDeps(initialRules: AutomationRule[] = [rule()]) {
  const state = {
    rules: [...initialRules],
    runs: [] as AutomationRun[],
    applied: [] as string[],
    now: '2026-11-07T08:00:00.000Z',
  };
  const deps: AutomationDeps = {
    now: () => state.now,
    loadRules: () => state.rules.map((r) => ({ ...r })),
    saveRules: (rules) => {
      state.rules = rules;
    },
    loadRuns: () => [...state.runs],
    saveRuns: (runs) => {
      state.runs = runs;
    },
    applyAction: vi.fn((plan) => {
      state.applied.push(plan.key);
      return { ok: true, note: 'نُفِّذ' };
    }),
  };
  return { state, deps };
}

describe('مطابقة القواعد وخطط الإجراء', () => {
  it('كل شرط قاعدة مرتبط بحدث واحد على الأقل', () => {
    for (const types of Object.values(RULE_TRIGGER_EVENTS)) {
      expect(types.length).toBeGreaterThan(0);
    }
    expect(Object.keys(RULE_TRIGGER_EVENTS)).toHaveLength(6);
  });

  it('القاعدة المعطّلة لا تُفعَّل حتى لو طابق نوع الحدث', () => {
    expect(ruleMatchesEvent(rule({ isActive: false }), event())).toBe(false);
    expect(ruleMatchesEvent(rule(), event())).toBe(true);
  });

  it('نوع حدث مختلف لا يُفعّل القاعدة', () => {
    expect(ruleMatchesEvent(rule(), event({ type: 'order_created' }))).toBe(false);
  });

  it('«مهمة عميل جديدة» لا تُفعَّل إلا بمهمة مرتبطة بعميل', () => {
    const r = rule({ triggerEvent: 'new_customer_task' });
    expect(ruleMatchesEvent(r, event({ type: 'task_created' }))).toBe(false);
    expect(ruleMatchesEvent(r, event({ type: 'task_created', data: { customerRef: 'عميل أ' } }))).toBe(true);
    expect(ruleMatchesEvent(r, event({ type: 'task_created', data: { customerRef: '   ' } }))).toBe(false);
  });

  it('الخطة تحمل مفتاح منع تكرار ثابتاً لنفس (قاعدة · حدث · كيان)', () => {
    const plan = planRuleAction(rule(), event());
    expect(plan).not.toBeNull();
    expect(plan!.key).toBe(runKeyFor('aut_1', event()));
    expect(plan!.key).toBe('aut_1::task_completed::t1');
    expect(planRuleAction(rule({ isActive: false }), event())).toBeNull();
  });

  it('منع التكرار بالبحث في السجل', () => {
    expect(isDuplicateRun([{ key: 'a::b::c' }], 'a::b::c')).toBe(true);
    expect(isDuplicateRun([{ key: 'a::b::c' }], 'a::b::d')).toBe(false);
  });

  it('تحديث العدّاد يزيد واحداً ويضع وقت التنفيذ', () => {
    const updated = applyExecution(rule({ executionsCount: 4 }), '2026-11-07T09:00:00.000Z');
    expect(updated.executionsCount).toBe(5);
    expect(updated.lastExecutedAt).toBe('2026-11-07T09:00:00.000Z');
    expect(rule().executionsCount).toBe(0); // الأصل لم يُمسّ
  });

  it('السجل يُقصّ إلى الحد الأقصى', () => {
    const runs = Array.from({ length: 10 }, (_, i) => ({ key: `k${i}` }));
    expect(pruneRuns(runs, 3)).toHaveLength(3);
    expect(pruneRuns([], 3)).toHaveLength(0);
  });

  it('المهمة المتأخرة: تاريخ سابق وغير منجزة', () => {
    expect(isTaskOverdue('2026-11-01', 'planned', '2026-11-07')).toBe(true);
    expect(isTaskOverdue('2026-11-07', 'planned', '2026-11-07')).toBe(false);
    expect(isTaskOverdue('2026-11-01', 'completed', '2026-11-07')).toBe(false);
    expect(isTaskOverdue(undefined, 'planned', '2026-11-07')).toBe(false);
  });
});

describe('اشتقاق الأحداث من فرق الحالة', () => {
  it('إنجاز مهمة يُنتج حدث task_completed', () => {
    const events = deriveTaskEvents([task()], [task({ status: 'completed' })]);
    expect(events.map((e) => e.type)).toContain('task_completed');
  });

  it('إعادة فتح مهمة يُنتج task_reopened', () => {
    const events = deriveTaskEvents([task({ status: 'completed' })], [task({ status: 'in_progress' })]);
    expect(events.map((e) => e.type)).toContain('task_reopened');
  });

  it('اكتمال كل المهام الفرعية يُنتج all_subtasks_completed مرة واحدة', () => {
    const subs = [
      { id: 's1', title: 'أ', completed: true },
      { id: 's2', title: 'ب', completed: true },
    ];
    const before = task({ subtasks: [{ ...subs[0], completed: false }, subs[1]] as WorkTask['subtasks'] });
    const after = task({ subtasks: subs as WorkTask['subtasks'] });
    const events = deriveTaskEvents([before], [after]);
    expect(events.filter((e) => e.type === 'all_subtasks_completed')).toHaveLength(1);
  });

  it('مهمة جديدة تُنتج task_created مع مرجع العميل', () => {
    const events = deriveTaskEvents([], [task({ id: 't9', customerRef: 'عميل ب' } as Partial<WorkTask>)]);
    expect(events[0].type).toBe('task_created');
    expect(events[0].data?.customerRef).toBe('عميل ب');
  });

  it('تغيير الأولوية أو الموعد يُنتج task_updated، والحفظ بلا تغيير لا يُنتج شيئاً', () => {
    expect(deriveTaskEvents([task()], [task({ priority: 'high' })]).map((e) => e.type)).toEqual(['task_updated']);
    expect(deriveTaskEvents([task()], [task()])).toHaveLength(0);
  });

  it('مهمة جديدة بمهام فرعية مكتملة تُنتج task_created + all_subtasks_completed (R46)', () => {
    const fresh = task({
      id: 't10',
      subtasks: [{ id: 's1', title: 'خطوة', completed: true }] as WorkTask['subtasks'],
    });
    const types = deriveTaskEvents([], [fresh]).map((e) => e.type);
    expect(types).toEqual(['task_created', 'all_subtasks_completed']);
  });

  it('مشروع جديد يُنتج project_created، والتقدّم يُنتج project_updated (R46)', () => {
    const p = (progress: number, status = 'active') => ({ id: 'p9', name: 'مشروع جديد', progress, status }) as never;
    const [created] = deriveProjectEvents([], [p(10)]);
    expect(created).toMatchObject({
      type: 'project_created',
      entityId: 'p9',
      data: { status: 'active', progress: 10 },
    });

    const [updated] = deriveProjectEvents([p(10)], [p(40)]);
    expect(updated).toMatchObject({
      type: 'project_updated',
      data: { previousStatus: 'active', status: 'active', progress: 40 },
    });
    expect(deriveProjectEvents([p(40, 'paused')], [p(40, 'paused')])).toHaveLength(0);
  });

  it('المشروع يُنتج project_100_percent عند بلوغ الاكتمال مرة واحدة', () => {
    const p = (progress: number, status: string) => ({ id: 'p1', name: 'مشروع', progress, status }) as never;
    expect(deriveProjectEvents([p(90, 'active')], [p(100, 'active')]).map((e) => e.type)).toEqual([
      'project_100_percent',
    ]);
    expect(deriveProjectEvents([p(100, 'completed')], [p(100, 'completed')])).toHaveLength(0);
  });

  it('الطلبية تُنتج order_delivered عند التسليم فقط', () => {
    const o = (status: string) =>
      ({ id: 'o1', title: 'طلبية', customerName: 'عميل', status, totalAmount: 10 }) as never;
    expect(deriveOrderEvents([o('in_progress')], [o('delivered')]).map((e) => e.type)).toEqual(['order_delivered']);
    expect(deriveOrderEvents([o('delivered')], [o('delivered')])).toHaveLength(0);
  });

  it('الطلبية الجديدة تُنتج order_created ببياناتها الكاملة (R46)', () => {
    const o = { id: 'o2', title: 'طلبية جديدة', customerName: 'عميل', status: 'pending', totalAmount: 250 };
    const [created] = deriveOrderEvents([], [o] as never);
    expect(created).toMatchObject({
      type: 'order_created',
      entityType: 'order',
      entityId: 'o2',
      title: 'طلبية جديدة',
      data: { customerName: 'عميل', status: 'pending', totalAmount: 250 },
    });
    expect(deriveOrderEvents([o] as never, [o] as never)).toHaveLength(0);
  });

  it('الالتزام الجديد يُنتج commitment_created ببياناته (R46)', () => {
    const c = { id: 'c2', title: 'التزام جديد', status: 'pending', amount: 900, dueDate: '2026-12-01' };
    const [created] = deriveCommitmentEvents([], [c] as never);
    expect(created).toMatchObject({
      type: 'commitment_created',
      entityType: 'commitment',
      entityId: 'c2',
      data: { amount: 900, dueDate: '2026-12-01' },
    });
  });

  it('الاشتقاق بلا معاملات (القيم الافتراضية) لا يرمي (R46)', () => {
    expect(deriveOrderEvents()).toEqual([]);
    expect(deriveCommitmentEvents()).toEqual([]);
  });

  it('الالتزام المالي يُنتج commitment_fulfilled عند السداد', () => {
    const c = (status: string) => ({ id: 'c1', title: 'التزام', status, dueDate: '2026-11-01' }) as never;
    expect(deriveCommitmentEvents([c('pending')], [c('fulfilled')]).map((e) => e.type)).toEqual([
      'commitment_fulfilled',
    ]);
  });
});

describe('تنفيذ الحدث عبر المشغّل', () => {
  it('ينفّذ القاعدة المطابقة مرة واحدة ويحدّث العدّاد والسجل', () => {
    const { state, deps } = fakeDeps();
    const result = processDomainEvent(event(), deps);

    expect(result.executed).toBe(1);
    expect(state.applied).toHaveLength(1);
    expect(state.runs).toHaveLength(1);
    expect(state.runs[0].outcome).toBe('executed');
    expect(state.rules[0].executionsCount).toBe(1);
    expect(state.rules[0].lastExecutedAt).toBe(state.now);
  });

  it('نفس الحدث مرة ثانية لا يُنفَّذ (منع التكرار)', () => {
    const { state, deps } = fakeDeps();
    processDomainEvent(event(), deps);
    const second = processDomainEvent(event(), deps);

    expect(second.executed).toBe(0);
    expect(second.duplicates).toBe(1);
    expect(state.applied).toHaveLength(1);
    expect(state.rules[0].executionsCount).toBe(1);
  });

  it('أحداث المحرّك نفسه (origin=automation) تُتجاهَل — لا حلقة لانهائية', () => {
    const { state, deps } = fakeDeps();
    const result = processDomainEvent(event({ origin: 'automation' }), deps);
    expect(result.executed).toBe(0);
    expect(state.applied).toHaveLength(0);
  });

  it('حدث لا تطابقه أي قاعدة لا يُنفّذ شيئاً', () => {
    const { state, deps } = fakeDeps();
    const result = processDomainEvent(event({ type: 'order_created', entityType: 'order', entityId: 'o1' }), deps);
    expect(result.evaluatedRules).toBe(0);
    expect(result.executed).toBe(0);
    expect(state.runs).toHaveLength(0);
  });

  it('فشل الإجراء يُسجَّل كـfailed ولا يزيد العدّاد', () => {
    const { state, deps } = fakeDeps();
    deps.applyAction = vi.fn(() => ({ ok: false, note: 'تعذّر' })) as AutomationDeps['applyAction'];
    const result = processDomainEvent(event(), deps);

    expect(result.failed).toBe(1);
    expect(result.executed).toBe(0);
    expect(state.rules[0].executionsCount).toBe(0);
    expect(state.runs[0].outcome).toBe('failed');
    expect(state.runs[0].note).toBe('تعذّر');
  });

  it('قاعدتان مطابقتان ⇒ تنفيذان مستقلان', () => {
    const { state, deps } = fakeDeps([rule(), rule({ id: 'aut_2', actionType: 'create_followup_task' })]);
    const result = processDomainEvent(event(), deps);
    expect(result.executed).toBe(2);
    expect(state.applied).toHaveLength(2);
    expect(state.rules.map((r) => r.executionsCount)).toEqual([1, 1]);
  });
});

describe('المسح الزمني والتشغيل اليدوي', () => {
  const overdueRule = rule({ id: 'aut_over', triggerEvent: 'task_overdue', actionType: 'tag_priority_urgent' });

  it('مسح المتأخرات ينفّذ قاعدة التأخير لكل مهمة متأخرة', () => {
    const { state, deps } = fakeDeps([overdueRule]);
    const tasks = [
      { id: 't1', title: 'متأخرة 1', dueDate: '2026-11-01', status: 'planned' },
      { id: 't2', title: 'متأخرة 2', dueDate: '2026-10-01', status: 'in_progress' },
      { id: 't3', title: 'مستقبلية', dueDate: '2026-12-01', status: 'planned' },
    ];
    const result = sweepOverdueTasks('2026-11-07', deps, tasks);

    expect(result.executed).toBe(2);
    expect(state.applied).toHaveLength(2);
    // تشغيل ثانٍ في اليوم نفسه لا يكرّر
    expect(sweepOverdueTasks('2026-11-07', deps, tasks).executed).toBe(0);
  });

  it('بلا قاعدة تأخير فعّالة لا يُنفَّذ مسح', () => {
    const { deps } = fakeDeps([]);
    const result = sweepOverdueTasks('2026-11-07', deps, [
      { id: 't1', title: 'متأخرة', dueDate: '2026-11-01', status: 'planned' },
    ]);
    expect(result.executed).toBe(0);
  });

  it('التشغيل اليدوي يمرّ بمسار التنفيذ الحقيقي ويحدّث العدّاد', () => {
    const { state, deps } = fakeDeps([rule({ id: 'aut_m', triggerEvent: 'daily_plan_start' })]);
    const result = runRuleManually(state.rules[0], deps);

    expect(result.executed).toBe(1);
    expect(state.applied).toHaveLength(1);
    expect(state.rules[0].executionsCount).toBe(1);
    expect(state.runs[0].note).toBe('نُفِّذ');
  });
});

describe('ناقل أحداث المجال', () => {
  it('ينشر الحدث لكل مستمع ويملأ المعرّف والوقت', async () => {
    const { subscribeDomainEvents, publishDomainEvent, clearDomainEventListeners } =
      await import('../../src/utils/automation/automationEvents');
    clearDomainEventListeners();
    const seen: string[] = [];
    const off = subscribeDomainEvents((e) => seen.push(e.type));
    const event = publishDomainEvent({ type: 'task_created', entityType: 'task', entityId: 't1' });

    expect(seen).toEqual(['task_created']);
    expect(event.id).toMatch(/^evt_/);
    expect(event.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(event.origin).toBe('user');

    off();
    publishDomainEvent({ type: 'task_created', entityType: 'task', entityId: 't2' });
    expect(seen).toHaveLength(1);
  });

  it('مستمع ساقط لا يُسقط النشر ولا بقية المستمعين', async () => {
    const { subscribeDomainEvents, publishDomainEvent, clearDomainEventListeners } =
      await import('../../src/utils/automation/automationEvents');
    clearDomainEventListeners();
    let reached = 0;
    subscribeDomainEvents(() => {
      throw new Error('ساقط');
    });
    subscribeDomainEvents(() => {
      reached += 1;
    });
    publishDomainEvent({ type: 'task_updated', entityType: 'task', entityId: 't1' });
    expect(reached).toBe(1);
    clearDomainEventListeners();
  });

  it('withAutomationOrigin يوسم الأحداث الصادرة داخله بـautomation ومنع الحلقة', async () => {
    const {
      subscribeDomainEvents,
      withAutomationOrigin,
      publishDomainEvent,
      clearDomainEventListeners,
      isSuppressingEvents,
    } = await import('../../src/utils/automation/automationEvents');
    clearDomainEventListeners();
    const origins: string[] = [];
    subscribeDomainEvents((e) => origins.push(e.origin));

    const result = withAutomationOrigin(() => {
      publishDomainEvent({ type: 'task_created', entityType: 'task', entityId: 't1' });
      expect(isSuppressingEvents()).toBe(true);
      return 'تم';
    });

    expect(result).toBe('تم');
    expect(origins).toEqual(['automation']);
    expect(isSuppressingEvents()).toBe(false);
    clearDomainEventListeners();
  });
});

/* ─────────────── الافتراضيات والتوصيل الحقيقي (R46) ─────────────── */

describe('الافتراضيات الافتراضية للمشغّل — التوصيل الحقيقي بلا واجهة', () => {
  it('defaultAutomationDeps.now يُعيد ISO صالحاً', () => {
    const iso = defaultAutomationDeps.now();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(Number.isNaN(Date.parse(iso))).toBe(false);
  });

  it('القواعد والسجل يُقرأان ويُكتبان عبر طبقة العمل الحقيقية', () => {
    defaultAutomationDeps.saveRules([rule({ id: 'aut_persist' })]);
    expect(defaultAutomationDeps.loadRules().some((r) => r.id === 'aut_persist')).toBe(true);

    defaultAutomationDeps.saveRuns([]);
    expect(defaultAutomationDeps.loadRuns()).toEqual([]);
  });

  it('الإجراء الافتراضي هو التنفيذ الحقيقي لا بديل صامت', () => {
    expect(defaultAutomationDeps.applyAction).toBe(executePlannedAction);
  });
});

describe('dispatchDomainEvent — النشر والتقييم في خطوة واحدة', () => {
  it('ينشر الحدث بمصدر «user» ثم يقيّمه ويُنفّذ القاعدة', () => {
    const { state, deps } = fakeDeps();
    const seen: DomainEvent[] = [];
    const unsubscribe = subscribeDomainEvents((e) => seen.push(e));

    const result = dispatchDomainEvent(
      { type: 'task_completed', entityType: 'task', entityId: 't1', title: 'مهمة' },
      deps
    );
    unsubscribe();

    expect(seen).toHaveLength(1);
    expect(seen[0].origin).toBe('user');
    expect(seen[0].id).toMatch(/^evt_/);
    expect(result.executed).toBe(1);
    expect(state.applied).toHaveLength(1);
  });

  it('حدث نشر داخل withAutomationOrigin لا يُنفّذ شيئاً (منع الحلقة)', () => {
    const { state, deps } = fakeDeps();
    let result: ReturnType<typeof dispatchDomainEvent> | null = null;
    withAutomationOrigin(() => {
      result = dispatchDomainEvent({ type: 'task_completed', entityType: 'task', entityId: 't1', title: 'مهمة' }, deps);
    });

    expect(result?.executed).toBe(0);
    expect(result?.evaluatedRules).toBe(0);
    expect(state.applied).toHaveLength(0);
  });
});

describe('صلابة المشغّل أمام حالات التخزين الفارغة', () => {
  const nullRules = () =>
    ({
      now: () => '2026-11-07T08:00:00.000Z',
      loadRules: () => null as unknown as AutomationRule[],
      saveRules: vi.fn(),
      loadRuns: () => undefined as unknown as AutomationRun[],
      saveRuns: vi.fn(),
      applyAction: vi.fn(() => ({ ok: true, note: '' })) as unknown as AutomationDeps['applyAction'],
    }) satisfies AutomationDeps;

  it('loadRules/loadRuns الفارغان يُعاملان كقائمتين فارغتين', () => {
    const deps = nullRules();
    const result = processDomainEvent(event(), deps);
    expect(result).toEqual({ evaluatedRules: 0, executed: 0, failed: 0, duplicates: 0, runs: [] });
    expect(deps.saveRuns).not.toHaveBeenCalled();
  });

  it('المسح الزمني بلا قواعد لا يرمي ولا يُنفّذ', () => {
    const result = sweepOverdueTasks('2026-11-07', nullRules(), [
      { id: 't1', title: 'متأخرة', dueDate: '2026-11-01', status: 'planned' },
    ]);
    expect(result.executed).toBe(0);
  });

  it('التشغيل اليدوي بلا قواعد محفوظة يستخدم القاعدة الممرَّرة', () => {
    const deps = nullRules();
    const manual = rule({ id: 'aut_manual_missing', triggerEvent: 'daily_plan_start' });
    const result = runRuleManually(manual, deps);

    expect(result.executed).toBe(1);
    expect(result.runs[0].ruleId).toBe('aut_manual_missing');
    expect(deps.saveRuns).toHaveBeenCalled();
  });

  it('التشغيل اليدوي الفاشل: يُسجَّل failed ولا يُحدَّث العدّاد', () => {
    const { state, deps } = fakeDeps([rule({ id: 'aut_fail', triggerEvent: 'daily_plan_start' })]);
    deps.applyAction = vi.fn(() => ({ ok: false, note: 'تعذّر' })) as AutomationDeps['applyAction'];

    const result = runRuleManually(state.rules[0], deps);
    expect(result).toMatchObject({ executed: 0, failed: 1, evaluatedRules: 1 });
    expect(state.runs[0].outcome).toBe('failed');
    expect(state.rules[0].executionsCount).toBe(0);
  });

  it('المسح الزمني بلا معاملات يستخدم تاريخ اليوم وقائمة المهام الحقيقية', () => {
    const { deps } = fakeDeps([]);
    const result = sweepOverdueTasks('2026-11-07', deps);
    expect(result).toEqual({ evaluatedRules: 0, executed: 0, failed: 0, duplicates: 0, runs: [] });
  });
});
