import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AutomationRun } from '../../src/utils/automation/automationTypes';

const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  write: vi.fn(),
  createCollectionRepository: vi.fn(),
}));

vi.mock('../../src/database/repositories/CollectionRepository', () => {
  mocks.createCollectionRepository.mockReturnValue({ read: mocks.read, write: mocks.write });
  return { createCollectionRepository: mocks.createCollectionRepository };
});

import { lastRunForRule, loadAutomationRuns, saveAutomationRuns } from '../../src/utils/automation/automationStore';

const run = (id: number, ruleId = 'rule-a'): AutomationRun => ({
  key: `run-${id}`,
  ruleId,
  ruleName: `قاعدة ${ruleId}`,
  actionType: 'notify_team',
  eventType: 'task_completed',
  entityType: 'task',
  entityId: `task-${id}`,
  executedAt: `2026-11-07T08:${String(id).padStart(2, '0')}:00.000Z`,
  outcome: 'executed',
});

beforeEach(() => {
  mocks.read.mockReset();
  mocks.read.mockReturnValue([]);
  mocks.write.mockReset();
});

describe('R85 — سجل تشغيل الأتمتة', () => {
  it('يقرأ السجل كما يقدمه مستودع المجموعات', () => {
    const runs = [run(1), run(2, 'rule-b')];
    mocks.read.mockReturnValue(runs);

    expect(loadAutomationRuns()).toBe(runs);
    expect(mocks.read).toHaveBeenCalledOnce();
  });

  it('يحفظ السجل كاملاً دون السقف، ويقصّ الجديد إلى أول 200 سطر فقط', () => {
    const shortRuns = [run(1), run(2)];
    saveAutomationRuns(shortRuns);
    expect(mocks.write).toHaveBeenLastCalledWith(shortRuns);

    const oversized = Array.from({ length: 201 }, (_, index) => run(index));
    saveAutomationRuns(oversized);
    expect(mocks.write).toHaveBeenLastCalledWith(oversized.slice(0, 200));
    expect(mocks.write.mock.calls.at(-1)?.[0]).not.toContainEqual(oversized[200]);
  });

  it('يعيد أحدث سطر للقاعدة من القائمة المرتبة، أو null عند عدم وجودها', () => {
    const newest = run(2, 'rule-a');
    const runs = [newest, run(1, 'rule-b'), run(0, 'rule-a')];

    expect(lastRunForRule('rule-a', runs)).toBe(newest);
    expect(lastRunForRule('missing', runs)).toBeNull();
    expect(mocks.read).not.toHaveBeenCalled();
  });

  it('يقرأ السجل الافتراضي عند حذف وسيط البحث عن آخر تشغيل', () => {
    const stored = [run(1, 'rule-b'), run(0, 'rule-a')];
    mocks.read.mockReturnValue(stored);

    expect(lastRunForRule('rule-a')).toBe(stored[1]);
    expect(mocks.read).toHaveBeenCalledOnce();
  });
});
