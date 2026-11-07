import React from 'react';
import { MovementRecord } from '../types';
import {
  X,
  Printer,
  Package,
  Calendar,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  CheckCircle,
} from 'lucide-react';
import {
  calculateArabicDay,
  formatNumberLatin,
  getCategoryBadgeStyle,
  getMovementTypeStyle,
  getStatusStyle,
} from '../utils/formatters';

interface MovementDetailsModalProps {
  record: MovementRecord | null;
  onClose: () => void;
  onEdit: (record: MovementRecord) => void;
}

export const MovementDetailsModal: React.FC<MovementDetailsModalProps> = ({
  record,
  onClose,
  onEdit,
}) => {
  if (!record) return null;

  const moveStyle = getMovementTypeStyle(record.movementType);
  const itemsEntries = Object.entries(record.items || {});
  const totalUnits = itemsEntries.reduce((sum, [, q]) => sum + (Number(q) || 0), 0);
  const dayName = calculateArabicDay(record.date);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white dark:print:bg-slate-900"
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
          .voucher-print-container {
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] print:max-h-none print:h-auto voucher-print-container my-auto">
        {/* Top Controls Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60 print:hidden print-hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D9488] hover:bg-[#059669] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة السند</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(record);
              }}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              تعديل الحركة
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Voucher Content */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 text-xs" id="printable-voucher">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                {record.movementType === 'توريد' ? 'سند توريد مخزني (IN)' : 'سند صرف مخزني (OUT)'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">دفتر صرف وتوريد الأصناف - مستحضرات التجميل والعناية</p>
            </div>

            <div className="text-left font-mono space-y-0.5">
              <div className="text-sm font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg inline-block border border-slate-300 dark:border-slate-600">
                {record.subId}
              </div>
              {record.mainId && (
                <div className="text-xs text-slate-400 dark:text-slate-500">Main: {record.mainId}</div>
              )}
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500 block font-semibold">التاريخ:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">{record.date}</span>
              {dayName && <span className="text-xs text-slate-500 dark:text-slate-400 block">({dayName})</span>}
            </div>

            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500 block font-semibold">المستفيد / الجهة:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{record.beneficiary}</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500 block font-semibold">الفئة:</span>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border mt-0.5 ${getCategoryBadgeStyle(record.category)}`}>
                {record.category}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500 block font-semibold">الحالة:</span>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border mt-0.5 ${getStatusStyle(record.status)}`}>
                {record.status}
              </span>
            </div>
          </div>

          {/* Description & Notes */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">البيان والوصف:</span>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
              {record.description || 'لا يوجد وصف مدون'}
              {record.note && (
                <div className="text-amber-800 dark:text-amber-200 font-semibold mt-1 border-t border-slate-100 dark:border-slate-800 pt-1 text-xs">
                  ملاحظة: {record.note}
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              الأصناف والكميات المعتمدة ({itemsEntries.length} أصناف):
            </span>

            <div className="w-full overflow-x-auto print:overflow-visible">
            <table className="w-full text-right text-xs border border-slate-300 dark:border-slate-600 min-w-[440px] print:min-w-0">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold">
                  <th className="py-2 px-3 w-12 text-center border-l border-slate-300 dark:border-slate-600">#</th>
                  <th className="py-2 px-3 border-l border-slate-300 dark:border-slate-600">اسم الصنف والمستحضر</th>
                  <th className="py-2 px-3 text-left w-32">الكمية المسلمة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {itemsEntries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 font-medium">
                      سند تاريخي مسجل بدون كميات رقمية بالملف الأصلي
                    </td>
                  </tr>
                ) : (
                  itemsEntries.map(([name, qty], idx) => (
                    <tr key={name} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="py-2 px-3 text-center font-mono border-l border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100 border-l border-slate-200 dark:border-slate-700">
                        {name}
                      </td>
                      <td className="py-2 px-3 text-left font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatNumberLatin(Number(qty))} حبة
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-600">
                  <td colSpan={2} className="py-2 px-3 text-left border-l border-slate-300 dark:border-slate-600">
                    الإجمالي الكلي للوحدات:
                  </td>
                  <td className="py-2 px-3 text-left font-mono text-blue-700 dark:text-blue-300 font-black">
                    {formatNumberLatin(totalUnits)} وحدة
                  </td>
                </tr>
              </tfoot>
            </table>
            </div>
          </div>

          {/* Official Signatures Grid */}
          <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs">
            <div className="space-y-8">
              <span className="font-bold text-slate-700 dark:text-slate-200 block">أمين المخزن</span>
              <div className="border-b border-dashed border-slate-400 w-32 mx-auto" />
            </div>
            <div className="space-y-8">
              <span className="font-bold text-slate-700 dark:text-slate-200 block">المستلم / المستفيد</span>
              <div className="border-b border-dashed border-slate-400 w-32 mx-auto" />
            </div>
            <div className="space-y-8">
              <span className="font-bold text-slate-700 dark:text-slate-200 block">اعتماد الإدارة</span>
              <div className="border-b border-dashed border-slate-400 w-32 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
