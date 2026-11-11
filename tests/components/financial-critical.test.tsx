import React, { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { FinancialTransaction } from '../../src/types';
import type { WorkCommitment } from '../../src/types/workos';
import { FinancialModal } from '../../src/components/financial/FinancialModal';
import { FinancialModule } from '../../src/components/financial/FinancialModule';

vi.mock('../../src/utils/workosStorage', () => ({
  downloadUnifiedWorkOSTemplate: vi.fn(),
  exportUnifiedWorkOSToExcel: vi.fn(),
  importUnifiedWorkOSFromExcel: vi.fn(),
  runSmartAutomationEngine: () => ({ updatedOrdersCount: 0, triggeredAlerts: [] }),
  saveCommitments: vi.fn(),
  saveOrders: vi.fn(),
  saveTasks: vi.fn(),
  triggerConfetti: vi.fn(),
}));

import { CentralUnifiedLedger } from '../../src/components/workos/CentralUnifiedLedger';

const financialLookups = {
  movements: ['ايرادات', 'منصرف'],
  restrictions: ['سند قبض', 'سند صرف'],
  movementTypes: ['نقدا'],
  importanceList: ['√'],
  categoryAccounts: ['تحصيل'],
  restrictionAccounts: ['الخزينة الرئيسية'],
  accountNames: ['شركة الاختبار'],
};

const createTransaction = (overrides: Partial<FinancialTransaction> = {}): FinancialTransaction => ({
  id: 'ACC-R60-001',
  day: 'الأحد',
  date: '2026-11-07',
  importance: '√',
  movement: 'ايرادات',
  restriction: 'سند قبض',
  movementType: 'نقدا',
  categoryAccount: 'تحصيل',
  restrictionAccount: 'الخزينة الرئيسية',
  accountName: 'شركة الاختبار',
  description: 'قيد اختبار',
  number: 'R60-001',
  amountYER: 0,
  amountSAR: 0,
  amountUSD: 0,
  isDraft: false,
  ...overrides,
});

const renderFinancialModule = (transactions: FinancialTransaction[]) =>
  render(
    <FinancialModule
      transactions={transactions}
      onSaveTransaction={vi.fn()}
      onDeleteTransaction={vi.fn()}
      {...financialLookups}
    />
  );

describe('R60: financial components', () => {
  it('adds a financial entry and renders it in the journal table', async () => {
    const user = userEvent.setup();

    const FinancialModuleHarness = () => {
      const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);

      return (
        <FinancialModule
          transactions={transactions}
          onSaveTransaction={(transaction) => setTransactions((current) => [...current, transaction])}
          onDeleteTransaction={vi.fn()}
          {...financialLookups}
        />
      );
    };

    render(<FinancialModuleHarness />);

    await user.click(screen.getByRole('button', { name: /قيد جديد/ }));
    await screen.findByLabelText(/اسم الحساب \/ العميل/);
    await user.clear(screen.getByLabelText(/الرقم \(رقم السند/));
    await user.type(screen.getByLabelText(/الرقم \(رقم السند/), 'R60-NEW-001');
    await user.type(screen.getByLabelText(/المبلغ \(ريال يمني/), '1250');
    await user.type(screen.getByPlaceholderText(/اكتب تفاصيل القيد/), 'قيد قبول R60 الظاهر في السجل');
    await user.click(screen.getByRole('button', { name: 'تسجيل القيد في السجل' }));

    const savedRow = await screen.findByRole('row', { name: /R60-NEW-001/ });
    expect(within(savedRow).getByText('شركة الاختبار')).not.toBeNull();
    expect(savedRow.textContent).toContain('قيد قبول R60 الظاهر في السجل');
    expect(savedRow.textContent).toContain('1,250.00');
  });

  it('keeps the period indicators and journal total aligned with the displayed rows', () => {
    const transactions = [
      createTransaction({ id: 'ACC-R60-101', number: 'R60-101', amountYER: 1200 }),
      createTransaction({
        id: 'ACC-R60-102',
        number: 'R60-102',
        accountName: 'عميل ثان',
        amountYER: 300,
      }),
      createTransaction({
        id: 'ACC-R60-103',
        number: 'R60-103',
        movement: 'منصرف',
        restriction: 'سند صرف',
        accountName: 'مورد اختبار',
        amountYER: 200,
      }),
    ];

    renderFinancialModule(transactions);

    const totalOfDisplayedRows = transactions.reduce((sum, transaction) => sum + transaction.amountYER, 0);
    const incomeOfDisplayedRows = transactions
      .filter((transaction) => transaction.movement === 'ايرادات')
      .reduce((sum, transaction) => sum + transaction.amountYER, 0);
    const expenseOfDisplayedRows = transactions
      .filter((transaction) => transaction.movement === 'منصرف')
      .reduce((sum, transaction) => sum + transaction.amountYER, 0);

    expect(screen.getByText('ACC-R60-101')).not.toBeNull();
    expect(screen.getByText('ACC-R60-102')).not.toBeNull();
    expect(screen.getByText('ACC-R60-103')).not.toBeNull();
    expect(
      screen.getByText(
        `${totalOfDisplayedRows.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} YER`
      )
    ).not.toBeNull();

    const incomeIndicator = screen.getByText('وارد الفترة').parentElement;
    const expenseIndicator = screen.getByText('مصروف الفترة').parentElement;
    const netIndicator = screen.getByText('صافي الفترة').parentElement;
    expect(incomeIndicator?.textContent).toContain(incomeOfDisplayedRows.toLocaleString());
    expect(expenseIndicator?.textContent).toContain(expenseOfDisplayedRows.toLocaleString());
    expect(netIndicator?.textContent).toContain((incomeOfDisplayedRows - expenseOfDisplayedRows).toLocaleString());
  });

  it('rejects a completed entry when no account has been selected', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <FinancialModal
        isOpen
        onClose={vi.fn()}
        onSave={onSave}
        existingTransactions={[]}
        {...financialLookups}
        accountNames={[]}
      />
    );

    await user.type(screen.getByLabelText(/الرقم \(رقم السند/), 'R60-NO-ACCOUNT');
    await user.type(screen.getByLabelText(/المبلغ \(ريال يمني/), '100');
    await user.click(screen.getByRole('button', { name: 'تسجيل القيد في السجل' }));

    expect(await screen.findByText('يرجى اختيار أو تحديد اسم الحساب.')).not.toBeNull();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('updates a financial commitment through the central unified ledger', async () => {
    const user = userEvent.setup();
    const pendingCommitment: WorkCommitment = {
      id: 'COM-R60-001',
      title: 'التزام اختبار R60',
      entity: 'مورد الاختبار',
      person: 'المحاسب',
      description: '',
      commitmentDate: '2026-11-07',
      dueDate: '2099-01-01',
      status: 'pending',
      importance: 'A',
      notes: '',
      amount: 500,
      currency: 'YER',
      commitmentType: 'payable',
    };

    const LedgerHarness = () => {
      const [commitments, setCommitments] = useState([pendingCommitment]);
      return (
        <CentralUnifiedLedger orders={[]} tasks={[]} commitments={commitments} onUpdateCommitments={setCommitments} />
      );
    };

    render(<LedgerHarness />);
    await user.click(screen.getByRole('button', { name: 'تسوية' }));

    expect(await screen.findByRole('button', { name: '✓ مسدد' })).not.toBeNull();
    expect(screen.getByText('تم الوفاء')).not.toBeNull();
  });
});
