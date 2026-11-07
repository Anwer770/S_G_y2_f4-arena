import React from 'react';
import { PrinterSettings } from '../../../types/settings';
import { Printer, FileText, Palette, Layout, Check, Info } from 'lucide-react';

interface Props {
  settings: PrinterSettings;
  onChange: (updated: PrinterSettings) => void;
}

export const PrinterSettingsTab: React.FC<Props> = ({ settings, onChange }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
          <Printer className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">إعدادات الطابعة وتصميم الفواتير</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تخصيص مقاس ورق الطباعة (A4 / A5 / فواتير الكاشير الحرارية)، الهوامش، والألوان والترويسة
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Paper & Orientation */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">إعدادات مقاس واتجاه الورق</h3>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              حجم ونوع الورق المعتمد
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'A4', label: 'ورق A4 عادي (210×297 مم)' },
                { id: 'A5', label: 'ورق A5 نصف صفحة (148×210 مم)' },
                { id: 'thermal80', label: 'إيصال حراري 80 مم (POS)' },
                { id: 'thermal58', label: 'إيصال حراري 58 مم (POS)' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange({ ...settings, paperSize: p.id as any })}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    settings.paperSize === p.id
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs'
                  }`}
                >
                  <div className="text-xs">{p.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Orientation */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              اتجاه الطباعة
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...settings, orientation: 'portrait' })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  settings.orientation === 'portrait'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                عمودي (Portrait)
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...settings, orientation: 'landscape' })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  settings.orientation === 'landscape'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                أفقي (Landscape)
              </button>
            </div>
          </div>
        </div>

        {/* Margins */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">هوامش الصفحة (بالملمتر mm)</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">أعلى (Top)</label>
              <input
                type="number"
                min={0}
                value={settings.margins.top}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    margins: { ...settings.margins, top: Number(e.target.value) || 0 },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">أسفل (Bottom)</label>
              <input
                type="number"
                min={0}
                value={settings.margins.bottom}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    margins: { ...settings.margins, bottom: Number(e.target.value) || 0 },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">يمين (Right)</label>
              <input
                type="number"
                min={0}
                value={settings.margins.right}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    margins: { ...settings.margins, right: Number(e.target.value) || 0 },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">يسار (Left)</label>
              <input
                type="number"
                min={0}
                value={settings.margins.left}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    margins: { ...settings.margins, left: Number(e.target.value) || 0 },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white text-center"
              />
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500">
            للطابعات الحرارية يفضل ضبط الهوامش على 2 إلى 5 مم لأقصى استغلال لعرض الشريط.
          </p>
        </div>

        {/* Content Options */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">محتويات الفاتورة والمطبوعات</h3>

          <div className="space-y-3">
            {[
              {
                key: 'showCompanyLogo',
                title: 'إظهار شعار الشركة في الترويسة',
                desc: 'عرض اللوجو أعلى الفاتورة والسند',
              },
              {
                key: 'showCompanyInfo',
                title: 'إظهار بيانات وسجل وضريبة الشركة',
                desc: 'رقم السجل التجاري والرقم الضريبي والهاتف',
              },
              {
                key: 'showFooter',
                title: 'إظهار تذييل الفاتورة السفلي',
                desc: 'نص الشكر وشروط الإرجاع والاستبدال',
              },
              {
                key: 'showTableBorders',
                title: 'إظهار حدود الجداول بوضوح',
                desc: 'تأطير خطوط جدول الأصناف والأسعار',
              },
              {
                key: 'autoPrint',
                title: 'طباعة تلقائية فورية',
                desc: 'فتح نافذة أمر الطباعة تلقائياً عند حفظ الفاتورة',
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.title}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{item.desc}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(settings as any)[item.key]}
                    onChange={(e) => onChange({ ...settings, [item.key]: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>

          {/* Footer custom text */}
          {settings.showFooter && (
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نص تذييل الفاتورة المخصص:
              </label>
              <textarea
                rows={2}
                value={settings.footerText}
                onChange={(e) => onChange({ ...settings, footerText: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 resize-none outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Colors & Typography */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">التنسيق والمظهر والألوان</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                لون الترويسة والعناوين الرئيسية
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.headerColor}
                  onChange={(e) => onChange({ ...settings, headerColor: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={settings.headerColor}
                  onChange={(e) => onChange({ ...settings, headerColor: e.target.value })}
                  className="w-28 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-center uppercase"
                />
                <div className="flex gap-1.5">
                  {['#4A90D9', '#1E3A8A', '#0D9488', '#059669', '#475569'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onChange({ ...settings, headerColor: c })}
                      className="w-6 h-6 rounded-full border border-white shadow-xs cursor-pointer"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                حجم الخط في المستندات
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'small', label: 'صغير (9pt)' },
                  { id: 'medium', label: 'متوسط (11pt)' },
                  { id: 'large', label: 'كبير (13pt)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onChange({ ...settings, fontSize: s.id as any })}
                    className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      settings.fontSize === s.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info notice */}
      <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
          جميع النماذج المطبوعة متوافقة تماماً مع معايير الفاتورة الضريبية وقارئات الباركود QR Code المعتمدة في هيئات الزكاة والضريبة.
        </p>
      </div>
    </div>
  );
};
