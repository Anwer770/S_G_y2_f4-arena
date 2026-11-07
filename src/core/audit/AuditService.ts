import { indexedDBStorage } from '../../database/adapters/IndexedDBAdapter';

export type AuditAction =
  | 'Create'
  | 'Update'
  | 'Delete'
  | 'Payment'
  | 'Receipt'
  | 'Debt Settlement'
  | 'Inventory Adjustment'
  | 'Financial Correction'
  | 'Permission Change'
  | 'Backup'
  | 'Restore'
  | 'Sync Conflict'
  | 'إضافة'
  | 'تعديل'
  | 'حذف'
  | 'استيراد'
  | 'تصدير';

export interface CentralAuditEntry {
  id: string;
  userId: string;
  deviceId: string;
  action: AuditAction | string;
  entity: string;
  recordId?: string;
  timestamp: string;
  details?: string;
  oldValue?: any;
  newValue?: any;
}

const AUDIT_STORAGE_KEY = 'suite_unified_audit_v2';
const MAX_LOGS = 500;

export class CentralAuditService {
  private static instance: CentralAuditService;
  private deviceId: string;

  private constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  public static getInstance(): CentralAuditService {
    if (!CentralAuditService.instance) {
      CentralAuditService.instance = new CentralAuditService();
    }
    return CentralAuditService.instance;
  }

  private getOrCreateDeviceId(): string {
    const KEY = 'suite_device_id_v1';
    let id = indexedDBStorage.getItemSync<string>(KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      indexedDBStorage.setItemSync(KEY, id);
    }
    return id;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public log(entry: Omit<CentralAuditEntry, 'id' | 'timestamp' | 'deviceId' | 'userId'> & { userId?: string }): CentralAuditEntry {
    const fullEntry: CentralAuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      deviceId: this.deviceId,
      userId: entry.userId || 'admin',
      action: entry.action,
      entity: entry.entity,
      recordId: entry.recordId,
      details: entry.details,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
    };

    try {
      const logs = this.getAllLogs();
      const updated = [fullEntry, ...logs].slice(0, MAX_LOGS);
      indexedDBStorage.setItemSync(AUDIT_STORAGE_KEY, updated);
    } catch (e) {
      console.error('AuditService: Failed to record audit log', e);
    }

    return fullEntry;
  }

  public getAllLogs(): CentralAuditEntry[] {
    const logs = indexedDBStorage.getItemSync<CentralAuditEntry[]>(AUDIT_STORAGE_KEY);
    return Array.isArray(logs) ? logs : [];
  }

  public getLogsByEntity(entity: string): CentralAuditEntry[] {
    return this.getAllLogs().filter((l) => l.entity === entity);
  }

  public clearLogs(): void {
    indexedDBStorage.setItemSync(AUDIT_STORAGE_KEY, []);
  }
}

export const auditService = CentralAuditService.getInstance();
