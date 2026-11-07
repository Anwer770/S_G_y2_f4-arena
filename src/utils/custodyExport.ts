import { CustodyIssueRecord } from '../types/custodyIssues';
import * as XLSX from 'xlsx';

/**
 * Normalize Arabic text for search (ignoring alef/ya/ta marbuta variances)
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآا]/g, 'ا')
    .replace(/[يى]/g, 'ي')
    .replace(/[ةه]/g, 'ه')
    .replace(/[\u064B-\u065F]/g, ''); // Remove tashkeel/diacritics
}

/**
 * Filter and search custody records with Arabic normalization
 */
export function searchCustodyRecords(
  records: CustodyIssueRecord[],
  query: string
): CustodyIssueRecord[] {
  if (!query || !query.trim()) return records;
  const normalizedQuery = normalizeArabicText(query);

  return records.filter((r) => {
    const combined = [
      r.id,
      r.name || '',
      r.desc || '',
      r.cat || '',
      r.resp || '',
      r.status || '',
      r.pri || '',
      r.notes || '',
      r.corruptedRefText || '',
    ]
      .map((field) => normalizeArabicText(field))
      .join(' ');

    return combined.includes(normalizedQuery);
  });
}

/**
 * Export Custody & Issues to CSV with UTF-8 BOM for Arabic Excel support
 */
export function exportCustodyToCSV(records: CustodyIssueRecord[], filename = 'custody_issues_ledger.csv'): void {
  const headers = [
    'المعرف',
    'القسم',
    'التاريخ',
    'الاسم/الجهة',
    'الوصف التفصيلي',
    'الفئة',
    'الأولوية',
    'الحالة',
    'المسؤول',
    'المبلغ',
    'العملة',
    'ملاحظات',
    'الرابط',
    'مرجع تالف؟',
  ];

  const rows = records.map((r) => [
    r.id || '',
    r.section === 'custody' ? 'العهد وحسابات' : 'الاشكاليات المعلقة',
    r.date || '',
    `"${(r.name || '').replace(/"/g, '""')}"`,
    `"${(r.desc || '').replace(/"/g, '""')}"`,
    `"${(r.cat || '').replace(/"/g, '""')}"`,
    r.pri || '',
    r.status || 'بدون حالة',
    `"${(r.resp || '').replace(/"/g, '""')}"`,
    r.amount !== undefined ? r.amount : '',
    r.currency || 'ريال يمني',
    `"${(r.notes || '').replace(/"/g, '""')}"`,
    r.link || '',
    r.isCorruptedReference ? 'نعم (⚠️ مرجع تالف)' : 'لا',
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  // UTF-8 BOM for Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export module data as JSON
 */
export function exportCustodyToJSON(records: CustodyIssueRecord[], filename = 'custody_issues_backup.json'): void {
  const data = {
    module: 'custody_and_pending_issues',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    recordsCount: records.length,
    records,
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Custody & Issues to XLSX with native Arabic RTL sheet
 */
export function exportCustodyToExcel(records: CustodyIssueRecord[], filename = 'سجل_العهد_والاشكاليات.xlsx'): void {
  const rows = records.map((r) => ({
    'المعرف': r.id || '',
    'القسم': r.section === 'custody' ? 'العهد وحسابات' : 'الاشكاليات المعلقة',
    'التاريخ': r.date || '',
    'الاسم/الجهة': r.name || '',
    'الوصف التفصيلي': r.desc || '',
    'الفئة': r.cat || '',
    'الأولوية': r.pri || '',
    'الحالة': r.status || 'بدون حالة',
    'المسؤول': r.resp || '',
    'المبلغ': r.amount !== undefined ? r.amount : '',
    'العملة': r.currency || 'ريال يمني',
    'ملاحظات': r.notes || '',
    'الرابط': r.link || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  if (!ws['!views']) ws['!views'] = [];
  ws['!views'].push({ rightToLeft: true });
  XLSX.utils.book_append_sheet(wb, ws, 'العهد_والإشكاليات');
  XLSX.writeFile(wb, filename);
}
