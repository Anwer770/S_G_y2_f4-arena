import { dbStorage } from '../database/dbStorage';
import {
  AppSettings,
  AuditLog,
  Commitment,
  Customer,
  CustomerAuditLog,
  CustomerVisitRecord,
  DebtAuditLog,
  DebtCommitment,
  DebtRecord,
  DoctorAuditLog,
  DoctorRecord,
  DoctorVisitLog,
  FinancialTransaction,
  MovementRecord,
  NoteAuditLog,
  NoteFolder,
  NoteRecord,
  NoteTagItem,
  NoteTemplate,
  Product,
  RoutineAuditLog,
  RoutineCategoryItem,
  RoutineException,
  RoutineExecution,
  RoutineModuleSettings,
  RoutineOccurrence,
  RoutineRecord,
  RoutineTagItem,
  RoutineTemplate,
  CustodyIssueRecord,
  CustodyKPIs,
  LinkRecord,
  LinksKPIs,
  Task,
  TaskAuditLog,
  UnifiedBackupState,
} from '../types';
import { loadWorkOSData, saveWorkOSData } from './workosStorage';
import {
  DEFAULT_LINK_CATEGORIES,
  DEFAULT_LINK_CLASSIFICATIONS,
  DEFAULT_LINK_IMPORTANCES,
  DEFAULT_LINK_TYPES,
  DEFAULT_LINKS_RECORDS,
} from '../data/defaultLinks';
import {
  DEFAULT_CATEGORIES as DEFAULT_STOCK_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_STATUSES as DEFAULT_STOCK_STATUSES,
} from '../data/defaultProducts';
import { INITIAL_RECORDS } from '../data/defaultRecords';
import {
  DEFAULT_ACCOUNT_NAMES,
  DEFAULT_CATEGORY_ACCOUNTS,
  DEFAULT_FINANCIAL_TRANSACTIONS,
  DEFAULT_IMPORTANCE_LIST,
  DEFAULT_MOVEMENT_TYPES,
  DEFAULT_MOVEMENTS,
  DEFAULT_RESTRICTION_ACCOUNTS,
  DEFAULT_RESTRICTIONS,
} from '../data/defaultFinancial';
import {
  DEFAULT_TASKS,
  TASK_ASSIGNEES,
  TASK_CATEGORIES,
  TASK_OPERATIONS,
  TASK_STATUSES,
} from '../data/defaultTasks';
import { DEFAULT_COMMITMENTS } from '../data/defaultCommitments';
import {
  CUSTOMER_REGIONS,
  CUSTOMER_RESPONSIBLES,
  CUSTOMER_ROUTES,
  CUSTOMER_SOURCES,
  DEFAULT_CUSTOMER_VISITS,
  DEFAULT_CUSTOMERS,
} from '../data/defaultCustomers';
import {
  DEFAULT_DOCTOR_VISITS,
  DEFAULT_DOCTORS,
  DOCTOR_REGIONS,
  DOCTOR_RESPONSIBLES,
  DOCTOR_ROUTES,
  DOCTOR_SPECIALTIES,
} from '../data/defaultDoctors';
import {
  DEBT_CATEGORIES,
  DEBT_OWNERS,
  DEFAULT_DEBT_COMMITMENTS,
  DEFAULT_DEBT_RECORDS,
} from './debts';
import {
  DEFAULT_NOTE_FOLDERS,
  DEFAULT_NOTE_TAGS,
  DEFAULT_NOTE_TEMPLATES,
  DEFAULT_NOTES,
} from '../data/defaultNotes';
import {
  DEFAULT_ROUTINE_CATEGORIES,
  DEFAULT_ROUTINE_EXECUTIONS,
  DEFAULT_ROUTINE_OCCURRENCES,
  DEFAULT_ROUTINE_SETTINGS,
  DEFAULT_ROUTINE_TAGS,
  DEFAULT_ROUTINE_TEMPLATES,
  DEFAULT_ROUTINES,
} from '../data/defaultRoutines';
import {
  DEFAULT_CUSTODY_CATEGORIES,
  DEFAULT_CUSTODY_ISSUES_RECORDS,
  DEFAULT_CUSTODY_PRIORITIES,
  DEFAULT_CUSTODY_RESPONSIBLES,
  DEFAULT_CUSTODY_STATUSES,
} from '../data/defaultCustodyIssues';
import { getLookups as loadLookupsForBackup, setLookups as setLookupsFromBackup } from './lookupsStore';

// ── إعادة التصدير من الوحدات المفكّكة (R24): كل المستوردين الحاليين يعملون بلا تغيير
import { STORAGE_KEYS } from './storage/keys';
import { DEFAULT_STOCK_SEQ } from './storage/stock';
import { DEFAULT_APP_SETTINGS } from './storage/settings';
import {
  loadProducts,
  saveProducts,
  loadStockRecords,
  saveStockRecords,
  loadStockCategories,
  saveStockCategories,
  loadStockStatuses,
  saveStockStatuses,
  loadStockSeq,
  saveStockSeq,
  loadRecords,
  saveRecords,
  loadCategories,
  saveCategories,
  loadStatuses,
  saveStatuses,
  loadSeq,
  saveSeq,
} from './storage/stock';
import {
  loadFinancialTransactions,
  saveFinancialTransactions,
  loadFinancialMovements,
  saveFinancialMovements,
  loadFinancialRestrictions,
  saveFinancialRestrictions,
  loadFinancialMovementTypes,
  saveFinancialMovementTypes,
  loadFinancialImportanceList,
  saveFinancialImportanceList,
  loadFinancialCategoryAccounts,
  saveFinancialCategoryAccounts,
  loadFinancialRestrictionAccounts,
  saveFinancialRestrictionAccounts,
  loadFinancialAccountNames,
  saveFinancialAccountNames,
} from './storage/financial';
import {
  loadDebts,
  saveDebts,
  loadDebtCommitments,
  saveDebtCommitments,
  loadDebtCategories,
  saveDebtCategories,
  loadDebtOwners,
  saveDebtOwners,
  loadDebtAuditLogs,
  saveDebtAuditLogs,
  logDebtAudit,
} from './storage/debts';
import {
  loadSettings,
  saveSettings,
} from './storage/settings';
export { STORAGE_KEYS, STORAGE_KEY_MANIFEST } from './storage/keys';
export * from './storage/stock';
export * from './storage/financial';
export * from './storage/debts';
export * from './storage/settings';




// ============================================================================
// 1. STOCK STORAGE HANDLERS
// ============================================================================










// ============================================================================
// 2. FINANCIAL STORAGE HANDLERS (دفتر السجل المالي اليومي)
// ============================================================================
















// Backward-compatibility aliases
export function loadFinancialCategories(): string[] {
  return loadFinancialCategoryAccounts();
}
export function saveFinancialCategories(cats: string[]): void {
  saveFinancialCategoryAccounts(cats);
}
export function loadFinancialAccounts(): string[] {
  return loadFinancialAccountNames();
}
export function saveFinancialAccounts(accs: string[]): void {
  saveFinancialAccountNames(accs);
}

// ============================================================================
// 3. TASKS & COMMITMENTS STORAGE HANDLERS (دفتر المها v2.0)
// ============================================================================
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

// ============================================================================
// 4. UNIFIED SETTINGS & SYSTEM LOGS
// ============================================================================


export function loadSystemAuditLogs(): AuditLog[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.SYSTEM_AUDIT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading system logs:', e);
  }
  return [
    {
      id: 'LOG-001',
      timestamp: new Date().toLocaleString('ar-YE'),
      module: 'نظام',
      action: 'تهيئة',
      details: 'تشغيل المنظومة المتكاملة (السجل المالي، دفتر المخزون، ودفتر المهام)',
    },
  ];
}

export function saveSystemAuditLogs(logs: AuditLog[]): void {
  try {
    const trimmed = logs.slice(0, 1000);
    dbStorage.setItem(STORAGE_KEYS.SYSTEM_AUDIT, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving system logs:', e);
  }
}

export function logSystemAudit(
  module: AuditLog['module'],
  action: string,
  details: string,
  recordId?: string
): void {
  const current = loadSystemAuditLogs();
  const newLog: AuditLog = {
    id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    timestamp: new Date().toLocaleString('ar-YE'),
    module,
    action,
    recordId,
    details,
  };
  saveSystemAuditLogs([newLog, ...current]);
}

// Backward compatibility helper
export function logAudit(action: any, details: string, recordId?: string): void {
  logSystemAudit('مخزون', action, details, recordId);
}

export function loadAuditLogs(): AuditLog[] {
  return loadSystemAuditLogs();
}

export function saveAuditLogs(logs: AuditLog[]): void {
  saveSystemAuditLogs(logs);
}









// ============================================================================
// 4. CUSTOMERS & VISITS STORAGE HANDLERS (دفتر إدارة العملاء والزيارات)
// ============================================================================
export function loadCustomers(): Customer[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTOMERS_ITEMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading customers:', e);
  }
  return DEFAULT_CUSTOMERS;
}

export function saveCustomers(customers: Customer[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_ITEMS, JSON.stringify(customers));
  } catch (e) {
    console.error('Error saving customers:', e);
  }
}

export function loadCustomerVisits(): CustomerVisitRecord[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTOMERS_VISITS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading customer visits:', e);
  }
  return DEFAULT_CUSTOMER_VISITS;
}

export function saveCustomerVisits(visits: CustomerVisitRecord[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_VISITS, JSON.stringify(visits));
  } catch (e) {
    console.error('Error saving customer visits:', e);
  }
}

export function loadCustomerSources(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTOMERS_SOURCES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading customer sources:', e);
  }
  return CUSTOMER_SOURCES;
}

export function saveCustomerSources(sources: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_SOURCES, JSON.stringify(sources));
  } catch (e) {
    console.error('Error saving customer sources:', e);
  }
}

export function loadCustomerRegions(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTOMERS_REGIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading customer regions:', e);
  }
  return CUSTOMER_REGIONS;
}

export function saveCustomerRegions(regions: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_REGIONS, JSON.stringify(regions));
  } catch (e) {
    console.error('Error saving customer regions:', e);
  }
}

export function loadCustomerRoutes(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTOMERS_ROUTES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading customer routes:', e);
  }
  return CUSTOMER_ROUTES;
}

export function saveCustomerRoutes(routes: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_ROUTES, JSON.stringify(routes));
  } catch (e) {
    console.error('Error saving customer routes:', e);
  }
}

export function loadCustomerResponsibles(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTOMERS_RESPONSIBLES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading customer responsibles:', e);
  }
  return CUSTOMER_RESPONSIBLES;
}

export function saveCustomerResponsibles(responsibles: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_RESPONSIBLES, JSON.stringify(responsibles));
  } catch (e) {
    console.error('Error saving customer responsibles:', e);
  }
}

export function loadCustomerAuditLogs(): CustomerAuditLog[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTOMERS_AUDIT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading customer audit logs:', e);
  }
  return [
    {
      id: 'LOG-CUST-1',
      time: new Date().toLocaleString('ar-YE'),
      action: 'استيراد',
      customerName: 'قاعدة بيانات العملاء',
      details: 'تم استيراد قاعدة بيانات 623 عميل ومسارات الزيارات بنجاح',
    },
  ];
}

export function saveCustomerAuditLogs(logs: CustomerAuditLog[]): void {
  try {
    const trimmed = logs.slice(0, 500);
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_AUDIT, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving customer audit logs:', e);
  }
}

export function logCustomerAudit(
  action: CustomerAuditLog['action'],
  customerName: string,
  details: string
): void {
  const current = loadCustomerAuditLogs();
  const newLog: CustomerAuditLog = {
    id: `LOG-C-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    time: new Date().toLocaleString('ar-YE'),
    action,
    customerName,
    details,
  };
  saveCustomerAuditLogs([newLog, ...current]);
}

// ============================================================================
// 5. DOCTORS & MEDICAL VISITS STORAGE HANDLERS (دفتر إدارة زيارات الأطباء)
// ============================================================================
export function loadDoctors(): DoctorRecord[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DOCTORS_ITEMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading doctors:', e);
  }
  return DEFAULT_DOCTORS;
}

export function saveDoctors(doctors: DoctorRecord[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_ITEMS, JSON.stringify(doctors));
  } catch (e) {
    console.error('Error saving doctors:', e);
  }
}

export function loadDoctorVisits(): DoctorVisitLog[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DOCTORS_VISITS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading doctor visits:', e);
  }
  return DEFAULT_DOCTOR_VISITS;
}

export function saveDoctorVisits(visits: DoctorVisitLog[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_VISITS, JSON.stringify(visits));
  } catch (e) {
    console.error('Error saving doctor visits:', e);
  }
}

export function loadDoctorRegions(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DOCTORS_REGIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading doctor regions:', e);
  }
  return DOCTOR_REGIONS;
}

export function saveDoctorRegions(regions: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_REGIONS, JSON.stringify(regions));
  } catch (e) {
    console.error('Error saving doctor regions:', e);
  }
}

export function loadDoctorRoutes(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DOCTORS_ROUTES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading doctor routes:', e);
  }
  return DOCTOR_ROUTES;
}

export function saveDoctorRoutes(routes: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_ROUTES, JSON.stringify(routes));
  } catch (e) {
    console.error('Error saving doctor routes:', e);
  }
}

export function loadDoctorResponsibles(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DOCTORS_RESPONSIBLES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading doctor responsibles:', e);
  }
  return DOCTOR_RESPONSIBLES;
}

export function saveDoctorResponsibles(responsibles: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_RESPONSIBLES, JSON.stringify(responsibles));
  } catch (e) {
    console.error('Error saving doctor responsibles:', e);
  }
}

export function loadDoctorSpecialties(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DOCTORS_SPECIALTIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading doctor specialties:', e);
  }
  return DOCTOR_SPECIALTIES;
}

export function saveDoctorSpecialties(specialties: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_SPECIALTIES, JSON.stringify(specialties));
  } catch (e) {
    console.error('Error saving doctor specialties:', e);
  }
}

export function loadDoctorAuditLogs(): DoctorAuditLog[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DOCTORS_AUDIT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading doctor audit logs:', e);
  }
  return [
    {
      id: 'LOG-DOC-1',
      time: new Date().toLocaleString('ar-YE'),
      action: 'استيراد',
      doctorName: 'قاعدة بيانات الأطباء',
      details: 'تم تهيئة دفتر إدارة زيارات الأطباء ومسارات الزيارات بنجاح',
    },
  ];
}

export function saveDoctorAuditLogs(logs: DoctorAuditLog[]): void {
  try {
    const trimmed = logs.slice(0, 500);
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_AUDIT, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving doctor audit logs:', e);
  }
}

export function logDoctorAudit(
  action: DoctorAuditLog['action'],
  doctorName: string,
  details: string
): void {
  const current = loadDoctorAuditLogs();
  const newLog: DoctorAuditLog = {
    id: `LOG-D-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    time: new Date().toLocaleString('ar-YE'),
    action,
    doctorName,
    details,
  };
  saveDoctorAuditLogs([newLog, ...current]);
}

// ============================================================================
// 6. DEBTS & COMMITMENTS STORAGE HANDLERS (دفتر الدين والالتزامات)
// ============================================================================











// ============================================================================
// 7. NOTES & KNOWLEDGE MANAGEMENT (إدارة الملاحظات والمعرفة - NKM v1.0)
// ============================================================================
export function loadNotes(): NoteRecord[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.KNOWLEDGE_NOTES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading notes:', e);
  }
  return DEFAULT_NOTES;
}

export function saveNotes(notes: NoteRecord[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.KNOWLEDGE_NOTES, JSON.stringify(notes));
  } catch (e) {
    console.error('Error saving notes:', e);
  }
}

export function loadNoteFolders(): NoteFolder[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.KNOWLEDGE_FOLDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading note folders:', e);
  }
  return DEFAULT_NOTE_FOLDERS;
}

export function saveNoteFolders(folders: NoteFolder[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.KNOWLEDGE_FOLDERS, JSON.stringify(folders));
  } catch (e) {
    console.error('Error saving note folders:', e);
  }
}

export function loadNoteTags(): NoteTagItem[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.KNOWLEDGE_TAGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading note tags:', e);
  }
  return DEFAULT_NOTE_TAGS;
}

export function saveNoteTags(tags: NoteTagItem[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.KNOWLEDGE_TAGS, JSON.stringify(tags));
  } catch (e) {
    console.error('Error saving note tags:', e);
  }
}

export function loadNoteTemplates(): NoteTemplate[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.KNOWLEDGE_TEMPLATES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading note templates:', e);
  }
  return DEFAULT_NOTE_TEMPLATES;
}

export function saveNoteTemplates(templates: NoteTemplate[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.KNOWLEDGE_TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error('Error saving note templates:', e);
  }
}

export function loadNoteAuditLogs(): NoteAuditLog[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.KNOWLEDGE_AUDIT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading note audit logs:', e);
  }
  return [
    {
      id: 'LOG-NOTE-1',
      time: new Date().toLocaleString('ar-YE'),
      action: 'استيراد',
      entity: 'نظام',
      title: 'إدارة الملاحظات والمعرفة',
      details: 'تمت تهيئة قاعدة المعرفة والملاحظات والقوالب والمجلدات الافتراضية بنجاح',
    },
  ];
}

export function saveNoteAuditLogs(logs: NoteAuditLog[]): void {
  try {
    const trimmed = logs.slice(0, 500);
    dbStorage.setItem(STORAGE_KEYS.KNOWLEDGE_AUDIT, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving note audit logs:', e);
  }
}

export function logNoteAudit(
  action: NoteAuditLog['action'],
  entity: NoteAuditLog['entity'],
  title: string,
  details: string
): void {
  const current = loadNoteAuditLogs();
  const newLog: NoteAuditLog = {
    id: `LOG-NT-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    time: new Date().toLocaleString('ar-YE'),
    action,
    entity,
    title,
    details,
  };
  saveNoteAuditLogs([newLog, ...current]);
}

// ============================================================================
// 8. ROUTINE & HABIT STORAGE HANDLERS (وحدة إدارة الروتين والعادات v1.0)
// ============================================================================
export function loadRoutines(): RoutineRecord[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ROUTINES_ITEMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading routines:', e);
  }
  return DEFAULT_ROUTINES;
}

export function saveRoutines(routines: RoutineRecord[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_ITEMS, JSON.stringify(routines));
  } catch (e) {
    console.error('Error saving routines:', e);
  }
}

export function loadRoutineOccurrences(): RoutineOccurrence[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ROUTINES_OCCURRENCES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading routine occurrences:', e);
  }
  return DEFAULT_ROUTINE_OCCURRENCES;
}

export function saveRoutineOccurrences(occurrences: RoutineOccurrence[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_OCCURRENCES, JSON.stringify(occurrences));
  } catch (e) {
    console.error('Error saving routine occurrences:', e);
  }
}

export function loadRoutineExecutions(): RoutineExecution[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ROUTINES_EXECUTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading routine executions:', e);
  }
  return DEFAULT_ROUTINE_EXECUTIONS;
}

export function saveRoutineExecutions(executions: RoutineExecution[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_EXECUTIONS, JSON.stringify(executions));
  } catch (e) {
    console.error('Error saving routine executions:', e);
  }
}

export function loadRoutineCategories(): RoutineCategoryItem[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ROUTINES_CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading routine categories:', e);
  }
  return DEFAULT_ROUTINE_CATEGORIES;
}

export function saveRoutineCategories(categories: RoutineCategoryItem[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving routine categories:', e);
  }
}

export function loadRoutineTags(): RoutineTagItem[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ROUTINES_TAGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading routine tags:', e);
  }
  return DEFAULT_ROUTINE_TAGS;
}

export function saveRoutineTags(tags: RoutineTagItem[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_TAGS, JSON.stringify(tags));
  } catch (e) {
    console.error('Error saving routine tags:', e);
  }
}

export function loadRoutineTemplates(): RoutineTemplate[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ROUTINES_TEMPLATES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading routine templates:', e);
  }
  return DEFAULT_ROUTINE_TEMPLATES;
}

export function saveRoutineTemplates(templates: RoutineTemplate[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error('Error saving routine templates:', e);
  }
}

export function loadRoutineExceptions(): RoutineException[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ROUTINES_EXCEPTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading routine exceptions:', e);
  }
  return [];
}

export function saveRoutineExceptions(exceptions: RoutineException[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_EXCEPTIONS, JSON.stringify(exceptions));
  } catch (e) {
    console.error('Error saving routine exceptions:', e);
  }
}

export function loadRoutineAuditLogs(): RoutineAuditLog[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ROUTINES_AUDIT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading routine audit logs:', e);
  }
  return [
    {
      id: 'LOG-ROUTINE-1',
      timestamp: new Date().toISOString(),
      action: 'تهيئة',
      routineName: 'وحدة إدارة الروتين',
      details: 'تمت تهيئة وحدة إدارة الروتين والعادات والجدولة مع النماذج الافتراضية بنجاح',
    },
  ];
}

export function saveRoutineAuditLogs(logs: RoutineAuditLog[]): void {
  try {
    const trimmed = logs.slice(0, 500);
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_AUDIT, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving routine audit logs:', e);
  }
}

export function logRoutineAudit(
  action: string,
  routineName: string,
  details: string,
  routineId?: string
): void {
  const current = loadRoutineAuditLogs();
  const newLog: RoutineAuditLog = {
    id: `LOG-RTN-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    timestamp: new Date().toISOString(),
    action,
    routineId,
    routineName,
    details,
  };
  saveRoutineAuditLogs([newLog, ...current]);
}

export function loadRoutineSettings(): RoutineModuleSettings {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ROUTINES_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return { ...DEFAULT_ROUTINE_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Error loading routine settings:', e);
  }
  return DEFAULT_ROUTINE_SETTINGS;
}

export function saveRoutineSettings(settings: RoutineModuleSettings): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving routine settings:', e);
  }
}

// ============================================================================
// 8. CUSTODY & PENDING ISSUES STORAGE HANDLERS (دفتر العهد والاشكاليات المعلقة v1.0)
// ============================================================================
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

// ============================================================================
// 9. SMART LINKS LIBRARY STORAGE HANDLERS (مكتبة الروابط الذكية)
// ============================================================================
export function loadLinksRecords(): LinkRecord[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.LINKS_RECORDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading links records:', e);
  }
  return DEFAULT_LINKS_RECORDS;
}

export function saveLinksRecords(records: LinkRecord[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.LINKS_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving links records:', e);
  }
}

export function loadLinkClassifications(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.LINKS_CLASSIFICATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading link classifications:', e);
  }
  return DEFAULT_LINK_CLASSIFICATIONS;
}

export function saveLinkClassifications(classifications: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.LINKS_CLASSIFICATIONS, JSON.stringify(classifications));
  } catch (e) {
    console.error('Error saving link classifications:', e);
  }
}

export function loadLinkCategories(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.LINKS_CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading link categories:', e);
  }
  return DEFAULT_LINK_CATEGORIES;
}

export function saveLinkCategories(categories: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.LINKS_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving link categories:', e);
  }
}

export function loadLinkTypes(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.LINKS_TYPES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading link types:', e);
  }
  return DEFAULT_LINK_TYPES;
}

export function saveLinkTypes(types: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.LINKS_TYPES, JSON.stringify(types));
  } catch (e) {
    console.error('Error saving link types:', e);
  }
}

export function loadLinkImportances(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.LINKS_IMPORTANCES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading link importances:', e);
  }
  return DEFAULT_LINK_IMPORTANCES;
}

export function saveLinkImportances(importances: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.LINKS_IMPORTANCES, JSON.stringify(importances));
  } catch (e) {
    console.error('Error saving link importances:', e);
  }
}

export function calculateLinksKPIs(records: LinkRecord[]): LinksKPIs {
  const total = records.length;
  let favoritesCount = 0;
  let aiCount = 0;
  let officeCount = 0;
  let socialCount = 0;
  let securityCount = 0;

  const importanceCounts = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    other: 0,
  };

  const typeCounts: { [type: string]: number } = {};
  const classificationCounts: { [cls: string]: number } = {};
  const categoryCounts: { [cat: string]: number } = {};

  records.forEach((r) => {
    if (r.isFavorite) favoritesCount++;

    const cls = r.classification || '';
    const cat = r.category || '';
    const typ = r.type || '';
    const imp = (r.importance || '').toUpperCase();

    // AI detection
    if (
      cls.includes('ذكاء') ||
      cls.includes('كلود') ||
      cls.includes('جيمنايل') ||
      cls.includes('ديب سيك') ||
      cls.includes('جي بي تي') ||
      r.siteName.toLowerCase().includes('ai') ||
      r.siteName.toLowerCase().includes('gpt')
    ) {
      aiCount++;
    }

    // Office detection
    if (cls.includes('اوفس') || cls.includes('شيت') || cls.includes('اكسل') || cls.includes('ورد')) {
      officeCount++;
    }

    // Social detection
    if (typ === 'فيسبوك' || typ === 'الانستجرام' || typ === 'تلجرام' || cls.includes('تواصل')) {
      socialCount++;
    }

    // Security detection
    if (cls.includes('حماية') || cls.includes('سيبراني') || cls.includes('امان')) {
      securityCount++;
    }

    // Importance
    if (imp === 'A') importanceCounts.A++;
    else if (imp === 'B') importanceCounts.B++;
    else if (imp === 'C') importanceCounts.C++;
    else if (imp === 'D') importanceCounts.D++;
    else importanceCounts.other++;

    // Counters
    typeCounts[typ] = (typeCounts[typ] || 0) + 1;
    classificationCounts[cls] = (classificationCounts[cls] || 0) + 1;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  return {
    total,
    favoritesCount,
    aiCount,
    officeCount,
    socialCount,
    securityCount,
    importanceCounts,
    typeCounts,
    classificationCounts,
    categoryCounts,
  };
}

export function resetLinksToDefault(): void {
  saveLinksRecords(DEFAULT_LINKS_RECORDS);
  saveLinkClassifications(DEFAULT_LINK_CLASSIFICATIONS);
  saveLinkCategories(DEFAULT_LINK_CATEGORIES);
  saveLinkTypes(DEFAULT_LINK_TYPES);
  saveLinkImportances(DEFAULT_LINK_IMPORTANCES);
  logSystemAudit('روابط', 'استعادة', 'تمت استعادة مكتبة الروابط الذكية إلى حالتها الأولية (+50 رابط)');
}

// ============================================================================
// 10. UNIFIED BACKUP, RESTORE & RESET
// ============================================================================
export function getUnifiedBackupState(): UnifiedBackupState {
  return {
    app: 'منظومة الإدارة والمحاسبة والمخزون والمهام وإدارة العملاء وزيارات الأطباء والديون والملاحظات والمعرفة وإدارة الروتين ودفتر العهد ومكتبة الروابط',
    version: '3.2.0',
    exportedAt: new Date().toISOString(),
    checksum: `CHK-${Date.now().toString(36).toUpperCase()}`,
    modules: {
      stock: {
        products: loadProducts(),
        records: loadStockRecords(),
        categories: loadStockCategories(),
        statuses: loadStockStatuses(),
        seq: loadStockSeq(),
      },
      custody: {
        records: loadCustodyIssues(),
        categories: loadCustodyCategories(),
        responsibles: loadCustodyResponsibles(),
        statuses: loadCustodyStatuses(),
        priorities: loadCustodyPriorities(),
      },
      links: {
        records: loadLinksRecords(),
        classifications: loadLinkClassifications(),
        categories: loadLinkCategories(),
        types: loadLinkTypes(),
        importances: loadLinkImportances(),
      },
      financial: {
        transactions: loadFinancialTransactions(),
        movements: loadFinancialMovements(),
        restrictions: loadFinancialRestrictions(),
        movementTypes: loadFinancialMovementTypes(),
        importanceList: loadFinancialImportanceList(),
        categoryAccounts: loadFinancialCategoryAccounts(),
        restrictionAccounts: loadFinancialRestrictionAccounts(),
        accountNames: loadFinancialAccountNames(),
      },
      tasks: {
        tasks: loadTasks(),
        commitments: loadCommitments(),
        categories: loadTaskCategories(),
        operations: loadTaskOperations(),
        priorities: ['A', 'B', 'C', 'D'],
        statuses: Array.from(TASK_STATUSES),
        assignees: loadTaskAssignees(),
        auditLogs: loadTaskAuditLogs(),
      },
      customers: {
        customers: loadCustomers(),
        visits: loadCustomerVisits(),
        sources: loadCustomerSources(),
        regions: loadCustomerRegions(),
        routes: loadCustomerRoutes(),
        responsibles: loadCustomerResponsibles(),
        auditLogs: loadCustomerAuditLogs(),
      },
      doctors: {
        doctors: loadDoctors(),
        visits: loadDoctorVisits(),
        regions: loadDoctorRegions(),
        routes: loadDoctorRoutes(),
        responsibles: loadDoctorResponsibles(),
        specialties: loadDoctorSpecialties(),
        auditLogs: loadDoctorAuditLogs(),
      },
      debts: {
        records: loadDebts(),
        commitments: loadDebtCommitments(),
        categories: loadDebtCategories(),
        owners: loadDebtOwners(),
        auditLogs: loadDebtAuditLogs(),
      },
      knowledge: {
        notes: loadNotes(),
        folders: loadNoteFolders(),
        tags: loadNoteTags(),
        templates: loadNoteTemplates(),
        auditLogs: loadNoteAuditLogs(),
      },
      routines: {
        routines: loadRoutines(),
        occurrences: loadRoutineOccurrences(),
        executions: loadRoutineExecutions(),
        categories: loadRoutineCategories(),
        tags: loadRoutineTags(),
        templates: loadRoutineTemplates(),
        exceptions: loadRoutineExceptions(),
        auditLogs: loadRoutineAuditLogs(),
        settings: loadRoutineSettings(),
      },
      workos: loadWorkOSData(),
      lookups: loadLookupsForBackup(),
      settings: loadSettings(),
      systemLogs: loadSystemAuditLogs(),
    },
  };
}

export function restoreUnifiedBackupState(backup: UnifiedBackupState): void {
  try {
    const lookups = (backup.modules as { lookups?: unknown }).lookups;
    if (lookups) setLookupsFromBackup(lookups);
  } catch (err) {
    console.warn('restore lookups failed', err);
  }

  if (backup.modules.stock) {
    if (backup.modules.stock.products) saveProducts(backup.modules.stock.products);
    if (backup.modules.stock.records) saveStockRecords(backup.modules.stock.records);
    if (backup.modules.stock.categories) saveStockCategories(backup.modules.stock.categories);
    if (backup.modules.stock.statuses) saveStockStatuses(backup.modules.stock.statuses);
    if (backup.modules.stock.seq) saveStockSeq(backup.modules.stock.seq);
  }

  if (backup.modules.custody) {
    if (backup.modules.custody.records) saveCustodyIssues(backup.modules.custody.records);
    if (backup.modules.custody.categories) saveCustodyCategories(backup.modules.custody.categories);
    if (backup.modules.custody.responsibles) saveCustodyResponsibles(backup.modules.custody.responsibles);
    if (backup.modules.custody.statuses) saveCustodyStatuses(backup.modules.custody.statuses);
    if (backup.modules.custody.priorities) saveCustodyPriorities(backup.modules.custody.priorities);
  }

  if (backup.modules.links) {
    if (backup.modules.links.records) saveLinksRecords(backup.modules.links.records);
    if (backup.modules.links.classifications) saveLinkClassifications(backup.modules.links.classifications);
    if (backup.modules.links.categories) saveLinkCategories(backup.modules.links.categories);
    if (backup.modules.links.types) saveLinkTypes(backup.modules.links.types);
    if (backup.modules.links.importances) saveLinkImportances(backup.modules.links.importances);
  }

  if (backup.modules.financial) {
    if (backup.modules.financial.transactions) saveFinancialTransactions(backup.modules.financial.transactions);
    if (backup.modules.financial.movements) saveFinancialMovements(backup.modules.financial.movements);
    if (backup.modules.financial.restrictions) saveFinancialRestrictions(backup.modules.financial.restrictions);
    if (backup.modules.financial.movementTypes) saveFinancialMovementTypes(backup.modules.financial.movementTypes);
    if (backup.modules.financial.importanceList) saveFinancialImportanceList(backup.modules.financial.importanceList);
    if (backup.modules.financial.categoryAccounts) saveFinancialCategoryAccounts(backup.modules.financial.categoryAccounts);
    if (backup.modules.financial.restrictionAccounts) saveFinancialRestrictionAccounts(backup.modules.financial.restrictionAccounts);
    if (backup.modules.financial.accountNames) saveFinancialAccountNames(backup.modules.financial.accountNames);
  }

  if (backup.modules.tasks) {
    if (backup.modules.tasks.tasks) saveTasks(backup.modules.tasks.tasks);
    if (backup.modules.tasks.commitments) saveCommitments(backup.modules.tasks.commitments);
    if (backup.modules.tasks.categories) saveTaskCategories(backup.modules.tasks.categories);
    if (backup.modules.tasks.operations) saveTaskOperations(backup.modules.tasks.operations);
    if (backup.modules.tasks.assignees) saveTaskAssignees(backup.modules.tasks.assignees);
    if (backup.modules.tasks.auditLogs) saveTaskAuditLogs(backup.modules.tasks.auditLogs);
  }

  if (backup.modules.customers) {
    if (backup.modules.customers.customers) saveCustomers(backup.modules.customers.customers);
    if (backup.modules.customers.visits) saveCustomerVisits(backup.modules.customers.visits);
    if (backup.modules.customers.sources) saveCustomerSources(backup.modules.customers.sources);
    if (backup.modules.customers.regions) saveCustomerRegions(backup.modules.customers.regions);
    if (backup.modules.customers.routes) saveCustomerRoutes(backup.modules.customers.routes);
    if (backup.modules.customers.responsibles) saveCustomerResponsibles(backup.modules.customers.responsibles);
    if (backup.modules.customers.auditLogs) saveCustomerAuditLogs(backup.modules.customers.auditLogs);
  }

  if (backup.modules.doctors) {
    if (backup.modules.doctors.doctors) saveDoctors(backup.modules.doctors.doctors);
    if (backup.modules.doctors.visits) saveDoctorVisits(backup.modules.doctors.visits);
    if (backup.modules.doctors.regions) saveDoctorRegions(backup.modules.doctors.regions);
    if (backup.modules.doctors.routes) saveDoctorRoutes(backup.modules.doctors.routes);
    if (backup.modules.doctors.responsibles) saveDoctorResponsibles(backup.modules.doctors.responsibles);
    if (backup.modules.doctors.specialties) saveDoctorSpecialties(backup.modules.doctors.specialties);
    if (backup.modules.doctors.auditLogs) saveDoctorAuditLogs(backup.modules.doctors.auditLogs);
  }

  if (backup.modules.debts) {
    if (backup.modules.debts.records) saveDebts(backup.modules.debts.records);
    if (backup.modules.debts.commitments) saveDebtCommitments(backup.modules.debts.commitments);
    if (backup.modules.debts.categories) saveDebtCategories(backup.modules.debts.categories);
    if (backup.modules.debts.owners) saveDebtOwners(backup.modules.debts.owners);
    if (backup.modules.debts.auditLogs) saveDebtAuditLogs(backup.modules.debts.auditLogs);
  }

  if (backup.modules.knowledge) {
    if (backup.modules.knowledge.notes) saveNotes(backup.modules.knowledge.notes);
    if (backup.modules.knowledge.folders) saveNoteFolders(backup.modules.knowledge.folders);
    if (backup.modules.knowledge.tags) saveNoteTags(backup.modules.knowledge.tags);
    if (backup.modules.knowledge.templates) saveNoteTemplates(backup.modules.knowledge.templates);
    if (backup.modules.knowledge.auditLogs) saveNoteAuditLogs(backup.modules.knowledge.auditLogs);
  }

  if (backup.modules.routines) {
    if (backup.modules.routines.routines) saveRoutines(backup.modules.routines.routines);
    if (backup.modules.routines.occurrences) saveRoutineOccurrences(backup.modules.routines.occurrences);
    if (backup.modules.routines.executions) saveRoutineExecutions(backup.modules.routines.executions);
    if (backup.modules.routines.categories) saveRoutineCategories(backup.modules.routines.categories);
    if (backup.modules.routines.tags) saveRoutineTags(backup.modules.routines.tags);
    if (backup.modules.routines.templates) saveRoutineTemplates(backup.modules.routines.templates);
    if (backup.modules.routines.exceptions) saveRoutineExceptions(backup.modules.routines.exceptions);
    if (backup.modules.routines.auditLogs) saveRoutineAuditLogs(backup.modules.routines.auditLogs);
    if (backup.modules.routines.settings) saveRoutineSettings(backup.modules.routines.settings);
  }

  if (backup.modules.workos) {
    saveWorkOSData(backup.modules.workos);
  }

  if (backup.modules.settings) saveSettings(backup.modules.settings);
  if (backup.modules.systemLogs) saveSystemAuditLogs(backup.modules.systemLogs);

  logSystemAudit('نظام', 'استرجاع', 'تم استرجاع النسخة الاحتياطية الشاملة لكافة الدفاتر بما فيها وحدة إدارة العمل بنجاح');
}

export function restoreDefaultData(): void {
  // Stock
  saveProducts(DEFAULT_PRODUCTS);
  saveStockRecords(INITIAL_RECORDS);
  saveStockCategories(DEFAULT_STOCK_CATEGORIES);
  saveStockStatuses(DEFAULT_STOCK_STATUSES);
  saveStockSeq(DEFAULT_STOCK_SEQ);

  // Financial
  saveFinancialTransactions(DEFAULT_FINANCIAL_TRANSACTIONS);
  saveFinancialMovements(DEFAULT_MOVEMENTS);
  saveFinancialRestrictions(DEFAULT_RESTRICTIONS);
  saveFinancialMovementTypes(DEFAULT_MOVEMENT_TYPES);
  saveFinancialImportanceList(DEFAULT_IMPORTANCE_LIST);
  saveFinancialCategoryAccounts(DEFAULT_CATEGORY_ACCOUNTS);
  saveFinancialRestrictionAccounts(DEFAULT_RESTRICTION_ACCOUNTS);
  saveFinancialAccountNames(DEFAULT_ACCOUNT_NAMES);

  // Tasks
  saveTasks(DEFAULT_TASKS);
  saveCommitments(DEFAULT_COMMITMENTS);
  saveTaskCategories(TASK_CATEGORIES);
  saveTaskOperations(TASK_OPERATIONS);
  saveTaskAssignees(TASK_ASSIGNEES);

  // Customers & Visits
  saveCustomers(DEFAULT_CUSTOMERS);
  saveCustomerVisits(DEFAULT_CUSTOMER_VISITS);
  saveCustomerSources(CUSTOMER_SOURCES);
  saveCustomerRegions(CUSTOMER_REGIONS);
  saveCustomerRoutes(CUSTOMER_ROUTES);
  saveCustomerResponsibles(CUSTOMER_RESPONSIBLES);

  // Doctors & Medical Visits
  saveDoctors(DEFAULT_DOCTORS);
  saveDoctorVisits(DEFAULT_DOCTOR_VISITS);
  saveDoctorRegions(DOCTOR_REGIONS);
  saveDoctorRoutes(DOCTOR_ROUTES);
  saveDoctorResponsibles(DOCTOR_RESPONSIBLES);
  saveDoctorSpecialties(DOCTOR_SPECIALTIES);

  // Debts & Commitments
  saveDebts(DEFAULT_DEBT_RECORDS);
  saveDebtCommitments(DEFAULT_DEBT_COMMITMENTS);
  saveDebtCategories(DEBT_CATEGORIES);
  saveDebtOwners(DEBT_OWNERS);

  // Knowledge & Notes
  saveNotes(DEFAULT_NOTES);
  saveNoteFolders(DEFAULT_NOTE_FOLDERS);
  saveNoteTags(DEFAULT_NOTE_TAGS);
  saveNoteTemplates(DEFAULT_NOTE_TEMPLATES);

  // Routines
  saveRoutines(DEFAULT_ROUTINES);
  saveRoutineOccurrences(DEFAULT_ROUTINE_OCCURRENCES);
  saveRoutineExecutions(DEFAULT_ROUTINE_EXECUTIONS);
  saveRoutineCategories(DEFAULT_ROUTINE_CATEGORIES);
  saveRoutineTags(DEFAULT_ROUTINE_TAGS);
  saveRoutineTemplates(DEFAULT_ROUTINE_TEMPLATES);
  saveRoutineExceptions([]);
  saveRoutineSettings(DEFAULT_ROUTINE_SETTINGS);

  // Custody & Issues (دفتر العهد والاشكاليات المعلقة)
  saveCustodyIssues(DEFAULT_CUSTODY_ISSUES_RECORDS);
  saveCustodyCategories(DEFAULT_CUSTODY_CATEGORIES);
  saveCustodyResponsibles(DEFAULT_CUSTODY_RESPONSIBLES);
  saveCustodyStatuses(DEFAULT_CUSTODY_STATUSES);
  saveCustodyPriorities(DEFAULT_CUSTODY_PRIORITIES);

  // Smart Links Library (مكتبة الروابط الذكية)
  saveLinksRecords(DEFAULT_LINKS_RECORDS);
  saveLinkClassifications(DEFAULT_LINK_CLASSIFICATIONS);
  saveLinkCategories(DEFAULT_LINK_CATEGORIES);
  saveLinkTypes(DEFAULT_LINK_TYPES);
  saveLinkImportances(DEFAULT_LINK_IMPORTANCES);

  // Settings
  saveSettings(DEFAULT_APP_SETTINGS);

  logSystemAudit('نظام', 'استرجاع', 'تمت استعادة بيانات الأساس الأولية لكافة الوحدات (المالي، المخزون، المهام، العملاء، الأطباء، الديون، الملاحظات، الروتين، دفتر العهد، ومكتبة الروابط)');
}

export const createUnifiedBackup = getUnifiedBackupState;
export const restoreUnifiedBackup = restoreUnifiedBackupState;
export const resetAllModuleData = restoreDefaultData;

export function clearAllData(): void {
  // Save safety snapshot
  const snapshot = getUnifiedBackupState();
  dbStorage.setItem(STORAGE_KEYS.UNIFIED_BACKUP, JSON.stringify(snapshot));

  saveStockRecords([]);
  saveStockSeq({ IN: 1, OUT: 1 });
  saveFinancialTransactions([]);
  saveTasks([]);
  saveCommitments([]);
  saveCustomers([]);
  saveCustomerVisits([]);
  saveDoctors([]);
  saveDoctorVisits([]);
  saveDebts([]);
  saveDebtCommitments([]);
  saveNotes([]);
  saveRoutines([]);
  saveRoutineOccurrences([]);
  saveRoutineExecutions([]);
  saveCustodyIssues([]);
  saveLinksRecords([]);

  logSystemAudit('نظام', 'مسح', 'تم تصفير سجلات البيانات مع حفظ نسخة طوارئ مسبقة');
}

export { dbStorage } from '../database/dbStorage';
export function getStorageEngineStats() {
  return dbStorage.getStats();
}

