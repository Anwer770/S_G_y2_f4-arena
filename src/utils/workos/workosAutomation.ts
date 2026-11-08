/**
 * محرّك الأتمتة الذكي + الأوامر الثلاثية — مستخرج من workosStorage.ts (R30).
 */
import { WorkOrder, WorkTask, WorkCommitment, TaskPriority } from '../../types/workos';
import {
  loadOrders,
  saveOrders,
  loadTasks,
  saveTasks,
  loadCommitments,
  saveCommitments,
  logWorkActivity,
} from './workosLoaders';

export interface TripleOrderInput {
  title: string;
  customerName: string;
  orderType: string;
  regionBranch: string;
  totalAmount: number;
  priority: TaskPriority;
  startDate: string;
  deliveryDate: string;
  assignedRep: string;
  notes?: string;
  generateTask?: boolean;
  generateCommitment?: boolean;
  paymentMethod?: string;
  invoiceNumber?: string;
}

export function createTripleLinkOrder(input: TripleOrderInput): {
  order: WorkOrder;
  task?: WorkTask;
  commitment?: WorkCommitment;
} {
  const currentOrders = loadOrders();
  const currentTasks = loadTasks();
  const currentCommitments = loadCommitments();

  const timestamp = Date.now();
  const orderNum = `ORD-${new Date().getFullYear()}-${String(currentOrders.length + 1).padStart(3, '0')}`;
  const orderId = `ord_${timestamp}`;
  const taskId = input.generateTask !== false ? `tsk_dlv_${timestamp}` : undefined;
  const commitmentId = input.generateCommitment !== false ? `cmt_ord_${timestamp}` : undefined;

  let createdTask: WorkTask | undefined;
  let createdCommitment: WorkCommitment | undefined;

  // 1. Create Linked Task if requested
  if (taskId) {
    const taskNum = `TSK-${1000 + currentTasks.length + 1}`;
    createdTask = {
      id: taskId,
      taskNumber: taskNum,
      title: `توصيل وتسليم طلبية: ${input.title} - ${input.customerName}`,
      description: `مهمة تسليم تنفيذية لطلبية رقم ${orderNum}.\nالمنطقة: ${input.regionBranch}\nالملاحظات: ${input.notes || 'تسليم فوري ومطابقة الفاتورة'}`,
      status: 'in_progress',
      priority: input.priority || 'high',
      category: 'طلبيات وتوزيع',
      tags: ['طلبية', 'توزيع', input.regionBranch],
      assigneeId: input.assignedRep || 'mem_3',
      startDate: input.startDate || new Date().toISOString().slice(0, 10),
      dueDate: input.deliveryDate || new Date().toISOString().slice(0, 10),
      progress: 0,
      subtasks: [
        { id: `sub_${timestamp}_1`, title: 'تجهيز أصناف الطلبية من المستودع المركزي', completed: false },
        { id: `sub_${timestamp}_2`, title: 'مطابقة الفاتورة وإذن الصرف مع أمين المخزن', completed: false },
        {
          id: `sub_${timestamp}_3`,
          title: `نقل وإيصال الطلبية إلى ${input.customerName} (${input.regionBranch})`,
          completed: false,
        },
        { id: `sub_${timestamp}_4`, title: 'توقيع سند الاستلام وتأكيد سداد/تحصيل القيمة', completed: false },
      ],
      checklist: [
        { id: `chk_${timestamp}_1`, text: 'التأكد من سلامة التغليف وتاريخ الصلاحية', completed: false },
        { id: `chk_${timestamp}_2`, text: 'إرفاق نسخة الفاتورة وسند القبض', completed: false },
      ],
      comments: [],
      timeEntries: [],
      customerRef: input.customerName,
      linkedOrderId: orderId,
      linkedCommitmentId: commitmentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // 2. Create Linked Financial Commitment if requested
  if (commitmentId) {
    createdCommitment = {
      id: commitmentId,
      title: `تحصيل قيمة طلبية ${orderNum} (${input.customerName})`,
      entity: input.customerName,
      person: input.assignedRep,
      description: `مستحقات مالية عن طلبية توريد رقم ${orderNum} بمبلغ ${input.totalAmount.toLocaleString()} ريال يمني.\nطريقة السداد: ${input.paymentMethod || 'نقداً عند التسليم'}\nرقم الفاتورة: ${input.invoiceNumber || 'INV-' + timestamp.toString().slice(-4)}`,
      commitmentDate: input.startDate || new Date().toISOString().slice(0, 10),
      dueDate: input.deliveryDate || new Date().toISOString().slice(0, 10),
      status: 'pending',
      importance: input.priority === 'urgent' ? 'A' : input.priority === 'high' ? 'B' : 'C',
      notes: input.notes || 'التزام مالي مرتبط بطلبية عميل',
      amount: input.totalAmount,
      currency: 'YER',
      paymentMethod: input.paymentMethod || 'نقداً عند التسليم',
      invoiceNumbers: input.invoiceNumber || `INV-${timestamp.toString().slice(-4)}`,
      commitmentType: 'receivable',
      linkedOrderId: orderId,
      linkedTaskId: taskId,
    };
  }

  // 3. Create Main Order
  const newOrder: WorkOrder = {
    id: orderId,
    orderNumber: orderNum,
    title: input.title,
    customerName: input.customerName,
    orderType: input.orderType || 'طلبيات صيدليات',
    regionBranch: input.regionBranch || 'منطقة الحصبة',
    totalAmount: Number(input.totalAmount) || 0,
    currency: 'YER',
    status: 'processing',
    priority: input.priority || 'high',
    startDate: input.startDate || new Date().toISOString().slice(0, 10),
    deliveryDate: input.deliveryDate || new Date().toISOString().slice(0, 10),
    assignedRep: input.assignedRep || 'مندوب التوزيع',
    notes: input.notes || '',
    linkedTaskId: taskId,
    linkedCommitmentId: commitmentId,
    linkedTaskProgress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Persist all together
  saveOrders([newOrder, ...currentOrders]);
  if (createdTask) saveTasks([createdTask, ...currentTasks]);
  if (createdCommitment) saveCommitments([createdCommitment, ...currentCommitments]);

  logWorkActivity('محمد العولقي', 'إضافة طلبية جديدة مع الربط الثلاثي', 'order', orderNum, '', input.title);

  return {
    order: newOrder,
    task: createdTask,
    commitment: createdCommitment,
  };
}

// ============================================================================
// AUTOMATION & INTELLIGENT ALERTS ENGINE (محرك الأتمتة والتنبيهات الذكية)
// ============================================================================

export interface AutomationCheckResult {
  updatedOrdersCount: number;
  triggeredAlerts: Array<{
    id: string;
    type: 'order_delay' | 'order_delivered' | 'commitment_due' | 'task_blocker';
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    entityId: string;
    entityType: 'order' | 'task' | 'commitment';
    dueDate?: string;
  }>;
}

export function runSmartAutomationEngine(
  tasks: WorkTask[],
  orders: WorkOrder[],
  commitments: WorkCommitment[]
): AutomationCheckResult {
  const todayStr = new Date().toISOString().slice(0, 10);
  let updatedOrdersCount = 0;
  const triggeredAlerts: AutomationCheckResult['triggeredAlerts'] = [];

  const updatedOrders = orders.map((ord) => {
    const orderCopy = { ...ord };

    // 1. Check Linked Task Progress & Auto-Update
    if (ord.linkedTaskId) {
      const linkedTask = tasks.find((t) => t.id === ord.linkedTaskId);
      if (linkedTask) {
        orderCopy.linkedTaskProgress = linkedTask.progress;

        // Auto Delivery Trigger: If task is completed (100% or status === 'completed')
        const allSubtasksDone =
          Array.isArray(linkedTask.subtasks) &&
          linkedTask.subtasks.length > 0 &&
          linkedTask.subtasks.every((st) => st.completed);

        if (
          (linkedTask.progress === 100 || linkedTask.status === 'completed' || allSubtasksDone) &&
          orderCopy.status !== 'delivered' &&
          orderCopy.status !== 'cancelled'
        ) {
          orderCopy.status = 'delivered';
          orderCopy.updatedAt = new Date().toISOString();
          updatedOrdersCount++;

          triggeredAlerts.push({
            id: `alt_del_${ord.id}`,
            type: 'order_delivered',
            severity: 'info',
            title: `تم إنجاز وتسليم الطلبية تلقائياً: ${ord.orderNumber}`,
            message: `اكتملت المهام الفرعية لطلبية ${ord.customerName} بنسبة 100%، وتم تحويل حالة الطلبية إلى "تم التسليم" آلياً.`,
            entityId: ord.id,
            entityType: 'order',
          });
        }
      }
    }

    // 2. Check Order Delivery Delay
    if (orderCopy.status !== 'delivered' && orderCopy.status !== 'cancelled') {
      if (orderCopy.deliveryDate && orderCopy.deliveryDate < todayStr) {
        triggeredAlerts.push({
          id: `alt_ovd_${ord.id}`,
          type: 'order_delay',
          severity: 'critical',
          title: `تنبيه حرج: تأخر موعد تسليم الطلبية ${ord.orderNumber}`,
          message: `الطلبية مخصصة لـ (${ord.customerName} - ${ord.regionBranch}) وكان موعد تسليمها في ${ord.deliveryDate}. يتطلب تدخل وتنسيق فوري.`,
          entityId: ord.id,
          entityType: 'order',
          dueDate: ord.deliveryDate,
        });
      }
    }

    // 3. Check Linked Commitment Due
    if (ord.linkedCommitmentId) {
      const linkedCommitment = commitments.find((c) => c.id === ord.linkedCommitmentId);
      if (linkedCommitment && linkedCommitment.status !== 'fulfilled') {
        if (linkedCommitment.dueDate && linkedCommitment.dueDate <= todayStr) {
          triggeredAlerts.push({
            id: `alt_cmt_${linkedCommitment.id}`,
            type: 'commitment_due',
            severity: 'critical',
            title: `تنبيه مالي: استحقاق تحصيل فاتورة طلبية ${ord.orderNumber}`,
            message: `مبلغ ${Number(ord.totalAmount).toLocaleString()} ريال يمني مستحق السداد من (${ord.customerName}) بتاريخ ${linkedCommitment.dueDate}.`,
            entityId: linkedCommitment.id,
            entityType: 'commitment',
            dueDate: linkedCommitment.dueDate,
          });
        }
      }
    }

    return orderCopy;
  });

  if (updatedOrdersCount > 0) {
    saveOrders(updatedOrders);
  }

  return {
    updatedOrdersCount,
    triggeredAlerts,
  };
}

// ============================================================================
// UNIFIED IMPORT & EXPORT (استيراد وتصدير موحد للطلبيات والمهام والالتزامات)
// ============================================================================
