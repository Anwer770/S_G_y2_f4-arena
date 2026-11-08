import React from 'react';
import {
  ChevronDown,
  Printer,
  FileSpreadsheet,
  Inbox,
  Sun,
  Clock,
  Flame,
  Target,
  Calendar,
  Eye,
  Briefcase,
  BookOpen,
  Zap,
  BarChart3,
  ArrowDownUp,
} from 'lucide-react';

/** عنصر في شريط تبويبات «إدارة العمل» */
export interface WorkOSNavTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  group: string;
  secondary?: string;
}

export interface WorkOSViewNavProps {
  primaryTabs: WorkOSNavTab[];
  currentTab: string;
  secondaryView: string | null;
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
  setSecondaryView: React.Dispatch<React.SetStateAction<string | null>>;
  isMoreMenuOpen: boolean;
  setIsMoreMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPrintReportOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsExchangeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * شريط التبويبات وقائمة «أدوات أخرى» وزرّي الطباعة والاستيراد/التصدير (R29).
 * مستخرج من WorkOSModule.tsx بلا أي تغيير في الشجرة أو الأصناف.
 */
export const WorkOSViewNav: React.FC<WorkOSViewNavProps> = ({
  primaryTabs,
  currentTab,
  secondaryView,
  setCurrentTab,
  setSecondaryView,
  isMoreMenuOpen,
  setIsMoreMenuOpen,
  setIsPrintReportOpen,
  setIsExchangeModalOpen,
}) => (
  <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs gap-2">
    {/* 7 تبويبات العمل/العروض/التحليل + مجموعة التخطيط والمتابعة (§25) */}
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
      {primaryTabs.map((tab, idx) => {
        const Icon = tab.icon;
        const tabSecondary = (tab as { secondary?: string }).secondary;
        const isActive = tabSecondary ? secondaryView === tabSecondary : currentTab === tab.id && secondaryView === null;
        const groupedSeparator = idx > 0 && primaryTabs[idx - 1].group !== tab.group;

        return (
          <React.Fragment key={tab.id}>
          {groupedSeparator && (
            <span
              aria-hidden="true"
              className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0"
            />
          )}
          <button
            onClick={() => {
              if (tabSecondary) {
                setSecondaryView(tabSecondary);
              } else {
                setCurrentTab(tab.id);
                setSecondaryView(null);
              }
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              isActive
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${
                  isActive ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
          </React.Fragment>
        );
      })}
    </div>

      {/* More Tools Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsMoreMenuOpen((prev) => !prev)}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            secondaryView
              ? 'bg-teal-50 text-teal-800 border-teal-300'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span>
            {secondaryView === 'inbox'
              ? 'أداة: صندوق الوارد'
              : secondaryView === 'visits'
              ? 'أداة: الزيارات (قراءة فقط)'
              : secondaryView === 'planner'
              ? 'أداة: التخطيط اليومي'
              : secondaryView === 'routine'
              ? 'أداة: الروتين اليومي'
              : secondaryView === 'habits'
              ? 'أداة: متتبع العادات'
              : secondaryView === 'goals'
              ? 'أداة: الخطط والأهداف'
              : secondaryView === 'notes'
              ? 'أداة: الملاحظات والاجتماعات'
              : secondaryView === 'works'
              ? 'أداة: الأعمال والالتزامات'
              : secondaryView === 'calendar'
              ? 'أداة: التقويم والمواعيد'
              : secondaryView === 'automation'
              ? 'أداة: قواعد الأتمتة'
              : secondaryView === 'reports'
              ? 'أداة: التقارير والتصدير'
              : secondaryView === 'classic_tasks'
              ? 'أداة: سجل المهام الكلاسيكي'
              : 'أدوات إضافية'}
          </span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {isMoreMenuOpen && (
          <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-40 text-xs font-bold animate-in fade-in">
            <button
              onClick={() => {
                setSecondaryView('inbox');
                setIsMoreMenuOpen(false);
              }}
              className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <Inbox className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>صندوق الوارد السريع</span>
            </button>

            <button
              onClick={() => {
                setSecondaryView('planner');
                setIsMoreMenuOpen(false);
              }}
              className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>التخطيط اليومي</span>
            </button>

            <button
              onClick={() => {
                setSecondaryView('routine');
                setIsMoreMenuOpen(false);
              }}
              className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>الروتين ومربعات التركيز</span>
            </button>

            <button
              onClick={() => {
                setSecondaryView('habits');
                setIsMoreMenuOpen(false);
              }}
              className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>متتبع العادات والانضباط</span>
            </button>

            <button
              onClick={() => {
                setSecondaryView('goals');
                setIsMoreMenuOpen(false);
              }}
              className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>الأهداف والنتائج الرئيسية (OKRs)</span>
            </button>

            <button
              onClick={() => {
                setSecondaryView('calendar');
                setIsMoreMenuOpen(false);
              }}
              className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>التقويم والمواعيد والالتزامات</span>
            </button>

            <button
              onClick={() => {
                setSecondaryView('visits');
                setIsMoreMenuOpen(false);
              }}
              className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>الزيارات (قراءة فقط)</span>
            </button>

            <button
              onClick={() => {
                setSecondaryView('works');
                setIsMoreMenuOpen(false);
              }}
              className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>الأعمال والالتزامات المستقلة</span>
            </button>

            <button
              onClick={() => {
                setSecondaryView('notes');
                setIsMoreMenuOpen(false);
              }}
              className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>الملاحظات ومحاضر الاجتماعات</span>
            </button>

            <button
              onClick={() => {
                setSecondaryView('automation');
                setIsMoreMenuOpen(false);
              }}
              className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>قواعد الأتمتة الذكية</span>
            </button>

            <button
              onClick={() => {
                setSecondaryView('reports');
                setIsMoreMenuOpen(false);
              }}
              className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>تقارير وتصدير Work OS</span>
            </button>

            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
          </div>
        )}
      </div>

      {/* Print Report Preview Button */}
      <button
        onClick={() => setIsPrintReportOpen(true)}
        className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs shrink-0"
        title="معاينة وطباعة تقرير إنجاز المشاريع والمهام رسمياً (أو اضغط P)"
      >
        <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
        <span>طباعة تقرير</span>
        <span className="hidden sm:inline-block px-1 py-0.2 text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">P</span>
      </button>

      {/* Data Exchange (Excel & Backup) Button */}
      <button
        onClick={() => setIsExchangeModalOpen(true)}
        className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-800 dark:hover:text-teal-200 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs shrink-0"
        title="استيراد وتصدير بيانات Work OS مع Excel وJSON"
      >
        <ArrowDownUp className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
        <span>استيراد وتصدير</span>
      </button>
  </div>
);
