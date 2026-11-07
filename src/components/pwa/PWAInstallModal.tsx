import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X, Sparkles, CheckCircle2, ShieldCheck, Laptop } from 'lucide-react';

export const PWAInstallModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [justInstalled, setJustInstalled] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setJustInstalled(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 w-full max-w-md text-right space-y-5 animate-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-teal-600/10 text-[#0D9488] dark:text-emerald-400 flex items-center justify-center border border-teal-600/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                تثبيت المنظومة كتطبيق أصلي (PWA)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                سطح المكتب • هواتف Android • أجهزة iPhone وiPad
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Feedback */}
        {justInstalled || isInstalled ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
              المنظومة مثبتة بنجاح على جهازك!
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              يمكنك الآن تشغيلها مباشرة من شاشة التطبيقات وسطح المكتب والعمل بكفاءة تامة بدون اتصال بالإنترنت.
            </p>
          </div>
        ) : (
          <>
            {/* Value Proposition Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#0D9488] dark:text-teal-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>عمل كامل دون اتصال</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  استمر في تسجيل السندات والمهام حتى مع انقطاع الشبكة
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#0D9488] dark:text-teal-300">
                  <Laptop className="w-4 h-4" />
                  <span>شاشة كاملة سريعة</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  واجهة نظيفة وخالية من أشرطة المتصفح مثل البرامج المعتمدة
                </p>
              </div>
            </div>

            {/* Platform Guides */}
            {isIOS ? (
              <div className="p-4 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/60 space-y-2.5 text-xs text-slate-700 dark:text-slate-200">
                <div className="flex items-center gap-2 font-bold text-teal-800 dark:text-teal-300">
                  <Smartphone className="w-4 h-4" />
                  <span>طريقة التثبيت على أجهزة iPhone / iPad:</span>
                </div>
                <div className="space-y-2 leading-relaxed text-[11px] pr-2">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-teal-200 dark:bg-teal-800 text-teal-900 dark:text-teal-100 flex items-center justify-center font-bold text-[10px]">1</span>
                    <span>انقر على زر <strong>المشاركة (Share)</strong> في متصفح Safari.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-teal-200 dark:bg-teal-800 text-teal-900 dark:text-teal-100 flex items-center justify-center font-bold text-[10px]">2</span>
                    <span>اختر <strong>"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</strong>.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-teal-200 dark:bg-teal-800 text-teal-900 dark:text-teal-100 flex items-center justify-center font-bold text-[10px]">3</span>
                    <span>انقر <strong>إضافة</strong> ليظهر التطبيق في شاشة جهازك.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3">
                <p className="leading-relaxed">
                  عند النقر على زر التثبيت، سيقوم المتصفح بإضافة المنظومة مباشرة إلى قائمة التطبيقات على حاسوبك المكتبي أو هاتفك الذكي بنقرة واحدة، لتتمكن من الوصول اللحظي الآمن.
                </p>
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full py-3 bg-[#0D9488] hover:bg-[#059669] text-white rounded-lg font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md hover:shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>تثبيت المنظومة بنقرة واحدة الآن</span>
                </button>
              </div>
            )}
          </>
        )}

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
