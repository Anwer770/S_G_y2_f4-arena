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
