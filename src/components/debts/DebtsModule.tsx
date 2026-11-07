import React, { useState, useEffect, useMemo } from 'react';
import {
  DebtBookId,
  DebtCommitment,
  DebtCommitmentPayment,
  DebtRecord,
  DebtAuditLog,
} from '../../types';
import {
  calculateCommitmentRemaining,
  calculateDebtStats,
  DEBT_BOOKS_META,
  DEBT_CATEGORIES,
  DEBT_OWNERS,
  formatDebtAmount,
} from '../../utils/debts';
import {
  loadDebts,
  saveDebts,
  loadDebtCommitments,
  saveDebtCommitments,
  loadDebtCategories,
  saveDebtCategories,
  loadDebtOwners,
  saveDebtOwners,
  loadDebtAuditLogs,
  saveDebtAuditLogs,
  logDebtAudit,
} from '../../utils/storage';
import { DebtLedgerTable } from './DebtLedgerTable';
import { CommitmentsTable } from './CommitmentsTable';
import { DueAlertsPanel } from './DueAlertsPanel';
import { DebtAuditView } from './DebtAuditView';
import { DebtRecordModal } from './DebtRecordModal';
import { CommitmentModal } from './CommitmentModal';
import { PartialPaymentModal } from './PartialPaymentModal';
import {
  BookOpen,
  Clock,
  BellRing,
  History,
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Layers,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { DebtPrintModal } from './DebtPrintModal';
import { UniversalDataExchangeModal } from '../common/UniversalDataExchangeModal';
import { downloadDebtsExcelTemplate } from '../../utils/universalDataTemplates';
import { parseDebtsExcelFile } from '../../utils/universalImporters';
import { exportDebtsAndCommitmentsToExcel } from '../../utils/debts';

export const DebtsModule: React.FC = () => {
  // Main Navigation Sub-tab
  const [activeTab, setActiveTab] = useState<'ledgers' | 'commitments' | 'alerts' | 'audit'>('ledgers');
  const [activeBook, setActiveBook] = useState<DebtBookId>('anwar');

  // Data States
  const [records, setRecords] = useState<DebtRecord[]>([]);
  const [commitments, setCommitments] = useState<DebtCommitment[]>([]);
  const [categories, setCategories] = useState<string[]>(DEBT_CATEGORIES);
  const [owners, setOwners] = useState<string[]>(DEBT_OWNERS);
  const [auditLogs, setAuditLogs] = useState<DebtAuditLog[]>([]);

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DebtRecord | null>(null);
  const [recordDefaultBook, setRecordDefaultBook] = useState<DebtBookId>('anwar');

  const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<DebtCommitment | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentCommitment, setSelectedPaymentCommitment] = useState<DebtCommitment | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // File import handler
  const handleImportFile = async (file: File) => {
    const result = await parseDebtsExcelFile(file);
    if (result.count === 0) {
      return { success: false, message: 'الملف لا يحتوي على قيود أو التزامات صالحة.' };
    }

    const newDebts = [...result.debts, ...records];
    const newCommitments = [...result.commitments, ...commitments];

    setRecords(newDebts);
    saveDebts(newDebts);

    setCommitments(newCommitments);
    saveDebtCommitments(newCommitments);

    logDebtAudit('استيراد', 'نظام', 'استيراد إكسل', `تم استيراد ${result.debts.length} قيد دين و ${result.commitments.length} التزام مالي`);
    setAuditLogs(loadDebtAuditLogs());

    return {
      success: true,
      message: `تم استيراد بنجاح: ${result.debts.length} قيد دين و ${result.commitments.length} التزام مالي!`,
    };
  };

  const handleExportJSON = () => {
    const data = {
      records,
      commitments,
      exportDate: new Date().toISOString(),
      appVersion: '2.6',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `نسخة_احتياطية_الديون_والالتزامات_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Initial Data Load
  useEffect(() => {
    setRecords(loadDebts());
    setCommitments(loadDebtCommitments());
    setCategories(loadDebtCategories());
    setOwners(loadDebtOwners());
    setAuditLogs(loadDebtAuditLogs());
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    return calculateDebtStats(records, commitments);
  }, [records, commitments]);

  // Record Handlers
  const handleSaveRecord = (record: DebtRecord) => {
    const isEdit = records.some((r) => r.id === record.id);
    let updated: DebtRecord[];
    if (isEdit) {
      updated = records.map((r) => (r.id === record.id ? record : r));
      logDebtAudit('تعديل', 'قيد دين', record.name, `تم تعديل قيد في ${DEBT_BOOKS_META[record.book]?.title}`);
    } else {
      updated = [record, ...records];
      logDebtAudit('إضافة', 'قيد دين', record.name, `تمت إضافة قيد جديد في ${DEBT_BOOKS_META[record.book]?.title}`);
    }
    setRecords(updated);
    saveDebts(updated);
    setAuditLogs(loadDebtAuditLogs());
  };

  const handleDuplicateRecord = (record: DebtRecord) => {
    const newRecord: DebtRecord = {
      ...record,
      id: `DEBT-${Date.now().toString().slice(-6)}`,
      name: `${record.name} (نسخة)`,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveDebts(updated);
    logDebtAudit('إضافة', 'قيد دين', newRecord.name, `تم تكرار القيد من ${record.name}`);
    setAuditLogs(loadDebtAuditLogs());
  };

  const handleDeleteRecord = (id: string) => {
    const target = records.find((r) => r.id === id);
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    saveDebts(updated);
    if (target) {
      logDebtAudit('حذف', 'قيد دين', target.name, `تم حذف القيد من ${DEBT_BOOKS_META[target.book]?.title}`);
    }
    setAuditLogs(loadDebtAuditLogs());
  };

  const handleToggleRecordComplete = (id: string) => {
    const updated = records.map((r) =>
      r.id === id ? { ...r, isCompleted: !r.isCompleted, updatedAt: new Date().toISOString() } : r
    );
    setRecords(updated);
    saveDebts(updated);
    const target = records.find((r) => r.id === id);
    if (target) {
      logDebtAudit('تعديل', 'قيد دين', target.name, `تغيير حالة الاكتمال للقيد إلى: ${!target.isCompleted ? 'مكتمل' : 'نشط'}`);
    }
    setAuditLogs(loadDebtAuditLogs());
  };

  const handleChangeRecordIcon = (id: string, icon: string) => {
    const updated = records.map((r) =>
      r.id === id ? { ...r, icon, updatedAt: new Date().toISOString() } : r
    );
    setRecords(updated);
    saveDebts(updated);
  };

  // Commitment Handlers
  const handleSaveCommitment = (commitment: DebtCommitment) => {
    const isEdit = commitments.some((c) => c.id === commitment.id);
    let updated: DebtCommitment[];
    if (isEdit) {
      updated = commitments.map((c) => (c.id === commitment.id ? commitment : c));
      logDebtAudit('تعديل', 'التزام', `${commitment.id}: ${commitment.name}`, 'تم تعديل بيانات الالتزام المالي');
    } else {
      updated = [commitment, ...commitments];
      logDebtAudit('إضافة', 'التزام', `${commitment.id}: ${commitment.name}`, 'تم إنشاء التزام مالي جديد');
    }
    setCommitments(updated);
    saveDebtCommitments(updated);
    setAuditLogs(loadDebtAuditLogs());
  };

  const handleDuplicateCommitment = (commitment: DebtCommitment) => {
    const newCommitment: DebtCommitment = {
      ...commitment,
      id: `التزامات-${Date.now().toString().slice(-4)}`,
      name: `${commitment.name} (نسخة)`,
      date: new Date().toISOString().split('T')[0],
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newCommitment, ...commitments];
    setCommitments(updated);
    saveDebtCommitments(updated);
    logDebtAudit('إضافة', 'التزام', newCommitment.name, `تم تكرار الالتزام من ${commitment.id}`);
    setAuditLogs(loadDebtAuditLogs());
  };

  const handleDeleteCommitment = (id: string) => {
    const target = commitments.find((c) => c.id === id);
    const updated = commitments.filter((c) => c.id !== id);
    setCommitments(updated);
    saveDebtCommitments(updated);
    if (target) {
      logDebtAudit('حذف', 'التزام', `${target.id}: ${target.name}`, 'تم حذف الالتزام المالي');
    }
    setAuditLogs(loadDebtAuditLogs());
  };

  const handleChangeCommitmentIcon = (id: string, icon: string) => {
    const updated = commitments.map((c) =>
      c.id === id ? { ...c, icon, updatedAt: new Date().toISOString() } : c
    );
    setCommitments(updated);
    saveDebtCommitments(updated);
  };

  // Payment Handlers (Partial Payments)
  const handleAddPayment = (commitmentId: string, payment: DebtCommitmentPayment) => {
    const updated = commitments.map((c) => {
      if (c.id === commitmentId) {
        const payments = [...(c.payments || []), payment];
        const { remaining } = calculateCommitmentRemaining({ ...c, payments });
        const isNowCompleted = remaining <= 0;
        return {
          ...c,
          payments,
          status: isNowCompleted ? 'منجز ✔' : c.status,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });

    setCommitments(updated);
    saveDebtCommitments(updated);

    const target = commitments.find((c) => c.id === commitmentId);
    if (target) {
      logDebtAudit(
        'سداد',
        'دفعة سداد',
        `${target.id}: ${target.name}`,
        `تم تسجيل دفعة سداد بمبلغ ${payment.amount} ${target.currency}`
      );
      // Update modal view
      setSelectedPaymentCommitment(updated.find((c) => c.id === commitmentId) || null);
    }
    setAuditLogs(loadDebtAuditLogs());
  };

  const handleDeletePayment = (commitmentId: string, paymentId: string) => {
    const updated = commitments.map((c) => {
      if (c.id === commitmentId) {
        const payments = (c.payments || []).filter((p) => p.pid !== paymentId);
        return {
          ...c,
          payments,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });

    setCommitments(updated);
    saveDebtCommitments(updated);

    const target = commitments.find((c) => c.id === commitmentId);
    if (target) {
      logDebtAudit(
        'حذف',
        'دفعة سداد',
        `${target.id}: ${target.name}`,
        'تم حذف دفعة سداد سابقة'
      );
      setSelectedPaymentCommitment(updated.find((c) => c.id === commitmentId) || null);
    }
    setAuditLogs(loadDebtAuditLogs());
  };

  const handleClearAuditLogs = () => {
    saveDebtAuditLogs([]);
    setAuditLogs([]);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">ادارة الديون والالتزامات</h1>
              <span className="bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-black text-xs px-2.5 py-0.5 rounded-full border border-teal-200/50 dark:border-teal-800/50">
                v2.6
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              إدارة الدفاتر الأربعة (دين أنور، دين سابق، دين زها، حساب علي القات) وسجل الالتزامات والأقساط
            </p>
          </div>
        </div>

        {/* Quick Add & Import Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer"
            title="طباعة كشف حساب رسمي للدفتر النشط"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>طباعة كشف</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer"
            title="استيراد وتصدير ديون والتزامات Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>استيراد Excel</span>
          </button>

          <button
            onClick={() => {
              setEditingRecord(null);
              setRecordDefaultBook(activeBook);
              setIsRecordModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>قيد دين جديد</span>
          </button>

          <button
            onClick={() => {
              setEditingCommitment(null);
              setIsCommitmentModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>التزام مالي جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up stagger-2">
        {/* 1. Anwar Debts Balance */}
        <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold">صافي دين أنور (YER)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/40 dark:border-amber-800/40">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-slate-100">
              {formatDebtAmount(Math.abs(stats.anwarNet), 'YER')}
            </div>
            <div className="flex items-center gap-2 text-xs font-bold mt-1">
              <span className="text-rose-600 dark:text-rose-400">عليه: {(stats.anwarDebit || 0).toLocaleString()}</span>
              <span>•</span>
              <span className="text-teal-600 dark:text-teal-400">له: {(stats.anwarCredit || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 2. Total Commitments */}
        <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold">إجمالي الالتزامات المالية</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200/40 dark:border-teal-800/40">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black font-mono text-teal-700 dark:text-teal-300">
              {formatDebtAmount(stats.totalCommitmentsAmount, 'YER')}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              العدد الإجمالي: {stats.activeCommitmentsCount + stats.completedCommitmentsCount} التزام
            </div>
          </div>
        </div>

        {/* 3. Paid vs Remaining */}
        <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold">المتبقي للسداد vs المدفوع</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/40 dark:border-rose-800/40">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">
              {formatDebtAmount(stats.totalCommitmentsRemaining, 'YER')}
            </div>
            <div className="text-xs text-teal-600 dark:text-teal-400 font-bold mt-1">
              تم سداد: {formatDebtAmount(stats.totalCommitmentsPaid, 'YER')}
            </div>
          </div>
        </div>

        {/* 4. Alerts Counter */}
        <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold">تنبيهات الاستحقاق</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/40 dark:border-amber-800/40">
              <BellRing className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">
                {stats.overdueCount} متأخر
              </span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                {stats.dueSoonCount} قريباً
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {stats.overdueCount > 0 ? 'يتطلب متابعة عاجلة' : 'كافة المواعيد منتظمة'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Section Navigation Tabs */}
      <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-1">
        <button
          onClick={() => setActiveTab('ledgers')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ledgers'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>دفاتر الدين الأربعة</span>
        </button>

        <button
          onClick={() => setActiveTab('commitments')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'commitments'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>سجل الالتزامات والأقساط</span>
          <span className="text-xs px-1.5 py-0.5 rounded-md font-mono bg-teal-700 dark:bg-teal-600 text-white">
            {commitments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'alerts'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BellRing className="w-4 h-4 text-amber-400" />
          <span>مركز التنبيهات</span>
          {(stats.overdueCount > 0 || stats.dueSoonCount > 0) && (
            <span className="text-xs px-1.5 py-0.5 rounded-md font-mono bg-rose-500 text-white animate-pulse">
              {stats.overdueCount + stats.dueSoonCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل العمليات</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'ledgers' && (
        <DebtLedgerTable
          records={records}
          activeBook={activeBook}
          onSelectBook={setActiveBook}
          onAddRecord={(book) => {
            setEditingRecord(null);
            setRecordDefaultBook(book);
            setIsRecordModalOpen(true);
          }}
          onEditRecord={(record) => {
            setEditingRecord(record);
            setIsRecordModalOpen(true);
          }}
          onDuplicateRecord={handleDuplicateRecord}
          onDeleteRecord={handleDeleteRecord}
          onToggleComplete={handleToggleRecordComplete}
          onChangeIcon={handleChangeRecordIcon}
          onOpenPrint={() => setIsPrintModalOpen(true)}
        />
      )}

      {activeTab === 'commitments' && (
        <CommitmentsTable
          commitments={commitments}
          categories={categories}
          owners={owners}
          onAddCommitment={() => {
            setEditingCommitment(null);
            setIsCommitmentModalOpen(true);
          }}
          onEditCommitment={(c) => {
            setEditingCommitment(c);
            setIsCommitmentModalOpen(true);
          }}
          onDuplicateCommitment={handleDuplicateCommitment}
          onDeleteCommitment={handleDeleteCommitment}
          onOpenPaymentModal={(c) => {
            setSelectedPaymentCommitment(c);
            setIsPaymentModalOpen(true);
          }}
          onChangeIcon={handleChangeCommitmentIcon}
        />
      )}

      {activeTab === 'alerts' && (
        <DueAlertsPanel
          commitments={commitments}
          onOpenPaymentModal={(c) => {
            setSelectedPaymentCommitment(c);
            setIsPaymentModalOpen(true);
          }}
          onEditCommitment={(c) => {
            setEditingCommitment(c);
            setIsCommitmentModalOpen(true);
          }}
        />
      )}

      {activeTab === 'audit' && (
        <DebtAuditView logs={auditLogs} onClearLogs={handleClearAuditLogs} />
      )}

      {/* Modals */}
      <DebtRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveRecord}
        initialRecord={editingRecord}
        defaultBook={recordDefaultBook}
      />

      <CommitmentModal
        isOpen={isCommitmentModalOpen}
        onClose={() => {
          setIsCommitmentModalOpen(false);
          setEditingCommitment(null);
        }}
        onSave={handleSaveCommitment}
        initialCommitment={editingCommitment}
        existingCommitments={commitments}
        categories={categories}
        owners={owners}
      />

      <PartialPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPaymentCommitment(null);
        }}
        commitment={selectedPaymentCommitment}
        onAddPayment={handleAddPayment}
        onDeletePayment={handleDeletePayment}
      />

      {/* Universal Excel Import/Export Modal */}
      <UniversalDataExchangeModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        moduleTitle="الديون والالتزامات"
        itemTypeName="قيود ديون والتزامات"
        icon={DollarSign}
        themeColor="amber"
        supportedColumnsText="دفتر الحساب، الاسم / الجهة، المبلغ، العملة، نوع المعاملة، التصنيف، التاريخ، تاريخ الاستحقاق، الشخص المسؤول"
        onDownloadTemplate={downloadDebtsExcelTemplate}
        onImportFile={handleImportFile}
        onExportExcel={() => exportDebtsAndCommitmentsToExcel(records, commitments)}
        excelSubtitle="ملف إكسل كامل بصفحتين (سجل الديون وسجل الالتزامات)"
        onExportJSON={handleExportJSON}
        jsonSubtitle="نسخة احتياطية كاملة لكافة دفاتر الديون والأقساط"
      />

      {/* Debt Statement Print Modal */}
      <DebtPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        activeBook={activeBook}
        records={records.filter((r) => r.book === activeBook)}
        onExportExcel={() => exportDebtsAndCommitmentsToExcel(records, commitments)}
      />
    </div>
  );
};
