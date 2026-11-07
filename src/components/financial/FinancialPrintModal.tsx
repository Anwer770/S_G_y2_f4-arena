import React, { useRef } from 'react';
import { FinancialSummary } from '../../utils/financial';
import { FinancialTransaction } from '../../types';
import { Printer, X, Download, FileText, Calendar, Building, CheckCircle2 } from 'lucide-react';

interface FinancialPrintModalProps {
  transactions: FinancialTransaction[];
  periodSummary: FinancialSummary;
  periodLabel: string;
  isOpen: boolean;
  onClose: () => void;
}

export const FinancialPrintModal: React.FC<FinancialPrintModalProps> = ({
  transactions,
  periodSummary,
  periodLabel,
  isOpen,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayDate = new Date().toLocaleDateString('ar-YE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const printTime = new Date().toLocaleTimeString('ar-YE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white dark:print:bg-slate-900"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 8mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: #fff !important;
          }
          .print-hidden {
            display: none !important;
          }
          .print-card {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[96vh] border border-slate-200 dark:border-slate-800 print:border-none print:shadow-none print:max-h-none print:w-full my-auto">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs print-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-xl text-teal-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black">طباعة تقرير السجل اليومي والقيود</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                {periodLabel} • {transactions.length} قيد محاسبي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الآن / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500 hover:text-white transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div ref={printRef} className="p-6 sm:p-10 overflow-y-auto flex-1 space-y-6 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-teal-600"></span>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    شركة بريمو لمستحضرات التجميل
                  </h1>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                  كشف السجل اليومي للعمليات والقيود المالية وحركات الصندوق
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <strong>الفترة:</strong> {periodLabel}
                  </span>
                  <span>|</span>
                  <span><strong>تاريخ الطباعة:</strong> {todayDate} - {printTime}</span>
                </div>
              </div>

              <div className="text-left border-r-2 border-slate-200 dark:border-slate-700 pr-4">
                <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  تقرير مالي رسمي
                </span>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">الرقم المرجعي: #{Date.now().toString().slice(-6)}</div>
              </div>
            </div>
          </div>

          {/* 4 Summary Cards (Matching Annotation 2026-09-23 032005.png) */}
          <div className="grid grid-cols-4 gap-3 print-card">
            {/* 1. وارد الفترة */}
            <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-right">وارد الفترة</span>
              <div className="mt-2 text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 text-right leading-none">
                {periodSummary.totalIncomeYER.toLocaleString()}
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">ريال يمني</span>
            </div>

            {/* 2. مصروف الفترة */}
            <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-right">مصروف الفترة</span>
              <div className="mt-2 text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 text-right leading-none">
                {periodSummary.totalExpenseYER.toLocaleString()}
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">ريال يمني</span>
            </div>

            {/* 3. صافي الفترة */}
            <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-right">صافي الفترة</span>
              <div className={`mt-2 text-xl sm:text-2xl font-black font-mono text-right leading-none ${
                periodSummary.netBalanceYER >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {periodSummary.netBalanceYER.toLocaleString()}
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">فارق الحركة</span>
            </div>

            {/* 4. عدد الحركات */}
            <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-right">عدد الحركات</span>
              <div className="mt-2 text-xl sm:text-2xl font-black font-mono text-teal-600 dark:text-teal-400 text-right leading-none">
                {transactions.length}
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">حركة مالية</span>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="w-full overflow-x-auto print:overflow-visible">
            <table className="w-full text-right text-xs border-collapse min-w-[820px] print:min-w-0">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700 text-xs">
                  <th className="py-2.5 px-3 w-16">رقم القيد</th>
                  <th className="py-2.5 px-3 w-24">التاريخ</th>
                  <th className="py-2.5 px-3 w-20">الحركة</th>
                  <th className="py-2.5 px-3 w-28">نوع القيد</th>
                  <th className="py-2.5 px-3">البيان والشرح</th>
                  <th className="py-2.5 px-3 w-28">اسم الحساب</th>
                  <th className="py-2.5 px-3 text-left w-24 text-emerald-700 dark:text-emerald-300">وارد (YER)</th>
                  <th className="py-2.5 px-3 text-left w-24 text-rose-700 dark:text-rose-300">منصرف (YER)</th>
                  <th className="py-2.5 px-3 text-left w-20">عملات أخرى</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      لا توجد قيود مالية مسجلة في هذه الفترة
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn, index) => {
                    const isIncome =
                      txn.movement === 'ايرادات' ||
                      txn.movement === 'الصندوق' ||
                      txn.movement === 'حساب له' ||
                      txn.movement === 'حساب دائن (له)';
                    const isExpense =
                      txn.movement === 'منصرف' ||
                      txn.movement === 'حساب عليه' ||
                      txn.movement === 'سلفه' ||
                      txn.movement === 'حساب مدين (ع)';

                    const yerVal = txn.amountYER || 0;
                    const incomeYER = isIncome ? yerVal : 0;
                    const expenseYER = isExpense ? yerVal : 0;

                    return (
                      <tr
                        key={txn.id}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                      >
                        <td className="py-2 px-3 font-mono font-bold text-teal-800 dark:text-teal-200">
                          {txn.id}
                          {txn.isDraft && (
                            <span className="mr-1 text-xs text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                              مسودة
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {txn.date}
                        </td>
                        <td className="py-2 px-3 font-medium">
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                              isIncome
                                ? 'bg-emerald-100 text-emerald-800'
                                : isExpense
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {txn.movement}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-200">
                          {txn.restriction || '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-800 dark:text-slate-200 max-w-xs truncate">
                          {txn.description || txn.categoryAccount || '-'}
                          {txn.attachmentUrl && (
                            <span className="text-xs text-slate-400 dark:text-slate-500 block">
                              مستند: {txn.attachmentUrl}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-200">
                          {txn.accountName || txn.restrictionAccount || '-'}
                        </td>
                        <td className="py-2 px-3 text-left font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          {incomeYER > 0 ? incomeYER.toLocaleString() : '-'}
                        </td>
                        <td className="py-2 px-3 text-left font-mono font-bold text-rose-700 dark:text-rose-300">
                          {expenseYER > 0 ? expenseYER.toLocaleString() : '-'}
                        </td>
                        <td className="py-2 px-3 text-left font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {txn.amountSAR ? `${txn.amountSAR.toLocaleString()} SAR` : ''}
                          {txn.amountUSD ? `${txn.amountUSD.toLocaleString()} $` : ''}
                          {!txn.amountSAR && !txn.amountUSD ? '-' : ''}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {transactions.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-600">
                    <td colSpan={6} className="py-3 px-3 text-right">
                      الإجمالي العام للفترة ({transactions.length} قيد)
                    </td>
                    <td className="py-3 px-3 text-left font-mono text-sm text-emerald-700 dark:text-emerald-300">
                      {periodSummary.totalIncomeYER.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-left font-mono text-sm text-rose-700 dark:text-rose-300">
                      {periodSummary.totalExpenseYER.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-left font-mono text-xs">
                      {periodSummary.totalSAR > 0 && `${periodSummary.totalSAR.toLocaleString()} SAR `}
                      {periodSummary.totalUSD > 0 && `${periodSummary.totalUSD.toLocaleString()} $`}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
            </div>
          </div>

          {/* Signatures & Official Approvals */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-6">
              <span className="font-bold text-slate-600 dark:text-slate-300 block">إعداد وتدوين المحاسب</span>
              <div className="h-10 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
              <span className="text-xs text-slate-400 dark:text-slate-500">التوقيع والتاريخ</span>
            </div>

            <div className="space-y-6">
              <span className="font-bold text-slate-600 dark:text-slate-300 block">المراجعة والتدقيق المالي</span>
              <div className="h-10 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
              <span className="text-xs text-slate-400 dark:text-slate-500">التوقيع والتاريخ</span>
            </div>

            <div className="space-y-6">
              <span className="font-bold text-slate-600 dark:text-slate-300 block">اعتماد المدير المالي / العام</span>
              <div className="h-10 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
              <span className="text-xs text-slate-400 dark:text-slate-500">الختم والتوقيع</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
