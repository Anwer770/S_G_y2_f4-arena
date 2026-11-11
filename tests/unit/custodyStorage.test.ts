// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dbStorage } from '../../src/database/dbStorage';
import {
  calculateCustodyKPIs,
  loadCustodyAuditLogs,
  loadCustodyCategories,
  loadCustodyIssues,
  loadCustodyPriorities,
  loadCustodyResponsibles,
  loadCustodyStatuses,
  logCustodyAudit,
  resetCustodyToDefault,
  saveCustodyAuditLogs,
  saveCustodyCategories,
  saveCustodyIssues,
  saveCustodyPriorities,
  saveCustodyResponsibles,
  saveCustodyStatuses,
} from '../../src/utils/storage/custody';
import { STORAGE_KEYS } from '../../src/utils/storage/keys';
import {
  DEFAULT_CUSTODY_CATEGORIES,
  DEFAULT_CUSTODY_ISSUES_RECORDS,
  DEFAULT_CUSTODY_PRIORITIES,
  DEFAULT_CUSTODY_RESPONSIBLES,
  DEFAULT_CUSTODY_STATUSES,
} from '../../src/data/defaultCustodyIssues';
import type { CustodyIssueRecord } from '../../src/types/custodyIssues';

describe('R57 — مخزن العهد: البذور والسجل وKPIs والاستعادة', () => {
  beforeEach(() => dbStorage.clear());
  afterEach(() => {
    dbStorage.clear();
    vi.restoreAllMocks();
  });

  it('يقرأ البذور للقوائم والسجلات عند الغياب أو المصفوفة الفارغة، ويحفظ القيم الصريحة', () => {
    expect(loadCustodyIssues()).toEqual(DEFAULT_CUSTODY_ISSUES_RECORDS);
    expect(loadCustodyCategories()).toEqual(DEFAULT_CUSTODY_CATEGORIES);
    expect(loadCustodyResponsibles()).toEqual(DEFAULT_CUSTODY_RESPONSIBLES);
    expect(loadCustodyStatuses()).toEqual(DEFAULT_CUSTODY_STATUSES);
    expect(loadCustodyPriorities()).toEqual(DEFAULT_CUSTODY_PRIORITIES);

    saveCustodyIssues([]);
    saveCustodyCategories([]);
    saveCustodyResponsibles([]);
    saveCustodyStatuses([]);
    saveCustodyPriorities([]);
    expect(loadCustodyIssues()).toEqual(DEFAULT_CUSTODY_ISSUES_RECORDS);
    expect(loadCustodyCategories()).toEqual(DEFAULT_CUSTODY_CATEGORIES);
    expect(loadCustodyResponsibles()).toEqual(DEFAULT_CUSTODY_RESPONSIBLES);
    expect(loadCustodyStatuses()).toEqual(DEFAULT_CUSTODY_STATUSES);
    expect(loadCustodyPriorities()).toEqual(DEFAULT_CUSTODY_PRIORITIES);

    const explicit = [{ ...DEFAULT_CUSTODY_ISSUES_RECORDS[0], id: 'explicit' }];
    saveCustodyIssues(explicit);
    saveCustodyCategories(['فئة مخصصة']);
    saveCustodyResponsibles(['مسؤول مخصص']);
    saveCustodyStatuses(['حالة مخصصة']);
    saveCustodyPriorities(['P0']);
    expect(loadCustodyIssues()).toEqual(explicit);
    expect(loadCustodyCategories()).toEqual(['فئة مخصصة']);
    expect(loadCustodyResponsibles()).toEqual(['مسؤول مخصص']);
    expect(loadCustodyStatuses()).toEqual(['حالة مخصصة']);
    expect(loadCustodyPriorities()).toEqual(['P0']);
  });

  it('يحافظ على سجل التدقيق الفارغ، يضيف أحدث حدث في المقدمة، ويقصه إلى 100', () => {
    expect(loadCustodyAuditLogs()).toEqual([]);
    saveCustodyAuditLogs([]);
    expect(loadCustodyAuditLogs()).toEqual([]);

    vi.spyOn(Date, 'now').mockReturnValue(1730000000000);
    logCustodyAudit('تعديل', 'تفاصيل التعديل', 'CI-7');
    expect(loadCustodyAuditLogs()).toEqual([
      expect.objectContaining({
        id: 'LOG-CI-1730000000000',
        module: 'عهدة',
        action: 'تعديل',
        details: 'تفاصيل التعديل',
        recordId: 'CI-7',
      }),
    ]);

    saveCustodyAuditLogs(
      Array.from({ length: 101 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: String(i),
        module: 'عهدة',
        action: 'فحص',
        details: '',
      }))
    );
    expect(loadCustodyAuditLogs()).toHaveLength(100);
    expect(loadCustodyAuditLogs()[0].id).toBe('log-0');
  });

  it('يحسب حالات وأولويات ومسؤولين وعملات السجل، بما فيها القيم الفارغة والتالفة', () => {
    const records: CustodyIssueRecord[] = [
      {
        id: '1',
        section: 'custody',
        date: '',
        name: '',
        desc: 'Schedule!A1',
        cat: '',
        pri: 'A',
        status: 'مكتمل',
        resp: ' خالد ',
        amount: 10,
        currency: 'ريال يمني',
      },
      {
        id: '2',
        section: 'issues',
        date: '',
        name: '',
        desc: '',
        cat: '',
        pri: 'b',
        status: 'مخطط',
        resp: '',
        amount: 20,
        currency: 'دولار',
      },
      {
        id: '3',
        section: 'issues',
        date: '',
        name: '',
        desc: '',
        cat: '',
        pri: '√',
        status: 'مؤجل',
        resp: 'خالد',
        amount: 30,
        currency: 'ريال سعودي',
      },
      {
        id: '4',
        section: 'other' as 'custody',
        date: '',
        name: '',
        desc: '',
        cat: '',
        pri: 'v',
        status: 'متأخر',
        resp: 'مها',
        amount: -3,
      },
      {
        id: '5',
        section: 'issues',
        date: '',
        name: '',
        desc: '',
        cat: '',
        pri: 'check',
        status: 'شركة',
        resp: 'مها',
        amount: 4,
        currency: 'دولار',
      },
      {
        id: '6',
        section: 'issues',
        date: '',
        name: '',
        desc: '',
        cat: '',
        pri: 'z',
        status: 'ملغي',
        resp: 'مها',
        amount: 5,
        currency: 'غير معروف',
        isCorruptedReference: true,
      },
      {
        id: '7',
        section: 'custody',
        date: '',
        name: '',
        desc: '',
        cat: '',
        pri: 'C',
        status: '',
        resp: '  ',
        amount: 0,
      },
      {
        id: '8',
        section: 'issues',
        date: '',
        name: '',
        desc: '',
        cat: '',
        pri: 'D',
        status: 'بدون حالة',
        resp: 'مها',
        amount: 7,
      },
      {
        id: '9',
        section: 'issues',
        date: '',
        name: '',
        desc: '',
        cat: '',
        pri: '',
        status: '',
        resp: 'مها',
        amount: 0,
      },
    ];
    expect(calculateCustodyKPIs(records)).toEqual({
      total: 9,
      custodyCount: 2,
      issuesCount: 6,
      completedCount: 1,
      plannedCount: 1,
      postponedCount: 1,
      lateCount: 1,
      companyCount: 1,
      cancelledCount: 1,
      unclassifiedCount: 3,
      corruptedCount: 2,
      priorityCounts: { A: 1, B: 1, C: 1, D: 1, check: 3, other: 2 },
      responsibleCounts: { خالد: 2, 'غير محدد': 1, مها: 5, '': 1 },
      totalAmountYEM: 22,
      totalAmountUSD: 24,
      totalAmountSAR: 30,
    });
  });

  it('يعيد كل البذور ويسجل عملية الاستعادة دون حذف سجل التدقيق السابق', () => {
    saveCustodyIssues([{ ...DEFAULT_CUSTODY_ISSUES_RECORDS[0], id: 'معدل' }]);
    saveCustodyCategories(['خاص']);
    saveCustodyResponsibles(['خاص']);
    saveCustodyStatuses(['خاص']);
    saveCustodyPriorities(['خاص']);
    saveCustodyAuditLogs([{ id: 'قديم', timestamp: '2026', module: 'عهدة', action: 'سابق', details: '' }]);
    vi.spyOn(Date, 'now').mockReturnValue(7);

    resetCustodyToDefault();

    expect(loadCustodyIssues()).toEqual(DEFAULT_CUSTODY_ISSUES_RECORDS);
    expect(loadCustodyCategories()).toEqual(DEFAULT_CUSTODY_CATEGORIES);
    expect(loadCustodyResponsibles()).toEqual(DEFAULT_CUSTODY_RESPONSIBLES);
    expect(loadCustodyStatuses()).toEqual(DEFAULT_CUSTODY_STATUSES);
    expect(loadCustodyPriorities()).toEqual(DEFAULT_CUSTODY_PRIORITIES);
    expect(loadCustodyAuditLogs()).toEqual([
      expect.objectContaining({ id: 'LOG-CI-7', action: 'استعادة' }),
      expect.objectContaining({ id: 'قديم' }),
    ]);
  });

  it('يتحمل JSON التالف وغير المصفوفات بالمفتاح الخام دون تمرير قيم خبيثة', () => {
    dbStorage.setItem(STORAGE_KEYS.CUSTODY_RECORDS, '{broken');
    dbStorage.setItem(STORAGE_KEYS.CUSTODY_CATEGORIES, JSON.stringify({ no: 'array' }));
    expect(loadCustodyIssues()).toEqual(DEFAULT_CUSTODY_ISSUES_RECORDS);
    expect(loadCustodyCategories()).toEqual(DEFAULT_CUSTODY_CATEGORIES);
  });
});
