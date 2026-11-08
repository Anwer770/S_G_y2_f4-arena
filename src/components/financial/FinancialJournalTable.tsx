import React from 'react';
import { Edit2, Paperclip, Printer, Trash2 } from 'lucide-react';
import type { FinancialFilterState, FinancialTransaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { getMovementBadgeStyle, getImportanceBadgeStyle } from '../../data/defaultFinancial';

interface Props {
  transactions: FinancialTransaction[];
  /** تُستخدم لإظهار زر «إعادة ضبط» عند وجود فلتر نشط */
  filters: FinancialFilterState;
  selectedIds: Set<string>;
  activeRowId: string | null;
  onToggleSelectAll: () => void;
  onToggleRowSelection: (id: string, e: React.MouseEvent) => void;
  onActivateRow: (id: string | null) => void;
  onView: (txn: FinancialTransaction) => void;
  onEdit: (txn: FinancialTransaction) => void;
  onDelete: (id: string) => void;
  onResetFilters: () => void;
}

/**
 * جدول السجل المالي (R25) — مستخرج من FinancialModule مع الحفاظ على
 * حاوية التمرير والعرض الأدنى وتثبيت الرأس/الأعمدة وكل سلوك الصفوف.
 */
export const FinancialJournalTable: React.FC<Props> = ({
  transactions: filteredTransactions,
  filters,
  selectedIds,
  activeRowId,
  onToggleSelectAll: handleToggleSelectAll,
  onToggleRowSelection: handleToggleRowSelection,
  onActivateRow: setActiveRowId,
  onView: setViewingTxn,
  onEdit: handleOpenEdit,
  onDelete: onDeleteTransaction,
  onResetFilters: handleResetFilters,
}) => (
              <div className="overflow-x-auto max-h-[calc(100vh-270px)] min-h-[380px] overflow-y-auto scrollbar-thin">
                <table className="w-full text-right text-xs border-collapse min-w-[960px] print:min-w-0">
                {/* Sticky Header */}
                <thead className="sticky top-0 z-20">
                  <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700 select-none shadow-2xs">
                    {/* Sticky Column Right: Select Checkbox & ID */}
                    <th className="py-2.5 px-3 sticky right-0 z-30 bg-slate-100/95 dark:bg-slate-800/95 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)] w-28">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length}
                          onChange={handleToggleSelectAll}
                          className="rounded text-teal-600 dark:text-teal-400 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
                          title="تحديد الكل"
                        />
                        <span>القيد</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">اليوم</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">التاريخ</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">الأهمية</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">الحركة</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">القيد</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">طريقة الدفع</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">فئة الحساب</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">حساب التقييد</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">اسم الحساب</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap min-w-[160px]">الوصف</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">الرقم</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap text-left">ريال يمني</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap text-left">سعودي</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap text-left">دولار</th>
                    {/* Sticky Column Left: Quick Actions */}
                    <th className="py-2.5 px-3 text-center sticky left-0 z-30 bg-slate-100/95 dark:bg-slate-800/95 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)] w-24">
                      إجراءات
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                        <div className="flex flex-col items-center justify-center gap-2.5">
                          <p className="font-medium">لا توجد قيود مالية مطابقة للبحث أو الفلاتر المحددة.</p>
                          {(filters.periodFilter !== 'all' || filters.search || filters.movement || filters.currencyFilter !== 'all' || filters.isDraftOnly || filters.importance || filters.restriction) && (
                            <button
                              type="button"
                              onClick={handleResetFilters}
                              className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 rounded-lg text-xs font-bold border border-teal-200 dark:border-teal-800 cursor-pointer transition shadow-2xs"
                            >
                              عرض كافة القيود (إعادة تعيين الفلاتر)
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((txn) => {
                      const movBadge = getMovementBadgeStyle(txn.movement);
                      const impBadge = getImportanceBadgeStyle(txn.importance);
                      const isSelected = selectedIds.has(txn.id);
                      const isActive = activeRowId === txn.id;

                      return (
                        <tr
                          key={txn.id}
                          onClick={() => setActiveRowId(txn.id)}
                          className={`group transition-colors cursor-pointer select-none text-[12px] ${
                            isActive
                              ? 'bg-teal-50/80 dark:bg-teal-950/40 ring-1 ring-inset ring-teal-500/30'
                              : isSelected
                              ? 'bg-teal-50/40 dark:bg-teal-950/20'
                              : 'hover:bg-teal-50/30 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          {/* 1. Sticky ID & Select Checkbox */}
                          <td
                            className={`py-2 px-3 font-mono font-bold whitespace-nowrap sticky right-0 z-10 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)] transition-colors ${
                              isActive
                                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                                : isSelected
                                ? 'bg-teal-50/50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300'
                                : 'bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/90 text-teal-700 dark:text-teal-400'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleToggleRowSelection(txn.id, e as any)}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded text-teal-600 dark:text-teal-400 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span>{txn.id}</span>
                              {txn.isDraft && (
                                <span className="px-1.5 py-0.2 rounded text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/80">
                                  مسودة
                                </span>
                              )}
                              {txn.attachmentUrl && (
                                <span title={`مستند مرفق: ${txn.attachmentUrl}`} className="text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400">
                                  <Paperclip className="w-3 h-3 inline" />
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 2. Day */}
                          <td className="py-2 px-2.5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {txn.day}
                          </td>

                          {/* 3. Date */}
                          <td className="py-2 px-2.5 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {txn.date}
                          </td>

                          {/* 4. Importance Badge (Standardized 3-color soft tints) */}
                          <td className="py-2 px-2.5 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${impBadge.bg} ${impBadge.text} ${impBadge.border}`}>
                              {txn.importance}
                            </span>
                          </td>

                          {/* 5. Movement Badge (Standardized 3-color soft tints) */}
                          <td className="py-2 px-2.5 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${movBadge.bg} ${movBadge.text} ${movBadge.border}`}>
                              {txn.movement}
                            </span>
                          </td>

                          {/* 6. Restriction */}
                          <td className="py-2 px-2.5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {txn.restriction}
                          </td>

                          {/* 7. Movement Type */}
                          <td className="py-2 px-2.5 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {txn.movementType}
                          </td>

                          {/* 8. Category Account */}
                          <td className="py-2 px-2.5 font-medium whitespace-nowrap">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs">
                              {txn.categoryAccount}
                            </span>
                          </td>

                          {/* 9. Restriction Account */}
                          <td className="py-2 px-2.5 font-medium text-slate-800 dark:text-slate-200 max-w-[130px] truncate" title={txn.restrictionAccount}>
                            {txn.restrictionAccount}
                          </td>

                          {/* 10. Account Name (High Contrast) */}
                          <td className="py-2 px-2.5 font-black text-slate-900 dark:text-slate-100 max-w-[150px] truncate" title={txn.accountName}>
                            {txn.accountName}
                          </td>

                          {/* 11. Description */}
                          <td className="py-2 px-2.5 text-slate-700 dark:text-slate-300 max-w-[180px] truncate" title={txn.description}>
                            {txn.description || '-'}
                          </td>

                          {/* 12. Number */}
                          <td className="py-2 px-2.5 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {txn.number}
                          </td>

                          {/* 13. Amount YER (High Contrast Monospace) */}
                          <td className="py-2 px-2.5 font-mono font-black text-teal-700 dark:text-teal-300 text-left whitespace-nowrap">
                            {txn.amountYER > 0 ? formatCurrency(txn.amountYER) : '-'}
                          </td>

                          {/* 14. Amount SAR (High Contrast Monospace) */}
                          <td className="py-2 px-2.5 font-mono font-bold text-amber-700 dark:text-amber-300 text-left whitespace-nowrap">
                            {txn.amountSAR > 0 ? formatCurrency(txn.amountSAR) : '-'}
                          </td>

                          {/* 15. Amount USD (High Contrast Monospace) */}
                          <td className="py-2 px-2.5 font-mono font-bold text-sky-700 dark:text-sky-300 text-left whitespace-nowrap">
                            {txn.amountUSD > 0 ? `$${formatCurrency(txn.amountUSD)}` : '-'}
                          </td>

                          {/* 16. Sticky Actions Column */}
                          <td
                            className={`py-2 px-3 whitespace-nowrap sticky left-0 z-10 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)] transition-colors ${
                              isActive
                                ? 'bg-teal-50 dark:bg-teal-950/60'
                                : isSelected
                                ? 'bg-teal-50/50 dark:bg-teal-950/30'
                                : 'bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/90'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setViewingTxn(txn)}
                                title="عرض وطباعة السند"
                                className="p-1 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-md transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(txn)}
                                title="تعديل القيد"
                                className="p-1 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-md transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`هل أنت متأكد من حذف القيد ${txn.id}؟`)) {
                                    onDeleteTransaction(txn.id);
                                  }
                                }}
                                title="حذف القيد"
                                className="p-1 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Table Summary Footer (Sticky at bottom if needed) */}
                {filteredTransactions.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-mono font-black text-xs border-t-2 border-slate-700">
                      <td colSpan={12} className="py-2.5 px-4 font-sans font-black">
                        إجمالي النتائج المعروضة ({filteredTransactions.length} قيد):
                      </td>
                      <td className="py-2.5 px-2.5 text-left text-teal-300">
                        {formatCurrency(filteredTransactions.reduce((s, t) => s + (t.amountYER || 0), 0))} YER
                      </td>
                      <td className="py-2.5 px-2.5 text-left text-amber-300">
                        {formatCurrency(filteredTransactions.reduce((s, t) => s + (t.amountSAR || 0), 0))} SAR
                      </td>
                      <td className="py-2.5 px-2.5 text-left text-sky-300">
                        ${formatCurrency(filteredTransactions.reduce((s, t) => s + (t.amountUSD || 0), 0))} USD
                      </td>
                      <td className="sticky left-0 bg-slate-900"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
);

export default FinancialJournalTable;
