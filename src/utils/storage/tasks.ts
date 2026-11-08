/**
 * مخزن وحدة «tasks» — مُستخرج من storage.ts (R26).
 */
import {
  DEFAULT_COMMITMENTS,
} from '../../data/defaultCommitments';
import {
  DEFAULT_TASKS,
  TASK_ASSIGNEES,
  TASK_CATEGORIES,
  TASK_OPERATIONS,
} from '../../data/defaultTasks';
import {
  dbStorage,
} from '../../database/dbStorage';
import {
  Commitment,
  Task,
  TaskAuditLog,
} from '../../types';
import {
  STORAGE_KEYS,
} from './keys';

export function loadTasks(): Task[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.TASKS_ITEMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading tasks:', e);
  }
  return DEFAULT_TASKS;
}

export function saveTasks(tasks: Task[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.TASKS_ITEMS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving tasks:', e);
  }
}

export function loadCommitments(): Commitment[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.TASKS_COMMITMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading commitments:', e);
  }
  return DEFAULT_COMMITMENTS;
}

export function saveCommitments(commitments: Commitment[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.TASKS_COMMITMENTS, JSON.stringify(commitments));
  } catch (e) {
    console.error('Error saving commitments:', e);
  }
}

export function loadTaskCategories(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.TASKS_CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading task categories:', e);
  }
  return TASK_CATEGORIES;
}

export function saveTaskCategories(cats: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.TASKS_CATEGORIES, JSON.stringify(cats));
  } catch (e) {
    console.error('Error saving task categories:', e);
  }
}

export function loadTaskOperations(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.TASKS_OPERATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading task operations:', e);
  }
  return TASK_OPERATIONS;
}

export function saveTaskOperations(ops: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.TASKS_OPERATIONS, JSON.stringify(ops));
  } catch (e) {
    console.error('Error saving task operations:', e);
  }
}

export function loadTaskAssignees(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.TASKS_ASSIGNEES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading task assignees:', e);
  }
  return TASK_ASSIGNEES;
}

export function saveTaskAssignees(assignees: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.TASKS_ASSIGNEES, JSON.stringify(assignees));
  } catch (e) {
    console.error('Error saving task assignees:', e);
  }
}

export function loadTaskAuditLogs(): TaskAuditLog[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.TASKS_AUDIT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading task audit logs:', e);
  }
  return [
    {
      id: 'TAUD-001',
      time: new Date().toLocaleString('ar-YE'),
      action: 'نظام',
      entity: 'النظام',
      title: 'تهيئة دفتر المهام والأعمال',
      details: 'تم تحميل 103 مهمة و 32 التزاماً مالياً بنجاح',
    },
  ];
}

export function saveTaskAuditLogs(logs: TaskAuditLog[]): void {
  try {
    const trimmed = logs.slice(0, 500); // PRD: Max 500
    dbStorage.setItem(STORAGE_KEYS.TASKS_AUDIT, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving task audit logs:', e);
  }
}

export function logTaskAudit(
  action: TaskAuditLog['action'],
  entity: TaskAuditLog['entity'],
  title: string,
  details: string
): void {
  const current = loadTaskAuditLogs();
  const newLog: TaskAuditLog = {
    id: `TAUD-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    time: new Date().toLocaleString('ar-YE'),
    action,
    entity,
    title,
    details,
  };
  saveTaskAuditLogs([newLog, ...current]);
}
