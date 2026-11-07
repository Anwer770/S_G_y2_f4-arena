import React, { useState, useMemo } from 'react';
import { DebtAuditLog } from '../../types';
import { Search, History, Trash2, Filter } from 'lucide-react';

interface DebtAuditViewProps {
  logs: DebtAuditLog[];
  onClearLogs: () => void;
}

export const DebtAuditView: React.FC<DebtAuditViewProps> = ({ logs, onClearLogs }) => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchTitle = (log.title || '').toLowerCase().includes(q);
        const matchDetails = (log.details || '').toLowerCase().includes(q);
        const matchAction = (log.action || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDetails && !matchAction) return false;
      }
      return true;
    });
  }, [logs, actionFilter, search]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">سجل العمليات والرقابة (Audit Log)</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              تتبع جميع عمليات الإضافة والتعديل والحذف وسداد الدفعات في دفاتر الدين والالتزامات
            </p>
          </div>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح السجل</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث في سجل العمليات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-500 dark:text-slate-400">نوع الإجراء:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">كل الإجراءات</option>
            <option value="إضافة">إضافة</option>
            <option value="تعديل">تعديل</option>
            <option value="حذف">حذف</option>
            <option value="سداد">سداد دفعة</option>
            <option value="استيراد">استيراد</option>
            <option value="تصفير">تصفير</option>
          </select>
        </div>
      </div>

      {/* Log list */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[550px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-xs">لا توجد سجلات مطابقة للبحث</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                        log.action === 'إضافة'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.action === 'تعديل'
                          ? 'bg-amber-100 text-amber-800'
                          : log.action === 'حذف'
                          ? 'bg-rose-100 text-rose-800'
                          : log.action === 'سداد'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="font-black text-slate-900 dark:text-slate-100">{log.title}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">({log.entity})</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">{log.details}</p>
                </div>
                <span className="font-mono text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  {log.time}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
