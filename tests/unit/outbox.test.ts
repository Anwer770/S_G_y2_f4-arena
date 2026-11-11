import { beforeEach, describe, expect, it, vi } from 'vitest';
import { indexedDBStorage } from '../../src/database/adapters/IndexedDBAdapter';
import { auditService } from '../../src/core/audit/AuditService';
import {
  Outbox,
  OUTBOX_DROPPED_STORAGE_KEY,
  OUTBOX_MAX_ENTRIES,
  OUTBOX_STORAGE_KEY,
  type OutboxMutation,
} from '../../src/sync/Outbox';
import {
  LEGACY_SYNC_OUTBOX_STORAGE_KEY,
  clearSyncedOutbox,
  getOutboxStats,
  getPendingOutboxCount,
  getPendingOutboxEntries,
  loadSyncOutbox,
  markAllOutboxSynced,
  markOutboxItemSynced,
  maxSyncOutboxEntries,
  recordOutboxMutation,
  recordOutboxMutations,
  saveSyncOutbox,
  type SyncOutboxEntry,
} from '../../src/utils/syncOutbox';

const legacyEntry = (overrides: Partial<SyncOutboxEntry> = {}): SyncOutboxEntry => ({
  id: 'legacy-1',
  entity: 'financial',
  action: 'INSERT',
  entityId: 'FIN-1',
  payload: { id: 'FIN-1' },
  timestamp: '2026-11-07T08:00:00.000Z',
  status: 'pending',
  retryCount: 0,
  error: undefined,
  ...overrides,
});

const canonicalMutation = (overrides: Partial<OutboxMutation> = {}): OutboxMutation => ({
  id: 'mutation-1',
  deviceId: 'device-1',
  entity: 'FinancialTransaction',
  operation: 'INSERT',
  recordId: 'FIN-1',
  payload: { id: 'FIN-1' },
  timestamp: Date.parse('2026-11-07T08:00:00.000Z'),
  retryCount: 0,
  status: 'PENDING',
  ...overrides,
});

beforeEach(() => {
  vi.restoreAllMocks();
  indexedDBStorage.removeItemSync(OUTBOX_STORAGE_KEY);
  indexedDBStorage.removeItemSync(OUTBOX_DROPPED_STORAGE_KEY);
  indexedDBStorage.removeItemSync(LEGACY_SYNC_OUTBOX_STORAGE_KEY);
  auditService.clearLogs();
});

describe('R62 — طابور المزامنة الموحد', () => {
  it('يسجل الدفعة بكتابة واحدة ويحافظ على ترتيب كل عملية', () => {
    const write = vi.spyOn(indexedDBStorage, 'setItemSync');

    expect(Outbox.enqueueMany([])).toEqual([]);
    const mutations = Outbox.enqueueMany([
      { entity: 'FinancialTransaction', operation: 'INSERT', recordId: 'FIN-1', payload: { amount: 10 } },
      { entity: 'StockMovement', operation: 'DELETE', recordId: 'STK-1' },
    ]);

    expect(mutations.map((mutation) => mutation.recordId)).toEqual(['FIN-1', 'STK-1']);
    expect(Outbox.getAll().map((mutation) => mutation.recordId)).toEqual(['FIN-1', 'STK-1']);
    expect(write).toHaveBeenCalledTimes(1);
    expect(Outbox.count()).toBe(2);
    expect(Outbox.maxEntries()).toBe(OUTBOX_MAX_ENTRIES);
    expect(Outbox.getDroppedCount()).toBe(0);
  });

  it('يقص الأقدم عند السقف ويسجل عدد الإسقاط في السجل والتدقيق', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    Outbox.enqueueMany(
      Array.from({ length: OUTBOX_MAX_ENTRIES + 1 }, (_, index) => ({
        entity: 'FinancialTransaction',
        operation: 'INSERT' as const,
        recordId: `FIN-${index + 1}`,
      }))
    );

    const queue = Outbox.getAll();
    expect(queue).toHaveLength(OUTBOX_MAX_ENTRIES);
    expect(queue[0]?.recordId).toBe('FIN-2');
    expect(queue.at(-1)?.recordId).toBe(`FIN-${OUTBOX_MAX_ENTRIES + 1}`);
    expect(Outbox.getDroppedCount()).toBe(1);
    expect(warning).toHaveBeenCalledTimes(1);
    expect(auditService.getLogsByEntity('SyncOutboxTrim')).toHaveLength(1);
  });

  it('يحدّث الحالات ويحذف المنتهي من المصدر الرسمي من دون لمس العناصر الأخرى', () => {
    const first = Outbox.enqueue('FinancialTransaction', 'INSERT', 'FIN-1');
    const second = Outbox.enqueue('StockMovement', 'UPDATE', 'STK-1');

    Outbox.markFailed(first.id);
    Outbox.markFailed('missing');
    expect(Outbox.getAll().find((mutation) => mutation.id === first.id)).toMatchObject({
      status: 'FAILED',
      retryCount: 1,
    });

    Outbox.markResolved(first.id);
    Outbox.markResolved('missing');
    Outbox.clearResolved();
    expect(Outbox.getAll()).toHaveLength(1);
    expect(Outbox.getAll()[0]?.id).toBe(second.id);

    Outbox.markAllResolved();
    Outbox.remove('missing');
    Outbox.clearResolved();
    expect(Outbox.getAll()).toEqual([]);

    Outbox.replaceAll(
      Array.from({ length: OUTBOX_MAX_ENTRIES + 2 }, (_, index) => canonicalMutation({ id: `m-${index}` }))
    );
    expect(Outbox.getAll()).toHaveLength(OUTBOX_MAX_ENTRIES);
    expect(Outbox.getAll()[0]?.id).toBe('m-2');
    expect(Outbox.getDroppedCount()).toBe(2);
    expect(auditService.getLogsByEntity('SyncOutboxTrim')).toHaveLength(1);
    Outbox.clear();
    expect(Outbox.getAll()).toEqual([]);
  });

  it('يرحّل السجل القديم مرةً إلى المصدر الموحد بلا تكرار ثم يزيل مفتاحه القديم', () => {
    const failedLegacy = legacyEntry({ status: 'failed', retryCount: 2, error: 'انقطع الاتصال' });
    Outbox.replaceAll([canonicalMutation({ id: 'current-1', timestamp: Date.parse('2026-11-08T08:00:00.000Z') })]);
    indexedDBStorage.setItemSync(LEGACY_SYNC_OUTBOX_STORAGE_KEY, [failedLegacy]);

    const migrated = loadSyncOutbox();
    expect(migrated.map((entry) => entry.id)).toEqual(['legacy-1', 'current-1']);
    expect(migrated[0]).toEqual(failedLegacy);
    expect(indexedDBStorage.getItemSync(LEGACY_SYNC_OUTBOX_STORAGE_KEY)).toBeNull();
    expect(Outbox.getAll()).toMatchObject([
      { id: 'legacy-1', status: 'FAILED', recordId: 'FIN-1', retryCount: 2, error: 'انقطع الاتصال' },
      { id: 'current-1', status: 'PENDING' },
    ]);

    indexedDBStorage.setItemSync(LEGACY_SYNC_OUTBOX_STORAGE_KEY, [failedLegacy]);
    expect(loadSyncOutbox().map((entry) => entry.id)).toEqual(['legacy-1', 'current-1']);
    expect(Outbox.getAll()).toHaveLength(2);
  });

  it('يبقي واجهة السجل القديمة متوافقة فوق الطابور الموحد، بما فيها الإحصاءات والحالات', () => {
    saveSyncOutbox([
      legacyEntry({ id: 'pending', status: 'pending' }),
      legacyEntry({ id: 'synced', status: 'synced', entityId: 'FIN-2', retryCount: 2 }),
      legacyEntry({ id: 'failed', status: 'failed', entityId: 'FIN-3', timestamp: 'ليس تاريخاً' }),
    ]);

    expect(loadSyncOutbox().map((entry) => entry.status)).toEqual(['pending', 'synced', 'failed']);
    expect(getPendingOutboxEntries()).toHaveLength(1);
    expect(getPendingOutboxCount()).toBe(1);
    expect(getOutboxStats()).toMatchObject({ total: 3, pending: 1, synced: 1, failed: 1 });
    expect(maxSyncOutboxEntries()).toBe(OUTBOX_MAX_ENTRIES);

    markOutboxItemSynced('pending');
    markAllOutboxSynced();
    clearSyncedOutbox();
    expect(getOutboxStats()).toEqual({ total: 0, pending: 0, synced: 0, failed: 0, lastMutation: undefined });
  });

  it('يسجل واجهة الدفعة مرة واحدة ويحافظ على التوافق عند حفظ يفشل', () => {
    const mutations = recordOutboxMutations([
      { entity: 'financial', action: 'INSERT', entityId: 'FIN-1' },
      { entity: 'stock', action: 'DELETE', entityId: 'STK-1' },
    ]);
    expect(mutations.map((mutation) => mutation.entityId)).toEqual(['FIN-1', 'STK-1']);
    expect(recordOutboxMutations([])).toEqual([]);
    expect(recordOutboxMutation('financial', 'UPDATE', 'FIN-1').status).toBe('pending');

    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(Outbox, 'replaceAll').mockImplementationOnce(() => {
      throw new Error('storage failed');
    });
    saveSyncOutbox([legacyEntry()]);
    expect(error).toHaveBeenCalledWith('Failed to save sync outbox:', expect.any(Error));
  });
});
