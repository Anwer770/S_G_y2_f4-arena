/**
 * وحدة تخزين «إدارة العمل» — واجهة عامة (R30).
 *
 * فُكِّكت من 1925 سطراً إلى ست وحدات موضوعية للحفاظ على السقف والقراءة:
 *   - `workos/workosKeys`    مفاتيح التخزين (مصدر واحد)
 *   - `workos/workosSeeds`   البيانات البذرية
 *   - `workos/workosLoaders` قراءة/كتابة كل المجالات + الجلسة + العدّاد
 *   - `workos/workosExporters` تصدير/استيراد JSON/CSV/Excel والقوالب
 *   - `workos/workosAutomation` الأوامر الثلاثية ومحرّك الأتمتة
 *
 * كل المستوردين القدامى (`from '../utils/workosStorage'`) يعملون بلا تغيير.
 */
export * from './workos/workosKeys';
export * from './workos/workosSeeds';
export * from './workos/workosLoaders';
export * from './workos/workosExporters';
export * from './workos/workosAutomation';
