// @vitest-environment jsdom
/** R56 — قرار الاستحقاق المالي: تقويم محلي صحيح، أرشفة، وفرز أولويات. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Commitment, Task } from '../../src/types';
import {
  archiveAlertIds,
  clearArchivedAlerts,
  formatDueText,
  getCalendarDayDiff,
  getDueAlerts,
  loadArchivedAlertIds,
  saveArchivedAlertIds,
} from '../../src/utils/dueAlerts';

const reference = new Date(2026, 10, 7, 18, 30);

const task = (over: Partial<Task> = {}): Task => ({
  id: 'T-1',
  start: '2026-11-07',
  title: 'مهمة',
  cat: 'عمل',
  op: 'إجراء',
  pri: 'B',
  status: 'قيد التنفيذ',
  resp: 'أنور',
  ...over,
});

const commitment = (over: Partial<Commitment> = {}): Commitment => ({
  id: 'C-1',
  name: 'التزام',
  amount: 100,
  pri: 'B',
  status: 'قيد التنفيذ',
  ...over,
});

beforeEach(() => {
  clearArchivedAlerts();
  vi.restoreAllMocks();
});

afterEach(() => {
  clearArchivedAlerts();
  vi.unstubAllGlobals();
});

describe('فرق الأيام التقويمي', () => {
  it('يقيس منتصف الليل المحلي لا فرق الساعات، ويرفض التاريخ الناقص أو المستحيل', () => {
    expect(getCalendarDayDiff('2026-11-06', reference)).toBe(-1);
    expect(getCalendarDayDiff('2026-11-07', reference)).toBe(0);
    expect(getCalendarDayDiff('2026-11-10', reference)).toBe(3);
    expect(getCalendarDayDiff('', reference)).toBe(999);
    expect(getCalendarDayDiff('2026-11', reference)).toBe(999);
    expect(getCalendarDayDiff('2026-2-03', reference)).toBe(999);
    expect(getCalendarDayDiff('2026-02-31', reference)).toBe(999);
  });
});

describe('حساب تنبيهات المهام والالتزامات', () => {
  it('يجمع المتأخر واليوم والقادم، ويتجاهل المنجز والملغى والبلا تاريخ والتاريخي القديم', () => {
    const summary = getDueAlerts(
      [
        task({ id: 'T-old', title: 'قديم جداً', end: '2026-09-01', pri: 'A' }),
        task({ id: 'T-overdue-B', title: 'متأخر B', end: '2026-11-06', pri: 'B', amount: 12 }),
        task({ id: 'T-overdue-A', title: 'متأخر A', end: '2026-11-06', pri: 'A' }),
        task({ id: 'T-today', title: 'اليوم', end: '2026-11-07', pri: 'D' }),
        task({ id: 'T-soon', title: 'غداً', end: '2026-11-08', pri: 'C' }),
        task({ id: 'T-far', title: 'بعيد', end: '2026-11-12' }),
        task({ id: 'T-done', title: 'منجز', end: '2026-11-07', status: 'تم الانجاز' }),
        task({ id: 'T-cancelled', title: 'ملغى', end: '2026-11-07', status: 'ملغي' }),
        task({ id: 'T-start', title: 'يستخدم البدء', start: '2026-11-09' }),
        task({ id: 'T-none', title: 'بلا تاريخ', start: '' }),
      ],
      [
        commitment({ id: 'C-overdue', name: 'قسط متأخر', due: '2026-11-05', pri: 'C' }),
        commitment({ id: 'C-today', name: 'قسط اليوم', due: '2026-11-07', pri: 'A' }),
        commitment({ id: 'C-soon', name: 'قسط قريب', due: '2026-11-10', pri: 'D' }),
        commitment({ id: 'C-done', name: 'قسط منجز', due: '2026-11-07', status: 'تم الانجاز' }),
        commitment({ id: 'C-cancelled', name: 'قسط ملغي', due: '2026-11-07', status: 'ملغي' }),
        commitment({ id: 'C-none', name: 'قسط بلا موعد' }),
      ],
      3,
      reference
    );

    expect(summary).toMatchObject({ total: 8, overdueCount: 3, todayCount: 2, soonCount: 3, archivedCount: 0 });
    expect(summary.items.map((item) => item.id)).toEqual([
      'C-overdue',
      'T-overdue-A',
      'T-overdue-B',
      'C-today',
      'T-today',
      'T-soon',
      'T-start',
      'C-soon',
    ]);
    expect(summary.items.find((item) => item.id === 'T-overdue-B')).toMatchObject({
      type: 'task',
      urgency: 'overdue',
      category: 'عمل',
      responsible: 'أنور',
      amount: 12,
    });
    expect(summary.items.find((item) => item.id === 'C-today')).toMatchObject({
      type: 'commitment',
      category: 'التزامات مالية',
      amount: 100,
    });
  });

  it('يحترم الأرشيف افتراضياً ويمكن طلب تضمينه، ويقبل خيارات عتبة الاستحقاق', () => {
    archiveAlertIds(['T-archived', 'C-archived', 'T-archived']);
    const tasks = [
      task({ id: 'T-archived', end: '2026-11-07' }),
      task({ id: 'T-old', end: '2026-11-05' }),
      task({ id: 'T-soon', end: '2026-11-08' }),
    ];
    const commitments = [
      commitment({ id: 'C-archived', due: '2026-11-07' }),
      commitment({ id: 'C-old', due: '2026-11-05' }),
      commitment({ id: 'C-far', due: '2026-11-10' }),
      commitment({ id: 'C-none' }),
    ];

    const hidden = getDueAlerts(tasks, commitments, { daysThreshold: 1, maxOverdueDays: 1 }, reference);
    expect(hidden.items.map((item) => item.id)).toEqual(['T-soon']);
    expect(hidden.archivedCount).toBe(2);

    const restored = getDueAlerts(
      tasks,
      commitments,
      { daysThreshold: 0, maxOverdueDays: 2, includeArchived: true },
      reference
    );
    expect(restored.items.map((item) => item.id)).toEqual(['T-old', 'C-old', 'T-archived', 'C-archived']);
  });

  it('يطبق الافتراضيات حين لا تحدد خيارات ويضع الأولوية B للفرز إن كانت القيمة غير معروفة', () => {
    const summary = getDueAlerts(
      [
        task({ id: 'T-no-priority', end: '2026-11-07', pri: undefined as never }),
        task({ id: 'T-unknown-priority', end: '2026-11-07', pri: 'Z' as never }),
      ],
      [],
      {},
      reference
    );

    expect(summary.items.map((item) => item.id)).toEqual(['T-no-priority', 'T-unknown-priority']);

    const explicitUndefined = getDueAlerts(
      [
        task({ id: 'T-empty-1', end: '2026-11-07', pri: '' as never }),
        task({ id: 'T-empty-2', end: '2026-11-07', pri: '' as never }),
        task({ id: 'T-unknown-1', end: '2026-11-07', pri: 'Z' as never }),
        task({ id: 'T-unknown-2', end: '2026-11-07', pri: 'Z' as never }),
      ],
      [],
      { daysThreshold: undefined, maxOverdueDays: undefined },
      reference
    );
    expect(explicitUndefined.total).toBe(4);
  });
});

describe('أرشفة التنبيهات', () => {
  it('يحفظ المعرّفات بلا تكرار وينشر حدثاً عند الأرشفة والمسح', () => {
    const listener = vi.fn();
    window.addEventListener('primo:alerts_archived', listener);

    archiveAlertIds(['T-1', 'C-1', 'T-1']);
    expect(loadArchivedAlertIds().sort()).toEqual(['C-1', 'T-1']);
    expect(listener).toHaveBeenCalledTimes(1);

    saveArchivedAlertIds(['يدوي']);
    expect(loadArchivedAlertIds()).toEqual(['يدوي']);
    clearArchivedAlerts();
    expect(loadArchivedAlertIds()).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(2);
    window.removeEventListener('primo:alerts_archived', listener);
  });

  it('يبقى التخزين صالحاً خارج المتصفح من دون محاولة نشر حدث DOM', () => {
    vi.stubGlobal('window', undefined);

    archiveAlertIds(['T-server']);
    clearArchivedAlerts();

    expect(loadArchivedAlertIds()).toEqual([]);
  });
});

describe('وصف شارة الاستحقاق', () => {
  it('يغطي صيغ العربية لكل المدد والألوان الدالة', () => {
    expect(formatDueText(-1)).toMatchObject({ text: 'متأخر منذ يوم', badgeColor: expect.stringContaining('rose') });
    expect(formatDueText(-2).text).toBe('متأخر منذ يومين');
    expect(formatDueText(-4).text).toBe('متأخر منذ 4 أيام');
    expect(formatDueText(0)).toMatchObject({ text: 'مستحق اليوم!', badgeColor: expect.stringContaining('amber') });
    expect(formatDueText(1)).toMatchObject({ text: 'مستحق غداً', badgeColor: expect.stringContaining('blue') });
    expect(formatDueText(2)).toMatchObject({ text: 'متبقي يومان', badgeColor: expect.stringContaining('teal') });
    expect(formatDueText(7)).toMatchObject({ text: 'متبقي 7 أيام', badgeColor: expect.stringContaining('slate') });
  });
});
