import React, { useState } from 'react';
import { X, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { RoutineOccurrence, RoutineRecord } from '../../types/routines';
import { minutesToTime, timeToMinutes } from '../../utils/routines';

interface RoutinePostponeModalProps {
  isOpen: boolean;
  onClose: () => void;
  occurrence: RoutineOccurrence | null;
  routine: RoutineRecord | null;
  onPostpone: (occurrenceId: string, newTime: string, newDate?: string, reason?: string) => void;
}

export const RoutinePostponeModal: React.FC<RoutinePostponeModalProps> = ({
  isOpen,
  onClose,
  occurrence,
  routine,
  onPostpone,
}) => {
  const currentMinutes = occurrence ? timeToMinutes(occurrence.plannedStart) : 0;
  const [postponeOption, setPostponeOption] = useState<'15m' | '30m' | '1h' | 'tomorrow' | 'custom'>('15m');
  const [customTime, setCustomTime] = useState(minutesToTime(currentMinutes + 15));
  const [customDate, setCustomDate] = useState(occurrence?.date || '');
  const [reason, setReason] = useState('انشغال بمعاملة عاجلة');

  if (!isOpen || !occurrence || !routine) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let targetTime = occurrence.plannedStart;
    let targetDate = occurrence.date;

    if (postponeOption === '15m') {
      targetTime = minutesToTime(currentMinutes + 15);
    } else if (postponeOption === '30m') {
      targetTime = minutesToTime(currentMinutes + 30);
    } else if (postponeOption === '1h') {
      targetTime = minutesToTime(currentMinutes + 60);
    } else if (postponeOption === 'tomorrow') {
      const tomorrow = new Date(occurrence.date);
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDate = tomorrow.toISOString().split('T')[0];
    } else {
      targetTime = customTime;
      targetDate = customDate;
    }

    onPostpone(occurrence.id, targetTime, targetDate, reason);
    onClose();
  };

  return (
    <div
      id="routine-postpone-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl sm:rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        <div className="bg-amber-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={20} />
            <h3 className="font-bold text-sm">تأجيل موعد الروتين: {routine.shortName || routine.name}</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            الوقت الحالي المخطط: <span className="font-bold text-slate-800 dark:text-white">{occurrence.plannedStart}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPostponeOption('15m')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                postponeOption === '15m'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              + 15 دقيقة
            </button>
            <button
              type="button"
              onClick={() => setPostponeOption('30m')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                postponeOption === '30m'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              + 30 دقيقة
            </button>
            <button
              type="button"
              onClick={() => setPostponeOption('1h')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                postponeOption === '1h'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              + 1 ساعة
            </button>
            <button
              type="button"
              onClick={() => setPostponeOption('tomorrow')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                postponeOption === 'tomorrow'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              إلى الغد
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              سبب التأجيل (للتوثيق والتحليل):
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: اجتماع طارئ، مكالمة هاتفية"
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
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
              id="btn-confirm-postpone"
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition"
            >
              تأكيد التأجيل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
