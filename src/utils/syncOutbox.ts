import { dbStorage } from '../database/dbStorage';
import { broadcastDataChange } from './multiTabSync';

export type OutboxEntity =
  | 'financial'
  | 'stock'
  | 'customer'
  | 'doctor'
  | 'debt'
  | 'custody'
  | 'task'
  | 'settings';

export type OutboxAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface SyncOutboxEntry {
  id: string; // e.g. "outbox_1727221234567_abc"
  entity: OutboxEntity;
  action: OutboxAction;
  entityId: string;
  payload?: any;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  error?: string;
}

const OUTBOX_STORAGE_KEY = 'primo_sync_outbox_v1';

export function loadSyncOutbox(): SyncOutboxEntry[] {
  try {
    const raw = dbStorage.getItem(OUTBOX_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to load sync outbox:', e);
    return [];
  }
}

export function saveSyncOutbox(entries: SyncOutboxEntry[]): void {
  try {
    // Keep max 2000 entries in local history
    const trimmed = entries.slice(-2000);
    dbStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(trimmed));
    broadcastDataChange('OUTBOX_UPDATED', { pendingCount: trimmed.filter((e) => e.status === 'pending').length });
  } catch (e) {
    console.error('Failed to save sync outbox:', e);
  }
}

/**
 * Record a mutation for cloud sync
 */
export function recordOutboxMutation(
  entity: OutboxEntity,
  action: OutboxAction,
  entityId: string,
  payload?: any
): SyncOutboxEntry {
  const entries = loadSyncOutbox();
  const newEntry: SyncOutboxEntry = {
    id: `outbox_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    entity,
    action,
    entityId,
    payload,
    timestamp: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
  };

  const updated = [...entries, newEntry];
  saveSyncOutbox(updated);
  return newEntry;
}

export function getPendingOutboxEntries(): SyncOutboxEntry[] {
  return loadSyncOutbox().filter((e) => e.status === 'pending');
}

export function getPendingOutboxCount(): number {
  return loadSyncOutbox().filter((e) => e.status === 'pending').length;
}

export function markOutboxItemSynced(id: string): void {
  const entries = loadSyncOutbox();
  const updated = entries.map((e) => (e.id === id ? { ...e, status: 'synced' as const } : e));
  saveSyncOutbox(updated);
}

export function markAllOutboxSynced(): void {
  const entries = loadSyncOutbox();
  const updated = entries.map((e) => ({ ...e, status: 'synced' as const }));
  saveSyncOutbox(updated);
}

export function clearSyncedOutbox(): void {
  const entries = loadSyncOutbox();
  const pendingOnly = entries.filter((e) => e.status !== 'synced');
  saveSyncOutbox(pendingOnly);
}

export function getOutboxStats(): {
  total: number;
  pending: number;
  synced: number;
  failed: number;
  lastMutation?: string;
} {
  const entries = loadSyncOutbox();
  const pending = entries.filter((e) => e.status === 'pending').length;
  const synced = entries.filter((e) => e.status === 'synced').length;
  const failed = entries.filter((e) => e.status === 'failed').length;
  const lastMutation = entries.length > 0 ? entries[entries.length - 1].timestamp : undefined;

  return {
    total: entries.length,
    pending,
    synced,
    failed,
    lastMutation,
  };
}
