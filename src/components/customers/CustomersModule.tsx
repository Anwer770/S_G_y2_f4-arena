import React, { useState, useMemo } from 'react';
import {
  Customer,
  CustomerAuditLog,
  CustomerFilterState,
  CustomerSource,
  CustomerVisitRecord,
  VisitStatus,
} from '../../types';
import { CustomerDirectory } from './CustomerDirectory';
import { VisitsPlanner } from './VisitsPlanner';
import { BalancesLedger } from './BalancesLedger';
import { CustomerReports } from './CustomerReports';
import { CustomerModal } from './CustomerModal';
import { CustomerDetailsModal } from './CustomerDetailsModal';
import { RecordVisitModal } from './RecordVisitModal';
import { CustomerStatementModal } from './CustomerStatementModal';
import { ImportCustomersModal } from './ImportCustomersModal';
import { calculateCustomerStats } from '../../utils/customers';
import { exportCustomersToExcel } from '../../utils/excel';
import { logCustomerAudit } from '../../utils/storage';
import {
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  History,
  Plus,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  customers: Customer[];
  visits: CustomerVisitRecord[];
  auditLogs: CustomerAuditLog[];
  onUpdateCustomers: (customers: Customer[]) => void;
  onUpdateVisits: (visits: CustomerVisitRecord[]) => void;
  onAddAuditLog?: (action: CustomerAuditLog['action'], name: string, details: string) => void;
}

export const CustomersModule: React.FC<Props> = ({
  customers,
  visits,
  auditLogs,
  onUpdateCustomers,
  onUpdateVisits,
  onAddAuditLog,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'directory' | 'planner' | 'balances' | 'reports' | 'audit'
  >('directory');

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<Customer | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);

  const [isRecordVisitModalOpen, setIsRecordVisitModalOpen] = useState(false);
  const [selectedCustomerForVisit, setSelectedCustomerForVisit] = useState<Customer | null>(null);

  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [selectedCustomerForStatement, setSelectedCustomerForStatement] = useState<Customer | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Stats calculation
  const stats = useMemo(() => calculateCustomerStats(customers, visits), [customers, visits]);

  // Handlers
  const handleSaveCustomer = (saved: Customer) => {
    const exists = customers.some((c) => c.id === saved.id);
    let updated: Customer[];
    if (exists) {
      updated = customers.map((c) => (c.id === saved.id ? saved : c));
      logCustomerAudit('تعديل', saved.name, `تم تعديل بيانات العميل ${saved.name} (${saved.id})`);
    } else {
      updated = [saved, ...customers];
      logCustomerAudit('إضافة', saved.name, `تم إضافة عميل جديد ${saved.name} (${saved.id}) لمصدر ${saved.source}`);
    }
    onUpdateCustomers(updated);
  };

  const handleDeleteCustomer = (id: string) => {
    const target = customers.find((c) => c.id === id);
    if (!target) return;
    if (window.confirm(`هل أنت متأكد من حذف العميل "${target.name}" نهائياً من النظام؟`)) {
      const updated = customers.filter((c) => c.id !== id);
      onUpdateCustomers(updated);
      logCustomerAudit('حذف', target.name, `تم حذف العميل ${target.name} (${target.id})`);
      setIsDetailsModalOpen(false);
    }
  };

  const handleSaveVisit = (
    visit: CustomerVisitRecord,
    updatedCustomerStatus?: VisitStatus,
    collectedAmountYER?: number
  ) => {
    const updatedVisits = [visit, ...visits];
    onUpdateVisits(updatedVisits);

    // Update customer status and balance if collection happened
    const updatedCustomers = customers.map((c) => {
      if (c.id === visit.customerId) {
        let newBalanceYER = c.balanceYER;
        if (collectedAmountYER && collectedAmountYER > 0) {
          newBalanceYER = (c.balanceYER || 0) + collectedAmountYER; // reduces negative debt
        }
        return {
          ...c,
          status: updatedCustomerStatus || c.status,
          balanceYER: newBalanceYER,
          lastVisitDate: visit.date,
          visitResult: visit.notes || c.visitResult,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });

    onUpdateCustomers(updatedCustomers);
    logCustomerAudit(
      'زيارة',
      visit.customerName,
      `تم توثيق زيارة ميدانية للعميل ${visit.customerName} بواسطة ${visit.responsible} - النتيجة: ${visit.status}`
    );
  };

  const handleUpdateStatus = (customerId: string, newStatus: VisitStatus) => {
    const updated = customers.map((c) => {
      if (c.id === customerId) {
        return { ...c, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return c;
    });
    onUpdateCustomers(updated);
  };

  const handleImportCustomers = (imported: Customer[]) => {
    // Merge or replace
    const merged = [...imported, ...customers.filter((c) => !imported.some((imp) => imp.id === c.id))];
    onUpdateCustomers(merged);
    logCustomerAudit(
      'استيراد',
      'قاعدة البيانات',
      `تم استيراد ${imported.length} عميل من ملف Excel بنجاح`
    );
  };

  const handleExportExcel = () => {
    exportCustomersToExcel(customers, visits);
    logCustomerAudit('تصدير', 'سجل العملاء', 'تم تصدير قاعدة بيانات العملاء والزيارات إلى ملف Excel');
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner & KPI Summary Header */}
      <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs animate-fade-in-up stagger-1">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  ادارة العملاء وزيارات
                </h1>
                <span className="bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-black text-xs px-2.5 py-0.5 rounded-full border border-teal-200/50 dark:border-teal-800/50">
                  الميدانية
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                منظومة إدارة شبكة العملاء، مسارات الزيارات، والأرصدة متعددة العملات
              </p>
            </div>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs flex-wrap">
            <div className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 block text-xs font-bold">إجمالي العملاء</span>
              <span className="font-mono font-black text-slate-900 dark:text-slate-100">{stats.totalCustomers}</span>
            </div>
            <div className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700">
              <span className="text-rose-500 dark:text-rose-400 block text-xs font-bold">مديونيات</span>
              <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                {(stats.totalDebtYER || 0).toLocaleString()} ريال
              </span>
            </div>
            <div className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700">
              <span className="text-teal-600 dark:text-teal-400 block text-xs font-bold">زيارات اليوم</span>
              <span className="font-mono font-black text-teal-600 dark:text-teal-400">
                {stats.todayVisitsCompleted} / {stats.todayVisitsTotal}
              </span>
            </div>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer"
              title="استيراد وتصدير بيانات العملاء Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>استيراد Excel</span>
            </button>
            <button
              onClick={() => {
                setSelectedCustomerForEdit(null);
                setIsCustomerModalOpen(true);
              }}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-black rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة عميل</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Sub-tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200/80 dark:border-slate-800 pb-2 text-xs font-black no-scrollbar">
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'directory'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>دليل العملاء والمنشآت</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${
              activeSubTab === 'directory' ? 'bg-teal-700 dark:bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {customers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('planner')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'planner'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>جدول ومسارات الزيارات</span>
          {stats.todayVisitsTotal > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-bold font-mono">
              {stats.todayVisitsTotal} اليوم
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('balances')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'balances'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>دفتر الأرصدة والمديونيات</span>
          {stats.debtorCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-rose-500 text-white font-mono">
              {stats.debtorCount} مدين
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'reports'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>المؤشرات والتقارير</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'audit'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل تدقيق العملاء</span>
          <span className="text-xs px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* Sub-tab Views */}
      {activeSubTab === 'directory' && (
        <CustomerDirectory
          customers={customers}
          visits={visits}
          onAddCustomer={() => {
            setSelectedCustomerForEdit(null);
            setIsCustomerModalOpen(true);
          }}
          onEditCustomer={(cust) => {
            setSelectedCustomerForEdit(cust);
            setIsCustomerModalOpen(true);
          }}
          onDeleteCustomer={handleDeleteCustomer}
          onViewDetails={(cust) => {
            setSelectedCustomerForDetails(cust);
            setIsDetailsModalOpen(true);
          }}
          onRecordVisit={(cust) => {
            setSelectedCustomerForVisit(cust);
            setIsRecordVisitModalOpen(true);
          }}
          onOpenStatement={(cust) => {
            setSelectedCustomerForStatement(cust);
            setIsStatementModalOpen(true);
          }}
          onExportExcel={handleExportExcel}
          onImportExcel={() => setIsImportModalOpen(true)}
        />
      )}

      {activeSubTab === 'planner' && (
        <VisitsPlanner
          customers={customers}
          visits={visits}
          onRecordVisit={(cust) => {
            setSelectedCustomerForVisit(cust);
            setIsRecordVisitModalOpen(true);
          }}
          onViewDetails={(cust) => {
            setSelectedCustomerForDetails(cust);
            setIsDetailsModalOpen(true);
          }}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {activeSubTab === 'balances' && (
        <BalancesLedger
          customers={customers}
          onViewDetails={(cust) => {
            setSelectedCustomerForDetails(cust);
            setIsDetailsModalOpen(true);
          }}
          onOpenStatement={(cust) => {
            setSelectedCustomerForStatement(cust);
            setIsStatementModalOpen(true);
          }}
        />
      )}

      {activeSubTab === 'reports' && (
        <CustomerReports customers={customers} visits={visits} />
      )}

      {activeSubTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-700 dark:text-slate-200" />
              سجل تدقيق وإجراءات العملاء والزيارات
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              {auditLogs.length} سجل مسجل
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500">لا توجد سجلات تدقيق حتى الآن</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {log.action}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{log.customerName}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium text-xs">{log.details}</p>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono shrink-0">
                    {log.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setSelectedCustomerForEdit(null);
        }}
        onSave={handleSaveCustomer}
        customer={selectedCustomerForEdit}
        existingCustomers={customers}
      />

      <CustomerDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedCustomerForDetails(null);
        }}
        customer={selectedCustomerForDetails}
        visits={visits}
        onEditCustomer={(cust) => {
          setIsDetailsModalOpen(false);
          setSelectedCustomerForEdit(cust);
          setIsCustomerModalOpen(true);
        }}
        onDeleteCustomer={handleDeleteCustomer}
        onAddVisit={(cust) => {
          setIsDetailsModalOpen(false);
          setSelectedCustomerForVisit(cust);
          setIsRecordVisitModalOpen(true);
        }}
        onOpenStatement={(cust) => {
          setIsDetailsModalOpen(false);
          setSelectedCustomerForStatement(cust);
          setIsStatementModalOpen(true);
        }}
      />

      <RecordVisitModal
        isOpen={isRecordVisitModalOpen}
        onClose={() => {
          setIsRecordVisitModalOpen(false);
          setSelectedCustomerForVisit(null);
        }}
        customer={selectedCustomerForVisit}
        onSaveVisit={handleSaveVisit}
      />

      <CustomerStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => {
          setIsStatementModalOpen(false);
          setSelectedCustomerForStatement(null);
        }}
        customer={selectedCustomerForStatement}
        visits={visits}
      />

      <ImportCustomersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCustomers}
      />
    </div>
  );
};
