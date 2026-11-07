import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../components/auth/LoginScreen';
import { MainLayout } from './layouts/MainLayout';
import { AppRouter } from './router/AppRouter';
import { DueAlertsToast } from '../components/notifications/DueAlertsToast';
import { DueAlertsModal } from '../components/notifications/DueAlertsModal';
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
} from '../types';

// Services & Repositories
import { inventoryService } from '../services/inventory/InventoryService';
import { financialService } from '../services/financial/FinancialService';
import { customerService } from '../services/crm/CustomerService';
import { doctorService } from '../services/crm/DoctorService';
import { taskService } from '../services/work/TaskService';
import { debtService } from '../services/debts/DebtService';
import { custodyService } from '../services/custody/CustodyService';
import { knowledgeService } from '../services/knowledge/KnowledgeService';
import { linksService } from '../services/links/LinksService';
import { routineService } from '../services/routines/RoutineService';
import { BackupService } from '../services/backup/BackupService';

// Sync & Helpers
import { useMultiTabSync, broadcastDataChange } from '../utils/multiTabSync';
import { recordOutboxMutation } from '../utils/syncOutbox';
import { loadTasks } from '../utils/workosStorage';
import { syncMovementToFinancialJournal, removeMovementFromFinancialJournal } from '../utils/autoJournaling';
import { getDueAlerts, DueAlertsSummary } from '../utils/dueAlerts';
import {
  loadAuditLogs,
  loadCategories,
  loadCustomerAuditLogs,
  loadDoctorAuditLogs,
  loadFinancialAccountNames,
  loadFinancialCategoryAccounts,
  loadFinancialImportanceList,
  loadFinancialMovementTypes,
  loadFinancialMovements,
  loadFinancialRestrictionAccounts,
  loadFinancialRestrictions,
  loadRoutines,
  loadSeq,
  loadSettings,
  loadStatuses,
  loadTaskAssignees,
  loadTaskAuditLogs,
  loadTaskCategories,
  loadTaskOperations,
  saveAuditLogs,
  saveCustomerAuditLogs,
  saveDoctorAuditLogs,
  saveFinancialAccountNames,
  saveFinancialCategoryAccounts,
  saveFinancialImportanceList,
  saveFinancialMovementTypes,
  saveFinancialMovements,
  saveFinancialRestrictionAccounts,
  saveFinancialRestrictions,
  saveFinancialTransactions,
  saveProducts,
  saveRecords,
  saveSeq,
  saveTaskAssignees,
  saveTaskAuditLogs,
  saveTaskCategories,
  saveTaskOperations,
} from '../utils/storage';

export const MainApp: React.FC = () => {
  const { isAuthenticated, canAccessModule, getAllowedTabs } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveModuleTab>('dashboard');

  // Role restriction redirect
  useEffect(() => {
    if (isAuthenticated && !canAccessModule(activeTab)) {
      const allowed = getAllowedTabs();
      if (allowed && allowed.length > 0) {
        setActiveTab(allowed[0]);
      }
    }
  }, [isAuthenticated, activeTab, canAccessModule, getAllowedTabs]);

  // Stock Ledger State
  const [products, setProducts] = useState<Item[]>(() => inventoryService.getAllProducts());
  const [records, setRecords] = useState<Movement[]>(() => inventoryService.getAllMovements());
  const [categories, setCategories] = useState<string[]>(() => loadCategories());
  const [statuses, setStatuses] = useState<string[]>(() => loadStatuses());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [seq, setSeq] = useState<{ IN: number; OUT: number }>(() => loadSeq());
  const [stockAuditLogs, setStockAuditLogs] = useState<any[]>(() => loadAuditLogs());

  // Financial Ledger State
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>(() =>
    financialService.getAll()
  );
  const [movements, setMovements] = useState<string[]>(() => loadFinancialMovements());
  const [restrictions, setRestrictions] = useState<string[]>(() => loadFinancialRestrictions());
  const [movementTypes, setMovementTypes] = useState<string[]>(() => loadFinancialMovementTypes());
  const [importanceList, setImportanceList] = useState<string[]>(() => loadFinancialImportanceList());
  const [categoryAccounts, setCategoryAccounts] = useState<string[]>(() => loadFinancialCategoryAccounts());
  const [restrictionAccounts, setRestrictionAccounts] = useState<string[]>(() => loadFinancialRestrictionAccounts());
  const [accountNames, setAccountNames] = useState<string[]>(() => loadFinancialAccountNames());

  // Tasks & Commitments State
  const [tasks, setTasks] = useState<Task[]>(() => taskService.getAllTasks());
  const [commitments, setCommitments] = useState<Commitment[]>(() => taskService.getAllCommitments());
  const [taskCategories, setTaskCategories] = useState<string[]>(() => loadTaskCategories());
  const [taskOperations, setTaskOperations] = useState<string[]>(() => loadTaskOperations());
  const [taskAssignees, setTaskAssignees] = useState<string[]>(() => loadTaskAssignees());
  const [taskAuditLogs, setTaskAuditLogs] = useState<TaskAuditLog[]>(() => loadTaskAuditLogs());

  // Customers & Doctors State
  const [customers, setCustomers] = useState<Customer[]>(() => customerService.getAll());
  const [customerVisits, setCustomerVisits] = useState<CustomerVisitRecord[]>(() => customerService.getVisits());
  const [customerAuditLogs, setCustomerAuditLogs] = useState<CustomerAuditLog[]>(() => loadCustomerAuditLogs());
  const [doctors, setDoctors] = useState<DoctorRecord[]>(() => doctorService.getAll());
  const [doctorVisits, setDoctorVisits] = useState<DoctorVisitLog[]>(() => doctorService.getVisits());
  const [doctorAuditLogs, setDoctorAuditLogs] = useState<DoctorAuditLog[]>(() => loadDoctorAuditLogs());

  // Additional Module Counts
  const [routinesCount, setRoutinesCount] = useState<number>(() => routineService.getAll().length);
  const [debtsCount, setDebtsCount] = useState<number>(() => debtService.getAll().length);
  const [debtCommitmentsCount, setDebtCommitmentsCount] = useState<number>(() => debtService.getCommitments().length);
  const [custodyCount, setCustodyCount] = useState<number>(() => custodyService.getAll().length);
  const [knowledgeCount, setKnowledgeCount] = useState<number>(() => knowledgeService.getAll().length);
  const [linksCount, setLinksCount] = useState<number>(() => linksService.getAll().length);

  // Due Alerts Modal State
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);
  const [isToastDismissed, setIsToastDismissed] = useState<boolean>(false);

  // Multi-Tab Synchronization
  useMultiTabSync(
    ['FINANCIAL_UPDATED', 'STOCK_UPDATED', 'CUSTOMER_UPDATED', 'DOCTOR_UPDATED', 'TASK_UPDATED'],
    (type) => {
      if (type === 'FINANCIAL_UPDATED') {
        setFinancialTransactions(financialService.getAll());
      } else if (type === 'STOCK_UPDATED') {
        setRecords(inventoryService.getAllMovements());
        setProducts(inventoryService.getAllProducts());
      } else if (type === 'CUSTOMER_UPDATED') {
        setCustomers(customerService.getAll());
        setCustomerVisits(customerService.getVisits());
      } else if (type === 'DOCTOR_UPDATED') {
        setDoctors(doctorService.getAll());
        setDoctorVisits(doctorService.getVisits());
      } else if (type === 'TASK_UPDATED') {
        setTasks(taskService.getAllTasks());
        setCommitments(taskService.getAllCommitments());
      }
    }
  );

  // Intelligent Due Alerts (Filtered & Suppressed)
  /**
   * عدد المهام المفتوحة في مخزن إدارة العمل (workos_v1_tasks).
   * حتى تاريخه يوجد مخزنان للمهام (انظر WORK_OS_DATA_UNIFICATION_SPEC.md)، فالعدّاد هنا
   * يقرأ مخزن إدارة العمل مرة واحدة، بينما tasksCount يقرأ المخزن الموثوق تشغيلياً —
   * فيُجمعان مرة واحدة لكل مخزن بلا تضاعف.
   * يُعاد الحساب عند تبديل الوحدة (أي عند الكتابة داخل إدارة العمل ثم الخروج منها).
   */
  const workosOpenCount = useMemo(() => {
    try {
      return loadTasks().filter((t) => !['completed', 'cancelled', 'archived'].includes(t.status)).length;
    } catch {
      return 0;
    }
  }, [activeTab]);

  const dueAlertsSummary: DueAlertsSummary = useMemo(() => {
    return getDueAlerts(tasks, commitments, 3);
  }, [tasks, commitments]);

  // Derived Stocks
  const stocks: ProductStock[] = useMemo(() => {
    return inventoryService.calculateCurrentStock(products, records, settings);
  }, [products, records, settings]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Stock Movement Handlers
  const handleSaveMovement = (record: Movement) => {
    const saved = inventoryService.saveMovement(record, seq, (newSeq) => {
      setSeq(newSeq);
      saveSeq(newSeq);
    });
    const updatedRecords = inventoryService.getAllMovements();
    setRecords(updatedRecords);

    // Auto-Journaling
    const { updatedTxns, createdEntry } = syncMovementToFinancialJournal(
      saved,
      financialTransactions,
      products
    );
    setFinancialTransactions(updatedTxns);
    saveFinancialTransactions(updatedTxns);
    recordOutboxMutation('financial', 'UPDATE', createdEntry.id, createdEntry);
    broadcastDataChange('FINANCIAL_UPDATED');
    broadcastDataChange('STOCK_UPDATED');
    setStockAuditLogs(loadAuditLogs());
  };

  const handleDeleteRecord = (record: Movement) => {
    const updated = records.filter((r) => r.subId !== record.subId);
    setRecords(updated);
    saveRecords(updated);
    recordOutboxMutation('stock', 'DELETE', record.subId);

    const updatedTxns = removeMovementFromFinancialJournal(record.subId, financialTransactions);
    if (updatedTxns.length !== financialTransactions.length) {
      setFinancialTransactions(updatedTxns);
      saveFinancialTransactions(updatedTxns);
      broadcastDataChange('FINANCIAL_UPDATED');
    }
    broadcastDataChange('STOCK_UPDATED');
    setStockAuditLogs(loadAuditLogs());
  };

  const handleBulkDelete = (subIds: string[]) => {
    const set = new Set(subIds);
    const updated = records.filter((r) => !set.has(r.subId));
    setRecords(updated);
    saveRecords(updated);
    subIds.forEach((id) => recordOutboxMutation('stock', 'DELETE', id));

    let updatedTxns = financialTransactions;
    subIds.forEach((id) => {
      updatedTxns = removeMovementFromFinancialJournal(id, updatedTxns);
    });
    if (updatedTxns.length !== financialTransactions.length) {
      setFinancialTransactions(updatedTxns);
      saveFinancialTransactions(updatedTxns);
      broadcastDataChange('FINANCIAL_UPDATED');
    }
    broadcastDataChange('STOCK_UPDATED');
    setStockAuditLogs(loadAuditLogs());
  };

  const handleCloneRecord = (record: Movement) => {
    const cloned = inventoryService.cloneMovement(record, records, seq);
    handleSaveMovement(cloned);
  };

  const handleAddProduct = (product: Item) => {
    const updated = [product, ...products];
    setProducts(updated);
    saveProducts(updated);
    broadcastDataChange('STOCK_UPDATED');
  };

  const handleEditProduct = (oldName: string, updatedProduct: Item) => {
    const { updatedProducts, updatedRecords } = inventoryService.renameProduct(oldName, updatedProduct);
    setProducts(updatedProducts);
    setRecords(updatedRecords);
    broadcastDataChange('STOCK_UPDATED');
  };

  const handleDeleteProduct = (product: Item) => {
    const updated = products.filter((p) => p.name !== product.name);
    setProducts(updated);
    saveProducts(updated);
    broadcastDataChange('STOCK_UPDATED');
  };

  const handleToggleProductActive = (product: Item) => {
    const updated = products.map((p) =>
      p.name === product.name ? { ...p, isActive: !p.isActive } : p
    );
    setProducts(updated);
    saveProducts(updated);
    broadcastDataChange('STOCK_UPDATED');
  };

  // Financial Handlers
  const handleSaveFinancialTxn = (txn: FinancialTransaction) => {
    const saved = financialService.saveTransaction(txn);
    const updated = financialService.getAll();
    setFinancialTransactions(updated);
    broadcastDataChange('FINANCIAL_UPDATED');
  };

  const handleDeleteFinancialTxn = (id: string) => {
    financialService.deleteTransaction(id);
    const updated = financialService.getAll();
    setFinancialTransactions(updated);
    broadcastDataChange('FINANCIAL_UPDATED');
  };

  const handleImportFinancialTxns = (
    imported: FinancialTransaction[],
    mode: 'append' | 'replace'
  ) => {
    let updated: FinancialTransaction[];
    if (mode === 'replace') {
      updated = imported;
    } else {
      const existingIds = new Set(financialTransactions.map((t) => t.id));
      const filtered = imported.filter((t) => !existingIds.has(t.id));
      updated = [...financialTransactions, ...filtered];
    }
    setFinancialTransactions(updated);
    saveFinancialTransactions(updated);
    imported.forEach((t) => recordOutboxMutation('financial', 'INSERT', t.id, t));
    broadcastDataChange('FINANCIAL_UPDATED');
  };

  const handleAddFinancialOption = (
    type: 'category' | 'account' | 'restriction' | 'movementType' | 'restrictionAccount' | 'accountName',
    value: string
  ) => {
    if (type === 'restrictionAccount') {
      const updated = [...restrictionAccounts, value];
      setRestrictionAccounts(updated);
      saveFinancialRestrictionAccounts(updated);
    } else if (type === 'accountName') {
      const updated = [...accountNames, value];
      setAccountNames(updated);
      saveFinancialAccountNames(updated);
    } else if (type === 'restriction') {
      const updated = [...restrictions, value];
      setRestrictions(updated);
      saveFinancialRestrictions(updated);
    } else if (type === 'movementType') {
      const updated = [...movementTypes, value];
      setMovementTypes(updated);
      saveFinancialMovementTypes(updated);
    }
  };

  // Task & Commitment Handlers
  const handleSaveTask = (task: Task) => {
    taskService.saveTask(task);
    setTasks(taskService.getAllTasks());
    broadcastDataChange('TASK_UPDATED');
  };

  const handleDeleteTask = (id: string) => {
    taskService.deleteTask(id);
    setTasks(taskService.getAllTasks());
    broadcastDataChange('TASK_UPDATED');
  };

  const handleToggleCompleteTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const isCompleted = task.status === 'تم الانجاز';
    const updated = {
      ...task,
      status: isCompleted ? 'قيد الانتظار' : 'تم الانجاز',
      completedAt: isCompleted ? undefined : new Date().toISOString(),
    };
    taskService.saveTask(updated);
    setTasks(taskService.getAllTasks());
    broadcastDataChange('TASK_UPDATED');
  };

  const handleSaveCommitment = (comm: Commitment) => {
    taskService.saveCommitment(comm);
    setCommitments(taskService.getAllCommitments());
    broadcastDataChange('TASK_UPDATED');
  };

  const handleDeleteCommitment = (id: string) => {
    taskService.deleteCommitment(id);
    setCommitments(taskService.getAllCommitments());
    broadcastDataChange('TASK_UPDATED');
  };

  const handleToggleCompleteCommitment = (id: string) => {
    const comm = commitments.find((c) => c.id === id);
    if (!comm) return;
    const isCompleted = comm.status === 'تم الانجاز';
    const updated = {
      ...comm,
      status: isCompleted ? 'قيد التنفيذ' : 'تم الانجاز',
    };
    taskService.saveCommitment(updated);
    setCommitments(taskService.getAllCommitments());
    broadcastDataChange('TASK_UPDATED');
  };

  const handleClearCompletedTasks = () => {
    const remaining = tasks.filter((t) => t.status !== 'تم الانجاز');
    remaining.forEach((t) => taskService.saveTask(t));
    setTasks(remaining);
    broadcastDataChange('TASK_UPDATED');
  };

  // Customer Handlers
  const handleUpdateCustomers = (newCustomers: Customer[]) => {
    newCustomers.forEach((c) => customerService.saveCustomer(c));
    setCustomers(customerService.getAll());
    setCustomerAuditLogs(loadCustomerAuditLogs());
    broadcastDataChange('CUSTOMER_UPDATED');
  };

  const handleUpdateVisits = (newVisits: CustomerVisitRecord[]) => {
    customerService.saveVisits(newVisits);
    setCustomerVisits(customerService.getVisits());
    setCustomerAuditLogs(loadCustomerAuditLogs());
    broadcastDataChange('CUSTOMER_UPDATED');
  };

  // Doctor Handlers
  const handleUpdateDoctors = (newDoctors: DoctorRecord[]) => {
    newDoctors.forEach((d) => doctorService.saveDoctor(d));
    setDoctors(doctorService.getAll());
    setDoctorAuditLogs(loadDoctorAuditLogs());
    broadcastDataChange('DOCTOR_UPDATED');
  };

  const handleUpdateDoctorVisits = (newVisits: DoctorVisitLog[]) => {
    doctorService.saveVisits(newVisits);
    setDoctorVisits(doctorService.getVisits());
    setDoctorAuditLogs(loadDoctorAuditLogs());
    broadcastDataChange('DOCTOR_UPDATED');
  };

  const logDoctorAudit = (action: string, entity: string, name: string, details?: string) => {
    const logs = loadDoctorAuditLogs();
    const validActions: DoctorAuditLog['action'][] = ['إضافة', 'تعديل', 'حذف', 'زيارة', 'استيراد', 'تصدير', 'تحديث حالة', 'نظام'];
    const safeAction = validActions.includes(action as any) ? (action as DoctorAuditLog['action']) : 'نظام';
    const newLog: DoctorAuditLog = {
      id: `doc_aud_${Date.now()}`,
      time: new Date().toISOString(),
      action: safeAction,
      doctorName: name,
      details: details || '',
    };
    saveDoctorAuditLogs([newLog, ...logs]);
    setDoctorAuditLogs([newLog, ...logs]);
  };

  // Backup & Reset Handlers
  const handleExportBackup = (): UnifiedBackupState => {
    return BackupService.createBackup();
  };

  const handleImportBackup = (backup: UnifiedBackupState) => {
    const success = BackupService.restoreBackup(backup);
    if (success) {
      setProducts(inventoryService.getAllProducts());
      setRecords(inventoryService.getAllMovements());
      setFinancialTransactions(financialService.getAll());
      setTasks(taskService.getAllTasks());
      setCommitments(taskService.getAllCommitments());
      setCustomers(customerService.getAll());
      setDoctors(doctorService.getAll());
      setDebtsCount(debtService.getAll().length);
      setCustodyCount(custodyService.getAll().length);
      setKnowledgeCount(knowledgeService.getAll().length);
      setLinksCount(linksService.getAll().length);
      setRoutinesCount(routineService.getAll().length);
    }
  };

  const handleResetAllData = () => {
    BackupService.resetSystem();
    setProducts(inventoryService.getAllProducts());
    setRecords(inventoryService.getAllMovements());
    setFinancialTransactions(financialService.getAll());
    setTasks(taskService.getAllTasks());
    setCommitments(taskService.getAllCommitments());
    setCustomers(customerService.getAll());
    setDoctors(doctorService.getAll());
    setDebtsCount(debtService.getAll().length);
    setCustodyCount(custodyService.getAll().length);
    setKnowledgeCount(knowledgeService.getAll().length);
    setLinksCount(linksService.getAll().length);
    setRoutinesCount(routineService.getAll().length);
  };

  return (
    <>
      <MainLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={{
          // TaskFlow لم يعد وحدة مستقلة: صار عرض «كانبان» داخل إدارة العمل، ولا يملك بيانات خاصة به.
          // كان تمريره بنفس قيمة tasksCount يجعل شارة القائمة تعدّ المهام مرتين (عطب موثّق في WORK_OS_CURRENT_STATE.md §3.2).
          taskflowCount: 0,
          financialCount: financialTransactions.length,
          debtsCount,
          knowledgeCount,
          linksCount,
          routinesCount,
          stockCount: records.length,
          tasksCount: tasks.filter((t) => t.status !== 'تم الانجاز').length,
          workosCount: workosOpenCount,
          customersCount: customers.length,
          doctorsCount: doctors.length,
          custodyCount,
        }}
        alertsCount={dueAlertsSummary.total}
        onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
      >
        <AppRouter
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          // Stock
          products={products}
          records={records}
          categories={categories}
          statuses={statuses}
          settings={settings}
          seq={seq}
          stockAuditLogs={stockAuditLogs}
          stocks={stocks}
          onSaveMovement={handleSaveMovement}
          onDeleteRecord={handleDeleteRecord}
          onBulkDelete={handleBulkDelete}
          onCloneRecord={handleCloneRecord}
          onAddProduct={handleAddProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
          onToggleProductActive={handleToggleProductActive}
          // Financial
          financialTransactions={financialTransactions}
          movements={movements}
          restrictions={restrictions}
          movementTypes={movementTypes}
          importanceList={importanceList}
          categoryAccounts={categoryAccounts}
          restrictionAccounts={restrictionAccounts}
          accountNames={accountNames}
          onSaveFinancialTxn={handleSaveFinancialTxn}
          onDeleteFinancialTxn={handleDeleteFinancialTxn}
          onImportFinancialTxns={handleImportFinancialTxns}
          onAddFinancialOption={handleAddFinancialOption}
          // Tasks
          tasks={tasks}
          commitments={commitments}
          taskCategories={taskCategories}
          taskOperations={taskOperations}
          taskAssignees={taskAssignees}
          taskAuditLogs={taskAuditLogs}
          onSaveTask={handleSaveTask}
          onDeleteTask={handleDeleteTask}
          onToggleCompleteTask={handleToggleCompleteTask}
          onSaveCommitment={handleSaveCommitment}
          onDeleteCommitment={handleDeleteCommitment}
          onToggleCompleteCommitment={handleToggleCompleteCommitment}
          onClearCompletedTasks={handleClearCompletedTasks}
          setTaskAuditLogs={setTaskAuditLogs}
          // Customers
          customers={customers}
          customerVisits={customerVisits}
          customerAuditLogs={customerAuditLogs}
          onUpdateCustomers={handleUpdateCustomers}
          onUpdateVisits={handleUpdateVisits}
          // Doctors
          doctors={doctors}
          doctorVisits={doctorVisits}
          doctorAuditLogs={doctorAuditLogs}
          onUpdateDoctors={handleUpdateDoctors}
          onUpdateDoctorVisits={handleUpdateDoctorVisits}
          logDoctorAudit={logDoctorAudit}
          // Settings & Backup
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onResetAllData={handleResetAllData}
          routinesCount={routinesCount}
          debtsCount={debtsCount}
          debtCommitmentsCount={debtCommitmentsCount}
        />
      </MainLayout>

      {/* Floating notification alert when tasks/commitments are approaching or due */}
      {!isToastDismissed && dueAlertsSummary.total > 0 && (
        <DueAlertsToast
          summary={dueAlertsSummary}
          onOpenDetails={() => setIsAlertsModalOpen(true)}
          onNavigateToTasks={() => {
            setActiveTab('tasks');
            setIsToastDismissed(true);
          }}
          onDismiss={() => setIsToastDismissed(true)}
        />
      )}

      {/* Detailed due alerts modal and quick action manager */}
      <DueAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        summary={dueAlertsSummary}
        onNavigateToTasks={() => {
          setActiveTab('tasks');
          setIsAlertsModalOpen(false);
        }}
        onToggleCompleteTask={handleToggleCompleteTask}
        onToggleCompleteCommitment={handleToggleCompleteCommitment}
      />
    </>
  );
};
