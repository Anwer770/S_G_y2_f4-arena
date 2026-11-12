// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dbStorage } from '../../src/database/dbStorage';
import { DEBT_CATEGORIES, DEBT_OWNERS } from '../../src/utils/debts/debtCatalogs';
import { DEFAULT_DEBT_COMMITMENTS } from '../../src/utils/debts/debtCommitmentSeeds';
import { DEFAULT_DEBT_RECORDS } from '../../src/utils/debts/debtSeeds';
import type { DebtAuditLog } from '../../src/types';
import {
  loadDebtAuditLogs,
  loadDebtCategories,
  loadDebtCommitments,
  loadDebtOwners,
  loadDebts,
  logDebtAudit,
  saveDebtAuditLogs,
  saveDebtCategories,
  saveDebtCommitments,
  saveDebtOwners,
  saveDebts,
} from '../../src/utils/storage/debts';
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

describe('R72 — استمرارية دفتر الديون والالتزامات', () => {
  it('يفصل الغياب عن الفراغ: الديون والالتزامات وقوائمها تعود للبذور، أما التدقيق ففارغ مشروع', () => {
    expect(loadDebts()).toEqual(DEFAULT_DEBT_RECORDS);
    expect(loadDebtCommitments()).toEqual(DEFAULT_DEBT_COMMITMENTS);
    expect(loadDebtCategories()).toEqual(DEBT_CATEGORIES);
    expect(loadDebtOwners()).toEqual(DEBT_OWNERS);
    expect(loadDebtAuditLogs()).toEqual([expect.objectContaining({ id: 'LOG-DEBT-1', action: 'استيراد' })]);

    saveDebts([]);
    saveDebtCommitments([]);
    saveDebtCategories([]);
    saveDebtOwners([]);
    expect(loadDebts()).toEqual(DEFAULT_DEBT_RECORDS);
    expect(loadDebtCommitments()).toEqual(DEFAULT_DEBT_COMMITMENTS);
    expect(loadDebtCategories()).toEqual(DEBT_CATEGORIES);
    expect(loadDebtOwners()).toEqual(DEBT_OWNERS);

    saveDebtAuditLogs([]);
    expect(loadDebtAuditLogs()).toEqual([]);
  });

  it('يحفظ كل دفتر دين على مفتاحه المستقل، ولا يخلط سجلاً أو التزاماً أو قائمة خيارات بأخرى', () => {
    const debt = { ...DEFAULT_DEBT_RECORDS[0]!, id: 'DEBT-R72', name: 'دين محفوظ R72' };
    const commitment = { ...DEFAULT_DEBT_COMMITMENTS[0]!, id: 'COM-R72' };

    saveDebts([debt]);
    saveDebtCommitments([commitment]);
    saveDebtCategories(['فئة R72']);
    saveDebtOwners(['مالك R72']);

    expect(loadDebts()).toEqual([debt]);
    expect(loadDebtCommitments()).toEqual([commitment]);
    expect(loadDebtCategories()).toEqual(['فئة R72']);
    expect(loadDebtOwners()).toEqual(['مالك R72']);
    expect(dbStorage.getItem(STORAGE_KEYS.DEBTS_COMMITMENTS)).not.toContain('دين محفوظ R72');
    expect(dbStorage.getItem(STORAGE_KEYS.DEBTS_RECORDS)).not.toContain('COM-R72');
  });

  it('يرفض JSON التالف والشكل غير المصفوفي بأمان ولا يمرر بيانات دخيلة إلى دفتر الديون', () => {
    dbStorage.setItem(STORAGE_KEYS.DEBTS_RECORDS, '{تالف');
    dbStorage.setItem(STORAGE_KEYS.DEBTS_COMMITMENTS, JSON.stringify({ commitment: 'ليست قائمة' }));
    dbStorage.setItem(STORAGE_KEYS.DEBTS_CATEGORIES, JSON.stringify({ category: 'ليست قائمة' }));
    dbStorage.setItem(STORAGE_KEYS.DEBTS_OWNERS, '{تالف');
    dbStorage.setItem(STORAGE_KEYS.DEBTS_AUDIT, JSON.stringify({ audit: 'ليست قائمة' }));

    expect(loadDebts()).toEqual(DEFAULT_DEBT_RECORDS);
    expect(loadDebtCommitments()).toEqual(DEFAULT_DEBT_COMMITMENTS);
    expect(loadDebtCategories()).toEqual(DEBT_CATEGORIES);
    expect(loadDebtOwners()).toEqual(DEBT_OWNERS);
    expect(loadDebtAuditLogs()).toEqual([expect.objectContaining({ id: 'LOG-DEBT-1' })]);
  });

  it('يكتب أحدث تدقيق أولاً، ويبقي معرفه فريداً حتى لحدثين في اللحظة نفسها، ويقص السجل إلى 500', () => {
    saveDebtAuditLogs([]);
    vi.spyOn(Date, 'now').mockReturnValue(1730000000000);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    logDebtAudit('إضافة', 'سجل دين', 'دين أول', 'حدث أول');
    const firstId = loadDebtAuditLogs()[0]!.id;
    saveDebtAuditLogs([
      {
        id: `${firstId}-1`,
        time: '2026-11-07T12:00:00.000Z',
        action: 'استيراد',
        entity: 'دفتر',
        title: 'تضارب',
        details: 'لاحقة محجوزة',
      },
      ...loadDebtAuditLogs(),
    ]);
    logDebtAudit('تعديل', 'التزام', 'دين ثان', 'حدث ثان');

    const newLogs = loadDebtAuditLogs();
    expect(newLogs).toEqual([
      expect.objectContaining({ id: `${firstId}-2`, action: 'تعديل', entity: 'التزام', title: 'دين ثان' }),
      expect.objectContaining({ id: `${firstId}-1`, title: 'تضارب' }),
      expect.objectContaining({ id: firstId, action: 'إضافة', title: 'دين أول', details: 'حدث أول' }),
    ]);
    expect(new Set(newLogs.map((entry) => entry.id)).size).toBe(3);

    const logs: DebtAuditLog[] = Array.from({ length: 501 }, (_, index) => ({
      id: `LOG-R72-${index}`,
      time: '2026-11-07T12:00:00.000Z',
      action: 'تعديل',
      entity: 'سجل دين',
      title: String(index),
      details: `تفصيل ${index}`,
    }));
    saveDebtAuditLogs(logs);
    expect(loadDebtAuditLogs()).toHaveLength(500);
    expect(loadDebtAuditLogs()[0]?.id).toBe('LOG-R72-0');
    expect(loadDebtAuditLogs()[499]?.id).toBe('LOG-R72-499');
  });

  it('يعزل القارئ البذور المتداخلة ومدخلات الحفظ عن تعديل المستهلك من دون حفظ صريح', () => {
    const originalDebtName = DEFAULT_DEBT_RECORDS[0]!.name;
    const originalCategory = DEBT_CATEGORIES[0]!;
    const originalPayment = DEFAULT_DEBT_COMMITMENTS[0]!.payments[0]!.amount;
    const debts = loadDebts();
    const categories = loadDebtCategories();
    const commitments = loadDebtCommitments();
    debts[0]!.name = 'تعديل لا يلوّث البذرة';
    categories[0] = 'فئة لا تلوّث البذرة';
    commitments[0]!.payments[0]!.amount = 999999;

    expect(DEFAULT_DEBT_RECORDS[0]!.name).toBe(originalDebtName);
    expect(DEBT_CATEGORIES[0]).toBe(originalCategory);
    expect(DEFAULT_DEBT_COMMITMENTS[0]!.payments[0]!.amount).toBe(originalPayment);
    expect(loadDebts()[0]!.name).toBe(originalDebtName);
    expect(loadDebtCategories()[0]).toBe(originalCategory);
    expect(loadDebtCommitments()[0]!.payments[0]!.amount).toBe(originalPayment);

    const saved = [
      {
        ...DEFAULT_DEBT_COMMITMENTS[0]!,
        id: 'COM-IMMUTABLE',
        payments: DEFAULT_DEBT_COMMITMENTS[0]!.payments.map((payment) => ({ ...payment })),
      },
    ];
    saveDebtCommitments(saved);
    saved[0]!.payments[0]!.amount = 0;
    expect(loadDebtCommitments()[0]!.payments[0]!.amount).toBe(originalPayment);
  });
});
