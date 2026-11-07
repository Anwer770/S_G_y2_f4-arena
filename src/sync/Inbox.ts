import { indexedDBStorage } from '../database/adapters/IndexedDBAdapter';
import { auditService } from '../core/audit/AuditService';
import { ConflictResolver } from './ConflictResolver';

export interface InboxMessage {
  id: string;
  sourceDeviceId: string;
  entity: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  recordId: string;
  payload: any;
  timestamp: number;
  status: 'PENDING' | 'APPLIED' | 'CONFLICT';
}

const INBOX_KEY = 'suite_sync_inbox_v1';

export class Inbox {
  public static receive(message: Omit<InboxMessage, 'id' | 'status'>): InboxMessage {
    const item: InboxMessage = {
      ...message,
      id: `inb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status: 'PENDING',
    };

    const queue = Inbox.getAll();
    queue.push(item);
    indexedDBStorage.setItemSync(INBOX_KEY, queue);

    auditService.log({
      action: 'Sync Conflict',
      entity: message.entity,
      recordId: message.recordId,
      details: `استلام رسالة مزامنة واردة للكيان ${message.entity} من الجهاز ${message.sourceDeviceId}`,
      newValue: message.payload,
    });

    return item;
  }

  public static getAll(): InboxMessage[] {
    const data = indexedDBStorage.getItemSync<InboxMessage[]>(INBOX_KEY);
    return Array.isArray(data) ? data : [];
  }

  public static markApplied(id: string): void {
    const queue = Inbox.getAll().map((m) =>
      m.id === id ? { ...m, status: 'APPLIED' as const } : m
    );
    indexedDBStorage.setItemSync(INBOX_KEY, queue);
  }

  public static clear(): void {
    indexedDBStorage.setItemSync(INBOX_KEY, []);
  }
}
