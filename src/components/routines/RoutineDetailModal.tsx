import React from 'react';
import {
  X,
  Play,
  Edit,
  Trash2,
  Copy,
  Clock,
  Calendar,
  CheckCircle2,
  Flame,
  Target,
  ListChecks,
  Tag,
  MapPin,
  User,
  Bell,
  Archive,
  BarChart3,
  Award,
} from 'lucide-react';
import { RoutineRecord, RoutineExecution } from '../../types/routines';
import { formatDurationArabic } from '../../utils/routines';

interface RoutineDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine: RoutineRecord | null;
  executions: RoutineExecution[];
  onStartTimer: (routine: RoutineRecord) => void;
  onEdit: (routine: RoutineRecord) => void;
  onDuplicate: (routine: RoutineRecord) => void;
  onDelete: (routineId: string) => void;
}

export const RoutineDetailModal: React.FC<RoutineDetailModalProps> = ({
  isOpen,
  onClose,
  routine,
  executions,
  onStartTimer,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  if (!isOpen || !routine) return null;

  const routineExecutions = executions.filter((ex) => ex.routineId === routine.id);
  const totalExecs = routineExecutions.length;
  const completedExecs = routineExecutions.filter((ex) => ex.status === 'COMPLETED').length;
  const completionRate = totalExecs > 0 ? Math.round((completedExecs / totalExecs) * 100) : 100;

  return (
    <div
      id="routine-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 dark:bg-slate-900/20 flex items-center justify-center text-2xl backdrop-blur-sm shadow-inner">
              {routine.icon || '⚡'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/20 dark:bg-slate-900/20 text-white">
                  {routine.code}
                </span>
                <span className="text-xs text-emerald-100">{routine.categoryName}</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">{routine.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onStartTimer(routine)}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold flex items-center gap-1.5 shadow transition active:scale-95"
            >
              <Play size={14} className="fill-emerald-700" /> بدء المؤقت
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 dark:hover:bg-slate-900/10 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                <Clock size={12} /> التوقيت والمدة
              </span>
              <div className="text-sm font-bold text-slate-800 dark:text-white mt-1">
                {routine.startTime} ({routine.duration} د)
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-center">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1">
                <Flame size={12} /> الـ Streak الحالي
              </span>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {routine.currentStreak || 0} يوم متتالي
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800/40 text-center">
              <span className="text-xs text-amber-700 dark:text-amber-400 flex items-center justify-center gap-1">
                <Award size={12} /> أطول Streak
              </span>
              <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">
                {routine.longestStreak || 0} يوم
              </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/40 text-center">
              <span className="text-xs text-indigo-700 dark:text-indigo-400 flex items-center justify-center gap-1">
                <BarChart3 size={12} /> معدل الإنجاز
              </span>
              <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {completionRate}% ({completedExecs}/{totalExecs})
              </div>
            </div>
          </div>

          {/* Description */}
          {routine.description && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="font-bold block mb-1 text-slate-900 dark:text-white">الهدف والوصف:</span>
              {routine.description}
            </div>
          )}

          {/* Steps Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <ListChecks size={16} className="text-emerald-500" />
                خطوات الروتين ({routine.steps?.length || 0})
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                إجمالي: {formatDurationArabic(routine.duration)}
              </span>
            </div>

            <div className="space-y-2">
              {routine.steps?.map((step, idx) => (
                <div
                  key={step.id || idx}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 font-bold flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{step.title}</span>
                    {step.isRequired && (
                      <span className="text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/40 px-1.5 py-0.5 rounded">
                        إلزامي
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                    {step.duration} دقيقة
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata & Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-1">المسؤول والموقع:</span>
              <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <User size={12} className="text-slate-400 dark:text-slate-500" /> {routine.owner || 'الإدارة'}
                {routine.location && (
                  <>
                    <span className="text-slate-300 mx-1">•</span>
                    <MapPin size={12} className="text-slate-400 dark:text-slate-500" /> {routine.location}
                  </>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-1">الوسوم والروابط:</span>
              <div className="flex flex-wrap gap-1">
                {routine.tags?.map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs"
                  >
                    #{t}
                  </span>
                ))}
                {routine.goalIds?.map((g, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs"
                  >
                    هدف {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(routine)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1 transition"
            >
              <Edit size={14} /> تعديل
            </button>
            <button
              onClick={() => onDuplicate(routine)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1 transition"
            >
              <Copy size={14} /> استنساخ
            </button>
            <button
              onClick={() => {
                if (window.confirm(`هل أنت متأكد من حذف الروتين "${routine.name}" نهائياً؟`)) {
                  onDelete(routine.id);
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1 transition"
            >
              <Trash2 size={14} /> حذف
            </button>
          </div>

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
