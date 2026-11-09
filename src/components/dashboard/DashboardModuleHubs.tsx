/**
 * بوابات الوصول إلى وحدات المنظومة (2–12).
 *
 * قسم من لوحة التحكم — مستخرج من UnifiedDashboard.tsx (R30) بلا تغيير في البنية أو السلوك.
 */
import React from 'react';
import {
  BookOpen,
  Building2,
  ChevronLeft,
  Coins,
  Flame,
  Globe,
  Layers,
  Package,
  ShieldCheck,
  Stethoscope,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { loadCustodyIssues, loadLinksRecords, loadNotes } from '../../utils/storage';
import type { DashboardModel } from './useDashboardModel';

type Props = Pick<
  DashboardModel,
  'customers' | 'debtCommitments' | 'debts' | 'doctors' | 'financialTransactions' | 'items' | 'onNavigateTab' | 'tasks'
>;

export const DashboardModuleHubs: React.FC<Props> = ({
  customers,
  debtCommitments,
  debts,
  doctors,
  financialTransactions,
  items,
  onNavigateTab,
  tasks,
}) => (
  <>
    {/* 7. ALL 11 MODULE HUBS (بوابات الوصول لوحدات المنظومة كاملة) */}
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">
            بوابات المنظومة الإدارية والمحاسبية المستقلة
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">الوحدات من 2 إلى 12</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 animate-fade-in-up">
        {/* Module 2: Financial */}
        <div
          onClick={() => onNavigateTab('financial')}
          className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-teal-500 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/50">
                  2
                </span>
                <div className="p-2 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full font-mono">
                {financialTransactions.length} حركة
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-teal-600">
              ادارة السجل اليومي
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              سندات القبض والصرف، المقبوضات والمدفوعات والصناديق
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-teal-700 dark:text-teal-400">
            <span>فتح السجل المالي</span>
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Module 3: Debts */}
        <div
          onClick={() => onNavigateTab('debts')}
          className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-amber-200/60 dark:border-slate-800 shadow-xs hover:border-amber-500 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/50">
                  3
                </span>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full font-mono">
                {debts.length + debtCommitments.length} سجل
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-600">
              ادارة الديون والالتزامات
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              دفاتر الذمم، سندات الأقساط، والالتزامات المالية
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
            <span>فتح الديون</span>
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Module 4: Stock */}
        <div
          onClick={() => onNavigateTab('stock')}
          className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-500 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/50">
                  4
                </span>
                <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full font-mono">
                {items.length} صنف
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-sky-600">
              ادارة صرف وتوريد
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              حركة المخزون، أذونات الصرف والتوريد وتنبيهات النواقص
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-sky-700 dark:text-sky-400">
            <span>فتح المخزون</span>
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Module 5: Work OS */}
        <div
          onClick={() => onNavigateTab('workos')}
          className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-emerald-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-500 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50">
                  5
                </span>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-mono">
                {tasks.length} مهمة
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-600">
              إدارة العمل (Work OS)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              المشاريع، المهام، كانبان، الجدول الزمني، والتخطيط اليومي
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <span>فتح إدارة العمل</span>
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Module 6: Customers */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-teal-500 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/50">
                  6
                </span>
                <div className="p-2 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full font-mono">
                {customers.length} عميل
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-teal-600">
              ادارة العملاء وزيارات
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              شبكة العملاء، كشوفات المطابقة، وخطوط السير اليومية
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-teal-700 dark:text-teal-400">
            <span>فتح العملاء</span>
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Module 7: Doctors */}
        <div
          onClick={() => onNavigateTab('doctors')}
          className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-500 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/50">
                  7
                </span>
                <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <Stethoscope className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full font-mono">
                {doctors.length} طبيب
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-sky-600">
              ادارة الاطباء وزيارات
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              دليل الأطباء، العيادات، العينات الطبية والمتابعات الميدانية
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-sky-700 dark:text-sky-400">
            <span>فتح الأطباء</span>
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Module 8: Routines */}
        <div
          onClick={() => onNavigateTab('routines')}
          className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-500 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/50">
                  8
                </span>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full font-mono">
                نشط
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-600">
              ادارة الروتين والعادات
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              العادات اليومية، مربعات التركيز، وجداول الإنتاجية
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
            <span>فتح الروتين</span>
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Module 9: Knowledge / Notes */}
        <div
          onClick={() => onNavigateTab('knowledge')}
          className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-purple-500 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/50">
                  9
                </span>
                <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full font-mono">
                {loadNotes().length} ملاحظة
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-purple-600">
              ادارة الملاحظات والمعرفة
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              التوثيق الإداري، محاضر الاجتماعات، والأرشيف المقفل
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-400">
            <span>فتح الملاحظات</span>
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Module 10: Custody */}
        <div
          onClick={() => onNavigateTab('custody')}
          className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-rose-500 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/50">
                  10
                </span>
                <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full font-mono">
                {loadCustodyIssues().length} سجل
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-rose-600">
              ادارة العهد والاشكاليات
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              سجلات العهد العينية والنقدية والمعلقات الإدارية
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-400">
            <span>فتح العهد</span>
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Module 11: Links Library */}
        <div
          onClick={() => onNavigateTab('links')}
          className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-violet-500 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/50">
                  11
                </span>
                <div className="p-2 bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 rounded-xl group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full font-mono">
                {loadLinksRecords().length} رابط
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-violet-600">
              مكتبة الروابط والأدوات
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              روابط أدوات الذكاء الاصطناعي والمواقع الخدمية
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-violet-700 dark:text-violet-400">
            <span>فتح الروابط</span>
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Module 12: Settings */}
        <div
          onClick={() => onNavigateTab('settings')}
          className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-500 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200">
                  12
                </span>
                <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl group-hover:bg-slate-600 group-hover:text-white transition-colors">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-mono">
                النظام
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-slate-600">
              إعدادات النظام والنسخ
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              النسخ الاحتياطي الشامل، المستخدمون والصلاحيات وقواعد البيانات
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-400">
            <span>فتح الإعدادات</span>
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>

    {/* ========================================================================= */}
  </>
);
