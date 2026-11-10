import { describe, expect, it } from 'vitest';
import {
  generateJournalEntryFromMovement,
  removeMovementFromFinancialJournal,
  syncMovementToFinancialJournal,
} from '../../src/utils/autoJournaling';
import type { FinancialTransaction, Item, MovementRecord } from '../../src/types';

const movement = (over: Partial<MovementRecord> = {}): MovementRecord =>
  ({
    id: 'MOV-1',
    subId: 'SUB-0001',
    date: '2026-01-15',
    movementType: 'توريد',
    beneficiary: 'مورد النور',
    category: 'مخزن رئيسي',
    items: { 'صنف أ': 3, 'صنف ب': 2 },
    ...over,
  }) as MovementRecord;

const products = [
  { id: 'p1', name: 'صنف أ', priceYER: 100 },
  { id: 'p2', name: 'صنف ب', costPrice: 50 },
] as unknown as Item[];

describe('generateJournalEntryFromMovement — القيد الآلي', () => {
  it('يولّد قيداً مرتبطاً برقم الحركة نفسها', () => {
    const entry = generateJournalEntryFromMovement(movement(), [], products);
    expect(entry.number).toBe('SUB-0001');
    expect(entry.attachmentUrl).toBe('SUB-0001');
    expect(entry.date).toBe('2026-01-15');
    expect(entry.day).toBeTruthy();
    expect(entry.description).toContain('[قيد آلي]');
    expect(entry.description).toContain('SUB-0001');
  });

  it('التوريد ⇒ حساب له، والصرف ⇒ حساب عليه', () => {
    expect(generateJournalEntryFromMovement(movement(), [], products).movement).toBe('حساب له');
    expect(generateJournalEntryFromMovement(movement({ movementType: 'صرف' }), [], products).movement).toBe(
      'حساب عليه'
    );
  });

  it('يقوّم الأصناف من أسعار المنتجات (سعر البيع أو التكلفة)', () => {
    const entry = generateJournalEntryFromMovement(movement(), [], products);
    expect(entry.amountYER).toBe(3 * 100 + 2 * 50);
  });

  it('بلا أسعار ⇒ صفر (لا اختراع مبالغ) ويذكر الأصناف في الوصف', () => {
    const entry = generateJournalEntryFromMovement(movement(), [], []);
    expect(entry.amountYER).toBe(0);
    expect(entry.description).toContain('صنف أ');
  });

  it('يولّد معرّفاً تسلسلياً جديداً ويلتقط الموجود عند التكرار', () => {
    const existing = [
      { id: 'ACC-1007', number: 'SUB-0001', attachmentUrl: 'SUB-0001', amountYER: 999 },
    ] as unknown as FinancialTransaction[];
    const kept = generateJournalEntryFromMovement(movement(), existing, products);
    expect(kept.id).toBe('ACC-1007');
    expect(kept.amountYER).toBe(999);

    const fresh = generateJournalEntryFromMovement(movement({ subId: 'SUB-0002' }), existing, products);
    expect(fresh.id).toBe('ACC-1008');
  });

  it('المستفيد الفارغ لا يُخترع له اسم من الخيال (نص صريح «غير محدد»)', () => {
    const entry = generateJournalEntryFromMovement(movement({ beneficiary: '' }), [], products);
    expect(entry.accountName).toContain('غير محدد');
  });
});

describe('syncMovementToFinancialJournal — التزامن أحادي الاتجاه', () => {
  it('يضيف قيداً جديداً في المقدمة عند أول مزامنة', () => {
    const { updatedTxns, createdEntry } = syncMovementToFinancialJournal(movement(), [], products);
    expect(updatedTxns).toHaveLength(1);
    expect(updatedTxns[0].number).toBe('SUB-0001');
    expect(createdEntry.number).toBe('SUB-0001');
  });

  it('لا يُكرّر القيد عند إعادة المزامنة (idempotent) ويحدّث الوصف', () => {
    const first = syncMovementToFinancialJournal(movement(), [], products);
    const second = syncMovementToFinancialJournal(movement({ beneficiary: 'مورد آخر' }), first.updatedTxns, products);
    expect(second.updatedTxns).toHaveLength(1);
    expect(second.updatedTxns[0].id).toBe(first.updatedTxns[0].id);
    expect(second.updatedTxns[0].description).toContain('مورد آخر');
  });

  it('لا يمسّ قيوداً أخرى عند المزامنة', () => {
    const other = { id: 'ACC-2000', number: 'MANUAL-1', attachmentUrl: 'MANUAL-1' } as unknown as FinancialTransaction;
    const { updatedTxns } = syncMovementToFinancialJournal(movement(), [other], products);
    expect(updatedTxns).toHaveLength(2);
    expect(updatedTxns.some((t) => t.id === 'ACC-2000')).toBe(true);
  });
});

describe('removeMovementFromFinancialJournal — حذف القيد الآلي', () => {
  it('يحذف القيد المرتبط بالحركة ويُبقي البقية', () => {
    const txns = [
      { id: 'ACC-1', number: 'SUB-0001', attachmentUrl: 'SUB-0001' },
      { id: 'ACC-2', number: 'MANUAL-1', attachmentUrl: 'MANUAL-1' },
    ] as unknown as FinancialTransaction[];
    const left = removeMovementFromFinancialJournal('SUB-0001', txns);
    expect(left).toHaveLength(1);
    expect(left[0].id).toBe('ACC-2');
  });

  it('حركة بلا قيد ⇒ لا تغيير', () => {
    const txns = [{ id: 'ACC-2', number: 'MANUAL-1' }] as unknown as FinancialTransaction[];
    expect(removeMovementFromFinancialJournal('SUB-9999', txns)).toHaveLength(1);
  });
});

/**
 * R49 — الفروع الدفاعية في القيد الآلي.
 * حركة بلا أصناف · صنف بلا سعر في القائمة · أكثر من ثلاثة أصناف · قيود قديمة بمعرّفات
 * لا تتبع نمط `ACC-n` · حركة بلا تصنيف أو مستفيد. كلها حالات حقيقية في بيانات المستخدم
 * بعد استيراد قديم، وكانت كلها غير مقيسة.
 */
describe('R49 — generateJournalEntryFromMovement: بيانات ناقصة', () => {
  it('حركة صرف بلا أصناف وبلا تصنيف وبلا مستفيد ⇒ بدائل صريحة بلا undefined', () => {
    const entry = generateJournalEntryFromMovement(
      movement({ movementType: 'صرف', items: undefined, category: undefined, beneficiary: undefined }),
      []
    );

    expect(entry.restrictionAccount).toBe('عملاء');
    expect(entry.accountName).toBe('عميل غير محدد');
    expect(entry.description).not.toContain('[الأصناف');
    expect(entry.description).not.toContain('undefined');
    expect(entry.amountYER).toBe(0);
  });

  it('حركة توريد بلا تصنيف ⇒ «مخزن رئيسي»', () => {
    expect(generateJournalEntryFromMovement(movement({ category: undefined }), []).restrictionAccount).toBe(
      'مخزن رئيسي'
    );
  });

  it('صنف بلا سعر في القائمة يُقوَّم بصفر، وأكثر من ثلاثة أصناف تُختصر بثلاثة ونقاط', () => {
    const fourItems = { 'صنف أ': 2, 'صنف ب': 1, 'صنف ج': 5, 'صنف د': 1 };
    const entry = generateJournalEntryFromMovement(movement({ items: fourItems }), [], [
      { id: 'p1', name: 'صنف أ' },
    ] as unknown as Item[]);

    expect(entry.amountYER).toBe(0);
    expect(entry.description).toContain('صنف أ (2)، صنف ب (1)، صنف ج (5)...');
  });

  it('كمية غير رقمية وصنف غير موجود في القائمة ⇒ تقويم صفر بلا NaN', () => {
    const entry = generateJournalEntryFromMovement(movement({ items: { 'صنف مجهول': 'غير رقم' } as never }), []);
    expect(entry.amountYER).toBe(0);
    expect(entry.description).toContain('صنف مجهول (غير رقم)');
  });

  it('قيود قديمة بمعرّفات لا تتبع ACC-n ⇒ الترقيم يبدأ من ACC-1 لا من رقم مكسور', () => {
    const legacy = [{ id: 'X-9', number: 'OTHER' }] as unknown as FinancialTransaction[];
    expect(generateJournalEntryFromMovement(movement(), legacy).id).toBe('ACC-1');
  });
});
