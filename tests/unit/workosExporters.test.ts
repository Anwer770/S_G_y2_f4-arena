// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkCommitment, WorkOrder, WorkOSData, WorkTask } from '../../src/types/workos';
import { dbStorage } from '../../src/database/dbStorage';

const mocks = vi.hoisted(() => ({
  confetti: vi.fn(),
  assertFileSize: vi.fn(),
  readFirstSheetSafe: vi.fn(),
  xlsx: {
    utils: {
      book_new: vi.fn(() => ({ sheets: [] as unknown[] })),
      json_to_sheet: vi.fn((rows: unknown[]) => ({ rows })),
      book_append_sheet: vi.fn(),
    },
    writeFile: vi.fn(),
  },
}));

vi.mock('xlsx', () => mocks.xlsx);
vi.mock('canvas-confetti', () => ({ default: mocks.confetti }));
vi.mock('../../src/utils/xlsxSafe', () => ({
  assertFileSize: mocks.assertFileSize,
  readFirstSheetSafe: mocks.readFirstSheetSafe,
}));

import {
  downloadUnifiedWorkOSTemplate,
  downloadWorkOSTasksTemplate,
  exportUnifiedWorkOSToExcel,
  exportWorkOSToCSV,
  exportWorkOSToExcel,
  exportWorkOSToJSON,
  importUnifiedWorkOSFromExcel,
  importWorkOSTasksFromExcel,
  triggerConfetti,
} from '../../src/utils/workos/workosExporters';
import { loadOrders, loadTasks } from '../../src/utils/workos/workosLoaders';
import * as workosLoaders from '../../src/utils/workos/workosLoaders';

let readerMode: 'load' | 'error' = 'load';
class StubFileReader {
  onload: ((event: { target: { result: ArrayBuffer } }) => void) | null = null;
  onerror: (() => void) | null = null;

  readAsArrayBuffer(): void {
    if (readerMode === 'error') this.onerror?.();
    else this.onload?.({ target: { result: new ArrayBuffer(8) } });
  }
}

const task = (overrides: Partial<WorkTask> = {}): WorkTask => ({
  id: 'task-1',
  taskNumber: 'TSK-1',
  title: 'مهمة تصدير',
  description: 'وصف',
  status: 'in_progress',
  priority: 'high',
  category: 'مالية',
  tags: ['تقرير'],
  assigneeId: 'mem_1',
  projectId: 'prj_1',
  dueDate: '2026-11-09',
  progress: 25,
  estimatedHours: 4,
  actualHours: 1,
  subtasks: [],
  checklist: [],
  comments: [],
  createdAt: '2026-11-07T00:00:00.000Z',
  updatedAt: '2026-11-07T00:00:00.000Z',
  ...overrides,
});

const payload = (): WorkOSData =>
  ({
    tasks: [task()],
    projects: [
      {
        id: 'prj_1',
        code: 'P-1',
        name: 'مشروع تصدير',
        description: '',
        manager: 'المدير',
        startDate: '2026-11-01',
        dueDate: '2026-11-10',
        status: 'active',
        priority: 'high',
        progress: 50,
        category: 'عام',
      },
    ],
    team: [
      {
        id: 'mem_1',
        name: 'عضو الفريق',
        role: 'مدير',
        department: 'إدارة',
        email: 'a@example.test',
        phone: '1',
        avatarColor: 'bg-teal-500',
        capacityHoursPerWeek: 40,
        activeTasksCount: 1,
      },
    ],
    orders: [],
    commitments: [],
    workspaces: [],
    currentWorkspaceId: 'ws_main',
    inbox: [],
    dailyRoutine: [],
    dailyReviews: [],
    habits: [],
    goals: [],
    appointments: [],
    meetings: [],
    notes: [],
    automations: [],
    activities: [],
  }) as WorkOSData;

const captureBlob = () => {
  let text = '';
  class CapturedBlob {
    constructor(parts: unknown[]) {
      text = parts.join('');
    }
  }
  vi.stubGlobal('Blob', CapturedBlob);
  return () => text;
};

describe('R55 — مخرجات واستيراد WorkOS', () => {
  beforeEach(() => {
    dbStorage.clear();
    readerMode = 'load';
    mocks.confetti.mockReset();
    mocks.assertFileSize.mockReset();
    mocks.readFirstSheetSafe.mockReset();
    mocks.xlsx.utils.book_new.mockClear();
    mocks.xlsx.utils.json_to_sheet.mockClear();
    mocks.xlsx.utils.book_append_sheet.mockClear();
    mocks.xlsx.writeFile.mockClear();
    vi.stubGlobal('FileReader', StubFileReader);
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:r55', revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    dbStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('يحمي الاحتفال من تعطل المكتبة ويكتب JSON وCSV بالصفوف والعلاقات الصحيحة', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    triggerConfetti();
    mocks.confetti.mockImplementationOnce(() => {
      throw new Error('canvas blocked');
    });
    triggerConfetti();
    expect(warn).toHaveBeenCalled();

    const readBlob = captureBlob();
    exportWorkOSToJSON(payload());
    expect(readBlob()).toContain('مهمة تصدير');

    const readCSV = captureBlob();
    exportWorkOSToCSV(payload());
    expect(readCSV()).toContain('مشروع تصدير');
    expect(readCSV()).toContain('عضو الفريق');

    const readArrayCSV = captureBlob();
    exportWorkOSToCSV([task({ title: '=FORMULA', progress: 0 })]);
    expect(readArrayCSV()).toContain("'=FORMULA");

    exportWorkOSToCSV();
  });

  it('ينشئ ملفات Excel وقوالبها، مع القيمة الافتراضية والبيانات الناقصة', () => {
    exportWorkOSToExcel(payload());
    exportWorkOSToExcel({ tasks: undefined, projects: undefined, team: undefined } as unknown as WorkOSData);
    exportWorkOSToExcel();
    downloadWorkOSTasksTemplate();
    const sparseOrder = {
      orderNumber: 'ORD-1',
      title: 'طلبية',
      customerName: 'عميل',
      orderType: 'نوع',
      regionBranch: 'فرع',
      totalAmount: 0,
      currency: 'YER',
      status: 'processing',
      priority: 'high',
      startDate: '',
      deliveryDate: '',
      assignedRep: '',
      linkedTaskProgress: 0,
      notes: '',
    } as WorkOrder;
    const sparseCommitment = {
      id: 'c1',
      title: 'التزام',
      entity: 'عميل',
      person: 'مندوب',
      amount: 0,
      currency: '',
      status: 'pending',
      paymentMethod: '',
      invoiceNumbers: '',
      dueDate: '',
      linkedOrderId: '',
    } as WorkCommitment;
    exportUnifiedWorkOSToExcel([task({ linkedOrderId: undefined })], [sparseOrder], [sparseCommitment], []);
    exportUnifiedWorkOSToExcel([], [], []);
    downloadUnifiedWorkOSTemplate();

    expect(mocks.xlsx.writeFile).toHaveBeenCalledTimes(7);
    expect(mocks.xlsx.utils.book_append_sheet).toHaveBeenCalled();
  });

  it('يستورد المهام مع ترجمة الحالة/الأولوية والوسوم، ويرفض الفارغ والعنوان الغائب', async () => {
    mocks.readFirstSheetSafe.mockReturnValueOnce({
      rows: [
        { 'عنوان المهمة': 'مهمة مكتملة', الحالة: 'مكتملة', الأولوية: 'عاجل', الوسوم: 'أول، ثان' },
        { Title: 'Task review', Status: 'in_review', Priority: 'low', Tags: 'tag1,tag2', Progress: 140 },
      ],
    });
    const result = await importWorkOSTasksFromExcel({} as File);
    expect(result).toMatchObject({ success: true, count: 2 });
    expect(loadTasks().slice(0, 2)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'مهمة مكتملة',
          status: 'completed',
          priority: 'urgent',
          tags: ['أول', 'ثان'],
        }),
        expect.objectContaining({ title: 'Task review', status: 'review', priority: 'low', progress: 100 }),
      ])
    );

    mocks.readFirstSheetSafe.mockReturnValueOnce({ rows: [] });
    expect(await importWorkOSTasksFromExcel({} as File)).toMatchObject({
      success: false,
      message: expect.stringContaining('فارغ'),
    });

    mocks.readFirstSheetSafe.mockReturnValueOnce({ rows: [{ Description: 'no title' }] });
    expect(await importWorkOSTasksFromExcel({} as File)).toMatchObject({
      success: false,
      message: expect.stringContaining('عنوان المهمة'),
    });
  });

  it('يغطي بدائل الحقول الفارغة والمسميات البديلة في Excel والاستيراد', async () => {
    const sparse = {
      tasks: [
        {
          ...task(),
          taskNumber: '',
          title: '',
          description: '',
          status: '' as never,
          priority: '' as never,
          projectId: 'missing',
          assigneeId: 'missing',
          dueDate: '',
          progress: 0,
          estimatedHours: 0,
          actualHours: 0,
          tags: undefined as never,
        },
      ],
      projects: [
        {
          id: 'sparse',
          code: '',
          name: '',
          description: '',
          status: '' as never,
          category: '',
          startDate: '',
          dueDate: '',
          progress: 0,
        },
      ],
      team: [{ id: 'sparse', name: '' }],
    } as unknown as WorkOSData;
    exportWorkOSToJSON();
    exportWorkOSToCSV({ tasks: undefined, projects: undefined, team: undefined } as unknown as WorkOSData);
    exportWorkOSToExcel(sparse);

    mocks.readFirstSheetSafe.mockReturnValueOnce({
      rows: [
        {
          العنوان: 'بالعربية',
          Description: 'd',
          Status: 'in_progress',
          Priority: 'high',
          Project: 'x',
          Assignee: 'x',
          DueDate: '2026-11-08',
          Progress: 5,
          EstimatedHours: 1,
          Tags: 'a,b',
        },
        {
          Title: 'بالإنجليزية',
          الحالة: 'منجز',
          الأولوية: 'مرتفع',
          المشروع: 'x',
          المسؤول: 'x',
          'تاريخ الاستحقاق': '2026-11-08',
          'نسبة الإنجاز %': -2,
          'الساعات التقديرية': 0,
          الوسوم: '',
        },
        { 'عنوان المهمة': 'محجوبة', الحالة: 'متوقفة', الأولوية: 'منخفض', Project: 'x', Assignee: 'x' },
        { 'عنوان المهمة': 'مراجعة', الحالة: 'مراجعة', الأولوية: 'عادي', Project: 'x', Assignee: 'x' },
        { 'عنوان المهمة': 'افتراضية', الحالة: 'غريبة', الأولوية: 'غريبة', Project: 'x', Assignee: 'x' },
        { 'عنوان المهمة': 'بلا حالة أو أولوية' },
      ],
    });
    expect(await importWorkOSTasksFromExcel({} as File)).toMatchObject({ success: true, count: 6 });
  });

  it('يتحمل بيانات التخزين الناقصة ويستعمل بدائل مشروع/عضو مهمة الاستيراد', async () => {
    const malformed = { tasks: undefined, projects: undefined, team: undefined } as unknown as WorkOSData;
    const loadSpy = vi.spyOn(workosLoaders, 'loadWorkOSData').mockReturnValue(malformed);
    const saveSpy = vi.spyOn(workosLoaders, 'saveWorkOSData').mockImplementation(() => undefined);
    mocks.readFirstSheetSafe.mockReturnValueOnce({
      rows: [{ Title: 'مهمة من تخزين ناقص', Project: 'لا يوجد', Assignee: 'لا يوجد' }],
    });

    expect(await importWorkOSTasksFromExcel({} as File)).toMatchObject({ success: true, count: 1 });
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ tasks: expect.any(Array) }));
    loadSpy.mockRestore();
    saveSpy.mockRestore();
  });

  it('يعيد أخطاء قارئ ملف المهام والحجم وفشل FileReader بصيغة آمنة', async () => {
    mocks.assertFileSize.mockImplementationOnce(() => {
      throw new Error('large');
    });
    expect(await importWorkOSTasksFromExcel({} as File)).toMatchObject({
      success: false,
      message: expect.stringContaining('large'),
    });

    mocks.assertFileSize.mockImplementationOnce(() => {
      throw 'text error';
    });
    expect(await importWorkOSTasksFromExcel({} as File)).toMatchObject({
      success: false,
      message: expect.stringContaining('text error'),
    });

    mocks.assertFileSize.mockImplementationOnce(() => {
      throw '';
    });
    expect(await importWorkOSTasksFromExcel({} as File)).toMatchObject({
      success: false,
      message: expect.stringContaining('تنسيق غير صالح'),
    });

    readerMode = 'error';
    expect(await importWorkOSTasksFromExcel({} as File)).toMatchObject({
      success: false,
      message: expect.stringContaining('تعذر'),
    });
  });

  it('يستورد الطلبيات الموحدة مع روابطها ويرفض الصف الفارغ وأخطاء القراءة', async () => {
    mocks.readFirstSheetSafe.mockReturnValueOnce({
      rows: [
        {
          'عنوان الطلبية': 'توريد موحد',
          'اسم العميل / الصيدلية': 'عميل',
          'المبلغ الإجمالي (ريال)': 500,
          'تاريخ التسليم': '2026-11-09',
          'نوع الطلبية': 'توريد',
          'المنطقة / الفرع': 'صنعاء',
          'المندوب / المسؤول': 'مندوبي',
          الملاحظات: 'ملاحظة',
          'طريقة السداد': 'آجل',
          'رقم الفاتورة': 'INV-1',
        },
        {
          العنوان: 'طلب من الحقل البديل',
          العميل: 'عميل بديل',
          المبلغ: 10,
          DueDate: '2026-11-10',
          المسؤول: 'مندوب بديل',
        },
        { Title: 'طلب باللغة الإنجليزية', Customer: 'English customer', Amount: 20 },
        { Title: 'طلب القيم الافتراضية' },
      ],
    });
    const result = await importUnifiedWorkOSFromExcel({} as File);
    expect(result).toMatchObject({ success: true, count: 4 });
    expect(loadOrders().find((item) => item.title === 'توريد موحد')).toMatchObject({
      title: 'توريد موحد',
      linkedTaskId: expect.any(String),
      linkedCommitmentId: expect.any(String),
    });

    mocks.readFirstSheetSafe.mockReturnValueOnce({ rows: [] });
    expect(await importUnifiedWorkOSFromExcel({} as File)).toMatchObject({
      success: false,
      message: expect.stringContaining('فارغ'),
    });

    mocks.readFirstSheetSafe.mockReturnValueOnce({ rows: [{ Amount: 3 }] });
    expect(await importUnifiedWorkOSFromExcel({} as File)).toMatchObject({
      success: false,
      message: expect.stringContaining('صالحة'),
    });

    mocks.assertFileSize.mockImplementationOnce(() => {
      throw new Error('unsafe');
    });
    expect(await importUnifiedWorkOSFromExcel({} as File)).toMatchObject({
      success: false,
      message: expect.stringContaining('unsafe'),
    });

    mocks.assertFileSize.mockImplementationOnce(() => {
      throw 'plain import error';
    });
    expect(await importUnifiedWorkOSFromExcel({} as File)).toMatchObject({
      success: false,
      message: expect.stringContaining('plain import error'),
    });

    mocks.assertFileSize.mockImplementationOnce(() => {
      throw '';
    });
    expect(await importUnifiedWorkOSFromExcel({} as File)).toMatchObject({
      success: false,
      message: expect.stringContaining('تنسيق غير صالح'),
    });

    readerMode = 'error';
    expect(await importUnifiedWorkOSFromExcel({} as File)).toMatchObject({
      success: false,
      message: expect.stringContaining('تعذر'),
    });
  });
});
