/**
 * مدخل تجزيء لبوابة المخططات (R33): يُتاح للبوابة تشغيل **محرّك الترحيل الحقيقي**
 * وسجل المخططات الحقيقي ومستودعات الدفاتر الحقيقية داخل DOM وهمي.
 */
export {
  bootSchema,
  runMigrations,
  migrateValue,
  readVersions,
  storedVersion,
  getMigrationReport,
  describeMigrationReport,
  SCHEMA_ENTRIES,
  SCHEMA_VERSIONS,
  BACKUP_SUFFIX,
  SCHEMA_META_KEY,
} from '../../src/database/schema';

export { dbStorage } from '../../src/database/dbStorage';
export { createCollectionRepository } from '../../src/database/repositories/CollectionRepository';
export { createObjectRepository } from '../../src/database/repositories/ObjectRepository';

export {
  loadDebts,
  saveDebts,
  loadDebtCategories,
  saveDebtCategories,
  loadDebtAuditLogs,
  logDebtAudit,
} from '../../src/utils/storage/debts';

export { loadNotes, saveNotes, loadNoteAuditLogs, saveNoteAuditLogs } from '../../src/utils/storage/knowledge';

export { loadTasks, saveTasks, loadTaskAuditLogs, saveTaskAuditLogs } from '../../src/utils/storage/tasks';
export {
  loadCustodyIssues,
  saveCustodyIssues,
  loadCustodyAuditLogs,
  saveCustodyAuditLogs,
} from '../../src/utils/storage/custody';
export { loadLinksRecords, saveLinksRecords } from '../../src/utils/storage/links';

export {
  loadRoutines,
  saveRoutines,
  loadRoutineOccurrences,
  loadRoutineCategories,
  loadRoutineTags,
  loadRoutineTemplates,
  loadRoutineExceptions,
  loadRoutineAuditLogs,
  saveRoutineAuditLogs,
  loadRoutineSettings,
  saveRoutineSettings,
} from '../../src/utils/storage/routines';

export {
  loadCustomers,
  saveCustomers,
  loadCustomerVisits,
  loadCustomerRegions,
  loadCustomerAuditLogs,
  saveCustomerAuditLogs,
} from '../../src/utils/storage/customers';

export {
  loadDoctors,
  saveDoctors,
  loadDoctorVisits,
  loadDoctorSpecialties,
  loadDoctorAuditLogs,
  saveDoctorAuditLogs,
} from '../../src/utils/storage/doctors';

export {
  loadFinancialTransactions,
  saveFinancialTransactions,
  loadFinancialMovements,
  loadFinancialRestrictions,
  loadFinancialMovementTypes,
  loadFinancialImportanceList,
  loadFinancialCategoryAccounts,
  loadFinancialRestrictionAccounts,
  loadFinancialAccountNames,
} from '../../src/utils/storage/financial';

export {
  loadProducts,
  saveProducts,
  loadStockRecords,
  saveStockRecords,
  loadStockCategories,
  loadStockStatuses,
  loadStockSeq,
  saveStockSeq,
  loadSeq,
  saveSeq,
  DEFAULT_STOCK_SEQ,
} from '../../src/utils/storage/stock';

export { loadTasks as loadWorkOSTasks, saveTasksWithoutEvents } from '../../src/utils/workos/workosLoaders';
export { toggleWorkOSTaskCompletion, completeWorkOSTask } from '../../src/services/workos/WorkOSTaskService';

export {
  readAutoConfig,
  saveAutoConfig,
  readAutoState,
  readSnapshots,
  snapshotsSizeKb,
  AUTO_EXPORT_CONFIG_KEY,
  AUTO_EXPORT_STATE_KEY,
  AUTO_EXPORT_SNAPSHOTS_KEY,
  DEFAULT_AUTO_CONFIG,
} from '../../src/services/audit/auditAutoExport';
