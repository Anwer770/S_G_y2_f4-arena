import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Customer, CustomerFilterState, CustomerVisitRecord } from '../../src/types';
import { auditService, type CentralAuditEntry } from '../../src/core/audit/AuditService';
import { CustomerRepository } from '../../src/database/repositories/CustomerRepository';
import { CustomerService } from '../../src/services/crm/CustomerService';
import { Outbox, type OutboxMutation } from '../../src/sync/Outbox';
import {
  calculateCustomerStats,
  filterCustomersList,
  generateNextCustomerId,
  getTodayArabicDay,
  isCustomerVisitDueToday,
  planCustomerDeletion,
} from '../../src/utils/customers';

const customer = (overrides: Partial<Customer> = {}): Customer => ({
  id: 'CUST-1001',
  subId: 'ذهبي-001',
  name: 'عميل الاختبار',
  source: 'القيصر الذهبي',
  region: 'صنعاء',
  route: 'السبت',
  significance: 'A',
  status: 'مخطط',
  responsible: 'أنور',
  balanceYER: 100,
  balanceSAR: 10,
  balanceUSD: 5,
  notes: 'ملاحظات اختبار',
  phone: '777000111',
  address: 'شارع التحرير',
  ...overrides,
});

const visit = (overrides: Partial<CustomerVisitRecord> = {}): CustomerVisitRecord => ({
  id: 'VST-1001',
  customerId: 'CUST-1001',
  customerName: 'عميل الاختبار',
  date: '2026-11-07',
  dayOfWeek: 'السبت',
  responsible: 'أنور',
  status: 'مكتمل',
  notes: 'تمت الزيارة',
  createdAt: '2026-11-07T12:00:00.000Z',
  ...overrides,
});

const filters = (overrides: Partial<CustomerFilterState> = {}): CustomerFilterState => ({
  search: '',
  source: '',
  region: '',
  route: '',
  significance: '',
  status: '',
  responsible: '',
  debtorsOnly: false,
  internalOnly: false,
  todayVisitsOnly: false,
  currencyFilter: 'all',
  ...overrides,
});

const createRepo = () =>
  ({
    getAll: vi.fn<() => Customer[]>(() => []),
    getById: vi.fn<(id: string) => Customer | null>(() => null),
    add: vi.fn<(entry: Customer) => Customer>((entry) => entry),
    update: vi.fn<(id: string, patch: Partial<Customer>) => Customer | null>(() => null),
    delete: vi.fn<(id: string) => boolean>(() => false),
    getVisits: vi.fn<() => CustomerVisitRecord[]>(() => []),
    addVisit: vi.fn<(entry: CustomerVisitRecord) => CustomerVisitRecord>((entry) => entry),
    saveVisits: vi.fn<(entries: CustomerVisitRecord[]) => void>(),
  }) as unknown as CustomerRepository;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-07T12:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('R68 — مسارات وإحصاءات دفتر العملاء', () => {
  it('يحسب اليوم العربي ومسارات الأسبوع وبداية/نصف/نهاية الشهر', () => {
    expect(getTodayArabicDay()).toBe('السبت');
    expect(isCustomerVisitDueToday('السبت')).toBe(true);
    expect(isCustomerVisitDueToday('بداية الشهر')).toBe(true);
    expect(isCustomerVisitDueToday('شهري')).toBe(true);
    expect(isCustomerVisitDueToday('الأحد')).toBe(false);

    vi.setSystemTime(new Date('2026-11-15T12:00:00.000Z'));
    expect(isCustomerVisitDueToday('نص الشهر')).toBe(true);
    expect(isCustomerVisitDueToday('بداية الشهر')).toBe(false);

    vi.setSystemTime(new Date('2026-11-25T12:00:00.000Z'));
    expect(isCustomerVisitDueToday('نهاية الشهر')).toBe(true);
    expect(isCustomerVisitDueToday('نص الشهر')).toBe(false);
  });

  it('يفصل المبالغ والمصادر والحالات والمسؤوليات ولا يزوّر المصدر الفارغ أو الرصيد المشوّه', () => {
    const customers = [
      customer({ id: 'CUST-1001', source: 'القيصر الذهبي', status: 'مكتمل', balanceYER: 100, isInternalAccount: true }),
      customer({
        id: 'CUST-1002',
        source: '',
        status: 'قيد تنفيذ',
        significance: 'B',
        route: 'بداية الشهر',
        balanceYER: -20,
        balanceSAR: 0,
        balanceUSD: 0,
        responsible: 'صدام',
      }),
      customer({
        id: 'CUST-1003',
        source: 'عفيف',
        status: 'مخطط',
        significance: 'C',
        route: 'الأحد',
        balanceYER: 0,
        balanceSAR: 4,
        balanceUSD: 0,
        responsible: 'صدام',
      }),
      customer({
        id: 'CUST-1004',
        source: 'أخرى',
        status: 'متابعة',
        significance: '√',
        route: 'شهري',
        balanceYER: 0,
        balanceSAR: 0,
        balanceUSD: 7,
        responsible: '',
      }),
      customer({
        id: 'CUST-1005',
        source: undefined as unknown as Customer['source'],
        status: 'مصفر',
        significance: '',
        route: '',
        region: '',
        balanceYER: Number.POSITIVE_INFINITY,
        balanceSAR: Number.NEGATIVE_INFINITY,
        balanceUSD: Number.NaN,
        responsible: '',
      }),
      customer({
        id: 'CUST-1006',
        source: 'مصدر غير معروف' as Customer['source'],
        status: 'ملغي',
        significance: '' as Customer['significance'],
        route: 'نهاية الشهر',
        balanceYER: 0,
        balanceSAR: 0,
        balanceUSD: 0,
        responsible: 'أنور',
      }),
      customer({
        id: 'CUST-1007',
        source: 'توب مكياجي',
        status: '',
        significance: '' as Customer['significance'],
        route: 'نص الشهر',
        balanceYER: 0,
        balanceSAR: 0,
        balanceUSD: 0,
        responsible: 'أنور',
      }),
    ];

    const stats = calculateCustomerStats(customers, [visit(), visit({ id: 'VST-1002', status: 'مخطط' })]);

    expect(stats).toMatchObject({
      totalCustomers: 7,
      totalBalanceYER: 80,
      totalBalanceSAR: 14,
      totalBalanceUSD: 12,
      positiveBalanceYER: 100,
      totalDebtYER: 20,
      debtorCount: 1,
      internalAccountsCount: 1,
      visitsCount: 2,
      completedVisitsCount: 1,
      inProgressVisitsCount: 1,
      plannedVisitsCount: 1,
      followUpVisitsCount: 1,
      visitCompletionRate: 14,
      todayVisitsTotal: 3,
      todayVisitsCompleted: 1,
    });
    expect(stats.sourceBreakdown['']).toMatchObject({ count: 1, balanceYER: -20, debtorCount: 1, totalDebtYER: 20 });
    expect(stats.sourceBreakdown.أخرى.count).toBe(2);
    expect(stats.sourceBreakdown['مصدر غير معروف' as Customer['source']]).toMatchObject({ count: 1 });
    expect(stats.regionBreakdown).toContainEqual({ region: 'غير محدد', count: 1, percentage: 14 });
    expect(stats.routeBreakdown).toContainEqual({ route: 'غير محدد', count: 1 });
    expect(stats.significanceBreakdown).toEqual([
      { key: 'A', count: 1 },
      { key: 'B', count: 1 },
      { key: 'C', count: 1 },
      { key: '√', count: 1 },
    ]);
    expect(stats.statusBreakdown).toContainEqual({ key: 'مصفر', count: 1 });
    expect(stats.responsibleStats).toContainEqual({
      name: 'أنور',
      total: 3,
      completed: 1,
      inProgress: 0,
      balanceYER: 100,
    });
    expect(stats.topDebtors.map((entry) => entry.id)).toEqual(['CUST-1002']);
    expect(stats.topBalances[0]?.id).toBe('CUST-1001');
    expect(calculateCustomerStats([])).toMatchObject({
      totalCustomers: 0,
      visitCompletionRate: 0,
      regionBreakdown: [],
    });
    expect(
      calculateCustomerStats([
        customer({ id: 'CUST-DEBT-1', balanceYER: -1 }),
        customer({ id: 'CUST-DEBT-2', balanceYER: -2 }),
      ]).topDebtors.map((entry) => entry.id)
    ).toEqual(['CUST-DEBT-2', 'CUST-DEBT-1']);
  });

  it('يبحث في كل الحقول ويطبق المرشحات المستقلة من دون خلط الرصيد أو الزيارة', () => {
    const complete = customer({
      id: 'CUST-SEARCH',
      subId: 'SUB-SEARCH',
      name: 'NAME-SEARCH',
      phone: 'PHONE-SEARCH',
      address: 'ADDRESS-SEARCH',
      responsible: 'RESPONSIBLE-SEARCH',
      region: 'REGION-SEARCH',
      notes: 'NOTES-SEARCH',
      source: 'توب مكياجي',
      significance: 'B',
      status: 'مكتمل',
      balanceYER: -1,
      balanceSAR: 2,
      balanceUSD: 3,
      isInternalAccount: true,
    });
    const sparse = customer({
      id: 'CUST-SPARSE',
      name: 'SPARSE',
      subId: 'SPARSE-001',
      phone: undefined,
      address: undefined,
      responsible: '',
      region: '',
      notes: undefined,
      route: 'الأحد',
      balanceYER: 0,
      balanceSAR: 0,
      balanceUSD: 0,
    });

    for (const query of [
      'name-search',
      'cust-search',
      'sub-search',
      'phone-search',
      'address-search',
      'responsible-search',
      'region-search',
      'notes-search',
    ]) {
      expect(filterCustomersList([complete], filters({ search: query }))).toEqual([complete]);
    }
    expect(filterCustomersList([complete, sparse], filters({ search: 'غير موجود' }))).toEqual([]);

    const fields: Array<[keyof CustomerFilterState, string]> = [
      ['source', complete.source],
      ['region', complete.region],
      ['route', complete.route],
      ['significance', complete.significance],
      ['status', complete.status],
      ['responsible', complete.responsible],
    ];
    for (const [field, value] of fields) {
      expect(filterCustomersList([complete], filters({ [field]: value }))).toEqual([complete]);
      expect(filterCustomersList([complete], filters({ [field]: 'غير مطابق' }))).toEqual([]);
    }

    expect(filterCustomersList([complete], filters({ source: 'الكل' }))).toEqual([complete]);
    expect(
      filterCustomersList([complete], filters({ debtorsOnly: true, internalOnly: true, todayVisitsOnly: true }))
    ).toEqual([complete]);
    expect(filterCustomersList([sparse], filters({ debtorsOnly: true }))).toEqual([]);
    expect(filterCustomersList([sparse], filters({ internalOnly: true }))).toEqual([]);
    expect(filterCustomersList([sparse], filters({ todayVisitsOnly: true }))).toEqual([]);
    expect(filterCustomersList([complete], filters({ currencyFilter: 'YER' }))).toEqual([complete]);
    expect(filterCustomersList([complete], filters({ currencyFilter: 'SAR' }))).toEqual([complete]);
    expect(filterCustomersList([complete], filters({ currencyFilter: 'USD' }))).toEqual([complete]);
    expect(filterCustomersList([sparse], filters({ currencyFilter: 'YER' }))).toEqual([]);
    expect(filterCustomersList([sparse], filters({ currencyFilter: 'SAR' }))).toEqual([]);
    expect(filterCustomersList([sparse], filters({ currencyFilter: 'USD' }))).toEqual([]);
  });

  it('يولّد معرفاً رئيسياً وفرعياً لا يعيد استخدام رقم حُذف، ويخطط الحذف المتتابع بدقة', () => {
    const customers = [
      customer({ id: 'CUST-1009', subId: 'ذهبي-001' }),
      customer({ id: 'CUST-1002', subId: 'ذهبي-003' }),
      customer({ id: 'CUST-1003', subId: 'معرف-فرعي-غير-صالح' }),
      customer({ id: 'معرف غير صالح', source: 'توب مكياجي', subId: 'توب-009' }),
    ];
    expect(generateNextCustomerId(customers, 'القيصر الذهبي')).toEqual({ id: 'CUST-1010', subId: 'ذهبي-004' });
    expect(generateNextCustomerId([customer({ source: 'القيصر الذهبي', subId: 'ذهبي-010' })], 'القيصر الذهبي')).toEqual(
      {
        id: 'CUST-1002',
        subId: 'ذهبي-011',
      }
    );
    expect(generateNextCustomerId([], 'توب مكياجي')).toEqual({ id: 'CUST-1001', subId: 'توب-001' });
    expect(generateNextCustomerId([], 'عفيف')).toMatchObject({ subId: 'عفيف-001' });
    expect(generateNextCustomerId([], 'الأطباء')).toMatchObject({ subId: 'د-001' });
    expect(generateNextCustomerId([], 'أخرى')).toMatchObject({ subId: 'ذهبي-001' });

    expect(
      planCustomerDeletion(customers, [visit(), visit({ id: 'VST-2', customerId: 'CUST-1009' })], 'CUST-1009')
    ).toMatchObject({
      found: true,
      customer: customers[0],
      requiresCascade: true,
    });
    expect(planCustomerDeletion(customers, [], 'CUST-1002')).toMatchObject({
      found: true,
      relatedVisits: [],
      requiresCascade: false,
    });
    expect(planCustomerDeletion(customers, [], 'غير موجود')).toMatchObject({
      found: false,
      customer: null,
      relatedVisits: [],
      requiresCascade: false,
    });
  });
});

describe('R68 — خدمة العملاء', () => {
  it('يقرأ العميل وزياراته ويسجل الإنشاء والتحديث حتى عند فشل المستودع الجزئي', () => {
    const repo = createRepo();
    const service = new CustomerService(repo);
    const entry = customer();
    const saved = customer({ name: 'عميل محفوظ' });
    const outbox = vi.spyOn(Outbox, 'enqueue').mockReturnValue({} as OutboxMutation);
    const audit = vi.spyOn(auditService, 'log').mockReturnValue({} as CentralAuditEntry);

    vi.mocked(repo.getAll).mockReturnValue([entry]);
    vi.mocked(repo.getVisits).mockReturnValue([visit()]);
    expect(service.getAll()).toEqual([entry]);
    expect(service.getById(entry.id)).toBeNull();
    expect(service.getVisits()).toEqual([visit()]);

    vi.mocked(repo.getById).mockReturnValueOnce(null);
    vi.mocked(repo.add).mockReturnValue(saved);
    expect(service.saveCustomer(entry)).toEqual(saved);
    expect(audit).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'Create', entity: 'Customer' }));
    expect(outbox).toHaveBeenLastCalledWith('Customer', 'INSERT', entry.id, entry);

    const noRegion = customer({ id: 'CUST-NO-REGION', region: '' });
    vi.mocked(repo.getById).mockReturnValueOnce(null);
    vi.mocked(repo.add).mockReturnValue(noRegion);
    expect(service.saveCustomer(noRegion)).toEqual(noRegion);
    expect(audit).toHaveBeenLastCalledWith(expect.objectContaining({ details: expect.stringContaining('()') }));

    vi.mocked(repo.getById).mockReturnValue(entry);
    vi.mocked(repo.update).mockReturnValueOnce(saved).mockReturnValueOnce(null);
    expect(service.saveCustomer(entry)).toEqual(saved);
    expect(service.saveCustomer(entry)).toEqual(entry);
    expect(outbox).toHaveBeenLastCalledWith('Customer', 'UPDATE', entry.id, entry);
    expect(audit).toHaveBeenCalledTimes(4);
  });

  it('لا يكتب تدقيقاً أو طابوراً لحذف مرفوض، ويسجل الحذف والزيارة والدفعة الناجحة', () => {
    const repo = createRepo();
    const service = new CustomerService(repo);
    const entry = customer();
    const entryVisit = visit();
    const outbox = vi.spyOn(Outbox, 'enqueue').mockReturnValue({} as OutboxMutation);
    const audit = vi.spyOn(auditService, 'log').mockReturnValue({} as CentralAuditEntry);

    vi.mocked(repo.getById).mockReturnValueOnce(null).mockReturnValueOnce(entry).mockReturnValueOnce(entry);
    vi.mocked(repo.delete).mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(service.deleteCustomer('غير موجود')).toBe(false);
    expect(service.deleteCustomer(entry.id)).toBe(false);
    expect(service.deleteCustomer(entry.id)).toBe(true);
    expect(audit).toHaveBeenCalledTimes(1);
    expect(outbox).toHaveBeenCalledWith('Customer', 'DELETE', entry.id, entry);

    vi.mocked(repo.addVisit).mockReturnValue(entryVisit);
    expect(service.recordVisit(entryVisit)).toEqual(entryVisit);
    expect(outbox).toHaveBeenLastCalledWith('CustomerVisit', 'INSERT', entryVisit.id, entryVisit);
    service.saveVisits([entryVisit]);
    expect(repo.saveVisits).toHaveBeenCalledWith([entryVisit]);
  });
});
