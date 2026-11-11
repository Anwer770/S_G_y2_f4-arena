import { auditService } from '../core/audit/AuditService';
import { Outbox, OUTBOX_MAX_ENTRIES, type OutboxMutation, type OutboxMutationInput } from '../sync/Outbox';
import { createCollectionRepository } from '../database/repositories/CollectionRepository';
import { broadcastDataChange } from './multiTabSync';

export type OutboxEntity = 'financial' | 'stock' | 'customer' | 'doctor' | 'debt' | 'custody' | 'task' | 'settings';

export type OutboxAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface SyncOutboxEntry {
  id: string;
  entity: OutboxEntity;
  action: OutboxAction;
  entityId: string;
  payload?: unknown;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  error?: string;
}

export interface SyncOutboxMutationInput {
  entity: OutboxEntity;
  action: OutboxAction;
  entityId: string;
  payload?: unknown;
}

/** المفتاح القديم للواجهة السابقة؛ يُنقل مرةً صراحة إلى مصدر الحقيقة الموحد. */
export const LEGACY_SYNC_OUTBOX_STORAGE_KEY = 'primo_sync_outbox_v1';

const legacyOutboxRepo = createCollectionRepository<SyncOutboxEntry>({
  key: LEGACY_SYNC_OUTBOX_STORAGE_KEY,
  fallback: [],
});

const toCanonical = (entry: SyncOutboxEntry): OutboxMutation => {
  const timestamp = Date.parse(entry.timestamp);
  return {
    id: entry.id,
    deviceId: auditService.getDeviceId(),
    entity: entry.entity,
    operation: entry.action,
    recordId: entry.entityId,
    payload: entry.payload,
    timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
    retryCount: Number.isFinite(entry.retryCount) && entry.retryCount > 0 ? entry.retryCount : 0,
    status: entry.status === 'synced' ? 'RESOLVED' : entry.status === 'failed' ? 'FAILED' : 'PENDING',
    error: entry.error,
  };
};

const toLegacy = (mutation: OutboxMutation): SyncOutboxEntry => ({
  id: mutation.id,
  entity: mutation.entity as OutboxEntity,
  action: mutation.operation,
  entityId: mutation.recordId,
  payload: mutation.payload,
  timestamp: new Date(mutation.timestamp).toISOString(),
  status: mutation.status === 'RESOLVED' ? 'synced' : mutation.status === 'FAILED' ? 'failed' : 'pending',
  retryCount: mutation.retryCount,
  error: mutation.error,
});

/**
 * ترحيل سِجل الواجهة القديم إلى طابور `Outbox` الرسمي.
 *
 * الترحيل قابل للإعادة: المعرّفات الموجودة مسبقاً لا تتكرر، والمفتاح القديم يُمسح فقط
 * بعد كتابة السجل الموحد. لا يُستدعى `enqueue` كي لا تتغير هوية العملية أو طابعها الزمني.
 */
export function migrateLegacySyncOutbox(): void {
  const legacyEntries = legacyOutboxRepo.read();
  if (legacyEntries.length === 0) return;

  const current = Outbox.getAll();
  const knownIds = new Set(current.map((mutation) => mutation.id));
  const migrated = legacyEntries.map(toCanonical).filter((mutation) => !knownIds.has(mutation.id));
  if (migrated.length > 0) {
    // يدعم الطابوران طوابع زمنية مختلفة؛ نعيد ترتيب المصدرين قبل تطبيق FIFO كي لا
    // تصبح عناصر السجل القديم أحدث لمجرد أنها انتقلت متأخرة.
    Outbox.replaceAll([...current, ...migrated].sort((left, right) => left.timestamp - right.timestamp));
  }
  legacyOutboxRepo.clear();
}

const pendingCount = (): number => Outbox.getAll().filter((mutation) => mutation.status === 'PENDING').length;

const notify = (): void => {
  broadcastDataChange('OUTBOX_UPDATED', { pendingCount: pendingCount() });
};

/** يقرأ الطابور الموحد بصيغة واجهة الإعدادات المتوافقة مع الإصدارات السابقة. */
export function loadSyncOutbox(): SyncOutboxEntry[] {
  migrateLegacySyncOutbox();
  return Outbox.getAll().map(toLegacy);
}

/** يستبدل السجل الموحد بصيغة الواجهة القديمة مع السقف التاريخي نفسه. */
export function saveSyncOutbox(entries: SyncOutboxEntry[]): void {
  try {
    migrateLegacySyncOutbox();
    Outbox.replaceAll(entries.map(toCanonical));
    notify();
  } catch (error) {
    console.error('Failed to save sync outbox:', error);
  }
}

/** يسجل عملية واحدة؛ موجود للتوافق مع مستدعي الواجهة القديم. */
export function recordOutboxMutation(
  entity: OutboxEntity,
  action: OutboxAction,
  entityId: string,
  payload?: unknown
): SyncOutboxEntry {
  return recordOutboxMutations([{ entity, action, entityId, payload }])[0]!;
}

/** يسجل دفعة في كتابة واحدة، للاستيراد والحذف الجماعي بلا تسلسل الطابور لكل صف. */
export function recordOutboxMutations(inputs: readonly SyncOutboxMutationInput[]): SyncOutboxEntry[] {
  migrateLegacySyncOutbox();
  const mutations = Outbox.enqueueMany(
    inputs.map<OutboxMutationInput>((input) => ({
      entity: input.entity,
      operation: input.action,
      recordId: input.entityId,
      payload: input.payload,
    }))
  );
  if (mutations.length > 0) notify();
  return mutations.map(toLegacy);
}

export function getPendingOutboxEntries(): SyncOutboxEntry[] {
  return loadSyncOutbox().filter((entry) => entry.status === 'pending');
}

export function getPendingOutboxCount(): number {
  return getPendingOutboxEntries().length;
}

export function markOutboxItemSynced(id: string): void {
  migrateLegacySyncOutbox();
  Outbox.markResolved(id);
  notify();
}

export function markAllOutboxSynced(): void {
  migrateLegacySyncOutbox();
  Outbox.markAllResolved();
  notify();
}

export function clearSyncedOutbox(): void {
  migrateLegacySyncOutbox();
  Outbox.clearResolved();
  notify();
}

export function getOutboxStats(): {
  total: number;
  pending: number;
  synced: number;
  failed: number;
  lastMutation?: string;
} {
  const entries = loadSyncOutbox();
  const pending = entries.filter((entry) => entry.status === 'pending').length;
  const synced = entries.filter((entry) => entry.status === 'synced').length;
  const failed = entries.filter((entry) => entry.status === 'failed').length;
  const lastMutation = entries.length > 0 ? entries[entries.length - 1].timestamp : undefined;

  return {
    total: entries.length,
    pending,
    synced,
    failed,
    lastMutation,
  };
}

/** سقف واحد معلن للواجهة القديمة والجديدة. */
export const maxSyncOutboxEntries = (): number => OUTBOX_MAX_ENTRIES;
