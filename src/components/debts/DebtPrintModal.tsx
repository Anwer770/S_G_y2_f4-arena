import React, { useRef } from 'react';
import { DebtBookId, DebtRecord } from '../../types';
import { DEBT_BOOKS_META, formatDebtAmount } from '../../utils/debts';
import { Printer, X, FileSpreadsheet, BookOpen, CheckCircle2 } from 'lucide-react';

interface DebtPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBook: DebtBookId;
  records: DebtRecord[];
  onExportExcel?: () => void;
}

export const DebtPrintModal: React.FC<DebtPrintModalProps> = ({
  isOpen,
  onClose,
  activeBook,
  records,
  onExportExcel,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const bookMeta = DEBT_BOOKS_META[activeBook] || {
    title: 'دفتر الدين والالتزامات',
    badge: 'كشف دين',
    description: 'كشف رسمي موثق بحركات الديون والالتزامات',
  };

  const handlePrint = () => {
    window.print();
  };

  const printDate = new Date().toLocaleDateString('ar-YE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const printTime = new Date().toLocaleTimeString('ar-YE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Calculate totals
  const totalDebit = records.reduce((sum, r) => sum + (r.debit || 0), 0);
  const totalCredit = records.reduce((sum, r) => sum + (r.credit || 0), 0);
  const netBalance = totalCredit - totalDebit;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white dark:print:bg-slate-900"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
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
          .print-container {
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-xl sm:rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] print:max-h-none print:h-auto print-container my-auto">
        {/* Modal Toolbar (Hidden on print) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 print-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black">كشف حساب رسمي: {bookMeta.title}</h2>
              <p className="text-xs text-slate-400">معاينة الطباعة لكشف الديون والحسابات المعتمد</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onExportExcel && (
              <button
                type="button"
                onClick={onExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>تصدير Excel</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Document */}
        <div ref={printRef} className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1 print:p-0 print:overflow-visible">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                  Q
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 dark:text-white">
                    مجموعة القيصر للحلول والمشاريع المتكاملة
                  </h1>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    كشف حساب دفتر الديون الرسمي • {bookMeta.title}
                  </p>
                </div>
              </div>

              <div className="text-left text-xs space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  <span className="text-slate-500 ml-1">تاريخ الكشف:</span>
                  <span>{printDate}</span>
                </div>
                <div className="font-mono text-slate-500">
                  <span className="ml-1">الوقت:</span>
                  <span>{printTime}</span>
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                  كشف معتمد
                </div>
              </div>
            </div>
          </div>

          {/* Account Summary Cards */}
          <div className="grid grid-cols-3 gap-3 print:grid-cols-3">
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50">
              <span className="text-xs font-bold text-rose-800 block mb-1">إجمالي المدين (عليه):</span>
              <span className="text-lg font-black font-mono text-rose-700">
                {formatDebtAmount(totalDebit, 'YER')}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <span className="text-xs font-bold text-emerald-800 block mb-1">إجمالي الدائن (له):</span>
              <span className="text-lg font-black font-mono text-emerald-700">
                {formatDebtAmount(totalCredit, 'YER')}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
              <span className="text-xs font-bold text-slate-700 block mb-1">صافي الرصيد الحالي:</span>
              <span className={`text-lg font-black font-mono ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {netBalance >= 0 ? 'له ' : 'عليه '}
                {formatDebtAmount(Math.abs(netBalance), 'YER')}
              </span>
            </div>
          </div>

          {/* Statement Table */}
          <div className="space-y-2">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-300">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">التاريخ</th>
                    <th className="py-2.5 px-3">البيان والتفاصيل</th>
                    <th className="py-2.5 px-3">الرمز</th>
                    <th className="py-2.5 px-3 text-left">مدين (عليه)</th>
                    <th className="py-2.5 px-3 text-left">دائن (له)</th>
                    <th className="py-2.5 px-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {records.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono text-slate-800 dark:text-slate-200">{r.date || '—'}</td>
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                        <div>{r.name}</div>
                        {r.note && <div className="text-2xs text-slate-500 font-normal">{r.note}</div>}
                      </td>
                      <td className="py-2 px-3 font-mono text-center">{r.icon || '⚑'}</td>
                      <td className="py-2 px-3 text-left font-mono font-bold text-rose-700">
                        {(r.debit || 0) > 0 ? (r.debit || 0).toLocaleString() : '—'}
                      </td>
                      <td className="py-2 px-3 text-left font-mono font-bold text-emerald-700">
                        {(r.credit || 0) > 0 ? (r.credit || 0).toLocaleString() : '—'}
                      </td>
                      <td className="py-2 px-3 text-xs">
                        {r.isCompleted ? (
                          <span className="text-emerald-700 font-bold">✔ خالص</span>
                        ) : (
                          <span className="text-slate-500">جاري</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-700">
                    <td colSpan={4} className="py-2.5 px-3 text-right">
                      المجموع الكلي ({records.length} قيد)
                    </td>
                    <td className="py-2.5 px-3 text-left font-mono text-rose-400">
                      {totalDebit.toLocaleString()} YER
                    </td>
                    <td className="py-2.5 px-3 text-left font-mono text-emerald-400">
                      {totalCredit.toLocaleString()} YER
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 mt-6 border-t-2 border-slate-300 dark:border-slate-700 grid grid-cols-2 gap-6 text-center text-xs">
            <div>
              <span className="block text-slate-500 font-bold mb-8">المحاسب المسؤول:</span>
              <div className="border-b border-dashed border-slate-400 w-44 mx-auto"></div>
            </div>
            <div>
              <span className="block text-slate-500 font-bold mb-8">مصادقة الطرف الثاني / المستفيد:</span>
              <div className="border-b border-dashed border-slate-400 w-44 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
