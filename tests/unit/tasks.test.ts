// @vitest-environment jsdom
/** المهام والتقويم: ما يظهر «قادماً» وما يصل فعلياً إلى تطبيقات التقويم. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateTaskStats,
  downloadICS,
  filterTasks,
  generateICS,
  generateNextCommitmentId,
  generateNextTaskId,
  getUpcomingTasks,
  isTaskOverdue,
} from '../../src/utils/tasks';
import type { Commitment, Task, TaskFilterState } from '../../src/types';

const task = (over: Partial<Task> = {}): Task => ({
  id: 'T-0001',
  start: '2026-11-07',
  title: 'مهمة',
  cat: 'تشغيل',
  op: 'تنفيذ',
  pri: 'B',
  status: 'قيد التنفيذ',
  resp: 'أنور',
  ...over,
});

const commitment = (over: Partial<Commitment> = {}): Commitment => ({
  id: 'التزامات-001',
  name: 'التزام',
  amount: 1000,
  pri: 'A',
  due: '2026-11-10',
  status: 'قيد التنفيذ',
  ...over,
});

const noTaskFilters: TaskFilterState = {
  search: '',
  cat: '',
  op: '',
  pri: '',
  status: '',
  resp: '',
  startDate: '',
  endDate: '',
  overdueOnly: false,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-07T12:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('الإحصاءات والترشيح', () => {
  it('لا يعدّ المهمة المنجزة أو الملغاة متأخرة', () => {
    expect(isTaskOverdue(task({ status: 'تم الانجاز', end: '2026-11-01' }), '2026-11-07')).toBe(false);
    expect(isTaskOverdue(task({ status: 'ملغي', end: '2026-11-01' }), '2026-11-07')).toBe(false);
    expect(isTaskOverdue(task({ status: 'متأخر', end: '2026-11-20' }), '2026-11-07')).toBe(true);
    expect(isTaskOverdue(task({ status: 'قيد التنفيذ', end: '2026-11-01' }), '2026-11-07')).toBe(true);
  });

  it('يحسب اليوم والأسبوع والشهر والتوزيعات والالتزامات', () => {
    const tasks = [
      task({ id: 'T-1', start: '2026-11-07', end: '2026-11-08', pri: 'A' }),
      task({ id: 'T-2', start: '2026-11-01', end: '2026-11-02', status: 'متأخر', pri: 'C', cat: 'مالية' }),
      task({ id: 'T-3', start: '2026-10-30', end: '2026-11-01', status: 'تم الانجاز', pri: 'D', cat: 'إدارة' }),
    ];
    const stats = calculateTaskStats(
      tasks,
      [
        commitment({ id: 'C1', amount: 500, status: 'تم الانجاز' }),
        commitment({ id: 'C2', amount: 300, status: 'ملغي' }),
        commitment({ id: 'C3', amount: 200, status: 'قيد التنفيذ' }),
      ],
      new Date('2026-11-07T12:00:00.000Z')
    );

    expect(stats).toMatchObject({
      today: 1,
      thisWeek: 1,
      thisMonth: 3,
      overdue: 1,
      completed: 1,
      inProgress: 1,
      total: 3,
      totalCommitmentsAmount: 1000,
      paidCommitmentsAmount: 500,
      outstandingCommitmentsAmount: 200,
      completionRate: 33,
    });
    expect(stats.priorityDistribution).toEqual([
      { pri: 'A', count: 1 },
      { pri: 'B', count: 0 },
      { pri: 'C', count: 1 },
      { pri: 'D', count: 1 },
    ]);
  });

  it('الحواف: مهمة بلا نهاية وأولوية مستوردة غير معروفة والتزامات ناقصة', () => {
    const stats = calculateTaskStats(
      [task({ end: undefined, pri: 'Z' as never })],
      [
        commitment({ amount: undefined as never, status: 'تم الانجاز' }),
        commitment({ amount: undefined as never, status: 'قيد التنفيذ' }),
        commitment({ amount: undefined as never, status: 'ملغي' }),
      ]
    );
    const crossMonth = calculateTaskStats(
      [task({ start: '2026-10-30', end: '2026-10-31' })],
      [],
      new Date('2026-11-07T12:00:00.000Z')
    );
    const empty = calculateTaskStats([], []);

    expect(stats.total).toBe(1);
    expect(crossMonth.thisMonth).toBe(0);
    expect(empty.completionRate).toBe(0);
    expect(stats.priorityDistribution.find((item) => item.pri === 'Z')).toBeUndefined();
    expect(stats.totalCommitmentsAmount).toBe(0);
    expect(isTaskOverdue(task({ end: undefined, start: '2026-11-01' }), '2026-11-07')).toBe(true);
  });

  it('الترشيح يطبق البحث والحقول والمدى والمتأخرات', () => {
    const tasks = [
      task({
        id: 'T-1',
        sub: 'عميل-1',
        title: 'زيارة عميل',
        desc: 'فاتورة',
        pri: 'A',
        resp: 'أحمد',
        end: '2026-11-08',
      }),
      task({ id: 'T-2', title: 'منجزة', status: 'تم الانجاز', end: '2026-11-01' }),
    ];

    expect(
      filterTasks(
        tasks,
        {
          ...noTaskFilters,
          search: 'فاتورة',
          cat: 'تشغيل',
          op: 'تنفيذ',
          pri: 'A',
          status: 'قيد التنفيذ',
          resp: 'أحمد',
          startDate: '2026-11-01',
          endDate: '2026-11-10',
        },
        '2026-11-07'
      ).map((t) => t.id)
    ).toEqual(['T-1']);
    expect(filterTasks(tasks, { ...noTaskFilters, overdueOnly: true }, '2026-11-07')).toEqual([]);

    const one = task({
      id: 'X',
      sub: undefined,
      desc: undefined,
      cat: 'أ',
      op: 'ب',
      pri: 'B',
      status: 'قيد التنفيذ',
      resp: 'أنور',
    });
    expect(filterTasks([one], { ...noTaskFilters, cat: 'خاطئ' }, '2026-11-07')).toEqual([]);
    expect(filterTasks([one], { ...noTaskFilters, op: 'خاطئ' }, '2026-11-07')).toEqual([]);
    expect(filterTasks([one], { ...noTaskFilters, pri: 'A' }, '2026-11-07')).toEqual([]);
    expect(filterTasks([one], { ...noTaskFilters, status: 'مؤجل' }, '2026-11-07')).toEqual([]);
    expect(filterTasks([one], { ...noTaskFilters, resp: 'غيره' }, '2026-11-07')).toEqual([]);
    expect(filterTasks([one], { ...noTaskFilters, startDate: '2026-11-08' }, '2026-11-07')).toEqual([]);
    expect(filterTasks([one], { ...noTaskFilters, endDate: '2026-11-06' }, '2026-11-07')).toEqual([]);
  });
});

describe('المهام القادمة والترقيم', () => {
  it('لا يضع مهمة متأخرة تحت عنوان «القادمة»', () => {
    /* العيب: todayStr مُمرّر للدالة لكنه لم يكن يُستخدم، فتسبق المتأخرة قائمة القادم. */
    const result = getUpcomingTasks(
      [
        task({ id: 'past', start: '2026-11-01', end: '2026-11-02' }),
        task({ id: 'today', start: '2026-11-07' }),
        task({ id: 'future', start: '2026-11-09' }),
        task({ id: 'done', start: '2026-11-08', status: 'تم الانجاز' }),
      ],
      8,
      '2026-11-07'
    );

    expect(result.map((t) => t.id)).toEqual(['today', 'future']);
  });

  it('الترقيم يتجاوز الأعلى ويتجاهل المعرفات غير المطابقة', () => {
    expect(generateNextTaskId([])).toBe('T-0001');
    expect(generateNextTaskId([task({ id: 'T-0003' }), task({ id: 'غريب' })])).toBe('T-0004');
    expect(generateNextCommitmentId([])).toBe('التزامات-001');
    expect(generateNextCommitmentId([commitment({ id: 'التزامات-009' }), commitment({ id: 'C-100' })])).toBe(
      'التزامات-010'
    );
  });
});

describe('تصدير iCalendar', () => {
  it('ينشئ أحداث اليوم الكامل ونهاية حصرية في اليوم التالي', () => {
    const ics = generateICS(
      [task({ id: 'T-1', start: '2026-11-07', end: '2026-11-08', status: 'تم الانجاز' })],
      [commitment(), commitment({ id: 'skipped', due: undefined }), commitment({ id: 'done', status: 'تم الانجاز' })]
    );

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('UID:T-1@almaha-tasks.local');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261107');
    expect(ics).toContain('DTEND;VALUE=DATE:20261109');
    expect(ics).toContain('UID:التزامات-001@almaha-commitments.local');
    expect(ics).toContain('DTEND;VALUE=DATE:20261111');
    expect(ics).toContain('STATUS:COMPLETED');
    expect(ics).not.toContain('UID:skipped@almaha-commitments.local');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('يهرب محارف ICS حتى لا يستطيع عنوان أو وصف حقن حقل/حدث جديد', () => {
    /* العيب: SUMMARY وDESCRIPTION كانا يُركبان نصياً؛ سطر جديد في عنوان محرر من المستخدم
       ينشئ خاصية ICS ثانية أو EVENT مزوراً عند الاستيراد في Google/Outlook. */
    const ics = generateICS([
      task({
        title: 'العنوان; مع فاصلة, وشرطة \\ وسطر\nBEGIN:VEVENT',
        desc: 'وصف\nSTATUS:CANCELLED',
        cat: 'تشغيل;إداري',
      }),
    ]);

    expect(ics).toContain('SUMMARY:[B] العنوان\\; مع فاصلة\\, وشرطة \\\\ وسطر\\nBEGIN:VEVENT');
    expect(ics).toContain('DESCRIPTION:الفئة: تشغيل\\;إداري');
    expect(ics).not.toContain('\r\nBEGIN:VEVENT\r\nBEGIN:VEVENT');
    expect(ics.split('\r\n').filter((line) => line === 'BEGIN:VEVENT')).toHaveLength(1);
  });

  it('ينزّل ملف التقويم وينظف رابط Blob', () => {
    const click = vi.fn();
    const create = vi.fn(() => 'blob:ics');
    const revoke = vi.fn();
    vi.stubGlobal('Blob', class FakeBlob {});
    URL.createObjectURL = create;
    URL.revokeObjectURL = revoke;
    HTMLAnchorElement.prototype.click = click;

    downloadICS([task()], [], 'calendar.ics');

    expect(create).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith('blob:ics');
  });
});
