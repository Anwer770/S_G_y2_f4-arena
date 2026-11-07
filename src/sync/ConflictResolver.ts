import { defaultStorage } from '../database/adapters/LocalStorageAdapter';
import { auditService } from '../core/audit/AuditService';

export interface SyncConflict {
  id: string;
  entity: string;
  recordId: string;
  localVersion: any;
  remoteVersion: any;
  strategyUsed: 'LAST_WRITE_WINS' | 'FIELD_LEVEL_MERGE' | 'MANUAL_REQUIRED';
  status: 'RESOLVED' | 'PENDING_MANUAL';
  timestamp: number;
}

const CONFLICTS_KEY = 'suite_sync_conflicts_v1';

// Sensitive entities requiring manual or conservative resolution
const SENSITIVE_ENTITIES = new Set([
  'FinancialTransaction',
  'DebtRecord',
  'DebtPayment',
  'StockMovement',
  'CustodyIssueRecord',
]);

export class ConflictResolver {
  public static resolve(
    entity: string,
    recordId: string,
    localItem: any,
    remoteItem: any
  ): { resolvedItem: any; strategy: string; requiresManual: boolean } {
    const isSensitive = SENSITIVE_ENTITIES.has(entity);

    // If sensitive, flag for manual review
    if (isSensitive) {
      ConflictResolver.recordConflict({
        id: `conf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        entity,
        recordId,
        localVersion: localItem,
        remoteVersion: remoteItem,
        strategyUsed: 'MANUAL_REQUIRED',
        status: 'PENDING_MANUAL',
        timestamp: Date.now(),
      });

      // Keep local by default pending manual review
      return {
        resolvedItem: localItem,
        strategy: 'MANUAL_REQUIRED',
        requiresManual: true,
      };
    }

    // Field-level merge for objects
    if (localItem && remoteItem && typeof localItem === 'object' && typeof remoteItem === 'object') {
      const merged = { ...remoteItem, ...localItem };
      // Preserve latest timestamp
      if (remoteItem.updatedAt && localItem.updatedAt) {
        if (new Date(remoteItem.updatedAt) > new Date(localItem.updatedAt)) {
          return { resolvedItem: remoteItem, strategy: 'LAST_WRITE_WINS', requiresManual: false };
        }
      }
      return { resolvedItem: merged, strategy: 'FIELD_LEVEL_MERGE', requiresManual: false };
    }

    // Default: Last Write Wins
    return {
      resolvedItem: localItem || remoteItem,
      strategy: 'LAST_WRITE_WINS',
      requiresManual: false,
    };
  }

  public static recordConflict(conflict: SyncConflict): void {
    const list = ConflictResolver.getConflicts();
    const updated = [conflict, ...list].slice(0, 100);
    defaultStorage.setItemSync(CONFLICTS_KEY, updated);

    auditService.log({
      action: 'Sync Conflict',
      entity: conflict.entity,
      recordId: conflict.recordId,
      details: `تضارب بيانات في كيان ${conflict.entity} برقم ${conflict.recordId} (${conflict.strategyUsed})`,
      oldValue: conflict.remoteVersion,
      newValue: conflict.localVersion,
    });
  }

  public static getConflicts(): SyncConflict[] {
    const data = defaultStorage.getItemSync<SyncConflict[]>(CONFLICTS_KEY);
    return Array.isArray(data) ? data : [];
  }

  public static resolveManual(conflictId: string, chosenItem: any): void {
    const list = ConflictResolver.getConflicts().map((c) =>
      c.id === conflictId ? { ...c, status: 'RESOLVED' as const, localVersion: chosenItem } : c
    );
    defaultStorage.setItemSync(CONFLICTS_KEY, list);
  }
}
