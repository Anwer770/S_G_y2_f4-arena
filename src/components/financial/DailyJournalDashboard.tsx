import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  FileText,
  TrendingUp,
  TrendingDown,
  Printer,
  Download,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Moon,
  Sun,
  Bell,
  X,
  Keyboard,
  Coins,
  ShieldCheck,
  FileSpreadsheet,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
  MoreVertical,
  CheckSquare,
  Square,
  ExternalLink,
} from 'lucide-react';
import { FinancialTransaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface DailyJournalDashboardProps {
  initialTransactions?: FinancialTransaction[];
  onSaveTransaction?: (txn: FinancialTransaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onNavigateTab?: (tab: string) => void;
  isStandalone?: boolean;
}

export const DailyJournalDashboard: React.FC<DailyJournalDashboardProps> = ({
  initialTransactions,
  onSaveTransaction,
  onDeleteTransaction,
  onNavigateTab,
  isStandalone = true,
}) => {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
    }
    return false;
  });

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('app_theme_mode', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('app_theme_mode', 'light');
      }
      return next;
    });
  };

  // Mock initial transactions if not provided
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    if (initialTransactions && initialTransactions.length > 0) {
      return initialTransactions;
    }
    return [
      {
        id: 'ACC-1048',
        day: 'الخميس',
        date: '2026-11-06',
        importance: '√',
        movement: 'ايرادات',
        restriction: 'سند قبض',
        movementType: 'نقدا',
        categoryAccount: 'مبيعات نقدية',
        restrictionAccount: 'الخزينة الرئيسية',
        accountName: 'صندوق المبيعات اليومي',
        description: 'توريد إيرادات المبيعات النقدية للوردية المسائية',
        number: 'RV-8901',
        amountYER: 485000,
        amountSAR: 0,
        amountUSD: 0,
        isDraft: false,
      },
      {
        id: 'ACC-1047',
        day: 'الخميس',
        date: '2026-11-06',
        importance: 'A',
        movement: 'منصرف',
        restriction: 'سند صرف',
        movementType: 'كريمي',
        categoryAccount: 'مصروفات تشغيل',
        restrictionAccount: 'بنك الكريمي',
        accountName: 'شركة النقل واللوجستيات',
        description: 'سداد مصاريف شحن وتوزيع طلبيات الأدوية والمستلزمات',
        number: 'PV-4102',
        amountYER: 125000,
        amountSAR: 0,
        amountUSD: 0,
        isDraft: false,
      },
      {
        id: 'ACC-1046',
        day: 'الخميس',
        date: '2026-11-06',
        importance: '√',
        movement: 'الصندوق',
        restriction: 'قيد يومية',
        movementType: 'حوالة',
        categoryAccount: 'عملاء آجل',
        restrictionAccount: 'مستشفى الأمل التخصصي',
        accountName: 'حساب العملاء المدينين',
        description: 'سند تسوية دفعة تحت الحساب لمبيعات الأسبوع الأول',
        number: 'JV-2098',
        amountYER: 920000,
        amountSAR: 0,
        amountUSD: 0,
        isDraft: false,
      },
      {
        id: 'ACC-1045',
        day: 'الأربعاء',
        date: '2026-11-05',
        importance: 'B',
        movement: 'منصرف',
        restriction: 'سند صرف',
        movementType: 'نقدا',
        categoryAccount: 'صيانة ومرافق',
        restrictionAccount: 'الخزينة الرئيسية',
        accountName: 'مؤسسة التكييف والكهرباء',
        description: 'صيانة طارئة لوحدات التبريد في المستودع المركزي',
        number: 'PV-4101',
        amountYER: 68500,
        amountSAR: 0,
        amountUSD: 0,
        isDraft: false,
      },
      {
        id: 'ACC-1044',
        day: 'الأربعاء',
        date: '2026-11-05',
        importance: 'معلق',
        movement: 'ايرادات',
        restriction: 'سند قبض',
        movementType: 'شيك',
        categoryAccount: 'تحصيل شيكات',
        restrictionAccount: 'بنك التضامن',
        accountName: 'مجمع الشفاء الطبي',
        description: 'شيك مؤجل الدفع رقم 88471 مستحق في 15 نوفمبر',
        number: 'RV-8900',
        amountYER: 650000,
        amountSAR: 0,
        amountUSD: 0,
        isDraft: true,
      },
      {
        id: 'ACC-1043',
        day: 'الأربعاء',
        date: '2026-11-05',
        importance: '√',
        movement: 'الصندوق',
        restriction: 'سند تحويل',
        movementType: 'نقدا',
        categoryAccount: 'تحويل بين الخزائن',
        restrictionAccount: 'خزينة الفرع الشمالي',
        accountName: 'الخزينة الرئيسية',
        description: 'تغذية صندوق الفرع لمواجهة المدفوعات الدورية',
        number: 'TR-102',
        amountYER: 300000,
        amountSAR: 0,
        amountUSD: 0,
        isDraft: false,
      },
      {
        id: 'ACC-1042',
        day: 'الثلاثاء',
        date: '2026-11-04',
        importance: '√',
        movement: 'ايرادات',
        restriction: 'سند قبض',
        movementType: 'حوالة',
        categoryAccount: 'مبيعات جملة',
        restrictionAccount: 'حساب النقد الأجنبي',
        accountName: 'مكتب الهلال للتوزيع',
        description: 'تحصيل فاتورة مبيعات محاليل ومطهرات بالدولار الأمريكي',
        number: 'RV-8899',
        amountYER: 0,
        amountSAR: 0,
        amountUSD: 2450,
        isDraft: false,
      },
      {
        id: 'ACC-1041',
        day: 'الثلاثاء',
        date: '2026-11-04',
        importance: 'A',
        movement: 'منصرف',
        restriction: 'سند صرف',
        movementType: 'صراف',
        categoryAccount: 'مشتريات مواد',
        restrictionAccount: 'شركة النجم للصرافة',
        accountName: 'مجموعة الموردين المعتمدين',
        description: 'دفعة سداد فاتورة توريد كراتين ومواد تغليف طبية',
        number: 'PV-4100',
        amountYER: 340000,
        amountSAR: 0,
        amountUSD: 0,
        isDraft: false,
      },
      {
        id: 'ACC-1040',
        day: 'الإثنين',
        date: '2026-11-03',
        importance: '√',
        movement: 'ايرادات',
        restriction: 'سند قبض',
        movementType: 'نقدا',
        categoryAccount: 'مبيعات قطاعي',
        restrictionAccount: 'الخزينة الرئيسية',
        accountName: 'صندوق المبيعات المباشرة',
        description: 'إيراد مبيعات قطاعية عبر نقاط البيع المباشر',
        number: 'RV-8898',
        amountYER: 532000,
        amountSAR: 0,
        amountUSD: 0,
        isDraft: false,
      },
      {
        id: 'ACC-1039',
        day: 'الإثنين',
        date: '2026-11-03',
        importance: '√',
        movement: 'منصرف',
        restriction: 'سند صرف',
        movementType: 'نقدا',
        categoryAccount: 'ضيافة وبوفيه',
        restrictionAccount: 'الخزينة الرئيسية',
        accountName: 'مصاريف إدارة العمليات',
        description: 'مستلزمات الضيافة الأسبوعية واجتماعات الإدارة العامة',
        number: 'PV-4099',
        amountYER: 24500,
        amountSAR: 0,
        amountUSD: 0,
        isDraft: false,
      },
      {
        id: 'ACC-1038',
        day: 'الأحد',
        date: '2026-11-02',
        importance: 'B',
        movement: 'ايرادات',
        restriction: 'سند قبض',
        movementType: 'نقدا',
        categoryAccount: 'مبيعات كاش',
        restrictionAccount: 'الخزينة الرئيسية',
        accountName: 'عملاء نقدي متنوع',
        description: 'دفعة نقدية مسددة مباشرة في الصندوق المركزي',
        number: 'RV-8897',
        amountYER: 420000,
        amountSAR: 0,
        amountUSD: 0,
        isDraft: false,
      },
      {
        id: 'ACC-1037',
        day: 'الأحد',
        date: '2026-11-02',
        importance: '√',
        movement: 'منصرف',
        restriction: 'سند صرف',
        movementType: 'نقدا',
        categoryAccount: 'إيجارات ومباني',
        restrictionAccount: 'الخزينة الرئيسية',
        accountName: 'مالك مبنى المستودعات',
        description: 'قسط إيجار المستودع الإضافي لشهر نوفمبر 2026',
        number: 'PV-4098',
        amountYER: 450000,
        amountSAR: 0,
        amountUSD: 0,
        isDraft: false,
      },
      {
        id: 'ACC-1036',
        day: 'السبت',
        date: '2026-11-01',
        importance: 'A',
        movement: 'ايرادات',
        restriction: 'سند قبض',
        movementType: 'حوالة',
        categoryAccount: 'مبيعات إقليمية',
        restrictionAccount: 'بنك التضامن',
        accountName: 'وكيل تعز - صيدليات السلام',
        description: 'سداد جزئي لفاتورة مبيعات الأدوية الشهرية',
        number: 'RV-8896',
        amountYER: 1250000,
        amountSAR: 0,
        amountUSD: 0,
        isDraft: false,
      },
      {
        id: 'ACC-1035',
        day: 'السبت',
        date: '2026-11-01',
        importance: '√',
        movement: 'منصرف',
        restriction: 'سند صرف',
        movementType: 'كريمي',
        categoryAccount: 'كهرباء وطاقة',
        restrictionAccount: 'بنك الكريمي',
        accountName: 'المؤسسة العامة للكهرباء',
        description: 'سداد فاتورة استهلاك التيار التجاري لشهر أكتوبر',
        number: 'PV-4097',
        amountYER: 178000,
        amountSAR: 0,
        amountUSD: 0,
        isDraft: false,
      },
      {
        id: 'ACC-1034',
        day: 'السبت',
        date: '2026-11-01',
        importance: 'معلق',
        movement: 'منصرف',
        restriction: 'قيد تسوية',
        movementType: 'آجل',
        categoryAccount: 'تسويات سنوية',
        restrictionAccount: 'مخصص إهلاك الأصول',
        accountName: 'مجمع الأصول الثابتة',
        description: 'تسجيل إهلاك السيارات والأجهزة المكتبية لشهر نوفمبر',
        number: 'JV-2097',
        amountYER: 95000,
        amountSAR: 0,
        amountUSD: 0,
        isDraft: true,
      },
    ];
  });

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'quarter' | 'all'>('month');
  const [typeFilter, setTypeFilter] = useState<'all' | 'receipt' | 'payment' | 'journal' | 'transfer'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'YER' | 'SAR' | 'USD'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'posted' | 'draft'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingTxn, setViewingTxn] = useState<FinancialTransaction | null>(null);
  const [editingTxn, setEditingTxn] = useState<FinancialTransaction | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Search input ref for Ctrl+K
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Shortcuts (Alt+N, Ctrl+K, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + N -> Open New Voucher Modal
      if (e.altKey && (e.key === 'n' || e.key === 'N' || e.code === 'KeyN')) {
        e.preventDefault();
        setEditingTxn(null);
        setIsAddModalOpen(true);
        return;
      }

      // Ctrl + K -> Focus Search
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Escape -> Close Modals
      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
        setViewingTxn(null);
        setEditingTxn(null);
        setNotificationsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesNumber = t.number?.toLowerCase().includes(query) || t.id.toLowerCase().includes(query);
        const matchesDesc = t.description?.toLowerCase().includes(query);
        const matchesAccount = t.accountName?.toLowerCase().includes(query) || t.restrictionAccount?.toLowerCase().includes(query);
        const matchesCategory = t.categoryAccount?.toLowerCase().includes(query);
        if (!matchesNumber && !matchesDesc && !matchesAccount && !matchesCategory) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'receipt' && !t.restriction?.includes('قبض') && t.movement !== 'ايرادات') return false;
        if (typeFilter === 'payment' && !t.restriction?.includes('صرف') && t.movement !== 'منصرف') return false;
        if (typeFilter === 'journal' && !t.restriction?.includes('قيد')) return false;
        if (typeFilter === 'transfer' && !t.restriction?.includes('تحويل')) return false;
      }

      // Currency filter
      if (currencyFilter !== 'all') {
        if (currencyFilter === 'YER' && (t.amountYER || 0) <= 0) return false;
        if (currencyFilter === 'SAR' && (t.amountSAR || 0) <= 0) return false;
        if (currencyFilter === 'USD' && (t.amountUSD || 0) <= 0) return false;
      }

      // Status filter
      if (statusFilter === 'posted' && t.isDraft) return false;
      if (statusFilter === 'draft' && !t.isDraft) return false;

      // Period filter (relative to dummy dates)
      if (periodFilter === 'today') {
        return t.date === '2026-11-06';
      }
      if (periodFilter === 'week') {
        return t.date >= '2026-11-01';
      }
      if (periodFilter === 'month') {
        return t.date.startsWith('2026-11');
      }

      return true;
    });
  }, [transactions, searchQuery, typeFilter, currencyFilter, statusFilter, periodFilter]);

  // Compute KPI Summaries for the active period
  const kpiStats = useMemo(() => {
    let totalInflowYER = 0;
    let totalExpenseYER = 0;
    let totalInflowUSD = 0;
    let totalExpenseUSD = 0;
    let totalCount = filteredTransactions.length;
    let draftCount = 0;
    let postedCount = 0;

    filteredTransactions.forEach((t) => {
      if (t.isDraft) {
        draftCount++;
      } else {
        postedCount++;
      }

      const isInflow = t.movement === 'ايرادات' || t.restriction?.includes('قبض');
      const isExpense = t.movement === 'منصرف' || t.restriction?.includes('صرف');

      if (t.amountYER) {
        if (isInflow) totalInflowYER += t.amountYER;
        if (isExpense) totalExpenseYER += t.amountYER;
      }
      if (t.amountUSD) {
        if (isInflow) totalInflowUSD += t.amountUSD;
        if (isExpense) totalExpenseUSD += t.amountUSD;
      }
    });

    const netYER = totalInflowYER - totalExpenseYER;

    return {
      totalInflowYER,
      totalExpenseYER,
      netYER,
      totalInflowUSD,
      totalExpenseUSD,
      totalCount,
      draftCount,
      postedCount,
    };
  }, [filteredTransactions]);

  // Row selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  const handleToggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Delete handler
  const handleDeleteRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذا القيد المالي نهائياً؟')) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      if (onDeleteTransaction) onDeleteTransaction(id);
    }
  };

  // Duplicate handler
  const handleDuplicateRow = (txn: FinancialTransaction, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTxn: FinancialTransaction = {
      ...txn,
      id: `ACC-${Date.now().toString().slice(-4)}`,
      number: `COPY-${txn.number}`,
      date: new Date().toISOString().split('T')[0],
      isDraft: true,
    };
    setTransactions((prev) => [newTxn, ...prev]);
  };

  // Add / Edit Form State
  const [formType, setFormType] = useState<'receipt' | 'payment' | 'journal'>('receipt');
  const [formNumber, setFormNumber] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formAccountDebit, setFormAccountDebit] = useState('');
  const [formAccountCredit, setFormAccountCredit] = useState('');
  const [formAmountYER, setFormAmountYER] = useState<number | ''>('');
  const [formAmountUSD, setFormAmountUSD] = useState<number | ''>('');
  const [formDesc, setFormDesc] = useState('');
  const [formIsDraft, setFormIsDraft] = useState(false);

  const handleOpenAddModal = () => {
    setFormType('receipt');
    setFormNumber(`RV-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormAccountDebit('الخزينة الرئيسية (صندوق النقد)');
    setFormAccountCredit('حساب الإيرادات والمبيعات');
    setFormAmountYER('');
    setFormAmountUSD('');
    setFormDesc('');
    setFormIsDraft(false);
    setIsAddModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmountYER && !formAmountUSD) {
      alert('الرجاء إدخال مبلغ صحيح بالريال اليمني أو الدولار');
      return;
    }

    const newTxn: FinancialTransaction = {
      id: editingTxn ? editingTxn.id : `ACC-${Date.now().toString().slice(-4)}`,
      day: 'الخميس',
      date: formDate,
      importance: '√',
      movement: formType === 'receipt' ? 'ايرادات' : formType === 'payment' ? 'منصرف' : 'الصندوق',
      restriction: formType === 'receipt' ? 'سند قبض' : formType === 'payment' ? 'سند صرف' : 'قيد يومية',
      movementType: 'نقدا',
      categoryAccount: formAccountDebit,
      restrictionAccount: formAccountCredit,
      accountName: formType === 'receipt' ? formAccountCredit : formAccountDebit,
      description: formDesc || 'قيد مالي معتمد عبر واجهة السجل اليومي',
      number: formNumber || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      amountYER: Number(formAmountYER) || 0,
      amountSAR: 0,
      amountUSD: Number(formAmountUSD) || 0,
      isDraft: formIsDraft,
    };

    if (editingTxn) {
      setTransactions((prev) => prev.map((t) => (t.id === editingTxn.id ? newTxn : t)));
    } else {
      setTransactions((prev) => [newTxn, ...prev]);
    }

    if (onSaveTransaction) onSaveTransaction(newTxn);

    setIsAddModalOpen(false);
    setEditingTxn(null);
  };

  // Nav Items for Sidebar
  const sidebarNavItems = [
    { id: 'dashboard', label: 'لوحة القيادة والمؤشرات', badge: '1', active: false },
    { id: 'journal', label: 'إدارة السجل اليومي', badge: '2', active: true },
    { id: 'ledger', label: 'دفتر الأستاذ العام', badge: '3', active: false },
    { id: 'receipts', label: 'سندات القبض (الوارد)', badge: '4', active: false },
    { id: 'payments', label: 'سندات الصرف (المنصرف)', badge: '5', active: false },
    { id: 'statement', label: 'كشوفات الحسابات', badge: '6', active: false },
    { id: 'trial_balance', label: 'ميزان المراجعة والأرباح', badge: '7', active: false },
    { id: 'reconciliation', label: 'التسويات البنكية والعهد', badge: '8', active: false },
    { id: 'settings', label: 'الإعدادات وشجرة الحسابات', badge: '9', active: false },
  ];

  return (
    <div className="flex h-screen w-full bg-[#F8F9FA] dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans select-none" dir="rtl">
      {/* ========================================================================= */}
      {/* 1. SIDEBAR (Right: Width 260px, solid deep dark green #0B2B26) */}
      {/* ========================================================================= */}
      <aside
        className={`${
          isSidebarCollapsed ? 'w-20' : 'w-[260px]'
        } shrink-0 bg-[#0B2B26] text-white flex flex-col justify-between transition-all duration-300 z-30 shadow-xl border-l border-[#134E48]/50`}
      >
        {/* Sidebar Brand Header */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#134E48]/60">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-[#10B981] text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                ق
              </div>
              {!isSidebarCollapsed && (
                <div className="leading-tight">
                  <span className="font-bold text-sm tracking-wide text-white block">
                    المنظومة المحاسبية
                  </span>
                  <span className="text-[11px] text-[#A7F3D0] block font-medium">
                    إدارة السجل اليومي • v2.6
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="p-1.5 text-emerald-200/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title={isSidebarCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
            >
              {isSidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin">
            {sidebarNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (onNavigateTab && item.id !== 'journal') onNavigateTab(item.id);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  item.active
                    ? 'bg-[#10B981] text-white shadow-sm font-bold'
                    : 'text-emerald-100/80 hover:bg-[#134E48]/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                      item.active ? 'bg-white/20 text-white' : 'bg-[#06201C] text-emerald-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isSidebarCollapsed && item.active && (
                  <span className="w-2 h-2 rounded-full bg-white shadow-xs shrink-0" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        {!isSidebarCollapsed && (
          <div className="p-3.5 border-t border-[#134E48]/60 bg-[#07201D]/90 text-[11px] text-emerald-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">الخزينة النشطة:</span>
              <span className="text-emerald-300 font-mono font-bold">الرئيسية (YER)</span>
            </div>
            <div className="text-[10px] text-emerald-300/60 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>تزامن السحاب مفعّل • فوري</span>
            </div>
          </div>
        )}
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN VIEW AREA (Header + Content + Footer) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header: Height 64px, clean white/neutral background */}
        <header className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between z-20 shrink-0 shadow-2xs">
          {/* Right Section: Screen Title & System Status */}
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  إدارة السجل اليومي والقيود المحاسبية
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#065F46] dark:bg-emerald-950/40 dark:text-emerald-300 border-0">
                  مباشر
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                دفتر اليومية العامة • تتبع الوارد والمنصرف والقيود المتوازنة
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-full text-xs text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-medium text-[11px]">النظام متصل • تحديث لحظي</span>
            </div>
          </div>

          {/* Left Section: Search, Theme Toggle, Notification Bell, User Badge */}
          <div className="flex items-center gap-3">
            {/* Quick Search Bar with Ctrl+K */}
            <div className="relative w-56 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في القيود (Ctrl+K)..."
                className="w-full pl-12 pr-9 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#10B981] focus:border-[#10B981] transition-all"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-700 px-1 rounded border border-slate-200 dark:border-slate-600 pointer-events-none">
                  ⌘K
                </span>
              )}
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={isDark ? 'التحويل للوضع النهاري' : 'التحويل للوضع الليلي'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative cursor-pointer"
                title="الإشعارات والمسودات"
              >
                <Bell className="w-4 h-4" />
                {kpiStats.draftCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-800 dark:text-slate-200">تنبيهات السجل المالي</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                      {kpiStats.draftCount} مسودة
                    </span>
                  </div>
                  <div className="space-y-2 text-slate-600 dark:text-slate-400">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                        قيود بانتظار الاعتماد النهائي
                      </span>
                      <span>يوجد {kpiStats.draftCount} قيود مالية مسجلة كمسودات تتطلب المراجعة.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-[#F8F9FA] dark:bg-slate-950">
          {/* ========================================================================= */}
          {/* 3. KPI SUMMARY CARDS (Top Section: 4-Card Responsive Grid) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: وارد الفترة (Inflow - Green #10B981) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all hover:border-emerald-300">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">وارد الفترة (قبض وإيرادات)</span>
                <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#10B981] flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold font-mono text-[#10B981] tracking-tight">
                  {formatCurrency(kpiStats.totalInflowYER)}
                  <span className="text-xs font-bold text-slate-400 mr-1.5 font-sans">YER</span>
                </div>
                {kpiStats.totalInflowUSD > 0 && (
                  <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    + ${kpiStats.totalInflowUSD.toLocaleString()} USD
                  </div>
                )}
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 text-[#059669] font-bold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +18.4% نمو التدفق
                </span>
                <span className="text-slate-400">مقارنة بالشهر السابق</span>
              </div>
            </div>

            {/* Card 2: مصروف الفترة (Expense - Red #EF4444) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all hover:border-rose-300">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">مصروف الفترة (صرف ونفقات)</span>
                <div className="w-8 h-8 rounded-lg bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold font-mono text-[#EF4444] tracking-tight">
                  {formatCurrency(kpiStats.totalExpenseYER)}
                  <span className="text-xs font-bold text-slate-400 mr-1.5 font-sans">YER</span>
                </div>
                {kpiStats.totalExpenseUSD > 0 && (
                  <div className="text-xs font-mono text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                    - ${kpiStats.totalExpenseUSD.toLocaleString()} USD
                  </div>
                )}
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 text-[#DC2626] font-bold">
                  <TrendingDown className="w-3.5 h-3.5" />
                  -6.2% انخفاض المصروف
                </span>
                <span className="text-slate-400">ضمن الموازنة المعتمدة</span>
              </div>
            </div>

            {/* Card 3: صافي الفترة (Net Balance) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all hover:border-blue-300">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">صافي الفترة (الفائض التشغيلي)</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div
                  className={`text-2xl font-bold font-mono tracking-tight ${
                    kpiStats.netYER >= 0 ? 'text-slate-900 dark:text-white' : 'text-[#EF4444]'
                  }`}
                >
                  {kpiStats.netYER >= 0 ? '+' : ''}
                  {formatCurrency(kpiStats.netYER)}
                  <span className="text-xs font-bold text-slate-400 mr-1.5 font-sans">YER</span>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                  نسبة السيولة النقدية: 68.4%
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  مركز مالي إيجابي مستقر
                </span>
                <span className="text-slate-400">صافي الأرباح المقدرة</span>
              </div>
            </div>

            {/* Card 4: عدد الحركات والمسودات */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all hover:border-indigo-300">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">إجمالي قيود الفترة</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
                  {kpiStats.totalCount}
                  <span className="text-xs font-bold text-slate-400 mr-1.5 font-sans">قيد</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] font-bold">
                    {kpiStats.postedCount} معتمد
                  </span>
                  {kpiStats.draftCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold">
                      {kpiStats.draftCount} مسودة
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>توازن القيد المزدوج: 100%</span>
                <span className="text-emerald-600 font-bold">مطابق دفترياً</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. ADVANCED STICKY FILTER BAR & CONTROLS (High Data Density) */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-3 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Right Side: Period & Movement Type Tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Period Pills */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setPeriodFilter('today')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      periodFilter === 'today'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    اليوم
                  </button>
                  <button
                    onClick={() => setPeriodFilter('week')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      periodFilter === 'week'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    هذا الأسبوع
                  </button>
                  <button
                    onClick={() => setPeriodFilter('month')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      periodFilter === 'month'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    هذا الشهر
                  </button>
                  <button
                    onClick={() => setPeriodFilter('all')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      periodFilter === 'all'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    كافة الفترات
                  </button>
                </div>

                <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                {/* Movement Type Filter */}
                <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                      typeFilter === 'all'
                        ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    جميع الحركات ({transactions.length})
                  </button>
                  <button
                    onClick={() => setTypeFilter('receipt')}
                    className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                      typeFilter === 'receipt'
                        ? 'bg-[#10B981] text-white font-bold'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    سندات قبض (وارد)
                  </button>
                  <button
                    onClick={() => setTypeFilter('payment')}
                    className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                      typeFilter === 'payment'
                        ? 'bg-[#EF4444] text-white font-bold'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 hover:bg-rose-100'
                    }`}
                  >
                    سندات صرف (منصرف)
                  </button>
                  <button
                    onClick={() => setTypeFilter('journal')}
                    className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                      typeFilter === 'journal'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-100'
                    }`}
                  >
                    قيود يومية
                  </button>
                </div>
              </div>

              {/* Left Side: Currency, Drafts Toggle, View Switcher & Primary Action */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Currency Selector */}
                <select
                  value={currencyFilter}
                  onChange={(e) => setCurrencyFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <option value="all">كافة العملات</option>
                  <option value="YER">ريال يمني (YER)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="SAR">ريال سعودي (SAR)</option>
                </select>

                {/* Status Toggle (Drafts) */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <option value="all">كل الحالات</option>
                  <option value="posted">المعتمدة فقط</option>
                  <option value="draft">المسودات فقط ({kpiStats.draftCount})</option>
                </select>

                {/* Table vs Cards Toggle */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'
                    }`}
                    title="عرض الجدول المدمج (38px)"
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === 'cards' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'
                    }`}
                    title="عرض البطاقات"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Primary Button: + قيد جديد (Alt+N) in #10B981 */}
                <button
                  onClick={handleOpenAddModal}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer border border-emerald-400/40 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ قيد جديد</span>
                  <span className="hidden sm:inline-block px-1 py-0.2 text-[10px] font-mono bg-white/20 rounded text-emerald-50">
                    Alt+N
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. DATA TABLE & HIGH-DENSITY ROWS (Row Height: 38px) */}
          {/* ========================================================================= */}
          {viewMode === 'table' ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto max-h-[calc(100vh-360px)] min-h-[380px] overflow-y-auto scrollbar-thin">
                <table className="w-full text-right text-xs border-collapse min-w-[1000px]">
                  {/* Table Header */}
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold select-none h-9">
                      <th className="w-10 px-3 text-center sticky right-0 z-30 bg-slate-100/95 dark:bg-slate-800/95">
                        <input
                          type="checkbox"
                          checked={filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length}
                          onChange={handleSelectAll}
                          className="rounded text-[#10B981] focus:ring-emerald-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-2 px-3 w-28">رقم القيد / السند</th>
                      <th className="py-2 px-3 w-28">التاريخ واليوم</th>
                      <th className="py-2 px-3 w-28">نوع السند</th>
                      <th className="py-2 px-3">البيان والتفاصيل المحاسبية</th>
                      <th className="py-2 px-3 w-36">حساب التقييد</th>
                      <th className="py-2 px-3 w-32 text-left font-mono text-[#059669]">الوارد (مدين)</th>
                      <th className="py-2 px-3 w-32 text-left font-mono text-[#DC2626]">المنصرف (دائن)</th>
                      <th className="py-2 px-3 w-20 text-center">العملة</th>
                      <th className="py-2 px-3 w-24 text-center">الحالة</th>
                      <th className="py-2 px-3 w-28 text-center sticky left-0 z-20 bg-slate-100/95 dark:bg-slate-800/95">
                        إجراءات
                      </th>
                    </tr>
                  </thead>

                  {/* Table Body: Strict 38px row height */}
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[12px]">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400">
                          لا توجد قيود مالية مطابقة لمعايير البحث والتصفية المحددة.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t, idx) => {
                        const isSelected = selectedIds.has(t.id);
                        const isActive = activeRowId === t.id;
                        const isInflow = t.movement === 'ايرادات' || t.restriction?.includes('قبض');
                        const isExpense = t.movement === 'منصرف' || t.restriction?.includes('صرف');

                        return (
                          <tr
                            key={t.id}
                            onClick={() => setActiveRowId(t.id)}
                            className={`h-[38px] transition-colors cursor-pointer group ${
                              isSelected
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/30'
                                : isActive
                                ? 'bg-slate-100/70 dark:bg-slate-800/60'
                                : idx % 2 === 0
                                ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                : 'bg-[#FAFAFA] dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="px-3 text-center sticky right-0 bg-inherit z-10">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleToggleSelectRow(t.id, e as any)}
                                className="rounded text-[#10B981] focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>

                            {/* Reference Number */}
                            <td className="px-3 font-mono font-bold text-slate-900 dark:text-slate-100 truncate">
                              {t.number || t.id}
                            </td>

                            {/* Date & Day */}
                            <td className="px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] truncate">
                              {t.date} <span className="text-slate-400 font-sans">({t.day})</span>
                            </td>

                            {/* Movement Type */}
                            <td className="px-3 font-medium">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  isInflow
                                    ? 'bg-[#ECFDF5] text-[#065F46] dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : isExpense
                                    ? 'bg-[#FEF2F2] text-[#991B1B] dark:bg-rose-950/40 dark:text-rose-300'
                                    : 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                                }`}
                              >
                                {t.restriction || t.movement}
                              </span>
                            </td>

                            {/* Description */}
                            <td className="px-3 text-slate-700 dark:text-slate-300 truncate max-w-xs" title={t.description}>
                              {t.description || '—'}
                            </td>

                            {/* Account Name */}
                            <td className="px-3 text-slate-600 dark:text-slate-400 font-semibold truncate max-w-[140px]" title={t.restrictionAccount}>
                              {t.restrictionAccount || t.categoryAccount || '—'}
                            </td>

                            {/* Inflow Amount (Green #10B981) */}
                            <td className="px-3 text-left font-mono font-bold text-[#059669]">
                              {isInflow ? (
                                t.amountYER > 0 ? (
                                  formatCurrency(t.amountYER)
                                ) : t.amountUSD > 0 ? (
                                  `$${t.amountUSD.toLocaleString()}`
                                ) : (
                                  '—'
                                )
                              ) : (
                                '—'
                              )}
                            </td>

                            {/* Outflow Amount (Red #EF4444) */}
                            <td className="px-3 text-left font-mono font-bold text-[#DC2626]">
                              {isExpense ? (
                                t.amountYER > 0 ? (
                                  formatCurrency(t.amountYER)
                                ) : t.amountUSD > 0 ? (
                                  `$${t.amountUSD.toLocaleString()}`
                                ) : (
                                  '—'
                                )
                              ) : (
                                '—'
                              )}
                            </td>

                            {/* Currency */}
                            <td className="px-3 text-center font-mono text-[11px] font-bold text-slate-500">
                              {t.amountUSD > 0 ? 'USD' : t.amountSAR > 0 ? 'SAR' : 'YER'}
                            </td>

                            {/* Status Tag (Soft pill without harsh border) */}
                            <td className="px-3 text-center">
                              {t.isDraft ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                  مسودة
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#065F46] dark:bg-emerald-950/40 dark:text-emerald-300">
                                  معتمد
                                </span>
                              )}
                            </td>

                            {/* Actions (View, Edit, Duplicate, Delete) */}
                            <td className="px-2 text-center sticky left-0 bg-inherit z-10">
                              <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingTxn(t);
                                  }}
                                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors"
                                  title="معاينة السند"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTxn(t);
                                    setFormType(t.movement === 'ايرادات' ? 'receipt' : t.movement === 'منصرف' ? 'payment' : 'journal');
                                    setFormNumber(t.number);
                                    setFormDate(t.date);
                                    setFormAccountDebit(t.categoryAccount);
                                    setFormAccountCredit(t.restrictionAccount);
                                    setFormAmountYER(t.amountYER || '');
                                    setFormAmountUSD(t.amountUSD || '');
                                    setFormDesc(t.description || '');
                                    setFormIsDraft(!!t.isDraft);
                                    setIsAddModalOpen(true);
                                  }}
                                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors"
                                  title="تعديل القيد"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleDuplicateRow(t, e)}
                                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors"
                                  title="تكرار القيد"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteRow(t.id, e)}
                                  className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded text-rose-600 dark:text-rose-400 transition-colors"
                                  title="حذف القيد"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Bottom Fixed Totals Summary Bar */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <span className="font-bold">
                    معروض {filteredTransactions.length} من أصل {transactions.length} قيد مالي
                  </span>
                  {selectedIds.size > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                      تم تحديد {selectedIds.size} قيد
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 font-mono font-bold">
                  <div>
                    <span className="text-slate-500 font-sans ml-1 text-[11px]">إجمالي الوارد:</span>
                    <span className="text-[#059669]">{formatCurrency(kpiStats.totalInflowYER)} YER</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans ml-1 text-[11px]">إجمالي المنصرف:</span>
                    <span className="text-[#DC2626]">{formatCurrency(kpiStats.totalExpenseYER)} YER</span>
                  </div>
                  <div className="border-r border-slate-300 dark:border-slate-600 pr-3">
                    <span className="text-slate-500 font-sans ml-1 text-[11px]">الصافي:</span>
                    <span className={kpiStats.netYER >= 0 ? 'text-slate-900 dark:text-white' : 'text-[#DC2626]'}>
                      {formatCurrency(kpiStats.netYER)} YER
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Cards View for Mobile/Alternative mode */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTransactions.map((t) => {
                const isInflow = t.movement === 'ايرادات' || t.restriction?.includes('قبض');
                const isExpense = t.movement === 'منصرف' || t.restriction?.includes('صرف');
                return (
                  <div
                    key={t.id}
                    onClick={() => setViewingTxn(t)}
                    className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5 cursor-pointer hover:border-[#10B981] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {t.number || t.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isInflow
                            ? 'bg-[#ECFDF5] text-[#065F46]'
                            : isExpense
                            ? 'bg-[#FEF2F2] text-[#991B1B]'
                            : 'bg-blue-50 text-blue-800'
                        }`}
                      >
                        {t.restriction || t.movement}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                      {t.description || '—'}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">{t.date}</span>
                      <div className="font-mono font-bold text-sm">
                        {isInflow && (
                          <span className="text-[#059669]">
                            +{formatCurrency(t.amountYER || t.amountUSD)} {t.amountUSD > 0 ? 'USD' : 'YER'}
                          </span>
                        )}
                        {isExpense && (
                          <span className="text-[#DC2626]">
                            -{formatCurrency(t.amountYER || t.amountUSD)} {t.amountUSD > 0 ? 'USD' : 'YER'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL: + قيد جديد (Alt+N) / تعديل قيد */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#10B981] text-white flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {editingTxn ? 'تعديل القيد المالي' : 'إضافة قيد مالي جديد بالسجل اليومي'}
                  </h3>
                  <span className="text-[11px] text-slate-400">إدخال معتمد • Alt+N</span>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-5 space-y-4 text-xs">
              {/* Movement Type Toggle */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  نوع الحركة / السند
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('receipt');
                      setFormAccountDebit('الخزينة الرئيسية (صندوق النقد)');
                      setFormAccountCredit('حساب الإيرادات والمبيعات');
                    }}
                    className={`py-2 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                      formType === 'receipt'
                        ? 'bg-[#10B981] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    سند قبض (وارد)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('payment');
                      setFormAccountDebit('مصروفات عمومية وتشغيلية');
                      setFormAccountCredit('الخزينة الرئيسية (صندوق النقد)');
                    }}
                    className={`py-2 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                      formType === 'payment'
                        ? 'bg-[#EF4444] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    سند صرف (منصرف)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('journal');
                      setFormAccountDebit('حساب المدينين');
                      setFormAccountCredit('حساب الدائنين');
                    }}
                    className={`py-2 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                      formType === 'journal'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    قيد يومية مزدوج
                  </button>
                </div>
              </div>

              {/* Number and Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم السند / المرجع
                  </label>
                  <input
                    type="text"
                    required
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ العملية
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Accounts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الحساب المدين (منه)
                  </label>
                  <input
                    type="text"
                    required
                    value={formAccountDebit}
                    onChange={(e) => setFormAccountDebit(e.target.value)}
                    placeholder="مثال: الخزينة الرئيسية"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الحساب الدائن (إليه)
                  </label>
                  <input
                    type="text"
                    required
                    value={formAccountCredit}
                    onChange={(e) => setFormAccountCredit(e.target.value)}
                    placeholder="مثال: مبيعات نقدية"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المبلغ بالريال اليمني (YER)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formAmountYER}
                    onChange={(e) => setFormAmountYER(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المبلغ بالدولار الأمريكي (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formAmountUSD}
                    onChange={(e) => setFormAmountUSD(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البيان والوصف التفصيلي
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="اكتب شرحاً وافياً للعملية المحاسبية..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs resize-none"
                />
              </div>

              {/* Draft Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formDraftToggle"
                  checked={formIsDraft}
                  onChange={(e) => setFormIsDraft(e.target.checked)}
                  className="rounded text-[#10B981] focus:ring-emerald-500"
                />
                <label htmlFor="formDraftToggle" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  حفظ كمسودة (غير معتمد في الحسابات الختامية حتى التأكيد)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-bold shadow-xs cursor-pointer transition-colors"
                >
                  {editingTxn ? 'حفظ التعديلات' : 'ترحيل واعتماد القيد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: معاينة السند المحاسبي (View Voucher) */}
      {/* ========================================================================= */}
      {viewingTxn && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#10B981]" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  بطاقة السند: {viewingTxn.number || viewingTxn.id}
                </h3>
              </div>
              <button
                onClick={() => setViewingTxn(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">نوع السند:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{viewingTxn.restriction}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">التاريخ:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{viewingTxn.date} ({viewingTxn.day})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">الحساب:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{viewingTxn.accountName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">المبلغ:</span>
                <span className="font-mono font-black text-base text-[#10B981]">
                  {formatCurrency(viewingTxn.amountYER || viewingTxn.amountUSD)} {viewingTxn.amountUSD > 0 ? 'USD' : 'YER'}
                </span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 block mb-1">البيان:</span>
                <p className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                  {viewingTxn.description || 'لا يوجد بيان إضافي مسجل.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setViewingTxn(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-bold cursor-pointer"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#10B981] text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة السند</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
