import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AutomationSweepResult, DomainEvent } from '../../src/utils/automation/automationTypes';

const mocks = vi.hoisted(() => ({
  listener: undefined as ((event: DomainEvent) => void) | undefined,
  unsubscribe: vi.fn(),
  subscribe: vi.fn(),
  countListeners: vi.fn(),
  publish: vi.fn(),
  process: vi.fn(),
  sweep: vi.fn(),
  loadRuns: vi.fn(),
  saveRuns: vi.fn(),
  readBootDate: vi.fn(),
  writeBootDate: vi.fn(),
  defaultDeps: { origin: 'test' },
}));

vi.mock('../../src/utils/automation/automationEvents', () => ({
  subscribeDomainEvents: mocks.subscribe,
  countDomainEventListeners: mocks.countListeners,
  publishDomainEvent: mocks.publish,
}));
vi.mock('../../src/utils/automation/automationRunner', () => ({
  processDomainEvent: mocks.process,
  sweepOverdueTasks: mocks.sweep,
  defaultAutomationDeps: mocks.defaultDeps,
}));
vi.mock('../../src/utils/automation/automationStore', () => ({
  loadAutomationRuns: mocks.loadRuns,
  saveAutomationRuns: mocks.saveRuns,
}));
vi.mock('../../src/database/repositories/ValueRepository', () => ({
  createValueRepository: vi.fn(() => ({ readRaw: mocks.readBootDate, write: mocks.writeBootDate })),
}));

import {
  getAutomationDiagnostics,
  getLastSweepResult,
  isAutomationRuntimeStarted,
  startAutomationRuntime,
  stopAutomationRuntime,
} from '../../src/utils/automation/automationRuntime';

const sweep: AutomationSweepResult = { evaluatedRules: 2, executed: 1, failed: 0, duplicates: 1, runs: [] };
const event: DomainEvent = {
  id: 'evt-1',
  at: '2026-11-07T08:00:00.000Z',
  origin: 'user',
  type: 'task_completed',
  entityType: 'task',
  entityId: 'task-1',
};

beforeEach(() => {
  stopAutomationRuntime();
  vi.clearAllMocks();
  mocks.listener = undefined;
  mocks.subscribe.mockImplementation((listener) => {
    mocks.listener = listener;
    return mocks.unsubscribe;
  });
  mocks.countListeners.mockReturnValue(1);
  mocks.sweep.mockReturnValue(sweep);
  mocks.loadRuns.mockReturnValue([]);
  mocks.readBootDate.mockReturnValue(null);
});

afterEach(() => {
  stopAutomationRuntime();
  vi.restoreAllMocks();
});

describe('R84 — زمن تشغيل مشغّل الأتمتة', () => {
  it('يبدأ مرة واحدة، يمسح المتأخرات، ويسجل وينشر بداية اليوم؛ وإيقاف أي مستدعٍ يعيد الحالة سليمة', () => {
    const stopFirst = startAutomationRuntime('2026-11-07');
    const stopRepeated = startAutomationRuntime('2026-11-07');

    expect(isAutomationRuntimeStarted()).toBe(true);
    expect(mocks.subscribe).toHaveBeenCalledOnce();
    expect(mocks.sweep).toHaveBeenCalledWith('2026-11-07', mocks.defaultDeps);
    expect(getLastSweepResult()).toEqual(sweep);
    expect(mocks.writeBootDate).toHaveBeenCalledWith('2026-11-07');
    expect(mocks.publish).toHaveBeenCalledWith({
      type: 'daily_plan_start',
      entityType: 'system',
      entityId: '2026-11-07',
      title: 'خطة يوم 2026-11-07',
      origin: 'system',
      data: { today: '2026-11-07' },
    });

    stopRepeated();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
    expect(isAutomationRuntimeStarted()).toBe(false);
    stopFirst();
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('يمرر الأحداث للمشغّل، ويعزل فشل المشغّل حتى لا يسقط ناقل الأحداث', () => {
    startAutomationRuntime('2026-11-07');
    mocks.listener?.(event);
    expect(mocks.process).toHaveBeenCalledWith(event, mocks.defaultDeps);

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mocks.process.mockImplementationOnce(() => {
      throw new Error('runner failed');
    });
    mocks.listener?.(event);
    expect(warn).toHaveBeenCalledWith('automation: processDomainEvent failed', expect.any(Error));
  });

  it('لا يكرر حدث بداية اليوم إذا كان التاريخ مخزناً، ويستعمل تاريخ UTC الافتراضي عند عدم الحقن', () => {
    mocks.readBootDate.mockReturnValue('2026-11-07');
    startAutomationRuntime('2026-11-07');
    expect(mocks.writeBootDate).not.toHaveBeenCalled();
    expect(mocks.publish).not.toHaveBeenCalled();
    stopAutomationRuntime();

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-08T12:00:00.000Z'));
    mocks.readBootDate.mockReturnValue('2026-11-07');
    startAutomationRuntime();
    expect(mocks.sweep).toHaveBeenLastCalledWith('2026-11-08', mocks.defaultDeps);
    vi.useRealTimers();
  });

  it('يحذر بأمان عند فشل المسح أو قراءة/كتابة تاريخ الإقلاع أو نشر حدث اليوم', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mocks.sweep.mockImplementation(() => {
      throw new Error('sweep failed');
    });
    mocks.readBootDate.mockImplementation(() => {
      throw new Error('read failed');
    });
    startAutomationRuntime('2026-11-07');
    expect(warn).toHaveBeenCalledWith('automation: overdue sweep failed', expect.any(Error));
    expect(warn).toHaveBeenCalledWith('automation: daily plan event failed', expect.any(Error));
    stopAutomationRuntime();

    mocks.readBootDate.mockReturnValue(null);
    mocks.writeBootDate.mockImplementationOnce(() => {
      throw new Error('write failed');
    });
    startAutomationRuntime('2026-11-08');
    expect(warn).toHaveBeenCalledWith('automation: daily plan event failed', expect.any(Error));
    stopAutomationRuntime();

    mocks.publish.mockImplementationOnce(() => {
      throw new Error('publish failed');
    });
    startAutomationRuntime('2026-11-09');
    expect(warn).toHaveBeenCalledWith('automation: daily plan event failed', expect.any(Error));
  });

  it('يعيد التشخيص من حالة المشغّل وعدد المستمعين وعدد السجلات، ويصفر العد عند فشل القراءة', () => {
    mocks.countListeners.mockReturnValue(3);
    mocks.loadRuns.mockReturnValue([{ key: 'one' }, { key: 'two' }]);
    expect(getAutomationDiagnostics()).toEqual({ started: false, listeners: 3, runs: 2 });

    startAutomationRuntime('2026-11-07');
    expect(getAutomationDiagnostics()).toEqual({ started: true, listeners: 3, runs: 2 });
    mocks.loadRuns.mockImplementation(() => {
      throw new Error('runs unavailable');
    });
    expect(getAutomationDiagnostics()).toEqual({ started: true, listeners: 3, runs: 0 });

    stopAutomationRuntime();
    stopAutomationRuntime();
    expect(isAutomationRuntimeStarted()).toBe(false);
  });
});
