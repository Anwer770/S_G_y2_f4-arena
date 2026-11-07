import * as XLSX from 'xlsx';
import { FinancialTransaction, Customer, MovementRecord } from '../types';
import { calculateArabicDay } from './formatters';

/**
 * Universal Excel / CSV Export Engine
 * Generates beautifully formatted spreadsheets with clean Arabic headers,
 * summary calculation totals, and proper column alignment.
 */

export function exportFinancialToExcel(
  transactions: FinancialTransaction[],
  filename = `سجل_القيود_المالية_${new Date().toISOString().slice(0, 10)}.xlsx`
): void {
  const rows = transactions.map((t, idx) => ({
    'م': idx + 1,
    'رقم القيد': t.id,
    'التاريخ': t.date,
    'اليوم': t.day || calculateArabicDay(t.date),
    'نوع الحركة': t.movement,
    'نوع السند': t.restriction,
    'طريقة الدفع': t.movementType,
    'فئة الحساب': t.categoryAccount,
    'حساب التقييد': t.restrictionAccount,
    'اسم الحساب': t.accountName,
    'رقم السند/المرجع': t.number || '',
    'المبلغ (ريال يمني YER)': Number(t.amountYER) || 0,
    'المبلغ (ريال سعودي SAR)': Number(t.amountSAR) || 0,
    'المبلغ (دولار USD)': Number(t.amountUSD) || 0,
    'درجة الأهمية': t.importance,
    'البيان والتفاصيل': t.description || '',
    'الحالة': t.isDraft ? 'مسودة' : 'معتمد',
  }));

  // Totals Row
  const totalYER = transactions.reduce((s, t) => s + (Number(t.amountYER) || 0), 0);
  const totalSAR = transactions.reduce((s, t) => s + (Number(t.amountSAR) || 0), 0);
  const totalUSD = transactions.reduce((s, t) => s + (Number(t.amountUSD) || 0), 0);

  const summaryRow = {
    'م': '',
    'رقم القيد': 'الإجمالي العام',
    'التاريخ': '',
    'اليوم': '',
    'نوع الحركة': '',
    'نوع السند': '',
    'طريقة الدفع': '',
    'فئة الحساب': '',
    'حساب التقييد': '',
    'اسم الحساب': `${transactions.length} قيد محاسبي`,
    'رقم السند/المرجع': '',
    'المبلغ (ريال يمني YER)': totalYER,
    'المبلغ (ريال سعودي SAR)': totalSAR,
    'المبلغ (دولار USD)': totalUSD,
    'درجة الأهمية': '',
    'البيان والتفاصيل': '',
    'الحالة': '',
  };

  const ws = XLSX.utils.json_to_sheet([...rows, summaryRow]);

  // Set RTL on worksheet views
  ws['!views'] = [{ rightToLeft: true }];

  // Column width hints
  ws['!cols'] = [
    { wch: 5 },  // م
    { wch: 12 }, // رقم القيد
    { wch: 12 }, // التاريخ
    { wch: 10 }, // اليوم
    { wch: 12 }, // نوع الحركة
    { wch: 14 }, // نوع السند
    { wch: 10 }, // طريقة الدفع
    { wch: 14 }, // فئة الحساب
    { wch: 14 }, // حساب التقييد
    { wch: 22 }, // اسم الحساب
    { wch: 14 }, // رقم السند
    { wch: 18 }, // YER
    { wch: 16 }, // SAR
    { wch: 14 }, // USD
    { wch: 12 }, // الأهمية
    { wch: 30 }, // البيان
    { wch: 10 }, // الحالة
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'السجل المالي اليومي');
  XLSX.writeFile(wb, filename);
}

export function exportCustomersToExcel(
  customers: Customer[],
  filename = `دليل_العملاء_${new Date().toISOString().slice(0, 10)}.xlsx`
): void {
  const rows = customers.map((c, idx) => ({
    'م': idx + 1,
    'كود العميل': c.id,
    'المعرف الفرعي': c.subId || '',
    'اسم العميل / الصيدلية': c.name,
    'المصدر': c.source,
    'المنطقة / المحافظة': c.region,
    'المسار / الخط': c.route,
    'المسؤول والمندوب': c.responsible,
    'رقم الهاتف': c.phone || '',
    'الأهمية': c.significance,
    'الحالة': c.status,
    'الرصيد (ريال يمني YER)': Number(c.balanceYER) || 0,
    'الرصيد (ريال سعودي SAR)': Number(c.balanceSAR) || 0,
    'الرصيد (دولار USD)': Number(c.balanceUSD) || 0,
    'العنوان': c.address || '',
    'ملاحظات': c.notes || '',
  }));

  const totalBalanceYER = customers.reduce((s, c) => s + (Number(c.balanceYER) || 0), 0);
  const totalBalanceSAR = customers.reduce((s, c) => s + (Number(c.balanceSAR) || 0), 0);
  const totalBalanceUSD = customers.reduce((s, c) => s + (Number(c.balanceUSD) || 0), 0);

  const summaryRow = {
    'م': '',
    'كود العميل': 'الإجمالي',
    'المعرف الفرعي': '',
    'اسم العميل / الصيدلية': `${customers.length} عميل`,
    'المصدر': '',
    'المنطقة / المحافظة': '',
    'المسار / الخط': '',
    'المسؤول والمندوب': '',
    'رقم الهاتف': '',
    'الأهمية': '',
    'الحالة': '',
    'الرصيد (ريال يمني YER)': totalBalanceYER,
    'الرصيد (ريال سعودي SAR)': totalBalanceSAR,
    'الرصيد (دولار USD)': totalBalanceUSD,
    'العنوان': '',
    'ملاحظات': '',
  };

  const ws = XLSX.utils.json_to_sheet([...rows, summaryRow]);
  ws['!views'] = [{ rightToLeft: true }];
  ws['!cols'] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 12 },
    { wch: 25 },
    { wch: 14 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 14 },
    { wch: 8 },
    { wch: 10 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 25 },
    { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'دليل العملاء');
  XLSX.writeFile(wb, filename);
}

export function exportStockMovementsToExcel(
  movements: MovementRecord[],
  filename = `حركات_المخزون_${new Date().toISOString().slice(0, 10)}.xlsx`
): void {
  const rows = movements.map((m, idx) => {
    const itemsFormatted = Object.entries(m.items || {})
      .map(([name, qty]) => `${name}: ${qty}`)
      .join(' | ');
    const totalUnits = Object.values(m.items || {}).reduce((s, q) => s + (Number(q) || 0), 0);

    return {
      'م': idx + 1,
      'رقم الحركة': m.subId,
      'التاريخ': m.date,
      'اليوم': calculateArabicDay(m.date),
      'نوع الحركة': m.movementType,
      'المستفيد / المورد': m.beneficiary,
      'التصنيف': m.category,
      'إجمالي الوحدات': totalUnits,
      'الأصناف المنصرفة/الموردة': itemsFormatted,
      'الحالة': m.status,
      'البيان / الملاحظات': m.description || m.note || '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!views'] = [{ rightToLeft: true }];
  ws['!cols'] = [
    { wch: 5 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 35 },
    { wch: 12 },
    { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'سجل حركات المخزون');
  XLSX.writeFile(wb, filename);
}
