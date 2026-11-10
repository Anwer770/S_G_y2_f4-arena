/**
 * نسخ/استرجاع/تصفير شامل (R43) — مُستخرج من `utils/storage.ts`.
 *
 * لماذا ملف مستقل؟ لأن `storage.ts` كان يجمع ثلاثة أدوار: برميل إعادة تصدير،
 * منطق نسخ/استرجاع (~300 سطر)، وتوافق خلفي. الفصل يجعل البرميل برميلاً،
 * والمنطق قابلاً للقراءة — **بلا تغيير أي توقيع أو سلوك**.
 *
 * يستورد وحدات التخزين الشقيقة مباشرةً (لا البرميل) تفادياً للدوران.
 */
import { getLookups as loadLookupsForBackup, setLookups as setLookupsFromBackup } from '../lookupsStore';
import { createObjectRepository } from '../../database/repositories/ObjectRepository';
import { STORAGE_KEYS } from './keys';
import { DEFAULT_COMMITMENTS } from '../../data/defaultCommitments';
import {
  DEFAULT_CUSTODY_CATEGORIES,
  DEFAULT_CUSTODY_ISSUES_RECORDS,
  DEFAULT_CUSTODY_PRIORITIES,
  DEFAULT_CUSTODY_RESPONSIBLES,
  DEFAULT_CUSTODY_STATUSES,
} from '../../data/defaultCustodyIssues';
import {
  CUSTOMER_REGIONS,
  CUSTOMER_RESPONSIBLES,
  CUSTOMER_ROUTES,
  CUSTOMER_SOURCES,
  DEFAULT_CUSTOMERS,
  DEFAULT_CUSTOMER_VISITS,
} from '../../data/defaultCustomers';
import {
  DEFAULT_DOCTORS,
  DEFAULT_DOCTOR_VISITS,
  DOCTOR_REGIONS,
  DOCTOR_RESPONSIBLES,
  DOCTOR_ROUTES,
  DOCTOR_SPECIALTIES,
} from '../../data/defaultDoctors';
import {
  DEFAULT_ACCOUNT_NAMES,
  DEFAULT_CATEGORY_ACCOUNTS,
  DEFAULT_FINANCIAL_TRANSACTIONS,
  DEFAULT_IMPORTANCE_LIST,
  DEFAULT_MOVEMENTS,
  DEFAULT_MOVEMENT_TYPES,
  DEFAULT_RESTRICTIONS,
  DEFAULT_RESTRICTION_ACCOUNTS,
} from '../../data/defaultFinancial';
import {
  DEFAULT_LINKS_RECORDS,
  DEFAULT_LINK_CATEGORIES,
  DEFAULT_LINK_CLASSIFICATIONS,
  DEFAULT_LINK_IMPORTANCES,
  DEFAULT_LINK_TYPES,
} from '../../data/defaultLinks';
import {
  DEFAULT_NOTES,
  DEFAULT_NOTE_FOLDERS,
  DEFAULT_NOTE_TAGS,
  DEFAULT_NOTE_TEMPLATES,
} from '../../data/defaultNotes';
import {
  DEFAULT_CATEGORIES as DEFAULT_STOCK_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_STATUSES as DEFAULT_STOCK_STATUSES,
} from '../../data/defaultProducts';
import { INITIAL_RECORDS } from '../../data/defaultRecords';
import {
  DEFAULT_ROUTINES,
  DEFAULT_ROUTINE_CATEGORIES,
  DEFAULT_ROUTINE_EXECUTIONS,
  DEFAULT_ROUTINE_OCCURRENCES,
  DEFAULT_ROUTINE_SETTINGS,
  DEFAULT_ROUTINE_TAGS,
  DEFAULT_ROUTINE_TEMPLATES,
} from '../../data/defaultRoutines';
import {
  DEFAULT_TASKS,
  TASK_ASSIGNEES,
  TASK_CATEGORIES,
  TASK_OPERATIONS,
  TASK_STATUSES,
} from '../../data/defaultTasks';
import { UnifiedBackupState } from '../../types/index';
import { APP_VERSION } from '../../constants/appMeta';
import { DEBT_CATEGORIES, DEBT_OWNERS } from '../debts/debtCatalogs';
import { DEFAULT_DEBT_COMMITMENTS } from '../debts/debtCommitmentSeeds';
import { DEFAULT_DEBT_RECORDS } from '../debts/debtSeeds';
import {
  loadCustodyCategories,
  loadCustodyIssues,
  loadCustodyPriorities,
  loadCustodyResponsibles,
  loadCustodyStatuses,
  saveCustodyCategories,
  saveCustodyIssues,
  saveCustodyPriorities,
  saveCustodyResponsibles,
  saveCustodyStatuses,
} from './custody';
import {
  loadCustomerAuditLogs,
  loadCustomerRegions,
  loadCustomerResponsibles,
  loadCustomerRoutes,
  loadCustomerSources,
  loadCustomerVisits,
  loadCustomers,
  saveCustomerAuditLogs,
  saveCustomerRegions,
  saveCustomerResponsibles,
  saveCustomerRoutes,
  saveCustomerSources,
  saveCustomerVisits,
  saveCustomers,
} from './customers';
import {
  loadDebtAuditLogs,
  loadDebtCategories,
  loadDebtCommitments,
  loadDebtOwners,
  loadDebts,
  saveDebtAuditLogs,
  saveDebtCategories,
  saveDebtCommitments,
  saveDebtOwners,
  saveDebts,
} from './debts';
import {
  loadDoctorAuditLogs,
  loadDoctorRegions,
  loadDoctorResponsibles,
  loadDoctorRoutes,
  loadDoctorSpecialties,
  loadDoctorVisits,
  loadDoctors,
  saveDoctorAuditLogs,
  saveDoctorRegions,
  saveDoctorResponsibles,
  saveDoctorRoutes,
  saveDoctorSpecialties,
  saveDoctorVisits,
  saveDoctors,
} from './doctors';
import {
  loadFinancialAccountNames,
  loadFinancialCategoryAccounts,
  loadFinancialImportanceList,
  loadFinancialMovementTypes,
  loadFinancialMovements,
  loadFinancialRestrictionAccounts,
  loadFinancialRestrictions,
  loadFinancialTransactions,
  saveFinancialAccountNames,
  saveFinancialCategoryAccounts,
  saveFinancialImportanceList,
  saveFinancialMovementTypes,
  saveFinancialMovements,
  saveFinancialRestrictionAccounts,
  saveFinancialRestrictions,
  saveFinancialTransactions,
} from './financial';
import {
  loadNoteAuditLogs,
  loadNoteFolders,
  loadNoteTags,
  loadNoteTemplates,
  loadNotes,
  saveNoteAuditLogs,
  saveNoteFolders,
  saveNoteTags,
  saveNoteTemplates,
  saveNotes,
} from './knowledge';
import {
  loadLinkCategories,
  loadLinkClassifications,
  loadLinkImportances,
  loadLinkTypes,
  loadLinksRecords,
  saveLinkCategories,
  saveLinkClassifications,
  saveLinkImportances,
  saveLinkTypes,
  saveLinksRecords,
} from './links';
import {
  loadRoutineAuditLogs,
  loadRoutineCategories,
  loadRoutineExceptions,
  loadRoutineExecutions,
  loadRoutineOccurrences,
  loadRoutineSettings,
  loadRoutineTags,
  loadRoutineTemplates,
  loadRoutines,
  saveRoutineAuditLogs,
  saveRoutineCategories,
  saveRoutineExceptions,
  saveRoutineExecutions,
  saveRoutineOccurrences,
  saveRoutineSettings,
  saveRoutineTags,
  saveRoutineTemplates,
  saveRoutines,
} from './routines';
import { DEFAULT_APP_SETTINGS, loadSettings, saveSettings } from './settings';
import {
  DEFAULT_STOCK_SEQ,
  loadProducts,
  loadStockCategories,
  loadStockRecords,
  loadStockSeq,
  loadStockStatuses,
  saveProducts,
  saveStockCategories,
  saveStockRecords,
  saveStockSeq,
  saveStockStatuses,
} from './stock';
import { loadSystemAuditLogs, logSystemAudit, saveSystemAuditLogs } from './system';
import {
  loadCommitments,
  loadTaskAssignees,
  loadTaskAuditLogs,
  loadTaskCategories,
  loadTaskOperations,
  loadTasks,
  saveCommitments,
  saveTaskAssignees,
  saveTaskAuditLogs,
  saveTaskCategories,
  saveTaskOperations,
  saveTasks,
} from './tasks';
import { loadWorkOSData, saveWorkOSData } from '../workos/workosLoaders';

export function getUnifiedBackupState(): UnifiedBackupState {
  return {
    app: 'منظومة الإدارة والمحاسبة والمخزون والمهام وإدارة العملاء وزيارات الأطباء والديون والملاحظات والمعرفة وإدارة الروتين ودفتر العهد ومكتبة الروابط',
    /** R51: كان نصّاً جامداً `'3.2.0'` بينما التطبيق في 3.39 — رقم يكذب في كل ملف يُصدَّر. */
    version: APP_VERSION,
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

/** نسخة الطوارئ الشاملة تُكتب قبل أي مسح كامل — كائن واحد عبر المستودع. */
const unifiedBackupRepo = createObjectRepository<UnifiedBackupState>({
  key: STORAGE_KEYS.UNIFIED_BACKUP,
  defaults: {} as UnifiedBackupState,
  noMerge: true,
});

/**
 * R51 — الجانب المفقود من «نسخة الطوارئ».
 *
 * `clearAllData` كان يكتب لقطة كاملة في `suite_unified_autobackup_v2` ثم يمسح البيانات،
 * **ولا قارئ واحد لهذا المفتاح في التطبيق كله** — أي أن الرسالة التي تُسجَّل في سجل النظام
 * («حفظ نسخة طوارئ مسبقة») كانت تَعِد بما لا يمكن استرجاعه. هذه الدالة تُغلق الحلقة،
 * و`BackupService.restoreEmergencyBackup` يمرّرها عبر التحقّق والاسترجاع القائمين.
 */
export function loadEmergencyBackup(): UnifiedBackupState | null {
  const snapshot = unifiedBackupRepo.read();
  const modules = (snapshot as { modules?: unknown } | null)?.modules;
  if (!modules || typeof modules !== 'object') return null;
  return snapshot;
}

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
