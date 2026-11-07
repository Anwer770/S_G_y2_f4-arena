import React from 'react';
import { ActiveModuleTab } from '../types';
import {
  LayoutDashboard,
  Wallet,
  Package,
  CheckSquare,
  Briefcase,
  Users,
  Stethoscope,
  Coins,
  BookOpen,
  Settings,
  Layers,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Kanban,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveModuleTab;
  setActiveTab: (tab: ActiveModuleTab) => void;
  financialCount: number;
  stockCount: number;
  tasksCount: number;
  customersCount: number;
  doctorsCount: number;
  debtsCount?: number;
  knowledgeCount?: number;
  routinesCount?: number;
  custodyCount?: number;
  linksCount?: number;
  taskflowCount?: number;
  workosCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  financialCount,
  stockCount,
  tasksCount,
  customersCount,
  doctorsCount,
  debtsCount = 0,
  knowledgeCount = 0,
  routinesCount = 0,
  custodyCount = 0,
  linksCount = 0,
  taskflowCount = 0,
  workosCount = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveModuleTab,
      index: 1,
      label: 'اللوحة التحكم',
      icon: LayoutDashboard,
      color: 'indigo',
    },
    {
      id: 'financial' as ActiveModuleTab,
      index: 2,
      label: 'ادارة السجل اليومي',
      icon: Wallet,
      count: financialCount,
      color: 'emerald',
    },
    {
      id: 'debts' as ActiveModuleTab,
      index: 3,
      label: 'ادارة الديون والالتزامات',
      icon: Coins,
      count: debtsCount,
      color: 'amber',
    },
    {
      id: 'stock' as ActiveModuleTab,
      index: 4,
      label: 'ادارة صرف وتوريد',
      icon: Package,
      count: stockCount,
      color: 'blue',
    },
    {
      id: 'tasks' as ActiveModuleTab,
      index: 5,
      label: 'ادارة الاعمال والالتزامات المستقلة',
      icon: Briefcase,
      count: tasksCount,
      color: 'emerald',
    },
    {
      id: 'workos' as ActiveModuleTab,
      index: 6,
      label: 'إدارة العمل',
      icon: Zap,
      count: (taskflowCount || 0) + (workosCount || 0),
      color: 'teal',
    },
    {
      id: 'customers' as ActiveModuleTab,
      index: 7,
      label: 'ادارة العملاء وزيارات',
      icon: Users,
      count: customersCount,
      color: 'teal',
    },
    {
      id: 'doctors' as ActiveModuleTab,
      index: 8,
      label: 'ادارة الاطباء وزيارات',
      icon: Stethoscope,
      count: doctorsCount,
      color: 'sky',
    },
    {
      id: 'routines' as ActiveModuleTab,
      index: 9,
      label: 'ادارة الروتين والعادات',
      icon: Flame,
      count: routinesCount,
      color: 'rose',
    },
    {
      id: 'knowledge' as ActiveModuleTab,
      index: 10,
      label: 'ادارة الملاحظات',
      icon: BookOpen,
      count: knowledgeCount,
      color: 'amber',
    },
    {
      id: 'custody' as ActiveModuleTab,
      index: 11,
      label: 'ادارة العهد والاشكاليات',
      icon: ShieldCheck,
      count: custodyCount,
      color: 'red',
    },
    {
      id: 'links' as ActiveModuleTab,
      index: 12,
      label: 'مكتبة الروابط',
      icon: Globe,
      count: linksCount,
      color: 'violet',
    },
    {
      id: 'settings' as ActiveModuleTab,
      index: 13,
      label: 'الاعدادات',
      icon: Settings,
      color: 'slate',
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Top Branding Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 via-indigo-900 to-amber-700 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  المنظومة الإدارية والمحاسبية والملاحظات وإدارة المعرفة المتكاملة
                </h1>
                <span className="bg-indigo-50 text-indigo-900 text-xs font-bold px-2 py-0.5 rounded-full border border-indigo-300">
                  الإصدار الشامل v2.7
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                السجل المالي • الدين والالتزامات • إدارة المعرفة والملاحظات • المخزون • المهام والأهداف • العملاء • الأطباء
              </p>
            </div>
          </div>
        </div>

        {/* Modular Tabs Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2 mt-3 overflow-x-auto pb-1 text-xs font-bold border-t border-slate-100 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-md font-mono font-bold ${
                      isActive ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

