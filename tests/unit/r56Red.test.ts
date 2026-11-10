// @vitest-environment jsdom
/**
 * R56 — إثباتات حمراء قبل الإصلاح.
 * لا تُغطّي هذه الحالات مساراً «مثالياً»: هي تستعمل قالب الاستيراد الفعلي والتنبيه
 * التقويمي كي لا يتحول رقم/تاريخ مدخل خطأ إلى قرار صامت.
 */
import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { getCalendarDayDiff } from '../../src/utils/dueAlerts';
import { parseDailyTasksExcelFile, parseStockExcelFile } from '../../src/utils/universalImporters';

function excelFile(rows: Record<string, unknown>[]): File {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'استيراد');
  return new File([XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })], 'stock-template.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

describe('R56 — عيوب مثبتة قبل الإصلاح', () => {
  it('تاريخ تقويمي غير موجود لا يُطبّع إلى يوم آخر ثم يتحول إلى تنبيه', () => {
    // 2026-02-31 لا وجود له؛ Date() يحوّله صامتاً إلى 2026-03-03 إن لم نتحقق منه.
    expect(getCalendarDayDiff('2026-02-31', new Date(2026, 2, 3))).toBe(999);
  });

  it('صف القالب الرسمي للمخزون يحفظ رقم السند بدلاً من توليد معرف فرعي جديد', async () => {
    const { movements } = await parseStockExcelFile(
      excelFile([
        {
          'نوع الحركة': 'توريد (IN)',
          التاريخ: '2026-11-07',
          'اسم الصنف': 'سيروم',
          الكمية: 12,
          'رقم السند': 'IN-2026-045',
        },
      ])
    );

    expect(movements).toHaveLength(1);
    expect(movements[0].subId).toBe('IN-2026-045');
  });

  it('قالب المهام يترجم الأولوية والحالة العربيتين إلى عقد المهمة، لا إلى B وقيد التنفيذ', async () => {
    const { tasks } = await parseDailyTasksExcelFile(
      excelFile([
        {
          'عنوان المهمة': 'مراجعة السندات',
          الأولوية: 'عالية جداً',
          الحالة: 'جديدة',
          'تاريخ الاستحقاق': '2026-11-08',
        },
      ])
    );

    expect(tasks[0]).toMatchObject({ pri: 'A', status: 'مخطط' });
  });
});
