import React, { useState, useEffect } from 'react';
import { ActiveModuleTab } from '../types';
import { getCurrentUserProfile, SETTINGS_UPDATED_EVENT } from '../utils/settingsStorage';
import { useAuth } from '../context/AuthContext';
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
  Flame,
  ShieldCheck,
  Globe,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Layers,
  Kanban,
  Zap,
  HelpCircle,
  ExternalLink,
  LogOut,
  UserCheck,
  Lock,
} from 'lucide-react';

interface SidebarProps {
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
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

interface NavItem {
  id: ActiveModuleTab;
  index: number;
  label: string;
  icon: React.ElementType;
  count?: number;
  badgeColor?: string;
  color: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
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
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      index: 1,
      label: 'اللوحة التحكم',
      icon: LayoutDashboard,
      color: 'teal',
    },
    {
      id: 'financial',
      index: 2,
      label: 'ادارة السجل اليومي',
      icon: Wallet,
      count: financialCount,
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      color: 'teal',
    },
    {
      id: 'debts',
      index: 3,
      label: 'ادارة الديون والالتزامات',
      icon: Coins,
      count: debtsCount,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      color: 'amber',
    },
    {
      id: 'stock',
      index: 4,
      label: 'ادارة صرف وتوريد',
      icon: Package,
      count: stockCount,
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      color: 'sky',
    },
    {
      id: 'tasks',
      index: 5,
      label: 'ادارة الاعمال والالتزامات المستقلة',
      icon: Briefcase,
      count: tasksCount,
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      color: 'teal',
    },
    {
      id: 'workos',
      index: 6,
      label: 'إدارة العمل',
      icon: Zap,
      count: (taskflowCount || 0) + (workosCount || 0),
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      color: 'teal',
    },
    {
      id: 'customers',
      index: 7,
      label: 'ادارة العملاء وزيارات',
      icon: Users,
      count: customersCount,
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      color: 'teal',
    },
    {
      id: 'doctors',
      index: 8,
      label: 'ادارة الاطباء وزيارات',
      icon: Stethoscope,
      count: doctorsCount,
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      color: 'sky',
    },
    {
      id: 'routines',
      index: 9,
      label: 'ادارة الروتين والعادات',
      icon: Flame,
      count: routinesCount,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      color: 'amber',
    },
    {
      id: 'knowledge',
      index: 10,
      label: 'ادارة الملاحظات',
      icon: BookOpen,
      count: knowledgeCount,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      color: 'purple',
    },
    {
      id: 'custody',
      index: 11,
      label: 'ادارة العهد والاشكاليات',
      icon: ShieldCheck,
      count: custodyCount,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      color: 'rose',
    },
    {
      id: 'links',
      index: 12,
      label: 'مكتبة الروابط',
      icon: Globe,
      count: linksCount,
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      color: 'violet',
    },
    {
      id: 'settings',
      index: 13,
      label: 'الاعدادات',
      icon: Settings,
      color: 'slate',
    },
  ];

  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [userProfile, setUserProfile] = useState(() => getCurrentUserProfile());
  const { currentUser, canAccessModule, logout } = useAuth();

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setUserProfile(getCurrentUserProfile());
    };
    window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
    return () => window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timePart = now.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      const dayPart = now.toLocaleDateString('ar-YE', { weekday: 'long', day: 'numeric', month: 'long' });
      setCurrentTimeStr(`${timePart} • ${dayPart}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectTab = (tab: ActiveModuleTab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Main Right Sidebar (مطابق تماماً لألوان وستايل لقطة الشاشة) */}
      <aside
        id="app-right-sidebar"
        className={`fixed top-0 right-0 h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-l border-slate-200/90 dark:border-slate-800 z-50 flex flex-col transition-all duration-300 shadow-xl ${
          isCollapsed ? 'w-20' : 'w-72 sm:w-80'
        } ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
        dir="rtl"
      >
        {/* Sidebar Header & Brand Profile */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-white dark:bg-slate-900">
          <div
            onClick={() => handleSelectTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0B2B26] text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              م
            </div>

            {!isCollapsed && (
              <div className="min-w-0 transition-opacity">
                <h1 className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight flex items-center gap-1.5" title="المنظومة-الإدارية-المتكاملة">
                  <span>المنظومة-الإدارية-المتكاملة</span>
                </h1>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-medium">
                  نظام الإدارة والتشغيل الموحد
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700 shrink-0"
            title={isCollapsed ? 'توسيع القائمة الجانبية' : 'تصغير القائمة الجانبية'}
          >
            {isCollapsed ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 cursor-pointer border border-slate-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1.5 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'workos' && (activeTab === 'tasks' || activeTab === 'taskflow'));
            const isAllowed = canAccessModule(item.id);

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (!isAllowed) {
                    alert(`عذراً، قسم "${item.label}" مقيد بالصلاحيات ولا يملك حسابك الحالي ترخيصاً للوصول إليه.`);
                    return;
                  }
                  handleSelectTab(item.id);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer select-none group relative ${
                  !isAllowed
                    ? 'opacity-35 bg-slate-100 dark:bg-slate-800 text-slate-400'
                    : isActive
                    ? 'bg-[#E6F4F1] dark:bg-teal-950/60 text-[#0F3935] dark:text-teal-200 font-black shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
                } ${isCollapsed ? 'justify-center px-2' : 'justify-between'}`}
                title={!isAllowed ? `${item.label} (مغلق ومحمي بالصلاحيات)` : `${item.index}. ${item.label}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`shrink-0 transition-colors ${
                      !isAllowed
                        ? 'text-slate-400'
                        : isActive
                        ? 'text-[#0D9488] dark:text-teal-400'
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {!isCollapsed && (
                    <span className="truncate text-right">{item.label}</span>
                  )}
                </div>

                {/* Badge / Count or Lock */}
                {!isCollapsed && (
                  !isAllowed ? (
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" title="مغلق بالصلاحيات" />
                  ) : typeof item.count === 'number' && item.count > 0 ? (
                    <span
                      className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full shrink-0 bg-[#0F3935] text-white shadow-2xs"
                    >
                      {item.count}
                    </span>
                  ) : null
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer with Live Clock & Dynamic User Profile */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-2">
          {!isCollapsed ? (
            <>
              {/* Date & Time */}
              <div className="text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 px-1 text-center truncate">
                {currentTimeStr || 'جاري تحديث الوقت...'}
              </div>

              {/* User Profile Card */}
              <div
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-2xs select-none"
              >
                <div
                  onClick={() => handleSelectTab('settings')}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
                  title="تعديل اسم المستخدم والملف الشخصي من الإعدادات"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0A3832] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    {currentUser?.avatarInitial || userProfile.initial || 'م'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-teal-600 transition-colors">
                      {currentUser?.name || userProfile.name || 'محمد العولقي'}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                      {currentUser?.role === 'admin'
                        ? 'مدير النظام التنفيذي'
                        : currentUser?.role === 'accountant'
                        ? 'المحاسب المالي'
                        : currentUser?.role === 'sales'
                        ? 'المندوب الميداني'
                        : 'مستعرض'}
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0 cursor-pointer"
                  title="تسجيل الخروج من الجلسة الحالية"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1 select-none">
              <div
                onClick={() => handleSelectTab('settings')}
                className="w-8 h-8 rounded-full bg-[#0F3935] text-white font-bold text-xs flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs cursor-pointer"
                title={`${currentUser?.name || userProfile.name} (انقر للإعدادات)`}
              >
                {currentUser?.avatarInitial || userProfile.initial || 'م'}
              </div>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
