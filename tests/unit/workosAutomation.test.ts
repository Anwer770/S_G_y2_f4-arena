import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkCommitment, WorkOrder, WorkTask } from '../../src/types/workos';
import { dbStorage } from '../../src/database/dbStorage';
import { createTripleLinkOrder, runSmartAutomationEngine } from '../../src/utils/workos/workosAutomation';
import { loadOrders, saveOrders, saveTasks, saveTeam } from '../../src/utils/workos/workosLoaders';

const order = (overrides: Partial<WorkOrder> = {}): WorkOrder => ({
  id: 'ord-1',
  orderNumber: 'ORD-2026-001',
  title: 'طلب',
  customerName: 'عميل',
  orderType: 'توريد',
  regionBranch: 'صنعاء',
  totalAmount: 100,
  currency: 'YER',
  status: 'processing',
  priority: 'high',
  startDate: '2026-11-01',
  deliveryDate: '2026-11-09',
  assignedRep: 'مندوب',
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
  ...overrides,
});
const task = (overrides: Partial<WorkTask> = {}): WorkTask => ({
  id: 'task-1',
  taskNumber: 'TSK-1001',
  title: 'مهمة',
  description: '',
  status: 'in_progress',
  priority: 'high',
  category: 'عام',
  tags: [],
  assigneeId: 'mem_1',
  dueDate: '2026-11-09',
  progress: 0,
  subtasks: [],
  checklist: [],
  comments: [],
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
  ...overrides,
});
const commitment = (overrides: Partial<WorkCommitment> = {}): WorkCommitment => ({
  id: 'cmt-1',
  title: 'تحصيل',
  entity: 'عميل',
  person: 'مندوب',
  description: '',
  commitmentDate: '2026-11-01',
  dueDate: '2026-11-07',
  status: 'pending',
  importance: 'A',
  notes: '',
  amount: 100,
  currency: 'YER',
  ...overrides,
});

describe('R55 — أتمتة الطلبيات والروابط الثلاثية', () => {
  beforeEach(() => {
    dbStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-07T10:00:00.000Z'));
  });
  afterEach(() => {
    dbStorage.clear();
    vi.useRealTimers();
  });

  it('ينشئ الروابط الاختيارية والأرقام التالية من أعلى رقم لا من طول القائمة', () => {
    saveOrders([order({ orderNumber: 'ORD-2026-090' }), order({ id: 'other', orderNumber: 'رقم يدوي' })]);
    const full = createTripleLinkOrder({
      title: 'جديد',
      customerName: 'عميل',
      orderType: 'توريد',
      regionBranch: 'صنعاء',
      totalAmount: 4,
      priority: 'urgent',
      startDate: '2026-11-07',
      deliveryDate: '2026-11-08',
      assignedRep: 'عضو غير معروف',
    });
    expect(full.order.orderNumber).toBe('ORD-2026-091');
    expect(full.task).toMatchObject({ priority: 'urgent', assigneeId: 'mem_1', linkedOrderId: full.order.id });
    expect(full.commitment).toMatchObject({ importance: 'A', linkedTaskId: full.task?.id });

    saveTeam([]);
    const numberFallback = createTripleLinkOrder({
      title: 'رقم بديل',
      customerName: 'عميل',
      orderType: 'توريد',
      regionBranch: 'صنعاء',
      totalAmount: 1,
      priority: 'medium',
      startDate: '2026-11-07',
      deliveryDate: '2026-11-08',
      assignedRep: 'معرف-احتياطي',
    });
    expect(numberFallback.task?.assigneeId).toBe('معرف-احتياطي');

    saveOrders([{ ...order({ id: 'blank-number', orderNumber: '' }) }]);
    saveTasks([task({ id: 'blank-task-number', taskNumber: '' })]);
    createTripleLinkOrder({
      title: 'تسلسل من رقم مفقود',
      customerName: 'عميل',
      orderType: 'توريد',
      regionBranch: 'صنعاء',
      totalAmount: 1,
      priority: 'medium',
      startDate: '2026-11-07',
      deliveryDate: '2026-11-08',
      assignedRep: 'معرف-احتياطي',
    });

    const onlyOrder = createTripleLinkOrder({
      title: 'بدون روابط',
      customerName: 'عميل',
      orderType: '',
      regionBranch: '',
      totalAmount: Number.NaN,
      priority: 'low',
      startDate: '',
      deliveryDate: '',
      assignedRep: '',
      generateTask: false,
      generateCommitment: false,
    });
    expect(onlyOrder).toMatchObject({ task: undefined, commitment: undefined });
    expect(onlyOrder.order).toMatchObject({
      totalAmount: 0,
      orderType: 'طلبيات صيدليات',
      regionBranch: 'منطقة الحصبة',
      assignedRep: 'مندوب التوزيع',
    });
  });

  it('يغطي بدائل بيانات الربط الفارغة والتسليم بالحالة/المهام الفرعية', () => {
    const missingFields = createTripleLinkOrder({
      title: 'بدائل',
      customerName: 'عميل',
      orderType: 'توريد',
      regionBranch: 'صنعاء',
      totalAmount: 1,
      priority: undefined as never,
      startDate: undefined as never,
      deliveryDate: undefined as never,
      assignedRep: undefined as never,
      notes: undefined,
      paymentMethod: undefined,
      invoiceNumber: undefined,
    });
    expect(missingFields.task).toMatchObject({ priority: 'high', startDate: '2026-11-07', dueDate: '2026-11-07' });
    expect(missingFields.commitment).toMatchObject({ importance: 'C', paymentMethod: 'نقداً عند التسليم' });

    const statusOrder = order({ id: 'by-status', linkedTaskId: 'completed' });
    const subtasksOrder = order({ id: 'by-subtasks', linkedTaskId: 'subtasks' });
    const noDate = order({ id: 'no-date', deliveryDate: '' });
    const noCommitment = order({ id: 'no-commitment', linkedCommitmentId: 'missing' });
    const noDueCommitment = order({ id: 'no-due-commitment', linkedCommitmentId: 'without-due' });
    runSmartAutomationEngine(
      [
        task({ id: 'completed', status: 'completed' }),
        task({ id: 'subtasks', subtasks: [{ id: 's', title: 's', completed: true }] }),
      ],
      [statusOrder, subtasksOrder, noDate, noCommitment, noDueCommitment],
      [commitment({ id: 'without-due', dueDate: '' })]
    );
    expect(loadOrders().filter((item) => item.status === 'delivered')).toHaveLength(2);
  });

  it('يحدّث التقدم والتسليم والتنبيهات المالية/المتأخرة مرة واحدة وبلا تحديث للملغى', () => {
    const deliverable = order({
      id: 'deliver',
      linkedTaskId: 'done',
      linkedCommitmentId: 'cmt-1',
      deliveryDate: '2026-11-01',
    });
    const late = order({ id: 'late', linkedTaskId: 'missing', deliveryDate: '2026-11-01' });
    const cancelled = order({ id: 'cancelled', status: 'cancelled', linkedTaskId: 'done', deliveryDate: '2026-11-01' });
    saveOrders([deliverable, late, cancelled]);

    const result = runSmartAutomationEngine(
      [
        task({ id: 'done', progress: 100, subtasks: [{ id: 'sub', title: 'x', completed: true }] }),
        task({ id: 'subtasks', subtasks: [{ id: 'sub', title: 'x', completed: true }] }),
      ],
      [deliverable, late, cancelled],
      [commitment()]
    );

    expect(result.updatedOrdersCount).toBe(1);
    expect(result.triggeredAlerts.map((alert) => alert.type)).toEqual(
      expect.arrayContaining(['order_delivered', 'order_delay', 'commitment_due'])
    );
    expect(loadOrders().find((item) => item.id === 'deliver')).toMatchObject({
      status: 'delivered',
      linkedTaskProgress: 100,
    });
    expect(loadOrders().find((item) => item.id === 'cancelled')?.status).toBe('cancelled');
  });

  it('لا يكتب حين لا توجد علاقة متغيرة ولا ينبه التزاماً موفى أو تاريخاً مستقبلياً', () => {
    const stable = order({
      linkedTaskId: 'same',
      linkedCommitmentId: 'paid',
      linkedTaskProgress: 50,
      deliveryDate: '2026-12-01',
    });
    saveOrders([stable]);
    const result = runSmartAutomationEngine(
      [task({ id: 'same', progress: 50 })],
      [stable],
      [commitment({ id: 'paid', status: 'fulfilled', dueDate: '2026-11-01' })]
    );

    expect(result).toEqual({ updatedOrdersCount: 0, triggeredAlerts: [] });
    expect(loadOrders()).toEqual([stable]);
  });
});
