/**
 * قواعد مطابقة الأتمتة — **منطق نقي بالكامل** (بلا تخزين ولا DOM)، لذلك يُختبر بالوحدات.
 *
 * كل دالة هنا تُعيد قيمة ولا تُحدث أثراً جانبياً: المطابقة، وخطة الإجراء، ومنع التكرار،
 * وتحديث عدّادات القاعدة بعد التنفيذ.
 */
import type { AutomationRule } from '../../types/workos';
import type { DomainEvent, DomainEventType, PlannedAction } from './automationTypes';

/**
 * خريطة «شرط القاعدة ⇒ أنواع الأحداث التي تُفعّلها».
 * `new_customer_task` ليس حدثاً مستقلاً: يُفعّله إنشاء مهمة مرتبطة بعميل.
 */
export const RULE_TRIGGER_EVENTS: Record<AutomationRule['triggerEvent'], DomainEventType[]> = {
  task_overdue: ['task_overdue'],
  task_completed: ['task_completed'],
  all_subtasks_completed: ['all_subtasks_completed'],
  project_100_percent: ['project_100_percent'],
  new_customer_task: ['task_created'],
  daily_plan_start: ['daily_plan_start'],
};

/** هل تُفعَّل هذه القاعدة بهذا الحدث؟ (القاعدة المعطّلة لا تُفعَّل أبداً) */
export function ruleMatchesEvent(rule: AutomationRule, event: DomainEvent): boolean {
  if (!rule || !rule.isActive) return false;
  const types = RULE_TRIGGER_EVENTS[rule.triggerEvent];
  if (!types || !types.includes(event.type)) return false;

  // شرط خاص: «مهمة عميل جديدة» تعني مهمة مرتبطة بعميل فعلاً، لا أي مهمة
  if (rule.triggerEvent === 'new_customer_task') {
    const customer = event.data?.customerRef ?? event.data?.customerName;
    return typeof customer === 'string' && customer.trim().length > 0;
  }
  return true;
}

/** مفتاح منع التكرار: قاعدة واحدة تُنفَّذ مرة واحدة لكل (حدث + كيان). */
export function runKeyFor(ruleId: string, event: DomainEvent): string {
  return `${ruleId}::${event.type}::${event.entityId}`;
}

/** عنوان ونص الإجراء كما سيُعرض للمستخدم. */
export function describeAction(rule: AutomationRule, event: DomainEvent): { title: string; body: string } {
  const entityLabel =
    event.entityType === 'task'
      ? 'المهمة'
      : event.entityType === 'project'
        ? 'المشروع'
        : event.entityType === 'order'
          ? 'الطلبية'
          : event.entityType === 'commitment'
            ? 'الالتزام المالي'
            : 'النظام';

  const what = event.title ? `${entityLabel} «${event.title}»` : `${entityLabel} ${event.entityId}`;
  return {
    title: `أتمتة: ${rule.name}`,
    body: `${what} — ${event.type === 'task_overdue' ? 'تجاوزت موعد الاستحقاق' : 'تحقّق شرط القاعدة'}. ${rule.description}`,
  };
}

/** يبني خطة الإجراء، أو `null` إن كان الحدث لا يستوجب إجراءً. */
export function planRuleAction(rule: AutomationRule, event: DomainEvent): PlannedAction | null {
  if (!ruleMatchesEvent(rule, event)) return null;
  const { title, body } = describeAction(rule, event);
  return {
    ruleId: rule.id,
    ruleName: rule.name,
    actionType: rule.actionType,
    eventType: event.type,
    entityType: event.entityType,
    entityId: event.entityId,
    key: runKeyFor(rule.id, event),
    title,
    body,
  };
}

/** هل نُفِّذ هذا المفتاح من قبل؟ */
export function isDuplicateRun(runs: { key: string }[], key: string): boolean {
  return runs.some((run) => run.key === key);
}

/** يزيد عدّاد القاعدة ويحدّث وقت آخر تشغيل (يُعيد نسخة جديدة). */
export function applyExecution(rule: AutomationRule, executedAtIso: string): AutomationRule {
  return {
    ...rule,
    executionsCount: (rule.executionsCount || 0) + 1,
    lastExecutedAt: executedAtIso,
  };
}

/** يبقي آخر `keep` سطراً في السجل حتى لا يتضخّم التخزين. */
export function pruneRuns<T>(runs: T[], keep = 200): T[] {
  if (!Array.isArray(runs)) return [];
  if (runs.length <= keep) return runs;
  return runs.slice(0, keep);
}

/** هل المهمة متأخرة في هذا اليوم؟ (تُستخدم في المسح الزمني) */
export function isTaskOverdue(dueDate: string | undefined, status: string, todayStr: string): boolean {
  if (!dueDate) return false;
  if (status === 'completed' || status === 'cancelled' || status === 'archived') return false;
  return dueDate < todayStr;
}
