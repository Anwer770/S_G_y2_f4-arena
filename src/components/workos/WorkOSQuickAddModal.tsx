import React, { useState, useEffect } from 'react';
import { WorkProject, TeamMember, TaskPriority, WorkOrder, WorkSubtask } from '../../types/workos';
import { createTripleLinkOrder } from '../../utils/workosStorage';
import {
  X,
  CheckSquare,
  FolderKanban,
  ShoppingCart,
  Coins,
  Calendar,
  BookOpen,
  Target,
  Flame,
  Plus,
  Trash2,
  Sparkles,
  Link2,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Tag,
} from 'lucide-react';

interface WorkOSQuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: string;
  initialProjectId?: string;
  initialPriority?: TaskPriority;
  projects: WorkProject[];
  team: TeamMember[];
  onAddTask: (task: any) => void;
  onAddOrder?: (order: WorkOrder) => void;
  onAddProject: (project: any) => void;
  onAddNote: (note: any) => void;
  onAddAppointment: (appointment: any) => void;
  onAddCommitment: (commitment: any) => void;
  onAddHabit: (habit: any) => void;
  onAddGoal: (goal: any) => void;
}

export const WorkOSQuickAddModal: React.FC<WorkOSQuickAddModalProps> = ({
  isOpen,
  onClose,
  initialType = 'task',
  initialProjectId,
  initialPriority,
  projects,
  team,
  onAddTask,
  onAddOrder,
  onAddProject,
  onAddNote,
  onAddAppointment,
  onAddCommitment,
  onAddHabit,
  onAddGoal,
}) => {
  // Active Tab Type
  const [activeType, setActiveType] = useState<string>(initialType || 'task');

  // 1. Common Fixed Fields (الحقول المشتركة الثابتة)
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<TaskPriority>(initialPriority || 'high');
  const [assignedRep, setAssignedRep] = useState(team[0]?.name || 'م. يحيى الشامي');
  const [clientOrParty, setClientOrParty] = useState('صيدلية النور الحديثة');
  const [description, setDescription] = useState('');

  // 2. Dynamic: Order Fields (طلبية / طلب)
  const [orderType, setOrderType] = useState('طلبيات صيدليات');
  const [regionBranch, setRegionBranch] = useState('منطقة الحصبة');
  const [orderTotalAmount, setOrderTotalAmount] = useState<number | ''>(250000);
  const [orderStatus, setOrderStatus] = useState<'processing' | 'shipped' | 'delivered' | 'pending'>('processing');
  const [generateDeliveryTask, setGenerateDeliveryTask] = useState(true);
  const [generateFinancialCommitment, setGenerateFinancialCommitment] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('نقداً عند التسليم');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // 3. Dynamic: Financial Commitment Fields (التزام مالي)
  const [commitmentAmount, setCommitmentAmount] = useState<number | ''>(150000);
  const [commitmentType, setCommitmentType] = useState<'receivable' | 'payable' | 'contractual'>('receivable');
  const [commitmentPaymentMethod, setCommitmentPaymentMethod] = useState('نقداً');
  const [commitmentInvoices, setCommitmentInvoices] = useState('');
  const [commitmentStatus, setCommitmentStatus] = useState<'pending' | 'in_progress' | 'fulfilled' | 'breached'>('pending');

  // 4. Dynamic: Task Fields (مهمة + مهام فرعية)
  const [projectId, setProjectId] = useState(initialProjectId || projects[0]?.id || '');
  const [subtasks, setSubtasks] = useState<Array<{ id: string; title: string; completed: boolean }>>([
    { id: '1', title: 'مراجعة المتطلبات والتجهيز الفني', completed: false },
    { id: '2', title: 'التنفيذ والمتابعة الميدانية', completed: false },
  ]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // 5. Dynamic: Appointment Fields (موعد)
  const [appointmentTime, setAppointmentTime] = useState('10:30');
  const [appointmentLocation, setAppointmentLocation] = useState('المقر الرئيسي - قاعة الاجتماعات');
  const [appointmentPerson, setAppointmentPerson] = useState('');

  // 6. Dynamic: Project Fields (مشروع)
  const [projectBudget, setProjectBudget] = useState<number | ''>(500000);
  const [projectCategory, setProjectCategory] = useState('تطوير وتوسع');

  // 7. Dynamic: Habit & Goal Fields
  const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekdays'>('daily');
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState(5);
  const [goalTargetProgress, setGoalTargetProgress] = useState(0);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      if (initialType) setActiveType(initialType);
      if (initialPriority) setPriority(initialPriority);
      if (initialProjectId) setProjectId(initialProjectId);
      setTitle('');
      setDescription('');
      setInvoiceNumber(`INV-${Date.now().toString().slice(-4)}`);
      setCommitmentInvoices(`INV-${Date.now().toString().slice(-4)}`);
      setAssignedRep(team[0]?.name || 'م. يحيى الشامي');
      setClientOrParty(initialType === 'order' ? 'صيدلية النور الحديثة' : initialType === 'commitment' ? 'مؤسسة الشفاء الطبية' : 'الجهة المعنية / العميل');
      setAppointmentPerson('د. عبد الرحمن الهاملي');
    }
  }, [isOpen, initialType, initialPriority, initialProjectId, team]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: Date.now().toString(), title: newSubtaskTitle.trim(), completed: false },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (activeType === 'order') {
      // 1. Triple Link Order Creation
      const result = createTripleLinkOrder({
        title: title.trim(),
        customerName: clientOrParty.trim() || 'صيدلية النور الحديثة',
        orderType,
        regionBranch,
        totalAmount: Number(orderTotalAmount) || 0,
        priority,
        startDate,
        deliveryDate: dueDate,
        assignedRep: team.find((m) => m.name === assignedRep)?.name || assignedRep || 'د. سامي الميداني',
        notes: description,
        generateTask: generateDeliveryTask,
        generateCommitment: generateFinancialCommitment,
        paymentMethod,
        invoiceNumber,
      });

      if (onAddOrder) onAddOrder(result.order);
      if (result.task && onAddTask) onAddTask(result.task);
      if (result.commitment && onAddCommitment) onAddCommitment(result.commitment);
    } else if (activeType === 'task') {
      // 2. Task with Subtasks
      onAddTask({
        title: title.trim(),
        description,
        priority,
        startDate,
        dueDate,
        projectId: projectId || undefined,
        assigneeId: team.find((m) => m.name === assignedRep)?.id || team[0]?.id || 'mem_1',
        category: 'عام',
        status: 'ready',
        progress: 0,
        subtasks,
      });
    } else if (activeType === 'commitment') {
      // 3. Financial Commitment
      onAddCommitment({
        title: title.trim(),
        entity: clientOrParty.trim() || 'الجهة المعنية',
        person: assignedRep || team[0]?.name || 'المسؤول المالي',
        description,
        commitmentDate: startDate,
        dueDate,
        status: commitmentStatus,
        importance: priority === 'urgent' ? 'A' : priority === 'high' ? 'B' : 'C',
        amount: Number(commitmentAmount) || 0,
        currency: 'YER',
        paymentMethod: commitmentPaymentMethod,
        invoiceNumbers: commitmentInvoices,
        commitmentType,
      });
    } else if (activeType === 'project') {
      // 4. Project
      onAddProject({
        name: title.trim(),
        description,
        priority,
        startDate,
        dueDate,
        manager: assignedRep || 'م. يحيى الشامي',
        category: projectCategory,
        budget: Number(projectBudget) || undefined,
        progress: 0,
      });
    } else if (activeType === 'appointment') {
      // 5. Appointment
      onAddAppointment({
        title: title.trim(),
        person: appointmentPerson || clientOrParty || 'العميل',
        location: appointmentLocation,
        date: dueDate,
        time: appointmentTime,
        durationMinutes: 45,
        notes: description,
        status: 'scheduled',
      });
    } else if (activeType === 'note') {
      // 6. Note
      onAddNote({
        title: title.trim(),
        content: description,
        type: 'idea',
        tags: ['سريع', 'WorkOS'],
        linkedProjectId: projectId || undefined,
      });
    } else if (activeType === 'goal') {
      // 7. Goal
      onAddGoal({
        title: title.trim(),
        category: 'نمو وتشغيل',
        targetDate: dueDate,
        progress: goalTargetProgress,
        status: 'on_track',
        visionDescription: description,
        objectives: [],
      });
    } else if (activeType === 'habit') {
      // 8. Habit
      onAddHabit({
        name: title.trim(),
        category: 'انضباط يومي',
        frequency: habitFrequency,
        targetDaysPerWeek: targetDaysPerWeek,
        streak: 0,
        bestStreak: 0,
        completedDates: [],
        notes: description,
      });
    }

    onClose();
  };

  const INPUT_TABS = [
    { id: 'task', label: 'مهمة', icon: CheckSquare, badge: 'تنفيذي' },
    { id: 'project', label: 'مشروع', icon: FolderKanban, badge: 'إداري' },
    { id: 'order', label: 'طلبية / طلب', icon: ShoppingCart, badge: 'مبيعات وتوريد' },
    { id: 'commitment', label: 'التزام مالي', icon: Coins, badge: 'مالي وذمم' },
    { id: 'appointment', label: 'موعد', icon: Calendar, badge: 'ميداني' },
    { id: 'note', label: 'ملاحظة', icon: BookOpen, badge: 'معرفة' },
    { id: 'goal', label: 'هدف', icon: Target, badge: 'استراتيجي' },
    { id: 'habit', label: 'عادة', icon: Flame, badge: 'انضباط' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#0F3935] text-white rounded-xl shadow-xs">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>الشاشة الموحدة للإدخال السريع (+ Quick Add المركزية)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700">
                  Work OS v3.0
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                إدخال مركزي متكامل مع الربط التلقائي بين الطلبيات والمهام والالتزامات المالية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. All Input Type Tabs: [ مهمة | مشروع | طلبية / طلب | التزام مالي | موعد | ملاحظة | هدف | عادة ] */}
        <div className="bg-slate-100/70 dark:bg-slate-800/50 p-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-thin">
          <div className="flex gap-1.5 min-w-max">
            {INPUT_TABS.map((item) => {
              const Icon = item.icon;
              const isActive = activeType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveType(item.id)}
                  className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-[#0F3935] text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700/70 bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-300' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[calc(85vh-130px)] overflow-y-auto scrollbar-thin">
          {/* SECTION A: الحقول المشتركة الثابتة (تظهر دائماً في كل الأنواع) */}
          <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700">
            <div className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200/50 dark:border-slate-700/50">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>الحقول الأساسية المشتركة (لكل أنواع المدخلات)</span>
            </div>

            {/* 1. العنوان الرئيسي */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                العنوان الرئيسي <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  activeType === 'order'
                    ? 'مثال: طلبية صيدلية النور - شحنة مستحضرات فيتامين سي'
                    : activeType === 'commitment'
                    ? 'مثال: تحصيل دفعة مبيعات صيدلية الأمل'
                    : activeType === 'project'
                    ? 'مثال: مشروع إطلاق خط مستحضرات العناية Q3'
                    : 'اكتب العنوان الرئيسي هنا...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>

            {/* 2 & 3. تاريخ البداية + تاريخ الاستحقاق/التسليم + مستوى الأولوية (A/B/C/D) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاريخ البداية
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاريخ الاستحقاق / التسليم
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مستوى الأولوية
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488] cursor-pointer"
                >
                  <option value="urgent">A - حرجة / عاجلة جداً</option>
                  <option value="high">B - عالية</option>
                  <option value="medium">C - متوسطة</option>
                  <option value="low">D - منخفضة</option>
                </select>
              </div>
            </div>

            {/* 4. المسؤول / الجهة المعنية (أعضاء الفريق، العميل، أو المورد) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المسؤول / المندوب المكلف
                </label>
                <select
                  value={assignedRep || ''}
                  onChange={(e) => setAssignedRep(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488] cursor-pointer"
                >
                  {team.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                  <option value="مندوب التوزيع الميداني">مندوب التوزيع الميداني</option>
                  <option value="فريق العمليات والمستودع">فريق العمليات والمستودع</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الجهة المعنية / العميل / المورد
                </label>
                <input
                  type="text"
                  placeholder="مثال: صيدلية النور الحديثة، مستشفى الأمل..."
                  value={clientOrParty || ''}
                  onChange={(e) => setClientOrParty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
            </div>

            {/* 5. الوصف والملاحظات التفصيلية */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الوصف والملاحظات التفصيلية
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="تفاصيل إضافية، بنود محددة، شروط التسليم أو الملاحظات المحاسبية..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>
          </div>

          {/* SECTION B: الحقول الديناميكية (Dynamic Fields based on Selected Input Type) */}

          {/* 1. عند اختيار "طلبية / طلب" */}
          {activeType === 'order' && (
            <div className="space-y-3.5 p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 animate-in fade-in">
              <div className="flex items-center justify-between pb-1.5 border-b border-blue-200/80 dark:border-blue-800">
                <span className="font-black text-xs text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>بيانات الطلبية ونظام الربط الثلاثي الآلي</span>
                </span>
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2.5 py-0.5 rounded-full border border-blue-300">
                  ربط تلقائي
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نوع الطلبية
                  </label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    <option value="طلبيات صيدليات">طلبيات صيدليات</option>
                    <option value="عينات">عينات ترويجية</option>
                    <option value="منتجات مستوردة">منتجات مستوردة</option>
                    <option value="بيع جملة">بيع جملة وموزعين</option>
                    <option value="توريد مباشر">توريد مباشر</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المنطقة / الفرع المعني
                  </label>
                  <input
                    type="text"
                    value={regionBranch}
                    onChange={(e) => setRegionBranch(e.target.value)}
                    placeholder="مثال: منطقة الحصبة"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المبلغ الإجمالي (ريال)
                  </label>
                  <input
                    type="number"
                    value={orderTotalAmount !== undefined ? orderTotalAmount : ''}
                    onChange={(e) =>
                      setOrderTotalAmount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-blue-700 dark:text-blue-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حالة الطلبية
                  </label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold cursor-pointer"
                  >
                    <option value="processing">قيد التجهيز</option>
                    <option value="shipped">تم الشحن</option>
                    <option value="delivered">تم التسليم</option>
                    <option value="pending">معلقة</option>
                  </select>
                </div>
              </div>

              {/* الربط الثلاثي الآلي: مهمة تسليم + التزام مالي */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-blue-200/90 dark:border-blue-900 space-y-2.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-100">
                  <Link2 className="w-4 h-4 text-teal-600" />
                  <span>محرك الربط الثلاثي الآلي (مهمة تسليم + التزام مالي في نفس السطر):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateDeliveryTask}
                      onChange={(e) => setGenerateDeliveryTask(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                    />
                    <div>
                      <span className="font-bold block text-slate-800 dark:text-slate-200">
                        + إنشاء مهمة تسليم وتوزيع مرتبطة آلياً
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        تتضمن 4 مهام فرعية (تجهيز، مطابقة، شحن، وتوقيع استلام)
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateFinancialCommitment}
                      onChange={(e) => setGenerateFinancialCommitment(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                    <div>
                      <span className="font-bold block text-slate-800 dark:text-slate-200">
                        + إنشاء التزام مالي / فاتورة تحصيل مرتبطة
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        ربط المبلغ وتاريخ الاستحقاق آلياً بجدول الديون والالتزامات
                      </span>
                    </div>
                  </label>
                </div>

                {generateFinancialCommitment && (
                  <div className="grid grid-cols-2 gap-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-700">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                        طريقة السداد
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      >
                        <option value="نقداً عند التسليم">نقداً عند التسليم</option>
                        <option value="آجل 15 يوم">آجل 15 يوم</option>
                        <option value="آجل 30 يوم">آجل 30 يوم</option>
                        <option value="حوالة الكريمي">حوالة بنكية / الكريمي</option>
                        <option value="شيك بنكي">شيك بنكي معمد</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                        رقم الفاتورة المتعلقة
                      </label>
                      <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. عند اختيار "التزام مالي" */}
          {activeType === 'commitment' && (
            <div className="space-y-3 p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 animate-in fade-in">
              <div className="font-black text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5 pb-1 border-b border-amber-200">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>تفاصيل الالتزام المالي والمستحقات</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المبلغ المطلوب بالريال <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={commitmentAmount !== undefined ? commitmentAmount : ''}
                    onChange={(e) =>
                      setCommitmentAmount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-amber-800 dark:text-amber-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نوع الالتزام
                  </label>
                  <select
                    value={commitmentType}
                    onChange={(e) => setCommitmentType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    <option value="receivable">لنا (تحصيل / مدينون)</option>
                    <option value="payable">علينا (سداد / دائنون)</option>
                    <option value="contractual">التزام تعاقدي / توريد</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    طريقة السداد
                  </label>
                  <select
                    value={commitmentPaymentMethod}
                    onChange={(e) => setCommitmentPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    <option value="نقداً">نقداً</option>
                    <option value="آجل">آجل على الحساب</option>
                    <option value="تحويل الكريمي">حوالة الكريمي / بنك</option>
                    <option value="شيك">شيك بنكي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حالة الالتزام
                  </label>
                  <select
                    value={commitmentStatus}
                    onChange={(e) => setCommitmentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold cursor-pointer"
                  >
                    <option value="pending">قيد الانتظار</option>
                    <option value="in_progress">جاري التنفيذ</option>
                    <option value="fulfilled">تم السداد / الوفاء</option>
                    <option value="breached">متأخر / متعثر</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  أرقام الفواتير / القيود المتعلقة
                </label>
                <input
                  type="text"
                  value={commitmentInvoices}
                  onChange={(e) => setCommitmentInvoices(e.target.value)}
                  placeholder="مثال: INV-1048, سند صرف PV-409"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* 3. عند اختيار "مهمة" */}
          {activeType === 'task' && (
            <div className="space-y-3 p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
              <div className="font-black text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between pb-1 border-b border-emerald-200">
                <span className="flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>المشروع التابع والمهام الفرعية (Sub-tasks)</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-700">
                  {subtasks.length} مهام فرعية
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المشروع التابع له
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  <option value="">(مهمة عامة بدون مشروع محدد)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.code}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub-tasks Management */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  المهام الفرعية (Sub-tasks)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="اكتب مهمة فرعية واضغط إضافة..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                  >
                    + إضافة
                  </button>
                </div>

                {subtasks.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                    {subtasks.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          • {st.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(st.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="حذف المهمة الفرعية"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. عند اختيار "موعد" */}
          {activeType === 'appointment' && (
            <div className="space-y-3 p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 animate-in fade-in">
              <div className="font-black text-xs text-purple-900 dark:text-purple-200 flex items-center gap-1.5 pb-1 border-b border-purple-200">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>تفاصيل الموعد واللقاء الميداني</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الوقت
                  </label>
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المكان
                  </label>
                  <input
                    type="text"
                    value={appointmentLocation}
                    onChange={(e) => setAppointmentLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الشخص المعني
                  </label>
                  <input
                    type="text"
                    value={appointmentPerson}
                    onChange={(e) => setAppointmentPerson(e.target.value)}
                    placeholder="اسم المسؤول أو الطبيب أو العميل"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. عند اختيار "مشروع" */}
          {activeType === 'project' && (
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الميزانية التقديرية (ريال)
                </label>
                <input
                  type="number"
                  value={projectBudget !== undefined ? projectBudget : ''}
                  onChange={(e) =>
                    setProjectBudget(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تصنيف المشروع
                </label>
                <input
                  type="text"
                  value={projectCategory}
                  onChange={(e) => setProjectCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold"
                />
              </div>
            </div>
          )}

          {/* 6. عند اختيار "عادة" */}
          {activeType === 'habit' && (
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تكرار العادة
                </label>
                <select
                  value={habitFrequency}
                  onChange={(e) => setHabitFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  <option value="daily">يومياً (7 أيام)</option>
                  <option value="weekdays">أيام العمل الأسبوعية (5 أيام)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  أيام الإنجاز المستهدفة أسبوعياً
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={targetDaysPerWeek}
                  onChange={(e) => setTargetDaysPerWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>
            </div>
          )}

          {/* 7. عند اختيار "هدف" */}
          {activeType === 'goal' && (
            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نسبة الإنجاز الحالية للهدف %
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={goalTargetProgress}
                onChange={(e) => setGoalTargetProgress(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-400">
              * سيتم حفظ البيانات وتحديث لوحة القيادة المركزية والمزامنة فوراً.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#0F3935] hover:bg-[#134E48] text-white text-xs font-black shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ وإدراج في المنظومة</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
