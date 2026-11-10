/** سلامة البيانات البذرية لدفاتر الديون والالتزامات (R54). */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ALI_QAT_DEBTS,
  DEFAULT_ANWAR_DEBTS,
  DEFAULT_DEBT_RECORDS,
  DEFAULT_PREVIOUS_DEBTS,
  DEFAULT_ZAHA_DEBTS,
} from '../../src/utils/debts/debtSeeds';
import { DEFAULT_DEBT_COMMITMENTS } from '../../src/utils/debts/debtCommitmentSeeds';

describe('البيانات البذرية للدفاتر', () => {
  it('يجمع السجل الموحد كل الدفاتر مرة واحدة وبترتيب ثابت', () => {
    const ledgers = [DEFAULT_ANWAR_DEBTS, DEFAULT_PREVIOUS_DEBTS, DEFAULT_ZAHA_DEBTS, DEFAULT_ALI_QAT_DEBTS];
    const sourceIds = ledgers.flat().map((record) => record.id);

    expect(DEFAULT_DEBT_RECORDS).toHaveLength(126);
    expect(sourceIds).toHaveLength(126);
    expect(new Set(sourceIds).size).toBe(sourceIds.length);
    expect(DEFAULT_DEBT_RECORDS.map((record) => record.id)).toEqual(sourceIds);
  });

  it('يحافظ كل دفتر على هويته وعملهاته الصالحة ومبالغ غير سالبة', () => {
    const expectedBooks = [
      [DEFAULT_ANWAR_DEBTS, 'anwar', ['YER']],
      [DEFAULT_PREVIOUS_DEBTS, 'previous', ['YER', 'SAR']],
      [DEFAULT_ZAHA_DEBTS, 'zaha', ['YER', 'USD']],
      [DEFAULT_ALI_QAT_DEBTS, 'ali_qat', ['YER']],
    ] as const;

    for (const [records, book, currencies] of expectedBooks) {
      expect(records.length).toBeGreaterThan(0);
      expect(records.every((record) => record.book === book)).toBe(true);
      expect([...new Set(records.map((record) => record.currency))].sort()).toEqual([...currencies].sort());
      expect(records.every((record) => record.id && record.name && record.date)).toBe(true);
      expect(records.every((record) => record.debit >= 0 && record.credit >= 0)).toBe(true);
    }
  });

  it('قيود علي القات مرتبة زمنياً ومعرّفاتها المتسلسلة صالحة للرصد التراكمي في الواجهة', () => {
    for (let index = 0; index < DEFAULT_ALI_QAT_DEBTS.length; index++) {
      const record = DEFAULT_ALI_QAT_DEBTS[index];
      expect(record.id).toBe(`QAT-${String(index + 1).padStart(3, '0')}`);
      if (index > 0) expect(record.date >= DEFAULT_ALI_QAT_DEBTS[index - 1].date).toBe(true);
    }
  });
});

describe('البيانات البذرية للالتزامات', () => {
  it('معرّفات فريدة وفترات صحيحة ودفعات لا تتجاوز أصل الالتزام', () => {
    expect(DEFAULT_DEBT_COMMITMENTS).toHaveLength(12);
    expect(new Set(DEFAULT_DEBT_COMMITMENTS.map((commitment) => commitment.id)).size).toBe(
      DEFAULT_DEBT_COMMITMENTS.length
    );

    for (const commitment of DEFAULT_DEBT_COMMITMENTS) {
      expect(commitment.endDate >= commitment.date).toBe(true);
      expect(['A', 'B', 'C']).toContain(commitment.priority);
      expect(['YER', 'USD', 'SAR']).toContain(commitment.currency);
      expect(['debit', 'credit']).toContain(commitment.dir);
      expect(commitment.payments.reduce((sum, payment) => sum + payment.amount, 0)).toBeLessThanOrEqual(
        commitment.amount
      );
    }
  });

  it('المبالغ لا تختلط في فحص البيانات: 1,326,000 ريال و700 دولار و1,800 سعودي', () => {
    const total = (currency: string) =>
      DEFAULT_DEBT_COMMITMENTS.filter((commitment) => commitment.currency === currency).reduce(
        (sum, commitment) => sum + commitment.amount,
        0
      );

    expect(total('YER')).toBe(1_326_000);
    expect(total('USD')).toBe(700);
    expect(total('SAR')).toBe(1800);
  });
});
