import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileDown,
  Loader2,
} from 'lucide-react';

export interface UniversalDataExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleTitle: string;
  moduleSubtitle?: string;
  itemTypeName?: string;
  icon: React.ElementType;
  themeColor?: 'teal' | 'indigo' | 'amber' | 'sky' | 'purple' | 'rose' | 'emerald' | 'violet';
  supportedColumnsText: string;
  onDownloadTemplate: () => void;
  onImportFile: (file: File) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  onGenerateSampleData?: () => void;
  sampleDataDescription?: string;
  onExportExcel: () => void;
  excelSubtitle?: string;
  onExportJSON?: () => void;
  jsonSubtitle?: string;
  extraExportButtons?: React.ReactNode;
}

export const UniversalDataExchangeModal: React.FC<UniversalDataExchangeModalProps> = ({
  isOpen,
  onClose,
  moduleTitle,
  moduleSubtitle = 'التكامل مع Excel والتصدير السحابي والنسخ الاحتياطي',
  itemTypeName = 'بيانات',
  icon: Icon,
  themeColor = 'teal',
  supportedColumnsText,
  onDownloadTemplate,
  onImportFile,
  onGenerateSampleData,
  sampleDataDescription,
  onExportExcel,
  excelSubtitle = 'جدول كامل بكافة الحقول والسجلات',
  onExportJSON,
  jsonSubtitle = 'حفظ نسخة أصلية من كافة البيانات',
  extraExportButtons,
}) => {
  if (!isOpen) return null;

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colorStyles = {
    teal: {
      bgIcon: 'bg-teal-600 text-white',
      btnPrimary: 'bg-teal-600 hover:bg-teal-700 text-white',
      borderDashed: 'border-teal-200 hover:bg-teal-50/30',
      iconDrop: 'text-teal-500',
      textAccent: 'text-teal-600',
      bannerBg: 'bg-teal-50/70 border-teal-100 text-teal-900',
    },
    indigo: {
      bgIcon: 'bg-indigo-600 text-white',
      btnPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      borderDashed: 'border-indigo-200 hover:bg-indigo-50/30',
      iconDrop: 'text-indigo-500',
      textAccent: 'text-indigo-600',
      bannerBg: 'bg-indigo-50/70 border-indigo-100 text-indigo-900',
    },
    amber: {
      bgIcon: 'bg-amber-600 text-white',
      btnPrimary: 'bg-amber-600 hover:bg-amber-700 text-white',
      borderDashed: 'border-amber-200 hover:bg-amber-50/30',
      iconDrop: 'text-amber-500',
      textAccent: 'text-amber-600',
      bannerBg: 'bg-amber-50/70 border-amber-100 text-amber-900',
    },
    sky: {
      bgIcon: 'bg-sky-600 text-white',
      btnPrimary: 'bg-sky-600 hover:bg-sky-700 text-white',
      borderDashed: 'border-sky-200 hover:bg-sky-50/30',
      iconDrop: 'text-sky-500',
      textAccent: 'text-sky-600',
      bannerBg: 'bg-sky-50/70 border-sky-100 text-sky-900',
    },
    purple: {
      bgIcon: 'bg-purple-600 text-white',
      btnPrimary: 'bg-purple-600 hover:bg-purple-700 text-white',
      borderDashed: 'border-purple-200 hover:bg-purple-50/30',
      iconDrop: 'text-purple-500',
      textAccent: 'text-purple-600',
      bannerBg: 'bg-purple-50/70 border-purple-100 text-purple-900',
    },
    rose: {
      bgIcon: 'bg-rose-600 text-white',
      btnPrimary: 'bg-rose-600 hover:bg-rose-700 text-white',
      borderDashed: 'border-rose-200 hover:bg-rose-50/30',
      iconDrop: 'text-rose-500',
      textAccent: 'text-rose-600',
      bannerBg: 'bg-rose-50/70 border-rose-100 text-rose-900',
    },
    emerald: {
      bgIcon: 'bg-emerald-600 text-white',
      btnPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      borderDashed: 'border-emerald-200 hover:bg-emerald-50/30',
      iconDrop: 'text-emerald-500',
      textAccent: 'text-emerald-600',
      bannerBg: 'bg-emerald-50/70 border-emerald-100 text-emerald-900',
    },
    violet: {
      bgIcon: 'bg-violet-600 text-white',
      btnPrimary: 'bg-violet-600 hover:bg-violet-700 text-white',
      borderDashed: 'border-violet-200 hover:bg-violet-50/30',
      iconDrop: 'text-violet-500',
      textAccent: 'text-violet-600',
      bannerBg: 'bg-violet-50/70 border-violet-100 text-violet-900',
    },
  }[themeColor];

  const handleProcessFile = async (file: File) => {
    if (!file) return;
    setErrorMessage(null);
    setStatusMessage('جارٍ فحص وتحليل الملف...');
    setIsLoading(true);

    try {
      const result = await Promise.resolve(onImportFile(file));
      if (result.success) {
        setStatusMessage(result.message || 'تم استيراد البيانات بنجاح!');
        setErrorMessage(null);
      } else {
        setErrorMessage(result.message || 'فشل استيراد الملف. يرجى التأكد من الأعمدة.');
        setStatusMessage(null);
      }
    } catch (err: any) {
      setErrorMessage(`حدث خطأ أثناء قراءة الملف: ${err?.message || 'خطأ غير معروف'}`);
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8 text-right">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${colorStyles.bgIcon} flex items-center justify-center shadow-xs`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">استيراد وتصدير بيانات {moduleTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{moduleSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {statusMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* 1. Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                1. استيراد {itemTypeName} من ملف Excel (.xlsx) أو CSV
              </label>
              <button
                type="button"
                onClick={onDownloadTemplate}
                className={`inline-flex items-center gap-1.5 text-xs font-bold ${colorStyles.textAccent} hover:underline cursor-pointer`}
                title="تحميل ملف إكسل منسق جاهز مع أمثلة توضيحية للأعمدة"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>تحميل نموذج Excel جاهز (.xlsx)</span>
              </button>
            </div>

            {/* Template Notice Banner */}
            <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${colorStyles.bannerBg}`}>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className={`w-4 h-4 ${colorStyles.textAccent} shrink-0`} />
                <span className="font-medium">نوفر لك نموذج إكسل جاهز بالأعمدة والبيانات التوضيحية لتعبئته مباشرة:</span>
              </div>
              <button
                type="button"
                onClick={onDownloadTemplate}
                className={`px-3 py-1.5 rounded-lg active:scale-95 font-bold text-xs transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer ${colorStyles.btnPrimary}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>تنزيل النموذج</span>
              </button>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${colorStyles.borderDashed}`}
            >
              {isLoading ? (
                <div className="py-4 flex flex-col items-center justify-center gap-2">
                  <Loader2 className={`w-8 h-8 animate-spin ${colorStyles.textAccent}`} />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">جارٍ معالجة وتدقيق الملف...</p>
                </div>
              ) : (
                <>
                  <Upload className={`w-8 h-8 ${colorStyles.iconDrop} mx-auto mb-2`} />
                  <p className="text-xs text-slate-700 dark:text-slate-200 font-bold mb-1">
                    اسحب ملف Excel أو انقر لاختيار ملف من جهازك
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 leading-relaxed">
                    يتعرف النظام تلقائياً على أعمدة: {supportedColumnsText}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs ${colorStyles.btnPrimary}`}>
                      <span>تحديد ملف Excel</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={onDownloadTemplate}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      <FileDown className={`w-4 h-4 ${colorStyles.textAccent}`} />
                      <span>تحميل النموذج الجاهز</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 2. Sample Data Generator (Optional) */}
          {onGenerateSampleData && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Sparkles className={`w-4 h-4 ${colorStyles.textAccent}`} />
                  <span>توليد بيانات تجريبية حديثة كاملة (2026)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {sampleDataDescription || `تعبئة شاشة ${moduleTitle} بسجلات واقعية لتجربة كافة الوظائف فوراً.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`هل تريد توليد بيانات تجريبية نموذجية لـ ${moduleTitle}؟`)) {
                    onGenerateSampleData();
                    setStatusMessage('تم توليد البيانات التجريبية بنجاح!');
                  }
                }}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                توليد البيانات
              </button>
            </div>
          )}

          {/* 3. Export Options */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">2. خيارات التصدير والنشر:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onExportExcel}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/40 text-right transition-all flex items-center gap-3 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-slate-100">تصدير Excel (.xlsx)</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{excelSubtitle}</div>
                </div>
              </button>

              {onExportJSON && (
                <button
                  type="button"
                  onClick={onExportJSON}
                  className={`p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/40 text-right transition-all flex items-center gap-3 cursor-pointer`}
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-slate-100">نسخة احتياطية JSON</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{jsonSubtitle}</div>
                  </div>
                </button>
              )}

              {extraExportButtons}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
