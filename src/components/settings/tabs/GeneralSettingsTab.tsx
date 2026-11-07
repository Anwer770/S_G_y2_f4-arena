import React from 'react';
import { GeneralSettings } from '../../../types/settings';
import { useTheme } from '../../../context/ThemeContext';
import { Sliders, Sun, Moon, Calendar, Coins, Hash, Check, User, ShieldCheck } from 'lucide-react';

interface Props {
  settings: GeneralSettings;
  onChange: (updated: GeneralSettings) => void;
}

const SUPPORTED_CURRENCIES = [
  { code: 'SAR', symbol: 'ر.س', nameAr: 'ريال سعودي', country: 'السعودية' },
  { code: 'YER', symbol: 'ر.ي', nameAr: 'ريال يمني', country: 'اليمن' },
  { code: 'AED', symbol: 'د.إ', nameAr: 'درهم إماراتي', country: 'الإمارات' },
  { code: 'EGP', symbol: 'ج.م', nameAr: 'جنيه مصري', country: 'مصر' },
  { code: 'KWD', symbol: 'د.ك', nameAr: 'دينار كويتي', country: 'الكويت' },
  { code: 'QAR', symbol: 'ر.ق', nameAr: 'ريال قطري', country: 'قطر' },
  { code: 'BHD', symbol: 'د.ب', nameAr: 'دينار بحريني', country: 'البحرين' },
  { code: 'OMR', symbol: 'ر.ع', nameAr: 'ريال عماني', country: 'عمان' },
  { code: 'JOD', symbol: 'د.أ', nameAr: 'دينار أردني', country: 'الأردن' },
  { code: 'USD', symbol: '$', nameAr: 'دولار أمريكي', country: 'أمريكا' },
  { code: 'EUR', symbol: '€', nameAr: 'يورو أوروبي', country: 'أوروبا' },
  { code: 'IQD', symbol: 'د.ع', nameAr: 'دينار عراقي', country: 'العراق' },
  { code: 'LYD', symbol: 'د.ل', nameAr: 'دينار ليبي', country: 'ليبيا' },
  { code: 'TND', symbol: 'د.ت', nameAr: 'دينار تونسي', country: 'تونس' },
  { code: 'DZD', symbol: 'د.ج', nameAr: 'دينار جزائري', country: 'الجزائر' },
  { code: 'MAD', symbol: 'د.م', nameAr: 'درهم مغربي', country: 'المغرب' },
];

const TIMEZONES = [
  '(GMT+03:00) الرياض / صنعاء / مكة المكرمة',
  '(GMT+02:00) القاهرة / القدس / عمان',
  '(GMT+04:00) دبي / مسقط / أبوظبي',
  '(GMT+03:00) الكويت / الدوحة / المنامة',
  '(GMT+01:00) الجزائر / تونس / الرباط',
  '(GMT+00:00) لندن / توقيت غرينتش UTC',
];

export const GeneralSettingsTab: React.FC<Props> = ({ settings, onChange }) => {
  const { theme, setTheme } = useTheme();
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Info */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">إعدادات النظام العامة</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تحديد اسم المستخدم ومدير النظام، العملة الافتراضية، المنطقة الزمنية، نوع التقويم المعتمد، وبادئات أرقام السندات
          </p>
        </div>
      </div>

      {/* Current User & Admin Profile Settings Card */}
      <div className="p-5 sm:p-6 rounded-xl bg-linear-to-r from-blue-50/70 via-slate-50 to-indigo-50/70 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900/40 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-blue-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>اسم المستخدم ومدير النظام الحالي</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  يظهر في الترويسة والقائمة الجانبية
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تخصيص اسم المستخدم الرئيسي والمسمى الوظيفي المعتمد في السجلات والعمليات
              </p>
            </div>
          </div>

          {/* Live Badge Preview */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-[#0d6854] text-white font-black text-xs flex items-center justify-center shadow-2xs">
              {(settings.currentUserName || 'مدير النظام').trim().charAt(0) || 'م'}
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {settings.currentUserName || 'مدير النظام'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {settings.currentUserTitle || 'مدير عام المنظومة والعمليات'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>اسم المستخدم المعتمد:</span>
            </label>
            <input
              type="text"
              value={settings.currentUserName || ''}
              onChange={(e) => onChange({ ...settings, currentUserName: e.target.value })}
              placeholder="مثال: مدير النظام"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              الاسم الافتراضي هو <strong>مدير النظام</strong> ويمكنك كتابة اسمك أو مسمى وظيفتك.
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>المسمى الإداري / الدور الوظيفي:</span>
            </label>
            <input
              type="text"
              value={settings.currentUserTitle || ''}
              onChange={(e) => onChange({ ...settings, currentUserTitle: e.target.value })}
              placeholder="مثال: مسؤول الإدارة العامة والعمليات"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              يظهر أسفل الاسم في القائمة الجانبية وبطاقة الحساب.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Base Currency Selection */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>العملة الأساسية للنظام</span>
          </label>
          <select
            value={settings.baseCurrency}
            onChange={(e) => onChange({ ...settings, baseCurrency: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden cursor-pointer"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={`${c.nameAr} (${c.code})`}>
                {c.nameAr} ({c.code} - {c.symbol})
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            تُعتمد هذه العملة في إعداد التقارير المحاسبية والميزانيات والقوائم الختامية تلقائياً
          </p>
        </div>

        {/* Timezone */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>المنطقة الزمنية (Timezone)</span>
          </label>
          <select
            value={settings.timezone}
            onChange={(e) => onChange({ ...settings, timezone: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden cursor-pointer"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            ضبط توقيت تسجيل العمليات والسندات وتوليد التقرير اليومي الختامي
          </p>
        </div>

        {/* Calendar Type */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            نوع التقويم المعتمد
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...settings, calendarType: 'miladi' })}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                settings.calendarType === 'miladi'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>ميلادي (Gregorian)</span>
              {settings.calendarType === 'miladi' && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...settings, calendarType: 'hijri' })}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                settings.calendarType === 'hijri'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>هجري (Hijri)</span>
              {settings.calendarType === 'hijri' && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Theme */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            مظهر واجهة التطبيق (Theme)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onChange({ ...settings, theme: 'light' });
                setTheme('light');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>نهاري (فاتح)</span>
              {theme === 'light' && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({ ...settings, theme: 'dark' });
                setTheme('dark');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>ليلي (داكن)</span>
              {theme === 'dark' && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Invoice Prefixes */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Hash className="w-4 h-4 text-emerald-500" />
            <span>بادئة فواتير المبيعات</span>
          </label>
          <input
            type="text"
            dir="ltr"
            value={settings.salesInvoicePrefix}
            onChange={(e) => onChange({ ...settings, salesInvoicePrefix: e.target.value })}
            placeholder="INV-"
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white text-left"
          />
          <p className="text-xs text-slate-400 dark:text-slate-500">مثال للترقيم التلقائي: INV-0001, INV-0002</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Hash className="w-4 h-4 text-purple-500" />
            <span>بادئة فواتير المشتريات</span>
          </label>
          <input
            type="text"
            dir="ltr"
            value={settings.purchaseInvoicePrefix}
            onChange={(e) => onChange({ ...settings, purchaseInvoicePrefix: e.target.value })}
            placeholder="PUR-"
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white text-left"
          />
          <p className="text-xs text-slate-400 dark:text-slate-500">مثال للترقيم التلقائي: PUR-0001, PUR-0002</p>
        </div>
      </div>

      {/* Available Currencies Preview Grid */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            معاينة العملات المتاحة في النظام (انقر للاختيار كعملة رئيسية)
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">{SUPPORTED_CURRENCIES.length} عملة مسجلة</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {SUPPORTED_CURRENCIES.map((c) => {
            const isSelected = settings.baseCurrency.includes(c.code);
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => onChange({ ...settings, baseCurrency: `${c.nameAr} (${c.code})` })}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="text-base font-black text-slate-900 dark:text-white mb-0.5">{c.symbol}</div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{c.code}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{c.nameAr}</div>
                {isSelected && (
                  <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-blue-600"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
