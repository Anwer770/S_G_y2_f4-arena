import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Zap,
  Sparkles,
  Award,
  Calendar,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { RoutineExecution, RoutineRecord } from '../../types/routines';

interface RoutineExecutionsHistoryProps {
  executions: RoutineExecution[];
  routines: RoutineRecord[];
  onDeleteExecution: (id: string) => void;
}

export const RoutineExecutionsHistory: React.FC<RoutineExecutionsHistoryProps> = ({
  executions,
  routines,
  onDeleteExecution,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredExecutions = executions.filter((ex) => {
    if (statusFilter !== 'ALL' && ex.status !== statusFilter) return false;
    if (
      searchTerm &&
      !ex.routineName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !ex.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Sort descending by date
  const sortedExecutions = [...filteredExecutions].sort((a, b) =>
    (b.createdAt || b.date).localeCompare(a.createdAt || a.date)
  );

  return (
    <div id="routine-history-view" className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث في سجل التنفيذ، أسماء الروتينات أو الملاحظات..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none w-full sm:w-auto"
          >
            <option value="ALL">كافة حالات التنفيذ</option>
            <option value="COMPLETED">مكتمل بنجاح</option>
            <option value="PARTIALLY_COMPLETED">مكتمل جزئياً</option>
            <option value="MISSED">فات الموعد</option>
          </select>
        </div>
      </div>

      {/* History List */}
      {sortedExecutions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-2">
          <FileText size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            لا توجد سجلات تنفيذ مطابقة
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            سوف تظهر هنا جلسات المؤقت والتوثيق فور إتمام جلسات الروتين اليومية.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedExecutions.map((ex) => {
            const isExpanded = expandedId === ex.id;

            return (
              <div
                key={ex.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-slate-300 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                          {ex.routineName}
                        </h4>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                          {ex.completionRate}% إنجاز
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {ex.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> استغرق {ex.actualDuration} دقيقة (المخطط: {ex.plannedDuration} د)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {ex.energyLevel && (
                      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Zap size={12} /> {ex.energyLevel}/5
                      </span>
                    )}

                    {ex.focusLevel && (
                      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Sparkles size={12} /> {ex.focusLevel}/5
                      </span>
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title={isExpanded ? 'طي التفاصيل' : 'عرض التفاصيل'}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm('هل تريد حذف هذا السجل من تاريخ التنفيذ؟')) {
                          onDeleteExecution(ex.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      title="حذف السجل"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs text-slate-600 dark:text-slate-300 animate-in fade-in duration-150">
                    {ex.notes && (
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                          الملاحظات المسجلة:
                        </span>
                        <p>{ex.notes}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <span className="text-slate-400 dark:text-slate-500 block">وقت البدء الفعلي:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {ex.actualStart ? new Date(ex.actualStart).toLocaleTimeString('ar-YE') : ex.plannedStart}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <span className="text-slate-400 dark:text-slate-500 block">وقت الانتهاء:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {ex.actualEnd ? new Date(ex.actualEnd).toLocaleTimeString('ar-YE') : ex.plannedEnd}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <span className="text-slate-400 dark:text-slate-500 block">الخطوات المنجزة:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {ex.completedStepsCount} من {ex.totalStepsCount}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <span className="text-slate-400 dark:text-slate-500 block">مرات الإيقاف المؤقت:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {ex.pauseCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
