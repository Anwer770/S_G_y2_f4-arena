/**
 * مخزن القوائم والثوابت — طبقة الربط بين المنطق النقي والواجهات.
 *
 * التصميم: External Store صغير مبني على `useSyncExternalStore` (بلا مكتبة حالة إضافية)،
 * لذا أي تعديل من تبويب «القوائم والثوابت» يصل فوراً إلى **كل** القوائم المنسدلة في النظام
 * لأنها تقرأ من نفس المصدر وتشترك في نفس الاشتراك.
 *
 * - الحفظ: `suite_lookups_v1` عبر `createObjectRepository` (IndexedDB + مرآة localStorage).
 * - التدقيق: كل عملية تُسجَّل في السجل المركزي (`auditService`).
 * - النسخ الاحتياطي: تُدرَج في `createUnifiedBackup` وتُستعاد معه.
 */
import { useSyncExternalStore } from 'react';
import { createObjectRepository } from '../database/repositories/ObjectRepository';
import { auditService } from '../core/audit/AuditService';
import { LOOKUPS_STORAGE_KEY, type LookupKind, type LookupsState } from '../constants/lookups';
import {
  addLookup,
  cloneDefaults,
  moveLookup,
  normalizeLookups,
  patchLookup,
  removeLookup,
  renameLookup,
  replaceLookupList,
} from './lookupsLogic';

/** حالة القوائم ككائن واحد (R42) — القراءة تُعيد الكائن كما هو ثم يُطبَّع في الذاكرة. */
const lookupsRepo = createObjectRepository<Record<string, unknown>>({
  key: LOOKUPS_STORAGE_KEY,
  defaults: {},
  noMerge: true,
});

const listeners = new Set<() => void>();
let state: LookupsState | null = null;

const emit = () => listeners.forEach((l) => l());

/** يقرأ من التخزين مرة واحدة ثم يحتفظ بالنسخة في الذاكرة. */
export function getLookups(): LookupsState {
  if (state) return state;
  const stored = lookupsRepo.read();
  state = Object.keys(stored).length > 0 ? normalizeLookups(stored) : cloneDefaults();
  return state;
}

function commit(next: LookupsState, action: string, details: string): LookupsState {
  state = { ...next, updatedAt: new Date().toISOString() };
  lookupsRepo.write(state as unknown as Record<string, unknown>);
  auditService.log({ action: 'Update', entity: 'MasterLookups', details: `${action} — ${details}` });
  emit();
  return state;
}

/** يُستدعى من الاستيراد/النسخة الاحتياطية مباشرة. */
export function setLookups(next: unknown): LookupsState {
  return commit(normalizeLookups(next), 'استبدال كامل', 'استعادة من نسخة احتياطية');
}

export const lookupsActions = {
  add(kind: LookupKind, label: string, extra?: { tone?: LookupsState['grades'][number]['tone']; hint?: string }) {
    const { state: next, item } = addLookup(getLookups(), kind, label, extra);
    return commit(next, 'إضافة', `${kind}: ${item.label}`);
  },
  rename(kind: LookupKind, id: string, label: string) {
    return commit(renameLookup(getLookups(), kind, id, label), 'تعديل', `${kind}: ${label}`);
  },
  patch(kind: LookupKind, id: string, patch: Parameters<typeof patchLookup>[3]) {
    return commit(patchLookup(getLookups(), kind, id, patch), 'تعديل', `${kind}: ${id}`);
  },
  remove(kind: LookupKind, id: string) {
    const current = getLookups();
    const target = (kind === 'grades' ? current.grades : current[kind]).find((i) => i.id === id);
    return commit(removeLookup(current, kind, id), 'حذف', `${kind}: ${target?.label || id}`);
  },
  move(kind: LookupKind, id: string, direction: -1 | 1) {
    return commit(moveLookup(getLookups(), kind, id, direction), 'ترتيب', `${kind}: ${id}`);
  },
  replaceList(kind: LookupKind, labels: string[]) {
    return commit(replaceLookupList(getLookups(), kind, labels), 'استبدال قائمة', `${kind}: ${labels.length}`);
  },
  reset() {
    return commit(cloneDefaults(), 'إعادة ضبط', 'القوائم الافتراضية');
  },
};

/** Hook للواجهات: يُعيد الحالة الحالية ويُعيد الرسم عند أي تغيير. */
export function useLookups() {
  const snapshot = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => getLookups(),
    () => getLookups()
  );
  return { lookups: snapshot, actions: lookupsActions };
}

/** للتثبيت عند الإقلاع (يضمن تحميل النسخة المحفوظة قبل أول رسم). */
export const initLookups = (): void => {
  void getLookups();
};
