import React, { useState } from 'react';
import { X, SkipForward, AlertCircle } from 'lucide-react';
import { RoutineOccurrence, RoutineRecord } from '../../types/routines';

interface RoutineSkipModalProps {
  isOpen: boolean;
  onClose: () => void;
  occurrence: RoutineOccurrence | null;
  routine: RoutineRecord | null;
  onSkip: (occurrenceId: string, reason: string) => void;
}

export const RoutineSkipModal: React.FC<RoutineSkipModalProps> = ({
  isOpen,
  onClose,
  occurrence,
  routine,
  onSkip,
}) => {
  const [reasonCategory, setReasonCategory] = useState<string>('ظروف طارئة');
  const [notes, setNotes] = useState('');

  if (!isOpen || !occurrence || !routine) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = notes.trim() ? `${reasonCategory}: ${notes.trim()}` : reasonCategory;
    onSkip(occurrence.id, finalReason);
    onClose();
  };

  return (
    <div
      id="routine-skip-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl sm:rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        <div className="bg-rose-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SkipForward size={20} />
            <h3 className="font-bold text-sm">تخطي موعد الروتين: {routine.shortName || routine.name}</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-5 space-y-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>
              تخطي الروتين يسجله كـ &quot;تم التخطي بعذر&quot; دون التأثير السلبي الحاد على إحصاءات الانضباط، مع حفظ سبب التخطي للتحليل.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              التصنيف الرئيسي لسبب التخطي:
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold outline-none"
            >
              <option value="ظروف طارئة">ظروف طارئة / حالة مستعجلة</option>
              <option value="إجازة أو عطلة">إجازة رسمية / يوم راحة</option>
              <option value="انشغال بزيارات ميدانية">انشغال بزيارات ميدانية أو اجتماعات خارجية</option>
              <option value="تم إنجازه خارج الجدول">تم إنجازه مسبقاً خارج وقت الجدول</option>
              <option value="عوامل تقنية">عوامل تقنية / تعذر الوصول للمكتب</option>
              <option value="أخرى">سبب آخر</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              تفاصيل إضافية (اختياري):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب أية تفاصيل لتوضيح سبب الاستثناء..."
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none h-16"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              إلغاء
            </button>
            <button
              id="btn-confirm-skip"
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition"
            >
              تأكيد التخطي
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
