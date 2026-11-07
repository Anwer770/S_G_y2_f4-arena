import React, { useMemo, useState, useEffect } from 'react';
import {
  ActiveModuleTab,
  Commitment,
  Customer,
  CustomerVisitRecord,
  DebtCommitment,
  DebtRecord,
  DoctorRecord,
  DoctorVisitLog,
  FinancialTransaction,
  Item,
  Movement,
  Task,
  VisitStatus,
} from '../../types';
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
import { WorkOrder } from '../../types/workos';
import { CentralUnifiedLedger } from '../workos/CentralUnifiedLedger';
import { WorkOSQuickAddModal } from '../workos/WorkOSQuickAddModal';
import {
  loadDebts,
  loadDebtCommitments,
  loadNotes,
  saveNotes,
  loadNoteFolders,
  loadNoteTags,
  loadCustodyIssues,
  loadLinksRecords,
} from '../../utils/storage';
import { getCurrentUserProfile, SETTINGS_UPDATED_EVENT } from '../../utils/settingsStorage';
import { formatCurrency, calculateArabicDay } from '../../utils/formatters';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { DashboardCharts } from './DashboardCharts';
import { dbStorage } from '../../database/dbStorage';
import { broadcastDataChange } from '../../utils/multiTabSync';

// Protected Modals for Quick Actions
import { TaskModal } from '../tasks/TaskModal';
import { FinancialModal } from '../financial/FinancialModal';
import { MovementModal } from '../MovementModal';
import { RecordVisitModal } from '../customers/RecordVisitModal';
import { CommitmentModal as TaskCommitmentModal } from '../tasks/CommitmentModal';
import { NoteEditorModal } from '../knowledge/NoteEditorModal';

import {
  Wallet,
  Package,
  CheckSquare,
  Users,
  Stethoscope,
  Coins,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  Clock,
  Layers,
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  Flame,
  Globe,
  Kanban,
  Zap,
  ShoppingCart,
  BarChart2,
  Plus,
  Eye,
  CheckCircle2,
  Circle,
  FileText,
  AlertCircle,
  CalendarDays,
  Activity,
} from 'lucide-react';

interface Props {
  items: Item[];
  movements: Movement[];
  financialTransactions: FinancialTransaction[];
  tasks: Task[];
  commitments: Commitment[];
  customers?: Customer[];
  visits?: CustomerVisitRecord[];
  doctors?: DoctorRecord[];
  doctorVisits?: DoctorVisitLog[];
  debts?: DebtRecord[];
  debtCommitments?: DebtCommitment[];
  onNavigateTab: (tab: ActiveModuleTab) => void;
  // Quick Actions Handlers
  onSaveFinancialTxn?: (txn: FinancialTransaction) => void;
  onSaveMovement?: (record: Movement) => void;
  onSaveTask?: (task: Task) => void;
  onToggleCompleteTask?: (id: string) => void;
  onSaveCommitment?: (comm: Commitment) => void;
  onUpdateCustomers?: (customers: Customer[]) => void;
  onUpdateVisits?: (visits: CustomerVisitRecord[]) => void;
  // Options for Modals
  categories?: string[];
  statuses?: string[];
  seq?: { IN: number; OUT: number };
  financialMovements?: string[];
  restrictions?: string[];
  movementTypes?: string[];
  importanceList?: string[];
  categoryAccounts?: string[];
  restrictionAccounts?: string[];
  accountNames?: string[];
  onAddFinancialOption?: (type: any, val: string) => void;
  taskCategories?: string[];
  taskOperations?: string[];
  taskAssignees?: string[];
}

const LiveClock: React.FC = React.memo(() => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const day = now.toLocaleDateString('ar-YE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const time = now.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      setTimeStr(`${day} • ${time}`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return <span className="font-mono text-xs">{timeStr || 'الثلاثاء، 8 سبتمبر • 12:16:26 م'}</span>;
});

export const UnifiedDashboard: React.FC<Props> = ({
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
}) => {
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
  const [activeOpsTab, setActiveOpsTab] = useState<'today' | 'overdue' | 'visits' | 'commitments' | 'orders_ledger'>('today');
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
    let totalItems = items.length;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalQty = 0;

    items.forEach((it) => {
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
    const list: Array<{ id: string; title: string; end?: string; start?: string; status: string; priority?: string; assignee?: string; category?: string }> = [];
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
    return items.filter((it) => it.currentStock <= it.minLimit);
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

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. TOP HEADER & COMMAND CENTER IDENTITY */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              لوحة التحكم
            </h1>
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

      {/* 2.5 PROMINENT QUICK ACTIONS BAR (الأزرار السريعة الفورية) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#0D9488]" />
            <span className="text-xs font-black text-slate-900 dark:text-slate-100">
              الإجراءات السريعة الفورية
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              (إدخال مباشر منظم عبر النماذج المحاسبية دون مغادرة الشاشة)
            </span>
          </div>
          <span className="text-xs text-[#0D9488] dark:text-teal-400 font-bold">
            8 إجراءات فورية (الطلبيات، المهام، السندات، والمخزون)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {/* + طلبية / توريد (أزرق ملكي #3B82F6) */}
          <button
            onClick={() => {
              setWorkOSQuickAddType('order');
              setIsWorkOSQuickAddOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-950 dark:text-blue-200 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <ShoppingCart className="w-4 h-4 text-[#3B82F6] shrink-0" />
            <span>+ طلبية / توريد</span>
          </button>

          {/* + مهمة (أخضر زمردي) */}
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#0F3935] dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <CheckSquare className="w-4 h-4 text-[#0D9488] shrink-0" />
            <span>+ مهمة</span>
          </button>

          {/* + زيارة (أزرق ملكي) */}
          <button
            onClick={() => handleOpenRecordVisit()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-200 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Users className="w-4 h-4 text-[#3B82F6] shrink-0" />
            <span>+ زيارة عميل</span>
          </button>

          {/* + سند قبض (أخضر زمردي #0D9488) */}
          <button
            onClick={handleOpenReceiptVoucher}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-950 dark:text-teal-200 border border-teal-200/80 dark:border-teal-800/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <ArrowDownLeft className="w-4 h-4 text-[#0D9488] shrink-0" />
            <span>+ سند قبض</span>
          </button>

          {/* + سند صرف (أحمر مرجاني #EF4444) */}
          <button
            onClick={handleOpenPaymentVoucher}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-950 dark:text-rose-200 border border-rose-200/80 dark:border-rose-800/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <ArrowUpRight className="w-4 h-4 text-[#EF4444] shrink-0" />
            <span>+ سند صرف</span>
          </button>

          {/* + حركة مخزون (أخضر زيتي / نيلي) */}
          <button
            onClick={() => setIsMovementModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-950 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-800/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Package className="w-4 h-4 text-[#4338CA] shrink-0" />
            <span>+ إذن مخزني</span>
          </button>

          {/* + ملاحظة (ذهبي برونزي) */}
          <button
            onClick={() => setIsNoteModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-950 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <BookOpen className="w-4 h-4 text-[#D97706] shrink-0" />
            <span>+ ملاحظة</span>
          </button>

          {/* + موعد (برونزي #B45309) */}
          <button
            onClick={() => setIsCommitmentModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-950 dark:text-orange-200 border border-orange-200/80 dark:border-orange-800/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Calendar className="w-4 h-4 text-[#B45309] shrink-0" />
            <span>+ موعد / التزام</span>
          </button>
        </div>
      </div>

      {/* 3. TODAY'S COMMAND PULSE CARDS (نبض اليوم) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 animate-fade-in-up">
        {/* مهام اليوم */}
        <div
          onClick={() => setActiveOpsTab('today')}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeOpsTab === 'today'
              ? 'bg-teal-50/90 dark:bg-teal-950/60 border-teal-500 shadow-xs'
              : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-teal-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">مهام اليوم</span>
            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              <AnimatedCounter value={todayTasks.length} />
            </div>
            <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
              {todayTasks.length > 0 ? 'مفتوحة للمتابعة' : 'كلها منجزة'}
            </span>
          </div>
        </div>

        {/* المتأخرات */}
        <div
          onClick={() => setActiveOpsTab('overdue')}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeOpsTab === 'overdue'
              ? 'bg-rose-50/90 dark:bg-rose-950/60 border-rose-500 shadow-xs'
              : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">المتأخرات</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              <AnimatedCounter value={overdueTasks.length + overdueCommitments.length} />
            </div>
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
              {overdueTasks.length + overdueCommitments.length > 0 ? 'تتطلب تدخلاً عاجلاً' : 'لا يوجد تأخير'}
            </span>
          </div>
        </div>

        {/* زيارات اليوم */}
        <div
          onClick={() => setActiveOpsTab('visits')}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeOpsTab === 'visits'
              ? 'bg-sky-50/90 dark:bg-sky-950/60 border-sky-500 shadow-xs'
              : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">زيارات اليوم</span>
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              <AnimatedCounter value={todayCustomerVisits.length + todayDoctorVisits.length} />
            </div>
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400">
              {todayCustomerVisits.length} عميل • {todayDoctorVisits.length} طبيب
            </span>
          </div>
        </div>

        {/* الالتزامات والديون */}
        <div
          onClick={() => setActiveOpsTab('commitments')}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeOpsTab === 'commitments'
              ? 'bg-amber-50/90 dark:bg-amber-950/60 border-amber-500 shadow-xs'
              : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الالتزامات</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              <AnimatedCounter value={commitments.filter((c) => c.status !== 'تم الانجاز').length} />
            </div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              التزامات قائمة
            </span>
          </div>
        </div>

        {/* تنبيهات المخزون */}
        <div
          onClick={() => onNavigateTab('stock')}
          className="p-4 rounded-xl border bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-rose-400 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">تنبيه المخزون</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              <AnimatedCounter value={stockStats.lowStockCount + stockStats.outOfStockCount} />
            </div>
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
              صنف بلغ حد الطلب
            </span>
          </div>
        </div>

        {/* صافي السيولة النقدية */}
        <div
          onClick={() => onNavigateTab('financial')}
          className="p-4 rounded-xl border bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">صافي السيولة</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono truncate">
              <AnimatedCounter value={finSummary.netBalance} formatter={formatCurrency} />
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              ريال يمني (صافي)
            </span>
          </div>
        </div>
      </div>

      {/* 4. DAILY OPERATIONS CENTER (المركز التنفيذي اليومي) */}
      <div className="bg-white dark:bg-slate-900/95 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-4">
        {/* Segmented Control for Operations Tab */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveOpsTab('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeOpsTab === 'today'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>مهام اليوم</span>
              <span className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${
                activeOpsTab === 'today' ? 'bg-teal-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {todayTasks.length}
              </span>
            </button>

            <button
              onClick={() => setActiveOpsTab('overdue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeOpsTab === 'overdue'
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>المتأخرات</span>
              <span className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${
                activeOpsTab === 'overdue' ? 'bg-rose-800 text-white' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
              }`}>
                {overdueTasks.length + overdueCommitments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveOpsTab('visits')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeOpsTab === 'visits'
                  ? 'bg-sky-700 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>زيارات ومواعيد مسار اليوم ({todayArabic})</span>
              <span className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${
                activeOpsTab === 'visits' ? 'bg-sky-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {todayCustomerVisits.length + todayDoctorVisits.length}
              </span>
            </button>

            <button
              onClick={() => setActiveOpsTab('commitments')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeOpsTab === 'commitments'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>الالتزامات والديون</span>
            </button>

            <button
              onClick={() => setActiveOpsTab('orders_ledger')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeOpsTab === 'orders_ledger'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>الدفتر المركزي (الطلبيات والربط الثلاثي)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${
                activeOpsTab === 'orders_ledger' ? 'bg-blue-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {dashboardOrders.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('workos')}
              className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>فتح مساحة العمل الكاملة</span>
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* TAB 1: مهام اليوم */}
        {activeOpsTab === 'today' && (
          <div className="space-y-2">
            {todayTasks.length === 0 ? (
              <div className="text-center py-8 space-y-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  رائع! تم إنجاز جميع مهام اليوم أو لا توجد مهام معلقة لليوم.
                </p>
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition cursor-pointer"
                >
                  + إضافة مهمة جديدة
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {todayTasks.slice(0, 8).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => {
                          // إنجاز المهمة سواء كانت كلاسيكية أو في محرك Work OS
                          if (onToggleCompleteTask) {
                            onToggleCompleteTask(task.id);
                          }
                          try {
                            const wTasks = loadWorkOSTasks();
                            const matched = wTasks.find((wt) => wt.id === task.id || wt.taskNumber === task.id);
                            if (matched) {
                              const updated = wTasks.map((wt) =>
                                wt.id === matched.id
                                  ? {
                                      ...wt,
                                      status: wt.status === 'completed' ? ('in_progress' as const) : ('completed' as const),
                                      progress: wt.status === 'completed' ? 50 : 100,
                                      updatedAt: new Date().toISOString(),
                                    }
                                  : wt
                              );
                              dbStorage.setItem('workos_v1_tasks', JSON.stringify(updated));
                              broadcastDataChange('TASK_UPDATED');
                            }
                          } catch {}
                        }}
                        title="تبديل حالة الإنجاز"
                        className="mt-0.5 text-slate-400 hover:text-emerald-600 transition cursor-pointer shrink-0"
                      >
                        <Circle className="w-4 h-4" />
                      </button>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{task.title}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-xs font-bold ${
                              task.priority === 'A'
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                : task.priority === 'B'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                            }`}
                          >
                            أولوية {task.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>المسؤول: {task.assignee || 'أنا'}</span>
                          <span>•</span>
                          <span>التصنيف: {task.category}</span>
                          {task.end && (
                            <>
                              <span>•</span>
                              <span>الموعد: {task.end}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateTab('workos')}
                      className="text-teal-700 dark:text-teal-400 hover:underline text-xs font-bold shrink-0 cursor-pointer"
                    >
                      التفاصيل
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: المتأخرات */}
        {activeOpsTab === 'overdue' && (
          <div className="space-y-2">
            {overdueTasks.length === 0 && overdueCommitments.length === 0 ? (
              <div className="text-center py-8 space-y-1 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-dashed border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  ممتاز! لا توجد أي مهام أو التزامات متأخرة عن مواعيد استحقاقها.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {overdueTasks.map((task) => (
                  <div
                    key={`od_${task.id}`}
                    className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{task.title}</span>
                        <span className="px-1.5 py-0.2 rounded text-xs font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                          متأخرة منذ {task.end}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">المسؤول: {task.assignee || 'المستخدم'} • {task.category}</span>
                    </div>

                    <button
                      onClick={() => {
                        if (onToggleCompleteTask) {
                          onToggleCompleteTask(task.id);
                        }
                        try {
                          const wTasks = loadWorkOSTasks();
                          const matched = wTasks.find((wt) => wt.id === task.id || wt.taskNumber === task.id);
                          if (matched) {
                            const updated = wTasks.map((wt) =>
                              wt.id === matched.id
                                ? {
                                    ...wt,
                                    status: 'completed' as const,
                                    progress: 100,
                                    updatedAt: new Date().toISOString(),
                                  }
                                : wt
                            );
                            dbStorage.setItem('workos_v1_tasks', JSON.stringify(updated));
                            broadcastDataChange('TASK_UPDATED');
                          }
                        } catch {}
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      إنجاز الآن
                    </button>
                  </div>
                ))}

                {overdueCommitments.map((comm) => (
                  <div
                    key={`od_comm_${comm.id}`}
                    className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{comm.name}</span>
                        <span className="px-1.5 py-0.2 rounded text-xs font-bold bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                          التزام مستحق {comm.due}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{comm.desc}</p>
                      <span className="text-xs font-mono font-bold text-rose-600">المبلغ: {formatCurrency(comm.amount)} YER</span>
                    </div>

                    <button
                      onClick={() => onNavigateTab('debts')}
                      className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      تسوية الدفعة
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: زيارات ومواعيد مسار اليوم */}
        {activeOpsTab === 'visits' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* عملاء مسار اليوم */}
              <div className="space-y-2 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <Users className="w-4 h-4 text-sky-600" />
                    <span>عملاء مسار اليوم ({todayArabic})</span>
                  </div>
                  <span className="text-xs font-bold text-sky-700 dark:text-sky-300">
                    {todayCustomerVisits.length} عميل
                  </span>
                </div>

                {todayCustomerVisits.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-400">لا يوجد عملاء مجدولون في مسار {todayArabic}.</p>
                ) : (
                  <div className="space-y-1.5">
                    {todayCustomerVisits.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">{c.name}</span>
                          <span className="text-xs text-slate-400">{c.region} • المندوب: {c.responsible}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-300">
                            {(c.balanceYER || 0).toLocaleString()} YER
                          </span>
                          <button
                            onClick={() => handleOpenRecordVisit(c)}
                            className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition cursor-pointer"
                          >
                            تسجيل الزيارة
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* أطباء مسار اليوم */}
              <div className="space-y-2 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    <span>أطباء مسار اليوم ({todayArabic})</span>
                  </div>
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                    {todayDoctorVisits.length} طبيب
                  </span>
                </div>

                {todayDoctorVisits.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-400">لا يوجد أطباء مجدولون في مسار {todayArabic}.</p>
                ) : (
                  <div className="space-y-1.5">
                    {todayDoctorVisits.map((d) => (
                      <div
                        key={d.id}
                        className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{d.name}</span>
                            {d.specialty && (
                              <span className="px-1.5 py-0.2 rounded bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-xs font-bold">
                                {d.specialty}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{d.clinicName || d.region}</span>
                        </div>
                        <button
                          onClick={() => onNavigateTab('doctors')}
                          className="px-2 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition cursor-pointer"
                        >
                          خطة الزيارة
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: الالتزامات والديون المستحقة */}
        {activeOpsTab === 'commitments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>الالتزامات التشغيلية المستحقة</span>
                </span>
                <span className="font-mono text-rose-600">
                  {formatCurrency(debtStats.totalCommitmentsRemaining)} YER
                </span>
              </div>
              <div className="space-y-1.5">
                {debtCommitments.slice(0, 4).map((dc) => (
                  <div
                    key={dc.id}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{dc.name}</span>
                      <span className="text-xs text-slate-400">{dc.category} • المستحق: {dc.endDate || dc.date}</span>
                    </div>
                    <span className="font-mono font-bold text-rose-600">{formatCurrency(dc.amount)} {dc.currency}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-teal-600" />
                  <span>أرصدة الديون الحالية (دفاتر الذمم)</span>
                </span>
                <button
                  onClick={() => onNavigateTab('debts')}
                  className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  فتح دفتر الديون
                </button>
              </div>
              <div className="space-y-1.5">
                {debts.slice(0, 4).map((d) => (
                  <div
                    key={d.id}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{d.name}</span>
                      <span className="text-xs text-slate-400">دفتر: {d.book} • التاريخ: {d.date}</span>
                    </div>
                    <span className={`font-mono font-bold ${d.book === 'لنا' ? 'text-teal-700 dark:text-teal-300' : 'text-rose-600'}`}>
                      {formatCurrency(d.debit || d.credit)} {d.currency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: الدفتر المركزي والطلبيات والربط الثلاثي */}
        {activeOpsTab === 'orders_ledger' && (
          <div className="pt-2">
            <CentralUnifiedLedger
              orders={dashboardOrders}
              tasks={workOSData.tasks}
              commitments={workOSData.commitments}
              team={workOSData.team}
              onOpenQuickAdd={(type) => {
                setWorkOSQuickAddType(type || 'order');
                setIsWorkOSQuickAddOpen(true);
              }}
              onUpdateOrders={(updated) => {
                setDashboardOrders(updated);
                setWorkOSData((prev) => ({ ...prev, orders: updated }));
              }}
              onUpdateTasks={(updated) => {
                setWorkOSData((prev) => ({ ...prev, tasks: updated }));
                setWorkOSTasksVersion((v) => v + 1);
              }}
              onUpdateCommitments={(updated) => {
                setWorkOSData((prev) => ({ ...prev, commitments: updated }));
              }}
            />
          </div>
        )}
      </div>

      {/* 5. FINANCIAL & INVENTORY COMMAND BLOCKS (حركة مالية + حركة مخزون) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* حركة مالية */}
        <div className="bg-white/95 dark:bg-slate-900/90 rounded-xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  الحركة المالية واليومية
                </h3>
                <span className="text-xs text-slate-400">
                  إيرادات: {formatCurrency(finSummary.totalIncome)} YER • مصروفات: {formatCurrency(finSummary.totalExpense)} YER
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenReceiptVoucher}
                className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold hover:bg-emerald-200 transition cursor-pointer"
              >
                + قبض
              </button>
              <button
                onClick={handleOpenPaymentVoucher}
                className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 text-xs font-bold hover:bg-rose-200 transition cursor-pointer"
              >
                + صرف
              </button>
              <button
                onClick={() => onNavigateTab('financial')}
                className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
              >
                السجل الكامل
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {recentFinancial.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">لا توجد حركات مالية مسجلة بعد.</p>
            ) : (
              recentFinancial.map((txn) => {
                const isIncome = txn.movement === 'ايرادات' || txn.movement === 'الصندوق' || txn.movement === 'حساب له';
                return (
                  <div
                    key={txn.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${isIncome ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200' : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200'}`}>
                        {isIncome ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">{txn.accountName || txn.id}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{txn.movement} • {txn.restriction} • {txn.date}</span>
                      </div>
                    </div>

                    <div className="text-left font-mono">
                      <span className={`font-bold block ${isIncome ? 'text-teal-700 dark:text-teal-300' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatCurrency(txn.amountYER)} YER
                      </span>
                      {(txn.amountSAR > 0 || txn.amountUSD > 0) && (
                        <span className="text-xs text-slate-400 block">
                          {txn.amountSAR > 0 ? `${formatCurrency(txn.amountSAR)} SAR ` : ''}
                          {txn.amountUSD > 0 ? `$${formatCurrency(txn.amountUSD)} USD` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* حركة مخزون */}
        <div className="bg-white/95 dark:bg-slate-900/90 rounded-xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  حركة المخزون والمستودع
                </h3>
                <span className="text-xs text-slate-400">
                  الأصناف: {stockStats.totalItems} • إجمالي الكمية: {stockStats.totalQty} • حرجة: {stockStats.lowStockCount + stockStats.outOfStockCount}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMovementModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 text-xs font-bold hover:bg-sky-200 transition cursor-pointer"
              >
                + إذن مخزني
              </button>
              <button
                onClick={() => onNavigateTab('stock')}
                className="text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
              >
                دفتر الأصناف
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {recentMovements.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">لا توجد حركات مخزون مسجلة بعد.</p>
            ) : (
              recentMovements.map((mov) => (
                <div
                  key={mov.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${mov.movementType === 'توريد' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800' : 'bg-rose-100 dark:bg-rose-950 text-rose-800'}`}>
                      {mov.movementType === 'توريد' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        إذن {mov.movementType} #{mov.subId} — {mov.beneficiary}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {mov.category} • {mov.date} • {mov.items?.length || 0} صنف
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    mov.status === 'معتمد' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  }`}>
                    {mov.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. CHARTS & FINANCIAL SUMMARY */}
      <DashboardCharts
        financialTransactions={financialTransactions}
        items={items}
        tasks={tasks}
        customers={customers}
        doctors={doctors}
      />

      {/* 7. ALL 11 MODULE HUBS (بوابات الوصول لوحدات المنظومة كاملة) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">
              بوابات المنظومة الإدارية والمحاسبية المستقلة
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">الوحدات من 2 إلى 12</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 animate-fade-in-up">
          {/* Module 2: Financial */}
          <div
            onClick={() => onNavigateTab('financial')}
            className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-teal-500 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/50">2</span>
                  <div className="p-2 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full font-mono">
                  {financialTransactions.length} حركة
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-teal-600">ادارة السجل اليومي</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">سندات القبض والصرف، المقبوضات والمدفوعات والصناديق</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-teal-700 dark:text-teal-400">
              <span>فتح السجل المالي</span>
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 3: Debts */}
          <div
            onClick={() => onNavigateTab('debts')}
            className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-amber-200/60 dark:border-slate-800 shadow-xs hover:border-amber-500 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/50">3</span>
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full font-mono">
                  {debts.length + debtCommitments.length} سجل
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-600">ادارة الديون والالتزامات</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">دفاتر الذمم، سندات الأقساط، والالتزامات المالية</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
              <span>فتح الديون</span>
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 4: Stock */}
          <div
            onClick={() => onNavigateTab('stock')}
            className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-500 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/50">4</span>
                  <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full font-mono">
                  {items.length} صنف
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-sky-600">ادارة صرف وتوريد</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">حركة المخزون، أذونات الصرف والتوريد وتنبيهات النواقص</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-sky-700 dark:text-sky-400">
              <span>فتح المخزون</span>
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 5: Work OS */}
          <div
            onClick={() => onNavigateTab('workos')}
            className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-emerald-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-500 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50">5</span>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-mono">
                  {tasks.length} مهمة
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-600">إدارة العمل (Work OS)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">المشاريع، المهام، كانبان، الجدول الزمني، والتخطيط اليومي</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span>فتح إدارة العمل</span>
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 6: Customers */}
          <div
            onClick={() => onNavigateTab('customers')}
            className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-teal-500 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/50">6</span>
                  <div className="p-2 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full font-mono">
                  {customers.length} عميل
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-teal-600">ادارة العملاء وزيارات</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">شبكة العملاء، كشوفات المطابقة، وخطوط السير اليومية</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-teal-700 dark:text-teal-400">
              <span>فتح العملاء</span>
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 7: Doctors */}
          <div
            onClick={() => onNavigateTab('doctors')}
            className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-500 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/50">7</span>
                  <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full font-mono">
                  {doctors.length} طبيب
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-sky-600">ادارة الاطباء وزيارات</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">دليل الأطباء، العيادات، العينات الطبية والمتابعات الميدانية</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-sky-700 dark:text-sky-400">
              <span>فتح الأطباء</span>
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 8: Routines */}
          <div
            onClick={() => onNavigateTab('routines')}
            className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-500 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/50">8</span>
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full font-mono">
                  نشط
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-600">ادارة الروتين والعادات</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">العادات اليومية، مربعات التركيز، وجداول الإنتاجية</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
              <span>فتح الروتين</span>
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 9: Knowledge / Notes */}
          <div
            onClick={() => onNavigateTab('knowledge')}
            className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-purple-500 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/50">9</span>
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full font-mono">
                  {loadNotes().length} ملاحظة
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-purple-600">ادارة الملاحظات والمعرفة</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">التوثيق الإداري، محاضر الاجتماعات، والأرشيف المقفل</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-400">
              <span>فتح الملاحظات</span>
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 10: Custody */}
          <div
            onClick={() => onNavigateTab('custody')}
            className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-rose-500 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/50">10</span>
                  <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full font-mono">
                  {loadCustodyIssues().length} سجل
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-rose-600">ادارة العهد والاشكاليات</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">سجلات العهد العينية والنقدية والمعلقات الإدارية</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-400">
              <span>فتح العهد</span>
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 11: Links Library */}
          <div
            onClick={() => onNavigateTab('links')}
            className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-violet-500 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/50">11</span>
                  <div className="p-2 bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 rounded-xl group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <Globe className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full font-mono">
                  {loadLinksRecords().length} رابط
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-violet-600">مكتبة الروابط والأدوات</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">روابط أدوات الذكاء الاصطناعي والمواقع الخدمية</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-violet-700 dark:text-violet-400">
              <span>فتح الروابط</span>
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 12: Settings */}
          <div
            onClick={() => onNavigateTab('settings')}
            className="bg-white/95 dark:bg-slate-900/85 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-500 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200">12</span>
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl group-hover:bg-slate-600 group-hover:text-white transition-colors">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-mono">
                  النظام
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-slate-600">إعدادات النظام والنسخ</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">النسخ الاحتياطي الشامل، المستخدمون والصلاحيات وقواعد البيانات</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-400">
              <span>فتح الإعدادات</span>
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. PROTECTED MODALS (Mounted directly for Instant Quick Actions) */}
      {/* ========================================================================= */}

      {/* Task Modal for + مهمة */}
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={(task) => {
            onSaveTask?.(task);
            setIsTaskModalOpen(false);
          }}
          existingTasks={tasks}
          categories={taskCategories || ['العملاء', 'الإدارة', 'المتابعة', 'المالية']}
          operations={taskOperations || ['مهمة', 'عملية', 'متابعة', 'اتصال']}
          assignees={taskAssignees || ['أنا', 'المندوب']}
        />
      )}

      {/* Financial Modal for + سند قبض / + سند صرف */}
      {isFinancialModalOpen && (
        <FinancialModal
          isOpen={isFinancialModalOpen}
          onClose={() => setIsFinancialModalOpen(false)}
          onSave={(txn) => {
            onSaveFinancialTxn?.(txn);
            setIsFinancialModalOpen(false);
          }}
          editingTransaction={financialInitialTxn}
          existingTransactions={financialTransactions}
          movements={financialMovements || ['الصندوق', 'ايرادات', 'مصروفات', 'حساب له', 'حساب عليه']}
          restrictions={restrictions || ['سند قبض', 'سند صرف', 'قيد يومي']}
          movementTypes={movementTypes || ['نقدا', 'شيك', 'حوالة']}
          importanceList={importanceList || ['√', 'عادي', 'هام', 'عاجل']}
          categoryAccounts={categoryAccounts || ['تحصيل', 'مبيعات', 'انور مصروفات']}
          restrictionAccounts={restrictionAccounts || ['الصندوق', 'البنك']}
          accountNames={accountNames || []}
          onAddOption={onAddFinancialOption}
        />
      )}

      {/* Movement Modal for + حركة مخزون */}
      {isMovementModalOpen && (
        <MovementModal
          isOpen={isMovementModalOpen}
          onClose={() => setIsMovementModalOpen(false)}
          onSave={(record) => {
            onSaveMovement?.(record);
            setIsMovementModalOpen(false);
          }}
          editingRecord={null}
          products={items}
          records={movements}
          categories={categories || ['عام', 'مخزن رئيسي']}
          statuses={statuses || ['معتمد', 'مسودة']}
          seq={seq || { IN: 1, OUT: 1 }}
        />
      )}

      {/* Record Visit Modal for + زيارة */}
      {isVisitModalOpen && (
        <RecordVisitModal
          isOpen={isVisitModalOpen}
          onClose={() => setIsVisitModalOpen(false)}
          customer={selectedCustomerForVisit || customers[0] || null}
          onSaveVisit={(visit, status, amount) => {
            onUpdateVisits?.([visit, ...(visits || [])]);
            setIsVisitModalOpen(false);
          }}
        />
      )}

      {/* Note Editor Modal for + ملاحظة */}
      {isNoteModalOpen && (
        <NoteEditorModal
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
          noteToEdit={null}
          onSave={(newNoteData) => {
            const allNotes = loadNotes();
            const newNote = {
              id: `note_${Date.now()}`,
              title: newNoteData.title || 'ملاحظة جديدة',
              content: newNoteData.content || '',
              ...newNoteData,
              date: todayStr,
              time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as any;
            saveNotes([newNote, ...allNotes]);
            setIsNoteModalOpen(false);
          }}
          folders={loadNoteFolders()}
          tagsList={loadNoteTags()}
          customersList={customers.map((c) => ({ id: c.id, name: c.name }))}
          doctorsList={doctors.map((d) => ({ id: d.id, name: d.name }))}
          tasksList={tasks.map((t) => ({ id: t.id, title: t.title }))}
        />
      )}

      {/* Task Commitment Modal for + موعد / التزام */}
      {isCommitmentModalOpen && (
        <TaskCommitmentModal
          isOpen={isCommitmentModalOpen}
          onClose={() => setIsCommitmentModalOpen(false)}
          onSave={(comm) => {
            onSaveCommitment?.(comm);
            setIsCommitmentModalOpen(false);
          }}
          existingCommitments={commitments}
        />
      )}

      {/* Unified Work OS Quick Add Modal (+ طلبية، مهمة، التزام، موعد، مشروع...) */}
      {isWorkOSQuickAddOpen && (
        <WorkOSQuickAddModal
          isOpen={isWorkOSQuickAddOpen}
          onClose={() => setIsWorkOSQuickAddOpen(false)}
          initialType={workOSQuickAddType}
          projects={workOSData.projects}
          team={workOSData.team}
          onAddTask={() => {
            setWorkOSTasksVersion((v) => v + 1);
            setWorkOSData(loadWorkOSData());
            setIsWorkOSQuickAddOpen(false);
          }}
          onAddOrder={() => {
            setDashboardOrders(loadWorkOSOrders());
            setWorkOSData(loadWorkOSData());
            setWorkOSTasksVersion((v) => v + 1);
            setIsWorkOSQuickAddOpen(false);
            setActiveOpsTab('orders_ledger');
          }}
          onAddProject={() => {
            setWorkOSData(loadWorkOSData());
            setIsWorkOSQuickAddOpen(false);
          }}
          onAddNote={() => {
            setIsWorkOSQuickAddOpen(false);
          }}
          onAddAppointment={() => {
            setIsWorkOSQuickAddOpen(false);
          }}
          onAddCommitment={() => {
            setWorkOSData(loadWorkOSData());
            setIsWorkOSQuickAddOpen(false);
          }}
          onAddHabit={() => {
            setIsWorkOSQuickAddOpen(false);
          }}
          onAddGoal={() => {
            setIsWorkOSQuickAddOpen(false);
          }}
        />
      )}
    </div>
  );
};
