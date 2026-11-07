import { Task, Commitment } from '../types';
import { dbStorage } from '../database/dbStorage';

export interface DueAlertItem {
  id: string;
  type: 'task' | 'commitment';
  title: string;
  dueDate: string; // YYYY-MM-DD
  diffDays: number; // < 0 overdue, 0 today, > 0 upcoming
  urgency: 'overdue' | 'today' | 'soon';
  priority?: string;
  amount?: number;
  status: string;
  category?: string;
  responsible?: string;
}

export interface DueAlertsSummary {
  items: DueAlertItem[];
  total: number;
  overdueCount: number;
  todayCount: number;
  soonCount: number;
  archivedCount?: number;
}

const ARCHIVED_ALERTS_KEY = 'primo_archived_alert_ids_v1';

export function loadArchivedAlertIds(): string[] {
  try {
    const raw = dbStorage.getItem(ARCHIVED_ALERTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveArchivedAlertIds(ids: string[]): void {
  try {
    dbStorage.setItem(ARCHIVED_ALERTS_KEY, JSON.stringify(ids));
  } catch {}
}

export function archiveAlertIds(idsToArchive: string[]): void {
  const current = new Set(loadArchivedAlertIds());
  idsToArchive.forEach((id) => current.add(id));
  saveArchivedAlertIds(Array.from(current));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('primo:alerts_archived'));
  }
}

export function clearArchivedAlerts(): void {
  saveArchivedAlertIds([]);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('primo:alerts_archived'));
  }
}

/**
 * Calculates calendar day difference between target date and current date (midnight to midnight).
 */
export function getCalendarDayDiff(targetDateStr: string, referenceDate: Date = new Date()): number {
  if (!targetDateStr) return 999;
  
  // Normalize reference date to midnight
  const refMidnight = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()).getTime();
  
  const parts = targetDateStr.split('-');
  if (parts.length !== 3) return 999;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const targetMidnight = new Date(year, month, day).getTime();
  const diffMs = targetMidnight - refMidnight;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export interface DueAlertsOptions {
  daysThreshold?: number; // default: 3
  maxOverdueDays?: number; // default: 60 (ignores historical backlog older than 60 days)
  includeArchived?: boolean; // default: false
}

/**
 * Scans tasks and commitments to identify approaching and overdue items.
 * Intelligently suppresses stale backlog (> 60 days overdue) and archived items.
 */
export function getDueAlerts(
  tasks: Task[] = [],
  commitments: Commitment[] = [],
  daysThresholdOrOptions: number | DueAlertsOptions = 3,
  referenceDate: Date = new Date()
): DueAlertsSummary {
  const options: DueAlertsOptions =
    typeof daysThresholdOrOptions === 'number'
      ? { daysThreshold: daysThresholdOrOptions, maxOverdueDays: 60, includeArchived: false }
      : { daysThreshold: 3, maxOverdueDays: 60, includeArchived: false, ...daysThresholdOrOptions };

  const daysThreshold = options.daysThreshold ?? 3;
  const maxOverdueDays = options.maxOverdueDays ?? 60;
  const archivedIds = new Set(loadArchivedAlertIds());

  const alerts: DueAlertItem[] = [];

  // 1. Process Tasks
  for (const task of tasks) {
    if (task.status === 'تم الانجاز' || task.status === 'ملغي') {
      continue;
    }

    if (!options.includeArchived && archivedIds.has(task.id)) {
      continue;
    }

    const dueDate = task.end || task.start;
    if (!dueDate) continue;

    const diffDays = getCalendarDayDiff(dueDate, referenceDate);

    // Filter out old historical backlog beyond cutoff
    if (diffDays < -maxOverdueDays) {
      continue;
    }

    if (diffDays <= daysThreshold) {
      let urgency: 'overdue' | 'today' | 'soon' = 'soon';
      if (diffDays < 0) {
        urgency = 'overdue';
      } else if (diffDays === 0) {
        urgency = 'today';
      }

      alerts.push({
        id: task.id,
        type: 'task',
        title: task.title,
        dueDate,
        diffDays,
        urgency,
        priority: task.pri,
        amount: task.amount,
        status: task.status,
        category: task.cat,
        responsible: task.resp,
      });
    }
  }

  // 2. Process Commitments
  for (const comm of commitments) {
    if (comm.status === 'تم الانجاز' || comm.status === 'ملغي') {
      continue;
    }

    if (!options.includeArchived && archivedIds.has(comm.id)) {
      continue;
    }

    const dueDate = comm.due;
    if (!dueDate) continue;

    const diffDays = getCalendarDayDiff(dueDate, referenceDate);

    if (diffDays < -maxOverdueDays) {
      continue;
    }

    if (diffDays <= daysThreshold) {
      let urgency: 'overdue' | 'today' | 'soon' = 'soon';
      if (diffDays < 0) {
        urgency = 'overdue';
      } else if (diffDays === 0) {
        urgency = 'today';
      }

      alerts.push({
        id: comm.id,
        type: 'commitment',
        title: comm.name,
        dueDate,
        diffDays,
        urgency,
        priority: comm.pri,
        amount: comm.amount,
        status: comm.status,
        category: 'التزامات مالية',
      });
    }
  }

  // Sort by urgency:
  // overdue first (lowest diffDays), then today (0), then soon (1, 2, 3), priority (A > B > C > D)
  const priorityOrder: Record<string, number> = { A: 1, B: 2, C: 3, D: 4 };
  alerts.sort((a, b) => {
    if (a.diffDays !== b.diffDays) {
      return a.diffDays - b.diffDays;
    }
    const priA = priorityOrder[a.priority || 'B'] || 5;
    const priB = priorityOrder[b.priority || 'B'] || 5;
    return priA - priB;
  });

  const overdueCount = alerts.filter((a) => a.urgency === 'overdue').length;
  const todayCount = alerts.filter((a) => a.urgency === 'today').length;
  const soonCount = alerts.filter((a) => a.urgency === 'soon').length;

  return {
    items: alerts,
    total: alerts.length,
    overdueCount,
    todayCount,
    soonCount,
    archivedCount: archivedIds.size,
  };
}

/**
 * Returns human-friendly Arabic text describing the due status
 */
export function formatDueText(diffDays: number): { text: string; badgeColor: string } {
  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      text: daysAgo === 1 ? 'متأخر منذ يوم' : daysAgo === 2 ? 'متأخر منذ يومين' : `متأخر منذ ${daysAgo} أيام`,
      badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    };
  }

  if (diffDays === 0) {
    return {
      text: 'مستحق اليوم!',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    };
  }

  if (diffDays === 1) {
    return {
      text: 'مستحق غداً',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    };
  }

  if (diffDays === 2) {
    return {
      text: 'متبقي يومان',
      badgeColor: 'bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    };
  }

  return {
    text: `متبقي ${diffDays} أيام`,
    badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };
}
