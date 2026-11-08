/**
 * التصدير التلقائي لأرشيف سجل التدقيق (R21).
 *
 * - **منطق نقي** (isAutoExportDue / buildArchiveFileName / pruneSnapshots) قابل للاختبار.
 * - يُنشئ لقطة JSON كاملة (السجل + الأرشيف) ويحفظها داخل IndexedDB، فلا تضيع حتى لو
 *   أغلق المستخدم المتصفح قبل التنزيل.
 * - إن اختار المستخدم مجلداً (File System Access API) تُكتب النسخة هناك بصمت؛
 *   وبخلافه تُنزَّل تلقائياً مرة واحدة عند استحقاق الموعد.
 */
import { auditService } from '../../core/audit/AuditService';
import { dbStorage } from '../../database/dbStorage';
import {
  DEFAULT_AUTO_CONFIG,
  buildArchiveFileName,
  isAutoExportDue,
  pruneSnapshots,
  type ArchiveSnapshot,
  type AutoExportConfig,
} from '../../utils/auditAutoExportLogic';

export { DEFAULT_AUTO_CONFIG, buildArchiveFileName, isAutoExportDue, pruneSnapshots };
export type { ArchiveSnapshot, AutoExportConfig };

export interface AutoExportState {
  lastRunAt?: string;
  lastFileName?: string;
  lastCount?: number;
  lastMode?: 'folder' | 'download' | 'store';
  runs: number;
}

export const AUTO_EXPORT_CONFIG_KEY = 'suite_audit_autoexport_v1';
export const AUTO_EXPORT_STATE_KEY = 'suite_audit_autoexport_state_v1';
export const AUTO_EXPORT_SNAPSHOTS_KEY = 'suite_audit_snapshots_v1';
const HANDLE_DB = 'suite_fs_handles';
const HANDLE_STORE = 'handles';
const HANDLE_KEY = 'audit_archive_folder';

export function readAutoConfig(): AutoExportConfig {
  try {
    const raw = dbStorage.getItem(AUTO_EXPORT_CONFIG_KEY);
    return raw ? { ...DEFAULT_AUTO_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_AUTO_CONFIG };
  } catch {
    return { ...DEFAULT_AUTO_CONFIG };
  }
}

export function saveAutoConfig(config: AutoExportConfig): void {
  dbStorage.setItem(AUTO_EXPORT_CONFIG_KEY, JSON.stringify(config));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('suite:audit-auto-export'));
}

export function readAutoState(): AutoExportState {
  try {
    const raw = dbStorage.getItem(AUTO_EXPORT_STATE_KEY);
    return raw ? { runs: 0, ...JSON.parse(raw) } : { runs: 0 };
  } catch {
    return { runs: 0 };
  }
}

const saveAutoState = (state: AutoExportState): void => {
  dbStorage.setItem(AUTO_EXPORT_STATE_KEY, JSON.stringify(state));
};

export function readSnapshots(): ArchiveSnapshot[] {
  try {
    const raw = dbStorage.getItem(AUTO_EXPORT_SNAPSHOTS_KEY);
    return raw ? (JSON.parse(raw) as ArchiveSnapshot[]) : [];
  } catch {
    return [];
  }
}

const saveSnapshots = (list: ArchiveSnapshot[], keep: number): void => {
  dbStorage.setItem(AUTO_EXPORT_SNAPSHOTS_KEY, JSON.stringify(pruneSnapshots(list, keep)));
};

/* ───────────── مقبض المجلد (اختياري، Chromium/Electron) ───────────── */

const openHandleDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(HANDLE_DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(HANDLE_STORE)) req.result.createObjectStore(HANDLE_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

export async function saveFolderHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openHandleDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, 'readwrite');
    tx.objectStore(HANDLE_STORE).put(handle, HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openHandleDb();
    const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readonly');
      const req = tx.objectStore(HANDLE_STORE).get(HANDLE_KEY);
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return handle;
  } catch {
    return null;
  }
}

export const supportsFolderPicker = (): boolean =>
  typeof window !== 'undefined' && typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';

/** يطلب من المستخدم اختيار مجلد الأرشيف (يجب أن يكون بفعل مستخدم). */
export async function pickFolder(): Promise<string | null> {
  if (!supportsFolderPicker()) return null;
  try {
    const picker = (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
    const handle = await picker();
    await saveFolderHandle(handle);
    const config = readAutoConfig();
    saveAutoConfig({ ...config, writeToFolder: true, enabled: true });
    return handle.name;
  } catch {
    return null;
  }
}

const downloadJson = (fileName: string, json: string): void => {
  try {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.warn('audit auto export: download failed', err);
  }
};

export interface AutoExportResult {
  ran: boolean;
  fileName?: string;
  count?: number;
  mode?: AutoExportState['lastMode'];
  reason?: string;
}

/**
 * ينفّذ التصدير إن استحق (أو عند force).
 * لا يرمي أبداً — يُستدعى عند الإقلاع وعند كل تعديل إعداد.
 */
export async function runAutoExport(force = false, now: Date = new Date()): Promise<AutoExportResult> {
  const config = readAutoConfig();
  const state = readAutoState();
  if (!force && !isAutoExportDue(config, state.lastRunAt, now)) return { ran: false, reason: 'not-due' };

  const payload = auditService.exportAll();
  const count = payload.hot.length + payload.archived.length;
  if (count === 0 && !force) return { ran: false, reason: 'empty' };

  const fileName = buildArchiveFileName(now);
  const json = JSON.stringify(payload, null, 2);

  // 1) لقطة داخلية دائمة
  const snapshots = readSnapshots();
  saveSnapshots(
    [{ id: `snap_${now.getTime()}`, at: now.toISOString(), fileName, count, json }, ...snapshots],
    config.keepCount
  );

  // 2) كتابة صامتة إلى المجلد إن توفّر وأذن المستخدم
  let mode: AutoExportState['lastMode'] = 'store';
  if (config.writeToFolder) {
    const handle = await getFolderHandle();
    if (handle) {
      try {
        const perm = await (handle as unknown as { queryPermission?: (o: { mode: string }) => Promise<string> }).queryPermission?.({ mode: 'readwrite' });
        if (perm === 'granted' || perm === undefined) {
          const fileHandle = await handle.getFileHandle(fileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(json);
          await writable.close();
          mode = 'folder';
        }
      } catch (err) {
        console.warn('audit auto export: folder write failed', err);
      }
    }
  }
  if (mode === 'store') {
    downloadJson(fileName, json);
    mode = 'download';
  }

  saveAutoState({
    lastRunAt: now.toISOString(),
    lastFileName: fileName,
    lastCount: count,
    lastMode: mode,
    runs: (state.runs || 0) + 1,
  });

  return { ran: true, fileName, count, mode };
}

/** حجم الأرشيف الداخلي بالكيلوبايت — للعرض في الإعدادات. */
export function snapshotsSizeKb(): number {
  const total = readSnapshots().reduce((sum, s) => sum + s.json.length, 0);
  return Math.round(total / 1024);
}
