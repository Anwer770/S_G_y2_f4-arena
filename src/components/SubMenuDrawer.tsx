import React from 'react';
import { ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen } from 'lucide-react';
import type { ActiveModuleTab } from '../types';
import { SUB_MENUS } from '../constants/subMenus';
import { requestSubTab, useActiveSubTab } from '../utils/subMenuStore';

interface Props {
  activeTab: ActiveModuleTab;
  isSidebarCollapsed: boolean;
  open: boolean;
  onToggle: (open: boolean) => void;
}

/**
 * درج القوائم الفرعية الرأسية — ملاصق للقائمة الرئيسية (RTL: على يسارها).
 * مخفي تحت lg حتى لا يزاحم شاشات الجوال، ويُفتح/يُغلق من مقبض على حافة القائمة.
 */
export const SubMenuDrawer: React.FC<Props> = ({ activeTab, isSidebarCollapsed, open, onToggle }) => {
  const definition = SUB_MENUS[activeTab];
  const activeSub = useActiveSubTab(activeTab);
  if (!definition) return null;

  const sideClass = isSidebarCollapsed ? 'lg:right-20' : 'lg:right-72 xl:right-80';

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onToggle(true)}
        className={`hidden lg:flex fixed top-24 z-20 items-center justify-center w-6 h-16 rounded-l-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 cursor-pointer ${sideClass}`}
        title="فتح القائمة الفرعية"
        aria-label="فتح القائمة الفرعية"
        data-submenu-handle="closed"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    );
  }

  return (
    <aside
      data-submenu-drawer={activeTab}
      className={`hidden lg:flex fixed top-0 z-20 h-screen w-56 flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-l border-slate-200 dark:border-slate-800 ${sideClass}`}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="min-w-0">
          <div className="text-xs font-black text-slate-900 dark:text-white truncate">{definition.title}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500">{definition.items.length} أقسام فرعية</div>
        </div>
        <button
          type="button"
          onClick={() => onToggle(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          title="إغلاق القائمة الفرعية"
          aria-label="إغلاق القائمة الفرعية"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2 space-y-1" aria-label={`أقسام ${definition.title}`}>
        {definition.items.map((item) => {
          const isActive = activeSub === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => requestSubTab(activeTab, item.id)}
              data-submenu-item={item.id}
              data-active={isActive ? 'true' : 'false'}
              className={`nav-pill w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-right transition-colors cursor-pointer ${
                isActive
                  ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 font-medium'
              }`}
            >
              <ChevronRight className={`w-3 h-3 shrink-0 ${isActive ? 'text-teal-600' : 'text-slate-300 dark:text-slate-600'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
        <PanelRightOpen className="w-3 h-3" /> قائمة فرعية ثابتة
      </div>
    </aside>
  );
};

export default SubMenuDrawer;
