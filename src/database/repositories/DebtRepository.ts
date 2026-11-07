import { BaseRepository } from './BaseRepository';
import { DebtRecord, DebtCommitment, DebtCommitmentPayment } from '../../types';
import { DEFAULT_DEBT_RECORDS, DEFAULT_DEBT_COMMITMENTS } from '../../utils/debts';
import { auditService } from '../../core/audit/AuditService';
import { indexedDBStorage } from '../adapters/IndexedDBAdapter';

const DEBTS_KEY = 'suite_debts_records_v1';
const DEBT_COMMITMENTS_KEY = 'suite_debts_commitments_v1';

export class DebtRepository extends BaseRepository<DebtRecord> {
  constructor() {
    super(DEBTS_KEY, DEFAULT_DEBT_RECORDS);
  }

  public getCommitments(): DebtCommitment[] {
    const data = indexedDBStorage.getItemSync<DebtCommitment[]>(DEBT_COMMITMENTS_KEY);
    return Array.isArray(data) ? data : DEFAULT_DEBT_COMMITMENTS;
  }

  public saveCommitments(commitments: DebtCommitment[]): void {
    indexedDBStorage.setItemSync(DEBT_COMMITMENTS_KEY, commitments);
  }

  public addCommitment(commitment: DebtCommitment): DebtCommitment {
    const list = this.getCommitments();
    const updated = [commitment, ...list];
    this.saveCommitments(updated);

    auditService.log({
      action: 'Create',
      entity: 'DebtCommitment',
      recordId: commitment.id,
      details: `إضافة التزام دين جديد: ${commitment.name} بمبلغ ${commitment.amount} ${commitment.currency}`,
      newValue: commitment,
    });

    return commitment;
  }

  public recordPayment(debtId: string, amount: number, paymentDate: string, notes?: string): DebtRecord | null {
    const debt = this.getById(debtId);
    if (!debt) return null;

    // In DebtRecord: debit is (عليه) and credit is (له)
    const newCredit = (Number(debt.credit) || 0) + amount;
    const isCompleted = newCredit >= (Number(debt.debit) || 0);

    const updated = this.update(debtId, {
      credit: newCredit,
      isCompleted,
      note: debt.note ? `${debt.note} | تم سداد ${amount} في ${paymentDate}` : `تم سداد ${amount} في ${paymentDate}`,
    });

    if (updated) {
      auditService.log({
        action: 'Debt Settlement',
        entity: 'DebtRecord',
        recordId: debtId,
        details: `سداد مبلغ ${amount} من دين ${debt.name}. الإجمالي المسدد: ${newCredit}`,
        oldValue: debt,
        newValue: updated,
      });
    }

    return updated;
  }
}

export const debtRepository = new DebtRepository();
