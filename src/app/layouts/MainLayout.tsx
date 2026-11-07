import React, { useState } from 'react';
import { ActiveModuleTab } from '../../types';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';

export interface ModuleCounts {
  taskflowCount?: number;
  workosCount?: number;
  linksCount?: number;
  custodyCount?: number;
  financialCount?: number;
  debtsCount?: number;
  knowledgeCount?: number;
  routinesCount?: number;
  stockCount?: number;
  tasksCount?: number;
  customersCount?: number;
  doctorsCount?: number;
}

interface MainLayoutProps {
  activeTab: ActiveModuleTab;
  setActiveTab: (tab: ActiveModuleTab) => void;
  counts: ModuleCounts;
  alertsCount?: number;
  onOpenAlertsModal?: () => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  activeTab,
  setActiveTab,
  counts,
  alertsCount = 0,
  onOpenAlertsModal,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  return (
    <div
      className="min-h-screen bg-canvas-pattern text-slate-900 dark:text-slate-100 antialiased selection:bg-teal-600 selection:text-white transition-colors duration-200"
      dir="rtl"
    >
      {/* 1. Global Right-Hand Navigation Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        taskflowCount={counts.taskflowCount ?? 0}
        workosCount={counts.workosCount ?? 0}
        linksCount={counts.linksCount ?? 0}
        custodyCount={counts.custodyCount ?? 0}
        financialCount={counts.financialCount ?? 0}
        debtsCount={counts.debtsCount ?? 0}
        knowledgeCount={counts.knowledgeCount ?? 0}
        routinesCount={counts.routinesCount ?? 0}
        stockCount={counts.stockCount ?? 0}
        tasksCount={counts.tasksCount ?? 0}
        customersCount={counts.customersCount ?? 0}
        doctorsCount={counts.doctorsCount ?? 0}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* 2. Main Page Layout with Dynamic Right Margin for RTL Layout */}
      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:mr-20' : 'lg:mr-72 xl:mr-80'
        }`}
      >
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          alertsCount={alertsCount}
          onOpenAlertsModal={onOpenAlertsModal}
        />

        {/* Content Viewport */}
        <main className="flex-1 max-w-[96rem] w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          {children}
        </main>
      </div>
    </div>
  );
};
