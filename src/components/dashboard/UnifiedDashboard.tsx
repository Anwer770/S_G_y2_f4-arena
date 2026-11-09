import React from 'react';
import {
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  Circle,
  Coins,
  Eye,
  Flame,
  ShoppingCart,
  Stethoscope,
  Users,
  Wallet,
} from 'lucide-react';
import type { NoteRecord } from './dashboardModel';
import type { DashboardProps } from './dashboardModel';
import { CentralUnifiedLedger } from '../workos/CentralUnifiedLedger';
import { WorkOSQuickAddModal } from '../workos/WorkOSQuickAddModal';
import { completeWorkOSTask, toggleWorkOSTaskCompletion } from '../../services/workos/WorkOSTaskService';
import { broadcastDataChange } from '../../utils/multiTabSync';
import { formatCurrency } from '../../utils/formatters';
import { loadNoteFolders, loadNotes, loadNoteTags, saveNotes } from '../../utils/storage';
import { loadOrders as loadWorkOSOrders, loadWorkOSData } from '../../utils/workosStorage';
import { DashboardCharts } from './DashboardCharts';

// الأقسام المستخرجة (R30)
import { DashboardHeader } from './DashboardHeader';
import { DashboardQuickActions } from './DashboardQuickActions';
import { DashboardPulseCards } from './DashboardPulseCards';
import { DashboardFinanceInventory } from './DashboardFinanceInventory';
import { DashboardModuleHubs } from './DashboardModuleHubs';

// Protected Modals for Quick Actions
import { TaskModal } from '../tasks/TaskModal';
import { FinancialModal } from '../financial/FinancialModal';
import { MovementModal } from '../MovementModal';
import { RecordVisitModal } from '../customers/RecordVisitModal';
import { CommitmentModal as TaskCommitmentModal } from '../tasks/CommitmentModal';
import { NoteEditorModal } from '../knowledge/NoteEditorModal';
import { useDashboardModel } from './useDashboardModel';
import { useSubTabSync } from '../../utils/subMenuStore';

export const UnifiedDashboard: React.FC<DashboardProps> = (props) => {
  const {
    accountNames,
    activeOpsTab,
    categories,
    categoryAccounts,
    commitments,
    customers,
    dashboardOrders,
    debtCommitments,
    debtStats,
    debts,
    doctors,
    financialInitialTxn,
    financialMovements,
    financialTransactions,
    handleOpenRecordVisit,
    importanceList,
    isCommitmentModalOpen,
    isFinancialModalOpen,
    isMovementModalOpen,
    isNoteModalOpen,
    isTaskModalOpen,
    isVisitModalOpen,
    isWorkOSQuickAddOpen,
    items,
    movementTypes,
    movements,
    onAddFinancialOption,
    onNavigateTab,
    onSaveCommitment,
    onSaveFinancialTxn,
    onSaveMovement,
    onSaveTask,
    onToggleCompleteTask,
    onUpdateVisits,
    overdueCommitments,
    overdueTasks,
    restrictionAccounts,
    restrictions,
    selectedCustomerForVisit,
    seq,
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
    statuses,
    taskAssignees,
    taskCategories,
    taskOperations,
    tasks,
    todayArabic,
    todayCustomerVisits,
    todayDoctorVisits,
    todayStr,
    todayTasks,
    visits,
    workOSData,
    workOSQuickAddType,
    recentMovements,
    recentFinancial,
    stockStats,
    finSummary,
    handleOpenReceiptVoucher,
    handleOpenPaymentVoucher,
    userProfile,
  } = useDashboardModel(props);

  // مزامنة التبويب الفرعي «dashboard» مع الدرج الجانبي (R30: بقي في المكوّن)
  useSubTabSync('dashboard', activeOpsTab, setActiveOpsTab as (next: string) => void);

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardHeader onNavigateTab={onNavigateTab} todayArabic={todayArabic} userProfile={userProfile} />

      <DashboardQuickActions
        handleOpenPaymentVoucher={handleOpenPaymentVoucher}
        handleOpenReceiptVoucher={handleOpenReceiptVoucher}
        handleOpenRecordVisit={handleOpenRecordVisit}
        setIsCommitmentModalOpen={setIsCommitmentModalOpen}
        setIsMovementModalOpen={setIsMovementModalOpen}
        setIsNoteModalOpen={setIsNoteModalOpen}
        setIsTaskModalOpen={setIsTaskModalOpen}
        setIsWorkOSQuickAddOpen={setIsWorkOSQuickAddOpen}
        setWorkOSQuickAddType={setWorkOSQuickAddType}
      />

      <DashboardPulseCards
        commitments={commitments}
        finSummary={finSummary}
        onNavigateTab={onNavigateTab}
        overdueCommitments={overdueCommitments}
        overdueTasks={overdueTasks}
        setActiveOpsTab={setActiveOpsTab}
        stockStats={stockStats}
        todayCustomerVisits={todayCustomerVisits}
        todayDoctorVisits={todayDoctorVisits}
        todayTasks={todayTasks}
      />

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
              <span
                className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${
                  activeOpsTab === 'today'
                    ? 'bg-teal-800 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
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
              <span
                className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${
                  activeOpsTab === 'overdue'
                    ? 'bg-rose-800 text-white'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                }`}
              >
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
              <span
                className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${
                  activeOpsTab === 'visits'
                    ? 'bg-sky-800 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
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
              <span
                className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${
                  activeOpsTab === 'orders_ledger'
                    ? 'bg-blue-800 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
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
                            if (toggleWorkOSTaskCompletion(task.id)) {
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
                      <span className="text-xs text-slate-400">
                        المسؤول: {task.assignee || 'المستخدم'} • {task.category}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (onToggleCompleteTask) {
                          onToggleCompleteTask(task.id);
                        }
                        try {
                          if (completeWorkOSTask(task.id)) {
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
                      <span className="text-xs font-mono font-bold text-rose-600">
                        المبلغ: {formatCurrency(comm.amount)} YER
                      </span>
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
                  <p className="text-center py-4 text-xs text-slate-400">
                    لا يوجد عملاء مجدولون في مسار {todayArabic}.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {todayCustomerVisits.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">{c.name}</span>
                          <span className="text-xs text-slate-400">
                            {c.region} • المندوب: {c.responsible}
                          </span>
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
                  <p className="text-center py-4 text-xs text-slate-400">
                    لا يوجد أطباء مجدولون في مسار {todayArabic}.
                  </p>
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
                      <span className="text-xs text-slate-400">
                        {dc.category} • المستحق: {dc.endDate || dc.date}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-rose-600">
                      {formatCurrency(dc.amount)} {dc.currency}
                    </span>
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
                      <span className="text-xs text-slate-400">
                        دفتر: {d.book} • التاريخ: {d.date}
                      </span>
                    </div>
                    <span
                      className={`font-mono font-bold ${(d.book as string) === 'لنا' ? 'text-teal-700 dark:text-teal-300' : 'text-rose-600'}`}
                    >
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

      <DashboardFinanceInventory
        finSummary={finSummary}
        handleOpenPaymentVoucher={handleOpenPaymentVoucher}
        handleOpenReceiptVoucher={handleOpenReceiptVoucher}
        onNavigateTab={onNavigateTab}
        recentFinancial={recentFinancial}
        recentMovements={recentMovements}
        setIsMovementModalOpen={setIsMovementModalOpen}
        stockStats={stockStats}
      />

      {/* 6. CHARTS & FINANCIAL SUMMARY */}
      <DashboardCharts
        financialTransactions={financialTransactions}
        items={items}
        tasks={tasks}
        customers={customers}
        doctors={doctors}
      />

      <DashboardModuleHubs
        customers={customers}
        debtCommitments={debtCommitments}
        debts={debts}
        doctors={doctors}
        financialTransactions={financialTransactions}
        items={items}
        onNavigateTab={onNavigateTab}
        tasks={tasks}
      />

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
            const newNote: NoteRecord = {
              id: `note_${Date.now()}`,
              ...newNoteData,
              title: newNoteData.title || 'ملاحظة جديدة',
              content: newNoteData.content || '',
              type: newNoteData.type ?? 'عامة',
              category: newNoteData.category ?? 'عام',
              priority: newNoteData.priority ?? 'متوسطة',
              status: newNoteData.status ?? 'جديدة',
              tags: newNoteData.tags ?? [],
              folderId: newNoteData.folderId ?? '',
              isPinned: newNoteData.isPinned ?? false,
              isFavorite: newNoteData.isFavorite ?? false,
              isLocked: newNoteData.isLocked ?? false,
              isQuickNote: false,
              date: todayStr,
              time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
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
