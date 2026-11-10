// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { deferNonCriticalWork } from '../../src/utils/deferredWork';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('تأجيل العمل غير الحرج بعد الرسم الأول', () => {
  it('لا يفعل شيئاً في بيئة بلا window ويعيد منظفاً آمناً', () => {
    const callback = vi.fn();
    vi.stubGlobal('window', undefined);

    const cleanup = deferNonCriticalWork(callback);
    cleanup();

    expect(callback).not.toHaveBeenCalled();
  });

  it('ينتظر التأخير قبل التنفيذ حين لا يدعم المتصفح وقت الخمول', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

    const cleanup = deferNonCriticalWork(callback, 40);
    vi.advanceTimersByTime(39);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    cleanup();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('يمرر العمل إلى requestIdleCallback ويلغي المعرف عند إزالة المكوّن', () => {
    let afterPaint: (() => void) | undefined;
    let idleCallback: (() => void) | undefined;
    const host = {
      setTimeout: vi.fn((callback: () => void, delay?: number) => {
        expect(delay).toBe(25);
        afterPaint = callback;
        return 7;
      }),
      clearTimeout: vi.fn(),
      requestIdleCallback: vi.fn((callback: () => void, options?: { timeout: number }) => {
        expect(options).toEqual({ timeout: 1200 });
        idleCallback = callback;
        return 11;
      }),
      cancelIdleCallback: vi.fn(),
    };
    const callback = vi.fn();

    const cleanup = deferNonCriticalWork(callback, 25, host);
    expect(callback).not.toHaveBeenCalled();

    afterPaint?.();
    expect(host.requestIdleCallback).toHaveBeenCalledTimes(1);
    expect(callback).not.toHaveBeenCalled();

    idleCallback?.();
    expect(callback).toHaveBeenCalledTimes(1);
    cleanup();
    expect(host.clearTimeout).toHaveBeenCalledWith(7);
    expect(host.cancelIdleCallback).toHaveBeenCalledWith(11);
  });

  it('ينظف مؤقت ما قبل الخمول حتى إن غابت دالة الإلغاء الاختيارية', () => {
    let afterPaint: (() => void) | undefined;
    const host = {
      setTimeout: vi.fn((callback: () => void) => {
        afterPaint = callback;
        return 3;
      }),
      clearTimeout: vi.fn(),
      requestIdleCallback: vi.fn(() => 9),
    };

    const cleanup = deferNonCriticalWork(vi.fn(), 0, host);
    afterPaint?.();
    expect(() => cleanup()).not.toThrow();
    expect(host.clearTimeout).toHaveBeenCalledWith(3);
  });
});
