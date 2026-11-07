import React from 'react';
import { Info, ExternalLink, ShieldCheck, Youtube, Phone, Globe, Mail, Sparkles, Award } from 'lucide-react';

export const AboutAppTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Info */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">عن التطبيق والجهة المطورة</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            بيانات الإصدار، حقوق الملكية الفكرية، وقنوات الدعم الفني المباشر
          </p>
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 dark:bg-slate-900/10 backdrop-blur-md text-emerald-400 text-xs font-bold border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>نظام قيمة المحاسبي الموحد - الإصدار v1.4.2</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
            منظومة قيمة المتكاملة لإدارة الحسابات والمخزون والمبيعات
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            نظام محاسبي وإداري شامل صُمم بأحدث المعايير البرمجية لتلبية احتياجات الشركات والتوكيلات التجارية، إدارة المخازن المتعددة، ومتابعة سندات القبض والصرف وحركات العملاء والموردين بدقة فائقة.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300 font-mono">
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              نسخة المشروعات المعتمدة (Enterprise Edition)
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              تشفير البيانات محلياً وسحابياً
            </span>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Company & Support Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Developer Card */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
              INJAZ
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                شركة إنجاز للتقنية (Injaz For Tech)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">حلول البرمجيات والأنظمة السحابية المتقدمة</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 text-xs">
            <a
              href="https://injazfortech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <span>الموقع الرسمي: injazfortech.com</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            </a>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-500" />
                <span>البريد الإلكتروني: contact@injazfortech.com</span>
              </span>
            </div>
          </div>
        </div>

        {/* WhatsApp & Phone Support */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              أرقام الدعم الفني وخدمة العملاء (واتساب)
            </h4>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { phone: '+201069914878', label: 'خدمة العملاء والمبيعات (مصر / دولي)' },
              { phone: '+201554009503', label: 'الدعم الفني والاستشارات المحاسبية' },
              { phone: '+967771234567', label: 'المكتب الإقليمي - اليمن' },
            ].map((item) => (
              <a
                key={item.phone}
                href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <div>
                  <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-left" dir="ltr">
                    {item.phone}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{item.label}</div>
                </div>
                <span className="px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                  محادثة واتساب
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Tutorials / YouTube */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                شروحات لطريقة استخدام برنامج قيمة المحاسبي
              </h4>
            </div>

            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 rounded-xl text-xs font-bold transition-colors"
            >
              <span>مشاهدة الدروس المرئية</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            فيديوهات تفصيلية تشرح دورة القيود اليومية، كشوفات الحساب، ميزان المراجعة، إدارة المخازن وطرق الجرد، وإصدار الفواتير وطباعتها على الطابعات الحرارية وطابعات A4.
          </p>
        </div>
      </div>
    </div>
  );
};
