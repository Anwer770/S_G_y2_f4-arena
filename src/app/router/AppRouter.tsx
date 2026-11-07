import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  ActiveModuleTab,
  AppSettings,
  Commitment,
  Customer,
  CustomerAuditLog,
  CustomerVisitRecord,
  DoctorAuditLog,
  DoctorRecord,
  DoctorVisitLog,
  FinancialTransaction,
  Item,
  Movement,
  ProductStock,
  Task,
  TaskAuditLog,
  UnifiedBackupState,
} from '../../types';

// Directly imported core modules for instant zero-latency screen transitions (no Suspense flash)
import { FinancialModule } from '../../components/financial/FinancialModule';
import { DebtsModule } from '../../components/debts/DebtsModule';
import { KnowledgeModule } from '../../components/knowledge/KnowledgeModule';
import { StockModule } from '../../components/stock/StockModule';
import { CustomersModule } from '../../components/customers/CustomersModule';
import { DoctorsModule } from '../../components/doctors/DoctorsModule';
import { RoutinesModule } from '../../components/routines/RoutinesModule';
import { CustodyIssuesModule } from '../../components/custody/CustodyIssuesModule';
import { LinksLibraryModule } from '../../components/links/LinksLibraryModule';
import { WorkOSModule } from '../../components/workos/WorkOSModule';
import { TasksModule } from '../../components/tasks/TasksModule';
import { UnifiedSettings } from '../../components/settings/UnifiedSettings';
import { UnifiedDashboard } from '../../components/dashboard/UnifiedDashboard';

import { loadDebts, loadDebtCommitments, loadCustodyIssues, loadLinksRecords, saveTaskAuditLogs } from '../../utils/storage';

export interface AppRouterProps {
  activeTab: ActiveModuleTab;
  setActiveTab: (tab: ActiveModuleTab) => void;
  // Stock props
  products: Item[];
  records: Movement[];
  categories: string[];
  statuses: string[];
  settings: AppSettings;
  seq: { IN: number; OUT: number };
  stockAuditLogs: any[];
  stocks: ProductStock[];
  onSaveMovement: (record: Movement) => void;
  onDeleteRecord: (record: Movement) => void;
  onBulkDelete: (subIds: string[]) => void;
  onCloneRecord: (record: Movement) => void;
  onAddProduct: (product: Item) => void;
  onEditProduct: (oldName: string, updatedProduct: Item) => void;
  onDeleteProduct: (product: Item) => void;
  onToggleProductActive: (product: Item) => void;
  // Financial props
  financialTransactions: FinancialTransaction[];
  movements: string[];
  restrictions: string[];
  movementTypes: string[];
  importanceList: string[];
  categoryAccounts: string[];
  restrictionAccounts: string[];
  accountNames: string[];
  onSaveFinancialTxn: (txn: FinancialTransaction) => void;
  onDeleteFinancialTxn: (id: string) => void;
  onImportFinancialTxns: (txns: FinancialTransaction[], mode: 'append' | 'replace') => void;
  onAddFinancialOption: (type: any, val: string) => void;
  // Tasks props
  tasks: Task[];
  commitments: Commitment[];
  taskCategories: string[];
  taskOperations: string[];
  taskAssignees: string[];
  taskAuditLogs: TaskAuditLog[];
  onSaveTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleCompleteTask: (id: string) => void;
  onSaveCommitment: (comm: Commitment) => void;
  onDeleteCommitment: (id: string) => void;
  onToggleCompleteCommitment: (id: string) => void;
  onClearCompletedTasks: () => void;
  setTaskAuditLogs: (logs: TaskAuditLog[]) => void;
  // Customers props
  customers: Customer[];
  customerVisits: CustomerVisitRecord[];
  customerAuditLogs: CustomerAuditLog[];
  onUpdateCustomers: (customers: Customer[]) => void;
  onUpdateVisits: (visits: CustomerVisitRecord[]) => void;
  // Doctors props
  doctors: DoctorRecord[];
  doctorVisits: DoctorVisitLog[];
  doctorAuditLogs: DoctorAuditLog[];
  onUpdateDoctors: (doctors: DoctorRecord[]) => void;
  onUpdateDoctorVisits: (visits: DoctorVisitLog[]) => void;
  logDoctorAudit: (action: string, entity: string, name: string, details?: string) => void;
  // Settings & Backup props
  onExportBackup: () => UnifiedBackupState;
  onImportBackup: (backup: UnifiedBackupState) => void;
  onResetAllData: () => void;
  routinesCount: number;
  debtsCount: number;
  debtCommitmentsCount: number;
}

export const AppRouter: React.FC<AppRouterProps> = (props) => {
  const { activeTab, setActiveTab } = props;
  const { canAccessModule, currentUser } = useAuth();

  if (!canAccessModule(activeTab)) {
    return (
      <div className="py-20 px-4 text-center max-w-md mx-auto space-y-4" dir="rtl">
        <div className="w-16 h-16 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-[#EF4444] dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            غير مصرح لحسابك بالوصول إلى هذا القسم
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            المستخدم الحالي ({currentUser?.name || 'مستخدم'} - {currentUser?.role}) ليس لديه الصلاحيات المقررة لعرض قسم "{activeTab}". تم تأمين السجلات المالية والإدارية الحساسة.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="px-4 py-2 bg-[#0D9488] hover:bg-[#059669] text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs"
        >
          العودة إلى لوحة التحكم
        </button>
      </div>
    );
  }

  // Canonical tab representation (taskflow shares the WorkOS module view)
  const canonicalTab = activeTab === 'taskflow' ? 'workos' : activeTab;
  const isWorkOSActive = activeTab === 'workos' || activeTab === 'taskflow';

  // Keep-Alive tab cache: mounts each tab once on first visit, keeps it alive in DOM for 0ms instant switching
  const [visitedTabs, setVisitedTabs] = React.useState<Set<string>>(() => {
    return new Set<string>(['dashboard', canonicalTab]);
  });

  // Track visited tabs
  React.useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(canonicalTab)) return prev;
      const next = new Set(prev);
      next.add(canonicalTab);
      return next;
    });
  }, [canonicalTab]);

  // Pre-warm remaining tabs on idle after initial render so every first navigation is also instant
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setVisitedTabs((prev) => {
        const allTabs = [
          'dashboard',
          'stock',
          'tasks',
          'workos',
          'links',
          'custody',
          'routines',
          'financial',
          'debts',
          'knowledge',
          'customers',
          'doctors',
          'settings',
        ];
        const next = new Set(prev);
        allTabs.forEach((t) => {
          if (canAccessModule(t as ActiveModuleTab)) {
            next.add(t);
          }
        });
        return next;
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [canAccessModule]);

  // Fresh memoized data for dashboard & auxiliary counters
  const debtsData = React.useMemo(() => loadDebts(), [activeTab, props.debtsCount]);
  const debtCommitmentsData = React.useMemo(
    () => loadDebtCommitments(),
    [activeTab, props.debtCommitmentsCount]
  );
  const custodyCountMemo = React.useMemo(() => loadCustodyIssues().length, [activeTab]);
  const linksCountMemo = React.useMemo(() => loadLinksRecords().length, [activeTab]);

  return (
    <div className="relative w-full">
      {/* 1. DASHBOARD */}
      {visitedTabs.has('dashboard') && (
        <div
          key="tab-pane-dashboard"
          id="tab-pane-dashboard"
          className={activeTab === 'dashboard' ? 'block' : 'hidden'}
          style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}
          aria-hidden={activeTab !== 'dashboard'}
        >
          <UnifiedDashboard
            items={props.products}
            movements={props.records}
            financialTransactions={props.financialTransactions}
            debts={debtsData}
            debtCommitments={debtCommitmentsData}
            tasks={props.tasks}
            commitments={props.commitments}
            customers={props.customers}
            visits={props.customerVisits}
            doctors={props.doctors}
            doctorVisits={props.doctorVisits}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSaveFinancialTxn={props.onSaveFinancialTxn}
            onSaveMovement={props.onSaveMovement}
            onSaveTask={props.onSaveTask}
            onToggleCompleteTask={props.onToggleCompleteTask}
            onSaveCommitment={props.onSaveCommitment}
            onUpdateCustomers={props.onUpdateCustomers}
            onUpdateVisits={props.onUpdateVisits}
            categories={props.categories}
            statuses={props.statuses}
            seq={props.seq}
            financialMovements={props.movements}
            restrictions={props.restrictions}
            movementTypes={props.movementTypes}
            importanceList={props.importanceList}
            categoryAccounts={props.categoryAccounts}
            restrictionAccounts={props.restrictionAccounts}
            accountNames={props.accountNames}
            onAddFinancialOption={props.onAddFinancialOption}
            taskCategories={props.taskCategories}
            taskOperations={props.taskOperations}
            taskAssignees={props.taskAssignees}
          />
        </div>
      )}

      {/* 2. WORK OS UNIFIED (Projects, Tasks, Kanban, Timeline, Matrix, Workload) */}
      {visitedTabs.has('workos') && (
        <div
          key="tab-pane-workos"
          id="tab-pane-workos"
          className={isWorkOSActive ? 'block' : 'hidden'}
          style={{ display: isWorkOSActive ? 'block' : 'none' }}
          aria-hidden={!isWorkOSActive}
        >
          <WorkOSModule
            initialView={activeTab === 'taskflow' ? 'taskflow' : 'overview'}
            onNavigateToERP={(tab) => setActiveTab(tab as any)}
            tasks={props.tasks}
            commitments={props.commitments}
            categories={props.taskCategories}
            operations={props.taskOperations}
            assignees={props.taskAssignees}
            auditLogs={props.taskAuditLogs}
            onSaveTask={props.onSaveTask}
            onDeleteTask={props.onDeleteTask}
            onToggleCompleteTask={props.onToggleCompleteTask}
            onSaveCommitment={props.onSaveCommitment}
            onDeleteCommitment={props.onDeleteCommitment}
            onToggleCompleteCommitment={props.onToggleCompleteCommitment}
            onClearCompletedTasks={props.onClearCompletedTasks}
            onClearAuditLogs={() => {
              saveTaskAuditLogs([]);
              props.setTaskAuditLogs([]);
            }}
          />
        </div>
      )}

      {/* 2b. STANDALONE: إدارة الأعمال والالتزامات المستقلة */}
      {visitedTabs.has('tasks') && (
        <div
          key="tab-pane-tasks"
          id="tab-pane-tasks"
          className={activeTab === 'tasks' ? 'block' : 'hidden'}
          style={{ display: activeTab === 'tasks' ? 'block' : 'none' }}
          aria-hidden={activeTab !== 'tasks'}
        >
          <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <TasksModule
              tasks={props.tasks}
              commitments={props.commitments}
              categories={props.taskCategories}
              operations={props.taskOperations}
              assignees={props.taskAssignees}
              auditLogs={props.taskAuditLogs}
              onSaveTask={props.onSaveTask}
              onDeleteTask={props.onDeleteTask}
              onToggleCompleteTask={props.onToggleCompleteTask}
              onSaveCommitment={props.onSaveCommitment}
              onDeleteCommitment={props.onDeleteCommitment}
              onToggleCompleteCommitment={props.onToggleCompleteCommitment}
              onClearCompletedTasks={props.onClearCompletedTasks}
              onClearAuditLogs={() => {
                saveTaskAuditLogs([]);
                props.setTaskAuditLogs([]);
              }}
            />
          </div>
        </div>
      )}

      {/* 3. SMART LINKS LIBRARY */}
      {visitedTabs.has('links') && (
        <div
          key="tab-pane-links"
          id="tab-pane-links"
          className={activeTab === 'links' ? 'block' : 'hidden'}
          style={{ display: activeTab === 'links' ? 'block' : 'none' }}
          aria-hidden={activeTab !== 'links'}
        >
          <LinksLibraryModule />
        </div>
      )}

      {/* 4. CUSTODY & PENDING ISSUES */}
      {visitedTabs.has('custody') && (
        <div
          key="tab-pane-custody"
          id="tab-pane-custody"
          className={activeTab === 'custody' ? 'block' : 'hidden'}
          style={{ display: activeTab === 'custody' ? 'block' : 'none' }}
          aria-hidden={activeTab !== 'custody'}
        >
          <CustodyIssuesModule />
        </div>
      )}

      {/* 5. ROUTINES & HABITS */}
      {visitedTabs.has('routines') && (
        <div
          key="tab-pane-routines"
          id="tab-pane-routines"
          className={activeTab === 'routines' ? 'block' : 'hidden'}
          style={{ display: activeTab === 'routines' ? 'block' : 'none' }}
          aria-hidden={activeTab !== 'routines'}
        >
          <RoutinesModule />
        </div>
      )}

      {/* 6. FINANCIAL LEDGER */}
      {visitedTabs.has('financial') && (
        <div
          key="tab-pane-financial"
          id="tab-pane-financial"
          className={activeTab === 'financial' ? 'block' : 'hidden'}
          style={{ display: activeTab === 'financial' ? 'block' : 'none' }}
          aria-hidden={activeTab !== 'financial'}
        >
          <FinancialModule
            transactions={props.financialTransactions}
            movements={props.movements}
            restrictions={props.restrictions}
            movementTypes={props.movementTypes}
            importanceList={props.importanceList}
            categoryAccounts={props.categoryAccounts}
            restrictionAccounts={props.restrictionAccounts}
            accountNames={props.accountNames}
            onSaveTransaction={props.onSaveFinancialTxn}
            onDeleteTransaction={props.onDeleteFinancialTxn}
            onImportTransactions={props.onImportFinancialTxns}
            onAddOption={props.onAddFinancialOption}
          />
        </div>
      )}

      {/* 7. DEBTS & COMMITMENTS */}
      {visitedTabs.has('debts') && (
        <div
          key="tab-pane-debts"
          id="tab-pane-debts"
          className={activeTab === 'debts' ? 'block' : 'hidden'}
          style={{ display: activeTab === 'debts' ? 'block' : 'none' }}
          aria-hidden={activeTab !== 'debts'}
        >
          <DebtsModule />
        </div>
      )}

      {/* 8. KNOWLEDGE & NOTES */}
      {visitedTabs.has('knowledge') && (
        <div
          key="tab-pane-knowledge"
          id="tab-pane-knowledge"
          className={activeTab === 'knowledge' ? 'block' : 'hidden'}
          style={{ display: activeTab === 'knowledge' ? 'block' : 'none' }}
          aria-hidden={activeTab !== 'knowledge'}
        >
          <KnowledgeModule
            customersList={props.customers.map((c) => ({ id: c.id, name: c.name }))}
            doctorsList={props.doctors.map((d) => ({ id: d.id, name: d.doctorName }))}
            tasksList={props.tasks.map((t) => ({ id: t.id, title: t.title }))}
          />
        </div>
      )}

      {/* 9. STOCK LEDGER */}
      {visitedTabs.has('stock') && (
        <div
          key="tab-pane-stock"
          id="tab-pane-stock"
          className={activeTab === 'stock' ? 'block' : 'hidden'}
          style={{ display: activeTab === 'stock' ? 'block' : 'none' }}
          aria-hidden={activeTab !== 'stock'}
        >
          <StockModule
            products={props.products}
            records={props.records}
            categories={props.categories}
            statuses={props.statuses}
            settings={props.settings}
            seq={props.seq}
            auditLogs={props.stockAuditLogs}
            stocks={props.stocks}
            onSaveMovement={props.onSaveMovement}
            onDeleteRecord={props.onDeleteRecord}
            onBulkDelete={props.onBulkDelete}
            onCloneRecord={props.onCloneRecord}
            onAddProduct={props.onAddProduct}
            onEditProduct={props.onEditProduct}
            onDeleteProduct={props.onDeleteProduct}
            onToggleProductActive={props.onToggleProductActive}
          />
        </div>
      )}

      {/* 10. CUSTOMERS & VISITS */}
      {visitedTabs.has('customers') && (
        <div
          key="tab-pane-customers"
          id="tab-pane-customers"
          className={activeTab === 'customers' ? 'block' : 'hidden'}
          style={{ display: activeTab === 'customers' ? 'block' : 'none' }}
          aria-hidden={activeTab !== 'customers'}
        >
          <CustomersModule
            customers={props.customers}
            visits={props.customerVisits}
            auditLogs={props.customerAuditLogs}
            onUpdateCustomers={props.onUpdateCustomers}
            onUpdateVisits={props.onUpdateVisits}
          />
        </div>
      )}

      {/* 11. DOCTORS & MEDICAL VISITS */}
      {visitedTabs.has('doctors') && (
        <div
          key="tab-pane-doctors"
          id="tab-pane-doctors"
          className={activeTab === 'doctors' ? 'block' : 'hidden'}
          style={{ display: activeTab === 'doctors' ? 'block' : 'none' }}
          aria-hidden={activeTab !== 'doctors'}
        >
          <DoctorsModule
            doctors={props.doctors}
            visits={props.doctorVisits}
            auditLogs={props.doctorAuditLogs}
            onUpdateDoctors={props.onUpdateDoctors}
            onUpdateVisits={props.onUpdateDoctorVisits}
            onAddAuditLog={props.logDoctorAudit}
          />
        </div>
      )}

      {/* 12. UNIFIED SETTINGS & BACKUP */}
      {visitedTabs.has('settings') && (
        <div
          key="tab-pane-settings"
          id="tab-pane-settings"
          className={activeTab === 'settings' ? 'block' : 'hidden'}
          style={{ display: activeTab === 'settings' ? 'block' : 'none' }}
          aria-hidden={activeTab !== 'settings'}
        >
          <UnifiedSettings
            onExportBackup={props.onExportBackup}
            onImportBackup={props.onImportBackup}
            onResetAllData={props.onResetAllData}
            stockCount={props.products.length}
            movementCount={props.records.length}
            financialCount={props.financialTransactions.length}
            debtsCount={props.debtsCount}
            debtCommitmentsCount={props.debtCommitmentsCount}
            tasksCount={props.tasks.length}
            commitmentsCount={props.commitments.length}
            customersCount={props.customers.length}
            visitsCount={props.customerVisits.length}
            doctorsCount={props.doctors.length}
            doctorVisitsCount={props.doctorVisits.length}
            routinesCount={props.routinesCount}
            custodyCount={custodyCountMemo}
            linksCount={linksCountMemo}
          />
        </div>
      )}
    </div>
  );
};
