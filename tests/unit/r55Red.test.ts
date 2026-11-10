// @vitest-environment jsdom
/**
 * R55 — اختبارات حمراء لعقود WorkOS قبل الإصلاح.
 * لا تقيس مجرد إنشاء كائن؛ تقيس أن الروابط والأرقام والمخرجات التي يراها المستخدم صحيحة.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkOrder, WorkTask } from '../../src/types/workos';
import { dbStorage } from '../../src/database/dbStorage';
import { createTripleLinkOrder, runSmartAutomationEngine } from '../../src/utils/workos/workosAutomation';
import { exportWorkOSToCSV } from '../../src/utils/workos/workosExporters';
import { loadOrders, loadTeam, saveOrders } from '../../src/utils/workos/workosLoaders';

const baseOrder = (overrides: Partial<WorkOrder> = {}): WorkOrder => ({
  id: 'ord-existing',
  orderNumber: 'ORD-2026-009',
  title: 'طلبية قائمة',
  customerName: 'عميل قائم',
  orderType: 'توزيع',
  regionBranch: 'صنعاء',
  totalAmount: 100,
  currency: 'YER',
  status: 'processing',
  priority: 'high',
  startDate: '2026-11-01',
  deliveryDate: '2026-12-01',
  assignedRep: 'مندوب',
  linkedTaskProgress: 10,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
  ...overrides,
});

const baseTask = (overrides: Partial<WorkTask> = {}): WorkTask => ({
  id: 'task-linked',
  taskNumber: 'TSK-1001',
  title: 'مهمة مرتبطة',
  description: '',
  status: 'in_progress',
  priority: 'high',
  category: 'عام',
  tags: [],
  assigneeId: 'mem_1',
  dueDate: '2026-12-01',
  progress: 63,
  subtasks: [],
  checklist: [],
  comments: [],
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
  ...overrides,
});

beforeEach(() => {
  dbStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-07T10:00:00.000Z'));
});

afterEach(() => {
  dbStorage.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('R55 — عيوب WorkOS المثبتة قبل الإصلاح', () => {
  it('لا يكرر رقم الطلبية ويربط مهمة التسليم بمعرف عضو الفريق لا باسمه المعروض', () => {
    saveOrders([baseOrder()]);
    const assignee = loadTeam()[2];

    const created = createTripleLinkOrder({
      title: 'توريد السيروم',
      customerName: 'صيدلية النور',
      orderType: 'توريد',
      regionBranch: 'صنعاء',
      totalAmount: 500,
      priority: 'high',
      startDate: '2026-11-07',
      deliveryDate: '2026-11-08',
      assignedRep: assignee.name,
    });

    expect(created.order.orderNumber).toBe('ORD-2026-010');
    expect(created.task?.assigneeId).toBe(assignee.id);
    expect(loadTeam().some((member) => member.id === created.task?.assigneeId)).toBe(true);
  });

  it('يحفظ تقدم المهمة المرتبطة ولو لم تصل المهمة بعد إلى التسليم', () => {
    const order = baseOrder({ linkedTaskId: 'task-linked', linkedTaskProgress: 10 });
    saveOrders([order]);

    const result = runSmartAutomationEngine([baseTask({ progress: 63 })], [order], []);

    expect(result.updatedOrdersCount).toBe(0);
    expect(loadOrders().find((item) => item.id === order.id)?.linkedTaskProgress).toBe(63);
  });

  it('يصدر صفوف المهام حين تستدعي الواجهة المصدر القديم الذي يمرر مصفوفة مهام', () => {
    let serialized = '';
    class CapturedBlob {
      constructor(parts: unknown[]) {
        serialized = parts.join('');
      }
    }
    vi.stubGlobal('Blob', CapturedBlob);
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:r55', revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    exportWorkOSToCSV([baseTask({ title: 'صف من واجهة WorkOS' })] as unknown as Parameters<
      typeof exportWorkOSToCSV
    >[0]);

    expect(serialized).toContain('صف من واجهة WorkOS');
  });
});
