/**
 * قناة القوائم الفرعية (R22): مصدر حالة صغير بين الدرج الجانبي والوحدات.
 * الوحدة تنشر تبويبها الحالي، والدرج يطلب تبديله — بلا تمرير props عبر 5 طبقات.
 */
import { useEffect, useSyncExternalStore } from 'react';

const active = new Map<string, string>();
const listeners = new Set<() => void>();
export const SUBTAB_EVENT = 'suite:subtab';

const emit = () => listeners.forEach((l) => l());

export function publishSubTab(moduleTab: string, subId: string): void {
  if (active.get(moduleTab) === subId) return;
  active.set(moduleTab, subId);
  emit();
}

export function getSubTab(moduleTab: string): string | undefined {
  return active.get(moduleTab);
}

export function requestSubTab(moduleTab: string, subId: string): void {
  publishSubTab(moduleTab, subId);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SUBTAB_EVENT, { detail: { moduleTab, subId } }));
  }
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useActiveSubTab(moduleTab: string): string | undefined {
  return useSyncExternalStore(
    subscribe,
    () => active.get(moduleTab),
    () => active.get(moduleTab)
  );
}

/**
 * يُركَّب داخل الوحدة: ينشر التبويب الحالي ويستقبل طلبات الدرج.
 */
export function useSubTabSync<T extends string>(moduleTab: string, value: T, setValue: (next: T) => void): void {
  useEffect(() => {
    publishSubTab(moduleTab, value);
  }, [moduleTab, value]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ moduleTab: string; subId: string }>).detail;
      if (detail?.moduleTab === moduleTab) setValue(detail.subId as T);
    };
    window.addEventListener(SUBTAB_EVENT, handler);
    return () => window.removeEventListener(SUBTAB_EVENT, handler);
  }, [moduleTab, setValue]);
}
