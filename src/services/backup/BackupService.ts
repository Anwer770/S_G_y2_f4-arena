import { createUnifiedBackup, restoreUnifiedBackup, resetAllModuleData } from '../../utils/storage';
import { UnifiedBackupState } from '../../types';
import { auditService } from '../../core/audit/AuditService';

export class BackupService {
  public static createBackup(): UnifiedBackupState {
    const backup = createUnifiedBackup();
    auditService.log({
      action: 'Backup',
      entity: 'SystemBackup',
      details: `تم إنشاء نسخة احتياطية موحدة شاملة لكافة وحدات النظام (الإصدار: ${backup.version})`,
    });
    return backup;
  }

  public static validateBackup(backup: any): { valid: boolean; reason?: string } {
    if (!backup || typeof backup !== 'object') {
      return { valid: false, reason: 'الملف غير صالح أو ليس بتنسيق JSON صحيح' };
    }
    if (!backup.modules || typeof backup.modules !== 'object') {
      return { valid: false, reason: 'الملف لا يحتوي على كائن وحدات النظام (modules)' };
    }
    return { valid: true };
  }

  public static restoreBackup(backup: UnifiedBackupState): boolean {
    try {
      const validation = this.validateBackup(backup);
      if (!validation.valid) {
        console.error('BackupService: Validation error:', validation.reason);
        return false;
      }
      // Safety auto-snapshot before restoring
      this.createBackup();

      restoreUnifiedBackup(backup);
      auditService.log({
        action: 'Restore',
        entity: 'SystemBackup',
        details: `تم استرجاع النسخة الاحتياطية بنجاح المؤرخة في: ${backup.exportedAt || new Date().toISOString()}`,
      });
      return true;
    } catch (e) {
      console.error('BackupService: Restore failed', e);
      return false;
    }
  }

  public static resetSystem(): void {
    resetAllModuleData();
    auditService.log({
      action: 'Delete',
      entity: 'SystemReset',
      details: 'تمت إعادة ضبط وتهيئة بيانات النظام بالكامل إلى الحالة الافتراضية',
    });
  }
}
