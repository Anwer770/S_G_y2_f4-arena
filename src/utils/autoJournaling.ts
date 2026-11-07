import { MovementRecord, FinancialTransaction, Item } from '../types';
import { calculateArabicDay } from './formatters';

/**
 * Auto-Journaling Engine
 * Automatically generates double-entry / financial journal vouchers
 * from inventory movements (توريد / صرف) to maintain strict financial-stock integrity.
 */

export function generateJournalEntryFromMovement(
  movement: MovementRecord,
  existingTxns: FinancialTransaction[],
  products: Item[] = []
): FinancialTransaction {
  // Check if an entry already exists for this movement
  const existing = existingTxns.find(
    (t) => t.number === movement.subId || t.attachmentUrl === movement.subId
  );

  const day = calculateArabicDay(movement.date);

  // Calculate approximate total valuation from products if available
  let totalValuationYER = 0;
  const itemsBreakdown: string[] = [];

  for (const [itemName, qty] of Object.entries(movement.items || {})) {
    const matchedProduct = products.find((p) => p.name === itemName);
    // Estimated unit price from product or default placeholder
    const unitPrice = (matchedProduct as any)?.priceYER || (matchedProduct as any)?.costPrice || 0;
    totalValuationYER += (Number(qty) || 0) * (Number(unitPrice) || 0);
    itemsBreakdown.push(`${itemName} (${qty})`);
  }

  const itemsSummary = itemsBreakdown.slice(0, 3).join('، ') + (itemsBreakdown.length > 3 ? '...' : '');

  // Next sequential ACC ID if not existing
  let id = existing?.id;
  if (!id) {
    const accNumbers = existingTxns
      .map((t) => {
        const match = t.id.match(/^ACC-(\d+)$/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNum = accNumbers.length > 0 ? Math.max(...accNumbers) : 1000;
    id = `ACC-${maxNum + 1}`;
  }

  const isSupply = movement.movementType === 'توريد';

  return {
    id,
    day,
    date: movement.date,
    importance: 'تم التنفيذ',
    movement: isSupply ? 'حساب له' : 'حساب عليه',
    restriction: isSupply ? 'فاتورة مشتريات' : 'فاتورة مبيعات',
    movementType: 'اجل',
    categoryAccount: isSupply ? 'مشتريات' : 'مبيعات',
    restrictionAccount: movement.category || (isSupply ? 'مخزن رئيسي' : 'عملاء'),
    accountName: movement.beneficiary || (isSupply ? 'مورد غير محدد' : 'عميل غير محدد'),
    description: `[قيد آلي] ${isSupply ? 'توريد مخزني' : 'صرف مخزني'} رقم ${movement.subId} - المستفيد: ${
      movement.beneficiary || 'غير محدد'
    }${itemsSummary ? ` [الأصناف: ${itemsSummary}]` : ''}`,
    number: movement.subId,
    amountYER: existing?.amountYER || totalValuationYER,
    amountSAR: existing?.amountSAR || 0,
    amountUSD: existing?.amountUSD || 0,
    attachmentUrl: movement.subId,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function syncMovementToFinancialJournal(
  movement: MovementRecord,
  existingTxns: FinancialTransaction[],
  products: Item[] = []
): { updatedTxns: FinancialTransaction[]; createdEntry: FinancialTransaction } {
  const generated = generateJournalEntryFromMovement(movement, existingTxns, products);

  const existingIndex = existingTxns.findIndex(
    (t) => t.number === movement.subId || t.attachmentUrl === movement.subId
  );

  let updated: FinancialTransaction[];
  if (existingIndex >= 0) {
    updated = [...existingTxns];
    updated[existingIndex] = {
      ...updated[existingIndex],
      date: generated.date,
      day: generated.day,
      accountName: generated.accountName,
      description: generated.description,
      updatedAt: new Date().toISOString(),
    };
  } else {
    updated = [generated, ...existingTxns];
  }

  return { updatedTxns: updated, createdEntry: generated };
}

export function removeMovementFromFinancialJournal(
  subId: string,
  existingTxns: FinancialTransaction[]
): FinancialTransaction[] {
  return existingTxns.filter((t) => t.number !== subId && t.attachmentUrl !== subId);
}
