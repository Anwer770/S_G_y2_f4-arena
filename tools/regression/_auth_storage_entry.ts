/** مدخل تجزيء لبوابة تخزين المصادقة (R38): الوحدتان الحقيقيتان داخل DOM وهمي. */
export { dbStorage } from '../../src/database/dbStorage';
export { STORAGE_KEYS } from '../../src/utils/storage/keys';
export { DEFAULT_APP_SETTINGS, loadSettings, saveSettings } from '../../src/utils/storage/settings';
export {
  loadSystemAuditLogs,
  saveSystemAuditLogs,
  logSystemAudit,
  loadAuditLogs,
  saveAuditLogs,
  loadAuthGuardState,
  saveAuthGuardState,
  loadAuthSession,
  saveAuthSession,
  clearAuthSession,
} from '../../src/utils/storage/system';
