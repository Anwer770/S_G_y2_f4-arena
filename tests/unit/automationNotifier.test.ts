// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AUTOMATION_UPDATED_EVENT,
  notifyAutomationUpdated,
  onAutomationUpdated,
} from '../../src/utils/automation/automationNotifier';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('R86 — إشعار واجهة الأتمتة', () => {
  it('ينشر التفاصيل للمشترك، ويمرر undefined عند غيابها، ويلغي الاشتراك بلا تسريب', () => {
    const handler = vi.fn();
    const unsubscribe = onAutomationUpdated(handler);

    notifyAutomationUpdated({ executed: 2, failed: 1 });
    notifyAutomationUpdated();
    expect(handler).toHaveBeenNthCalledWith(1, { executed: 2, failed: 1 });
    expect(handler).toHaveBeenNthCalledWith(2, undefined);

    unsubscribe();
    unsubscribe();
    notifyAutomationUpdated({ executed: 3 });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('لا يحاول النشر أو الاشتراك خارج المتصفح، ودالة الإلغاء الناتجة آمنة', () => {
    vi.stubGlobal('window', undefined);

    expect(() => notifyAutomationUpdated({ failed: 1 })).not.toThrow();
    expect(() => onAutomationUpdated(vi.fn())()).not.toThrow();
  });

  it('يحتوي غياب CustomEvent ولا يرمي إلى المشغّل', () => {
    vi.stubGlobal('CustomEvent', undefined);

    expect(() => notifyAutomationUpdated({ executed: 1 })).not.toThrow();
  });

  it('يحتوي فشل dispatchEvent ولا يترك خطأ DOM يوقف مسار الأتمتة', () => {
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => {
      throw new Error('dispatch failed');
    });

    expect(() => notifyAutomationUpdated({ failed: 1 })).not.toThrow();
    expect(window.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: AUTOMATION_UPDATED_EVENT }));
  });
});
