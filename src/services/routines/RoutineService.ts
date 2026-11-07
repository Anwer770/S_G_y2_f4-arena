import { RoutineRecord } from '../../types';
import { routinesRepository, RoutinesRepository } from '../../database/repositories/OtherRepositories';
import { auditService } from '../../core/audit/AuditService';
import { Outbox } from '../../sync/Outbox';

export class RoutineService {
  private repo: RoutinesRepository;

  constructor(repo: RoutinesRepository = routinesRepository) {
    this.repo = repo;
  }

  public getAll(): RoutineRecord[] {
    return this.repo.getAll();
  }

  public getById(id: string): RoutineRecord | null {
    return this.repo.getById(id);
  }

  public saveRoutine(routine: RoutineRecord): RoutineRecord {
    const isNew = !this.repo.getById(routine.id);
    let saved: RoutineRecord;

    if (isNew) {
      saved = this.repo.add(routine);
      auditService.log({
        action: 'Create',
        entity: 'Routine',
        recordId: routine.id,
        details: `إنشاء روتين جديد: ${routine.name}`,
        newValue: routine,
      });
      Outbox.enqueue('Routine', 'INSERT', routine.id, routine);
    } else {
      const old = this.repo.getById(routine.id);
      saved = this.repo.update(routine.id, routine) || routine;
      auditService.log({
        action: 'Update',
        entity: 'Routine',
        recordId: routine.id,
        details: `تحديث الروتين: ${routine.name}`,
        oldValue: old,
        newValue: routine,
      });
      Outbox.enqueue('Routine', 'UPDATE', routine.id, routine);
    }

    return saved;
  }

  public deleteRoutine(id: string): boolean {
    const old = this.repo.getById(id);
    if (!old) return false;

    const res = this.repo.delete(id);
    if (res) {
      auditService.log({
        action: 'Delete',
        entity: 'Routine',
        recordId: id,
        details: `حذف الروتين: ${old.name}`,
        oldValue: old,
      });
      Outbox.enqueue('Routine', 'DELETE', id, old);
    }
    return res;
  }
}

export const routineService = new RoutineService();
