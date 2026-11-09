import { dbStorage } from '../database/dbStorage';
import { createObjectRepository } from '../database/repositories/ObjectRepository';
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
import { DEFAULT_TASKS, TASK_ASSIGNEES, TASK_CATEGORIES, TASK_OPERATIONS, TASK_STATUSES } from '../data/defaultTasks';
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
import { DEBT_CATEGORIES, DEBT_OWNERS, DEFAULT_DEBT_COMMITMENTS, DEFAULT_DEBT_RECORDS } from './debts';
import { DEFAULT_NOTE_FOLDERS, DEFAULT_NOTE_TAGS, DEFAULT_NOTE_TEMPLATES, DEFAULT_NOTES } from '../data/defaultNotes';
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
import { loadSettings, saveSettings } from './storage/settings';
/**
 * نسخة الطوارئ الشاملة (R42): تُكتب قبل أي مسح كامل. كائن واحد عبر المستودع.
 */
const unifiedBackupRepo = createObjectRepository<UnifiedBackupState>({
  key: STORAGE_KEYS.UNIFIED_BACKUP,
  defaults: {} as UnifiedBackupState,
  noMerge: true,
});

export { STORAGE_KEYS, STORAGE_KEY_MANIFEST } from './storage/keys';
export * from './storage/stock';
export * from './storage/financial';
export * from './storage/debts';
import {
  loadTasks,
  saveTasks,
  loadCommitments,
  saveCommitments,
  loadTaskCategories,
  saveTaskCategories,
  loadTaskOperations,
  saveTaskOperations,
  loadTaskAssignees,
  saveTaskAssignees,
  loadTaskAuditLogs,
  saveTaskAuditLogs,
  logTaskAudit,
} from './storage/tasks';
import {
  loadCustomers,
  saveCustomers,
  loadCustomerVisits,
  saveCustomerVisits,
  loadCustomerSources,
  saveCustomerSources,
  loadCustomerRegions,
  saveCustomerRegions,
  loadCustomerRoutes,
  saveCustomerRoutes,
  loadCustomerResponsibles,
  saveCustomerResponsibles,
  loadCustomerAuditLogs,
  saveCustomerAuditLogs,
  logCustomerAudit,
} from './storage/customers';
import {
  loadDoctors,
  saveDoctors,
  loadDoctorVisits,
  saveDoctorVisits,
  loadDoctorRegions,
  saveDoctorRegions,
  loadDoctorRoutes,
  saveDoctorRoutes,
  loadDoctorResponsibles,
  saveDoctorResponsibles,
  loadDoctorSpecialties,
  saveDoctorSpecialties,
  loadDoctorAuditLogs,
  saveDoctorAuditLogs,
  logDoctorAudit,
} from './storage/doctors';
import {
  loadNotes,
  saveNotes,
  loadNoteFolders,
  saveNoteFolders,
  loadNoteTags,
  saveNoteTags,
  loadNoteTemplates,
  saveNoteTemplates,
  loadNoteAuditLogs,
  saveNoteAuditLogs,
  logNoteAudit,
} from './storage/knowledge';
import {
  loadRoutines,
  saveRoutines,
  loadRoutineOccurrences,
  saveRoutineOccurrences,
  loadRoutineExecutions,
  saveRoutineExecutions,
  loadRoutineCategories,
  saveRoutineCategories,
  loadRoutineTags,
  saveRoutineTags,
  loadRoutineTemplates,
  saveRoutineTemplates,
  loadRoutineExceptions,
  saveRoutineExceptions,
  loadRoutineAuditLogs,
  saveRoutineAuditLogs,
  logRoutineAudit,
  loadRoutineSettings,
  saveRoutineSettings,
} from './storage/routines';
import {
  loadCustodyIssues,
  saveCustodyIssues,
  loadCustodyCategories,
  saveCustodyCategories,
  loadCustodyResponsibles,
  saveCustodyResponsibles,
  loadCustodyStatuses,
  saveCustodyStatuses,
  loadCustodyPriorities,
  saveCustodyPriorities,
  loadCustodyAuditLogs,
  saveCustodyAuditLogs,
  logCustodyAudit,
  calculateCustodyKPIs,
  resetCustodyToDefault,
} from './storage/custody';
import {
  loadLinksRecords,
  saveLinksRecords,
  loadLinkClassifications,
  saveLinkClassifications,
  loadLinkCategories,
  saveLinkCategories,
  loadLinkTypes,
  saveLinkTypes,
  loadLinkImportances,
  saveLinkImportances,
  calculateLinksKPIs,
  resetLinksToDefault,
} from './storage/links';
import {
  loadSystemAuditLogs,
  saveSystemAuditLogs,
  logSystemAudit,
  logAudit,
  loadAuditLogs,
  saveAuditLogs,
} from './storage/system';
export * from './storage/settings';
export * from './storage/tasks';
export * from './storage/customers';
export * from './storage/doctors';
export * from './storage/knowledge';
export * from './storage/routines';
export * from './storage/custody';
export * from './storage/links';
export * from './storage/system';

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

// ============================================================================
// 4. UNIFIED SETTINGS & SYSTEM LOGS
// ============================================================================

// Backward compatibility helper

// ============================================================================
// 4. CUSTOMERS & VISITS STORAGE HANDLERS (دفتر إدارة العملاء والزيارات)
// ============================================================================

// ============================================================================
// 5. DOCTORS & MEDICAL VISITS STORAGE HANDLERS (دفتر إدارة زيارات الأطباء)
// ============================================================================

// ============================================================================
// 6. DEBTS & COMMITMENTS STORAGE HANDLERS (دفتر الدين والالتزامات)
// ============================================================================

// ============================================================================
// 7. NOTES & KNOWLEDGE MANAGEMENT (إدارة الملاحظات والمعرفة - NKM v1.0)
// ============================================================================

// ============================================================================
// 8. ROUTINE & HABIT STORAGE HANDLERS (وحدة إدارة الروتين والعادات v1.0)
// ============================================================================

// ============================================================================
// 8. CUSTODY & PENDING ISSUES STORAGE HANDLERS (دفتر العهد والاشكاليات المعلقة v1.0)
// ============================================================================

// ============================================================================
// 9. SMART LINKS LIBRARY STORAGE HANDLERS (مكتبة الروابط الذكية)
// ============================================================================

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
    if (backup.modules.financial.categoryAccounts)
      saveFinancialCategoryAccounts(backup.modules.financial.categoryAccounts);
    if (backup.modules.financial.restrictionAccounts)
      saveFinancialRestrictionAccounts(backup.modules.financial.restrictionAccounts);
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

  logSystemAudit(
    'نظام',
    'استرجاع',
    'تم استرجاع النسخة الاحتياطية الشاملة لكافة الدفاتر بما فيها وحدة إدارة العمل بنجاح'
  );
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

  logSystemAudit(
    'نظام',
    'استرجاع',
    'تمت استعادة بيانات الأساس الأولية لكافة الوحدات (المالي، المخزون، المهام، العملاء، الأطباء، الديون، الملاحظات، الروتين، دفتر العهد، ومكتبة الروابط)'
  );
}

export const createUnifiedBackup = getUnifiedBackupState;
export const restoreUnifiedBackup = restoreUnifiedBackupState;
export const resetAllModuleData = restoreDefaultData;

export function clearAllData(): void {
  // Save safety snapshot
  const snapshot = getUnifiedBackupState();
  unifiedBackupRepo.write(snapshot);

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
