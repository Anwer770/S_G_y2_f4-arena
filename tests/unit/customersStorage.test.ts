// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dbStorage } from '../../src/database/dbStorage';
import {
  CUSTOMER_REGIONS,
  CUSTOMER_RESPONSIBLES,
  CUSTOMER_ROUTES,
  CUSTOMER_SOURCES,
  DEFAULT_CUSTOMERS,
  DEFAULT_CUSTOMER_VISITS,
} from '../../src/data/defaultCustomers';
import type { CustomerAuditLog } from '../../src/types';
import {
  loadCustomerAuditLogs,
  loadCustomerRegions,
  loadCustomerResponsibles,
  loadCustomerRoutes,
  loadCustomerSources,
  loadCustomerVisits,
  loadCustomers,
  logCustomerAudit,
  saveCustomerAuditLogs,
  saveCustomerRegions,
  saveCustomerResponsibles,
  saveCustomerRoutes,
  saveCustomerSources,
  saveCustomerVisits,
  saveCustomers,
} from '../../src/utils/storage/customers';
import { STORAGE_KEYS } from '../../src/utils/storage/keys';

beforeEach(() => {
  dbStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-07T12:00:00.000Z'));
});

afterEach(() => {
  dbStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('R69 — استمرارية دفتر العملاء', () => {
  it('يفصل الغياب عن الفراغ: الدفاتر الأساسية تعود للبذور، أما الزيارات والتدقيق ففارغان مشروعان', () => {
    expect(loadCustomers()).toEqual(DEFAULT_CUSTOMERS);
    expect(loadCustomerVisits()).toEqual(DEFAULT_CUSTOMER_VISITS);
    expect(loadCustomerSources()).toEqual(CUSTOMER_SOURCES);
    expect(loadCustomerRegions()).toEqual(CUSTOMER_REGIONS);
    expect(loadCustomerRoutes()).toEqual(CUSTOMER_ROUTES);
    expect(loadCustomerResponsibles()).toEqual(CUSTOMER_RESPONSIBLES);
    expect(loadCustomerAuditLogs()).toEqual([expect.objectContaining({ id: 'LOG-CUST-1', action: 'استيراد' })]);

    saveCustomers([]);
    saveCustomerSources([]);
    saveCustomerRegions([]);
    saveCustomerRoutes([]);
    saveCustomerResponsibles([]);
    expect(loadCustomers()).toEqual(DEFAULT_CUSTOMERS);
    expect(loadCustomerSources()).toEqual(CUSTOMER_SOURCES);
    expect(loadCustomerRegions()).toEqual(CUSTOMER_REGIONS);
    expect(loadCustomerRoutes()).toEqual(CUSTOMER_ROUTES);
    expect(loadCustomerResponsibles()).toEqual(CUSTOMER_RESPONSIBLES);

    saveCustomerVisits([]);
    saveCustomerAuditLogs([]);
    expect(loadCustomerVisits()).toEqual([]);
    expect(loadCustomerAuditLogs()).toEqual([]);
  });

  it('يحفظ كل دفتر عميل على مفتاحه المستقل، ولا يخلط عميلًا أو زيارةً أو قائمة خيارات بأخرى', () => {
    const customer = { ...DEFAULT_CUSTOMERS[0]!, id: 'CUST-R69', name: 'عميل محفوظ R69' };
    const visit = { ...DEFAULT_CUSTOMER_VISITS[0]!, id: 'VST-R69', customerId: customer.id };

    saveCustomers([customer]);
    saveCustomerVisits([visit]);
    saveCustomerSources(['مصدر R69']);
    saveCustomerRegions(['منطقة R69']);
    saveCustomerRoutes(['مسار R69']);
    saveCustomerResponsibles(['مسؤول R69']);

    expect(loadCustomers()).toEqual([customer]);
    expect(loadCustomerVisits()).toEqual([visit]);
    expect(loadCustomerSources()).toEqual(['مصدر R69']);
    expect(loadCustomerRegions()).toEqual(['منطقة R69']);
    expect(loadCustomerRoutes()).toEqual(['مسار R69']);
    expect(loadCustomerResponsibles()).toEqual(['مسؤول R69']);
    expect(dbStorage.getItem(STORAGE_KEYS.CUSTOMERS_VISITS)).not.toContain('عميل محفوظ R69');
    expect(dbStorage.getItem(STORAGE_KEYS.CUSTOMERS_ITEMS)).not.toContain('VST-R69');
  });

  it('يرفض JSON التالف والشكل غير المصفوفي بأمان ولا يمرر بيانات دخيلة إلى الدفاتر', () => {
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_ITEMS, '{تالف');
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_VISITS, JSON.stringify({ visit: 'ليس قائمة' }));
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_SOURCES, JSON.stringify({ source: 'ليس قائمة' }));
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_REGIONS, '{تالف');
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_ROUTES, JSON.stringify({ route: 'ليس قائمة' }));
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_RESPONSIBLES, '{تالف');
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_AUDIT, JSON.stringify({ audit: 'ليس قائمة' }));

    expect(loadCustomers()).toEqual(DEFAULT_CUSTOMERS);
    expect(loadCustomerVisits()).toEqual(DEFAULT_CUSTOMER_VISITS);
    expect(loadCustomerSources()).toEqual(CUSTOMER_SOURCES);
    expect(loadCustomerRegions()).toEqual(CUSTOMER_REGIONS);
    expect(loadCustomerRoutes()).toEqual(CUSTOMER_ROUTES);
    expect(loadCustomerResponsibles()).toEqual(CUSTOMER_RESPONSIBLES);
    expect(loadCustomerAuditLogs()).toEqual([expect.objectContaining({ id: 'LOG-CUST-1' })]);
  });

  it('يكتب أحدث تدقيق أولاً، ويبقي معرفه فريداً حتى لحدثين في اللحظة نفسها، ويقص السجل إلى 500', () => {
    saveCustomerAuditLogs([]);
    vi.spyOn(Date, 'now').mockReturnValue(1730000000000);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    logCustomerAudit('إضافة', 'عميل أول', 'حدث أول');
    const firstId = loadCustomerAuditLogs()[0]!.id;
    saveCustomerAuditLogs([
      {
        id: `${firstId}-1`,
        time: '2026-11-07T12:00:00.000Z',
        action: 'استيراد',
        customerName: 'تضارب',
        details: 'لاحقة محجوزة',
      },
      ...loadCustomerAuditLogs(),
    ]);
    logCustomerAudit('تعديل', 'عميل ثان', 'حدث ثان');

    const newLogs = loadCustomerAuditLogs();
    expect(newLogs).toEqual([
      expect.objectContaining({ id: `${firstId}-2`, action: 'تعديل', customerName: 'عميل ثان', details: 'حدث ثان' }),
      expect.objectContaining({ id: `${firstId}-1`, customerName: 'تضارب' }),
      expect.objectContaining({ id: firstId, action: 'إضافة', customerName: 'عميل أول', details: 'حدث أول' }),
    ]);
    expect(new Set(newLogs.map((entry) => entry.id)).size).toBe(3);

    const logs: CustomerAuditLog[] = Array.from({ length: 501 }, (_, index) => ({
      id: `LOG-R69-${index}`,
      time: '2026-11-07T12:00:00.000Z',
      action: 'تعديل',
      customerName: String(index),
      details: `تفصيل ${index}`,
    }));
    saveCustomerAuditLogs(logs);
    expect(loadCustomerAuditLogs()).toHaveLength(500);
    expect(loadCustomerAuditLogs()[0]?.id).toBe('LOG-R69-0');
    expect(loadCustomerAuditLogs()[499]?.id).toBe('LOG-R69-499');
  });

  it('يعزل القارئ البذور والمدخلات المحفوظة عن تعديل المستهلك من دون حفظ صريح', () => {
    const originalCustomerName = DEFAULT_CUSTOMERS[0]!.name;
    const originalSource = CUSTOMER_SOURCES[0]!;
    const customers = loadCustomers();
    const sources = loadCustomerSources();
    customers[0]!.name = 'تعديل لا يلوّث البذرة';
    sources[0] = 'مصدر لا يلوّث البذرة';

    expect(DEFAULT_CUSTOMERS[0]!.name).toBe(originalCustomerName);
    expect(CUSTOMER_SOURCES[0]).toBe(originalSource);
    expect(loadCustomers()[0]!.name).toBe(originalCustomerName);
    expect(loadCustomerSources()[0]).toBe(originalSource);

    const saved = [{ ...DEFAULT_CUSTOMERS[0]!, id: 'CUST-IMMUTABLE' }];
    saveCustomers(saved);
    saved[0]!.name = 'تغيير الذاكرة بعد الحفظ';
    expect(loadCustomers()[0]!.name).toBe(originalCustomerName);
  });
});
