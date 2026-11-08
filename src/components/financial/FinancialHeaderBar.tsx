import React from 'react';
import { FileSpreadsheet, Keyboard, Layers, Plus, Printer } from 'lucide-react';

interface Props {
  onAdd: () => void;
  onExportExcel: () => void;
  onOpenImport: () => void;
  onOpenPrint: () => void;
  onShowShortcuts: () => void;
}

/** شريط رأس السجل المالي (R25) — مستخرج من FinancialModule. */
export const FinancialHeaderBar: React.FC<Props> = ({
  onAdd: handleOpenAdd,
  onExportExcel: handleExportExcel,
  onOpenImport: openImport,
  onOpenPrint: openPrint,
  onShowShortcuts: showShortcuts,
}) => (
      <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xs px-4 py-3 sm:py-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/50">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                سجل العمليات والقيود المالية اليومية
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-200/50 dark:border-teal-800/50">
                المعيار المحاسبي الشامل
              </span>
            </div>
            <p className="text-xs md:text-xs text-slate-500 dark:text-slate-400">
              إدارة الحركات والقيود وسندات القبض والصرف (YER - SAR - USD)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
          {/* Keyboard Shortcuts Guide */}
          <button
            onClick={() => showShortcuts()}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="اختصارات لوحة المفاتيح"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* طباعة (Matching Annotation 2026-09-23 032232.png) */}
          <button
            type="button"
            onClick={() => openPrint()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
            title="طباعة كشف السجل اليومي والقيود"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
            <span>طباعة</span>
          </button>

          <button
            onClick={() => openImport()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-300 dark:border-slate-700 shadow-2xs"
            title="استيراد قيود مالية من ملف Excel مطابق للقالب"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>استيراد</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            title="تصدير القيود المعروضة إلى Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-lg text-xs font-black shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            title="إضافة قيد جديد (Alt + N)"
          >
            <Plus className="w-4 h-4" />
            <span>قيد جديد</span>
            <kbd className="hidden sm:inline-block mr-1 px-1 py-0.2 bg-teal-700/80 rounded text-xs font-mono text-teal-100 border border-teal-500/50">
              Alt+N
            </kbd>
          </button>
        </div>
      </div>
);

export default FinancialHeaderBar;
