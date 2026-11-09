/**
 * إشعار الواجهة بتغيّر نتائج الأتمتة (R31).
 *
 * المشغّل يكتب عدّادات القواعد وسجل التشغيل في التخزين مباشرةً، بينما شاشة «إدارة العمل»
 * تحتفظ بنسخة React من البيانات. بلا هذا الإشعار تُكتب النسخة القديمة فوق العدّادات
 * الجديدة عند أول حفظ تالٍ — وهو عطب صامت يمحو أثر الأتمتة.
 */
export const AUTOMATION_UPDATED_EVENT = 'workos:automation-updated';

export function notifyAutomationUpdated(detail?: { executed?: number; failed?: number }): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(AUTOMATION_UPDATED_EVENT, { detail }));
  } catch {
    /* بيئة بلا CustomEvent — لا شيء لفعله */
  }
}

/** يشترك في إشعار تحديث الأتمتة ويعيد دالة إلغاء. */
export function onAutomationUpdated(handler: (detail?: { executed?: number; failed?: number }) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (event: Event) => handler((event as CustomEvent).detail);
  window.addEventListener(AUTOMATION_UPDATED_EVENT, listener);
  return () => window.removeEventListener(AUTOMATION_UPDATED_EVENT, listener);
}
