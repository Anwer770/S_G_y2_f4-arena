import React, { useState, useRef } from 'react';
import {
  AppSettings,
  AuditLog,
  MovementRecord,
  Product,
} from '../types';
import {
  Settings,
  Download,
  Upload,
  FileSpreadsheet,
  Database,
  RotateCcw,
  Trash2,
  CheckCircle,
  AlertTriangle,
  History,
  Shield,
  Layers,
  Plus,
  X,
  FileText,
  HelpCircle,
} from 'lucide-react';
import {
  exportFullBackupJSON,
  exportRecordsToCSV,
  exportRecordsToExcel,
  ImportPreviewResult,
  parseExcelForImport,
} from '../utils/excel';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  products: Product[];
  records: MovementRecord[];
  categories: string[];
  statuses: string[];
  seq: { IN: number; OUT: number };
  auditLogs: AuditLog[];
  onImportRecords: (newRecords: MovementRecord[], strategy: 'replace' | 'merge' | 'append') => void;
  onRestoreDefaultData: () => void;
  onClearAllRecords: () => void;
  onUpdateCategories: (categories: string[]) => void;
  onUpdateStatuses: (statuses: string[]) => void;
  onClearAuditLogs: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  products,
  records,
  categories,
  statuses,
  seq,
  auditLogs,
  onImportRecords,
  onRestoreDefaultData,
  onClearAllRecords,
  onUpdateCategories,
  onUpdateStatuses,
  onClearAuditLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'system' | 'dropdowns' | 'audit'>('backup');

  // Excel Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreviewResult | null>(null);
  const [importStrategy, setImportStrategy] = useState<'append' | 'replace' | 'merge'>('append');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');

  // Category / Status Form
  const [newCat, setNewCat] = useState('');
  const [newStatus, setNewStatus] = useState('');

  // Handle File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError('');
    setIsImporting(true);

    try {
      const preview = await parseExcelForImport(
        file,
        records,
        products,
        settings.defaultYear
      );
      setImportPreview(preview);
    } catch (err: any) {
      setImportError(err?.message || 'فشل قراءة الملف، تأكد من صحة التنسيق.');
      setImportPreview(null);
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;
    onImportRecords(importPreview.parsedRecords, importStrategy);
    setImportPreview(null);
    setImportFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Add Category
  const handleAddCategory = () => {
    const c = newCat.trim();
    if (!c || categories.includes(c)) return;
    onUpdateCategories([...categories, c]);
    setNewCat('');
  };

  const handleRemoveCategory = (cat: string) => {
    if (categories.length <= 1) return;
    onUpdateCategories(categories.filter((c) => c !== cat));
  };

  // Add Status
  const handleAddStatus = () => {
    const s = newStatus.trim();
    if (!s || statuses.includes(s)) return;
    onUpdateStatuses([...statuses, s]);
    setNewStatus('');
  };

  const handleRemoveStatus = (st: string) => {
    if (statuses.length <= 1) return;
    onUpdateStatuses(statuses.filter((s) => s !== st));
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Settings Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#0D9488]" />
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">إعدادات النظام والنسخ الاحتياطي</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                إدارة خيارات الاستيراد والتصدير، قواعد احتساب المخزون، وسجل التعديلات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'backup' ? 'bg-[#0D9488] text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>النسخ والتصدير</span>
            </button>

            <button
              onClick={() => setActiveTab('system')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'system' ? 'bg-[#0D9488] text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>قواعد الحساب</span>
            </button>

            <button
              onClick={() => setActiveTab('dropdowns')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'dropdowns' ? 'bg-[#0D9488] text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>الفئات والحالات</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'audit' ? 'bg-[#0D9488] text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>سجل التعديلات ({auditLogs.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. BACKUP & EXPORT / IMPORT TAB (FR-34 to FR-49) */}
      {/* ========================================================================= */}
      {activeTab === 'backup' && (
        <div className="space-y-4">
          {/* Export Center */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Download className="w-4 h-4 text-emerald-600" />
              <span>تصدير البيانات والنسخ الاحتياطية</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Full Excel Export with 62 product columns */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>تصدير ملف Excel (.xlsx)</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    تصدير جدول الحركات بـ 62 عموداً للأصناف مطابق للملف المعتمد الأصلي.
                  </p>
                </div>
                <button
                  onClick={() => exportRecordsToExcel(records, products)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  تحميل Excel (.xlsx)
                </button>
              </div>

              {/* CSV Export */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>تصدير ملف CSV (UTF-8)</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    تصدير بصيغة نصية CSV قياسية بترميز UTF-8 مع BOM لدعم اللغة العربية.
                  </p>
                </div>
                <button
                  onClick={() => exportRecordsToCSV(records, products)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  تحميل CSV
                </button>
              </div>

              {/* Full JSON State Backup */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-indigo-600" />
                    <span>نسخة احتياطية شاملة (JSON)</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    حفظ نسخة كاملة من الحركات، الأصناف، الإعدادات، والسجل مع رمز التحقق.
                  </p>
                </div>
                <button
                  onClick={() =>
                    exportFullBackupJSON(
                      products,
                      records,
                      categories,
                      statuses,
                      settings,
                      seq,
                      auditLogs
                    )
                  }
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  تحميل نسخة JSON
                </button>
              </div>
            </div>
          </div>

          {/* Import Center (FR-37 to FR-41) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>استيراد الحركات من ملف خارجي (Excel / CSV)</span>
            </h3>

            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                اختر ملف Excel (.xlsx / .xls) أو CSV لدمج الحركات أو تحديث السجلات تلقائياً.
              </p>

              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />

              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Import Preview Box */}
              {importPreview && (
                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3 text-xs">
                  <div className="font-bold text-blue-950 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span>تم تحليل الملف بنجاح - معاينة بيانات الاستيراد:</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                    <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                      <span className="text-xs text-slate-400 block">إجمالي الصفوف:</span>
                      <strong className="text-slate-900 text-sm">{importPreview.totalRows}</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                      <span className="text-xs text-slate-400 block">حركات صالحة:</span>
                      <strong className="text-emerald-700 text-sm">{importPreview.validRows}</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                      <span className="text-xs text-slate-400 block">أعمدة أصناف مطابقة:</span>
                      <strong className="text-indigo-700 text-sm">{importPreview.matchedProductsCount}</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                      <span className="text-xs text-slate-400 block">أرقام فرعية مكررة:</span>
                      <strong className="text-amber-700 text-sm">{importPreview.duplicateSubIdsCount}</strong>
                    </div>
                  </div>

                  {/* Conflict resolution option */}
                  <div className="space-y-1.5 pt-1">
                    <span className="font-bold text-slate-700 block">خطة التعامل مع الحركات المكررة:</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="strategy"
                          checked={importStrategy === 'append'}
                          onChange={() => setImportStrategy('append')}
                          className="text-blue-600"
                        />
                        <span>تخطي المكرر وإضافة الجديد فقط (توصية)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="strategy"
                          checked={importStrategy === 'replace'}
                          onChange={() => setImportStrategy('replace')}
                          className="text-blue-600"
                        />
                        <span>استبدال الحركات القديمة ببيانات الملف</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleConfirmImport}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                    >
                      تأكيد وبدء الاستيراد
                    </button>
                    <button
                      onClick={() => {
                        setImportPreview(null);
                        setImportFile(null);
                      }}
                      className="px-3 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Factory Reset & Danger Zone */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2 border-b border-rose-100 pb-3">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>إدارة بيانات الأساس ومنطقة العمليات الحساسة</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Restore Factory Defaults */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-blue-600" />
                    <span>استعادة بيانات الأساس (301 حركة + 62 صنفاً)</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    إعادة تحميل مجموعة الحركات التاريخية الـ 301 والأصناف الـ 62 الافتراضية.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('هل أنت متأكد من استعادة بيانات الأساس (301 حركة)؟')) {
                      onRestoreDefaultData();
                    }
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  استعادة بيانات الأساس
                </button>
              </div>

              {/* Clear All Records with Auto-Backup */}
              <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-rose-900 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>تصفير سجل الحركات (مع حفظ نسخة طوارئ)</span>
                  </div>
                  <p className="text-xs text-rose-700 mt-1">
                    مسح كافة الحركات المسجلة والبدء بسجل جديد فارغ مع الاحتفاظ بقائمة الأصناف.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        'تحذير: هل أنت متأكد من مسح كافة الحركات؟ سيتم حفظ نسخة احتياطية تلقائياً قبل المسح.'
                      )
                    ) {
                      onClearAllRecords();
                    }
                  }}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  مسح الحركات والبدء من الصفر
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SYSTEM SETTINGS & RULES TAB (FR-50, FR-51) */}
      {/* ========================================================================= */}
      {activeTab === 'system' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Shield className="w-4 h-4 text-[#0D9488]" />
            <span>قواعد احتساب المخزون والتواريخ</span>
          </h3>

          <div className="space-y-4 text-xs max-w-xl">
            {/* FR-50: Default Year */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">
                السنة الافتراضية للتواريخ غير المكتملة
              </label>
              <p className="text-xs text-slate-500">
                تُستخدم تلقائياً عند إدخال أو استيراد تواريخ بدون سنة (مثل 15-10 أو 5-11).
              </p>
              <select
                value={settings.defaultYear}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    defaultYear: parseInt(e.target.value, 10),
                  })
                }
                className="w-48 p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
              >
                <option value={2024}>2024 (افتراضي الملف الأصلي)</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            {/* FR-51: Skip Cancelled */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={settings.skipCancelled}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      skipCancelled: e.target.checked,
                    })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>استبعاد الحركات الملغية (حالة "ملغي") من احتساب رصيد المخزون</span>
              </label>
              <p className="text-xs text-slate-500 pr-6">
                عند تفعيل هذا الخيار، لا تؤثر الحركات المصنفة كـ "ملغي" على صافي الأرصدة المتوفرة.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CATEGORIES & STATUSES TAB */}
      {/* ========================================================================= */}
      {activeTab === 'dropdowns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Categories Management */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Layers className="w-4 h-4 text-[#0D9488]" />
              <span>فئات الحركات ({categories.length})</span>
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="إضافة فئة جديدة..."
                className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              />
              <button
                onClick={handleAddCategory}
                className="px-3 py-2 bg-[#0D9488] hover:bg-[#059669] text-white font-bold rounded-lg text-xs cursor-pointer transition-colors"
              >
                إضافة
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pt-1">
              {categories.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold"
                >
                  <span>{c}</span>
                  <button
                    onClick={() => handleRemoveCategory(c)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Statuses Management */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <CheckCircle className="w-4 h-4 text-[#0D9488]" />
              <span>حالات الحركات ({statuses.length})</span>
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                placeholder="إضافة حالة جديدة..."
                className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              />
              <button
                onClick={handleAddStatus}
                className="px-3 py-2 bg-[#0D9488] hover:bg-[#059669] text-white font-bold rounded-lg text-xs cursor-pointer transition-colors"
              >
                إضافة
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pt-1">
              {statuses.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold"
                >
                  <span>{s}</span>
                  <button
                    onClick={() => handleRemoveStatus(s)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. AUDIT LOGS TAB (FR-33) */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-[#0D9488]" />
              <span>سجل التعديلات والعمليات الأخيرة</span>
            </h3>

            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من مسح سجل التعديلات؟')) {
                  onClearAuditLogs();
                }
              }}
              className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
            >
              مسح السجل
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold sticky top-0">
                  <th className="py-2.5 px-3">التاريخ والوقت</th>
                  <th className="py-2.5 px-3">نوع الإجراء</th>
                  <th className="py-2.5 px-3">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">
                      لا توجد عمليات مسجلة في السجل
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
