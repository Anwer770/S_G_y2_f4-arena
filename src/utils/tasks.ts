import { Commitment, Task, TaskFilterState } from '../types';

export interface TaskStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  overdue: number;
  completed: number;
  inProgress: number;
  total: number;
  totalCommitmentsAmount: number;
  outstandingCommitmentsAmount: number;
  paidCommitmentsAmount: number;
  completionRate: number;
  categoryDistribution: { cat: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  priorityDistribution: { pri: string; count: number }[];
}

export function isTaskOverdue(task: Task, todayStr: string): boolean {
  if (task.status === 'تم الانجاز' || task.status === 'ملغي') return false;
  if (task.status === 'متأخر') return true;
  const targetDate = task.end || task.start;
  return targetDate < todayStr;
}

export function calculateTaskStats(
  tasks: Task[],
  commitments: Commitment[],
  referenceDate: Date = new Date()
): TaskStats {
  const todayStr = referenceDate.toISOString().split('T')[0];
  
  // Calculate start and end of current week (Saturday to Friday in Arab business week)
  const currentDay = referenceDate.getDay(); // 0: Sun, 6: Sat
  const diffToSaturday = (currentDay + 1) % 7; // days since Saturday
  const weekStart = new Date(referenceDate);
  weekStart.setDate(referenceDate.getDate() - diffToSaturday);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const monthPrefix = todayStr.substring(0, 7); // YYYY-MM

  let todayCount = 0;
  let thisWeekCount = 0;
  let thisMonthCount = 0;
  let overdueCount = 0;
  let completedCount = 0;
  let inProgressCount = 0;

  const catMap: Record<string, number> = {};
  const statusMap: Record<string, number> = {};
  const priMap: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };

  tasks.forEach((t) => {
    const tStart = t.start;
    const tEnd = t.end || t.start;

    // Today
    if ((tStart <= todayStr && tEnd >= todayStr) || tStart === todayStr) {
      todayCount++;
    }

    // Week
    if (tStart <= weekEndStr && tEnd >= weekStartStr) {
      thisWeekCount++;
    }

    // Month
    if (tStart.startsWith(monthPrefix) || tEnd.startsWith(monthPrefix)) {
      thisMonthCount++;
    }

    // Overdue
    if (isTaskOverdue(t, todayStr)) {
      overdueCount++;
    }

    // Completed
    if (t.status === 'تم الانجاز') {
      completedCount++;
    }

    // In Progress
    if (t.status === 'قيد التنفيذ') {
      inProgressCount++;
    }

    // Categorization
    catMap[t.cat] = (catMap[t.cat] || 0) + 1;
    statusMap[t.status] = (statusMap[t.status] || 0) + 1;
    if (priMap[t.pri] !== undefined) {
      priMap[t.pri]++;
    }
  });

  // Commitments totals
  let totalCommitmentsAmount = 0;
  let outstandingCommitmentsAmount = 0;
  let paidCommitmentsAmount = 0;

  commitments.forEach((c) => {
    totalCommitmentsAmount += c.amount || 0;
    if (c.status === 'تم الانجاز') {
      paidCommitmentsAmount += c.amount || 0;
    } else if (c.status !== 'ملغي') {
      outstandingCommitmentsAmount += c.amount || 0;
    }
  });

  const categoryDistribution = Object.entries(catMap)
    .map(([cat, count]) => ({ cat, count }))
    .sort((a, b) => b.count - a.count);

  const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({
    status,
    count,
  }));

  const priorityDistribution = Object.entries(priMap).map(([pri, count]) => ({
    pri,
    count,
  }));

  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return {
    today: todayCount,
    thisWeek: thisWeekCount,
    thisMonth: thisMonthCount,
    overdue: overdueCount,
    completed: completedCount,
    inProgress: inProgressCount,
    total: tasks.length,
    totalCommitmentsAmount,
    outstandingCommitmentsAmount,
    paidCommitmentsAmount,
    completionRate,
    categoryDistribution,
    statusDistribution,
    priorityDistribution,
  };
}

export function filterTasks(tasks: Task[], filters: TaskFilterState, todayStr: string): Task[] {
  return tasks.filter((t) => {
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const matchId = t.id.toLowerCase().includes(q);
      const matchSub = t.sub ? t.sub.toLowerCase().includes(q) : false;
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.desc ? t.desc.toLowerCase().includes(q) : false;
      const matchResp = t.resp.toLowerCase().includes(q);
      if (!matchId && !matchSub && !matchTitle && !matchDesc && !matchResp) return false;
    }

    if (filters.cat && t.cat !== filters.cat) return false;
    if (filters.op && t.op !== filters.op) return false;
    if (filters.pri && t.pri !== filters.pri) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.resp && t.resp !== filters.resp) return false;
    if (filters.startDate && (t.end || t.start) < filters.startDate) return false;
    if (filters.endDate && t.start > filters.endDate) return false;
    if (filters.overdueOnly && !isTaskOverdue(t, todayStr)) return false;

    return true;
  });
}

export function getUpcomingTasks(tasks: Task[], count = 8, todayStr: string): Task[] {
  const active = tasks.filter((t) => t.status !== 'تم الانجاز' && t.status !== 'ملغي');
  return active
    .sort((a, b) => {
      const aDate = a.end || a.start;
      const bDate = b.end || b.start;
      return aDate.localeCompare(bDate);
    })
    .slice(0, count);
}

export function generateNextTaskId(tasks: Task[]): string {
  let max = 0;
  tasks.forEach((t) => {
    const num = parseInt(t.id.replace('T-', ''), 10);
    if (!isNaN(num) && num > max) {
      max = num;
    }
  });
  return `T-${String(max + 1).padStart(4, '0')}`;
}

export function generateNextCommitmentId(commitments: Commitment[]): string {
  let max = 0;
  commitments.forEach((c) => {
    const num = parseInt(c.id.replace('التزامات-', ''), 10);
    if (!isNaN(num) && num > max) {
      max = num;
    }
  });
  return `التزامات-${String(max + 1).padStart(3, '0')}`;
}

// FR-34: ICS Calendar Export for Google / Apple / Outlook Calendar (Tasks & Commitments)
export function generateICS(tasks: Task[], commitments: Commitment[] = []): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AlMaha//Tasks & Plans Manager v2.0//AR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:دفتر المهام والالتزامات والخطط - المها',
    'X-WR-TIMEZONE:Asia/Aden',
  ];

  tasks.forEach((t) => {
    const startFormatted = t.start.replace(/-/g, '');
    const endStr = t.end || t.start;
    // For all-day events in ICS, end date is exclusive, so add 1 day
    const endDateObj = new Date(endStr);
    endDateObj.setDate(endDateObj.getDate() + 1);
    const endFormatted = endDateObj.toISOString().split('T')[0].replace(/-/g, '');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${t.id}@almaha-tasks.local`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    lines.push(`DTSTART;VALUE=DATE:${startFormatted}`);
    lines.push(`DTEND;VALUE=DATE:${endFormatted}`);
    lines.push(`SUMMARY:[${t.pri}] ${t.title}`);
    lines.push(`DESCRIPTION:الفئة: ${t.cat} | العملية: ${t.op} | المسؤول: ${t.resp} | الحالة: ${t.status}\\n${t.desc || ''}`);
    lines.push(`CATEGORIES:${t.cat}`);
    lines.push(`STATUS:${t.status === 'تم الانجاز' ? 'COMPLETED' : 'CONFIRMED'}`);
    lines.push('END:VEVENT');
  });

  commitments.forEach((c) => {
    if (!c.due) return;
    const dueFormatted = c.due.replace(/-/g, '');
    const endDateObj = new Date(c.due);
    endDateObj.setDate(endDateObj.getDate() + 1);
    const endFormatted = endDateObj.toISOString().split('T')[0].replace(/-/g, '');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${c.id}@almaha-commitments.local`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    lines.push(`DTSTART;VALUE=DATE:${dueFormatted}`);
    lines.push(`DTEND;VALUE=DATE:${endFormatted}`);
    lines.push(`SUMMARY:[التزام مالي] ${c.name} - ${c.amount} ريال`);
    lines.push(`DESCRIPTION:المبلغ: ${c.amount} ريال | الأهمية: ${c.pri} | الحالة: ${c.status}\\n${c.desc || ''}`);
    lines.push('CATEGORIES:التزامات مالية');
    lines.push(`STATUS:${c.status === 'تم الانجاز' ? 'COMPLETED' : 'CONFIRMED'}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICS(tasks: Task[], commitments: Commitment[] = [], filename = 'almaha_tasks_calendar.ics'): void {
  const icsContent = generateICS(tasks, commitments);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
