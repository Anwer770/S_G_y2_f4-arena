import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, Clock, Layers, Filter } from 'lucide-react';
import { RoutineTemplateItem, RoutineRecord } from '../../types/routines';
import { formatDurationArabic } from '../../utils/routines';

interface RoutineTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: RoutineTemplateItem[];
  onApplyTemplate: (template: RoutineTemplateItem) => void;
}

export const RoutineTemplatesModal: React.FC<RoutineTemplatesModalProps> = ({
  isOpen,
  onClose,
  templates,
  onApplyTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = Array.from(new Set(templates.map((t) => t.category)));

  const filteredTemplates = templates.filter((t) => {
    if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
    return true;
  });

  const handleApply = (template: RoutineTemplateItem) => {
    setCopiedId(template.id);
    onApplyTemplate(template);
    setTimeout(() => {
      onClose();
      setCopiedId(null);
    }, 400);
  };

  return (
    <div
      id="routine-templates-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-slate-900/20 flex items-center justify-center text-xl backdrop-blur-sm">
              📚
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">مكتبة قوالب الروتينات الاحترافية الجاهزة</h2>
              <p className="text-xs text-emerald-100">
                اختر قالباً جاهزاً ومجرّباً لإضافته مباشرة إلى جدول أعمالك بنقرة واحدة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 dark:hover:bg-slate-900/10 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Categories Tabs */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            الكل ({templates.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat} ({templates.filter((t) => t.category === cat).length})
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((tpl) => {
            const isApplied = copiedId === tpl.id;

            return (
              <div
                key={tpl.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-emerald-400 dark:hover:border-emerald-600 transition flex flex-col justify-between space-y-3 group shadow-sm hover:shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl">
                        {tpl.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 transition">
                          {tpl.name}
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {tpl.category}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Clock size={12} className="text-emerald-500" />
                      {tpl.suggestedDuration} د
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {tpl.description}
                  </p>

                  {/* Steps preview */}
                  <div className="space-y-1 pt-1">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block">
                      خطوات الروتين ({tpl.steps.length}):
                    </span>
                    {tpl.steps.slice(0, 3).map((st, i) => (
                      <div
                        key={i}
                        className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 truncate"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="truncate">{st.title}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">({st.duration}د)</span>
                      </div>
                    ))}
                    {tpl.steps.length > 3 && (
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-bold">
                        +{tpl.steps.length - 3} خطوات أخرى
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {tpl.tags.map((t, i) => (
                      <span
                        key={i}
                        className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleApply(tpl)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 ${
                      isApplied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check size={14} /> تم النسخ بنجاح
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> استخدام هذا القالب
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
