import React, { useMemo, useState } from 'react';
import { ShieldCheck, Search, Trash2, RefreshCw } from 'lucide-react';
import { auditService } from '../../../core/audit/AuditService';

const ACTION_LABEL: Record<string, string> = {
  Create: 'إضافة', Update: 'تعديل', Delete: 'حذف', Backup: 'نسخ احتياطي', Restore: 'استعادة',
  'Permission Change': 'تغيير صلاحيات', 'Inventory Adjustment': 'تسوية مخزون', 'Debt Settlement': 'تسوية دين',
  إضافة: 'إضافة', تعديل: 'تعديل', حذف: 'حذف', استيراد: 'استيراد', تصدير: 'تصدير',
};

export const AuditLogTab: React.FC = () => {
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState('');
  const logs = useMemo(() => {
    void version;
    return auditService.getAllLogs();
  }, [version]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return logs;
    return logs.filter((l) =>
      [l.entity, l.action, l.details, l.userId, l.recordId].filter(Boolean).some((v) => String(v).includes(q))
    );
  }, [logs, query]);

  return (
    <div className="space-y-4" data-settings-tab="audit">
      <div className="surface-card p-4 sm:p-5 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 text-xs leading-6 text-slate-600 dark:text-slate-300">
          <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
          <div>
            <strong className="text-slate-900 dark:text-white">سجل تدقيق مركزي موحّد.</strong> كل إضافة أو تعديل أو حذف
            في أي شاشة (المخزون · السجل المالي · الديون · القوائم والثوابت · الصلاحيات) يُسجَّل هنا: من عدّل، ماذا، ومتى —
            مع الجهاز الذي تم منه التعديل.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث في السجل..."
              className="w-52 px-3 py-1.5 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2" />
          </div>
          <button type="button" onClick={() => setVersion((v) => v + 1)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer" title="تحديث">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => { if (window.confirm('مسح كل السجل؟')) { auditService.clearLogs(); setVersion((v) => v + 1); } }}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer" title="مسح السجل">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs min-w-[720px] print:min-w-0">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
              <tr>
                <th className="p-3">الوقت</th>
                <th className="p-3">الإجراء</th>
                <th className="p-3">الكيان</th>
                <th className="p-3">التفاصيل</th>
                <th className="p-3">المستخدم</th>
                <th className="p-3">الجهاز</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-slate-400">لا توجد سجلات مطابقة.</td></tr>
              ) : filtered.slice(0, 300).map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono text-slate-500 dark:text-slate-400">{new Date(l.timestamp).toLocaleString('ar-EG')}</td>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{ACTION_LABEL[l.action] || l.action}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{l.entity}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 max-w-96 truncate" title={l.details || ''}>{l.details || '—'}</td>
                  <td className="p-3 font-mono text-slate-500 dark:text-slate-400">{l.userId}</td>
                  <td className="p-3 font-mono text-slate-400">{l.deviceId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 px-1">إجمالي السجلات: {logs.length} · المعروض: {Math.min(filtered.length, 300)}</p>
    </div>
  );
};

export default AuditLogTab;
