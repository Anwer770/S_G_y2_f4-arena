/**
 * تصدير الديون والالتزامات (CSV · Excel) — مستخرجة من utils/debts.ts (R30).
 */
import * as XLSX from 'xlsx';
import { DebtCommitment, DebtRecord } from '../../types';
import { DEBT_BOOKS_META } from './debtCatalogs';

// Export CSV with UTF-8 BOM (\uFEFF)
export function exportDebtRecordsToCSV(records: DebtRecord[], bookName: string): void {
  const headers = [
    'المعرف',
    'الدفتر',
    'التاريخ',
    'الرمز',
    'البيان والوصف',
    'العملة',
    'مدين (عليه)',
    'دائن (له)',
    'الملاحظات',
    'مكتمل',
  ];
  const rows = records.map((r) => [
    r.id,
    DEBT_BOOKS_META[r.book]?.badge || r.book,
    r.date || '',
    r.icon || '',
    `"${(r.name || '').replace(/"/g, '""')}"`,
    r.currency || 'YER',
    r.debit || 0,
    r.credit || 0,
    `"${(r.note || '').replace(/"/g, '""')}"`,
    r.isCompleted ? 'نعم' : 'لا',
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `سجل_الديون_${bookName}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export Commitments to CSV
export function exportCommitmentsToCSV(commitments: DebtCommitment[]): void {
  const headers = [
    'المعرف',
    'اسم الالتزام',
    'الوصف',
    'تاريخ القيد',
    'تاريخ الاستحقاق',
    'الأهمية',
    'الحالة',
    'الرمز',
    'المسؤول',
    'الفئة',
    'المبلغ',
    'العملة',
    'المدفوع',
    'المتبقي',
    'النوع',
    'الملاحظات',
  ];

  const rows = commitments.map((c) => {
    const paid = (c.payments || []).reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, c.amount - paid);
    return [
      c.id,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.desc || '').replace(/"/g, '""')}"`,
      c.date || '',
      c.endDate || '',
      c.priority || 'B',
      c.status || '',
      c.icon || '',
      c.owner || '',
      c.category || '',
      c.amount || 0,
      c.currency || 'YER',
      paid,
      remaining,
      c.dir === 'debit' ? 'عليه' : 'له',
      `"${(c.note || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `سجل_الالتزامات_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const exportDebtCommitmentsToCSV = exportCommitmentsToCSV;

// Export all Debts and Commitments to Excel (.xlsx)
export function exportDebtsAndCommitmentsToExcel(records: DebtRecord[], commitments: DebtCommitment[]): void {
  const debtsRows = records.map((r) => ({
    المعرف: r.id,
    الدفتر: DEBT_BOOKS_META[r.book]?.title || r.book,
    التاريخ: r.date || '',
    'الاسم / البيان': r.name,
    العملة: r.currency,
    'مدين (عليه)': r.debit || 0,
    'دائن (له)': r.credit || 0,
    الملاحظات: r.note || '',
    مكتمل: r.isCompleted ? 'نعم' : 'لا',
  }));

  const comRows = commitments.map((c) => {
    const paid = (c.payments || []).reduce((s, p) => s + p.amount, 0);
    return {
      المعرف: c.id,
      'اسم الالتزام': c.name,
      الوصف: c.desc || '',
      المبلغ: c.amount,
      العملة: c.currency,
      المدفوع: paid,
      المتبقي: Math.max(0, c.amount - paid),
      المسؤول: c.owner,
      الفئة: c.category,
      'تاريخ الاستحقاق': c.endDate,
      الحالة: c.status,
    };
  });

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(debtsRows);
  XLSX.utils.book_append_sheet(wb, ws1, 'سجل_الديون');
  const ws2 = XLSX.utils.json_to_sheet(comRows);
  XLSX.utils.book_append_sheet(wb, ws2, 'سجل_الالتزامات');
  XLSX.writeFile(wb, `سجل_الديون_والالتزامات_${new Date().toISOString().split('T')[0]}.xlsx`);
}
