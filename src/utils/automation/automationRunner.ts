/**
 * مشغّل أحداث الأتمتة (R31) — يقيّم القواعد على حدث ويُنفّذ الإجراءات فعلياً.
 *
 * التصميم:
 *   - `deps` قابلة للحقن ⇒ المشغّل يُختبر بلا IndexedDB ولا DOM (بوابة + اختبارات وحدات).
 *   - منع التكرار بمفتاح (قاعدة · نوع الحدث · الكيان) في سجل التشغيل.
 *   - الأحداث الصادرة من محرّك الأتمتة نفسه (`origin: 'automation'`) تُتجاهَل ⇒ لا حلقات.
 *   - كل تشغيل يُحدِّث عدّاد القاعدة ووقت آخر تشغيل — أي أن الأرقام في الشاشة صارت حقيقية.
 */
import type { AutomationRule } from '../../types/workos';
import { loadAutomations, loadTasks, saveAutomations } from '../workos/workosLoaders';
import { executePlannedAction } from './automationActions';
import { isTaskOverdue, planRuleAction, applyExecution, pruneRuns, isDuplicateRun } from './automationRules';
import { loadAutomationRuns, saveAutomationRuns } from './automationStore';
import { publishDomainEvent } from './automationEvents';
import { notifyAutomationUpdated } from './automationNotifier';
import type { AutomationRun, AutomationSweepResult, DomainEvent, DomainEventInput } from './automationTypes';

export interface AutomationDeps {
  now: () => string;
  loadRules: () => AutomationRule[];
  saveRules: (rules: AutomationRule[]) => void;
  loadRuns: () => AutomationRun[];
  saveRuns: (runs: AutomationRun[]) => void;
  applyAction: typeof executePlannedAction;
}

export const defaultAutomationDeps: AutomationDeps = {
  now: () => new Date().toISOString(),
  loadRules: () => loadAutomations(),
  saveRules: (rules) => saveAutomations(rules),
  loadRuns: () => loadAutomationRuns(),
  saveRuns: (runs) => saveAutomationRuns(runs),
  applyAction: executePlannedAction,
};

const emptyResult = (): AutomationSweepResult => ({
  evaluatedRules: 0,
  executed: 0,
  failed: 0,
  duplicates: 0,
  runs: [],
});

/**
 * يقيّم كل القواعد على حدث واحد.
 * الأحداث الصادرة من محرّك الأتمتة تُتجاهَل (حماية من الحلقة).
 */
export function processDomainEvent(
  event: DomainEvent,
  deps: AutomationDeps = defaultAutomationDeps
): AutomationSweepResult {
  const result = emptyResult();
  if (event.origin === 'automation') return result;

  const rules = deps.loadRules() || [];
  const runs = deps.loadRuns() || [];
  const newRuns: AutomationRun[] = [];
  const executedRuleIds = new Set<string>();

  for (const rule of rules) {
    const plan = planRuleAction(rule, event);
    if (!plan) continue;
    result.evaluatedRules += 1;

    if (isDuplicateRun([...runs, ...newRuns], plan.key)) {
      result.duplicates += 1;
      continue;
    }

    const outcome = deps.applyAction(plan, event);
    const executedAt = deps.now();
    const run: AutomationRun = {
      key: plan.key,
      ruleId: rule.id,
      ruleName: rule.name,
      actionType: rule.actionType,
      eventType: event.type,
      entityType: event.entityType,
      entityId: event.entityId,
      executedAt,
      outcome: outcome.ok ? 'executed' : 'failed',
      note: outcome.note,
    };
    newRuns.push(run);
    result.runs.push(run);
    if (outcome.ok) {
      result.executed += 1;
      executedRuleIds.add(rule.id);
    } else {
      result.failed += 1;
    }
  }

  if (newRuns.length > 0) {
    deps.saveRuns(pruneRuns([...newRuns, ...runs]));
    const nextRules = rules.map((rule) => {
      if (!executedRuleIds.has(rule.id)) return rule;
      const latest = [...newRuns].reverse().find((run) => run.ruleId === rule.id);
      return applyExecution(rule, latest?.executedAt || deps.now());
    });
    deps.saveRules(nextRules);
    notifyAutomationUpdated({ executed: result.executed, failed: result.failed });
  }

  return result;
}

/** ينشر حدثاً ويقيّمه فوراً — الواجهة البرمجية التي تستدعيها طبقة الكتابة. */
export function dispatchDomainEvent(
  input: DomainEventInput,
  deps: AutomationDeps = defaultAutomationDeps
): AutomationSweepResult {
  const event = publishDomainEvent(input);
  return processDomainEvent(event, deps);
}

/**
 * المسح الزمني: يُطلق `task_overdue` لكل مهمة تجاوزت موعدها ولم تُنجَز.
 * يُشغَّل عند الإقلاع وعند تغيّر اليوم — لا يعتمد على فتح شاشة معيّنة.
 */
export function sweepOverdueTasks(
  todayStr: string = new Date().toISOString().slice(0, 10),
  deps: AutomationDeps = defaultAutomationDeps,
  tasks: { id: string; title: string; dueDate?: string; status: string; projectId?: string }[] = loadTasks()
): AutomationSweepResult {
  const total = emptyResult();
  const rules = deps.loadRules() || [];
  const hasOverdueRule = rules.some((rule) => rule.isActive && rule.triggerEvent === 'task_overdue');
  if (!hasOverdueRule) return total;

  for (const task of tasks) {
    if (!isTaskOverdue(task.dueDate, task.status, todayStr)) continue;
    const result = processDomainEvent(
      {
        id: `evt_overdue_${task.id}_${todayStr}`,
        at: deps.now(),
        origin: 'system',
        type: 'task_overdue',
        entityType: 'task',
        entityId: task.id,
        title: task.title,
        data: { dueDate: task.dueDate, projectId: task.projectId, today: todayStr },
      },
      deps
    );
    total.evaluatedRules += result.evaluatedRules;
    total.executed += result.executed;
    total.failed += result.failed;
    total.duplicates += result.duplicates;
    total.runs.push(...result.runs);
  }

  return total;
}

/** تشغيل قاعدة يدوياً (زر «تشغيل» في شاشة الأتمتة) عبر نفس مسار التنفيذ الحقيقي. */
export function runRuleManually(
  rule: AutomationRule,
  deps: AutomationDeps = defaultAutomationDeps
): AutomationSweepResult {
  const rules = deps.loadRules() || [];
  const current = rules.find((item) => item.id === rule.id) || rule;
  const now = deps.now();
  const event: DomainEvent = {
    id: `evt_manual_${current.id}_${Date.parse(now) || 0}`,
    at: now,
    origin: 'user',
    type: 'daily_plan_start',
    entityType: 'system',
    entityId: current.id,
    title: current.name,
    data: { manual: true, actionType: current.actionType },
  };

  const plan = planRuleAction({ ...current, isActive: true, triggerEvent: 'daily_plan_start' }, event);
  if (!plan) return emptyResult();

  const outcome = deps.applyAction(plan, event);
  const run: AutomationRun = {
    key: `${plan.key}::manual::${now}`,
    ruleId: current.id,
    ruleName: current.name,
    actionType: current.actionType,
    eventType: 'daily_plan_start',
    entityType: 'system',
    entityId: current.id,
    executedAt: now,
    outcome: outcome.ok ? 'executed' : 'failed',
    note: outcome.note,
  };

  deps.saveRuns(pruneRuns([run, ...(deps.loadRuns() || [])]));
  if (outcome.ok) {
    deps.saveRules(rules.map((item) => (item.id === current.id ? applyExecution(item, now) : item)));
  }
  notifyAutomationUpdated({ executed: outcome.ok ? 1 : 0, failed: outcome.ok ? 0 : 1 });

  return {
    evaluatedRules: 1,
    executed: outcome.ok ? 1 : 0,
    failed: outcome.ok ? 0 : 1,
    duplicates: 0,
    runs: [run],
  };
}
