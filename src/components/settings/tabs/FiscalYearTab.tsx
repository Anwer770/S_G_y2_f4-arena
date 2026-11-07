import React, { useState } from 'react';
import { FiscalYearSettings } from '../../../types/settings';
import { Calendar, Lock, Unlock, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

interface Props {
  settings: FiscalYearSettings;
  onChange: (updated: FiscalYearSettings) => void;
}

export const FiscalYearTab: React.FC<Props> = ({ settings, onChange }) => {
  const [showCloseModal, setShowCloseModal] = useState(false);

  const handleToggleStatus = () => {
    const newStatus = settings.status === 'open' ? 'closed' : 'open';
    onChange({
      ...settings,
      status: newStatus,
    });
  };

  const handleConfirmCloseYear = () => {
    onChange({
      ...settings,
      status: 'closed',
    });
    setShowCloseModal(false);
    alert('تم إقفال السنة المالية بنجاح وترحيل الأرصدة الافتتاحية للسنة القادمة.');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">إدارة السنة المالية والفترات المحاسبية</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تحديد الفترات المالية المحاسبية، وحالة إقفال الدفاتر وترحيل الأرصدة الافتتاحية
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">السنة المالية الحالية</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              عام {settings.currentYear}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                settings.status === 'open'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {settings.status === 'open' ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>مفتوحة ونشطة للقيود</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>مقفلة نهائياً</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              تاريخ بداية السنة المالية
            </label>
            <input
              type="date"
              value={settings.startDate}
              onChange={(e) => onChange({ ...settings, startDate: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              تاريخ نهاية السنة المالية
            </label>
            <input
              type="date"
              value={settings.endDate}
              onChange={(e) => onChange({ ...settings, endDate: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              السماح بتسجيل قيود وسندات ذات تواريخ سابقة
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              يتيح للمحاسب إدخال حركات تمت في أيام سابقة ضمن السنة المالية الحالية
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allowBackdatedEntries}
              onChange={(e) => onChange({ ...settings, allowBackdatedEntries: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Close Year Actions */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          {settings.status === 'open' ? (
            <button
              type="button"
              onClick={() => setShowCloseModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>إقفال السنة المالية وترحيل الأرصدة</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleStatus}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>إعادة فتح السنة المالية</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl text-right">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-center text-slate-900 dark:text-white">
              تأكيد إقفال السنة المالية {settings.currentYear}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              عند إقفال السنة المالية، سيتم منع إضافة أو تعديل أي قيود محاسبية أو حركات مخزنية للفترة السابقة، وسيقوم النظام باحتساب الأرباح والخسائر وترحيل الأرصدة الختامية كأرصدة افتتاحية للسنة الجديدة.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmCloseYear}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                تأكيد الإقفال والترحيل
              </button>
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
