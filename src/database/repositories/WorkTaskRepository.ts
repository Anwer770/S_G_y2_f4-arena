import { BaseRepository } from './BaseRepository';
import { WorkTask, WorkProject } from '../../types/workos';
import { Task, Commitment } from '../../types';
import { DEFAULT_TASKS } from '../../data/defaultTasks';
import { DEFAULT_COMMITMENTS } from '../../data/defaultCommitments';
import { indexedDBStorage } from '../adapters/IndexedDBAdapter';
import { auditService } from '../../core/audit/AuditService';

const WORKOS_TASKS_KEY = 'workos_v1_tasks';
const WORKOS_PROJECTS_KEY = 'workos_v1_projects';
const SUITE_TASKS_KEY = 'suite_tasks_tasks_v2';
const SUITE_COMMITMENTS_KEY = 'suite_tasks_commitments_v2';

// 1. Suite Tasks Repository
export class SuiteTaskRepository extends BaseRepository<Task> {
  constructor() {
    super(SUITE_TASKS_KEY, DEFAULT_TASKS);
  }

  public override add(task: Task): Task {
    const res = super.add(task);
    auditService.log({
      action: 'Create',
      entity: 'Task',
      recordId: task.id,
      details: `إنشاء مهمة جديدة: ${task.title} (${task.pri || ''})`,
      newValue: task,
    });
    return res;
  }
}

// 2. Suite Commitments Repository
export class CommitmentRepository extends BaseRepository<Commitment> {
  constructor() {
    super(SUITE_COMMITMENTS_KEY, DEFAULT_COMMITMENTS);
  }

  public override add(comm: Commitment): Commitment {
    const res = super.add(comm);
    auditService.log({
      action: 'Create',
      entity: 'Commitment',
      recordId: comm.id,
      details: `تسجيل التزام جديد: ${comm.name}`,
      newValue: comm,
    });
    return res;
  }
}

// 3. WorkOS Tasks Repository
export class WorkTaskRepository extends BaseRepository<WorkTask> {
  constructor() {
    super(WORKOS_TASKS_KEY, []);
  }

  public override add(task: WorkTask): WorkTask {
    const res = super.add(task);
    auditService.log({
      action: 'Create',
      entity: 'WorkTask',
      recordId: task.id,
      details: `إنشاء مهمة جديدة: ${task.title} (${task.taskNumber || ''})`,
      newValue: task,
    });
    return res;
  }

  public override update(id: string, updatedTask: Partial<WorkTask>): WorkTask | null {
    const old = this.getById(id);
    const res = super.update(id, updatedTask);
    if (res) {
      auditService.log({
        action: 'Update',
        entity: 'WorkTask',
        recordId: id,
        details: `تحديث المهمة: ${res.title}`,
        oldValue: old,
        newValue: res,
      });
    }
    return res;
  }

  public override delete(id: string): boolean {
    const old = this.getById(id);
    const res = super.delete(id);
    if (res && old) {
      auditService.log({
        action: 'Delete',
        entity: 'WorkTask',
        recordId: id,
        details: `حذف المهمة: ${old.title}`,
        oldValue: old,
      });
    }
    return res;
  }
}

// 4. WorkOS Projects Repository
export class WorkProjectRepository extends BaseRepository<WorkProject> {
  constructor() {
    super(WORKOS_PROJECTS_KEY, []);
  }

  public override add(project: WorkProject): WorkProject {
    const res = super.add(project);
    auditService.log({
      action: 'Create',
      entity: 'WorkProject',
      recordId: project.id,
      details: `إنشاء مشروع تنفيذي جديد: ${project.name} (${project.code})`,
      newValue: project,
    });
    return res;
  }
}

export const suiteTaskRepository = new SuiteTaskRepository();
export const commitmentRepository = new CommitmentRepository();
export const workTaskRepository = new WorkTaskRepository();
export const workProjectRepository = new WorkProjectRepository();
