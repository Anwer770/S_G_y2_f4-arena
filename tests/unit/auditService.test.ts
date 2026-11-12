import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { indexedDBStorage } from '../../src/database/adapters/IndexedDBAdapter';
import { CentralAuditService, type CentralAuditEntry } from '../../src/core/audit/AuditService';

const DEVICE_KEY = 'suite_device_id_v1';
const HOT_KEY = 'suite_unified_audit_v2';
const ARCHIVE_KEY = 'suite_unified_audit_archive_v1';
const now = new Date('2026-11-07T12:34:56.000Z');

type AuditServiceConstructor = {
  instance: CentralAuditService | undefined;
};

const staticState = () => CentralAuditService as unknown as AuditServiceConstructor;

const entry = (id: string, entity = 'Customer'): CentralAuditEntry => ({
  id,
  userId: 'seed-user',
  deviceId: 'seed-device',
  action: 'Create',
  entity,
  timestamp: now.toISOString(),
});

let values: Map<string, unknown>;
let service: CentralAuditService;

const createFreshService = (): CentralAuditService => {
  staticState().instance = undefined;
  return CentralAuditService.getInstance();
};

beforeEach(() => {
  values = new Map();
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
  vi.spyOn(indexedDBStorage, 'getItemSync').mockImplementation((key, defaultValue) => {
    return (values.has(key) ? values.get(key) : (defaultValue ?? null)) as never;
  });
  vi.spyOn(indexedDBStorage, 'setItemSync').mockImplementation((key, value) => {
    values.set(key, value);
  });
  service = createFreshService();
});

afterEach(() => {
  staticState().instance = undefined;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('R82 — خدمة سجل التدقيق المركزي', () => {
  it('ينشئ معرف جهاز مرة واحدة، ويعيد استخدام النسخة المفردة ومعرف جهاز محفوظ', () => {
    expect(service.getDeviceId()).toBe('dev_4fzzzxjy_mw6dypa8');
    expect(values.get(DEVICE_KEY)).toBe('dev_4fzzzxjy_mw6dypa8');
    expect(CentralAuditService.getInstance()).toBe(service);

    values.set(DEVICE_KEY, 'persisted-device');
    const restored = createFreshService();
    expect(restored.getDeviceId()).toBe('persisted-device');
    expect(values.get(DEVICE_KEY)).toBe('persisted-device');
  });

  it('يسجل إدخالاً كاملاً بالأحدث أولاً، ويحافظ على بيانات المستخدم أو افتراض admin', () => {
    const custom = service.log({
      action: 'Update',
      entity: 'Customer',
      userId: 'operator-7',
      recordId: 'C-7',
      details: 'تحديث اسم العميل',
      oldValue: { name: 'قبل' },
      newValue: { name: 'بعد' },
    });
    const defaultUser = service.log({ action: 'إضافة', entity: 'Product' });

    expect(custom).toMatchObject({
      id: 'audit_1794054896000_4fzz',
      timestamp: now.toISOString(),
      deviceId: service.getDeviceId(),
      userId: 'operator-7',
      action: 'Update',
      entity: 'Customer',
      recordId: 'C-7',
      details: 'تحديث اسم العميل',
      oldValue: { name: 'قبل' },
      newValue: { name: 'بعد' },
    });
    expect(defaultUser.userId).toBe('admin');
    expect(service.getAllLogs()).toEqual([defaultUser, custom]);
    expect(service.getLogsByEntity('Customer')).toEqual([custom]);
    expect(service.getLogsByEntity('غير موجود')).toEqual([]);
  });

  it('ينقل الأقدم عند امتلاء السجل الساخن ويقص الأرشيف إلى سعته من دون فقد الإدخال المنقول', () => {
    const hot = Array.from({ length: 500 }, (_, index) => entry(`hot-${index}`));
    const archived = Array.from({ length: 5000 }, (_, index) => entry(`archive-${index}`, 'Archived'));
    values.set(HOT_KEY, hot);
    values.set(ARCHIVE_KEY, archived);

    const newest = service.log({ action: 'Delete', entity: 'Customer', recordId: 'C-500' });

    expect(service.getAllLogs()).toHaveLength(500);
    expect(service.getAllLogs()[0]).toEqual(newest);
    expect(service.getAllLogs().at(-1)?.id).toBe('hot-498');
    expect(service.getArchivedLogs()).toHaveLength(5000);
    expect(service.getArchivedLogs()[0].id).toBe('hot-499');
    expect(service.getArchivedLogs().at(-1)?.id).toBe('archive-4998');
    expect(service.getArchiveCount()).toBe(5000);
    expect(service.getAllLogsIncludingArchive()).toEqual([...service.getAllLogs(), ...service.getArchivedLogs()]);
  });

  it('يرفض بيانات التخزين غير المصفوفية، ويصدر حزمة كاملة ويمسح الساخن والأرشيف استقلالاً', () => {
    values.set(HOT_KEY, { malformed: true });
    values.set(ARCHIVE_KEY, 'malformed');
    expect(service.getAllLogs()).toEqual([]);
    expect(service.getArchivedLogs()).toEqual([]);

    values.set(HOT_KEY, [entry('hot-1')]);
    values.set(ARCHIVE_KEY, [entry('archive-1', 'Archived')]);
    expect(service.exportAll()).toEqual({
      version: '1.0',
      exportedAt: now.toISOString(),
      hot: [entry('hot-1')],
      archived: [entry('archive-1', 'Archived')],
    });

    service.clearArchive();
    expect(service.getAllLogs()).toEqual([entry('hot-1')]);
    expect(service.getArchivedLogs()).toEqual([]);
    service.clearLogs();
    expect(service.getAllLogs()).toEqual([]);
    expect(service.getArchivedLogs()).toEqual([]);
  });

  it('يعيد الإدخال للمستدعي حتى إذا تعذر حفظه، ويعلن الخطأ بدل إسقاط مسار العمل', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(indexedDBStorage.getItemSync).mockImplementationOnce(() => {
      throw new Error('storage unavailable');
    });

    const result = service.log({ action: 'Backup', entity: 'SystemBackup' });

    expect(result).toMatchObject({ action: 'Backup', entity: 'SystemBackup', userId: 'admin' });
    expect(error).toHaveBeenCalledWith('AuditService: Failed to record audit log', expect.any(Error));
  });
});
