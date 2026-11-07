import React from 'react';
import { NotificationSettings } from '../../../types/settings';
import { Bell, AlertCircle, Volume2, ShieldAlert, DollarSign, Clock, CalendarDays } from 'lucide-react';

interface Props {
  settings: NotificationSettings;
  onChange: (updated: NotificationSettings) => void;
}

export const NotificationsTab: React.FC<Props> = ({ settings, onChange }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">إعدادات الإشعارات والتنبيهات الذكية</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تخصيص التنبيهات التلقائية للمخزون المنخفض، مواعيد استحقاق الديون، والموازنة اليومية
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Low Stock Alert */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">تنبيهات انخفاض المخزون</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">إشعار عند اقتراب كمية أي صنف من نقطة الطلب</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.stockAlertsEnabled}
                onChange={(e) => onChange({ ...settings, stockAlertsEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {settings.stockAlertsEnabled && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <label className="text-xs text-slate-600 dark:text-slate-400">الحد الأدنى للكمية للتنبيه (قطع):</label>
              <input
                type="number"
                min={1}
                value={settings.stockAlertThreshold}
                onChange={(e) => onChange({ ...settings, stockAlertThreshold: Number(e.target.value) || 1 })}
                className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white text-center"
              />
            </div>
          )}
        </div>

        {/* 2. Invoices & Debts Due Alert */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">تذكير استحقاق الفواتير والديون</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">تذكير مبكر بمواعيد سداد فواتير المشتريات ومستحقات العملاء</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.invoiceDueAlertsEnabled}
                onChange={(e) => onChange({ ...settings, invoiceDueAlertsEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {settings.invoiceDueAlertsEnabled && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <label className="text-xs text-slate-600 dark:text-slate-400">التنبيه قبل الاستحقاق بـ (أيام):</label>
              <input
                type="number"
                min={1}
                value={settings.invoiceDueDaysNotice}
                onChange={(e) => onChange({ ...settings, invoiceDueDaysNotice: Number(e.target.value) || 1 })}
                className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white text-center"
              />
            </div>
          )}
        </div>

        {/* 3. Daily Summary */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">ملخص يومي بنهاية كل يوم عمل</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">عرض ملخص الإيرادات والمصروفات وصافي الصندوق تلقائياً</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.dailySummaryEnabled}
                onChange={(e) => onChange({ ...settings, dailySummaryEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {/* 4. Sound Alerts */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">الإشعارات والتأثيرات الصوتية</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">تشغيل صوت خفيف عند إتمام الحركات وتسجيل السندات</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundAlertsEnabled}
                onChange={(e) => onChange({ ...settings, soundAlertsEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {/* 5. Balance Mismatch Alert */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">تنبيه عدم اتزان القيد المحاسبي</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">تنبيه مباشر في حال وجود فارق بين إجمالي المدين والدائن</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.balanceMismatchAlertEnabled}
                onChange={(e) => onChange({ ...settings, balanceMismatchAlertEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {/* 6. Treasury Low Alert */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">تنبيه رصيد الخزينة والصناديق</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">إشعار عند انخفاض الرصيد النقدي في الصندوق عن الحد الآمن</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.treasuryLowAlertEnabled}
                onChange={(e) => onChange({ ...settings, treasuryLowAlertEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {settings.treasuryLowAlertEnabled && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <label className="text-xs text-slate-600 dark:text-slate-400">الحد الأدنى للرصيد النقدي:</label>
              <input
                type="number"
                min={0}
                value={settings.treasuryLowThreshold}
                onChange={(e) => onChange({ ...settings, treasuryLowThreshold: Number(e.target.value) || 0 })}
                className="w-28 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white text-center"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
