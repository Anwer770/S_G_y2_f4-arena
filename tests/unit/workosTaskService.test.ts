import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkTask } from '../../src/types/workos';

const loaders = vi.hoisted(() => ({
  loadTasks: vi.fn(),
  saveTasks: vi.fn(),
  saveTasksWithoutEvents: vi.fn(),
}));

vi.mock('../../src/utils/workos/workosLoaders', () => loaders);

import { completeWorkOSTask, toggleWorkOSTaskCompletion } from '../../src/services/workos/WorkOSTaskService';
import { publishDomainEvent, subscribeDomainEvents } from '../../src/utils/automation/automationEvents';
import type { DomainEvent } from '../../src/utils/automation/automationTypes';

let emittedEvents: DomainEvent[] = [];
let unsubscribeFromEvents: (() => void) | undefined;

const task = (overrides: Partial<WorkTask> = {}): WorkTask => ({
  id: 'WORK-1001',
  taskNumber: 'TSK-1001',
  title: 'مهمة WorkOS',
  description: 'وصف المهمة',
  status: 'in_progress',
  priority: 'high',
  category: 'تشغيل',
  tags: [],
  assigneeId: 'USR-1',
  dueDate: '2026-11-10',
  progress: 25,
  subtasks: [],
  checklist: [],
  comments: [],
  createdAt: '2026-11-07T08:00:00.000Z',
  updatedAt: '2026-11-07T08:00:00.000Z',
  ...overrides,
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-07T12:00:00.000Z'));
  emittedEvents = [];
  unsubscribeFromEvents = subscribeDomainEvents((event) => emittedEvents.push(event));
  loaders.loadTasks.mockReset().mockReturnValue([]);
  // يحاكي المسار الصاخب كي يكشف الاختبار فوراً أي رجوع غير مقصود إلى saveTasks.
  loaders.saveTasks.mockReset().mockImplementation(() => {
    publishDomainEvent({ type: 'task_updated', entityType: 'task', entityId: 'unexpected-save' });
  });
  loaders.saveTasksWithoutEvents.mockReset();
});

afterEach(() => {
  unsubscribeFromEvents?.();
  unsubscribeFromEvents = undefined;
  vi.useRealTimers();
});

describe('R80 — خدمة إكمال مهمة WorkOS', () => {
  it('يبدّل المكتملة عبر taskNumber إلى قيد التنفيذ، ويكمل غير المكتملة عبر id من دون لمس بقية القائمة', () => {
    const done = task({ id: 'WORK-DONE', taskNumber: 'TSK-DONE', status: 'completed', progress: 100 });
    const active = task({ id: 'WORK-ACTIVE', taskNumber: 'TSK-ACTIVE' });
    loaders.loadTasks.mockReturnValue([done, active]);

    expect(toggleWorkOSTaskCompletion('TSK-DONE')).toBe(true);
    expect(loaders.saveTasksWithoutEvents).toHaveBeenCalledWith([
      expect.objectContaining({
        id: done.id,
        status: 'in_progress',
        progress: 50,
        updatedAt: '2026-11-07T12:00:00.000Z',
      }),
      active,
    ]);
    expect(done).toMatchObject({ status: 'completed', progress: 100, updatedAt: '2026-11-07T08:00:00.000Z' });

    expect(toggleWorkOSTaskCompletion(active.id)).toBe(true);
    expect(loaders.saveTasksWithoutEvents).toHaveBeenLastCalledWith([
      done,
      expect.objectContaining({
        id: active.id,
        status: 'completed',
        progress: 100,
        updatedAt: '2026-11-07T12:00:00.000Z',
      }),
    ]);
    expect(loaders.saveTasks).not.toHaveBeenCalled();
    expect(emittedEvents).toEqual([]);
  });

  it('يكمل المهمة بالـtaskNumber حتى لو كانت حالتها السابقة مختلفة، عبر المسار الصامت وحده', () => {
    const target = task({ id: 'WORK-BLOCKED', taskNumber: 'TSK-BLOCKED', status: 'blocked', progress: 10 });
    const other = task({ id: 'WORK-OTHER', taskNumber: 'TSK-OTHER', status: 'planned', progress: 0 });
    loaders.loadTasks.mockReturnValue([target, other]);

    expect(completeWorkOSTask(target.taskNumber)).toBe(true);
    expect(loaders.saveTasksWithoutEvents).toHaveBeenCalledOnce();
    expect(loaders.saveTasksWithoutEvents).toHaveBeenCalledWith([
      expect.objectContaining({
        id: target.id,
        status: 'completed',
        progress: 100,
        updatedAt: '2026-11-07T12:00:00.000Z',
      }),
      other,
    ]);
    expect(loaders.saveTasks).not.toHaveBeenCalled();
    expect(emittedEvents).toEqual([]);
  });

  it('لا يكتب ولا يطلق أثراً عند غياب المهمة في مساري التبديل والإكمال', () => {
    loaders.loadTasks.mockReturnValue([task()]);

    expect(toggleWorkOSTaskCompletion('غير-موجود')).toBe(false);
    expect(completeWorkOSTask('غير-موجود')).toBe(false);
    expect(loaders.saveTasksWithoutEvents).not.toHaveBeenCalled();
    expect(loaders.saveTasks).not.toHaveBeenCalled();
    expect(emittedEvents).toEqual([]);
  });
});
