import { CustodyIssueRecord } from '../../types';
import { custodyRepository, CustodyRepository } from '../../database/repositories/OtherRepositories';
import { auditService } from '../../core/audit/AuditService';
import { Outbox } from '../../sync/Outbox';

export class CustodyService {
  private repo: CustodyRepository;

  constructor(repo: CustodyRepository = custodyRepository) {
    this.repo = repo;
  }

  public getAll(): CustodyIssueRecord[] {
    return this.repo.getAll();
  }

  public saveCustody(custody: CustodyIssueRecord): CustodyIssueRecord {
    const isNew = !this.repo.getById(custody.id);
    let saved: CustodyIssueRecord;

    if (isNew) {
      saved = this.repo.add(custody);
      auditService.log({
        action: 'Create',
        entity: 'CustodyRecord',
        recordId: custody.id,
        details: `تسجيل عهدة/إشكالية جديدة لـ ${custody.name || custody.resp || ''} (${custody.section || 'عهدة'})`,
        newValue: custody,
      });
      Outbox.enqueue('CustodyRecord', 'INSERT', custody.id, custody);
    } else {
      const old = this.repo.getById(custody.id);
      saved = this.repo.update(custody.id, custody) || custody;
      auditService.log({
        action: 'Update',
        entity: 'CustodyRecord',
        recordId: custody.id,
        details: `تحديث سجل العهدة لـ ${custody.name || custody.resp || ''}`,
        oldValue: old,
        newValue: custody,
      });
      Outbox.enqueue('CustodyRecord', 'UPDATE', custody.id, custody);
    }

    return saved;
  }

  public deleteCustody(id: string): boolean {
    const old = this.repo.getById(id);
    if (!old) return false;

    const res = this.repo.delete(id);
    if (res) {
      auditService.log({
        action: 'Delete',
        entity: 'CustodyRecord',
        recordId: id,
        details: `حذف سجل العهدة: ${old.name || old.resp || ''}`,
        oldValue: old,
      });
      Outbox.enqueue('CustodyRecord', 'DELETE', id, old);
    }
    return res;
  }
}

export const custodyService = new CustodyService();
