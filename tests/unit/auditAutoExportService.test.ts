// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dbStorage } from '../../src/database/dbStorage';
import { auditService, type CentralAuditEntry } from '../../src/core/audit/AuditService';
import {
  AUTO_EXPORT_CONFIG_KEY,
  AUTO_EXPORT_SNAPSHOTS_KEY,
  AUTO_EXPORT_STATE_KEY,
  DEFAULT_AUTO_CONFIG,
  getFolderHandle,
  pickFolder,
  readAutoConfig,
  readAutoState,
  readSnapshots,
  runAutoExport,
  saveAutoConfig,
  saveFolderHandle,
  snapshotsSizeKb,
  supportsFolderPicker,
  type AutoExportConfig,
} from '../../src/services/audit/auditAutoExport';

const now = new Date('2026-11-07T12:34:00.000Z');
const archivePayload = (hotCount = 1, archivedCount = 0): ReturnType<typeof auditService.exportAll> => {
  const entry = (id: string): CentralAuditEntry => ({
    id,
    userId: 'admin',
    deviceId: 'device',
    action: 'تصدير',
    entity: 'Audit',
    timestamp: now.toISOString(),
  });
  return {
    version: '1.0',
    exportedAt: now.toISOString(),
    hot: Array.from({ length: hotCount }, (_, index) => entry(`hot-${index}`)),
    archived: Array.from({ length: archivedCount }, (_, index) => entry(`archive-${index}`)),
  };
};

type FolderDbOptions = {
  handle?: unknown;
  existingStore?: boolean;
  failOpen?: boolean;
  failRead?: boolean;
  failWrite?: boolean;
};

/** محاكاة IndexedDB لمقبض المجلد فقط؛ تحفظ الكائن نفسه كي يمكن اختبار واجهة الملفات. */
const installFolderDb = (options: FolderDbOptions = {}) => {
  const records = new Map<string, unknown>();
  if (options.handle !== undefined) records.set('audit_archive_folder', options.handle);
  let hasStore = options.existingStore ?? false;

  const db = {
    objectStoreNames: { contains: vi.fn(() => hasStore) },
    createObjectStore: vi.fn(() => {
      hasStore = true;
    }),
    close: vi.fn(),
    transaction: vi.fn(() => {
      const tx: {
        error?: Error;
        oncomplete?: () => void;
        onerror?: () => void;
        objectStore: () => {
          put: (value: unknown, key: string) => void;
          get: (key: string) => { result?: unknown; error?: Error; onsuccess?: () => void; onerror?: () => void };
        };
      } = {
        objectStore: () => ({
          put: (value, key) => {
            queueMicrotask(() => {
              if (options.failWrite) {
                tx.error = new Error('write failed');
                tx.onerror?.();
                return;
              }
              records.set(key, value);
              tx.oncomplete?.();
            });
          },
          get: (key) => {
            const request: { result?: unknown; error?: Error; onsuccess?: () => void; onerror?: () => void } = {};
            queueMicrotask(() => {
              if (options.failRead) {
                request.error = new Error('read failed');
                request.onerror?.();
                return;
              }
              request.result = records.get(key);
              request.onsuccess?.();
            });
            return request;
          },
        }),
      };
      return tx;
    }),
  };

  const indexedDb = {
    open: vi.fn(() => {
      const request: {
        result: typeof db;
        error?: Error;
        onupgradeneeded?: () => void;
        onsuccess?: () => void;
        onerror?: () => void;
      } = {
        result: db,
      };
      queueMicrotask(() => {
        if (options.failOpen) {
          request.error = new Error('open failed');
          request.onerror?.();
          return;
        }
        request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    }),
  };

  vi.stubGlobal('indexedDB', indexedDb);
  return { db, indexedDb, records };
};

const setConfig = (patch: Partial<AutoExportConfig> = {}) => {
  dbStorage.setItem(AUTO_EXPORT_CONFIG_KEY, JSON.stringify({ ...DEFAULT_AUTO_CONFIG, ...patch }));
};

const setState = (state: Record<string, unknown>) => {
  dbStorage.setItem(AUTO_EXPORT_STATE_KEY, JSON.stringify(state));
};

let click: ReturnType<typeof vi.spyOn>;
let createObjectUrl: ReturnType<typeof vi.fn>;
let revokeObjectUrl: ReturnType<typeof vi.fn>;
let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  dbStorage.clear();
  window.localStorage.clear();
  delete (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
  click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  createObjectUrl = vi.fn(() => 'blob:audit-export');
  revokeObjectUrl = vi.fn();
  vi.stubGlobal('URL', { createObjectURL: createObjectUrl, revokeObjectURL: revokeObjectUrl });
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(auditService, 'exportAll').mockReturnValue(archivePayload());
});

afterEach(() => {
  vi.unstubAllGlobals();
  dbStorage.clear();
  window.localStorage.clear();
  delete (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
  vi.restoreAllMocks();
});

describe('R81 — خدمة التصدير التلقائي لأرشيف التدقيق', () => {
  it('يدير إعداد التصدير وحالته ولقطاته عبر المستودعات، ويعلن تعديل الإعداد في المتصفح', () => {
    const announcement = vi.fn();
    window.addEventListener('suite:audit-auto-export', announcement);

    expect(readAutoConfig()).toEqual(DEFAULT_AUTO_CONFIG);
    saveAutoConfig({ enabled: false, intervalDays: 7, keepCount: 2, writeToFolder: true });
    expect(readAutoConfig()).toEqual({ enabled: false, intervalDays: 7, keepCount: 2, writeToFolder: true });
    expect(announcement).toHaveBeenCalledOnce();

    setState({ lastRunAt: now.toISOString(), runs: 3 });
    dbStorage.setItem(
      AUTO_EXPORT_SNAPSHOTS_KEY,
      JSON.stringify([{ id: 'a', at: now.toISOString(), fileName: 'a.json', count: 1, json: 'x'.repeat(1536) }])
    );
    expect(readAutoState()).toMatchObject({ lastRunAt: now.toISOString(), runs: 3 });
    expect(readSnapshots()).toHaveLength(1);
    expect(snapshotsSizeKb()).toBe(2);

    vi.stubGlobal('window', undefined);
    saveAutoConfig({ ...DEFAULT_AUTO_CONFIG, enabled: false });
    expect(readAutoConfig().enabled).toBe(false);
  });

  it('يكشف دعم اختيار المجلد، ويحفظ المقبض ويختاره ثم يفعّل الكتابة الصامتة', async () => {
    expect(supportsFolderPicker()).toBe(false);
    const { db, records } = installFolderDb();
    const picked = { name: 'أرشيف التدقيق' } as FileSystemDirectoryHandle;
    const showDirectoryPicker = vi.fn(async () => picked);
    Object.defineProperty(window, 'showDirectoryPicker', { configurable: true, value: showDirectoryPicker });

    expect(supportsFolderPicker()).toBe(true);
    expect(await pickFolder()).toBe('أرشيف التدقيق');
    expect(showDirectoryPicker).toHaveBeenCalledOnce();
    expect(records.get('audit_archive_folder')).toBe(picked);
    expect(db.close).toHaveBeenCalledOnce();
    expect(readAutoConfig()).toMatchObject({ enabled: true, writeToFolder: true });
  });

  it('يعيد null عند غياب المنتقي أو إلغائه، ويعالج فشل قاعدة المقبض والقراءة بأمان', async () => {
    expect(await pickFolder()).toBeNull();

    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: vi.fn(async () => {
        throw new Error('cancelled');
      }),
    });
    expect(await pickFolder()).toBeNull();

    installFolderDb({ failOpen: true });
    expect(await getFolderHandle()).toBeNull();
    installFolderDb({ failRead: true, existingStore: true });
    expect(await getFolderHandle()).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('يرفض حفظ المقبض عند فشل المعاملة، ويحفظ ويقرأ null عندما لا يوجد مقبض', async () => {
    installFolderDb({ failWrite: true });
    await expect(saveFolderHandle({ name: 'مجلد فاشل' } as FileSystemDirectoryHandle)).rejects.toThrow('write failed');

    const { db } = installFolderDb({ existingStore: true });
    await saveFolderHandle({ name: 'مجلد سليم' } as FileSystemDirectoryHandle);
    expect(await getFolderHandle()).toMatchObject({ name: 'مجلد سليم' });
    expect(db.objectStoreNames.contains).toHaveBeenCalled();
    expect(db.close).toHaveBeenCalledTimes(2);

    const empty = installFolderDb({ existingStore: true });
    expect(await getFolderHandle()).toBeNull();
    expect(empty.db.close).toHaveBeenCalledOnce();
  });

  it('لا يصدّر قبل الموعد أو مع سجل فارغ إلا عند force، ثم يحتفظ بلقطة وحالة قابلة للعرض', async () => {
    setConfig({ keepCount: 1 });
    setState({ lastRunAt: now.toISOString(), runs: 4 });
    expect(await runAutoExport(false, now)).toEqual({ ran: false, reason: 'not-due' });
    expect(auditService.exportAll).not.toHaveBeenCalled();

    setState({ runs: 4 });
    vi.mocked(auditService.exportAll).mockReturnValue(archivePayload(0, 0));
    expect(await runAutoExport(false, now)).toEqual({ ran: false, reason: 'empty' });
    expect(readSnapshots()).toEqual([]);

    const result = await runAutoExport(true, now);
    expect(result).toMatchObject({
      ran: true,
      count: 0,
      mode: 'download',
      fileName: 'audit-archive-2026-11-07-1234.json',
    });
    expect(readSnapshots()).toHaveLength(1);
    expect(readAutoState()).toMatchObject({ lastCount: 0, lastMode: 'download', runs: 5 });
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:audit-export');
  });

  it('يخزن أحدث لقطة فقط ثم ينزّل عند غياب المجلد أو رفض الإذن، حتى لو فشل التنزيل بأمان', async () => {
    setConfig({ keepCount: 1, writeToFolder: true });
    dbStorage.setItem(
      AUTO_EXPORT_SNAPSHOTS_KEY,
      JSON.stringify([{ id: 'old', at: '2026-11-06T00:00:00.000Z', fileName: 'old.json', count: 1, json: '{}' }])
    );
    installFolderDb({ existingStore: true });

    const first = await runAutoExport(true, now);
    expect(first.mode).toBe('download');
    expect(readSnapshots().map((snapshot) => snapshot.id)).toEqual(['snap_1794054840000']);

    const deniedHandle = {
      name: 'مجلد مرفوض',
      queryPermission: vi.fn(async () => 'denied'),
      getFileHandle: vi.fn(),
    };
    installFolderDb({ handle: deniedHandle, existingStore: true });
    await runAutoExport(true, new Date('2026-11-07T12:35:00.000Z'));
    expect(deniedHandle.getFileHandle).not.toHaveBeenCalled();

    createObjectUrl.mockImplementationOnce(() => {
      throw new Error('download failed');
    });
    expect((await runAutoExport(true, new Date('2026-11-07T12:36:00.000Z'))).mode).toBe('store');
    expect(readAutoState().lastMode).toBe('store');
    expect(warn).toHaveBeenCalledWith('audit auto export: download failed', expect.any(Error));
  });

  it('يكتب في المجلد عند الإذن الصريح أو حين لا تتوفر queryPermission، ثم يعود للتنزيل إن فشلت الكتابة', async () => {
    setConfig({ writeToFolder: true });
    const writable = { write: vi.fn(async () => undefined), close: vi.fn(async () => undefined) };
    const grantedHandle = {
      name: 'مجلد مصرّح',
      queryPermission: vi.fn(async () => 'granted'),
      getFileHandle: vi.fn(async () => ({ createWritable: vi.fn(async () => writable) })),
    };
    installFolderDb({ handle: grantedHandle, existingStore: true });

    const folderResult = await runAutoExport(true, now);
    expect(folderResult).toMatchObject({ mode: 'folder', count: 1 });
    expect(grantedHandle.queryPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(grantedHandle.getFileHandle).toHaveBeenCalledWith('audit-archive-2026-11-07-1234.json', { create: true });
    expect(writable.write).toHaveBeenCalledWith(expect.stringContaining('"hot"'));
    expect(writable.close).toHaveBeenCalledOnce();
    expect(createObjectUrl).not.toHaveBeenCalled();

    const implicitWritable = { write: vi.fn(async () => undefined), close: vi.fn(async () => undefined) };
    const implicitHandle = {
      name: 'مجلد بلا استعلام',
      getFileHandle: vi.fn(async () => ({ createWritable: vi.fn(async () => implicitWritable) })),
    };
    installFolderDb({ handle: implicitHandle, existingStore: true });
    expect((await runAutoExport(true, new Date('2026-11-07T12:35:00.000Z'))).mode).toBe('folder');
    expect(implicitHandle.getFileHandle).toHaveBeenCalledOnce();

    const brokenHandle = {
      name: 'مجلد معطوب',
      queryPermission: vi.fn(async () => 'granted'),
      getFileHandle: vi.fn(async () => {
        throw new Error('disk full');
      }),
    };
    installFolderDb({ handle: brokenHandle, existingStore: true });
    expect((await runAutoExport(true, new Date('2026-11-07T12:36:00.000Z'))).mode).toBe('download');
    expect(warn).toHaveBeenCalledWith('audit auto export: folder write failed', expect.any(Error));
  });
});
