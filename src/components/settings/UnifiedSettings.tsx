import React, { useState, useEffect } from 'react';
import { UnifiedBackupState } from '../../types';
import { CompleteSystemSettings } from '../../types/settings';
import {
  loadCompleteSystemSettings,
  saveCompleteSystemSettings,
} from '../../utils/settingsStorage';

import {
  Building2,
  Sliders,
  Package,
  Calendar,
  Bell,
  Printer,
  Users,
  ShieldCheck,
  Database,
  Info,
  Save,
  Check,
  Settings as SettingsIcon,
} from 'lucide-react';

import { CompanyInfoTab } from './tabs/CompanyInfoTab';
import { GeneralSettingsTab } from './tabs/GeneralSettingsTab';
import { InventorySettingsTab } from './tabs/InventorySettingsTab';
import { FiscalYearTab } from './tabs/FiscalYearTab';
import { NotificationsTab } from './tabs/NotificationsTab';
import { PrinterSettingsTab } from './tabs/PrinterSettingsTab';
import { UsersTab } from './tabs/UsersTab';
import { SecurityPermissionsTab } from './tabs/SecurityPermissionsTab';
import { DatabasesTab } from './tabs/DatabasesTab';
import { AboutAppTab } from './tabs/AboutAppTab';

interface Props {
  onExportBackup: () => UnifiedBackupState | void;
  onImportBackup: (backup: UnifiedBackupState) => void;
  onResetAllData: () => void;
  stockCount: number;
  movementCount: number;
  financialCount: number;
  tasksCount: number;
  commitmentsCount: number;
  customersCount?: number;
  visitsCount?: number;
  doctorsCount?: number;
  doctorVisitsCount?: number;
  debtsCount?: number;
  debtCommitmentsCount?: number;
  routinesCount?: number;
  custodyCount?: number;
  linksCount?: number;
}

type TabKey =
  | 'company'
  | 'general'
  | 'inventory'
  | 'fiscalYear'
  | 'notifications'
  | 'printer'
  | 'users'
  | 'security'
  | 'databases'
  | 'about';

interface NavItem {
  id: TabKey;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'company', label: 'بيانات الشركة', icon: Building2 },
  { id: 'general', label: 'إعدادات عامة', icon: Sliders },
  { id: 'inventory', label: 'المخزون', icon: Package },
  { id: 'fiscalYear', label: 'السنة المالية', icon: Calendar },
  { id: 'notifications', label: 'الإشعارات', icon: Bell },
  { id: 'printer', label: 'إعدادات الطابعة', icon: Printer },
  { id: 'users', label: 'المستخدمين', icon: Users },
  { id: 'security', label: 'الأمان والصلاحيات', icon: ShieldCheck },
  { id: 'databases', label: 'قواعد البيانات', icon: Database },
  { id: 'about', label: 'عن التطبيق', icon: Info },
];

export const UnifiedSettings: React.FC<Props> = ({
  onExportBackup,
  onImportBackup,
  onResetAllData,
  stockCount,
  movementCount,
  financialCount,
  tasksCount,
  commitmentsCount,
  customersCount = 0,
  visitsCount = 0,
  doctorsCount = 0,
  debtsCount = 0,
  custodyCount = 0,
  linksCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('company');
  const [settings, setSettings] = useState<CompleteSystemSettings>(() => loadCompleteSystemSettings());
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  useEffect(() => {
    // Load persisted settings
    const loaded = loadCompleteSystemSettings();
    setSettings(loaded);
  }, []);

  const handleSaveAll = () => {
    saveCompleteSystemSettings(settings);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" dir="rtl">
      {/* Top Header Bar matching user's design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-[#0D9488] text-white shadow-xs">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              الإعدادات
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تخصيص النظام وإدارة الإعدادات والبيانات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {isSavedRecently && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 animate-fadeIn">
              <Check className="w-4 h-4" />
              تم حفظ التغييرات بنجاح
            </span>
          )}

          <button
            type="button"
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0D9488] hover:bg-[#059669] active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>حفظ التغييرات</span>
          </button>
        </div>
      </div>

      {/* Main Settings Layout with Sidebar & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Right Settings Sub-Navigation Sidebar */}
        <aside className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer text-right w-full ${
                    isActive
                      ? 'bg-[#0D9488] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Pane */}
        <main className="lg:col-span-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-xs">
          {activeTab === 'company' && (
            <CompanyInfoTab
              settings={settings.company}
              onChange={(updated) => setSettings({ ...settings, company: updated })}
            />
          )}

          {activeTab === 'general' && (
            <GeneralSettingsTab
              settings={settings.general}
              onChange={(updated) => {
                const adminName = updated.currentUserName || 'مدير النظام';
                const updatedUsers = settings.users.map((u, idx) =>
                  idx === 0 || u.role === 'admin'
                    ? { ...u, name: adminName, avatarInitial: adminName.charAt(0) || 'م' }
                    : u
                );
                setSettings({ ...settings, general: updated, users: updatedUsers });
              }}
            />
          )}

          {activeTab === 'inventory' && (
            <InventorySettingsTab
              settings={settings.inventory}
              onChange={(updated) => setSettings({ ...settings, inventory: updated })}
            />
          )}

          {activeTab === 'fiscalYear' && (
            <FiscalYearTab
              settings={settings.fiscalYear}
              onChange={(updated) => setSettings({ ...settings, fiscalYear: updated })}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab
              settings={settings.notifications}
              onChange={(updated) => setSettings({ ...settings, notifications: updated })}
            />
          )}

          {activeTab === 'printer' && (
            <PrinterSettingsTab
              settings={settings.printer}
              onChange={(updated) => setSettings({ ...settings, printer: updated })}
            />
          )}

          {activeTab === 'users' && (
            <UsersTab
              users={settings.users}
              onChange={(updated) => {
                const adminUser = updated.find((u) => u.role === 'admin' || u.id === 'usr-1');
                setSettings({
                  ...settings,
                  users: updated,
                  general: {
                    ...settings.general,
                    currentUserName: adminUser?.name || settings.general.currentUserName || 'مدير النظام',
                  },
                });
              }}
            />
          )}

          {activeTab === 'security' && (
            <SecurityPermissionsTab
              rolePermissions={settings.rolePermissions}
              onChange={(updated) => setSettings({ ...settings, rolePermissions: updated })}
            />
          )}

          {activeTab === 'databases' && (
            <DatabasesTab
              databaseConfig={settings.database}
              onChangeConfig={(updated) => setSettings({ ...settings, database: updated })}
              onExportBackup={onExportBackup}
              onImportBackup={onImportBackup}
              onResetAllData={onResetAllData}
              counts={{
                stockCount,
                movementCount,
                financialCount,
                tasksCount,
                commitmentsCount,
                customersCount,
                visitsCount,
                doctorsCount,
                debtsCount,
                custodyCount,
                linksCount,
              }}
            />
          )}

          {activeTab === 'about' && <AboutAppTab />}
        </main>
      </div>
    </div>
  );
};
