import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Commitment, Task } from '../../src/types';
import type { WorkProject, WorkTask } from '../../src/types/workos';
import { auditService, type CentralAuditEntry } from '../../src/core/audit/AuditService';
import {
  commitmentRepository,
  suiteTaskRepository,
  workProjectRepository,
  workTaskRepository,
} from '../../src/database/repositories/WorkTaskRepository';
import { TaskService } from '../../src/services/work/TaskService';
import { Outbox, type OutboxMutation } from '../../src/sync/Outbox';

const task = (overrides: Partial<Task> = {}): Task => ({
  id: 'T-1001',
  start: '2026-11-07',
  end: '2026-11-10',
  title: 'مهمة اختبار الخدمة',
  desc: 'وصف المهمة',
  cat: 'تشغيل',
  op: 'تنفيذ',
  pri: 'B',
  status: 'قيد التنفيذ',
  resp: 'أنور',
  ...overrides,
});

const commitment = (overrides: Partial<Commitment> = {}): Commitment => ({
  id: 'التزامات-101',
  name: 'التزام اختبار الخدمة',
  amount: 1000,
  pri: 'A',
  due: '2026-11-10',
  status: 'قيد التنفيذ',
  desc: 'وصف الالتزام',
  ...overrides,
});

const workTask = (overrides: Partial<WorkTask> = {}): WorkTask => ({
  id: 'WT-1001',
  taskNumber: 'WT-001',
  title: 'مهمة WorkOS',
  description: 'وصف WorkOS',
  status: 'planned',
  priority: 'medium',
  category: 'تشغيل',
  tags: ['اختبار'],
  assigneeId: 'USR-1',
  dueDate: '2026-11-10',
  progress: 0,
  subtasks: [],
  checklist: [],
  comments: [],
  createdAt: '2026-11-07T12:00:00.000Z',
  updatedAt: '2026-11-07T12:00:00.000Z',
  ...overrides,
});

const workProject = (overrides: Partial<WorkProject> = {}): WorkProject => ({
  id: 'WP-1001',
  code: 'WP-001',
  name: 'مشروع WorkOS',
  description: 'وصف المشروع',
  manager: 'أنور',
  startDate: '2026-11-07',
  dueDate: '2026-12-07',
  status: 'planned',
  priority: 'medium',
  progress: 0,
  category: 'تشغيل',
  ...overrides,
});

const effectSpies = () => ({
  audit: vi.spyOn(auditService, 'log').mockReturnValue({} as CentralAuditEntry),
  outbox: vi.spyOn(Outbox, 'enqueue').mockReturnValue({} as OutboxMutation),
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('R79 — خدمة المهام', () => {
  it('تقرأ دفاتر المهمة والالتزام ومهام ومشروعات WorkOS من مستودعاتها المنفصلة', () => {
    const service = new TaskService();
    const suiteEntry = task();
    const commitmentEntry = commitment();
    const workEntry = workTask();
    const projectEntry = workProject();

    vi.spyOn(suiteTaskRepository, 'getAll').mockReturnValue([suiteEntry]);
    vi.spyOn(commitmentRepository, 'getAll').mockReturnValue([commitmentEntry]);
    vi.spyOn(workTaskRepository, 'getAll').mockReturnValue([workEntry]);
    vi.spyOn(workProjectRepository, 'getAll').mockReturnValue([projectEntry]);

    expect(service.getAllTasks()).toEqual([suiteEntry]);
    expect(service.getAllCommitments()).toEqual([commitmentEntry]);
    expect(service.getAllWorkTasks()).toEqual([workEntry]);
    expect(service.getAllWorkProjects()).toEqual([projectEntry]);
  });

  it('يحفظ مهمة WorkOS ومشروعها في المستودع والطابور عند الإنشاء والتحديث، حتى عند fallback المستودع', () => {
    const service = new TaskService();
    const { outbox } = effectSpies();
    const workEntry = workTask();
    const savedWork = workTask({ title: 'مهمة WorkOS محفوظة' });
    const projectEntry = workProject();
    const savedProject = workProject({ name: 'مشروع WorkOS محفوظ' });

    const workGetById = vi.spyOn(workTaskRepository, 'getById').mockReturnValueOnce(null).mockReturnValue(workEntry);
    const workAdd = vi.spyOn(workTaskRepository, 'add').mockReturnValue(savedWork);
    const workUpdate = vi.spyOn(workTaskRepository, 'update').mockReturnValueOnce(savedWork).mockReturnValueOnce(null);
    expect(service.saveWorkTask(workEntry)).toEqual(savedWork);
    expect(service.saveWorkTask(workEntry)).toEqual(savedWork);
    expect(service.saveWorkTask(workEntry)).toEqual(workEntry);
    expect(workGetById).toHaveBeenCalledWith(workEntry.id);
    expect(workAdd).toHaveBeenCalledWith(workEntry);
    expect(workUpdate).toHaveBeenCalledWith(workEntry.id, workEntry);
    expect(outbox).toHaveBeenNthCalledWith(1, 'WorkTask', 'INSERT', workEntry.id, workEntry);
    expect(outbox).toHaveBeenNthCalledWith(2, 'WorkTask', 'UPDATE', workEntry.id, workEntry);
    expect(outbox).toHaveBeenNthCalledWith(3, 'WorkTask', 'UPDATE', workEntry.id, workEntry);

    const projectGetById = vi
      .spyOn(workProjectRepository, 'getById')
      .mockReturnValueOnce(null)
      .mockReturnValue(projectEntry);
    const projectAdd = vi.spyOn(workProjectRepository, 'add').mockReturnValue(savedProject);
    const projectUpdate = vi
      .spyOn(workProjectRepository, 'update')
      .mockReturnValueOnce(savedProject)
      .mockReturnValueOnce(null);
    expect(service.saveWorkProject(projectEntry)).toEqual(savedProject);
    expect(service.saveWorkProject(projectEntry)).toEqual(savedProject);
    expect(service.saveWorkProject(projectEntry)).toEqual(projectEntry);
    expect(projectGetById).toHaveBeenCalledWith(projectEntry.id);
    expect(projectAdd).toHaveBeenCalledWith(projectEntry);
    expect(projectUpdate).toHaveBeenCalledWith(projectEntry.id, projectEntry);
    expect(outbox).toHaveBeenNthCalledWith(4, 'WorkProject', 'INSERT', projectEntry.id, projectEntry);
    expect(outbox).toHaveBeenNthCalledWith(5, 'WorkProject', 'UPDATE', projectEntry.id, projectEntry);
    expect(outbox).toHaveBeenNthCalledWith(6, 'WorkProject', 'UPDATE', projectEntry.id, projectEntry);
  });

  it('يحزم إنشاء المهمة ويوثق تحديثها من دون تكرار سجل الإنشاء، ثم يمنع أثر الحذف الغائب أو المرفوض', () => {
    const service = new TaskService();
    const { audit, outbox } = effectSpies();
    const entry = task();
    const saved = task({ title: 'مهمة محفوظة' });

    const getById = vi.spyOn(suiteTaskRepository, 'getById').mockReturnValueOnce(null).mockReturnValue(entry);
    const add = vi.spyOn(suiteTaskRepository, 'add').mockReturnValue(saved);
    const update = vi.spyOn(suiteTaskRepository, 'update').mockReturnValueOnce(saved).mockReturnValueOnce(null);

    expect(service.saveTask(entry)).toEqual(saved);
    expect(add).toHaveBeenCalledWith(entry);
    // إنشاء Task يوثق داخل SuiteTaskRepository.add؛ لا يضيف TaskService حدثاً مكرراً.
    expect(audit).not.toHaveBeenCalled();
    expect(outbox).toHaveBeenLastCalledWith('Task', 'INSERT', entry.id, entry);

    expect(service.saveTask(entry)).toEqual(saved);
    expect(service.saveTask(entry)).toEqual(entry);
    expect(update).toHaveBeenCalledWith(entry.id, entry);
    expect(audit).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'Update', entity: 'Task', oldValue: entry, newValue: entry })
    );
    expect(outbox).toHaveBeenLastCalledWith('Task', 'UPDATE', entry.id, entry);

    audit.mockClear();
    outbox.mockClear();
    getById.mockReset().mockReturnValueOnce(null).mockReturnValueOnce(entry).mockReturnValue(entry);
    const remove = vi.spyOn(suiteTaskRepository, 'delete').mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(service.deleteTask('غير موجود')).toBe(false);
    expect(service.deleteTask(entry.id)).toBe(false);
    expect(service.deleteTask(entry.id)).toBe(true);
    expect(remove).toHaveBeenCalledTimes(2);
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'Delete', entity: 'Task', recordId: entry.id, oldValue: entry })
    );
    expect(outbox).toHaveBeenCalledTimes(1);
    expect(outbox).toHaveBeenLastCalledWith('Task', 'DELETE', entry.id, entry);
  });

  it('يحفظ الالتزام ويحدّثه بحمولة المزامنة، ولا يضيف حذفاً عند رفض المستودع', () => {
    const service = new TaskService();
    const { audit, outbox } = effectSpies();
    const entry = commitment();
    const saved = commitment({ name: 'التزام محفوظ' });

    vi.spyOn(commitmentRepository, 'getById').mockReturnValueOnce(null).mockReturnValue(entry);
    const add = vi.spyOn(commitmentRepository, 'add').mockReturnValue(saved);
    const update = vi.spyOn(commitmentRepository, 'update').mockReturnValueOnce(saved).mockReturnValueOnce(null);
    expect(service.saveCommitment(entry)).toEqual(saved);
    expect(service.saveCommitment(entry)).toEqual(saved);
    expect(service.saveCommitment(entry)).toEqual(entry);
    expect(add).toHaveBeenCalledWith(entry);
    expect(update).toHaveBeenCalledWith(entry.id, entry);
    expect(audit).not.toHaveBeenCalled();
    expect(outbox).toHaveBeenNthCalledWith(1, 'Commitment', 'INSERT', entry.id, entry);
    expect(outbox).toHaveBeenNthCalledWith(2, 'Commitment', 'UPDATE', entry.id, entry);
    expect(outbox).toHaveBeenNthCalledWith(3, 'Commitment', 'UPDATE', entry.id, entry);

    const remove = vi.spyOn(commitmentRepository, 'delete').mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(service.deleteCommitment(entry.id)).toBe(false);
    expect(outbox).toHaveBeenCalledTimes(3);
    expect(service.deleteCommitment(entry.id)).toBe(true);
    expect(remove).toHaveBeenCalledWith(entry.id);
    expect(outbox).toHaveBeenLastCalledWith('Commitment', 'DELETE', entry.id, null);
    expect(outbox).toHaveBeenCalledTimes(4);
  });
});
