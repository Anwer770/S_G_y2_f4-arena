/**
 * اختبارات وحدة لمنطق التصدير التلقائي للأرشيف (R44) — منطق نقي بلا تخزين ولا DOM.
 *
 * قبل R44 كان هذا الملف (49 سطراً) **خارج مظلّة التغطية** رغم أن قراراته حاكمة:
 * هل يحين موعد التصدير؟ ما اسم الملف؟ كم لقطة تُبقى؟ أي خطأ هنا يعني أرشيفاً
 * لا يعمل أو ملفات تتراكم، ولا يلتقطه أي اختبار.
 */
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_AUTO_CONFIG,
  buildArchiveFileName,
  isAutoExportDue,
  pruneSnapshots,
  type ArchiveSnapshot,
} from '../../src/utils/auditAutoExportLogic';

const DAY = 86_400_000;
const now = new Date('2026-11-07T12:00:00.000Z');

describe('DEFAULT_AUTO_CONFIG', () => {
  it('القيم الافتراضية كما هي معتمدة في المنتج', () => {
    expect(DEFAULT_AUTO_CONFIG).toEqual({
      enabled: true,
      intervalDays: 1,
      keepCount: 12,
      writeToFolder: false,
    });
  });
});

describe('isAutoExportDue', () => {
  const at = (iso: string, cfg = { enabled: true, intervalDays: 1 }) => isAutoExportDue(cfg, iso, now);
  const due = (iso?: string) => isAutoExportDue({ enabled: true, intervalDays: 1 }, iso, now);

  it('معطّل ⇒ لا تصدير مهما كان التاريخ', () => {
    expect(isAutoExportDue({ enabled: false, intervalDays: 1 }, undefined, now)).toBe(false);
    expect(isAutoExportDue({ enabled: false, intervalDays: 1 }, '2020-01-01T00:00:00.000Z', now)).toBe(false);
  });

  it('لا يوجد تصدير سابق ⇒ مستحقّ فوراً', () => {
    expect(due(undefined)).toBe(true);
    expect(due('')).toBe(true);
  });

  it('تاريخ تالف ⇒ مستحقّ (لا تعطيل صامت للأرشيف)', () => {
    expect(isAutoExportDue({ enabled: true, intervalDays: 3 }, 'ليس تاريخاً', now)).toBe(true);
  });

  it('مضى يوم كامل بالضبط ⇒ مستحقّ (المقارنة >=)', () => {
    expect(at(new Date(now.getTime() - DAY).toISOString())).toBe(true);
  });

  it('قبل الموعد بميلي ثانية ⇒ غير مستحقّ', () => {
    expect(at(new Date(now.getTime() - DAY + 1).toISOString())).toBe(false);
  });

  it('الفاصل بالأيام يُحترم', () => {
    const cfg = { enabled: true, intervalDays: 3 };
    expect(isAutoExportDue(cfg, new Date(now.getTime() - 2 * DAY).toISOString(), now)).toBe(false);
    expect(isAutoExportDue(cfg, new Date(now.getTime() - 3 * DAY).toISOString(), now)).toBe(true);
  });

  it('فاصل صفري أو سالب أو كسري يُطهَّر إلى 1 على الأقل', () => {
    expect(
      isAutoExportDue({ enabled: true, intervalDays: 0 }, new Date(now.getTime() - 2 * DAY).toISOString(), now)
    ).toBe(true);
    expect(isAutoExportDue({ enabled: true, intervalDays: -5 }, new Date(now.getTime() - DAY).toISOString(), now)).toBe(
      true
    );
    expect(
      isAutoExportDue({ enabled: true, intervalDays: 2.9 }, new Date(now.getTime() - 2 * DAY).toISOString(), now)
    ).toBe(true);
    expect(
      isAutoExportDue({ enabled: true, intervalDays: 2.9 }, new Date(now.getTime() - 3 * DAY).toISOString(), now)
    ).toBe(true);
    expect(
      isAutoExportDue({ enabled: true, intervalDays: 2.9 }, new Date(now.getTime() - 1.5 * DAY).toISOString(), now)
    ).toBe(false);
  });

  it('التاريخ المستقبلي ⇒ غير مستحقّ', () => {
    expect(at(new Date(now.getTime() + DAY).toISOString())).toBe(false);
  });

  it('الحكم يتبع `now` المُمرَّر لا ساعة الجهاز', () => {
    const lastRun = new Date('2026-01-01T00:00:00.000Z').toISOString();
    const cfg = { enabled: true, intervalDays: 1 };
    // في اللحظة نفسها: لم يمضِ شيء ⇒ غير مستحقّ
    expect(isAutoExportDue(cfg, lastRun, new Date('2026-01-01T00:00:00.000Z'))).toBe(false);
    // بعد نصف يوم: غير مستحقّ
    expect(isAutoExportDue(cfg, lastRun, new Date('2026-01-01T12:00:00.000Z'))).toBe(false);
    // بعد يوم كامل: مستحقّ
    expect(isAutoExportDue(cfg, lastRun, new Date('2026-01-02T00:00:00.000Z'))).toBe(true);
  });
});

describe('buildArchiveFileName', () => {
  it('اسم ملف مؤرَّخ بصيغة audit-archive-YYYY-MM-DD-HHmm.json', () => {
    expect(buildArchiveFileName(new Date(2026, 0, 5, 7, 9))).toBe('audit-archive-2026-01-05-0709.json');
  });

  it('يُصفّر الشهر واليوم والدقيقة بخانتين', () => {
    expect(buildArchiveFileName(new Date(2026, 11, 31, 23, 59))).toBe('audit-archive-2026-12-31-2359.json');
    expect(buildArchiveFileName(new Date(2026, 8, 1, 0, 0))).toBe('audit-archive-2026-09-01-0000.json');
  });

  it('ملفّان في الدقيقتين نفسهما يتشاركان الاسم (التمييز بالمعرّف لا بالاسم)', () => {
    const a = buildArchiveFileName(new Date(2026, 0, 1, 10, 0, 10));
    const b = buildArchiveFileName(new Date(2026, 0, 1, 10, 0, 40));
    expect(a).toBe(b);
    expect(a).toMatch(/^audit-archive-\d{4}-\d{2}-\d{2}-\d{4}\.json$/);
  });
});

describe('pruneSnapshots', () => {
  const snap = (id: string, at: string): ArchiveSnapshot => ({
    id,
    at,
    fileName: `${id}.json`,
    count: 1,
    json: '{}',
  });

  it('يُبقي الأحدث فقط بترتيب تنازلي', () => {
    const list = [
      snap('a', '2026-01-01T00:00:00.000Z'),
      snap('c', '2026-03-01T00:00:00.000Z'),
      snap('b', '2026-02-01T00:00:00.000Z'),
    ];
    expect(pruneSnapshots(list, 2).map((s) => s.id)).toEqual(['c', 'b']);
    expect(pruneSnapshots(list, 1).map((s) => s.id)).toEqual(['c']);
  });

  it('لا يحذف شيئاً إذا كان العدد أقل من السقف', () => {
    const list = [snap('a', '2026-01-01T00:00:00.000Z')];
    expect(pruneSnapshots(list, 12)).toHaveLength(1);
  });

  it('سقف صفري أو سالب أو كسري يُطهَّر إلى 1', () => {
    const list = [snap('a', '2026-01-01T00:00:00.000Z'), snap('b', '2026-02-01T00:00:00.000Z')];
    expect(pruneSnapshots(list, 0).map((s) => s.id)).toEqual(['b']);
    expect(pruneSnapshots(list, -3).map((s) => s.id)).toEqual(['b']);
    expect(pruneSnapshots(list, 1.9).map((s) => s.id)).toEqual(['b']);
  });

  it('لا يعدّل المصفوفة الأصلية', () => {
    const list = [snap('a', '2026-01-01T00:00:00.000Z'), snap('b', '2026-02-01T00:00:00.000Z')];
    const order = list.map((s) => s.id);
    pruneSnapshots(list, 1);
    expect(list.map((s) => s.id)).toEqual(order);
    expect(list).toHaveLength(2);
  });

  it('قائمة فارغة ⇒ فارغة', () => {
    expect(pruneSnapshots([], 5)).toEqual([]);
  });

  it('يعمل على أي عنصر يحمل `at`', () => {
    const rows = [
      { at: '2026-01-01T00:00:00.000Z', n: 1 },
      { at: '2026-05-01T00:00:00.000Z', n: 2 },
    ];
    expect(pruneSnapshots(rows, 1)).toEqual([{ at: '2026-05-01T00:00:00.000Z', n: 2 }]);
  });
});
