/**
 * مخزن نقاط الاستعادة (R40) — مفتاح واحد خارج المكوّنات.
 *
 * `DatabasesTab` كان يقرأ ويكتب مفتاح `nova_erp_cloud_snapshots_v2` مباشرةً.
 * المفتاح الآن هنا وحده، والمكوّن يتعامل مع دوال بلا معرفة بأي مفتاح.
 * **لا تغيير سلوك:** القراءة تُعيد `[]` عند غياب المفتاح أو تلفه (لا ترمي)،
 * والكتابة تستبدل القائمة كاملة — تماماً كالسابق.
 */
import { createCollectionRepository } from '../../database/repositories/CollectionRepository';
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

/** النقاط المحفوظة: الفراغ مقبول، والغائب/التالف/غير المصفوفي ⇒ `[]`. */
const snapshotsRepo = createCollectionRepository<CloudSnapshot>({
  key: SNAPSHOTS_STORAGE_KEY,
  fallback: [],
});

/** يقرأ النقاط المحفوظة. القيمة الغائبة/التالفة/غير المصفوفية ⇒ `[]`. */
export function loadSnapshots(): CloudSnapshot[] {
  return snapshotsRepo.read();
}

/** يستبدل القائمة كاملة. */
export function saveSnapshots(snapshots: CloudSnapshot[]): void {
  snapshotsRepo.write(snapshots);
}
