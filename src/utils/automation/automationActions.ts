/**
 * تنفيذ إجراءات الأتمتة (R31) — الطبقة الوحيدة التي تُحدث أثراً جانبياً.
 *
 * كل إجراء مكتوب بحيث يكون **قابلاً للتكرار بلا ضرر** (idempotent) على مستوى النتيجة:
 * لا يُنشئ نسخة ثانية من مهمة المتابعة نفسها في اليوم نفسه، ولا يكرّر العناوين.
 */
import type { WorkTask } from '../../types/workos';
import { loadAutomations, loadOrders, loadProjects, loadTasks, saveProjects, saveTasks } from '../workos/workosLoaders';
import { logWorkActivity } from '../workos/workosLoaders';
import { sendSystemNotification } from '../webNotifications';
import { withAutomationOrigin } from './automationEvents';
import type { ActionResult, DomainEvent, PlannedAction } from './automationTypes';

const AUTOMATION_USER = 'محرّك الأتمتة';

const todayStr = (): string => new Date().toISOString().slice(0, 10);

/** المعرّف الفريد لمهمة متابعة مشتقة من مفتاح التشغيل (يمنع التكرار). */
const followupIdFor = (key: string): string => `tsk_auto_${key.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60)}`;

function findTask(entityId: string): WorkTask | undefined {
  return loadTasks().find((task) => task.id === entityId);
}

/** إشعار الفريق: إشعار نظام (إن سُمح) + سطر في سجل نشاط إدارة العمل. */
function notifyTeam(action: PlannedAction, event: DomainEvent): ActionResult {
  let notified = false;
  try {
    notified = sendSystemNotification(action.title, {
      body: action.body,
      tag: action.key,
      data: { entityType: String(event.entityType), entityId: event.entityId },
    });
  } catch {
    notified = false;
  }

  withAutomationOrigin(() => {
    logWorkActivity(
      AUTOMATION_USER,
      'إشعار أتمتة',
      event.entityType,
      event.title || event.entityId,
      undefined,
      action.ruleName
    );
  });

  return { ok: true, note: notified ? 'أُرسل إشعار نظام' : 'سُجِّل الإشعار في سجل النشاط (إشعار النظام غير مسموح)' };
}

/** إنشاء مهمة متابعة حقيقية في مخزن المهام (مرة واحدة لكل مفتاح). */
function createFollowupTask(action: PlannedAction, event: DomainEvent): ActionResult {
  const id = followupIdFor(action.key);
  const tasks = loadTasks();
  if (tasks.some((task) => task.id === id)) {
    return { ok: true, note: 'مهمة المتابعة موجودة مسبقاً — لم تُكرَّر' };
  }

  const projects = loadProjects();
  const sourceTask = findTask(event.entityId);
  const projectId = sourceTask?.projectId || projects[0]?.id;

  const followup: WorkTask = {
    id,
    taskNumber: `TSK-AUTO-${tasks.length + 1}`,
    title: `متابعة أتمتة: ${action.ruleName}`,
    description: `${action.body}\n\n(أُنشئت تلقائياً بواسطة مشغّل الأحداث — ${action.eventType})`,
    status: 'planned',
    priority: 'high',
    projectId,
    category: 'أتمتة',
    tags: ['أتمتة', 'متابعة'],
    assigneeId: sourceTask?.assigneeId || 'mem_1',
    creator: AUTOMATION_USER,
    startDate: todayStr(),
    dueDate: todayStr(),
    estimatedHours: 1,
    actualHours: 0,
    progress: 0,
    subtasks: [],
    checklist: [],
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  withAutomationOrigin(() => {
    saveTasks([followup, ...tasks]);
    logWorkActivity(AUTOMATION_USER, 'مهمة متابعة', 'task', followup.title, undefined, action.ruleName);
  });

  return { ok: true, note: `أُنشئت مهمة متابعة ${followup.taskNumber}` };
}

/** وسم الأولويات العاجلة: المهام غير المنجزة المرتبطة بالمشروع/المهمة. */
function tagPriorityUrgent(action: PlannedAction, event: DomainEvent): ActionResult {
  const tasks = loadTasks();
  const projectId = event.data?.projectId as string | undefined;
  let touched = 0;

  const updated = tasks.map((task) => {
    const inScope = projectId ? task.projectId === projectId : task.id === event.entityId;
    if (!inScope) return task;
    if (task.status === 'completed' || task.status === 'cancelled') return task;
    if (task.priority === 'urgent') return task;
    touched += 1;
    return { ...task, priority: 'urgent' as const, updatedAt: new Date().toISOString() };
  });

  if (touched === 0) return { ok: true, note: 'لا مهام تحتاج رفع الأولوية' };

  withAutomationOrigin(() => saveTasks(updated));
  return { ok: true, note: `رُفعت أولوية ${touched} مهمة إلى «عاجل»` };
}

/** إغلاق المشروع عند بلوغ 100%. */
function markProjectCompleted(action: PlannedAction, event: DomainEvent): ActionResult {
  const projects = loadProjects();
  const target = projects.find((project) => project.id === event.entityId);
  if (!target) return { ok: false, note: 'المشروع غير موجود' };
  if (target.status === 'completed') return { ok: true, note: 'المشروع مغلق مسبقاً' };

  withAutomationOrigin(() => {
    saveProjects(
      projects.map((project) =>
        project.id === target.id
          ? { ...project, status: 'completed' as const, progress: 100, updatedAt: new Date().toISOString() }
          : project
      )
    );
    logWorkActivity(AUTOMATION_USER, 'إغلاق مشروع', 'project', target.name, target.status, 'completed');
  });

  return { ok: true, note: 'أُغلق المشروع تلقائياً' };
}

/** أرشفة الكيان (مهمة مكتملة ⇒ أرشيف). */
function archiveItem(action: PlannedAction, event: DomainEvent): ActionResult {
  if (event.entityType !== 'task') return { ok: true, note: 'الأرشفة مقيّدة بالمهام' };
  const tasks = loadTasks();
  const target = tasks.find((task) => task.id === event.entityId);
  if (!target) return { ok: false, note: 'المهمة غير موجودة' };
  if (target.status === 'archived') return { ok: true, note: 'مؤرشفة مسبقاً' };

  withAutomationOrigin(() => {
    saveTasks(
      tasks.map((task) =>
        task.id === target.id ? { ...task, status: 'archived' as const, archivedAt: new Date().toISOString() } : task
      )
    );
  });

  return { ok: true, note: 'أُرشفت المهمة' };
}

/** تنفيذ خطة إجراء واحدة. */
export function executePlannedAction(action: PlannedAction, event: DomainEvent): ActionResult {
  try {
    switch (action.actionType) {
      case 'notify_team':
        return notifyTeam(action, event);
      case 'create_followup_task':
        return createFollowupTask(action, event);
      case 'tag_priority_urgent':
        return tagPriorityUrgent(action, event);
      case 'mark_project_completed':
        return markProjectCompleted(action, event);
      case 'archive_item':
        return archiveItem(action, event);
      default:
        return { ok: false, note: `إجراء غير معروف: ${String(action.actionType)}` };
    }
  } catch (err) {
    return { ok: false, note: err instanceof Error ? err.message : 'خطأ غير معروف' };
  }
}

/** عدد القواعد المخزَّنة النشطة (يُستخدم في التشخيص والإقلاع). */
export function countActiveRules(): number {
  return loadAutomations().filter((rule) => rule.isActive).length;
}

/** عدد الطلبيات المتأخرة (للمسح اليومي). */
export function countLateOrders(): number {
  const today = todayStr();
  return loadOrders().filter(
    (order) => order.status !== 'delivered' && order.status !== 'cancelled' && order.deliveryDate < today
  ).length;
}
