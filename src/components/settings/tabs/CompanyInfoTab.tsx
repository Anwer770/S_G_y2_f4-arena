import React, { useRef } from 'react';
import { CompanySettings } from '../../../types/settings';
import { Building2, Upload, Trash2, Globe, Phone, Mail, FileText, MapPin } from 'lucide-react';

interface Props {
  settings: CompanySettings;
  onChange: (updated: CompanySettings) => void;
}

export const CompanyInfoTab: React.FC<Props> = ({ settings, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({
          ...settings,
          logoUrl: event.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    onChange({
      ...settings,
      logoUrl: '',
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Info */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">بيانات الشركة والمؤسسة</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تظهر هذه البيانات في ترويسات الفواتير المطبوعة وسندات القبض والصرف والتقارير المالية الرسمية
          </p>
        </div>
      </div>

      {/* Logo Section */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
          شعار الشركة (اللوجو)
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative w-28 h-28 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="شعار الشركة"
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="flex flex-col items-center text-slate-400 dark:text-slate-500 text-center p-2">
                <Building2 className="w-8 h-8 mb-1" />
                <span className="text-xs font-medium">لا يوجد شعار</span>
              </div>
            )}
          </div>

          <div className="space-y-2 text-center sm:text-right">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
            />
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>رفع شعار جديد</span>
              </button>

              {settings.logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 dark:text-rose-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف الشعار</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              المقاس الموصى به: مربع (200×200 بكسل على الأقل)، بصيغة PNG أو JPG بخلفية شفافة
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name AR */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            اسم المنظومة / المؤسسة (باللغة العربية) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={settings.nameAr}
              onChange={(e) => onChange({ ...settings, nameAr: e.target.value })}
              placeholder="مثال: المنظومة-الإدارية-المتكاملة"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Name EN */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            اسم المنظومة (باللغة الإنجليزية)
          </label>
          <input
            type="text"
            dir="ltr"
            value={settings.nameEn}
            onChange={(e) => onChange({ ...settings, nameEn: e.target.value })}
            placeholder="e.g. Integrated Administrative System"
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all text-left"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            رقم الهاتف والواتساب <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              dir="ltr"
              value={settings.phone}
              onChange={(e) => onChange({ ...settings, phone: e.target.value })}
              placeholder="+967 771 234 567"
              className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all text-left"
            />
            <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            البريد الإلكتروني <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              dir="ltr"
              value={settings.email}
              onChange={(e) => onChange({ ...settings, email: e.target.value })}
              placeholder="info@qeema-erp.com"
              className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all text-left"
            />
            <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Commercial Registration */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            رقم السجل التجاري (C.R)
          </label>
          <div className="relative">
            <input
              type="text"
              value={settings.crNumber}
              onChange={(e) => onChange({ ...settings, crNumber: e.target.value })}
              placeholder="مثال: CR-1049284"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all"
            />
            <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Tax Number */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            الرقم الضريبي (TIN / VAT)
          </label>
          <div className="relative">
            <input
              type="text"
              value={settings.taxNumber}
              onChange={(e) => onChange({ ...settings, taxNumber: e.target.value })}
              placeholder="مثال: 300192847500003"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Website */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            الموقع الإلكتروني
          </label>
          <div className="relative">
            <input
              type="url"
              dir="ltr"
              value={settings.website}
              onChange={(e) => onChange({ ...settings, website: e.target.value })}
              placeholder="https://qeema-erp.com"
              className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all text-left"
            />
            <Globe className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            العنوان والموقع الجغرافي
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={settings.address}
              onChange={(e) => onChange({ ...settings, address: e.target.value })}
              placeholder="العنوان التفصيلي (المدينة، الشارع، المبنى، الرمز البريدي)"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all resize-none"
            />
            <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
