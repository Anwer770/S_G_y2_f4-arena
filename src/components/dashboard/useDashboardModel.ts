/**
 * نموذج لوحة التحكم (R30) — الحالة والمحسوبات والمعالِجات، مستخرجة حرفياً
 * من `UnifiedDashboard.tsx` (نفس الترتيب ونفس الاعتماديات)، ليبقى المكوّن للعرض.
 *
 * ملاحظة نوعية: `currentStock` و`minLimit` يصلان من طبقة المخزون وقت التشغيل
 * ولا يوجدان في نوع `Item` الأساسي، فنقرأهما عبر `StockRow` بدل `any`
 * مع الحفاظ على نفس التعبيرات الحسابية تماماً.
 */
import { useEffect, useMemo, useState } from 'react';
import type { Customer, DashboardProps, FinancialTransaction, Item } from './dashboardModel';
import type { WorkOrder } from './dashboardModel';
import { calculateFinancialSummary } from '../../utils/financial';
import { calculateTaskStats } from '../../utils/tasks';
import { calculateCustomerStats, getTodayArabicDay } from '../../utils/customers';
import { calculateDoctorStats } from '../../utils/doctors';
import { calculateDebtStats } from '../../utils/debts';
import {
  loadTasks as loadWorkOSTasks,
  loadOrders as loadWorkOSOrders,
  loadWorkOSData,
} from '../../utils/workosStorage';
import { getCurrentUserProfile, SETTINGS_UPDATED_EVENT } from '../../utils/settingsStorage';
import { calculateArabicDay } from '../../utils/formatters';

/** صفّ مخزون كما يصل من طبقة المخزون (رصيد حالي + حد طلب). */
type StockRow = Item & { currentStock: number; minLimit: number };

export function useDashboardModel(props: DashboardProps) {
  const {
    items,
    movements,
    financialTransactions,
    tasks = [],
    commitments = [],
    customers = [],
    visits = [],
    doctors = [],
    doctorVisits = [],
    debts = [],
    debtCommitments = [],
    onNavigateTab,
    onSaveFinancialTxn,
    onSaveMovement,
    onSaveTask,
    onToggleCompleteTask,
    onSaveCommitment,
    onUpdateCustomers,
    onUpdateVisits,
    categories,
    statuses,
    seq,
    financialMovements,
    restrictions,
    movementTypes,
    importanceList,
    categoryAccounts,
    restrictionAccounts,
    accountNames,
    onAddFinancialOption,
    taskCategories,
    taskOperations,
    taskAssignees,
  } = props;
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayArabic = useMemo(() => getTodayArabicDay(), []);

  // Quick Action Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [financialInitialTxn, setFinancialInitialTxn] = useState<FinancialTransaction | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [selectedCustomerForVisit, setSelectedCustomerForVisit] = useState<Customer | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);
  const [isWorkOSQuickAddOpen, setIsWorkOSQuickAddOpen] = useState(false);
  const [workOSQuickAddType, setWorkOSQuickAddType] = useState('order');
  const [dashboardOrders, setDashboardOrders] = useState<WorkOrder[]>(() => loadWorkOSOrders());
  const [workOSData, setWorkOSData] = useState(() => loadWorkOSData());

  // Operations Tab state: 'today' | 'overdue' | 'visits' | 'commitments' | 'orders_ledger'
  const [activeOpsTab, setActiveOpsTab] = useState<'today' | 'overdue' | 'visits' | 'commitments' | 'orders_ledger'>(
    'today'
  );
  const [workOSTasksVersion, setWorkOSTasksVersion] = useState(0);

  useEffect(() => {
    setDashboardOrders(loadWorkOSOrders());
    setWorkOSData(loadWorkOSData());
  }, [workOSTasksVersion]);

  // Financial metrics
  const finSummary = useMemo(() => calculateFinancialSummary(financialTransactions), [financialTransactions]);

  // Task metrics
  const taskStats = useMemo(() => calculateTaskStats(tasks || [], commitments || []), [tasks, commitments]);

  // Customer & Visits metrics
  const customerStats = useMemo(() => calculateCustomerStats(customers, visits), [customers, visits]);
  const doctorStats = useMemo(() => calculateDoctorStats(doctors, doctorVisits), [doctors, doctorVisits]);
  const debtStats = useMemo(() => calculateDebtStats(debts, debtCommitments), [debts, debtCommitments]);

  // Stock metrics
  const stockStats = useMemo(() => {
    const totalItems = items.length;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalQty = 0;

    items.forEach((raw) => {
      const it = raw as StockRow;
      totalQty += it.currentStock;
      if (it.currentStock <= 0) outOfStockCount++;
      else if (it.currentStock <= it.minLimit) lowStockCount++;
    });

    return {
      totalItems,
      totalQty,
      lowStockCount,
      outOfStockCount,
      movementsCount: movements.length,
    };
  }, [items, movements]);

  // Command Center Live Categorization: Today, Overdue, Upcoming
  // دمج مهام منظومة العمل Work OS والمهام الكلاسيكية لضمان تزامن لوحة القيادة
  const unifiedTasksPool = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      end?: string;
      start?: string;
      status: string;
      priority?: string;
      assignee?: string;
      category?: string;
    }> = [];
    (tasks || []).forEach((t) => {
      if (t) {
        list.push({
          id: t.id,
          title: t.title,
          end: t.end,
          start: t.start,
          status: t.status,
          priority: t.pri,
          assignee: t.resp,
          category: t.cat,
        });
      }
    });

    try {
      const workOSTasks = loadWorkOSTasks();
      workOSTasks.forEach((wt) => {
        // تجنب التكرار إذا كان نفس المعرف
        if (!list.some((existing) => existing.id === wt.id || existing.id === wt.taskNumber)) {
          list.push({
            id: wt.taskNumber || wt.id,
            title: wt.title,
            end: wt.dueDate,
            start: wt.startDate,
            status: wt.status === 'completed' ? 'تم الانجاز' : wt.status === 'in_progress' ? 'قيد التنفيذ' : 'مخطط',
            priority: wt.priority === 'urgent' ? 'A' : wt.priority === 'high' ? 'B' : 'C',
            assignee: wt.assigneeId || 'المستخدم',
            category: wt.category || 'عام',
          });
        }
      });
    } catch {
      // قراءة آمنة
    }

    return list;
  }, [tasks, workOSTasksVersion]);

  const todayTasks = useMemo(() => {
    return unifiedTasksPool.filter((t) => {
      if (!t) return false;
      const isDueToday = t.end === todayStr;
      const isStartedToday = t.start === todayStr;
      const isOpen = t.status !== 'تم الانجاز';
      return (isDueToday || isStartedToday || (!t.end && isOpen)) && isOpen;
    });
  }, [unifiedTasksPool, todayStr]);

  const overdueTasks = useMemo(() => {
    return unifiedTasksPool.filter((t) => {
      if (!t || t.status === 'تم الانجاز' || !t.end) return false;
      return t.end < todayStr;
    });
  }, [unifiedTasksPool, todayStr]);

  const overdueCommitments = useMemo(() => {
    return (commitments || []).filter((c) => {
      if (!c || c.status === 'تم الانجاز' || !c.due) return false;
      return c.due < todayStr;
    });
  }, [commitments, todayStr]);

  const todayCustomerVisits = useMemo(
    () => (customers || []).filter((c) => c && c.route === todayArabic),
    [customers, todayArabic]
  );

  const todayDoctorVisits = useMemo(
    () => (doctors || []).filter((d) => d && d.route === todayArabic),
    [doctors, todayArabic]
  );

  const criticalStockItems = useMemo(() => {
    return items.filter((raw) => {
      const it = raw as StockRow;
      return it.currentStock <= it.minLimit;
    });
  }, [items]);

  const recentMovements = useMemo(() => movements.slice(0, 5), [movements]);
  const recentFinancial = useMemo(() => financialTransactions.slice(0, 5), [financialTransactions]);

  const [userProfile, setUserProfile] = useState(() => getCurrentUserProfile());

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setUserProfile(getCurrentUserProfile());
    };
    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key && e.key.includes('task')) {
        setWorkOSTasksVersion((v) => v + 1);
      }
    };
    window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Handlers for Quick Action Triggers
  const handleOpenReceiptVoucher = () => {
    setFinancialInitialTxn({
      id: '',
      date: todayStr,
      day: calculateArabicDay(todayStr),
      importance: '√',
      movement: 'ايرادات',
      restriction: 'سند قبض',
      movementType: 'نقدا',
      categoryAccount: 'تحصيل',
      restrictionAccount: 'الصندوق',
      accountName: '',
      description: '',
      number: '',
      amountYER: 0,
      amountSAR: 0,
      amountUSD: 0,
      isDraft: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsFinancialModalOpen(true);
  };

  const handleOpenPaymentVoucher = () => {
    setFinancialInitialTxn({
      id: '',
      date: todayStr,
      day: calculateArabicDay(todayStr),
      importance: '√',
      movement: 'مصروفات',
      restriction: 'سند صرف',
      movementType: 'نقدا',
      categoryAccount: 'انور مصروفات',
      restrictionAccount: 'الصندوق',
      accountName: '',
      description: '',
      number: '',
      amountYER: 0,
      amountSAR: 0,
      amountUSD: 0,
      isDraft: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsFinancialModalOpen(true);
  };

  const handleOpenRecordVisit = (customer?: Customer) => {
    setSelectedCustomerForVisit(customer || customers[0] || null);
    setIsVisitModalOpen(true);
  };

  return {
    activeOpsTab,
    dashboardOrders,
    debtStats,
    finSummary,
    financialInitialTxn,
    handleOpenPaymentVoucher,
    handleOpenReceiptVoucher,
    handleOpenRecordVisit,
    isCommitmentModalOpen,
    isFinancialModalOpen,
    isMovementModalOpen,
    isNoteModalOpen,
    isTaskModalOpen,
    isVisitModalOpen,
    isWorkOSQuickAddOpen,
    selectedCustomerForVisit,
    setActiveOpsTab,
    setDashboardOrders,
    setIsCommitmentModalOpen,
    setIsFinancialModalOpen,
    setIsMovementModalOpen,
    setIsNoteModalOpen,
    setIsTaskModalOpen,
    setIsVisitModalOpen,
    setIsWorkOSQuickAddOpen,
    setWorkOSData,
    setWorkOSQuickAddType,
    setWorkOSTasksVersion,
    overdueCommitments,
    overdueTasks,
    recentFinancial,
    recentMovements,
    stockStats,
    todayArabic,
    todayCustomerVisits,
    todayDoctorVisits,
    todayStr,
    todayTasks,
    userProfile,
    workOSData,
    workOSQuickAddType,
    taskStats,
    customerStats,
    doctorStats,
    criticalStockItems,
    items,
    movements,
    financialTransactions,
    tasks,
    commitments,
    customers,
    visits,
    doctors,
    doctorVisits,
    debts,
    debtCommitments,
    onNavigateTab,
    onSaveFinancialTxn,
    onSaveMovement,
    onSaveTask,
    onToggleCompleteTask,
    onSaveCommitment,
    onUpdateCustomers,
    onUpdateVisits,
    categories,
    statuses,
    seq,
    financialMovements,
    restrictions,
    movementTypes,
    importanceList,
    categoryAccounts,
    restrictionAccounts,
    accountNames,
    onAddFinancialOption,
    taskCategories,
    taskOperations,
    taskAssignees,
  };
}

/** نوع نموذج اللوحة — يُشتق من الخطاف نفسه. */
export type DashboardModel = ReturnType<typeof useDashboardModel>;
