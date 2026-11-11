import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FinancialFilterState, FinancialTransaction } from '../../src/types';
import { auditService, type CentralAuditEntry } from '../../src/core/audit/AuditService';
import { FinancialRepository } from '../../src/database/repositories/FinancialRepository';
import { FinancialService } from '../../src/services/financial/FinancialService';
import { Outbox, type OutboxMutation } from '../../src/sync/Outbox';
import {
  calculateFinancialSummary,
  classifyFinancialMovement,
  filterFinancialTransactions,
  generateNextTransactionId,
} from '../../src/utils/financial';

const transaction = (overrides: Partial<FinancialTransaction> = {}): FinancialTransaction => ({
  id: 'ACC-1001',
  day: 'السبت',
  date: '2026-11-07',
  importance: '√',
  movement: 'ايرادات',
  restriction: 'سند قبض',
  movementType: 'نقدا',
  categoryAccount: 'تحصيل',
  restrictionAccount: 'الخزينة',
  accountName: 'حساب الاختبار',
  description: 'وصف اختبار',
  number: 'REF-1001',
  amountYER: 100,
  amountSAR: 0,
  amountUSD: 0,
  ...overrides,
});

const filters = (overrides: Partial<FinancialFilterState> = {}): FinancialFilterState => ({
  search: '',
  movement: '',
  importance: '',
  restriction: '',
  movementType: '',
  categoryAccount: '',
  restrictionAccount: '',
  accountName: '',
  startDate: '',
  endDate: '',
  currencyFilter: 'all',
  periodFilter: 'all',
  selectedPeriodDate: '2026-11-07',
  isDraftOnly: false,
  ...overrides,
});

const createRepo = () =>
  ({
    getAll: vi.fn<() => FinancialTransaction[]>(() => []),
    getById: vi.fn<(id: string) => FinancialTransaction | null>(() => null),
    add: vi.fn<(entry: FinancialTransaction) => FinancialTransaction>((entry) => entry),
    update: vi.fn<(id: string, patch: Partial<FinancialTransaction>) => FinancialTransaction | null>(() => null),
    delete: vi.fn<(id: string) => boolean>(() => false),
    reverseTransaction: vi.fn<
      (id: string, reason: string) => { original: FinancialTransaction; reversal: FinancialTransaction } | null
    >(() => null),
  }) as unknown as FinancialRepository;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('R63 — منطق الدفتر المالي', () => {
  it('يصنّف الحركات المقبوضة والمدفوعة وغير المعروفة صراحةً', () => {
    expect(classifyFinancialMovement(' ايرادات ')).toBe('income');
    expect(classifyFinancialMovement('منصرف')).toBe('expense');
    expect(classifyFinancialMovement(null)).toBe('unclassified');
  });

  it('يفصل المجاميع والعملات والتصنيفات غير المعروفة من دون فقدان الخرائط', () => {
    const summary = calculateFinancialSummary([
      transaction({ id: 'ACC-1001', importance: 'اشكال', amountYER: 100, amountSAR: 2, amountUSD: 3 }),
      transaction({
        id: 'ACC-1002',
        movement: 'منصرف',
        restriction: 'سند صرف',
        categoryAccount: 'مصاريف',
        accountName: 'مورد',
        amountYER: 40,
        amountSAR: 1,
      }),
      transaction({
        id: 'ACC-1003',
        movement: 'ملاحظة',
        categoryAccount: '',
        restrictionAccount: 'حساب بديل',
        accountName: '',
        amountYER: 7,
        amountUSD: 4,
      }),
      transaction({ id: 'ACC-1004', amountYER: 50, amountSAR: 0, amountUSD: 0 }),
      transaction({
        id: 'ACC-1005',
        movement: '',
        categoryAccount: '',
        restrictionAccount: '',
        accountName: '',
        amountYER: 0,
        amountSAR: 0,
        amountUSD: 0,
      }),
    ]);

    expect(summary).toMatchObject({
      totalIncomeYER: 150,
      totalExpenseYER: 40,
      netBalanceYER: 110,
      totalSAR: 3,
      totalUSD: 7,
      transactionCount: 5,
      incomeCount: 2,
      expenseCount: 1,
      unclassifiedYER: 7,
      unclassifiedCount: 2,
      totalIncome: 150,
      totalExpense: 40,
      netBalance: 110,
    });
    expect(summary.movementBreakdown).toContainEqual(
      expect.objectContaining({ movement: 'ايرادات', amountYER: 150, count: 2 })
    );
    expect(summary.categoryBreakdown).toContainEqual({ category: 'غير مصنف', amountYER: 7, count: 2 });
    expect(summary.accountBreakdown).toContainEqual(
      expect.objectContaining({ account: 'حساب بديل', amountYER: 7, amountUSD: 4, count: 1 })
    );
    expect(summary.accountBalances).toContainEqual({ account: 'حساب الاختبار', balance: 150 });
  });

  it('يرشّح بالبحث في كل حقل ولا يعامل السجل الناقص كأنه تطابق', () => {
    const complete = transaction({
      id: 'ID-SEARCH',
      number: 'NUMBER-SEARCH',
      accountName: 'ACCOUNT-SEARCH',
      restrictionAccount: 'RESTRICTION-ACCOUNT-SEARCH',
      categoryAccount: 'CATEGORY-SEARCH',
      description: 'DESCRIPTION-SEARCH',
      restriction: 'RESTRICTION-SEARCH',
      movement: 'MOVEMENT-SEARCH',
      day: 'DAY-SEARCH',
    });
    const sparse = transaction({
      id: '',
      number: '',
      accountName: '',
      restrictionAccount: '',
      categoryAccount: '',
      description: undefined,
      restriction: '',
      movement: '',
      day: '',
    });

    for (const query of [
      'id-search',
      'number-search',
      'account-search',
      'restriction-account-search',
      'category-search',
      'description-search',
      'restriction-search',
      'movement-search',
      'day-search',
    ]) {
      expect(filterFinancialTransactions([complete], filters({ search: query }))).toEqual([complete]);
    }
    expect(filterFinancialTransactions([complete, sparse], filters({ search: 'غائب' }))).toEqual([]);
  });

  it('يطبق حقول اختيار الدفتر ويستبعد قيمة كل مرشح غير المطابقة', () => {
    const entry = transaction();
    const filterCases: Array<[keyof FinancialFilterState, string]> = [
      ['movement', entry.movement],
      ['importance', entry.importance],
      ['restriction', entry.restriction],
      ['movementType', entry.movementType],
      ['categoryAccount', entry.categoryAccount],
      ['restrictionAccount', entry.restrictionAccount],
      ['accountName', entry.accountName],
    ];

    for (const [field, value] of filterCases) {
      expect(filterFinancialTransactions([entry], filters({ [field]: value }))).toEqual([entry]);
      expect(filterFinancialTransactions([entry], filters({ [field]: 'قيمة مختلفة' }))).toEqual([]);
    }
  });

  it('يحتفظ بالحركات السالبة الصحيحة عند التصفية بالعملة، بما فيها قيد العكس', () => {
    const entries = [
      transaction({ id: 'YER+', amountYER: 100 }),
      transaction({ id: 'YER-', amountYER: -100 }),
      transaction({ id: 'SAR', amountYER: 0, amountSAR: 5 }),
      transaction({ id: 'USD', amountYER: 0, amountUSD: 2 }),
      transaction({ id: 'ZERO', amountYER: 0, amountSAR: 0, amountUSD: 0 }),
    ];

    expect(filterFinancialTransactions(entries, filters({ currencyFilter: 'YER' })).map((entry) => entry.id)).toEqual([
      'YER+',
      'YER-',
    ]);
    expect(filterFinancialTransactions(entries, filters({ currencyFilter: 'SAR' })).map((entry) => entry.id)).toEqual([
      'SAR',
    ]);
    expect(filterFinancialTransactions(entries, filters({ currencyFilter: 'USD' })).map((entry) => entry.id)).toEqual([
      'USD',
    ]);
  });

  it('يعالج مرشحات العملة غير المعروفة كتحديد غير مقيد', () => {
    const entry = transaction();
    expect(
      filterFinancialTransactions(
        [entry],
        filters({ currencyFilter: 'EUR' as unknown as FinancialFilterState['currencyFilter'] })
      )
    ).toEqual([entry]);
  });

  it('يحرس المسودات وفترات اليوم والأسبوع والشهر والسنة والمدى الزمني', () => {
    const entries = [
      transaction({ id: 'FRIDAY', date: '2026-11-06' }),
      transaction({ id: 'SATURDAY', date: '2026-11-07', isDraft: true }),
      transaction({ id: 'THURSDAY', date: '2026-11-12' }),
      transaction({ id: 'NEXT', date: '2026-11-13' }),
      transaction({ id: 'DECEMBER', date: '2026-12-01' }),
      transaction({ id: 'NEXT-YEAR', date: '2027-01-01' }),
      transaction({ id: 'NO-DATE', date: '' }),
    ];

    expect(filterFinancialTransactions(entries, filters({ isDraftOnly: true })).map((entry) => entry.id)).toEqual([
      'SATURDAY',
    ]);
    expect(
      filterFinancialTransactions(entries, filters({ periodFilter: 'daily', selectedPeriodDate: '2026-11-07' })).map(
        (entry) => entry.id
      )
    ).toEqual(['SATURDAY']);
    expect(
      filterFinancialTransactions(entries, filters({ periodFilter: 'weekly', selectedPeriodDate: '2026-11-07' })).map(
        (entry) => entry.id
      )
    ).toEqual(['SATURDAY', 'THURSDAY', 'NEXT']);
    expect(
      filterFinancialTransactions(entries, filters({ periodFilter: 'monthly', selectedPeriodDate: '2026-11-07' })).map(
        (entry) => entry.id
      )
    ).toEqual(['FRIDAY', 'SATURDAY', 'THURSDAY', 'NEXT']);
    expect(
      filterFinancialTransactions(entries, filters({ periodFilter: 'yearly', selectedPeriodDate: '2026-11-07' })).map(
        (entry) => entry.id
      )
    ).toEqual(['FRIDAY', 'SATURDAY', 'THURSDAY', 'NEXT', 'DECEMBER']);
    expect(
      filterFinancialTransactions(entries, filters({ periodFilter: 'daily', selectedPeriodDate: '2026-11-14' }))
    ).toEqual([]);
    expect(
      filterFinancialTransactions(entries, filters({ periodFilter: 'weekly', selectedPeriodDate: 'ليس تاريخاً' }))
    ).toEqual([]);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-07T12:00:00.000Z'));
    try {
      expect(
        filterFinancialTransactions(entries, filters({ periodFilter: 'weekly', selectedPeriodDate: '' })).map(
          (entry) => entry.id
        )
      ).toEqual(['SATURDAY', 'THURSDAY', 'NEXT']);
    } finally {
      vi.useRealTimers();
    }
    expect(
      filterFinancialTransactions(
        entries,
        filters({ periodFilter: 'quarterly' as unknown as FinancialFilterState['periodFilter'] })
      )
    ).toEqual(entries.filter((entry) => entry.date));
    expect(
      filterFinancialTransactions(entries, filters({ startDate: '2026-11-07', endDate: '2026-11-12' })).map(
        (entry) => entry.id
      )
    ).toEqual(['SATURDAY', 'THURSDAY']);
  });

  it('يبقي بداية الأسبوع يوم السبت مهما اختلفت المنطقة الزمنية للمتصفح', () => {
    const previousTimeZone = process.env.TZ;
    process.env.TZ = 'Asia/Aden';
    try {
      const entries = [
        transaction({ id: 'FRIDAY', date: '2026-11-06' }),
        transaction({ id: 'SATURDAY', date: '2026-11-07' }),
      ];
      expect(
        filterFinancialTransactions(entries, filters({ periodFilter: 'weekly', selectedPeriodDate: '2026-11-07' })).map(
          (entry) => entry.id
        )
      ).toEqual(['SATURDAY']);
    } finally {
      process.env.TZ = previousTimeZone;
    }
  });

  it('يولد المعرف التالي من معرفات ACC الرقمية فقط', () => {
    expect(generateNextTransactionId([])).toBe('ACC-1001');
    expect(
      generateNextTransactionId([
        transaction({ id: 'ACC-1002' }),
        transaction({ id: 'ACC-1010' }),
        transaction({ id: 'ACC-ليس-رقماً' }),
        transaction({ id: 'OTHER-9999' }),
        transaction({ id: '' }),
      ])
    ).toBe('ACC-1011');
  });
});

describe('R63 — خدمة المالية', () => {
  let outbox: ReturnType<typeof vi.spyOn>;
  let audit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    outbox = vi.spyOn(Outbox, 'enqueue').mockReturnValue({} as OutboxMutation);
    audit = vi.spyOn(auditService, 'log').mockReturnValue({} as CentralAuditEntry);
  });

  it('يقرأ السجل ويجمع العملات والتصنيفات عبر نفس عقد الدفتر', () => {
    const repo = createRepo();
    const transactions = [
      transaction({ amountYER: 100, amountSAR: 2, amountUSD: 3 }),
      transaction({ id: 'ACC-1002', movement: 'منصرف', amountYER: 40 }),
      transaction({ id: 'ACC-1003', movement: 'ملاحظة', amountYER: 7 }),
    ];
    vi.mocked(repo.getAll).mockReturnValue(transactions);
    const service = new FinancialService(repo);

    expect(service.getAll()).toEqual(transactions);
    expect(service.getSummary()).toEqual({
      totalReceiptsYER: 100,
      totalPaymentsYER: 40,
      netBalanceYER: 60,
      totalSAR: 2,
      totalUSD: 3,
      transactionsCount: 3,
      unclassifiedYER: 7,
      unclassifiedCount: 1,
    });
    expect(service.getSummary([])).toEqual({
      totalReceiptsYER: 0,
      totalPaymentsYER: 0,
      netBalanceYER: 0,
      totalSAR: 0,
      totalUSD: 0,
      transactionsCount: 0,
      unclassifiedYER: 0,
      unclassifiedCount: 0,
    });
  });

  it('يتعامل مع القيم الرقمية النصية وغير القابلة للتحويل في ملخص الخدمة', () => {
    const repo = createRepo();
    const service = new FinancialService(repo);
    const entry = transaction({
      amountYER: '12' as unknown as number,
      amountSAR: 'غير رقم' as unknown as number,
      amountUSD: '4' as unknown as number,
    });
    expect(service.getSummary([entry, transaction({ amountYER: 0, amountSAR: 0, amountUSD: 0 })])).toMatchObject({
      totalReceiptsYER: 12,
      totalSAR: 0,
      totalUSD: 4,
    });
  });

  it('يسجل القيد الجديد أو المحدّث في المستودع والطابور', () => {
    const repo = createRepo();
    const service = new FinancialService(repo);
    const entry = transaction();
    const stored = transaction({ description: 'محفوظ' });

    vi.mocked(repo.getById).mockReturnValueOnce(null).mockReturnValueOnce(entry).mockReturnValueOnce(entry);
    vi.mocked(repo.add).mockReturnValue(stored);
    vi.mocked(repo.update).mockReturnValueOnce(stored).mockReturnValueOnce(null);

    expect(service.saveTransaction(entry)).toEqual(stored);
    expect(service.saveTransaction(entry)).toEqual(stored);
    expect(service.saveTransaction(entry)).toEqual(entry);
    expect(outbox).toHaveBeenNthCalledWith(1, 'FinancialTransaction', 'INSERT', entry.id, stored);
    expect(outbox).toHaveBeenNthCalledWith(2, 'FinancialTransaction', 'UPDATE', entry.id, stored);
    expect(outbox).toHaveBeenNthCalledWith(3, 'FinancialTransaction', 'UPDATE', entry.id, entry);
  });

  it('لا يحذف الغائب ويسجل حذف الموجود الناجح فقط', () => {
    const repo = createRepo();
    const service = new FinancialService(repo);
    const entry = transaction({ accountName: '', description: undefined });

    vi.mocked(repo.getById).mockReturnValueOnce(null).mockReturnValueOnce(entry).mockReturnValueOnce(entry);
    vi.mocked(repo.delete).mockReturnValueOnce(false).mockReturnValueOnce(true);

    expect(service.deleteTransaction('غائب')).toBe(false);
    expect(service.deleteTransaction(entry.id)).toBe(false);
    expect(service.deleteTransaction(entry.id)).toBe(true);
    expect(audit).toHaveBeenCalledTimes(1);
    expect(outbox).toHaveBeenCalledWith('FinancialTransaction', 'DELETE', entry.id, entry);
  });

  it('ينشئ عملية الطابور لقيد العكس الناجح ولا يفعل شيئاً إذا رفضه المستودع', () => {
    const repo = createRepo();
    const service = new FinancialService(repo);
    const original = transaction();
    const reversal = transaction({ id: 'REV-1001', amountYER: -100 });

    vi.mocked(repo.reverseTransaction).mockReturnValueOnce(null).mockReturnValueOnce({ original, reversal });

    expect(service.reverseTransaction(original.id, 'تصحيح')).toBe(false);
    expect(service.reverseTransaction(original.id, 'تصحيح')).toBe(true);
    expect(outbox).toHaveBeenCalledTimes(1);
    expect(outbox).toHaveBeenCalledWith('FinancialTransaction', 'INSERT', reversal.id, reversal);
  });
});
