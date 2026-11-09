/**
 * مخزن نقاط الاستعادة (R40) — مفتاح واحد خارج المكوّنات.
 *
 * `DatabasesTab` كان يقرأ ويكتب مفتاح `nova_erp_cloud_snapshots_v2` مباشرةً.
 * المفتاح الآن هنا وحده، والمكوّن يتعامل مع دوال بلا معرفة بأي مفتاح.
 * **لا تغيير سلوك:** القراءة تُعيد `[]` عند غياب المفتاح أو تلفه (لا ترمي)،
 * والكتابة تستبدل القائمة كاملة — تماماً كالسابق.
 */
import { dbStorage } from '../../database/dbStorage';
import type { EncryptedSnapshotPayload } from '../../utils/snapshotCrypto';
import type { UnifiedBackupState } from '../../types';

/** مفتاح نقاط الاستعادة — لا يُكرَّر في أي مكوّن. */
export const SNAPSHOTS_STORAGE_KEY = 'nova_erp_cloud_snapshots_v2';

export interface CloudSnapshot {
  id: string;
  name: string;
  timestamp: string;
  totalRecords: number;
  sizeKb: number;
  isEncrypted: boolean;
  /** نقطة غير مشفّرة (السلوك القديم — تُحفظ كما هي) */
  data?: UnifiedBackupState | null;
  /** نقطة مشفّرة فعلياً (AES-GCM) — لا تحتوي أي بيانات صريحة */
  payload?: EncryptedSnapshotPayload | null;
}

/** يقرأ النقاط المحفوظة. القيمة الغائبة/التالفة/غير المصفوفية ⇒ `[]`. */
export function loadSnapshots(): CloudSnapshot[] {
  try {
    const raw = dbStorage.getItem(SNAPSHOTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CloudSnapshot[]) : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

/** يستبدل القائمة كاملة. */
export function saveSnapshots(snapshots: CloudSnapshot[]): void {
  try {
    dbStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(snapshots));
  } catch (e) {
    console.error(e);
  }
}
