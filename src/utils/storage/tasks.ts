/**
 * مخزن وحدة «tasks» — مُستخرج من storage.ts (R26).
 * R35: القراءة/الكتابة عبر مستودع واحد (`CollectionRepository`) بدل تكرار
 * `try/JSON.parse/catch` — والسلوك محفوظ حرفياً: المصفوفة الفارغة تُعدّ «لا بيانات»
 * فتُعرض البذرة، وسجل التدقيق بسقف 500 سطر.
 */
import { DEFAULT_COMMITMENTS } from '../../data/defaultCommitments';
import { DEFAULT_TASKS, TASK_ASSIGNEES, TASK_CATEGORIES, TASK_OPERATIONS } from '../../data/defaultTasks';
import { createCollectionRepository } from '../../database/repositories/CollectionRepository';
import { Commitment, Task, TaskAuditLog } from '../../types';
import { STORAGE_KEYS } from './keys';

const tasksRepo = createCollectionRepository<Task>({
  key: STORAGE_KEYS.TASKS_ITEMS,
  fallback: DEFAULT_TASKS,
  fallbackOnEmpty: true,
});

const commitmentsRepo = createCollectionRepository<Commitment>({
  key: STORAGE_KEYS.TASKS_COMMITMENTS,
  fallback: DEFAULT_COMMITMENTS,
  fallbackOnEmpty: true,
});

const taskCategoriesRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.TASKS_CATEGORIES,
  fallback: TASK_CATEGORIES,
  fallbackOnEmpty: true,
});

const taskOperationsRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.TASKS_OPERATIONS,
  fallback: TASK_OPERATIONS,
  fallbackOnEmpty: true,
});

const taskAssigneesRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.TASKS_ASSIGNEES,
  fallback: TASK_ASSIGNEES,
  fallbackOnEmpty: true,
});

const DEFAULT_TASK_AUDIT: TaskAuditLog[] = [
  {
    id: 'TAUD-001',
    time: new Date().toLocaleString('ar-YE'),
    action: 'نظام',
    entity: 'النظام',
    title: 'تهيئة دفتر المهام والأعمال',
    details: 'تم تحميل 103 مهمة و 32 التزاماً مالياً بنجاح',
  },
];

const taskAuditRepo = createCollectionRepository<TaskAuditLog>({
  key: STORAGE_KEYS.TASKS_AUDIT,
  fallback: DEFAULT_TASK_AUDIT,
  limit: 500,
});

export function loadTasks(): Task[] {
  return tasksRepo.read();
}

export function saveTasks(tasks: Task[]): void {
  tasksRepo.write(tasks);
}

export function loadCommitments(): Commitment[] {
  return commitmentsRepo.read();
}

export function saveCommitments(commitments: Commitment[]): void {
  commitmentsRepo.write(commitments);
}

export function loadTaskCategories(): string[] {
  return taskCategoriesRepo.read();
}

export function saveTaskCategories(cats: string[]): void {
  taskCategoriesRepo.write(cats);
}

export function loadTaskOperations(): string[] {
  return taskOperationsRepo.read();
}

export function saveTaskOperations(ops: string[]): void {
  taskOperationsRepo.write(ops);
}

export function loadTaskAssignees(): string[] {
  return taskAssigneesRepo.read();
}

export function saveTaskAssignees(assignees: string[]): void {
  taskAssigneesRepo.write(assignees);
}

export function loadTaskAuditLogs(): TaskAuditLog[] {
  return taskAuditRepo.read();
}

export function saveTaskAuditLogs(logs: TaskAuditLog[]): void {
  taskAuditRepo.write(logs);
}

const createTaskAuditId = (current: TaskAuditLog[]): string => {
  const baseId = `TAUD-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
  if (!current.some((entry) => entry.id === baseId)) return baseId;

  let collision = 1;
  while (current.some((entry) => entry.id === `${baseId}-${collision}`)) collision++;
  return `${baseId}-${collision}`;
};

export function logTaskAudit(
  action: TaskAuditLog['action'],
  entity: TaskAuditLog['entity'],
  title: string,
  details: string
): void {
  const current = loadTaskAuditLogs();
  const newLog: TaskAuditLog = {
    id: createTaskAuditId(current),
    time: new Date().toLocaleString('ar-YE'),
    action,
    entity,
    title,
    details,
  };
  saveTaskAuditLogs([newLog, ...current]);
}
