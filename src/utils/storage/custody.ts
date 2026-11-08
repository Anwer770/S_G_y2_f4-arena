/**
 * مخزن وحدة «custody» — مُستخرج من storage.ts (R26).
 */
import {
  DEFAULT_CUSTODY_CATEGORIES,
  DEFAULT_CUSTODY_ISSUES_RECORDS,
  DEFAULT_CUSTODY_PRIORITIES,
  DEFAULT_CUSTODY_RESPONSIBLES,
  DEFAULT_CUSTODY_STATUSES,
} from '../../data/defaultCustodyIssues';
import {
  dbStorage,
} from '../../database/dbStorage';
import {
  AuditLog,
  CustodyIssueRecord,
  CustodyKPIs,
} from '../../types';
import {
  STORAGE_KEYS,
} from './keys';

export function loadCustodyIssues(): CustodyIssueRecord[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTODY_RECORDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading custody records:', e);
  }
  return DEFAULT_CUSTODY_ISSUES_RECORDS;
}

export function saveCustodyIssues(records: CustodyIssueRecord[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.CUSTODY_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving custody records:', e);
  }
}

export function loadCustodyCategories(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTODY_CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading custody categories:', e);
  }
  return DEFAULT_CUSTODY_CATEGORIES;
}

export function saveCustodyCategories(categories: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.CUSTODY_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving custody categories:', e);
  }
}

export function loadCustodyResponsibles(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTODY_RESPONSIBLES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading custody responsibles:', e);
  }
  return DEFAULT_CUSTODY_RESPONSIBLES;
}

export function saveCustodyResponsibles(responsibles: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.CUSTODY_RESPONSIBLES, JSON.stringify(responsibles));
  } catch (e) {
    console.error('Error saving custody responsibles:', e);
  }
}

export function loadCustodyStatuses(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTODY_STATUSES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading custody statuses:', e);
  }
  return DEFAULT_CUSTODY_STATUSES;
}

export function saveCustodyStatuses(statuses: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.CUSTODY_STATUSES, JSON.stringify(statuses));
  } catch (e) {
    console.error('Error saving custody statuses:', e);
  }
}

export function loadCustodyPriorities(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTODY_PRIORITIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading custody priorities:', e);
  }
  return DEFAULT_CUSTODY_PRIORITIES;
}

export function saveCustodyPriorities(priorities: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.CUSTODY_PRIORITIES, JSON.stringify(priorities));
  } catch (e) {
    console.error('Error saving custody priorities:', e);
  }
}

export function loadCustodyAuditLogs(): AuditLog[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTODY_AUDIT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading custody audit logs:', e);
  }
  return [];
}

export function saveCustodyAuditLogs(logs: AuditLog[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.CUSTODY_AUDIT, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.error('Error saving custody audit logs:', e);
  }
}

export function logCustodyAudit(action: string, details: string, recordId?: string): void {
  const current = loadCustodyAuditLogs();
  const newLog: AuditLog = {
    id: `LOG-CI-${Date.now()}`,
    timestamp: new Date().toISOString(),
    module: 'عهدة',
    action,
    recordId,
    details,
  };
  saveCustodyAuditLogs([newLog, ...current]);
}

export function calculateCustodyKPIs(records: CustodyIssueRecord[]): CustodyKPIs {
  const total = records.length;
  let custodyCount = 0;
  let issuesCount = 0;
  let completedCount = 0;
  let plannedCount = 0;
  let postponedCount = 0;
  let lateCount = 0;
  let companyCount = 0;
  let cancelledCount = 0;
  let unclassifiedCount = 0;
  let corruptedCount = 0;
  let totalAmountYEM = 0;
  let totalAmountUSD = 0;
  let totalAmountSAR = 0;

  const priorityCounts = { A: 0, B: 0, C: 0, D: 0, check: 0, other: 0 };
  const responsibleCounts: { [resp: string]: number } = {};

  records.forEach((r) => {
    if (r.section === 'custody') custodyCount++;
    else if (r.section === 'issues') issuesCount++;

    const s = (r.status || '').trim();
    if (s === 'مكتمل') completedCount++;
    else if (s === 'مخطط') plannedCount++;
    else if (s === 'مؤجل') postponedCount++;
    else if (s === 'متأخر') lateCount++;
    else if (s === 'شركة') companyCount++;
    else if (s === 'ملغي') cancelledCount++;
    else unclassifiedCount++;

    if (r.isCorruptedReference || (r.desc && r.desc.includes('Schedule!'))) {
      corruptedCount++;
    }

    const p = (r.pri || '').toUpperCase();
    if (p === 'A') priorityCounts.A++;
    else if (p === 'B') priorityCounts.B++;
    else if (p === 'C') priorityCounts.C++;
    else if (p === 'D') priorityCounts.D++;
    else if (p === '√' || p === 'V' || p === 'CHECK') priorityCounts.check++;
    else priorityCounts.other++;

    const resp = (r.resp || 'غير محدد').trim();
    responsibleCounts[resp] = (responsibleCounts[resp] || 0) + 1;

    if (r.amount && r.amount > 0) {
      const cur = r.currency || 'ريال يمني';
      if (cur === 'دولار') totalAmountUSD += r.amount;
      else if (cur === 'ريال سعودي') totalAmountSAR += r.amount;
      else totalAmountYEM += r.amount;
    }
  });

  return {
    total,
    custodyCount,
    issuesCount,
    completedCount,
    plannedCount,
    postponedCount,
    lateCount,
    companyCount,
    cancelledCount,
    unclassifiedCount,
    corruptedCount,
    priorityCounts,
    responsibleCounts,
    totalAmountYEM,
    totalAmountUSD,
    totalAmountSAR,
  };
}

export function resetCustodyToDefault(): void {
  saveCustodyIssues(DEFAULT_CUSTODY_ISSUES_RECORDS);
  saveCustodyCategories(DEFAULT_CUSTODY_CATEGORIES);
  saveCustodyResponsibles(DEFAULT_CUSTODY_RESPONSIBLES);
  saveCustodyStatuses(DEFAULT_CUSTODY_STATUSES);
  saveCustodyPriorities(DEFAULT_CUSTODY_PRIORITIES);
  logCustodyAudit('استعادة', 'تمت استعادة سجلات دفتر العهد والاشكاليات المعلقة إلى الحالة الأصلية (40 سجلاً)');
}
