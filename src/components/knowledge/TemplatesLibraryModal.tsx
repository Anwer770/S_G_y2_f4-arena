import React, { useState } from 'react';
import { NoteFolder, NoteRecord, NoteTemplate, NoteType } from '../../types';
import {
  X,
  Plus,
  FileText,
  Sparkles,
  Check,
  Tag,
  Folder,
  Trash2,
  Edit2,
  Copy,
} from 'lucide-react';

interface TemplatesLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: NoteTemplate[];
  onUseTemplate: (template: NoteTemplate) => void;
  onAddTemplate?: (template: NoteTemplate) => void;
  onDeleteTemplate?: (id: string) => void;
}

export const TemplatesLibraryModal: React.FC<TemplatesLibraryModalProps> = ({
  isOpen,
  onClose,
  templates,
  onUseTemplate,
  onAddTemplate,
  onDeleteTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Template form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<NoteType>('عامة');
  const [newCategory, setNewCategory] = useState('إدارية');
  const [newContent, setNewContent] = useState('');
  const [newIcon, setNewIcon] = useState('📋');

  const categories = ['all', ...Array.from(new Set((templates || []).map((t) => t.category)))];

  const filteredTemplates = (templates || []).filter((t) => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('الرجاء إدخال اسم القالب والمحتوى الهيكلي.');
      return;
    }

    if (onAddTemplate) {
      const template: NoteTemplate = {
        id: `tpl-custom-${Date.now()}`,
        title: newTitle.trim(),
        description: newDesc.trim(),
        icon: newIcon || '📋',
        category: newCategory,
        type: newType,
        defaultContent: newContent,
        defaultTags: ['قالب'],
        usageCount: 0,
      };
      onAddTemplate(template);
      setShowAddForm(false);
      setNewTitle('');
      setNewDesc('');
      setNewContent('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto"
      dir="rtl"
    >
      <div className="relative w-full max-w-4xl my-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                مكتبة القوالب الجاهزة (Templates Library)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اختر قالباً لبدء تدوين ملاحظتك بهيكل قياسي متكامل أو صمم قالبك الخاص
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'عرض القوالب' : 'إضافة قالب مخصص'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {showAddForm ? (
            /* Add Template Form */
            <form onSubmit={handleCreateTemplate} className="space-y-4 p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                تصميم قالب ملاحظة جديد
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    اسم القالب <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: تقرير استلام بضاعة..."
                    required
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    الأيقونة
                  </label>
                  <input
                    type="text"
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    placeholder="رمز إيموجي مثل: 📦"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    التصنيف
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="إدارية، مبيعات، مالية..."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    نوع الملاحظة الافتراضي
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as NoteType)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  >
                    <option value="عامة">عامة</option>
                    <option value="اجتماع">اجتماع</option>
                    <option value="زيارة">زيارة</option>
                    <option value="اتصال">اتصال</option>
                    <option value="قرار">قرار</option>
                    <option value="مشكلة">مشكلة وحل</option>
                    <option value="فكرة">فكرة</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  الوصف الموجز
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="وصف مختصر للغرض من استخدام القالب..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  الهيكل النصي للملاحظة (Markdown) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="اكتب العناوين والبنود الافتراضية للقالب..."
                  rows={6}
                  required
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
                >
                  حفظ القالب
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Category Filter & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        selectedCategory === cat
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'all' ? 'جميع القوالب' : cat}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث في القوالب..."
                  className="w-full sm:w-60 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex flex-col justify-between p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{template.icon}</span>
                        <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold rounded">
                          {template.category}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-purple-600 transition-colors">
                          {template.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        استُخدم {template.usageCount || 0} مرة
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          onUseTemplate(template);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>استخدام القالب</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
