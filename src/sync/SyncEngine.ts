import { Outbox, OutboxMutation } from './Outbox';
import { ConflictResolver } from './ConflictResolver';
import { auditService } from '../core/audit/AuditService';
import { indexedDBStorage } from '../database/adapters/IndexedDBAdapter';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTimestamp: number | null;
  pendingCount: number;
  conflictsCount: number;
}

const SYNC_STATE_KEY = 'suite_sync_state_v1';

export class SyncEngine {
  private static instance: SyncEngine;
  private isSyncing: boolean = false;
  private listeners: Array<(status: SyncStatus) => void> = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  private handleNetworkChange(online: boolean): void {
    this.notifyListeners();
    if (online) {
      this.syncNow();
    }
  }

  public getStatus(): SyncStatus {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const pendingCount = Outbox.count();
    const conflicts = ConflictResolver.getConflicts().filter((c) => c.status === 'PENDING_MANUAL');
    const lastSync = indexedDBStorage.getItemSync<number>(SYNC_STATE_KEY);

    return {
      isOnline,
      isSyncing: this.isSyncing,
      lastSyncTimestamp: lastSync || null,
      pendingCount,
      conflictsCount: conflicts.length,
    };
  }

  public subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach((l) => l(status));
  }

  public async syncNow(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0 };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();

    let synced = 0;
    let failed = 0;

    try {
      const queue = Outbox.getAll();
      for (const mutation of queue) {
        try {
          // Simulated cloud sync endpoint or future backend connector
          // When backend is present, this invokes the remote API
          await this.processMutation(mutation);
          Outbox.remove(mutation.id);
          synced++;
        } catch {
          Outbox.markFailed(mutation.id);
          failed++;
        }
      }

      indexedDBStorage.setItemSync(SYNC_STATE_KEY, Date.now());
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return { synced, failed };
  }

  private async processMutation(mutation: OutboxMutation): Promise<void> {
    // Contract point for real cloud persistence
    // Emulates local confirmation
    return new Promise((resolve) => setTimeout(resolve, 50));
  }
}

export const syncEngine = SyncEngine.getInstance();
