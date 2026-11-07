import React, { useState, useRef } from 'react';
import { Customer } from '../../types';
import { parseCustomersExcelFile, downloadCustomersExcelTemplate } from '../../utils/excel';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Users,
  Download,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (customers: Customer[]) => void;
}

export const ImportCustomersModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<{
    totalRows: number;
    validRows: number;
    customers: Customer[];
    warnings: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = async (selected: File) => {
    setFile(selected);
    setError(null);
    setIsProcessing(true);

    try {
      const res = await parseCustomersExcelFile(selected);
      if (res.validRows === 0) {
        setError('لم يتم العثور على أي بيانات عملاء صالحة في هذا الملف.');
        setParsedData(null);
      } else {
        setParsedData(res);
      }
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء قراءة ملف Excel');
      setParsedData(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleConfirmImport = () => {
    if (parsedData && parsedData.customers.length > 0) {
      onImport(parsedData.customers);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-800 text-white px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 dark:bg-slate-900/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-base font-black">استيراد دليل العملاء من ملف Excel</h2>
              <p className="text-xs text-amber-100/90 font-medium">
                استيراد دفعات العملاء، المسارات، والأرصدة من ملف XLSX أو XLS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 dark:bg-slate-900/10 hover:bg-white/20 dark:hover:bg-slate-900/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Template Download Banner */}
          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <FileSpreadsheet className="w-4 h-4 text-amber-700 dark:text-amber-300" />
              <span>هل تحتاج إلى نموذج Excel جاهز بالأعمدة المطابقة؟</span>
            </div>
            <button
              type="button"
              onClick={downloadCustomersExcelTemplate}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل النموذج</span>
            </button>
          </div>

          {/* File Upload Box */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-500 bg-amber-100/50 scale-[1.01]'
                : 'border-amber-300 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50/70'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto mb-2 border border-amber-200 dark:border-amber-800">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm">
              {file ? file.name : 'اسحب ملف Excel وأفلته هنا، أو اضغط للاختيار'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              يدعم ملفات .xlsx و .xls (دليل العملاء، القيصر الذهبي، توب مكياجي، عفيف)
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Preview Results */}
          {parsedData && (
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>نتيجة فحص الملف:</span>
                </div>
                <div className="flex items-center gap-2 font-mono font-bold text-xs">
                  <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 rounded-lg">
                    {parsedData.validRows} عميل صالح
                  </span>
                  <span className="px-2.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">
                    {parsedData.totalRows} إجمالي الأسطر
                  </span>
                </div>
              </div>

              {parsedData.warnings.length > 0 && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 space-y-1">
                  <span className="font-bold block">ملاحظات الفحص ({parsedData.warnings.length}):</span>
                  <ul className="list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto">
                    {parsedData.warnings.slice(0, 5).map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sample preview table */}
              <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs">
                <div className="w-full overflow-x-auto print:overflow-visible">
                <table className="w-full text-right border-collapse text-xs min-w-[600px] print:min-w-0">
                  <thead className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                    <tr>
                      <th className="p-2">الاسم</th>
                      <th className="p-2">المصدر</th>
                      <th className="p-2">المنطقة</th>
                      <th className="p-2">المسار</th>
                      <th className="p-2">الرصيد YER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {parsedData.customers.slice(0, 5).map((c, i) => (
                      <tr key={i}>
                        <td className="p-2 font-bold text-slate-800 dark:text-slate-200">{c.name}</td>
                        <td className="p-2 text-amber-700 dark:text-amber-300 font-bold">{c.source}</td>
                        <td className="p-2 text-slate-600 dark:text-slate-300">{c.region}</td>
                        <td className="p-2 text-blue-700 dark:text-blue-300 font-bold">{c.route}</td>
                        <td className="p-2 font-mono font-bold">{(c.balanceYER || 0).toLocaleString()} ريال</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={!parsedData || parsedData.validRows === 0 || isProcessing}
            onClick={handleConfirmImport}
            className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black shadow-md shadow-amber-200 transition-all cursor-pointer text-xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            استيراد {parsedData?.validRows || 0} عميل الآن
          </button>
        </div>
      </div>
    </div>
  );
};
