/**
 * خدمة مهام مساحة العمل (R40) — تُخرج منطق «تبديل الإنجاز» من المكوّنات.
 *
 * لماذا؟ لأن `UnifiedDashboard` كان يكتب مفتاح `workos_v1_tasks` مباشرةً:
 * مكوّن يعرف مفتاح تخزين = خرق للطبقات ونسخة ثانية من منطق المطابقة
 * (`id` أو `taskNumber`) تتباعد عن الأصل مع أول تعديل.
 *
 * **لا تغيير سلوك:** الكتابة هنا تمرّ بـ`saveTasksWithoutEvents` عمداً، لأن
 * المكوّن كان يكتب الخام ولا ينشر أحداث أتمتة. المسارات التي تريد إطلاق
 * الأتمتة تستخدم `saveTasks` من `workosLoaders` مباشرةً.
 */
import { loadTasks, saveTasksWithoutEvents } from '../../utils/workos/workosLoaders';
import type { WorkTask } from '../../types';

/** يطابق المهمة بمعرّفها أو برقمها (`id` أو `taskNumber`) كما كان في اللوحة. */
const findTask = (tasks: WorkTask[], taskId: string): WorkTask | undefined =>
  tasks.find((task) => task.id === taskId || task.taskNumber === taskId);

/**
 * يبدّل حالة الإنجاز: مكتملة ⇒ قيد التنفيذ (تقدم 50)، وغير مكتملة ⇒ مكتملة (تقدم 100).
 * يعيد `true` إن تغيّرت مهمة فعلية، و`false` إن لم تُطابق (فلا كتابة ولا حدث).
 */
export function toggleWorkOSTaskCompletion(taskId: string): boolean {
  const tasks = loadTasks();
  const matched = findTask(tasks, taskId);
  if (!matched) return false;

  const wasCompleted = matched.status === 'completed';
  const updated = tasks.map((task) =>
    task.id === matched.id
      ? {
          ...task,
          status: wasCompleted ? ('in_progress' as const) : ('completed' as const),
          progress: wasCompleted ? 50 : 100,
          updatedAt: new Date().toISOString(),
        }
      : task
  );
  saveTasksWithoutEvents(updated);
  return true;
}

/** يُعلّم المهمة مكتملة (تقدم 100). يعيد `true` إن تغيّرت مهمة فعلية. */
export function completeWorkOSTask(taskId: string): boolean {
  const tasks = loadTasks();
  const matched = findTask(tasks, taskId);
  if (!matched) return false;

  const updated = tasks.map((task) =>
    task.id === matched.id
      ? { ...task, status: 'completed' as const, progress: 100, updatedAt: new Date().toISOString() }
      : task
  );
  saveTasksWithoutEvents(updated);
  return true;
}
