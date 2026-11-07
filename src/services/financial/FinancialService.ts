import { FinancialTransaction } from '../../types';
import { classifyFinancialMovement } from '../../utils/financial';
import { financialRepository, FinancialRepository } from '../../database/repositories/FinancialRepository';
import { auditService } from '../../core/audit/AuditService';
import { Outbox } from '../../sync/Outbox';

export interface FinancialSummary {
  totalReceiptsYER: number;
  totalPaymentsYER: number;
  netBalanceYER: number;
  totalSAR: number;
  totalUSD: number;
  transactionsCount: number;
  /** حركات ذات تصنيف غير معروف — لا تُحتسب في المقبوضات/المدفوعات (إصلاح R12) */
  unclassifiedYER: number;
  unclassifiedCount: number;
}

export class FinancialService {
  private repo: FinancialRepository;

  constructor(repo: FinancialRepository = financialRepository) {
    this.repo = repo;
  }

  public getAll(): FinancialTransaction[] {
    return this.repo.getAll();
  }

  public getSummary(transactions: FinancialTransaction[] = this.getAll()): FinancialSummary {
    let totalReceiptsYER = 0;
    let totalPaymentsYER = 0;
    let totalSAR = 0;
    let totalUSD = 0;
    let unclassifiedYER = 0;
    let unclassifiedCount = 0;

    for (const t of transactions) {
      const yer = Number(t.amountYER) || 0;
      // تصنيف موحّد مع utils/financial.ts — لا «كل ما ليس قبضاً = مدفوع»
      const bucket = classifyFinancialMovement(t.movement);
      if (bucket === 'income') {
        totalReceiptsYER += yer;
      } else if (bucket === 'expense') {
        totalPaymentsYER += yer;
      } else {
        unclassifiedYER += yer;
        unclassifiedCount += 1;
      }
      totalSAR += Number(t.amountSAR) || 0;
      totalUSD += Number(t.amountUSD) || 0;
    }

    return {
      totalReceiptsYER,
      totalPaymentsYER,
      netBalanceYER: totalReceiptsYER - totalPaymentsYER,
      totalSAR,
      totalUSD,
      transactionsCount: transactions.length,
      unclassifiedYER,
      unclassifiedCount,
    };
  }

  public saveTransaction(txn: FinancialTransaction): FinancialTransaction {
    const isNew = !this.repo.getById(txn.id);
    const saved = isNew ? this.repo.add(txn) : this.repo.update(txn.id, txn) || txn;

    // Queue for offline sync
    Outbox.enqueue('FinancialTransaction', isNew ? 'INSERT' : 'UPDATE', txn.id, saved);

    return saved;
  }

  public deleteTransaction(id: string): boolean {
    const target = this.repo.getById(id);
    if (!target) return false;

    const res = this.repo.delete(id);
    if (res) {
      auditService.log({
        action: 'Delete',
        entity: 'FinancialTransaction',
        recordId: id,
        details: `حذف قيد مالي رقم ${id} (${target.accountName || target.description})`,
        oldValue: target,
      });
      Outbox.enqueue('FinancialTransaction', 'DELETE', id, target);
    }
    return res;
  }

  /**
   * Reversal (عكس قيد) instead of raw deletion to preserve historical accounting trails
   */
  public reverseTransaction(id: string, reason: string): boolean {
    const result = this.repo.reverseTransaction(id, reason);
    if (result) {
      Outbox.enqueue('FinancialTransaction', 'INSERT', result.reversal.id, result.reversal);
      return true;
    }
    return false;
  }
}

export const financialService = new FinancialService();
