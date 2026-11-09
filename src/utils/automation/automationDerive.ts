/**
 * اشتقاق أحداث المجال من فرق الحالة (R31) — **منطق نقي** يُختبر بالوحدات.
 *
 * لماذا الفرق لا «الإجراء»؟ لأن الكتابة تحدث في طبقة التخزين من مسارات واجهة متعدّدة
 * (لوحة التحكم · إدارة العمل · الزيارات · الأوامر الثلاثية). اشتقاق الحدث من
 * (قبل ⇒ بعد) يضمن أن **كل** مسار كتابة يُطلق الحدث نفسه، بلا نسيان مسار.
 */
import type { WorkCommitment, WorkOrder, WorkProject, WorkTask } from '../../types/workos';
import type { DomainEventInput } from './automationTypes';

const DONE_STATUSES = ['completed', 'cancelled', 'archived'];

const isDone = (status: string): boolean => DONE_STATUSES.includes(status);

const allSubtasksDone = (task: WorkTask): boolean =>
  Array.isArray(task.subtasks) && task.subtasks.length > 0 && task.subtasks.every((st) => st.completed);

/** أحداث المهام: إنشاء · إنجاز · إعادة فتح · اكتمال المهام الفرعية · تعديل حقيقي. */
export function deriveTaskEvents(prev: WorkTask[] = [], next: WorkTask[] = []): DomainEventInput[] {
  const events: DomainEventInput[] = [];
  const prevById = new Map((prev || []).map((t) => [t.id, t]));

  for (const task of next || []) {
    const before = prevById.get(task.id);

    if (!before) {
      events.push({
        type: 'task_created',
        entityType: 'task',
        entityId: task.id,
        title: task.title,
        data: {
          projectId: task.projectId,
          customerRef: task.customerRef,
          assigneeId: task.assigneeId,
          status: task.status,
        },
      });
      if (allSubtasksDone(task)) {
        events.push({
          type: 'all_subtasks_completed',
          entityType: 'task',
          entityId: task.id,
          title: task.title,
          data: { projectId: task.projectId },
        });
      }
      continue;
    }

    const wasDone = isDone(before.status);
    const nowDone = isDone(task.status);

    if (!wasDone && nowDone) {
      events.push({
        type: 'task_completed',
        entityType: 'task',
        entityId: task.id,
        title: task.title,
        data: { projectId: task.projectId, previousStatus: before.status, status: task.status },
      });
    } else if (wasDone && !nowDone) {
      events.push({
        type: 'task_reopened',
        entityType: 'task',
        entityId: task.id,
        title: task.title,
        data: { previousStatus: before.status, status: task.status },
      });
    }

    if (!allSubtasksDone(before) && allSubtasksDone(task)) {
      events.push({
        type: 'all_subtasks_completed',
        entityType: 'task',
        entityId: task.id,
        title: task.title,
        data: { projectId: task.projectId, subtasks: task.subtasks.length },
      });
    }

    const meaningfulChange =
      before.status !== task.status ||
      before.priority !== task.priority ||
      before.dueDate !== task.dueDate ||
      before.progress !== task.progress ||
      before.assigneeId !== task.assigneeId ||
      before.projectId !== task.projectId;

    if (meaningfulChange && wasDone === nowDone) {
      events.push({
        type: 'task_updated',
        entityType: 'task',
        entityId: task.id,
        title: task.title,
        data: {
          previousStatus: before.status,
          status: task.status,
          previousPriority: before.priority,
          priority: task.priority,
          previousDueDate: before.dueDate,
          dueDate: task.dueDate,
          projectId: task.projectId,
        },
      });
    }
  }

  return events;
}

/** أحداث المشاريع: إنشاء · بلوغ 100% · تعديل. */
export function deriveProjectEvents(prev: WorkProject[] = [], next: WorkProject[] = []): DomainEventInput[] {
  const events: DomainEventInput[] = [];
  const prevById = new Map((prev || []).map((p) => [p.id, p]));

  for (const project of next || []) {
    const before = prevById.get(project.id);

    if (!before) {
      events.push({
        type: 'project_created',
        entityType: 'project',
        entityId: project.id,
        title: project.name,
        data: { status: project.status, progress: project.progress },
      });
      continue;
    }

    const reachedFull =
      (project.progress >= 100 || project.status === 'completed') &&
      !(before.progress >= 100 || before.status === 'completed');

    if (reachedFull) {
      events.push({
        type: 'project_100_percent',
        entityType: 'project',
        entityId: project.id,
        title: project.name,
        data: { progress: project.progress, previousProgress: before.progress },
      });
      continue;
    }

    if (before.status !== project.status || before.progress !== project.progress) {
      events.push({
        type: 'project_updated',
        entityType: 'project',
        entityId: project.id,
        title: project.name,
        data: { previousStatus: before.status, status: project.status, progress: project.progress },
      });
    }
  }

  return events;
}

/** أحداث الطلبيات: إنشاء · تسليم. */
export function deriveOrderEvents(prev: WorkOrder[] = [], next: WorkOrder[] = []): DomainEventInput[] {
  const events: DomainEventInput[] = [];
  const prevById = new Map((prev || []).map((o) => [o.id, o]));

  for (const order of next || []) {
    const before = prevById.get(order.id);
    if (!before) {
      events.push({
        type: 'order_created',
        entityType: 'order',
        entityId: order.id,
        title: order.title,
        data: { customerName: order.customerName, status: order.status, totalAmount: order.totalAmount },
      });
      continue;
    }
    if (before.status !== 'delivered' && order.status === 'delivered') {
      events.push({
        type: 'order_delivered',
        entityType: 'order',
        entityId: order.id,
        title: order.title,
        data: { customerName: order.customerName, orderNumber: order.orderNumber },
      });
    }
  }

  return events;
}

/** أحداث الالتزامات المالية: إنشاء · سداد. */
export function deriveCommitmentEvents(prev: WorkCommitment[] = [], next: WorkCommitment[] = []): DomainEventInput[] {
  const events: DomainEventInput[] = [];
  const prevById = new Map((prev || []).map((c) => [c.id, c]));

  for (const commitment of next || []) {
    const before = prevById.get(commitment.id);
    if (!before) {
      events.push({
        type: 'commitment_created',
        entityType: 'commitment',
        entityId: commitment.id,
        title: commitment.title,
        data: { amount: commitment.amount, dueDate: commitment.dueDate },
      });
      continue;
    }
    if (before.status !== 'fulfilled' && commitment.status === 'fulfilled') {
      events.push({
        type: 'commitment_fulfilled',
        entityType: 'commitment',
        entityId: commitment.id,
        title: commitment.title,
        data: { amount: commitment.amount },
      });
    }
  }

  return events;
}
