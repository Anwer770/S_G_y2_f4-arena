import React, { useState, useEffect } from 'react';
import { LinkRecord, LinkImportance, LinkType } from '../../types/linksLibrary';
import { X, Globe, Sparkles, Check, AlertCircle } from 'lucide-react';
import { formatValidUrl } from '../../utils/linksExport';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (link: LinkRecord) => void;
  initialData?: LinkRecord | null;
  classifications: string[];
  categories: string[];
  types: string[];
  importances: string[];
}

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  classifications,
  categories,
  types,
  importances,
}) => {
  const [siteName, setSiteName] = useState('');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [classification, setClassification] = useState(classifications[0] || 'برامج وتطبيقات');
  const [category, setCategory] = useState(categories[0] || 'عمل بحث');
  const [type, setType] = useState<LinkType>(types[0] || 'موقع رسمي');
  const [importance, setImportance] = useState<LinkImportance>('A');
  const [isFavorite, setIsFavorite] = useState(false);
  const [notes, setNotes] = useState('');
  const [customClassification, setCustomClassification] = useState('');
  const [showCustomClassification, setShowCustomClassification] = useState(false);

  const [errors, setErrors] = useState<{ siteName?: string; url?: string }>({});

  useEffect(() => {
    if (initialData) {
      setSiteName(initialData.siteName || '');
      setUrl(initialData.url || '');
      setDesc(initialData.desc || '');
      setClassification(initialData.classification || classifications[0] || 'برامج وتطبيقات');
      setCategory(initialData.category || categories[0] || 'عمل بحث');
      setType(initialData.type || types[0] || 'موقع رسمي');
      setImportance(initialData.importance || 'A');
      setIsFavorite(Boolean(initialData.isFavorite));
      setNotes(initialData.notes || '');
      setShowCustomClassification(false);
      setCustomClassification('');
    } else {
      setSiteName('');
      setUrl('');
      setDesc('');
      setClassification(classifications[0] || 'برامج وتطبيقات');
      setCategory(categories[0] || 'عمل بحث');
      setType(types[0] || 'موقع رسمي');
      setImportance('A');
      setIsFavorite(false);
      setNotes('');
      setShowCustomClassification(false);
      setCustomClassification('');
    }
    setErrors({});
  }, [initialData, isOpen, classifications, categories, types, importances]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { siteName?: string; url?: string } = {};
    if (!siteName.trim()) {
      newErrors.siteName = 'يرجى إدخال اسم الموقع أو الرابط';
    }
    if (!url.trim()) {
      newErrors.url = 'يرجى إدخال عنوان الرابط URL';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalClassification =
      showCustomClassification && customClassification.trim()
        ? customClassification.trim()
        : classification;

    const record: LinkRecord = {
      id: initialData?.id || `LNK-${Date.now().toString(36).toUpperCase()}`,
      siteName: siteName.trim(),
      url: formatValidUrl(url),
      desc: desc.trim(),
      classification: finalClassification,
      category: category,
      type: type,
      importance: importance,
      isFavorite: isFavorite,
      notes: notes.trim() || undefined,
      visitCount: initialData?.visitCount || 0,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(record);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-xl sm:rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                {initialData ? 'تعديل بيانات الرابط' : 'إضافة رابط جديد للمكتبة'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                فهرسة وتوثيق الروابط المفيدة بدقة لتسهيل البحث السريع
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Site Name & URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                اسم الموقع / الأداة <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => {
                  setSiteName(e.target.value);
                  if (errors.siteName) setErrors({ ...errors, siteName: undefined });
                }}
                placeholder="مثال: ChatGPT, ExcelJet..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-hidden focus:ring-2 transition-all ${
                  errors.siteName
                    ? 'border-rose-400 focus:ring-rose-500/20 bg-rose-50/30'
                    : 'border-slate-300 focus:border-purple-600 focus:ring-purple-500/20'
                }`}
              />
              {errors.siteName && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {errors.siteName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                رابط الموقع (URL) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                dir="ltr"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errors.url) setErrors({ ...errors, url: undefined });
                }}
                placeholder="https://example.com"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-hidden focus:ring-2 transition-all text-left ${
                  errors.url
                    ? 'border-rose-400 focus:ring-rose-500/20 bg-rose-50/30'
                    : 'border-slate-300 focus:border-purple-600 focus:ring-purple-500/20'
                }`}
              />
              {errors.url && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {errors.url}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              الوصف والفائدة الأساسية
            </label>
            <textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="وصف مختصر لمميزات الموقع واستخداماته الموصى بها..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 text-xs focus:outline-hidden transition-all"
            />
          </div>

          {/* Classification & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">التصنيف الرئيسي</label>
                <button
                  type="button"
                  onClick={() => setShowCustomClassification(!showCustomClassification)}
                  className="text-xs text-purple-700 font-bold hover:underline"
                >
                  {showCustomClassification ? 'اختيار من القائمة' : '+ تصنيف جديد'}
                </button>
              </div>

              {showCustomClassification ? (
                <input
                  type="text"
                  value={customClassification}
                  onChange={(e) => setCustomClassification(e.target.value)}
                  placeholder="أدخل التصنيف المخصص..."
                  className="w-full px-3.5 py-2 rounded-xl border border-purple-400 bg-purple-50/30 dark:bg-purple-950/40 text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                />
              ) : (
                <select
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 text-xs focus:outline-hidden transition-all bg-white dark:bg-slate-900"
                >
                  {classifications.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">الفئة</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 text-xs focus:outline-hidden transition-all bg-white dark:bg-slate-900"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Type & Importance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">النوع</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 text-xs focus:outline-hidden transition-all bg-white dark:bg-slate-900"
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">درجة الأهمية</label>
              <select
                value={importance}
                onChange={(e) => setImportance(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 text-xs font-bold focus:outline-hidden transition-all bg-white dark:bg-slate-900"
              >
                {importances.map((imp) => (
                  <option key={imp} value={imp}>
                    {imp} {imp === 'A' ? '(فائق الأهمية)' : imp === 'B' ? '(مهم)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              ملاحظات إضافية / نصائح استخدام
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظة أو كلمة سر أو تنبيه يتعلق بالرابط..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 text-xs focus:outline-hidden transition-all"
            />
          </div>

          {/* Favorite Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 dark:text-purple-400 focus:ring-purple-500"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                إضافة هذا الرابط إلى الروابط المفضلة في أعلى القائمة ⭐
              </span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs hover:shadow-md hover:shadow-purple-500/20 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? 'حفظ التعديلات' : 'إضافة الرابط'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
