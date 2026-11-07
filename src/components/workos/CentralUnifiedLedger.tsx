import React, { useState, useMemo, useEffect } from 'react';
import { WorkTask, WorkOrder, WorkCommitment, TeamMember } from '../../types/workos';
import {
  runSmartAutomationEngine,
  exportUnifiedWorkOSToExcel,
  downloadUnifiedWorkOSTemplate,
  importUnifiedWorkOSFromExcel,
  saveOrders,
  saveTasks,
  saveCommitments,
  triggerConfetti,
} from '../../utils/workosStorage';
import { formatCurrency } from '../../utils/formatters';
import {
  Layers,
  Search,
  Filter,
  ShoppingCart,
  CheckSquare,
  Coins,
  ArrowUpDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Download,
  Upload,
  FileSpreadsheet,
  Plus,
  Link2,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Circle,
  Truck,
  Building,
  MapPin,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface CentralUnifiedLedgerProps {
  orders: WorkOrder[];
  tasks: WorkTask[];
  commitments: WorkCommitment[];
  team?: TeamMember[];
  onOpenQuickAdd?: (type?: string) => void;
  onUpdateOrders?: (orders: WorkOrder[]) => void;
  onUpdateTasks?: (tasks: WorkTask[]) => void;
  onUpdateCommitments?: (commitments: WorkCommitment[]) => void;
}

export const CentralUnifiedLedger: React.FC<CentralUnifiedLedgerProps> = ({
  orders = [],
  tasks = [],
  commitments = [],
  team = [],
  onOpenQuickAdd,
  onUpdateOrders,
  onUpdateTasks,
  onUpdateCommitments,
}) => {
  // Active Tab: 'all' | 'orders' | 'tasks' | 'commitments'
  const [activeTab, setActiveTab] = useState<'all' | 'orders' | 'tasks' | 'commitments'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  // Automation Engine State
  const [automationAlerts, setAutomationAlerts] = useState<any[]>([]);
  const [isAutomationChecked, setIsAutomationChecked] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Run Smart Automation Check on mount and data changes
  useEffect(() => {
    const result = runSmartAutomationEngine(tasks, orders, commitments);
    setAutomationAlerts(result.triggeredAlerts || []);
    setIsAutomationChecked(true);
  }, [tasks, orders, commitments]);

  // Handle Complete Subtask or Task (Triggers auto-delivery update)
  const handleToggleTaskStatus = (taskId: string) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        const nextProgress = t.progress === 100 ? 0 : 100;
        const nextStatus = nextProgress === 100 ? ('completed' as const) : ('in_progress' as const);
        const nextSubtasks = t.subtasks.map((st) => ({ ...st, completed: nextProgress === 100 }));
        return {
          ...t,
          progress: nextProgress,
          status: nextStatus,
          subtasks: nextSubtasks,
          completedAt: nextProgress === 100 ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    saveTasks(updatedTasks);
    if (onUpdateTasks) onUpdateTasks(updatedTasks);

    // Auto-update linked order if task reached 100%
    const targetTask = updatedTasks.find((t) => t.id === taskId);
    if (targetTask?.linkedOrderId && targetTask.progress === 100) {
      const updatedOrders = orders.map((o) => {
        if (o.id === targetTask.linkedOrderId || o.linkedTaskId === targetTask.id) {
          return {
            ...o,
            status: 'delivered' as const,
            linkedTaskProgress: 100,
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      });
      saveOrders(updatedOrders);
      if (onUpdateOrders) onUpdateOrders(updatedOrders);
      triggerConfetti();
    }
  };

  // Handle Settle Financial Commitment
  const handleSettleCommitment = (commitmentId: string) => {
    const updatedCommitments = commitments.map((c) => {
      if (c.id === commitmentId) {
        return {
          ...c,
          status: (c.status === 'fulfilled' ? 'pending' : 'fulfilled') as any,
        };
      }
      return c;
    });
    saveCommitments(updatedCommitments);
    if (onUpdateCommitments) onUpdateCommitments(updatedCommitments);
  };

  // Regions List
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.regionBranch) set.add(o.regionBranch);
    });
    return Array.from(set);
  }, [orders]);

  // Unified Filtered Rows
  const filteredData = useMemo(() => {
    let ords = [...orders];
    let tsks = [...tasks];
    let cmts = [...commitments];

    // Priority filter
    if (priorityFilter !== 'all') {
      ords = ords.filter((o) => o.priority === priorityFilter);
      tsks = tsks.filter((t) => t.priority === priorityFilter);
      cmts = cmts.filter((c) =>
        priorityFilter === 'urgent' ? c.importance === 'A' : priorityFilter === 'high' ? c.importance === 'B' : true
      );
    }

    // Region filter
    if (regionFilter !== 'all') {
      ords = ords.filter((o) => o.regionBranch === regionFilter);
      tsks = tsks.filter((t) => t.tags?.includes(regionFilter) || t.description?.includes(regionFilter));
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      ords = ords.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.regionBranch.toLowerCase().includes(q) ||
          o.assignedRep.toLowerCase().includes(q)
      );
      tsks = tsks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.taskNumber.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
      cmts = cmts.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.entity.toLowerCase().includes(q) ||
          (c.invoiceNumbers && c.invoiceNumbers.toLowerCase().includes(q))
      );
    }

    return {
      orders: ords,
      tasks: tsks,
      commitments: cmts,
    };
  }, [orders, tasks, commitments, priorityFilter, regionFilter, searchQuery]);

  // File Import Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const result = await importUnifiedWorkOSFromExcel(file);
    setIsImporting(false);

    if (result.success) {
      setImportNotification(result.message);
      setTimeout(() => setImportNotification(null), 4000);
      triggerConfetti();
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* 1. Header Strip with Controls & Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0F3935] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Layers className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                الدفتر المركزي المشترك (المهام • الطلبيات • الالتزامات المالية)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/70 text-[#0F3935] dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[10px] font-bold">
                منظومة ثلاثية مترابطة
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              إدارة شاملة لطلبيات التوريد، مهمات التوزيع الميدانية، والالتزامات المالية في جدول تنفيذي واحد
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
          {/* Download Template */}
          <button
            type="button"
            onClick={downloadUnifiedWorkOSTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700"
            title="تحميل قالب Excel موحد للطلبيات والمهام والالتزامات"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تحميل القالب</span>
          </button>

          {/* Import Unified Excel */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700">
            <Upload className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{isImporting ? 'جاري الاستيراد...' : 'استيراد موحد'}</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isImporting}
            />
          </label>

          {/* Export Unified Excel */}
          <button
            type="button"
            onClick={() => exportUnifiedWorkOSToExcel(tasks, orders, commitments)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-[#0F3935] dark:text-teal-200 text-xs font-bold transition cursor-pointer border border-teal-200 dark:border-teal-800 shadow-2xs"
            title="تصدير جميع البيانات إلى ملف Excel شامل"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>تصدير Excel</span>
          </button>

          {/* + Quick Add Button */}
          <button
            type="button"
            onClick={() => onOpenQuickAdd?.('order')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F3935] hover:bg-[#134E48] text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-teal-300" />
            <span>+ إضافة سريعة</span>
          </button>
        </div>
      </div>

      {/* Import Notification Banner */}
      {importNotification && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{importNotification}</span>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* 2. Intelligent Automation & Critical Alerts Banner (محرك الأتمتة والتنبيهات) */}
      {automationAlerts.length > 0 && (
        <div className="p-3.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-rose-200/60 dark:border-rose-900/60">
            <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>تنبيهات محرك الأتمتة الذكي ({automationAlerts.length} تنبيهات حرجة تستوجب المتابعة)</span>
            </div>
            <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-bold">
              فحص لحظي آلي
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {automationAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 flex items-start gap-2 text-xs"
              >
                <div
                  className={`p-1 rounded-md mt-0.5 shrink-0 ${
                    alert.severity === 'critical'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block truncate">
                    {alert.title}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Central Tabs & Filter Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          {/* Main Segmented Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
            {/* الكل */}
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                activeTab === 'all'
                  ? 'bg-[#0F3935] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>الكل (عرض مدمج ثلاثي)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'all' ? 'bg-teal-800 text-white' : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                {orders.length + tasks.length + commitments.length}
              </span>
            </button>

            {/* الطلبيات */}
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>الطلبيات وعقود التوريد</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'orders' ? 'bg-blue-700 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-700'
              }`}>
                {orders.length}
              </span>
            </button>

            {/* المهام */}
            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                activeTab === 'tasks'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>المهام التنفيذية</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'tasks' ? 'bg-teal-800 text-white' : 'bg-teal-100 dark:bg-teal-950 text-teal-700'
              }`}>
                {tasks.length}
              </span>
            </button>

            {/* الالتزامات المالية */}
            <button
              type="button"
              onClick={() => setActiveTab('commitments')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                activeTab === 'commitments'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>الالتزامات والتحصيلات</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'commitments' ? 'bg-amber-700 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-700'
              }`}>
                {commitments.length}
              </span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برقم الطلبية أو المهمة أو العميل..."
                className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold cursor-pointer"
            >
              <option value="all">كل الأولويات</option>
              <option value="urgent">A - حرجة جداً</option>
              <option value="high">B - عالية</option>
              <option value="medium">C - متوسطة</option>
            </select>

            {/* Region Filter */}
            {availableRegions.length > 0 && (
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                <option value="all">كل المناطق</option>
                {availableRegions.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* 4. Unified Triple Grid / Table (عرض الجدول المدمج) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800 scrollbar-thin">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold">
                <th className="py-2.5 px-3 whitespace-nowrap">النوع والرقم</th>
                <th className="py-2.5 px-3 min-w-[220px]">العنوان والجهة المعنية</th>
                <th className="py-2.5 px-3 whitespace-nowrap">المنطقة / الفرع</th>
                <th className="py-2.5 px-3 whitespace-nowrap">المسؤول</th>
                <th className="py-2.5 px-3 whitespace-nowrap">المبلغ المالي</th>
                <th className="py-2.5 px-3 whitespace-nowrap">الحالة التنفيذية</th>
                <th className="py-2.5 px-3 whitespace-nowrap">الربط الثلاثي الآلي</th>
                <th className="py-2.5 px-3 whitespace-nowrap">تاريخ الاستحقاق</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* If no data */}
              {filteredData.orders.length === 0 &&
                filteredData.tasks.length === 0 &&
                filteredData.commitments.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      لا توجد مدخلات مطابقة لشروط البحث والفلترة.
                    </td>
                  </tr>
                )}

              {/* ROWS: Orders (مع بطاقة الربط الثلاثي المباشر) */}
              {(activeTab === 'all' || activeTab === 'orders') &&
                filteredData.orders.map((order) => {
                  const linkedTask = tasks.find((t) => t.id === order.linkedTaskId);
                  const linkedCommitment = commitments.find((c) => c.id === order.linkedCommitmentId);
                  const isDelivered = order.status === 'delivered';

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors group"
                    >
                      {/* 1. Type & Order # */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <span className="font-mono font-bold text-blue-700 dark:text-blue-400 block">
                              {order.orderNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {order.orderType}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Title & Customer */}
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {order.title}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{order.customerName}</span>
                        </span>
                      </td>

                      {/* 3. Region / Branch */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          <span>{order.regionBranch}</span>
                        </span>
                      </td>

                      {/* 4. Responsible Rep */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                        {order.assignedRep}
                      </td>

                      {/* 5. Amount */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(order.totalAmount)} YER
                      </td>

                      {/* 6. Status Badge */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            order.status === 'delivered'
                              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                              : order.status === 'shipped'
                              ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700'
                              : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            order.status === 'delivered' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`} />
                          <span>
                            {order.status === 'delivered'
                              ? 'تم التسليم'
                              : order.status === 'shipped'
                              ? 'تم الشحن'
                              : 'قيد التجهيز'}
                          </span>
                        </span>
                      </td>

                      {/* 7. Triple Linking Badge (مهمة + التزام مالي في نفس السطر) */}
                      <td className="py-2.5 px-3 min-w-[200px]">
                        <div className="space-y-1">
                          {/* Task Link */}
                          {linkedTask ? (
                            <div className="flex items-center justify-between gap-1 text-[11px]">
                              <span className="text-slate-500 flex items-center gap-1 truncate">
                                <CheckSquare className="w-3 h-3 text-teal-600 shrink-0" />
                                <span>مهمة التوزيع:</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                <div className="w-14 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full ${linkedTask.progress === 100 ? 'bg-emerald-500' : 'bg-teal-500'}`}
                                    style={{ width: `${linkedTask.progress}%` }}
                                  />
                                </div>
                                <span className="font-mono font-bold text-xs">{linkedTask.progress}%</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">—</span>
                          )}

                          {/* Commitment Link */}
                          {linkedCommitment ? (
                            <div className="flex items-center justify-between gap-1 text-[11px]">
                              <span className="text-slate-500 flex items-center gap-1 truncate">
                                <Coins className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>التحصيل المالي:</span>
                              </span>
                              <span
                                className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                  linkedCommitment.status === 'fulfilled'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {linkedCommitment.status === 'fulfilled' ? 'تم التحصيل' : 'بانتظار السداد'}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* 8. Delivery Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                        {order.deliveryDate}
                      </td>

                      {/* 9. Action Button */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {linkedTask ? (
                          <button
                            type="button"
                            onClick={() => handleToggleTaskStatus(linkedTask.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              linkedTask.progress === 100
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-[#0F3935] hover:bg-[#134E48] text-white shadow-2xs'
                            }`}
                            title="إتمام مهمة التوزيع وتحديث حالة الطلبية تلقائياً"
                          >
                            {linkedTask.progress === 100 ? '✓ تم الإنجاز' : 'تأكيد التسليم'}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

              {/* ROWS: Tasks (المهام التنفيذية غير المربوطة أو عند اختيار تبويب المهام) */}
              {(activeTab === 'all' || activeTab === 'tasks') &&
                filteredData.tasks.map((task) => {
                  const isTaskDone = task.progress === 100 || task.status === 'completed';

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-colors"
                    >
                      {/* Type & Task # */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                            <CheckSquare className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <span className="font-mono font-bold text-teal-700 dark:text-teal-400 block">
                              {task.taskNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {task.category || 'تنفيذي'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-2.5 px-3">
                        <span className={`font-bold block ${isTaskDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {task.title}
                        </span>
                        {task.subtasks.length > 0 && (
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 block font-medium">
                            {task.subtasks.filter((st) => st.completed).length}/{task.subtasks.length} مهام فرعية مكتملة
                          </span>
                        )}
                      </td>

                      {/* Region */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">
                        {task.customerRef || '—'}
                      </td>

                      {/* Assignee */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                        {team.find((m) => m.id === task.assigneeId)?.name || 'فريق العمل'}
                      </td>

                      {/* Amount */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-400">
                        —
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isTaskDone
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-teal-50 text-teal-700 border-teal-300'
                          }`}
                        >
                          <span>{isTaskDone ? 'مكتملة' : 'قيد التنفيذ'}</span>
                        </span>
                      </td>

                      {/* Linked Info */}
                      <td className="py-2.5 px-3 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-teal-600 transition-all"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-xs">{task.progress}%</span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                        {task.dueDate}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleTaskStatus(task.id)}
                          className="p-1 text-slate-400 hover:text-emerald-600 transition cursor-pointer"
                          title="تبديل حالة الإنجاز"
                        >
                          {isTaskDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {/* ROWS: Commitments (الالتزامات المالية) */}
              {(activeTab === 'all' || activeTab === 'commitments') &&
                filteredData.commitments.map((cmt) => {
                  const isFulfilled = cmt.status === 'fulfilled';

                  return (
                    <tr
                      key={cmt.id}
                      className="hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors"
                    >
                      {/* Type & ID */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                            <Coins className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <span className="font-mono font-bold text-amber-700 dark:text-amber-400 block">
                              {cmt.id}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {cmt.commitmentType === 'receivable' ? 'لنا (تحصيل)' : 'علينا (سداد)'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-2.5 px-3">
                        <span className={`font-bold block ${isFulfilled ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {cmt.title}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          الجهة: {cmt.entity} • الفاتورة: {cmt.invoiceNumbers || '—'}
                        </span>
                      </td>

                      {/* Region */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">
                        {cmt.paymentMethod || 'نقداً'}
                      </td>

                      {/* Rep */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                        {cmt.person || 'المحاسب المالي'}
                      </td>

                      {/* Amount */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(cmt.amount || 0)} {cmt.currency || 'YER'}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isFulfilled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                          }`}
                        >
                          <span>{isFulfilled ? 'تم الوفاء' : 'قيد الانتظار'}</span>
                        </span>
                      </td>

                      {/* Linked Info */}
                      <td className="py-2.5 px-3 text-xs text-slate-500">
                        {cmt.linkedOrderId ? (
                          <span className="text-blue-600 font-mono font-bold">
                            مرتبط بطلبية
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                        {cmt.dueDate}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSettleCommitment(cmt.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isFulfilled
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                          }`}
                        >
                          {isFulfilled ? '✓ مسدد' : 'تسوية'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
