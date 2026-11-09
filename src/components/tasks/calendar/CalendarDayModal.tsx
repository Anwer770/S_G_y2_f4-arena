/**
 * نافذة اليوم التفاعلية في التقويم (R30) — مستخرجة من `CalendarView.tsx` بلا تغيير.
 */
import React from 'react';
import { CalendarDays, CheckCircle2, Check, Coins, Plus, X } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { ARABIC_WEEKDAYS } from '../calendarTypes';
import type { CalendarModel } from '../useCalendarModel';

type Props = Pick<
  CalendarModel,
  | 'getCommitmentsForDate'
  | 'getTasksForDate'
  | 'onEditCommitment'
  | 'onEditTask'
  | 'selectedDayModal'
  | 'setSelectedDayModal'
  | 'setViewMode'
  | 'getPriorityStyle'
  | 'getStatusColor'
  | 'handleQuickAddTask'
  | 'handleQuickAddCommitment'
  | 'setCurrentDate'
>;

export const CalendarDayModal: React.FC<Props> = ({
  getCommitmentsForDate,
  getTasksForDate,
  onEditCommitment,
  onEditTask,
  selectedDayModal,
  setSelectedDayModal,
  setViewMode,
  getPriorityStyle,
  getStatusColor,
  handleQuickAddTask,
  handleQuickAddCommitment,
  setCurrentDate,
}) => (
  <>
    {/* 5. INTERACTIVE DAY MODAL (النافذة السريعة عند النقر على أي يوم بالتقويم) */}
    {selectedDayModal && (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in zoom-in-95">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  جدول يوم {selectedDayModal.dayName} ({selectedDayModal.dateStr})
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  اختر الإجراء المطلوب أو استعرض المهام المجدولة
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDayModal(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions to Add on this Date */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleQuickAddTask(selectedDayModal.dateStr)}
              className="p-3.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-right transition-all cursor-pointer flex flex-col justify-between shadow-2xs group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-xs group-hover:text-teal-700">مهمة جديدة</span>
                <Plus className="w-4 h-4 text-teal-600" />
              </div>
              <span className="text-xs text-teal-600/80 dark:text-teal-400/80">
                إضافة مهمة تنفيذية مجدولة لهذا التاريخ
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickAddCommitment(selectedDayModal.dateStr)}
              className="p-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-right transition-all cursor-pointer flex flex-col justify-between shadow-2xs group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-xs group-hover:text-amber-700">التزام مالي</span>
                <Coins className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs text-amber-600/80 dark:text-amber-400/80">تسجيل دفعة أو قسط أو مستحق مالي</span>
            </button>
          </div>

          {/* Existing Items on this Day */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              <span>المسجل في هذا اليوم:</span>
              <span className="text-xs font-mono text-slate-400">
                {getTasksForDate(selectedDayModal.dateStr).length} مهام •{' '}
                {getCommitmentsForDate(selectedDayModal.dateStr).length} التزامات
              </span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {getTasksForDate(selectedDayModal.dateStr).length === 0 &&
              getCommitmentsForDate(selectedDayModal.dateStr).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  لا توجد أي مهام أو التزامات مجدولة في هذا اليوم بعد.
                </p>
              ) : (
                <>
                  {getTasksForDate(selectedDayModal.dateStr).map((t) => (
                    <div
                      key={`modal-t-${t.id}`}
                      onClick={() => {
                        setSelectedDayModal(null);
                        if (onEditTask) onEditTask(t);
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-teal-400 transition-colors cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="font-bold text-slate-800 dark:text-slate-100 truncate">{t.title}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${getPriorityStyle(t.pri)}`}>
                        أولوية {t.pri}
                      </span>
                    </div>
                  ))}

                  {getCommitmentsForDate(selectedDayModal.dateStr).map((c) => (
                    <div
                      key={`modal-c-${c.id}`}
                      onClick={() => {
                        setSelectedDayModal(null);
                        if (onEditCommitment) onEditCommitment(c);
                      }}
                      className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 hover:border-amber-400 transition-colors cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-bold text-amber-900 dark:text-amber-100 truncate">{c.name}</span>
                      </div>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                        {formatCurrency(c.amount)} YER
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setCurrentDate(new Date(selectedDayModal.dateStr));
                setViewMode('daily');
                setSelectedDayModal(null);
              }}
              className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
            >
              الانتقال للعرض اليومي الكامل لهذا التاريخ ←
            </button>
            <button
              type="button"
              onClick={() => setSelectedDayModal(null)}
              className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
