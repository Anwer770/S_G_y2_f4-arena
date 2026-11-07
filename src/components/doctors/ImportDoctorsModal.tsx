import React, { useState, useRef } from 'react';
import { DoctorRecord } from '../../types';
import { parseDoctorsExcelOrCSV } from '../../utils/doctors';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Download,
  AlertCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingDoctors: DoctorRecord[];
  onImportDoctors: (importedDoctors: DoctorRecord[], mode: 'append' | 'replace') => void;
}

export const ImportDoctorsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  existingDoctors,
  onImportDoctors,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<{
    success: boolean;
    doctors: DoctorRecord[];
    errors: string[];
    duplicateCount: number;
  } | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParseResult(null);

    const result = await parseDoctorsExcelOrCSV(selectedFile, existingDoctors);
    setParseResult(result);
    setIsParsing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'المعرف': 'DOC-1001',
        'اسم الطبيب / المركز': 'د. خالد عبدالجليل الشرجبي',
        'المصدر': 'الأطباء',
        'التخصص': 'جلدية وتجميل',
        'العيادة / المستشفى': 'مركز الشرجبي للجلدية',
        'المنطقة': 'صنعاء - السبعين والوحدة',
        'المسار': 'السبت',
        'الأهمية': 'A',
        'المسؤول': 'انور',
        'وصف المهمة': 'زيارة ميدانية لتعريف بمنتجات العناية بالبشرة الجديدة',
        'تاريخ بدء المهمة': '2026-08-01',
        'تاريخ انتهاء المهمة': '2026-08-07',
        'حالة الزيارة': 'مكتمل',
        'رقم الهاتف': '777123451',
        'العنوان والموقع': 'شارع بيت بوس',
        'العينات المسلمة': '4 عبوات سيروم تجريبي',
        'نتيجة الزيارة': 'تأكيد إدراج الكريمات في الوصفات',
        'ملاحظات': 'تجاوب ممتاز من الطبيب',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'نموذج_الأطباء');

    if (!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({ rightToLeft: true });

    XLSX.writeFile(workbook, 'نموذج_استيراد_دفتر_زيارات_الأطباء.xlsx');
  };

  const handleExecuteImport = () => {
    if (!parseResult || parseResult.doctors.length === 0) return;
    onImportDoctors(parseResult.doctors, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-right flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700/50 flex items-center justify-center border border-teal-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">استيراد بيانات الأطباء والزيارات</h2>
              <p className="text-xs text-teal-200">
                استيراد ملفات Excel (.xlsx, .xls) أو CSV متوافقة مع ملف دفتر الأطباء
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 dark:hover:bg-slate-900/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Template Download */}
          <div className="flex items-center justify-between bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 p-3 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-teal-900 font-bold">
              <FileSpreadsheet className="w-4 h-4 text-teal-700 dark:text-teal-300" />
              <span>هل تحتاج إلى نموذج Excel جاهز بالأعمدة المطابقة؟</span>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل النموذج</span>
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-teal-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50/40 dark:hover:bg-teal-950/40 transition-all rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center shadow-xs">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {file ? file.name : 'اسحب ملف Excel / CSV وأفلته هنا، أو اضغط للاختيار'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                يدعم ملفات دفتر الأطباء زيارات (.xlsx, .xls, .csv)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Loading Indicator */}
          {isParsing && (
            <div className="text-center p-4 text-xs font-bold text-teal-800 dark:text-teal-200 animate-pulse">
              جارِ فك تشفير وفحص أعمدة الملف...
            </div>
          )}

          {/* Parse Results Preview */}
          {parseResult && (
            <div className="space-y-3">
              {parseResult.success ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>تم تحليل الملف بنجاح وتم العثور على {parseResult.doctors.length} سجل طبيب.</span>
                  </div>

                  {parseResult.duplicateCount > 0 && (
                    <div className="flex items-center gap-2 text-amber-900 font-bold bg-amber-100/60 dark:bg-amber-900/40 p-2.5 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>يوجد {parseResult.duplicateCount} سجل يشتبه بتكراره مع الأطباء المسجلين حالياً.</span>
                    </div>
                  )}

                  {/* Mode Selector */}
                  <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">طريقة الاستيراد:</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                          importMode === 'append'
                            ? 'bg-teal-50 border-teal-500 font-black text-teal-900'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="text-teal-600 dark:text-teal-400"
                        />
                        <div>
                          <p className="text-xs">إضافة للسجلات الحالية</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                            دمج ({parseResult.doctors.length}) مع ({existingDoctors.length}) طبيب
                          </p>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                          importMode === 'replace'
                            ? 'bg-rose-50 border-rose-500 font-black text-rose-900'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="text-rose-600 dark:text-rose-400"
                        />
                        <div>
                          <p className="text-xs">استبدال كامل الدفتر</p>
                          <p className="text-xs text-rose-500 font-normal">
                            مسح السابق واستبداله بـ ({parseResult.doctors.length}) طبيب
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-4 rounded-xl text-xs space-y-1.5 text-rose-900">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>فشل استيراد الملف:</span>
                  </div>
                  {parseResult.errors.map((err, i) => (
                    <p key={i} className="text-rose-800 dark:text-rose-200 text-xs">
                      • {err}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            onClick={handleExecuteImport}
            disabled={!parseResult?.success || parseResult.doctors.length === 0}
            className="px-6 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-md shadow-teal-200 transition-all cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تنفيذ الاستيراد ({parseResult?.doctors.length || 0})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
