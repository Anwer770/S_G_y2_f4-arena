/**
 * R58 — يؤخر الوحدات غير الحرجة حتى ترسم الواجهة الأولى.
 *
 * لا نستدعي import الديناميكي أثناء تقييم الحزمة الابتدائية؛ نستدعيه بعد paint ثم في
 * وقت خمول المتصفح حيثما كان متاحاً. يعيد الدالة دائماً منظفاً كي لا تُحدَّث حالة React
 * بعد إزالة المكوّن.
 */
type IdleCallbackHost = {
  setTimeout: (callback: () => void, delay?: number) => number;
  clearTimeout: (id: number) => void;
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

const getBrowserHost = (): IdleCallbackHost | undefined => {
  if (typeof window === 'undefined') return undefined;
  return window as unknown as IdleCallbackHost;
};

export function deferNonCriticalWork(
  callback: () => void,
  delay = 0,
  host: IdleCallbackHost | undefined = getBrowserHost()
): () => void {
  if (!host) return () => undefined;

  let idleId: number | undefined;
  const timerId = host.setTimeout(() => {
    if (typeof host.requestIdleCallback === 'function') {
      idleId = host.requestIdleCallback(callback, { timeout: 1200 });
      return;
    }
    callback();
  }, delay);

  return () => {
    host.clearTimeout(timerId);
    if (idleId !== undefined && typeof host.cancelIdleCallback === 'function') {
      host.cancelIdleCallback(idleId);
    }
  };
}
