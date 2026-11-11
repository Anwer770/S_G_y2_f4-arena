// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DoctorFilterState, DoctorRecord, DoctorVisitLog } from '../../src/types';
import { auditService, type CentralAuditEntry } from '../../src/core/audit/AuditService';
import { DoctorRepository } from '../../src/database/repositories/CustomerRepository';
import { DoctorService } from '../../src/services/crm/DoctorService';
import { Outbox, type OutboxMutation } from '../../src/sync/Outbox';

const mocks = vi.hoisted(() => ({
  assertFileSize: vi.fn(),
  readFirstSheetSafe: vi.fn(),
  xlsx: {
    utils: {
      book_new: vi.fn(() => ({ sheets: [] as unknown[] })),
      json_to_sheet: vi.fn(() => ({}) as Record<string, unknown>),
      book_append_sheet: vi.fn(),
    },
    writeFile: vi.fn(),
  },
}));

vi.mock('xlsx', () => mocks.xlsx);
vi.mock('../../src/utils/xlsxSafe', () => ({
  assertFileSize: mocks.assertFileSize,
  readFirstSheetSafe: mocks.readFirstSheetSafe,
}));

import {
  calculateDoctorStats,
  exportDoctorsToCSV,
  exportDoctorsToExcel,
  exportDoctorVisitsToExcel,
  filterDoctors,
  findDoctorDuplicates,
  generateNextDoctorId,
  getTodayArabicDay,
  isDoctorTaskActiveInRange,
  isDoctorVisitDueToday,
  parseDoctorsExcelOrCSV,
} from '../../src/utils/doctors';

let readerMode: 'load' | 'error' = 'load';
class StubFileReader {
  onload: ((event: { target: { result: ArrayBuffer } }) => void | Promise<void>) | null = null;
  onerror: (() => void) | null = null;

  readAsArrayBuffer(): void {
    if (readerMode === 'error') this.onerror?.();
    else void this.onload?.({ target: { result: new ArrayBuffer(8) } });
  }
}

const doctor = (overrides: Partial<DoctorRecord> = {}): DoctorRecord => ({
  id: 'DOC-1001',
  name: 'د. الاختبار',
  source: 'الأطباء',
  specialty: 'باطنية',
  clinicName: 'عيادة الاختبار',
  region: 'صنعاء',
  route: 'السبت',
  significance: 'A',
  responsible: 'أنور',
  taskDesc: 'زيارة دورية',
  dateBegin: '2026-11-01',
  dateEnd: '2026-11-30',
  status: 'مخطط',
  phone: '+967 777-000-111',
  address: 'شارع التحرير',
  notes: 'ملاحظات اختبار',
  visitResult: 'نتيجة جيدة',
  samplesGiven: 'عينتان',
  ...overrides,
});

const visit = (overrides: Partial<DoctorVisitLog> = {}): DoctorVisitLog => ({
  id: 'DVL-1001',
  doctorId: 'DOC-1001',
  doctorName: 'د. الاختبار',
  date: '2026-11-07',
  dayOfWeek: 'السبت',
  responsible: 'أنور',
  status: 'مكتمل',
  notes: 'تمت الزيارة',
  visitResult: 'تفاعل جيد',
  samplesGiven: 'عينتان',
  nextFollowUpDate: '2026-11-14',
  createdAt: '2026-11-07T12:00:00.000Z',
  ...overrides,
});

const filters = (overrides: Partial<DoctorFilterState> = {}): DoctorFilterState => ({
  search: '',
  region: '',
  route: '',
  status: '',
  responsible: '',
  significance: '',
  specialty: '',
  todayVisitsOnly: false,
  activePeriodOnly: false,
  ...overrides,
});

const createRepo = () =>
  ({
    getAll: vi.fn<() => DoctorRecord[]>(() => []),
    getById: vi.fn<(id: string) => DoctorRecord | null>(() => null),
    add: vi.fn<(entry: DoctorRecord) => DoctorRecord>((entry) => entry),
    update: vi.fn<(id: string, patch: Partial<DoctorRecord>) => DoctorRecord | null>(() => null),
    delete: vi.fn<(id: string) => boolean>(() => false),
    getVisits: vi.fn<() => DoctorVisitLog[]>(() => []),
    addVisit: vi.fn<(entry: DoctorVisitLog) => DoctorVisitLog>((entry) => entry),
    saveVisits: vi.fn<(entries: DoctorVisitLog[]) => void>(),
  }) as unknown as DoctorRepository;

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

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-07T12:00:00.000Z'));
  readerMode = 'load';
  mocks.assertFileSize.mockReset();
  mocks.readFirstSheetSafe.mockReset();
  mocks.xlsx.utils.book_new.mockClear();
  mocks.xlsx.utils.json_to_sheet.mockReset();
  mocks.xlsx.utils.book_append_sheet.mockClear();
  mocks.xlsx.writeFile.mockClear();
  mocks.xlsx.utils.json_to_sheet.mockImplementation(() => ({}) as Record<string, unknown>);
  vi.stubGlobal('FileReader', StubFileReader);
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:r64', revokeObjectURL: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('R64 — توقيت وإحصاءات دليل الأطباء', () => {
  it('يحسب اليوم العربي وكل مسارات الزيارة اليومية والشهرية', () => {
    expect(getTodayArabicDay()).toBe('السبت');
    expect(isDoctorVisitDueToday('السبت')).toBe(true);
    expect(isDoctorVisitDueToday('بداية الشهر')).toBe(true);
    expect(isDoctorVisitDueToday('شهري')).toBe(true);
    expect(isDoctorVisitDueToday('الأحد')).toBe(false);

    vi.setSystemTime(new Date('2026-11-15T12:00:00.000Z'));
    expect(isDoctorVisitDueToday('نص الشهر')).toBe(true);
    expect(isDoctorVisitDueToday('بداية الشهر')).toBe(false);

    vi.setSystemTime(new Date('2026-11-25T12:00:00.000Z'));
    expect(isDoctorVisitDueToday('نهاية الشهر')).toBe(true);
    expect(isDoctorVisitDueToday('نص الشهر')).toBe(false);
  });

  it('يحترم حدود فترة المهمة كلها أو أحد طرفيها', () => {
    expect(isDoctorTaskActiveInRange()).toBe(true);
    expect(isDoctorTaskActiveInRange('2026-11-01', '2026-11-30')).toBe(true);
    expect(isDoctorTaskActiveInRange('2026-11-08', '2026-11-30')).toBe(false);
    expect(isDoctorTaskActiveInRange('2026-11-01', '2026-11-06')).toBe(false);
    expect(isDoctorTaskActiveInRange('2026-11-01')).toBe(true);
    expect(isDoctorTaskActiveInRange('2026-11-08')).toBe(false);
    expect(isDoctorTaskActiveInRange(undefined, '2026-11-30')).toBe(true);
    expect(isDoctorTaskActiveInRange(undefined, '2026-11-06')).toBe(false);

    vi.spyOn(Date.prototype, 'toISOString').mockImplementationOnce(() => '' as string);
    expect(isDoctorTaskActiveInRange()).toBe(true);
  });

  it('يفصل الإحصاءات والحالات والمسارات والمسؤوليات بدلاً من خلطها', () => {
    const doctors = [
      doctor({ id: 'DOC-1001', status: 'مكتمل', significance: 'A', route: 'السبت', responsible: 'أنور' }),
      doctor({ id: 'DOC-1002', status: 'قيد تنفيذ', significance: 'B', route: 'بداية الشهر', responsible: 'أنور' }),
      doctor({ id: 'DOC-1003', status: 'مخطط', significance: 'C', route: 'نص الشهر', responsible: 'صدام' }),
      doctor({ id: 'DOC-1004', status: 'متابعة', significance: '√', route: 'نهاية الشهر', responsible: 'صدام' }),
      doctor({
        id: 'DOC-1005',
        status: 'مرحل',
        significance: '',
        route: 'شهري',
        dateBegin: '2026-11-01',
        dateEnd: '2026-11-30',
      }),
      doctor({
        id: 'DOC-1006',
        status: 'ملغي',
        significance: '',
        route: 'خارج المسار',
        dateBegin: '2026-11-08',
        dateEnd: '2026-11-30',
      }),
      doctor({
        id: 'DOC-1007',
        status: '',
        significance: '',
        region: '',
        route: '',
        specialty: '',
        responsible: '',
        dateBegin: '',
        dateEnd: '',
      }),
    ];

    const stats = calculateDoctorStats(doctors, [visit()]);
    expect(stats).toMatchObject({
      totalDoctors: 7,
      completedCount: 1,
      inProgressCount: 1,
      plannedCount: 1,
      followUpCount: 1,
      postponedCount: 1,
      cancelledCount: 1,
      completionRate: 14,
      todayVisitsTotal: 3,
      todayVisitsCompleted: 1,
      activePeriodTasksCount: 6,
    });
    expect(stats.regionBreakdown).toContainEqual({ region: 'غير محدد', count: 1, percentage: 14 });
    expect(stats.routeBreakdown).toContainEqual({ route: 'غير محدد', count: 1 });
    expect(stats.specialtyBreakdown).toContainEqual({ specialty: 'عام / غير مصنف', count: 1 });
    expect(stats.significanceBreakdown).toEqual([
      { key: 'A', count: 1 },
      { key: 'B', count: 1 },
      { key: 'C', count: 1 },
      { key: '√', count: 1 },
    ]);
    expect(stats.statusBreakdown).toContainEqual({ key: 'مكتمل', count: 1, percentage: 14 });
    expect(stats.responsibleStats).toContainEqual({
      name: 'أنور',
      total: 4,
      completed: 1,
      inProgress: 1,
      planned: 0,
      completionRate: 25,
    });
    expect(calculateDoctorStats([])).toMatchObject({ totalDoctors: 0, completionRate: 0, regionBreakdown: [] });

    expect(calculateDoctorStats([doctor({ responsible: 'وحيد', status: 'مكتمل' })]).responsibleStats).toContainEqual({
      name: 'وحيد',
      total: 1,
      completed: 1,
      inProgress: 0,
      planned: 0,
      completionRate: 100,
    });
  });

  it('يبحث في جميع الحقول ويطبق كل مرشح مستقل بدقة', () => {
    const complete = doctor({
      id: 'DOC-SEARCH',
      name: 'NAME-SEARCH',
      clinicName: 'CLINIC-SEARCH',
      specialty: 'SPECIALTY-SEARCH',
      phone: '777000111',
      address: 'ADDRESS-SEARCH',
      responsible: 'RESPONSIBLE-SEARCH',
      taskDesc: 'TASK-SEARCH',
      notes: 'NOTES-SEARCH',
    });
    const sparse = doctor({
      id: 'DOC-SPARSE',
      name: 'SPARSE',
      clinicName: undefined,
      specialty: undefined,
      phone: undefined,
      address: undefined,
      responsible: '',
      taskDesc: undefined,
      notes: undefined,
    });

    for (const query of [
      'name-search',
      'clinic-search',
      'specialty-search',
      '777000111',
      'doc-search',
      'address-search',
      'responsible-search',
      'task-search',
      'notes-search',
    ]) {
      expect(filterDoctors([complete], filters({ search: query }))).toEqual([complete]);
    }
    expect(filterDoctors([complete, sparse], filters({ search: 'غير موجود' }))).toEqual([]);

    const fields: Array<[keyof DoctorFilterState, string]> = [
      ['region', complete.region],
      ['route', complete.route],
      ['status', complete.status],
      ['responsible', complete.responsible],
      ['significance', complete.significance],
      ['specialty', complete.specialty as string],
    ];
    for (const [field, value] of fields) {
      expect(filterDoctors([complete], filters({ [field]: value }))).toEqual([complete]);
      expect(filterDoctors([complete], filters({ [field]: 'غير مطابق' }))).toEqual([]);
    }
    expect(filterDoctors([complete], filters({ todayVisitsOnly: true, activePeriodOnly: true }))).toEqual([complete]);
    expect(
      filterDoctors([complete], filters({ todayVisitsOnly: true, activePeriodOnly: true, route: 'الأحد' }))
    ).toEqual([]);
    expect(filterDoctors([doctor({ route: 'الأحد' })], filters({ todayVisitsOnly: true }))).toEqual([]);
    expect(filterDoctors([doctor({ dateBegin: '2026-11-08' })], filters({ activePeriodOnly: true }))).toEqual([]);
  });

  it('يولد معرّف الطبيب التالي ويجد التكرار بالاسم أو الهاتف المطبع', () => {
    const existing = [
      doctor({ id: 'DOC-1009', name: 'طبيب موجود', phone: '+967 777 000 111' }),
      doctor({ id: 'بدون-رقم', name: 'طبيب آخر', phone: '777999888' }),
    ];
    expect(generateNextDoctorId(existing)).toBe('DOC-1010');
    expect(generateNextDoctorId([doctor({ id: 'DOC-001' })])).toBe('DOC-1001');
    expect(generateNextDoctorId([])).toBe('DOC-1001');
    expect(findDoctorDuplicates({}, existing)).toEqual([]);
    expect(findDoctorDuplicates({ name: ' طبيب موجود ' }, existing)).toEqual([existing[0]]);
    expect(findDoctorDuplicates({ name: 'اسم جديد', phone: '967-777000111' }, existing)).toEqual([existing[0]]);
    expect(findDoctorDuplicates({ name: 'طبيب موجود' }, existing, 'DOC-1009')).toEqual([]);
    expect(findDoctorDuplicates({ name: 'فريد', phone: '' }, existing)).toEqual([]);
  });
});

describe('R64 — مخرجات واستيراد دليل الأطباء', () => {
  it('يصدر سجلات الأطباء ودفتر الزيارات إلى Excel RTL مع البيانات والاسم المخصص', async () => {
    const doctorsSheetWithoutViews: Record<string, unknown> = {};
    const doctorsSheetWithViews: Record<string, unknown> = { '!views': [] };
    const visitsSheetWithViews: Record<string, unknown> = { '!views': [] };
    const visitsSheetWithoutViews: Record<string, unknown> = {};
    mocks.xlsx.utils.json_to_sheet
      .mockReturnValueOnce(doctorsSheetWithoutViews)
      .mockReturnValueOnce(doctorsSheetWithViews)
      .mockReturnValueOnce(visitsSheetWithViews)
      .mockReturnValueOnce(visitsSheetWithoutViews);
    await exportDoctorsToExcel([doctor()], 'doctors.xlsx');
    await exportDoctorsToExcel(
      [
        doctor({
          source: '',
          specialty: '',
          clinicName: '',
          taskDesc: '',
          dateBegin: '',
          dateEnd: '',
          phone: '',
          address: '',
          samplesGiven: '',
          visitResult: '',
          notes: '',
        }),
      ],
      ''
    );
    await exportDoctorVisitsToExcel(
      [
        visit(),
        visit({ samplesGiven: undefined, visitResult: undefined, notes: undefined, nextFollowUpDate: undefined }),
      ],
      'visits.xlsx'
    );
    await exportDoctorVisitsToExcel([visit()]);

    expect(doctorsSheetWithoutViews['!views']).toEqual([{ rightToLeft: true }]);
    expect(doctorsSheetWithViews['!views']).toEqual([{ rightToLeft: true }]);
    expect(visitsSheetWithViews['!views']).toEqual([{ rightToLeft: true }]);
    expect(visitsSheetWithoutViews['!views']).toEqual([{ rightToLeft: true }]);
    expect(mocks.xlsx.utils.book_append_sheet).toHaveBeenCalledTimes(4);
    expect(mocks.xlsx.writeFile).toHaveBeenNthCalledWith(1, expect.anything(), 'doctors.xlsx');
    expect(mocks.xlsx.writeFile).toHaveBeenNthCalledWith(3, expect.anything(), 'visits.xlsx');
    expect(mocks.xlsx.writeFile).toHaveBeenNthCalledWith(
      4,
      expect.anything(),
      'سجل_زيارات_الأطباء_الميدانية_2026-11-07.xlsx'
    );
    const exportedRows = mocks.xlsx.utils.json_to_sheet.mock.calls as unknown as Array<
      [Array<Record<string, unknown>>]
    >;
    expect(exportedRows[0]?.[0]?.[0]).toMatchObject({
      المعرف: 'DOC-1001',
      'اسم الطبيب / المركز': 'د. الاختبار',
      المصدر: 'الأطباء',
    });
    expect(exportedRows[1]?.[0]?.[0]?.المصدر).toBe('الأطباء');
  });

  it('يصدر CSV عربياً آمناً ويهذب علامات الاقتباس ويزيل رابط التنزيل', () => {
    const readBlob = captureBlob();
    const create = vi.fn(() => 'blob:doctors');
    const revoke = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });

    exportDoctorsToCSV(
      [
        doctor({
          name: 'د. "النور"',
          source: '',
          specialty: undefined,
          clinicName: undefined,
          region: undefined as unknown as string,
          route: undefined as unknown as string,
          responsible: undefined as unknown as string,
          taskDesc: undefined,
          dateBegin: undefined,
          dateEnd: undefined,
          phone: undefined,
          address: undefined,
          samplesGiven: undefined,
          visitResult: undefined,
          notes: undefined,
        }),
        {
          id: undefined,
          name: undefined,
          source: undefined,
          specialty: undefined,
          clinicName: undefined,
          region: undefined,
          route: undefined,
          significance: undefined,
          responsible: undefined,
          taskDesc: undefined,
          dateBegin: undefined,
          dateEnd: undefined,
          status: undefined,
          phone: undefined,
          address: undefined,
          samplesGiven: undefined,
          visitResult: undefined,
          notes: undefined,
        } as unknown as DoctorRecord,
      ],
      'doctors.csv'
    );
    expect(readBlob()).toContain('\uFEFF');
    expect(readBlob()).toContain('د. ""النور""');
    expect(create).toHaveBeenCalledTimes(1);
    expect(revoke).not.toHaveBeenCalled();

    exportDoctorsToCSV([], '');
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('يحافظ على B ومخطط عند استيراد الصفوف ويعلن الفراغ والمعرف المنشأ والتكرار', async () => {
    mocks.readFirstSheetSafe.mockReturnValue({
      rows: [
        {
          المعرف: 'DOC-2001',
          'اسم الطبيب': 'د. باء',
          المصدر: undefined,
          التخصص: 'قلب',
          المنطقة: 'صنعاء',
          المسار: 'السبت',
          الأهمية: 'B',
          المسؤول: 'أنور',
          'تاريخ بدء المهمة': '2026-11-01',
          'تاريخ انتهاء المهمة': '2026-11-30',
          'حالة الزيارة': 'مخطط',
          الهاتف: '777000111',
        },
        {
          'اسم الطبيب': 'د. مكرر',
          الأهمية: 'ج',
          الحالة: 'منجز',
          الهاتف: '777000222',
        },
        { 'اسم الطبيب': 'د. تنفيذ', الأهمية: 'B', الحالة: 'progress' },
        { 'اسم الطبيب': 'د. متابعة', الأهمية: 'صح', الحالة: 'follow' },
        { 'اسم الطبيب': 'د. مرحل', الأهمية: 'A', الحالة: 'postponed' },
        { 'اسم الطبيب': 'د. ملغي', الأهمية: 'C', الحالة: 'cancel' },
        { 'اسم الطبيب': 'د. غير مصنف', الأهمية: '?', الحالة: '?' },
        { 'اسم الطبيب': '' },
      ],
    });

    const result = await parseDoctorsExcelOrCSV(new File(['rows'], 'doctors.xlsx'), [doctor({ name: 'د. مكرر' })]);

    expect(mocks.assertFileSize).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.doctors).toHaveLength(7);
    expect(result.doctors[0]).toMatchObject({ id: 'DOC-2001', significance: 'B', status: 'مخطط' });
    expect(result.doctors.slice(1).map((item) => item.status)).toEqual([
      'مكتمل',
      'قيد تنفيذ',
      'متابعة',
      'مرحل',
      'ملغي',
      '',
    ]);
    expect(result.doctors.slice(1).map((item) => item.significance)).toEqual(['C', 'B', '√', 'A', 'C', '']);
    expect(result.duplicateCount).toBe(1);
    expect(result.warnings.join('\n')).toContain('المعرف');
    expect(result.warnings.join('\n')).toContain('فارغ');
  });

  it('يرفض الورقة الفارغة وخطأ قارئ الملف وخطأ الحماية بصيغة نتيجة آمنة', async () => {
    mocks.readFirstSheetSafe.mockReturnValue({ rows: [] });
    await expect(parseDoctorsExcelOrCSV(new File(['x'], 'empty.xlsx'), [])).resolves.toMatchObject({
      success: false,
      doctors: [],
      duplicateCount: 0,
    });

    mocks.readFirstSheetSafe.mockImplementationOnce(() => {
      throw new Error('ملف غير آمن');
    });
    await expect(parseDoctorsExcelOrCSV(new File(['x'], 'unsafe.xlsx'), [])).resolves.toMatchObject({
      success: false,
      errors: [expect.stringContaining('ملف غير آمن')],
    });

    mocks.readFirstSheetSafe.mockImplementationOnce(() => {
      throw 'فشل نصي';
    });
    await expect(parseDoctorsExcelOrCSV(new File(['x'], 'string-error.xlsx'), [])).resolves.toMatchObject({
      success: false,
      errors: [expect.stringContaining('فشل نصي')],
    });

    mocks.readFirstSheetSafe.mockImplementationOnce(() => {
      throw new Error('');
    });
    await expect(parseDoctorsExcelOrCSV(new File(['x'], 'blank-error.xlsx'), [])).resolves.toMatchObject({
      success: false,
      errors: [expect.stringContaining('Error')],
    });

    readerMode = 'error';
    await expect(parseDoctorsExcelOrCSV(new File(['x'], 'error.xlsx'), [])).resolves.toMatchObject({
      success: false,
      errors: ['تعذر قراءة الملف من الجهاز'],
    });
  });
});

describe('R64 — خدمة الأطباء', () => {
  it('يقرأ الطبيب وزياراته ويسجل الإنشاء والتحديث حتى عند فشل المستودع الجزئي', () => {
    const repo = createRepo();
    const service = new DoctorService(repo);
    const entry = doctor();
    const saved = doctor({ name: 'د. محفوظ' });
    const outbox = vi.spyOn(Outbox, 'enqueue').mockReturnValue({} as OutboxMutation);
    const audit = vi.spyOn(auditService, 'log').mockReturnValue({} as CentralAuditEntry);

    vi.mocked(repo.getAll).mockReturnValue([entry]);
    vi.mocked(repo.getVisits).mockReturnValue([visit()]);
    expect(service.getAll()).toEqual([entry]);
    expect(service.getById(entry.id)).toBeNull();
    expect(service.getVisits()).toEqual([visit()]);

    vi.mocked(repo.getById).mockReturnValueOnce(null);
    vi.mocked(repo.add).mockReturnValue(saved);
    expect(service.saveDoctor(entry)).toEqual(saved);
    expect(audit).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'Create', entity: 'Doctor' }));
    expect(outbox).toHaveBeenLastCalledWith('Doctor', 'INSERT', entry.id, entry);

    vi.mocked(repo.getById).mockReturnValueOnce(null);
    vi.mocked(repo.add).mockReturnValue(entry);
    expect(service.saveDoctor(doctor({ id: 'DOC-NO-SPECIALTY', specialty: undefined }))).toEqual(entry);

    vi.mocked(repo.getById).mockReturnValue(entry);
    vi.mocked(repo.update).mockReturnValueOnce(saved).mockReturnValueOnce(null);
    expect(service.saveDoctor(entry)).toEqual(saved);
    expect(service.saveDoctor(entry)).toEqual(entry);
    expect(outbox).toHaveBeenLastCalledWith('Doctor', 'UPDATE', entry.id, entry);
    expect(audit).toHaveBeenCalledTimes(4);
  });

  it('لا يكتب تدقيقاً أو طابوراً لحذف مرفوض، ويسجل الحذف والزيارة والدفعة الناجحة', () => {
    const repo = createRepo();
    const service = new DoctorService(repo);
    const entry = doctor();
    const entryVisit = visit();
    const outbox = vi.spyOn(Outbox, 'enqueue').mockReturnValue({} as OutboxMutation);
    const audit = vi.spyOn(auditService, 'log').mockReturnValue({} as CentralAuditEntry);

    vi.mocked(repo.getById).mockReturnValueOnce(null).mockReturnValueOnce(entry).mockReturnValueOnce(entry);
    vi.mocked(repo.delete).mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(service.deleteDoctor('غير موجود')).toBe(false);
    expect(service.deleteDoctor(entry.id)).toBe(false);
    expect(service.deleteDoctor(entry.id)).toBe(true);
    expect(audit).toHaveBeenCalledTimes(1);
    expect(outbox).toHaveBeenCalledWith('Doctor', 'DELETE', entry.id, entry);

    vi.mocked(repo.addVisit).mockReturnValue(entryVisit);
    expect(service.recordVisit(entryVisit)).toEqual(entryVisit);
    expect(outbox).toHaveBeenLastCalledWith('DoctorVisit', 'INSERT', entryVisit.id, entryVisit);
    service.saveVisits([entryVisit]);
    expect(repo.saveVisits).toHaveBeenCalledWith([entryVisit]);
  });
});
