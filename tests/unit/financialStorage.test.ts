// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { dbStorage } from '../../src/database/dbStorage';
import {
  DEFAULT_ACCOUNT_NAMES,
  DEFAULT_CATEGORY_ACCOUNTS,
  DEFAULT_FINANCIAL_TRANSACTIONS,
  DEFAULT_IMPORTANCE_LIST,
  DEFAULT_MOVEMENTS,
  DEFAULT_MOVEMENT_TYPES,
  DEFAULT_RESTRICTION_ACCOUNTS,
  DEFAULT_RESTRICTIONS,
} from '../../src/data/defaultFinancial';
import {
  loadFinancialAccountNames,
  loadFinancialCategoryAccounts,
  loadFinancialImportanceList,
  loadFinancialMovements,
  loadFinancialMovementTypes,
  loadFinancialRestrictionAccounts,
  loadFinancialRestrictions,
  loadFinancialTransactions,
  saveFinancialAccountNames,
  saveFinancialCategoryAccounts,
  saveFinancialImportanceList,
  saveFinancialMovements,
  saveFinancialMovementTypes,
  saveFinancialRestrictionAccounts,
  saveFinancialRestrictions,
  saveFinancialTransactions,
} from '../../src/utils/storage/financial';
import { STORAGE_KEYS } from '../../src/utils/storage/keys';

beforeEach(() => dbStorage.clear());
afterEach(() => dbStorage.clear());

describe('R71 — استمرارية السجل المالي', () => {
  it('يعيد الدفاتر المالية الثمانية إلى بذورها عند الغياب أو المصفوفة الفارغة', () => {
    expect(loadFinancialTransactions()).toEqual(DEFAULT_FINANCIAL_TRANSACTIONS);
    expect(loadFinancialMovements()).toEqual(DEFAULT_MOVEMENTS);
    expect(loadFinancialRestrictions()).toEqual(DEFAULT_RESTRICTIONS);
    expect(loadFinancialMovementTypes()).toEqual(DEFAULT_MOVEMENT_TYPES);
    expect(loadFinancialImportanceList()).toEqual(DEFAULT_IMPORTANCE_LIST);
    expect(loadFinancialCategoryAccounts()).toEqual(DEFAULT_CATEGORY_ACCOUNTS);
    expect(loadFinancialRestrictionAccounts()).toEqual(DEFAULT_RESTRICTION_ACCOUNTS);
    expect(loadFinancialAccountNames()).toEqual(DEFAULT_ACCOUNT_NAMES);

    saveFinancialTransactions([]);
    saveFinancialMovements([]);
    saveFinancialRestrictions([]);
    saveFinancialMovementTypes([]);
    saveFinancialImportanceList([]);
    saveFinancialCategoryAccounts([]);
    saveFinancialRestrictionAccounts([]);
    saveFinancialAccountNames([]);

    expect(loadFinancialTransactions()).toEqual(DEFAULT_FINANCIAL_TRANSACTIONS);
    expect(loadFinancialMovements()).toEqual(DEFAULT_MOVEMENTS);
    expect(loadFinancialRestrictions()).toEqual(DEFAULT_RESTRICTIONS);
    expect(loadFinancialMovementTypes()).toEqual(DEFAULT_MOVEMENT_TYPES);
    expect(loadFinancialImportanceList()).toEqual(DEFAULT_IMPORTANCE_LIST);
    expect(loadFinancialCategoryAccounts()).toEqual(DEFAULT_CATEGORY_ACCOUNTS);
    expect(loadFinancialRestrictionAccounts()).toEqual(DEFAULT_RESTRICTION_ACCOUNTS);
    expect(loadFinancialAccountNames()).toEqual(DEFAULT_ACCOUNT_NAMES);
  });

  it('يحفظ السجل وكل قائمة على مفتاحها المالي المستقل بلا خلط بين القيود وخياراتها', () => {
    const transaction = {
      ...DEFAULT_FINANCIAL_TRANSACTIONS[0]!,
      id: 'ACC-R71',
      description: 'قيد مالي محفوظ R71',
    };

    saveFinancialTransactions([transaction]);
    saveFinancialMovements(['حركة R71']);
    saveFinancialRestrictions(['قيد R71']);
    saveFinancialMovementTypes(['طريقة R71']);
    saveFinancialImportanceList(['أهمية R71']);
    saveFinancialCategoryAccounts(['فئة R71']);
    saveFinancialRestrictionAccounts(['تقييد R71']);
    saveFinancialAccountNames(['حساب R71']);

    expect(loadFinancialTransactions()).toEqual([transaction]);
    expect(loadFinancialMovements()).toEqual(['حركة R71']);
    expect(loadFinancialRestrictions()).toEqual(['قيد R71']);
    expect(loadFinancialMovementTypes()).toEqual(['طريقة R71']);
    expect(loadFinancialImportanceList()).toEqual(['أهمية R71']);
    expect(loadFinancialCategoryAccounts()).toEqual(['فئة R71']);
    expect(loadFinancialRestrictionAccounts()).toEqual(['تقييد R71']);
    expect(loadFinancialAccountNames()).toEqual(['حساب R71']);
    expect(dbStorage.getItem(STORAGE_KEYS.FIN_TRANSACTIONS)).not.toContain('حركة R71');
    expect(dbStorage.getItem(STORAGE_KEYS.FIN_MOVEMENTS)).not.toContain('قيد مالي محفوظ R71');
  });

  it('يرفض JSON التالف والشكل غير المصفوفي بأمان ولا يمرر بيانات دخيلة إلى الدفاتر المالية', () => {
    dbStorage.setItem(STORAGE_KEYS.FIN_TRANSACTIONS, '{تالف');
    dbStorage.setItem(STORAGE_KEYS.FIN_MOVEMENTS, JSON.stringify({ movement: 'ليست قائمة' }));
    dbStorage.setItem(STORAGE_KEYS.FIN_RESTRICTIONS, '{تالف');
    dbStorage.setItem(STORAGE_KEYS.FIN_MOVEMENT_TYPES, JSON.stringify({ type: 'ليست قائمة' }));
    dbStorage.setItem(STORAGE_KEYS.FIN_IMPORTANCE, '{تالف');
    dbStorage.setItem(STORAGE_KEYS.FIN_CATEGORY_ACCOUNTS, JSON.stringify({ category: 'ليست قائمة' }));
    dbStorage.setItem(STORAGE_KEYS.FIN_RESTRICTION_ACCOUNTS, '{تالف');
    dbStorage.setItem(STORAGE_KEYS.FIN_ACCOUNT_NAMES, JSON.stringify({ account: 'ليست قائمة' }));

    expect(loadFinancialTransactions()).toEqual(DEFAULT_FINANCIAL_TRANSACTIONS);
    expect(loadFinancialMovements()).toEqual(DEFAULT_MOVEMENTS);
    expect(loadFinancialRestrictions()).toEqual(DEFAULT_RESTRICTIONS);
    expect(loadFinancialMovementTypes()).toEqual(DEFAULT_MOVEMENT_TYPES);
    expect(loadFinancialImportanceList()).toEqual(DEFAULT_IMPORTANCE_LIST);
    expect(loadFinancialCategoryAccounts()).toEqual(DEFAULT_CATEGORY_ACCOUNTS);
    expect(loadFinancialRestrictionAccounts()).toEqual(DEFAULT_RESTRICTION_ACCOUNTS);
    expect(loadFinancialAccountNames()).toEqual(DEFAULT_ACCOUNT_NAMES);
  });

  it('يعزل بذور القيود والقوائم عن تعديل المستهلك قبل أي حفظ صريح', () => {
    const originalDescription = DEFAULT_FINANCIAL_TRANSACTIONS[0]!.description;
    const originalMovement = DEFAULT_MOVEMENTS[0]!;
    const transactions = loadFinancialTransactions();
    const movements = loadFinancialMovements();
    transactions[0]!.description = 'تعديل لا يلوّث البذرة';
    movements[0] = 'حركة لا تلوّث البذرة';

    expect(DEFAULT_FINANCIAL_TRANSACTIONS[0]!.description).toBe(originalDescription);
    expect(DEFAULT_MOVEMENTS[0]).toBe(originalMovement);
    expect(loadFinancialTransactions()[0]!.description).toBe(originalDescription);
    expect(loadFinancialMovements()[0]).toBe(originalMovement);
  });

  it('يعزل مدخلات الحفظ وقراءات القيد التالية عن تعديل الذاكرة اللاحق', () => {
    const transactions = [{ ...DEFAULT_FINANCIAL_TRANSACTIONS[0]!, id: 'ACC-IMMUTABLE' }];
    const accounts = ['حساب محفوظ R71'];

    saveFinancialTransactions(transactions);
    saveFinancialAccountNames(accounts);
    transactions[0]!.description = 'تعديل الذاكرة بعد الحفظ';
    accounts[0] = 'حساب معدّل بعد الحفظ';

    expect(loadFinancialTransactions()[0]!.description).toBe(DEFAULT_FINANCIAL_TRANSACTIONS[0]!.description);
    expect(loadFinancialAccountNames()).toEqual(['حساب محفوظ R71']);
  });
});
