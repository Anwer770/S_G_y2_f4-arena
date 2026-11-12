// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_COMMITMENTS } from '../../src/data/defaultCommitments';
import { DEFAULT_TASKS, TASK_ASSIGNEES, TASK_CATEGORIES, TASK_OPERATIONS } from '../../src/data/defaultTasks';
import { dbStorage } from '../../src/database/dbStorage';
import type { TaskAuditLog } from '../../src/types';
import {
  loadCommitments,
  loadTaskAssignees,
  loadTaskAuditLogs,
  loadTaskCategories,
  loadTaskOperations,
  loadTasks,
  logTaskAudit,
  saveCommitments,
  saveTaskAssignees,
  saveTaskAuditLogs,
  saveTaskCategories,
  saveTaskOperations,
  saveTasks,
} from '../../src/utils/storage/tasks';
import { STORAGE_KEYS } from '../../src/utils/storage/keys';

beforeEach(() => {
  dbStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-07T12:00:00.000Z'));
});

afterEach(() => {
  dbStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('R73 — استمرارية دفتر المهام والالتزامات', () => {
  it('يفصل الغياب عن الفراغ: المهام والالتزامات وقوائمها تعود للبذور، أما التدقيق ففارغ مشروع', () => {
    expect(loadTasks()).toEqual(DEFAULT_TASKS);
    expect(loadCommitments()).toEqual(DEFAULT_COMMITMENTS);
    expect(loadTaskCategories()).toEqual(TASK_CATEGORIES);
    expect(loadTaskOperations()).toEqual(TASK_OPERATIONS);
    expect(loadTaskAssignees()).toEqual(TASK_ASSIGNEES);
    expect(loadTaskAuditLogs()).toEqual([expect.objectContaining({ id: 'TAUD-001', action: 'نظام' })]);

    saveTasks([]);
    saveCommitments([]);
    saveTaskCategories([]);
    saveTaskOperations([]);
    saveTaskAssignees([]);
    expect(loadTasks()).toEqual(DEFAULT_TASKS);
    expect(loadCommitments()).toEqual(DEFAULT_COMMITMENTS);
    expect(loadTaskCategories()).toEqual(TASK_CATEGORIES);
    expect(loadTaskOperations()).toEqual(TASK_OPERATIONS);
    expect(loadTaskAssignees()).toEqual(TASK_ASSIGNEES);

    saveTaskAuditLogs([]);
    expect(loadTaskAuditLogs()).toEqual([]);
  });

  it('يحفظ كل دفتر مهام على مفتاحه المستقل، ولا يخلط مهمة أو التزاماً أو قائمة خيارات بأخرى', () => {
    const task = { ...DEFAULT_TASKS[0]!, id: 'TASK-R73', title: 'مهمة محفوظة R73' };
    const commitment = { ...DEFAULT_COMMITMENTS[0]!, id: 'COM-R73' };

    saveTasks([task]);
    saveCommitments([commitment]);
    saveTaskCategories(['فئة R73']);
    saveTaskOperations(['عملية R73']);
    saveTaskAssignees(['مسؤول R73']);

    expect(loadTasks()).toEqual([task]);
    expect(loadCommitments()).toEqual([commitment]);
    expect(loadTaskCategories()).toEqual(['فئة R73']);
    expect(loadTaskOperations()).toEqual(['عملية R73']);
    expect(loadTaskAssignees()).toEqual(['مسؤول R73']);
    expect(dbStorage.getItem(STORAGE_KEYS.TASKS_COMMITMENTS)).not.toContain('مهمة محفوظة R73');
    expect(dbStorage.getItem(STORAGE_KEYS.TASKS_ITEMS)).not.toContain('COM-R73');
  });

  it('يرفض JSON التالف والشكل غير المصفوفي بأمان ولا يمرر بيانات دخيلة إلى دفتر المهام', () => {
    dbStorage.setItem(STORAGE_KEYS.TASKS_ITEMS, '{تالف');
    dbStorage.setItem(STORAGE_KEYS.TASKS_COMMITMENTS, JSON.stringify({ commitment: 'ليست قائمة' }));
    dbStorage.setItem(STORAGE_KEYS.TASKS_CATEGORIES, JSON.stringify({ category: 'ليست قائمة' }));
    dbStorage.setItem(STORAGE_KEYS.TASKS_OPERATIONS, '{تالف');
    dbStorage.setItem(STORAGE_KEYS.TASKS_ASSIGNEES, JSON.stringify({ assignee: 'ليست قائمة' }));
    dbStorage.setItem(STORAGE_KEYS.TASKS_AUDIT, JSON.stringify({ audit: 'ليست قائمة' }));

    expect(loadTasks()).toEqual(DEFAULT_TASKS);
    expect(loadCommitments()).toEqual(DEFAULT_COMMITMENTS);
    expect(loadTaskCategories()).toEqual(TASK_CATEGORIES);
    expect(loadTaskOperations()).toEqual(TASK_OPERATIONS);
    expect(loadTaskAssignees()).toEqual(TASK_ASSIGNEES);
    expect(loadTaskAuditLogs()).toEqual([expect.objectContaining({ id: 'TAUD-001' })]);
  });

  it('يكتب أحدث تدقيق أولاً، ويبقي معرفه فريداً حتى لحدثين في اللحظة نفسها، ويقص السجل إلى 500', () => {
    saveTaskAuditLogs([]);
    vi.spyOn(Date, 'now').mockReturnValue(1730000000000);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    logTaskAudit('إضافة', 'مهمة', 'مهمة أولى', 'حدث أول');
    const firstId = loadTaskAuditLogs()[0]!.id;
    saveTaskAuditLogs([
      {
        id: `${firstId}-1`,
        time: '2026-11-07T12:00:00.000Z',
        action: 'استيراد',
        entity: 'النظام',
        title: 'تضارب',
        details: 'لاحقة محجوزة',
      },
      ...loadTaskAuditLogs(),
    ]);
    logTaskAudit('تعديل', 'التزام', 'التزام ثان', 'حدث ثان');

    const newLogs = loadTaskAuditLogs();
    expect(newLogs).toEqual([
      expect.objectContaining({ id: `${firstId}-2`, action: 'تعديل', entity: 'التزام', title: 'التزام ثان' }),
      expect.objectContaining({ id: `${firstId}-1`, title: 'تضارب' }),
      expect.objectContaining({ id: firstId, action: 'إضافة', title: 'مهمة أولى', details: 'حدث أول' }),
    ]);
    expect(new Set(newLogs.map((entry) => entry.id)).size).toBe(3);

    const logs: TaskAuditLog[] = Array.from({ length: 501 }, (_, index) => ({
      id: `TAUD-R73-${index}`,
      time: '2026-11-07T12:00:00.000Z',
      action: 'تعديل',
      entity: 'مهمة',
      title: String(index),
      details: `تفصيل ${index}`,
    }));
    saveTaskAuditLogs(logs);
    expect(loadTaskAuditLogs()).toHaveLength(500);
    expect(loadTaskAuditLogs()[0]?.id).toBe('TAUD-R73-0');
    expect(loadTaskAuditLogs()[499]?.id).toBe('TAUD-R73-499');
  });

  it('يعزل البذور ومدخلات الحفظ والقراءة التالية عن تعديل المستهلك من دون حفظ صريح', () => {
    const originalTaskTitle = DEFAULT_TASKS[0]!.title;
    const originalCommitmentName = DEFAULT_COMMITMENTS[0]!.name;
    const originalCategory = TASK_CATEGORIES[0]!;
    const tasks = loadTasks();
    const commitments = loadCommitments();
    const categories = loadTaskCategories();
    tasks[0]!.title = 'تعديل لا يلوّث البذرة';
    commitments[0]!.name = 'تعديل لا يلوّث البذرة';
    categories[0] = 'فئة لا تلوّث البذرة';

    expect(DEFAULT_TASKS[0]!.title).toBe(originalTaskTitle);
    expect(DEFAULT_COMMITMENTS[0]!.name).toBe(originalCommitmentName);
    expect(TASK_CATEGORIES[0]).toBe(originalCategory);
    expect(loadTasks()[0]!.title).toBe(originalTaskTitle);
    expect(loadCommitments()[0]!.name).toBe(originalCommitmentName);
    expect(loadTaskCategories()[0]).toBe(originalCategory);

    const savedTasks = [{ ...DEFAULT_TASKS[0]!, id: 'TASK-IMMUTABLE' }];
    const savedCommitments = [{ ...DEFAULT_COMMITMENTS[0]!, id: 'COM-IMMUTABLE' }];
    saveTasks(savedTasks);
    saveCommitments(savedCommitments);
    savedTasks[0]!.title = 'تعديل الذاكرة بعد الحفظ';
    savedCommitments[0]!.name = 'تعديل الذاكرة بعد الحفظ';
    expect(loadTasks()[0]!.title).toBe(originalTaskTitle);
    expect(loadCommitments()[0]!.name).toBe(originalCommitmentName);
  });
});
