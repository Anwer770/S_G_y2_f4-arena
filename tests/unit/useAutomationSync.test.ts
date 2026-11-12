// @vitest-environment jsdom
import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkOSData } from '../../src/types/workos';

const mocks = vi.hoisted(() => ({
  subscribers: new Set<() => void>(),
  unsubscribe: vi.fn(),
  onUpdated: vi.fn(),
  loadAutomations: vi.fn(),
  loadTasks: vi.fn(),
}));

vi.mock('../../src/utils/automation', () => ({ onAutomationUpdated: mocks.onUpdated }));
vi.mock('../../src/utils/workos/workosLoaders', () => ({
  loadAutomations: mocks.loadAutomations,
  loadTasks: mocks.loadTasks,
}));

import { useAutomationSync } from '../../src/components/workos/useAutomationSync';

function Harness({ setData }: { setData: React.Dispatch<React.SetStateAction<WorkOSData>> }): null {
  useAutomationSync(setData);
  return null;
}

const previous = {
  currentWorkspaceId: 'workspace-before',
  tasks: [{ id: 'task-before' }],
  automations: [{ id: 'rule-before' }],
  untouched: 'يبقى كما هو',
} as unknown as WorkOSData;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.subscribers.clear();
  mocks.onUpdated.mockImplementation((callback) => {
    mocks.subscribers.add(callback);
    return () => {
      mocks.unsubscribe();
      mocks.subscribers.delete(callback);
    };
  });
  mocks.loadAutomations.mockReturnValue([{ id: 'rule-after' }]);
  mocks.loadTasks.mockReturnValue([{ id: 'task-after' }]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('R87 — مزامنة واجهة الأتمتة', () => {
  it('يشترك مرة واحدة، ويعيد تحميل المهام والقواعد بعد الإشعار مع حفظ بقية حالة WorkOS', () => {
    const setData = vi.fn();
    const view = render(React.createElement(Harness, { setData }));

    expect(mocks.onUpdated).toHaveBeenCalledOnce();
    act(() => mocks.subscribers.forEach((callback) => callback()));

    const update = setData.mock.calls[0][0] as (current: WorkOSData) => WorkOSData;
    expect(update(previous)).toEqual({
      ...previous,
      automations: [{ id: 'rule-after' }],
      tasks: [{ id: 'task-after' }],
    });
    expect(mocks.loadAutomations).toHaveBeenCalledOnce();
    expect(mocks.loadTasks).toHaveBeenCalledOnce();

    view.unmount();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
    act(() => mocks.subscribers.forEach((callback) => callback()));
    expect(setData).toHaveBeenCalledOnce();
  });

  it('ينظف الاشتراك القديم ويشترك مجدداً فقط عند تبديل دالة تحديث الحالة', () => {
    const firstSetData = vi.fn();
    const secondSetData = vi.fn();
    const view = render(React.createElement(Harness, { setData: firstSetData }));

    view.rerender(React.createElement(Harness, { setData: secondSetData }));
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
    expect(mocks.onUpdated).toHaveBeenCalledTimes(2);

    act(() => mocks.subscribers.forEach((callback) => callback()));
    expect(firstSetData).not.toHaveBeenCalled();
    expect(secondSetData).toHaveBeenCalledOnce();

    view.unmount();
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(2);
  });
});
