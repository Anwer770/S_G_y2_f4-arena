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

const STORAGE_KEYS = {
  // Stock
  STOCK_PRODUCTS: 'suite_stock_products_v2',
  STOCK_RECORDS: 'suite_stock_records_v2',
  STOCK_CATEGORIES: 'suite_stock_categories_v2',
  STOCK_STATUSES: 'suite_stock_statuses_v2',
  STOCK_SEQ: 'suite_stock_seq_v2',

  // Financial (دفتر السجل المالي اليومي)
  FIN_TRANSACTIONS: 'suite_fin_transactions_v2',
  FIN_MOVEMENTS: 'suite_fin_movements_v2',
  FIN_RESTRICTIONS: 'suite_fin_restrictions_v2',
  FIN_MOVEMENT_TYPES: 'suite_fin_movement_types_v2',
  FIN_IMPORTANCE: 'suite_fin_importance_v2',
  FIN_CATEGORY_ACCOUNTS: 'suite_fin_category_accounts_v2',
  FIN_RESTRICTION_ACCOUNTS: 'suite_fin_restriction_accounts_v2',
  FIN_ACCOUNT_NAMES: 'suite_fin_account_names_v2',

  // Custody & Issues (دفتر العهد والاشكاليات المعلقة v1.0)
  CUSTODY_RECORDS: 'suite_custody_records_v1',
  CUSTODY_CATEGORIES: 'suite_custody_categories_v1',
  CUSTODY_RESPONSIBLES: 'suite_custody_responsibles_v1',
  CUSTODY_STATUSES: 'suite_custody_statuses_v1',
  CUSTODY_PRIORITIES: 'suite_custody_priorities_v1',
  CUSTODY_AUDIT: 'suite_custody_audit_v1',

  // Tasks & Commitments (دفتر المها v2.0)
  TASKS_ITEMS: 'suite_tasks_items_v2',
  TASKS_COMMITMENTS: 'suite_tasks_commitments_v2',
  TASKS_CATEGORIES: 'suite_tasks_categories_v2',
  TASKS_OPERATIONS: 'suite_tasks_operations_v2',
  TASKS_ASSIGNEES: 'suite_tasks_assignees_v2',
  TASKS_AUDIT: 'suite_tasks_audit_v2',

  // Customers & Visits (دفتر إدارة العملاء والزيارات - القيصر الذهبي)
  CUSTOMERS_ITEMS: 'suite_customers_items_v2',
  CUSTOMERS_VISITS: 'suite_customers_visits_v2',
  CUSTOMERS_SOURCES: 'suite_customers_sources_v2',
  CUSTOMERS_REGIONS: 'suite_customers_regions_v2',
  CUSTOMERS_ROUTES: 'suite_customers_routes_v2',
  CUSTOMERS_RESPONSIBLES: 'suite_customers_responsibles_v2',
  CUSTOMERS_AUDIT: 'suite_customers_audit_v2',

  // Doctors & Medical Visits (دفتر إدارة زيارات الأطباء)
  DOCTORS_ITEMS: 'suite_doctors_items_v1',
  DOCTORS_VISITS: 'suite_doctors_visits_v1',
  DOCTORS_REGIONS: 'suite_doctors_regions_v1',
  DOCTORS_ROUTES: 'suite_doctors_routes_v1',
  DOCTORS_RESPONSIBLES: 'suite_doctors_responsibles_v1',
  DOCTORS_SPECIALTIES: 'suite_doctors_specialties_v1',
  DOCTORS_AUDIT: 'suite_doctors_audit_v1',

  // Debts & Commitments Ledger (دفتر الدين والالتزامات)
  DEBTS_RECORDS: 'suite_debts_records_v1',
  DEBTS_COMMITMENTS: 'suite_debts_commitments_v1',
  DEBTS_CATEGORIES: 'suite_debts_categories_v1',
  DEBTS_OWNERS: 'suite_debts_owners_v1',
  DEBTS_AUDIT: 'suite_debts_audit_v1',

  // Notes & Knowledge Management (إدارة الملاحظات والمعرفة - NKM v1.0)
  KNOWLEDGE_NOTES: 'suite_knowledge_notes_v1',
  KNOWLEDGE_FOLDERS: 'suite_knowledge_folders_v1',
  KNOWLEDGE_TAGS: 'suite_knowledge_tags_v1',
  KNOWLEDGE_TEMPLATES: 'suite_knowledge_templates_v1',
  KNOWLEDGE_AUDIT: 'suite_knowledge_audit_v1',

  // Routines & Habit Management (وحدة إدارة الروتين والعادات v1.0)
  ROUTINES_ITEMS: 'suite_routines_items_v1',
  ROUTINES_OCCURRENCES: 'suite_routines_occurrences_v1',
  ROUTINES_EXECUTIONS: 'suite_routines_executions_v1',
  ROUTINES_CATEGORIES: 'suite_routines_categories_v1',
  ROUTINES_TAGS: 'suite_routines_tags_v1',
  ROUTINES_TEMPLATES: 'suite_routines_templates_v1',
  ROUTINES_EXCEPTIONS: 'suite_routines_exceptions_v1',
  ROUTINES_AUDIT: 'suite_routines_audit_v1',
  ROUTINES_SETTINGS: 'suite_routines_settings_v1',

  // Smart Links Library (مكتبة الروابط الذكية v1.0)
  LINKS_RECORDS: 'suite_links_records_v1',
  LINKS_CLASSIFICATIONS: 'suite_links_classifications_v1',
  LINKS_CATEGORIES: 'suite_links_categories_v1',
  LINKS_TYPES: 'suite_links_types_v1',
  LINKS_IMPORTANCES: 'suite_links_importances_v1',

  // System Unified
  SETTINGS: 'suite_unified_settings_v2',
  SYSTEM_AUDIT: 'suite_unified_audit_v2',
  UNIFIED_BACKUP: 'suite_unified_autobackup_v2',
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  defaultYear: 2024,
  skipCancelled: true,
  defaultCurrency: 'ريال',
  enableNotifications: true,
};

export const DEFAULT_STOCK_SEQ = {
  IN: 4,
  OUT: 299,
};

// ============================================================================
// 1. STOCK STORAGE HANDLERS
// ============================================================================
export function loadProducts(): Product[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.STOCK_PRODUCTS) || dbStorage.getItem('stock_ledger_products_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading products:', e);
  }
  return DEFAULT_PRODUCTS;
}

export function saveProducts(products: Product[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.STOCK_PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products:', e);
  }
}

export function loadStockRecords(): MovementRecord[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.STOCK_RECORDS) || dbStorage.getItem('stock_ledger_records_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading stock records:', e);
  }
  return INITIAL_RECORDS;
}

export function saveStockRecords(records: MovementRecord[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.STOCK_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving stock records:', e);
  }
}

export function loadStockCategories(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.STOCK_CATEGORIES) || dbStorage.getItem('stock_ledger_categories_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading stock categories:', e);
  }
  return DEFAULT_STOCK_CATEGORIES;
}

export function saveStockCategories(cats: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.STOCK_CATEGORIES, JSON.stringify(cats));
  } catch (e) {
    console.error('Error saving stock categories:', e);
  }
}

export function loadStockStatuses(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.STOCK_STATUSES) || dbStorage.getItem('stock_ledger_statuses_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading stock statuses:', e);
  }
  return DEFAULT_STOCK_STATUSES;
}

export function saveStockStatuses(stats: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.STOCK_STATUSES, JSON.stringify(stats));
  } catch (e) {
    console.error('Error saving stock statuses:', e);
  }
}

export function loadStockSeq(): { IN: number; OUT: number } {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.STOCK_SEQ) || dbStorage.getItem('stock_ledger_seq_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.IN === 'number' && typeof parsed.OUT === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading stock seq:', e);
  }
  return DEFAULT_STOCK_SEQ;
}

export function saveStockSeq(seq: { IN: number; OUT: number }): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.STOCK_SEQ, JSON.stringify(seq));
  } catch (e) {
    console.error('Error saving stock seq:', e);
  }
}

// ============================================================================
// 2. FINANCIAL STORAGE HANDLERS (دفتر السجل المالي اليومي)
// ============================================================================
export function loadFinancialTransactions(): FinancialTransaction[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.FIN_TRANSACTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading financial transactions:', e);
  }
  return DEFAULT_FINANCIAL_TRANSACTIONS;
}

export function saveFinancialTransactions(txns: FinancialTransaction[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.FIN_TRANSACTIONS, JSON.stringify(txns));
  } catch (e) {
    console.error('Error saving financial transactions:', e);
  }
}

export function loadFinancialMovements(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.FIN_MOVEMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading financial movements:', e);
  }
  return DEFAULT_MOVEMENTS;
}

export function saveFinancialMovements(list: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.FIN_MOVEMENTS, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving financial movements:', e);
  }
}

export function loadFinancialRestrictions(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.FIN_RESTRICTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading financial restrictions:', e);
  }
  return DEFAULT_RESTRICTIONS;
}

export function saveFinancialRestrictions(list: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.FIN_RESTRICTIONS, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving financial restrictions:', e);
  }
}

export function loadFinancialMovementTypes(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.FIN_MOVEMENT_TYPES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading financial movement types:', e);
  }
  return DEFAULT_MOVEMENT_TYPES;
}

export function saveFinancialMovementTypes(list: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.FIN_MOVEMENT_TYPES, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving financial movement types:', e);
  }
}

export function loadFinancialImportanceList(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.FIN_IMPORTANCE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading financial importance list:', e);
  }
  return DEFAULT_IMPORTANCE_LIST;
}

export function saveFinancialImportanceList(list: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.FIN_IMPORTANCE, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving financial importance list:', e);
  }
}

export function loadFinancialCategoryAccounts(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.FIN_CATEGORY_ACCOUNTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading financial category accounts:', e);
  }
  return DEFAULT_CATEGORY_ACCOUNTS;
}

export function saveFinancialCategoryAccounts(list: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.FIN_CATEGORY_ACCOUNTS, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving financial category accounts:', e);
  }
}

export function loadFinancialRestrictionAccounts(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.FIN_RESTRICTION_ACCOUNTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading financial restriction accounts:', e);
  }
  return DEFAULT_RESTRICTION_ACCOUNTS;
}

export function saveFinancialRestrictionAccounts(list: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.FIN_RESTRICTION_ACCOUNTS, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving financial restriction accounts:', e);
  }
}

export function loadFinancialAccountNames(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.FIN_ACCOUNT_NAMES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading financial account names:', e);
  }
  return DEFAULT_ACCOUNT_NAMES;
}

export function saveFinancialAccountNames(list: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.FIN_ACCOUNT_NAMES, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving financial account names:', e);
  }
}

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
export function loadSettings(): AppSettings {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.defaultYear === 'number') {
        return { ...DEFAULT_APP_SETTINGS, ...parsed };
      }
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }
  return DEFAULT_APP_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

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

export function loadRecords(): MovementRecord[] {
  return loadStockRecords();
}

export function saveRecords(records: MovementRecord[]): void {
  saveStockRecords(records);
}

export function loadCategories(): string[] {
  return loadStockCategories();
}

export function saveCategories(cats: string[]): void {
  saveStockCategories(cats);
}

export function loadStatuses(): string[] {
  return loadStockStatuses();
}

export function saveStatuses(stats: string[]): void {
  saveStockStatuses(stats);
}

export function loadSeq(): { IN: number; OUT: number } {
  return loadStockSeq();
}

export function saveSeq(seq: { IN: number; OUT: number }): void {
  saveStockSeq(seq);
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
export function loadDebts(): DebtRecord[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DEBTS_RECORDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading debt records:', e);
  }
  return DEFAULT_DEBT_RECORDS;
}

export function saveDebts(records: DebtRecord[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DEBTS_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving debt records:', e);
  }
}

export function loadDebtCommitments(): DebtCommitment[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DEBTS_COMMITMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading debt commitments:', e);
  }
  return DEFAULT_DEBT_COMMITMENTS;
}

export function saveDebtCommitments(commitments: DebtCommitment[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DEBTS_COMMITMENTS, JSON.stringify(commitments));
  } catch (e) {
    console.error('Error saving debt commitments:', e);
  }
}

export function loadDebtCategories(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DEBTS_CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading debt categories:', e);
  }
  return DEBT_CATEGORIES;
}

export function saveDebtCategories(categories: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DEBTS_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving debt categories:', e);
  }
}

export function loadDebtOwners(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DEBTS_OWNERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading debt owners:', e);
  }
  return DEBT_OWNERS;
}

export function saveDebtOwners(owners: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DEBTS_OWNERS, JSON.stringify(owners));
  } catch (e) {
    console.error('Error saving debt owners:', e);
  }
}

export function loadDebtAuditLogs(): DebtAuditLog[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DEBTS_AUDIT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading debt audit logs:', e);
  }
  return [
    {
      id: 'LOG-DEBT-1',
      time: new Date().toLocaleString('ar-YE'),
      action: 'استيراد',
      entity: 'دفتر',
      title: 'دفتر الدين والالتزامات',
      details: 'تمت تهيئة دفاتر الدين الأربعة وسجل الالتزامات بنجاح وفق وثيقة PRD',
    },
  ];
}

export function saveDebtAuditLogs(logs: DebtAuditLog[]): void {
  try {
    const trimmed = logs.slice(0, 500);
    dbStorage.setItem(STORAGE_KEYS.DEBTS_AUDIT, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving debt audit logs:', e);
  }
}

export function logDebtAudit(
  action: DebtAuditLog['action'],
  entity: DebtAuditLog['entity'],
  title: string,
  details: string
): void {
  const current = loadDebtAuditLogs();
  const newLog: DebtAuditLog = {
    id: `LOG-DBT-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    time: new Date().toLocaleString('ar-YE'),
    action,
    entity,
    title,
    details,
  };
  saveDebtAuditLogs([newLog, ...current]);
}

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
      settings: loadSettings(),
      systemLogs: loadSystemAuditLogs(),
    },
  };
}

export function restoreUnifiedBackupState(backup: UnifiedBackupState): void {
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

