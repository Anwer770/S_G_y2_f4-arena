import { DebtRecord, DebtCommitment } from '../../types';
import { debtRepository, DebtRepository } from '../../database/repositories/DebtRepository';
import { auditService } from '../../core/audit/AuditService';
import { Outbox } from '../../sync/Outbox';

export class DebtService {
  private repo: DebtRepository;

  constructor(repo: DebtRepository = debtRepository) {
    this.repo = repo;
  }

  public getAll(): DebtRecord[] {
    return this.repo.getAll();
  }

  public getCommitments(): DebtCommitment[] {
    return this.repo.getCommitments();
  }

  public saveDebt(debt: DebtRecord): DebtRecord {
    const isNew = !this.repo.getById(debt.id);
    let saved: DebtRecord;

    if (isNew) {
      saved = this.repo.add(debt);
      auditService.log({
        action: 'Create',
        entity: 'DebtRecord',
        recordId: debt.id,
        details: `تسجيل ذمة/دين جديد لـ ${debt.name} بمبلغ ${debt.debit || debt.credit}`,
        newValue: debt,
      });
      Outbox.enqueue('DebtRecord', 'INSERT', debt.id, debt);
    } else {
      const old = this.repo.getById(debt.id);
      saved = this.repo.update(debt.id, debt) || debt;
      auditService.log({
        action: 'Update',
        entity: 'DebtRecord',
        recordId: debt.id,
        details: `تحديث سجل الدين لـ ${debt.name}`,
        oldValue: old,
        newValue: debt,
      });
      Outbox.enqueue('DebtRecord', 'UPDATE', debt.id, debt);
    }

    return saved;
  }

  public deleteDebt(id: string): boolean {
    const old = this.repo.getById(id);
    if (!old) return false;

    const res = this.repo.delete(id);
    if (res) {
      auditService.log({
        action: 'Delete',
        entity: 'DebtRecord',
        recordId: id,
        details: `حذف سجل الدين: ${old.name}`,
        oldValue: old,
      });
      Outbox.enqueue('DebtRecord', 'DELETE', id, old);
    }
    return res;
  }

  public settlePayment(debtId: string, amount: number, paymentDate: string, notes?: string): DebtRecord | null {
    const res = this.repo.recordPayment(debtId, amount, paymentDate, notes);
    if (res) {
      Outbox.enqueue('DebtRecord', 'UPDATE', debtId, res);
    }
    return res;
  }
}

export const debtService = new DebtService();
