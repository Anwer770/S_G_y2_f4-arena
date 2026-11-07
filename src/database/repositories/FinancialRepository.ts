import { BaseRepository } from './BaseRepository';
import { FinancialTransaction } from '../../types';
import { DEFAULT_FINANCIAL_TRANSACTIONS } from '../../data/defaultFinancial';
import { auditService } from '../../core/audit/AuditService';
import { indexedDBStorage } from '../adapters/IndexedDBAdapter';

const FIN_TXN_KEY = 'suite_fin_transactions_v2';
const DROPDOWNS_KEY_PREFIX = 'suite_fin_';

export class FinancialRepository extends BaseRepository<FinancialTransaction> {
  constructor() {
    super(FIN_TXN_KEY, DEFAULT_FINANCIAL_TRANSACTIONS);
  }

  public override add(txn: FinancialTransaction): FinancialTransaction {
    const res = super.add(txn);
    const primaryAmount = txn.amountYER || txn.amountSAR || txn.amountUSD || 0;
    auditService.log({
      action: txn.restriction.includes('قبض') ? 'Receipt' : 'Payment',
      entity: 'FinancialTransaction',
      recordId: txn.id,
      details: `تسجيل قيد مالي (${txn.movement} - ${txn.restriction}) بمبلغ ${primaryAmount} - ${txn.accountName}`,
      newValue: txn,
    });
    return res;
  }

  /**
   * Reverse a historical transaction instead of hard-deleting it,
   * creating a balancing reversal entry to maintain audit integrity.
   */
  public reverseTransaction(originalId: string, reason: string): { original: FinancialTransaction; reversal: FinancialTransaction } | null {
    const original = this.getById(originalId);
    if (!original) return null;

    // Negate the amount or flip movement type for reversal
    const reversal: FinancialTransaction = {
      ...original,
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString().split('T')[0],
      number: `REV-${original.number || original.id}`,
      amountYER: -1 * (original.amountYER || 0),
      amountSAR: -1 * (original.amountSAR || 0),
      amountUSD: -1 * (original.amountUSD || 0),
      description: `[عكس قيد/تصحيح] للقيد رقم (${original.number || original.id}). السبب: ${reason}. الوصف السابق: ${original.description || ''}`,
      createdAt: new Date().toISOString(),
    };

    // Save reversal
    this.add(reversal);

    auditService.log({
      action: 'Financial Correction',
      entity: 'FinancialTransaction',
      recordId: originalId,
      details: `عكس قيد مالي رقم ${original.id} بقيد عكسي رقم ${reversal.id}. السبب: ${reason}`,
      oldValue: original,
      newValue: reversal,
    });

    return { original, reversal };
  }

  public getDropdown(type: string, defaults: string[] = []): string[] {
    const key = `${DROPDOWNS_KEY_PREFIX}${type}_v2`;
    const data = indexedDBStorage.getItemSync<string[]>(key);
    if (!data || !Array.isArray(data)) {
      indexedDBStorage.setItemSync(key, defaults);
      return [...defaults];
    }
    return data;
  }

  public saveDropdown(type: string, list: string[]): void {
    const key = `${DROPDOWNS_KEY_PREFIX}${type}_v2`;
    indexedDBStorage.setItemSync(key, list);
  }
}

export const financialRepository = new FinancialRepository();
