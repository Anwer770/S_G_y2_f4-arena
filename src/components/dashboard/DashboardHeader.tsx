/**
 * رأس لوحة التحكم: الهوية والساعة ومسار اليوم.
 *
 * قسم من لوحة التحكم — مستخرج من UnifiedDashboard.tsx (R30) بلا تغيير في البنية أو السلوك.
 */
import React from 'react';
import { ChevronLeft, Zap } from 'lucide-react';
import type { DashboardModel } from './useDashboardModel';
import { LiveClock } from './LiveClock';

type Props = Pick<DashboardModel, 'onNavigateTab' | 'todayArabic' | 'userProfile'>;

export const DashboardHeader: React.FC<Props> = ({ onNavigateTab, todayArabic, userProfile }) => (
  <>
    {/* 1. TOP HEADER & COMMAND CENTER IDENTITY */}
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-1">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">لوحة التحكم</h1>
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800">
            مركز القيادة والعمليات
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium flex flex-wrap items-center gap-1.5">
          <span>مرحباً، {userProfile.name} 👋</span>
          <span>—</span>
          <LiveClock />
          <span>—</span>
          <span className="text-teal-700 dark:text-teal-300 font-bold">مسار اليوم: {todayArabic}</span>
        </p>
      </div>

      {/* Quick Nav to Work OS */}
      <button
        onClick={() => onNavigateTab('workos')}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-teal-900/80 hover:bg-slate-800 dark:hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
      >
        <Zap className="w-4 h-4 text-emerald-400" />
        <span>فتح إدارة العمل (Work OS)</span>
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
    </div>
  </>
);
