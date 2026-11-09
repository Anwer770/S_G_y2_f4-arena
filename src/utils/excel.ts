/**
 * أدوات Excel — واجهة عامة (R30).
 *
 * فُكِّك الملف (1106 سطراً) إلى ثلاث وحدات:
 *   - `excel/excelCore`      العناوين الأساسية · التنزيل · البصمة
 *   - `excel/excelExporters` تصدير المخزون والمالية والمهام والعملاء والنسخ والقوالب
 *   - `excel/excelImporters` استيراد الملفات مع تقرير أمانة الاستيراد
 *
 * كل المستوردين القدامى (`from '../utils/excel'`) يعملون بلا تغيير.
 */
export * from './excel/excelCore';
export * from './excel/excelExporters';
export * from './excel/excelImporters';
