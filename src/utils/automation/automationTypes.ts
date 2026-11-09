/**
 * أنواع مشغّل أحداث الأتمتة (R31).
 *
 * الفكرة: كل تغيير حقيقي في البيانات يُنشر كـ«حدث مجال» (Domain Event)، ثم تُقيَّم
 * قواعد الأتمتة المخزَّنة (`AutomationRule`) وتُنفَّذ إجراءاتها — بدل الاعتماد على
 * زر «تشغيل» يدوي داخل شاشة واحدة.
 */
import type { AutomationRule } from '../../types/workos';

/** أنواع الأحداث التي يفهمها المشغّل. */
export type DomainEventType =
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_reopened'
  | 'all_subtasks_completed'
  | 'task_overdue'
  | 'project_created'
  | 'project_updated'
  | 'project_100_percent'
  | 'order_created'
  | 'order_delivered'
  | 'commitment_created'
  | 'commitment_fulfilled'
  | 'daily_plan_start';

/** أصل الحدث: مستخدم · محرّك الأتمتة نفسه · النظام (إقلاع/مسح مجدول). */
export type DomainEventOrigin = 'user' | 'automation' | 'system';

export type DomainEntityType = 'task' | 'project' | 'order' | 'commitment' | 'system';

export interface DomainEventInput {
  type: DomainEventType;
  entityType: DomainEntityType;
  entityId: string;
  title?: string;
  origin?: DomainEventOrigin;
  data?: Record<string, unknown>;
}

export interface DomainEvent extends DomainEventInput {
  id: string;
  at: string;
  origin: DomainEventOrigin;
}

/** نتيجة تنفيذ إجراء واحد. */
export interface ActionResult {
  ok: boolean;
  note?: string;
}

/** ما تخطّط القاعدة فعله لهذا الحدث (وصف نقي بلا آثار جانبية). */
export interface PlannedAction {
  ruleId: string;
  ruleName: string;
  actionType: AutomationRule['actionType'];
  eventType: DomainEventType;
  entityType: DomainEntityType;
  entityId: string;
  /** مفتاح منع التكرار: قاعدة + حدث + كيان. */
  key: string;
  title: string;
  body: string;
}

/** سطر في سجل التشغيل (يُخزَّن ويُعرض). */
export interface AutomationRun {
  key: string;
  ruleId: string;
  ruleName: string;
  actionType: AutomationRule['actionType'];
  eventType: DomainEventType;
  entityType: DomainEntityType;
  entityId: string;
  executedAt: string;
  outcome: 'executed' | 'failed';
  note?: string;
}

/** حصيلة تقييم حدث (أو مسح) واحد. */
export interface AutomationSweepResult {
  evaluatedRules: number;
  executed: number;
  failed: number;
  duplicates: number;
  runs: AutomationRun[];
}
