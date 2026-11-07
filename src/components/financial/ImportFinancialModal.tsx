import React, { useState, useRef } from 'react';
import { FinancialTransaction } from '../../types';
import {
  parseFinancialExcelOrCSV,
  downloadFinancialExcelTemplate,
} from '../../utils/excel';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Download,
  Layers,
  ArrowUpDown,
  FileCheck,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingTransactions: FinancialTransaction[];
  onImportTransactions: (
    transactions: FinancialTransaction[],
    mode: 'append' | 'replace'
  ) => void;
}

export const ImportFinancialModal: React.FC<Props> = ({
  isOpen,
  onClose,
  existingTransactions,
  onImportTransactions,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [parseResult, setParseResult] = useState<{
    success: boolean;
    transactions: FinancialTransaction[];
    errors: string[];
    totalRows: number;
    validRows: number;
    duplicateCount: number;
    warnings: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParseResult(null);

    const result = await parseFinancialExcelOrCSV(
      selectedFile,
      existingTransactions
    );
    setParseResult(result);
    setIsParsing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleExecuteImport = () => {
    if (!parseResult || parseResult.transactions.length === 0) return;
    onImportTransactions(parseResult.transactions, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-right flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700/50 flex items-center justify-center border border-teal-500/30">
              <FileSpreadsheet className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">
                استيراد القيود والحركات المالية
              </h2>
              <p className="text-xs text-teal-200">
                استيراد ملفات Excel (.xlsx, .xls) أو CSV متوافقة مع الـ 15 عمود للسجل المالي اليومي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 dark:hover:bg-slate-900/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Template Download Banner */}
          <div className="flex items-center justify-between bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 p-3 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-bold">
              <FileSpreadsheet className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <span>هل تحتاج إلى نموذج Excel جاهز بالأعمدة المطابقة؟</span>
            </div>
            <button
              type="button"
              onClick={downloadFinancialExcelTemplate}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل النموذج</span>
            </button>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 hover:border-teal-400 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center mx-auto mb-3 border border-teal-200 dark:border-teal-800">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              {file
                ? file.name
                : 'اسحب ملف Excel / CSV وأفلته هنا، أو اضغط للاختيار'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              يدعم ملفات السجل المالي والقيود اليومية (.xlsx, .xls, .csv)
            </p>
          </div>

          {/* Loading Indicator */}
          {isParsing && (
            <div className="flex items-center justify-center gap-2 p-4 text-xs font-bold text-teal-700 dark:text-teal-300">
              <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <span>جاري فحص وقراءة أسطر الملف...</span>
            </div>
          )}

          {/* Parse Result Summary */}
          {parseResult && (
            <div className="space-y-4">
              {/* Errors */}
              {parseResult.errors.length > 0 && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>تنبيهات فحص الملف:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 pr-2">
                    {parseResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Stats Bar */}
              {parseResult.success && (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>نتيجة الفحص والمعاينة:</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono font-bold text-xs">
                      <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg">
                        {parseResult.validRows} قيد مالي صالح
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg">
                        {parseResult.totalRows} إجمالي الأسطر
                      </span>
                      {parseResult.duplicateCount > 0 && (
                        <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg">
                          {parseResult.duplicateCount} مكرر
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Import Mode Selector */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      طريقة تطبيق الاستيراد:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setImportMode('append')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          importMode === 'append'
                            ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-800 dark:text-teal-300 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>إلحاق بالسجل المالي (Append)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportMode('replace')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          importMode === 'replace'
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-300 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <ArrowUpDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span>استبدال كامل السجل (Replace)</span>
                      </button>
                    </div>
                  </div>

                  {/* Sample Preview Table */}
                  {parseResult.transactions.length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          معاينة أول {Math.min(5, parseResult.transactions.length)} قيود:
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          15 عمود معتمد
                        </span>
                      </div>
                      <div className="max-h-40 overflow-x-auto overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                        <table className="w-full text-right text-xs border-collapse min-w-[820px] print:min-w-0">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                            <tr>
                              <th className="p-2 border-b border-slate-200 dark:border-slate-700">رقم القيد</th>
                              <th className="p-2 border-b border-slate-200 dark:border-slate-700">التاريخ</th>
                              <th className="p-2 border-b border-slate-200 dark:border-slate-700">الحركة</th>
                              <th className="p-2 border-b border-slate-200 dark:border-slate-700">اسم الحساب</th>
                              <th className="p-2 border-b border-slate-200 dark:border-slate-700">البيان</th>
                              <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-left">ريال يمني</th>
                              <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-left">سعودي</th>
                              <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-left">دولار</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                            {parseResult.transactions.slice(0, 5).map((txn) => (
                              <tr key={txn.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                <td className="p-2 font-mono font-bold text-teal-700 dark:text-teal-400">{txn.id}</td>
                                <td className="p-2">{txn.date}</td>
                                <td className="p-2">{txn.movement}</td>
                                <td className="p-2 font-bold">{txn.accountName}</td>
                                <td className="p-2 max-w-[120px] truncate" title={txn.description}>{txn.description || '-'}</td>
                                <td className="p-2 text-left font-mono">{formatCurrency(txn.amountYER)}</td>
                                <td className="p-2 text-left font-mono">{formatCurrency(txn.amountSAR)}</td>
                                <td className="p-2 text-left font-mono">{formatCurrency(txn.amountUSD)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={!parseResult || !parseResult.success || parseResult.validRows === 0}
            onClick={handleExecuteImport}
            className={`px-5 py-2 text-xs font-black rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              parseResult && parseResult.success && parseResult.validRows > 0
                ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-200 dark:shadow-none'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>تنفيذ الاستيراد ({parseResult ? parseResult.validRows : 0})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
