import React from 'react';
import { FinancialFilterState } from '../../types';
import { SlidersHorizontal, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  filters: FinancialFilterState;
  setFilters: React.Dispatch<React.SetStateAction<FinancialFilterState>>;
  restrictions: string[];
  movementTypes: string[];
  importanceList: string[];
  categoryAccounts: string[];
  restrictionAccounts: string[];
  accountNames: string[];
  onResetFilters: () => void;
}

/** قائمة اختيار موحّدة لحقول الفلاتر المتقدمة (تقلّل التكرار وتضمن اتساق النمط) */
const FilterSelect: React.FC<{
  label: string;
  emptyLabel: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}> = ({ label, emptyLabel, value, options, onChange }) => (
  <div>
    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
    >
      <option value="">{emptyLabel}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

/**
 * لوحة الفلاتر المتقدمة (Slide-over) — مستخرجة من FinancialModule.tsx (R27).
 * نفس الحقول والسلوك؛ لم يُحذف أي فلتر.
 */
export const FinancialFilterDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  restrictions,
  movementTypes,
  importanceList,
  categoryAccounts,
  restrictionAccounts,
  accountNames,
  onResetFilters,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 left-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-5 animate-fade-in">
          {/* Drawer Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <SlidersHorizontal className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-black">الفلاتر المتقدمة للقيود</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filters Fields */}
            <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
              <FilterSelect
                label="نوع القيد"
                emptyLabel="جميع أنواع القيود"
                value={filters.restriction}
                options={restrictions}
                onChange={(v) => setFilters({ ...filters, restriction: v })}
              />
              <FilterSelect
                label="طريقة الدفع"
                emptyLabel="جميع طرق الدفع"
                value={filters.movementType}
                options={movementTypes}
                onChange={(v) => setFilters({ ...filters, movementType: v })}
              />
              <FilterSelect
                label="درجة الأهمية / الحالة"
                emptyLabel="جميع الحالات"
                value={filters.importance}
                options={importanceList}
                onChange={(v) => setFilters({ ...filters, importance: v })}
              />
              <FilterSelect
                label="فئة الحساب"
                emptyLabel="جميع فئات الحساب"
                value={filters.categoryAccount}
                options={categoryAccounts}
                onChange={(v) => setFilters({ ...filters, categoryAccount: v })}
              />
              <FilterSelect
                label="حساب التقييد"
                emptyLabel="جميع حسابات التقييد"
                value={filters.restrictionAccount}
                options={restrictionAccounts}
                onChange={(v) => setFilters({ ...filters, restrictionAccount: v })}
              />
              <FilterSelect
                label="اسم الحساب المستفيد"
                emptyLabel="جميع أسماء الحسابات"
                value={filters.accountName}
                options={accountNames}
                onChange={(v) => setFilters({ ...filters, accountName: v })}
              />

              {/* Date Range */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">الفترة الزمنية</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block mb-0.5">من تاريخ</span>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block mb-0.5">إلى تاريخ</span>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              تطبيق الفلاتر
            </button>
            <button
              onClick={onResetFilters}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              إعادة ضبط
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
